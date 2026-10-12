import type pg from "pg";
import { setupQueue } from "./queue.js";
import { expectedMigrations } from "./versions.js";

export type RuntimeRole = "nilumi_api" | "nilumi_auth" | "nilumi_worker" | "nilumi_queue";
export async function databaseReady(
  pool: pg.Pool,
  role: RuntimeRole,
  signal?: AbortSignal,
): Promise<boolean> {
  if (signal?.aborted) return false;
  const query = (sql: string, values?: unknown[]) => {
    if (signal?.aborted) throw new Error("readiness_aborted");
    return pool.query(sql, values);
  };
  try {
    const identity =
      await query(`SELECT current_user AS name, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls,
      has_database_privilege(current_database(), 'CREATE') AS db_create,
      EXISTS (SELECT 1 FROM pg_roles r WHERE (r.rolname IN ('nilumi_owner','nilumi_migrator','nilumi_acl_executor','nilumi_lifecycle_executor') OR r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolbypassrls)
        AND pg_has_role(current_user, r.oid, 'MEMBER')) AS privileged,
      EXISTS (SELECT 1 FROM pg_namespace n WHERE n.nspname IN ('app','auth','private','pgboss','public')
        AND has_schema_privilege(current_user,n.oid,'CREATE')) AS schema_create,
      EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname IN ('app','auth','private','pgboss') AND c.relowner=(SELECT oid FROM pg_roles WHERE rolname=current_user)) AS owns_objects
      FROM pg_roles WHERE rolname=current_user`);
    const r = identity.rows[0];
    if (
      !r ||
      r.name !== role ||
      [
        r.rolsuper,
        r.rolcreaterole,
        r.rolcreatedb,
        r.rolbypassrls,
        r.db_create,
        r.privileged,
        r.schema_create,
        r.owns_objects,
      ].some(Boolean)
    )
      return false;
    const versions = await query("SELECT id, checksum FROM private.setup_migrations ORDER BY id");
    if (JSON.stringify(versions.rows) !== JSON.stringify(expectedMigrations)) return false;
    const grants = await query(`SELECT
      has_table_privilege('private.setup_migrations','SELECT') AS marker_read,
      has_table_privilege('private.setup_migrations','INSERT,UPDATE,DELETE,TRUNCATE') AS marker_write,
      has_schema_privilege('app','USAGE') AS app_use,
      has_schema_privilege('auth','USAGE') AS auth_use,
      has_schema_privilege('pgboss','USAGE') AS queue_use`);
    const g = grants.rows[0];
    if (
      !g.marker_read ||
      g.marker_write ||
      g.app_use !== ["nilumi_api", "nilumi_worker"].includes(role) ||
      g.auth_use !== (role === "nilumi_auth") ||
      g.queue_use !== ["nilumi_api", "nilumi_queue"].includes(role)
    )
      return false;
    if (role === "nilumi_api" || role === "nilumi_queue") {
      const q = await query(`SELECT name, partition FROM pgboss.queue WHERE name=$1`, [setupQueue]);
      if (q.rows.length !== 1 || q.rows[0].partition) return false;
      const version = await query("SELECT version FROM pgboss.version");
      // Schema 45 is qualified against pg-boss 12.37.1; update only with release evidence.
      if (version.rows.length !== 1 || version.rows[0].version !== 45) return false;
      const permissions = await query(`SELECT has_table_privilege('pgboss.job','INSERT') AS enqueue,
        has_table_privilege('pgboss.job','UPDATE') AS claim,
        has_table_privilege('pgboss.job','TRUNCATE') AS truncate,
        has_table_privilege('pgboss.queue','INSERT') AS administer,
        has_function_privilege('pgboss.create_queue(text,jsonb)','EXECUTE') AS create_queue,
        has_table_privilege('pgboss.job_common','INSERT') AS enqueue_common,
        has_column_privilege('pgboss.queue','policy','UPDATE') AS change_policy,
        has_column_privilege('pgboss.version','version','UPDATE') AS change_version,
        has_column_privilege('pgboss.queue','maintain_on','UPDATE') AS supervise`);
      const p = permissions.rows[0];
      if (
        !p.enqueue_common ||
        p.change_policy ||
        p.change_version ||
        p.supervise !== (role === "nilumi_queue")
      )
        return false;
      if (
        !p.enqueue ||
        p.claim !== (role === "nilumi_queue") ||
        p.truncate ||
        p.administer ||
        p.create_queue
      )
        return false;
    }
    return !signal?.aborted;
  } catch {
    return false;
  }
}
