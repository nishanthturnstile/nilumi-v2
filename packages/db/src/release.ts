// Release-only entry. Never imported by runtime composition roots.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { PgBoss } from "pg-boss";
import { setupQueue } from "./queue.js";
import { expectedMigrations } from "./versions.js";

export const runtimeRoles = ["nilumi_api", "nilumi_auth", "nilumi_worker", "nilumi_queue"] as const;
const executors = ["nilumi_owner", "nilumi_acl_executor", "nilumi_lifecycle_executor"];
export async function provision(connectionString: string, passwords: Record<string, string>) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(50501)");
    for (const role of [...executors, "nilumi_migrator", ...runtimeRoles]) {
      if (!(await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount)
        await client.query(
          `CREATE ROLE ${role} NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`,
        );
      // Do not repair unexpected elevated roles silently.
      const row = (
        await client.query(
          "SELECT rolsuper,rolcreatedb,rolcreaterole,rolbypassrls FROM pg_roles WHERE rolname=$1",
          [role],
        )
      ).rows[0];
      if (Object.values(row).some(Boolean)) throw new Error("unexpected_role_privileges");
      if (
        executors.includes(role) &&
        (await client.query("SELECT rolcanlogin FROM pg_roles WHERE rolname=$1", [role])).rows[0]
          .rolcanlogin
      )
        throw new Error("object_owner_must_not_login");
      if (!executors.includes(role)) {
        if (!passwords[role] || /replace|placeholder/i.test(passwords[role]))
          throw new Error("provisioning_password_required");
        const statement = await client.query(
          "SELECT format('ALTER ROLE %I LOGIN PASSWORD %L', $1::text, $2::text) AS sql",
          [role, passwords[role]],
        );
        await client.query(statement.rows[0].sql);
      }
    }
    await client.query("GRANT nilumi_owner TO nilumi_migrator");
    const db = (await client.query("SELECT current_database() AS name")).rows[0].name;
    const revoke = await client.query(
      "SELECT format('REVOKE ALL ON DATABASE %I FROM PUBLIC', $1::text) AS sql",
      [db],
    );
    await client.query(revoke.rows[0].sql);
    const grant = await client.query(
      "SELECT format('GRANT CONNECT ON DATABASE %I TO nilumi_migrator, nilumi_api, nilumi_auth, nilumi_worker, nilumi_queue', $1::text) AS sql",
      [db],
    );
    await client.query(grant.rows[0].sql);
    await client.query("REVOKE ALL ON SCHEMA public FROM PUBLIC");
    for (const schema of ["auth", "app", "pgboss", "private"]) {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema} AUTHORIZATION nilumi_owner`);
      await client.query(`REVOKE ALL ON SCHEMA ${schema} FROM PUBLIC`);
    }
    await client.query("SET LOCAL ROLE nilumi_owner");
    await client.query("ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC");
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

export async function migrate(connectionString: string) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  const boss = new PgBoss({
    db: { executeSql: (text: string, values?: unknown[]) => client.query(text, values) },
    schema: "pgboss",
    createSchema: false,
    supervise: false,
    schedule: false,
    registerInstance: false,
    reindex: false,
  });
  boss.on("error", () => {});
  try {
    if ((await client.query("SELECT current_user AS role")).rows[0].role !== "nilumi_migrator")
      throw new Error("migrator_role_required");
    await client.query("SET ROLE nilumi_owner");
    await client.query("SELECT pg_advisory_lock(50502)");
    const sql = await readFile(
      new URL("../migrations/0001-foundation.sql", import.meta.url),
      "utf8",
    );
    const checksum = createHash("sha256").update(sql).digest("hex");
    if (checksum !== expectedMigrations[0]?.checksum)
      throw new Error("migration_checksum_mismatch");
    const exists = (await client.query("SELECT to_regclass('private.setup_migrations') AS marker"))
      .rows[0].marker;
    if (exists) {
      const rows = (
        await client.query("SELECT id,checksum FROM private.setup_migrations ORDER BY id")
      ).rows;
      if (JSON.stringify(rows) !== JSON.stringify(expectedMigrations))
        throw new Error("migration_history_mismatch");
      // Verify pg-boss compatibility without runtime repair.
      const verify = new PgBoss({
        db: { executeSql: (text: string, values?: unknown[]) => client.query(text, values) },
        migrate: false,
        supervise: false,
        schedule: false,
        registerInstance: false,
      });
      verify.on("error", () => {});
      await verify.start();
      await verify.stop();
      return;
    }
    // Library schema installation is release-only; its own transaction is retained.
    await boss.start();
    await boss.createQueue(setupQueue, { partition: false, retryLimit: 2, expireInSeconds: 30 });
    await boss.stop();
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO private.setup_migrations(id,checksum) VALUES ($1,$2)", [
      expectedMigrations[0]?.id,
      checksum,
    ]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await boss.stop().catch(() => {});
    await client.end();
  }
}
