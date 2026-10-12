import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseEnv } from "node:util";
import { parseApiEnv } from "../../apps/api/dist/config/env.js";
import { parseWorkerEnv } from "../../apps/worker/dist/config/env.js";
import { createTestTransports } from "../../packages/server/dist/index.js";
import { guardDisposable } from "../scripts/infra.mjs";

const db = (role) => `postgresql://${role}:synthetic-password@127.0.0.1:1/synthetic`;
test("test transports fail startup in pilot/production; synthetic adapters accept only fixture IDs", async () => {
  const base = {
    NILUMI_ENV: "test",
    NILUMI_TEST_TRANSPORTS: "synthetic",
    NILUMI_MAIL_TRANSPORT: "disabled",
  };
  for (const mode of ["pilot", "production"]) {
    for (const selection of [
      { NILUMI_TEST_TRANSPORTS: "synthetic" },
      {
        NILUMI_TEST_TRANSPORTS: "disabled",
        NILUMI_MAIL_TRANSPORT: "mailpit",
        NILUMI_SMTP_HOST: "127.0.0.1",
        NILUMI_SMTP_PORT: "51025",
      },
    ]) {
      const input = { ...base, ...selection, NILUMI_ENV: mode };
      assert.throws(() =>
        parseApiEnv({
          ...input,
          NILUMI_API_DATABASE_URL: db("nilumi_api"),
          NILUMI_AUTH_DATABASE_URL: db("nilumi_auth"),
        }),
      );
      assert.throws(() =>
        parseWorkerEnv({
          ...input,
          NILUMI_WORKER_DATABASE_URL: db("nilumi_worker"),
          NILUMI_QUEUE_DATABASE_URL: db("nilumi_queue"),
        }),
      );
      assert.throws(() => createTestTransports(input), /test_transport_forbidden/);
    }
  }
  const transport = createTestTransports(base);
  for (const method of ["sms", "ai", "speech"]) {
    await assert.rejects(transport[method]("PRIVATE-SENTINEL"), /synthetic_fixture_required/);
    await transport[method]("setup-synthetic-v1");
  }
  await assert.rejects(transport.email("setup-synthetic-v1"));
});
test("blank private templates fail configuration; infrastructure reset guards fail closed", () => {
  for (const [file, parse] of [
    ["apps/api/.env.example", parseApiEnv],
    ["apps/worker/.env.example", parseWorkerEnv],
  ])
    assert.throws(() => parse(parseEnv(readFileSync(file, "utf8"))));
  const valid = {
    NILUMI_ENV: "development",
    NILUMI_DISPOSABLE: "YES",
    NILUMI_PROVISIONER_PASSWORD: "synthetic-password",
  };
  guardDisposable(valid, "infra:up");
  guardDisposable(valid, "dev:reset", ["--confirm-disposable"]);
  for (const patch of [
    { NILUMI_ENV: "pilot" },
    { NILUMI_ENV: "production" },
    { NILUMI_DISPOSABLE: "NO" },
    { NILUMI_PROVISIONER_PASSWORD: "" },
    { DOCKER_HOST: "tcp://remote:2375" },
    { COMPOSE_PROJECT_NAME: "pilot" },
  ])
    assert.throws(() =>
      guardDisposable({ ...valid, ...patch }, "dev:reset", ["--confirm-disposable"]),
    );
  assert.throws(() => guardDisposable(valid, "dev:reset"));
});
test("Pino removes OTP, content and credentials while retaining codes and request IDs", async () => {
  const child = spawn(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import {buildApp} from './apps/api/dist/app.js';
    const app=buildApp({LOG_LEVEL:'info'});
    app.log.info({code:'synthetic_log',requestId:'synthetic-correlation',otp:'PRIVATE-SENTINEL',body:'PRIVATE-SENTINEL',phone:'PRIVATE-SENTINEL',prompt:'PRIVATE-SENTINEL',output:'PRIVATE-SENTINEL',transcript:'PRIVATE-SENTINEL',config:{password:'PRIVATE-SENTINEL'},headers:{authorization:'PRIVATE-SENTINEL'},nested:{otp:'PRIVATE-SENTINEL'}},'diagnostic');
    const reply=await app.inject({url:'/api/v1/ready',headers:{'x-request-id':'PRIVATE-SENTINEL'}});
    console.log(reply.body); await app.close();
  `,
    ],
    { windowsHide: true },
  );
  let output = "";
  child.stdout.on("data", (data) => {
    output += data;
  });
  child.stderr.on("data", (data) => {
    output += data;
  });
  const [code] = await once(child, "close");
  assert.equal(code, 0);
  assert.ok(!output.includes("PRIVATE-SENTINEL"));
  assert.ok(output.includes("synthetic_log"));
  assert.ok(output.includes("synthetic-correlation"));
  assert.match(output, /"requestId":"[0-9a-f-]{36}"/);
});
