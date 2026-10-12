import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  createPool,
  createQueueRuntime,
  databaseReady,
  handleSyntheticJob,
  setupQueue,
} from "../../packages/db/dist/index.js";
import { migrate, provision, runtimeRoles } from "../../packages/db/dist/release.js";
import { createTestTransports } from "../../packages/server/dist/index.js";
import { startSandbox } from "./infra-sandbox.mjs";
import { root } from "./process.mjs";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function eventually(action, message, timeout = 20000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (await action()) return;
    await sleep(250);
  }
  throw new Error(message);
}
export async function integrationSuite({ adminUrl, storageUrl, mailUrl, smtpHost, smtpPort }) {
  // A dedicated randomly named database; provisioning credentials never enter a process runtime.
  const admin = createPool(adminUrl);
  const database = `setup05_${randomUUID().replaceAll("-", "")}`;
  const url = (role, password) => {
    const value = new URL(adminUrl);
    value.pathname = `/${database}`;
    value.username = role;
    value.password = password;
    return value.href;
  };
  const passwords = Object.fromEntries(
    [...runtimeRoles, "nilumi_migrator"].map((role) => [role, randomUUID()]),
  );
  const pools = {};
  let producer;
  let consumer;
  let worker;
  const result = { platform: process.platform, checks: [] };
  const pass = (name) => {
    result.checks.push(name);
    console.log(`PASS: ${name}`);
  };
  await admin.query(`CREATE DATABASE ${database}`);
  try {
    const bucket = `setup05-${randomUUID()}`;
    const localRequest = async (path, options) => {
      const response = await fetch(`${storageUrl}/${path}`, {
        ...options,
        signal: AbortSignal.timeout(10000),
        redirect: "error",
      });
      assert.ok(response.ok, "synthetic storage request");
      return response;
    };
    await localRequest(bucket, { method: "PUT" });
    try {
      await localRequest(`${bucket}/fixture`, {
        method: "PUT",
        body: "content-free synthetic setup fixture",
      });
      assert.equal(
        await (await localRequest(`${bucket}/fixture`)).text(),
        "content-free synthetic setup fixture",
      );
      await localRequest(`${bucket}/fixture`, { method: "DELETE" });
    } finally {
      await localRequest(bucket, { method: "DELETE" });
    }
    pass("Seaweed S3 synthetic put/read/delete and service reachability");
    const provisionUrl = new URL(adminUrl);
    provisionUrl.pathname = `/${database}`;
    await provision(provisionUrl.href, passwords);
    await provision(provisionUrl.href, passwords);
    await migrate(url("nilumi_migrator", passwords.nilumi_migrator));
    await migrate(url("nilumi_migrator", passwords.nilumi_migrator));
    pass("repeatable provision and checked migration");
    for (const role of runtimeRoles) {
      pools[role] = createPool(url(role, passwords[role]));
      assert.equal(await databaseReady(pools[role], role), true, `${role} readiness`);
      for (const privileged of [
        "nilumi_owner",
        "nilumi_migrator",
        "nilumi_acl_executor",
        "nilumi_lifecycle_executor",
      ])
        await assert.rejects(pools[role].query(`SET ROLE ${privileged}`), { code: "42501" });
      for (const statement of [
        "CREATE TABLE app.forbidden(id int)",
        "ALTER TABLE private.setup_migrations ADD COLUMN forbidden int",
        "TRUNCATE private.setup_migrations",
      ])
        await assert.rejects(pools[role].query(statement), { code: "42501" });
    }
    pass("runtime identities, grants and privileged role rejection");
    const release = createPool(url("nilumi_migrator", passwords.nilumi_migrator));
    try {
      await release.query("SET ROLE nilumi_owner");
      await release.query(`CREATE TABLE app.setup_protected(id int PRIMARY KEY, fixture text NOT NULL);
        INSERT INTO app.setup_protected VALUES(1,'synthetic');
        ALTER TABLE app.setup_protected ENABLE ROW LEVEL SECURITY;
        ALTER TABLE app.setup_protected FORCE ROW LEVEL SECURITY;
        CREATE POLICY setup_context ON app.setup_protected USING (current_setting('nilumi.fixture',true)='synthetic') WITH CHECK (current_setting('nilumi.fixture',true)='synthetic');
        GRANT SELECT,INSERT,UPDATE,DELETE ON app.setup_protected TO nilumi_api,nilumi_worker`);
      for (const role of runtimeRoles) {
        for (const statement of [
          "ALTER TABLE app.setup_protected ADD COLUMN forbidden int",
          "TRUNCATE app.setup_protected",
          "ALTER TABLE app.setup_protected OWNER TO nilumi_api",
        ])
          await assert.rejects(pools[role].query(statement), { code: "42501" });
      }
      for (const role of ["nilumi_api", "nilumi_worker"]) {
        const client = await pools[role].connect();
        try {
          assert.equal((await client.query("SELECT * FROM app.setup_protected")).rowCount, 0);
          await assert.rejects(
            client.query("INSERT INTO app.setup_protected VALUES(2,'synthetic')"),
            { code: "42501" },
          );
          for (const end of ["ROLLBACK", "COMMIT"]) {
            await client.query("BEGIN");
            await client.query("SELECT set_config('nilumi.fixture',$1,true)", ["synthetic"]);
            assert.equal((await client.query("SELECT * FROM app.setup_protected")).rowCount, 1);
            await client.query(end);
            assert.equal((await client.query("SELECT * FROM app.setup_protected")).rowCount, 0);
            assert.ok(
              !(await client.query("SELECT current_setting('nilumi.fixture',true) AS value"))
                .rows[0].value,
            );
          }
        } finally {
          client.release();
        }
      }
      pass("test-only forced RLS denies missing context; commit/rollback clear pooled settings");
      await release.query("DELETE FROM private.setup_migrations");
      for (const role of runtimeRoles) assert.equal(await databaseReady(pools[role], role), false);
      await migrate(url("nilumi_migrator", passwords.nilumi_migrator)).then(
        () => assert.fail("missing history accepted"),
        () => {},
      );
      const { expectedMigrations } = await import("../../packages/db/dist/versions.js");
      await release.query("INSERT INTO private.setup_migrations VALUES($1,$2)", [
        expectedMigrations[0].id,
        expectedMigrations[0].checksum,
      ]);
      await release.query("REVOKE INSERT ON pgboss.job FROM nilumi_api");
      assert.equal(await databaseReady(pools.nilumi_api, "nilumi_api"), false);
      await release.query("GRANT INSERT ON pgboss.job TO nilumi_api");
      await release.query("REVOKE UPDATE (maintain_on) ON pgboss.queue FROM nilumi_queue");
      assert.equal(await databaseReady(pools.nilumi_queue, "nilumi_queue"), false);
      await release.query("GRANT UPDATE (maintain_on) ON pgboss.queue TO nilumi_queue");
      await release.query("UPDATE pgboss.version SET version=44");
      assert.equal(await databaseReady(pools.nilumi_api, "nilumi_api"), false);
      assert.equal(await databaseReady(pools.nilumi_queue, "nilumi_queue"), false);
      const pendingQueue = createQueueRuntime(url("nilumi_queue", passwords.nilumi_queue), true);
      pendingQueue.on("error", () => {});
      try {
        await assert.rejects(pendingQueue.start());
      } finally {
        await pendingQueue.stop();
      }
      assert.equal((await release.query("SELECT version FROM pgboss.version")).rows[0].version, 44);
      await release.query("UPDATE pgboss.version SET version=45");
      pass("pending migration and missing grant fail readiness without runtime repair");
    } finally {
      await release.end();
    }
    producer = createQueueRuntime(url("nilumi_api", passwords.nilumi_api), false);
    let queueError = false;
    producer.on("error", () => {
      queueError = true;
    });
    await producer.start();
    await assert.rejects(producer.createQueue("forbidden"), { code: "42501" });
    await assert.rejects(pools.nilumi_api.query("UPDATE pgboss.job SET state='completed'"), {
      code: "42501",
    });
    consumer = createQueueRuntime(url("nilumi_queue", passwords.nilumi_queue), true);
    consumer.on("error", () => {
      queueError = true;
    });
    await consumer.start();
    await assert.rejects(consumer.updateQueue(setupQueue, { retryLimit: 99 }), { code: "42501" });
    await consumer.supervise();
    await consumer.stop();
    const fixture = { kind: "synthetic-setup", fixtureId: randomUUID() };
    const jobId = await producer.send(setupQueue, fixture);
    assert.ok(jobId);
    consumer = createQueueRuntime(url("nilumi_queue", passwords.nilumi_queue), true);
    consumer.on("error", () => {
      queueError = true;
    });
    await consumer.start();
    await consumer.work(setupQueue, { pollingIntervalSeconds: 1 }, async (jobs) => {
      for (const job of jobs) {
        handleSyntheticJob(job.data);
        handleSyntheticJob(job.data);
      }
    });
    await eventually(
      async () =>
        (await pools.nilumi_queue.query("SELECT state FROM pgboss.job WHERE id=$1", [jobId]))
          .rows[0]?.state === "completed",
      "job_recovery_timeout",
    );
    assert.equal(queueError, false);
    pass("restricted enqueue, supervision and eligible synthetic job survive consumer restart");
    await consumer.stop();
    const transports = createTestTransports({
      NILUMI_ENV: "test",
      NILUMI_TEST_TRANSPORTS: "synthetic",
      NILUMI_MAIL_TRANSPORT: "mailpit",
      NILUMI_SMTP_HOST: smtpHost,
      NILUMI_SMTP_PORT: smtpPort,
    });
    try {
      await transports.email("setup-synthetic-v1");
      await transports.sms("setup-synthetic-v1");
      await transports.ai("setup-synthetic-v1");
      await transports.speech("setup-synthetic-v1");
      assert.ok((await (await fetch(`${mailUrl}/api/v1/messages`)).json()).total >= 1);
    } finally {
      transports.close();
    }
    pass("local SMTP captured by Mailpit; synthetic SMS/AI/speech have no live effects");
    const runtimeEnv = {
      NILUMI_ENV: "test",
      NILUMI_STORAGE_HEALTH_URL: storageUrl,
      NILUMI_MAIL_HEALTH_URL: `${mailUrl}/readyz`,
      NILUMI_TEST_TRANSPORTS: "synthetic",
      NILUMI_MAIL_TRANSPORT: "disabled",
    };
    const children = [];
    const launch = (app, values) => {
      const child = spawn(process.execPath, [`apps/${app}/dist/main.js`], {
        cwd: root,
        env: { ...runtimeEnv, ...values },
        windowsHide: true,
      });
      const entry = { child, output: "", closed: once(child, "close") };
      child.stdout.on("data", (data) => {
        entry.output += data;
      });
      child.stderr.on("data", (data) => {
        entry.output += data;
      });
      children.push(entry);
      return entry;
    };
    try {
      const { createServer } = await import("node:net");
      const server = createServer();
      await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
      const port = server.address().port;
      await new Promise((resolve) => server.close(resolve));
      launch("api", {
        PORT: String(port),
        NILUMI_API_DATABASE_URL: url("nilumi_api", passwords.nilumi_api),
        NILUMI_AUTH_DATABASE_URL: url("nilumi_auth", passwords.nilumi_auth),
      });
      worker = launch("worker", {
        NILUMI_WORKER_DATABASE_URL: url("nilumi_worker", passwords.nilumi_worker),
        NILUMI_QUEUE_DATABASE_URL: url("nilumi_queue", passwords.nilumi_queue),
      });
      await eventually(async () => {
        try {
          return (await fetch(`http://127.0.0.1:${port}/api/v1/ready`)).status === 200;
        } catch {
          return false;
        }
      }, "api_ready_timeout");
      const duplicateApi = launch("api", {
        PORT: String(port),
        NILUMI_API_DATABASE_URL: url("nilumi_api", passwords.nilumi_api),
        NILUMI_AUTH_DATABASE_URL: url("nilumi_auth", passwords.nilumi_auth),
      });
      const startupDeadline = setTimeout(() => duplicateApi.child.kill(), 6000);
      try {
        const [exitCode] = await duplicateApi.closed;
        assert.equal(exitCode, 1, "listener conflict must close dependency pools and exit");
      } finally {
        clearTimeout(startupDeadline);
      }
      pass("API listener failure closes prepared dependencies and exits safely");
      await eventually(async () => worker.output.includes('"ready":true'), "worker_ready_timeout");
      worker.child.kill("SIGTERM");
      await worker.closed;
      const restartJob = await producer.send(setupQueue, {
        kind: "synthetic-setup",
        fixtureId: randomUUID(),
      });
      worker = launch("worker", {
        NILUMI_WORKER_DATABASE_URL: url("nilumi_worker", passwords.nilumi_worker),
        NILUMI_QUEUE_DATABASE_URL: url("nilumi_queue", passwords.nilumi_queue),
      });
      await eventually(
        async () => worker.output.includes('"ready":true'),
        "worker_restart_ready_timeout",
      );
      await eventually(
        async () =>
          (await pools.nilumi_queue.query("SELECT state FROM pgboss.job WHERE id=$1", [restartJob]))
            .rows[0]?.state === "completed",
        "worker_restart_job_timeout",
      );
      pass("independent worker process restart recovers eligible synthetic job");
      const pending = createPool(url("nilumi_migrator", passwords.nilumi_migrator));
      try {
        await pending.query("SET ROLE nilumi_owner");
        await pending.query("UPDATE private.setup_migrations SET checksum='pending'");
        assert.equal((await fetch(`http://127.0.0.1:${port}/api/v1/ready`)).status, 503);
        await eventually(
          async () => worker.output.includes('"ready":false'),
          "worker_pending_migration_heartbeat_timeout",
        );
      } finally {
        await pending.end();
      }
      for (const entry of children)
        for (const password of Object.values(passwords))
          assert.ok(!entry.output.includes(password));
      pass(
        "host API ready endpoint and worker heartbeat reach dependencies; pending migration returns 503",
      );
    } finally {
      for (const entry of children) entry.child.kill("SIGTERM");
      await Promise.all(children.map((entry) => entry.closed));
    }
    return result;
  } finally {
    await consumer?.stop().catch(() => {});
    await producer?.stop().catch(() => {});
    await Promise.all(Object.values(pools).map((pool) => pool.end()));
    await admin.query(`DROP DATABASE ${database} WITH (FORCE)`);
    await admin.end();
  }
}
export async function integration() {
  const sandbox = await startSandbox();
  try {
    const result = await integrationSuite(sandbox.host);
    const evidence = join(
      root,
      process.env.NILUMI_EVIDENCE_DIRECTORY ?? "docs/development/evidence/setup-06-2026-10-12",
    );
    mkdirSync(evidence, { recursive: true });
    writeFileSync(
      join(evidence, `integration-${process.platform}.json`),
      `${JSON.stringify(result, null, 2)}\n`,
    );
  } finally {
    await sandbox.stop();
  }
}
