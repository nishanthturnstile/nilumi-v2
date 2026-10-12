import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

export function createPool(connectionString: string) {
  const pool = new pg.Pool({
    connectionString,
    max: 2,
    connectionTimeoutMillis: 750,
    statement_timeout: 750,
    query_timeout: 900,
    idleTimeoutMillis: 10000,
  });
  // Idle connection failures must not escape as unredacted process exceptions.
  pool.on("error", () => {});
  return pool;
}
export function createDatabase(pool: pg.Pool) {
  return drizzle(pool);
}
