import { PgBoss } from "pg-boss";
import { z } from "zod";

export const setupQueue = "nilumi_setup_synthetic";
export const syntheticJob = z.strictObject({
  kind: z.literal("synthetic-setup"),
  fixtureId: z.string().uuid(),
});
export function handleSyntheticJob(data: unknown) {
  // Validation is the entire effect. Repeating it cannot send, mutate or disclose content.
  if (!syntheticJob.safeParse(data).success) throw new Error("invalid_synthetic_job");
}
export function createQueueRuntime(connectionString: string, consumer: boolean) {
  return new PgBoss({
    connectionString,
    schema: "pgboss",
    migrate: false,
    createSchema: false,
    supervise: consumer,
    schedule: false,
    reindex: false,
    persistQueueStats: false,
    registerInstance: consumer,
    max: 2,
    connectionTimeoutMillis: 750,
    options:
      "-c statement_timeout=2000 -c lock_timeout=750 -c idle_in_transaction_session_timeout=2000",
  });
}
