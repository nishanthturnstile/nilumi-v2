import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { parseApiEnv } from "../../apps/api/dist/config/env.js";
import { parseClientEnv } from "../../apps/client/.cache/client-config/config/env.js";
import { parseWorkerEnv } from "../../apps/worker/dist/config/env.js";
import { parseMigratorEnv } from "../../packages/db/dist/config/migration-env.js";
import { loadEnvironment } from "../scripts/config-check.mjs";

const url = (role) => `postgresql://${role}:synthetic-password@127.0.0.1:5432/nilumi`;
const api = {
  NILUMI_ENV: "test",
  NILUMI_API_DATABASE_URL: url("nilumi_api"),
  NILUMI_AUTH_DATABASE_URL: url("nilumi_auth"),
};
test("API parser defaults safely and has no connection side effects", () => {
  const parsed = parseApiEnv({ ...api, DATABASE_URL: url("postgres"), UNRELATED: "ignored" });
  assert.equal(parsed.PORT, 3001);
  assert.equal(parsed.HOST, "127.0.0.1");
  assert.equal(parsed.LOG_LEVEL, "info");
  assert.ok(Object.isFrozen(parsed));
  assert.equal(parsed.DATABASE_URL, undefined);
});
test("missing and malformed inputs fail without rejected values in diagnostics", () => {
  const sentinel = "SECRET-SENTINEL-DO-NOT-PRINT";
  for (const overrides of [
    { NILUMI_ENV: undefined },
    { NILUMI_ENV: sentinel },
    { PORT: "" },
    { PORT: "65536" },
    { PORT: "abc" },
    { LOG_LEVEL: sentinel },
    { NILUMI_API_DATABASE_URL: "" },
    { NILUMI_API_DATABASE_URL: `postgresql://postgres:${sentinel}@127.0.0.1/nilumi` },
    { NILUMI_API_DATABASE_URL: "postgresql://nilumi_api:replace-me@127.0.0.1/nilumi" },
    { NILUMI_API_DATABASE_URL: "https://nilumi_api:password@host/nilumi" },
  ]) {
    assert.throws(
      () => parseApiEnv({ ...api, ...overrides }),
      (error) => {
        assert.ok(!error.message.includes(sentinel));
        assert.ok(!JSON.stringify(error).includes(sentinel));
        assert.ok(!error.message.includes("postgresql://"));
        return error.name === "ConfigurationError";
      },
    );
  }
  assert.throws(() => parseApiEnv({ NILUMI_ENV: "test", DATABASE_URL: url("postgres") }));
});
test("worker and migration roles cannot be substituted", () => {
  const worker = {
    NILUMI_ENV: "test",
    NILUMI_WORKER_DATABASE_URL: url("nilumi_worker"),
    NILUMI_QUEUE_DATABASE_URL: url("nilumi_queue"),
  };
  assert.equal(parseWorkerEnv(worker).LOG_LEVEL, "info");
  assert.throws(() =>
    parseWorkerEnv({ ...worker, NILUMI_QUEUE_DATABASE_URL: url("nilumi_worker") }),
  );
  assert.equal(
    parseMigratorEnv({ NILUMI_ENV: "test", NILUMI_MIGRATOR_DATABASE_URL: url("nilumi_migrator") })
      .NILUMI_ENV,
    "test",
  );
  assert.throws(() =>
    parseMigratorEnv({ NILUMI_ENV: "test", NILUMI_MIGRATOR_DATABASE_URL: url("nilumi_api") }),
  );
});
test("public URLs and variable allowlist follow deployment mode", () => {
  const local = {
    EXPO_PUBLIC_API_BASE_URL: "http://127.0.0.1:3001",
    EXPO_PUBLIC_NILUMI_ENV: "development",
  };
  assert.ok(Object.isFrozen(parseClientEnv(local)));
  assert.throws(() => parseClientEnv({ ...local, EXPO_PUBLIC_NILUMI_ENV: "pilot" }));
  assert.throws(() => parseClientEnv({ ...local, EXPO_PUBLIC_API_BASE_URL: "file:///secret" }));
  for (const value of ["PRIVATE-URL-SENTINEL", "http://user:PRIVATE-URL-SENTINEL@127.0.0.1"]) {
    assert.throws(
      () => parseClientEnv({ ...local, EXPO_PUBLIC_API_BASE_URL: value }),
      (error) =>
        !error.message.includes("PRIVATE-URL-SENTINEL") &&
        !JSON.stringify(error).includes("PRIVATE-URL-SENTINEL"),
    );
  }
  assert.throws(
    () => parseClientEnv({ ...local, EXPO_PUBLIC_SECRET: "PRIVATE-SENTINEL" }),
    (error) => !error.message.includes("PRIVATE-SENTINEL"),
  );
  assert.equal(
    parseClientEnv({
      ...local,
      EXPO_PUBLIC_API_BASE_URL: "https://nilumi.example.invalid",
      EXPO_PUBLIC_NILUMI_ENV: "production",
    }).EXPO_PUBLIC_NILUMI_ENV,
    "production",
  );
});
test("optional and explicit files, inherited precedence and unrelated variables", () => {
  const directory = mkdtempSync(join(tmpdir(), "nilumi env fixture "));
  try {
    mkdirSync(join(directory, "nested"));
    const path = join(directory, "nested/config.env");
    assert.deepEqual(loadEnvironment(path, { inherited: {} }), {});
    assert.throws(() => loadEnvironment(path, { explicit: true, inherited: {} }), /does not exist/);
    writeFileSync(path, "NILUMI_ENV=development\nPORT=3001\n");
    assert.deepEqual(loadEnvironment(path, { explicit: true, inherited: { PORT: "4001" } }), {
      NILUMI_ENV: "development",
      PORT: "4001",
    });
  } finally {
    rmSync(directory, { recursive: true });
  }
});
