import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";
import { buildApp } from "../../apps/api/dist/app.js";
import { generateOpenApi } from "../../apps/api/dist/openapi.js";
import { createWorker } from "../../apps/worker/dist/worker.js";

test("process roots reject missing config without printing values", async () => {
  for (const app of ["api", "worker"]) {
    const child = spawn(process.execPath, [`apps/${app}/dist/main.js`], {
      env: { NILUMI_ENV: "PRIVATE-SENTINEL" },
      windowsHide: true,
    });
    let output = "";
    child.stdout.on("data", (data) => {
      output += data;
    });
    child.stderr.on("data", (data) => {
      output += data;
    });
    const [code] = await once(child, "close");
    assert.equal(code, 1);
    assert.match(output, /configuration_or_startup/);
    assert.ok(!output.includes("PRIVATE-SENTINEL"));
  }
});

test("worker root is an independent process, starts unready and reports a heartbeat", async () => {
  const child = spawn(process.execPath, ["apps/worker/dist/main.js"], {
    env: {
      NILUMI_ENV: "test",
      NILUMI_WORKER_DATABASE_URL:
        "postgresql://nilumi_worker:synthetic-password@127.0.0.1:5432/synthetic",
      NILUMI_QUEUE_DATABASE_URL:
        "postgresql://nilumi_queue:synthetic-password@127.0.0.1:5432/synthetic",
    },
    windowsHide: true,
  });
  let output = "";
  const closed = once(child, "close");
  const deadline = setTimeout(() => child.kill(), 5000);
  try {
    await new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", () => reject(new Error("worker_exited_before_heartbeat")));
      child.stdout.on("data", (data) => {
        output += data;
        if (output.includes("worker_heartbeat")) resolve();
      });
    });
    assert.ok(output.includes("worker_started"));
    assert.ok(output.includes('"ready":false'));
    assert.ok(!output.includes("synthetic-password"));
    child.kill("SIGTERM");
    await closed;
    if (process.platform !== "win32") assert.ok(output.includes("worker_stopped"));
  } finally {
    clearTimeout(deadline);
    child.kill();
  }
});

import { createApiClient } from "../../packages/api-client/dist/index.js";
import { healthSchema, problemSchema } from "../../packages/contracts/dist/index.js";

test("liveness survives unready dependencies; errors contain no inputs or caller request ID", async (t) => {
  const app = buildApp({ LOG_LEVEL: "silent" });
  t.after(() => app.close());
  const live = await app.inject("/api/v1/health");
  assert.deepEqual(healthSchema.parse(live.json()), { status: "ok" });
  assert.equal(live.headers["cache-control"], "no-store");
  const ready = await app.inject({
    url: "/api/v1/ready",
    headers: { "x-request-id": "SECRET-SENTINEL" },
  });
  assert.equal(ready.statusCode, 503);
  assert.equal(problemSchema.parse(ready.json()).code, "not_ready");
  assert.match(ready.headers["content-type"], /^application\/problem\+json/);
  for (const url of ["/api/v1/health?secret=SECRET-SENTINEL", "/SECRET-SENTINEL"]) {
    const response = await app.inject(url);
    assert.ok([400, 404].includes(response.statusCode));
    problemSchema.parse(response.json());
    assert.ok(!response.body.includes("SECRET-SENTINEL"));
  }
  assert.ok(!ready.body.includes("SECRET-SENTINEL"));
});

test("readiness reflects injected dependencies, fails closed and aborts bounded probes", async () => {
  for (const [probe, expectedStatus] of [
    [async () => true, 200],
    [
      async () => {
        throw new Error("PRIVATE-SENTINEL");
      },
      503,
    ],
    [() => new Promise(() => {}), 503],
  ]) {
    let signal;
    const app = buildApp(
      { LOG_LEVEL: "silent" },
      {
        readinessTimeoutMs: 5,
        isReady: (input) => {
          signal = input;
          return probe();
        },
      },
    );
    try {
      const response = await app.inject("/api/v1/ready");
      assert.equal(response.statusCode, expectedStatus);
      assert.ok(!response.body.includes("PRIVATE-SENTINEL"));
      assert.ok(signal.aborted);
    } finally {
      await app.close();
    }
  }
});

test("invalid handler output fails response validation with a safe Problem", async (t) => {
  const app = buildApp({ LOG_LEVEL: "silent" });
  app.get("/synthetic-invalid", { schema: { response: { 200: healthSchema } } }, async () => ({
    status: "PRIVATE-SENTINEL",
  }));
  t.after(() => app.close());
  const response = await app.inject("/synthetic-invalid");
  assert.equal(response.statusCode, 500);
  assert.equal(problemSchema.parse(response.json()).code, "internal_error");
  assert.ok(!response.body.includes("PRIVATE-SENTINEL"));
});

test("generated transport round-trips real loopback health and validates data", async (t) => {
  const app = buildApp({ LOG_LEVEL: "silent" });
  const baseUrl = await app.listen({ host: "127.0.0.1", port: 0 });
  t.after(() => app.close());
  assert.deepEqual(await createApiClient({ baseUrl, platform: "web" }).getHealth(), {
    status: "ok",
  });
  const credentials = [];
  for (const platform of ["native", "web"]) {
    const client = createApiClient({
      baseUrl,
      platform,
      fetch: async (request) => {
        credentials.push(request.credentials);
        return new Response(JSON.stringify({ status: "invalid" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });
    await assert.rejects(client.getHealth());
  }
  assert.deepEqual(credentials, ["omit", "same-origin"]);
});

test("schema generation is deterministic and independent of process config", async () => {
  const first = await generateOpenApi();
  assert.deepEqual(await generateOpenApi(), first);
  assert.deepEqual(Object.keys(first.paths), ["/api/v1/health", "/api/v1/ready"]);
});

test("worker heartbeat responds to readiness loss and shutdown is idempotent", async () => {
  let available = true;
  let prepared = 0;
  let disposed = 0;
  const beats = [];
  let nextBeat;
  const worker = createWorker(
    {
      prepare: async () => {
        prepared++;
      },
      isReady: async () => available,
      dispose: async () => {
        disposed++;
      },
      heartbeat: (state) => {
        beats.push(state.ready);
        nextBeat?.();
      },
    },
    { heartbeatMs: 5 },
  );
  try {
    await worker.start();
    assert.equal(worker.ready, true);
    available = false;
    await new Promise((resolve) => {
      nextBeat = resolve;
    });
    assert.equal(worker.ready, false);
    await Promise.all([worker.stop(), worker.stop()]);
    assert.equal(prepared, 1);
    assert.equal(disposed, 1);
    assert.deepEqual(beats, [true, false]);
    await assert.rejects(worker.start());
  } finally {
    await worker.stop();
  }
});

test("worker bounds startup and stuck shutdown and cannot become ready after stopping", async () => {
  let disposed = 0;
  const failing = createWorker(
    {
      prepare: () => new Promise(() => {}),
      isReady: async () => true,
      dispose: async () => {
        disposed++;
      },
      heartbeat: () => {},
    },
    { operationTimeoutMs: 5 },
  );
  await assert.rejects(failing.start(), /worker_startup_failed/);
  assert.equal(disposed, 1);
  const stuck = createWorker(
    {
      prepare: async () => {},
      isReady: async () => true,
      dispose: () => new Promise(() => {}),
      heartbeat: () => {},
    },
    { shutdownTimeoutMs: 5 },
  );
  await stuck.start();
  await assert.rejects(stuck.stop(), /worker_operation_timeout/);
  assert.equal(stuck.ready, false);
});
