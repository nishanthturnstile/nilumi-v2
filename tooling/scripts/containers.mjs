import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { startSandbox } from "./infra-sandbox.mjs";
import { root, run } from "./process.mjs";

const docker = process.platform === "win32" ? "docker.exe" : "docker";
const command = (args) => run(docker, args, { capture: true });
const evidence = join(root, process.env.NILUMI_EVIDENCE_DIRECTORY ?? ".cache/container-evidence");
async function eventually(probe, message, timeout = 60000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await probe()) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(message);
}
export async function buildContainers() {
  const sha = (await run("git", ["rev-parse", "HEAD"], { capture: true })).stdout.trim();
  mkdirSync(evidence, { recursive: true });
  for (const target of ["api", "worker", "web"]) {
    const result = await run(
      docker,
      [
        "build",
        "--file",
        "infra/docker/Dockerfile",
        "--target",
        target,
        "--build-arg",
        `NILUMI_COMMIT_SHA=${sha}`,
        "--tag",
        `nilumi-setup06-${target}:${sha}`,
        ".",
      ],
      { capture: true, allowFailure: true },
    );
    writeFileSync(join(evidence, `image-build-${target}.log`), result.stdout + result.stderr);
    if (result.code) throw new Error(`Image build failed: ${target}; see SETUP-06 evidence.`);
    console.log(`Built ${target} image from ${sha}.`);
  }
}
export async function smokeContainers() {
  const { createPool } = await import("../../packages/db/dist/index.js");
  const { provision, runtimeRoles } = await import("../../packages/db/dist/release.js");
  const sha = (await run("git", ["rev-parse", "HEAD"], { capture: true })).stdout.trim();
  const sandbox = await startSandbox();
  const names = [];
  const result = { sha, checks: [], images: {} };
  const passwords = Object.fromEntries(
    [...runtimeRoles, "nilumi_migrator"].map((role) => [role, randomUUID()]),
  );
  const url = (base, role) => {
    const value = new URL(base);
    value.username = role;
    value.password = passwords[role];
    return value.href;
  };
  try {
    await provision(sandbox.host.adminUrl, passwords);
    const migrationEnv = join(root, ".cache", `nilumi-setup06-migrate-${randomUUID()}.env`);
    writeFileSync(
      migrationEnv,
      [
        "NILUMI_ENV=test",
        "NILUMI_RELEASE_REVIEWED=YES",
        `NILUMI_MIGRATOR_DATABASE_URL=${url(sandbox.container.adminUrl, "nilumi_migrator")}`,
      ].join("\n"),
      { mode: 0o600 },
    );
    await command([
      "run",
      "--rm",
      "--network",
      sandbox.network,
      "--read-only",
      "--tmpfs",
      "/tmp",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges",
      "--env-file",
      migrationEnv,
      `nilumi-setup06-api:${sha}`,
      "node",
      "migrate.mjs",
    ]);
    result.checks.push(
      "release-only image migration/queue provisioning job completes before runtime startup",
    );
    const common = {
      NILUMI_ENV: "test",
      NILUMI_STORAGE_HEALTH_URL: sandbox.container.storageUrl,
      NILUMI_MAIL_HEALTH_URL: `${sandbox.container.mailUrl}/readyz`,
    };
    const launch = async (target, config) => {
      const name = `nilumi-setup06-${target}-${randomUUID().slice(0, 8)}`;
      names.push(name);
      const envFile = join(root, ".cache", `${name}.env`);
      writeFileSync(
        envFile,
        Object.entries(config)
          .map(([key, value]) => `${key}=${value}`)
          .join("\n"),
        { mode: 0o600 },
      );
      const image = `nilumi-setup06-${target}:${sha}`;
      const inspection = JSON.parse((await command(["image", "inspect", image])).stdout)[0];
      assert.equal(inspection.Config.User, "node");
      result.images[target] = inspection.Id;
      await command([
        "run",
        "-d",
        "--name",
        name,
        "--network",
        sandbox.network,
        "--read-only",
        "--tmpfs",
        "/tmp",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--env-file",
        envFile,
        ...(target === "worker" ? [] : ["-p", `127.0.0.1::${target === "api" ? 3001 : 8082}`]),
        image,
      ]);
      return name;
    };
    const api = await launch("api", {
      ...common,
      HOST: "0.0.0.0",
      PORT: "3001",
      NILUMI_API_DATABASE_URL: url(sandbox.container.adminUrl, "nilumi_api"),
      NILUMI_AUTH_DATABASE_URL: url(sandbox.container.adminUrl, "nilumi_auth"),
    });
    const worker = await launch("worker", {
      ...common,
      NILUMI_WORKER_DATABASE_URL: url(sandbox.container.adminUrl, "nilumi_worker"),
      NILUMI_QUEUE_DATABASE_URL: url(sandbox.container.adminUrl, "nilumi_queue"),
    });
    const web = await launch("web", { NILUMI_API_UPSTREAM: `http://${api}:3001` });
    const port = async (name, internal) =>
      Number((await command(["port", name, String(internal)])).stdout.trim().split(":").at(-1));
    const apiBase = `http://127.0.0.1:${await port(api, 3001)}`;
    const webBase = `http://127.0.0.1:${await port(web, 8082)}`;
    await eventually(async () => {
      try {
        return (await fetch(`${apiBase}/api/v1/ready`)).status === 200;
      } catch {
        return false;
      }
    }, "image_api_not_ready");
    assert.equal((await fetch(`${apiBase}/api/v1/health`)).status, 200);
    await eventually(
      async () => (await command(["logs", worker])).stdout.includes('"ready":true'),
      "image_worker_not_ready",
    );
    assert.equal((await fetch(webBase)).status, 200);
    assert.equal((await fetch(`${webBase}/api/v1/health`)).status, 200);
    result.checks.push(
      "non-root read-only images start with restricted roles; API health/ready, worker heartbeat, web export and API proxy pass",
    );
    for (const name of [api, worker]) {
      await command([
        "exec",
        name,
        "node",
        "--input-type=module",
        "-e",
        `import {createRequire} from 'node:module';import {existsSync} from 'node:fs';const require=createRequire('/app/package.json');for(const p of ['@nilumi/db','@nilumi/server','@nilumi/contracts']){await import(p)}for(const p of ['typescript','@biomejs/biome','drizzle-kit','vitest']){try{require.resolve(p);process.exit(1)}catch{}}if(!existsSync('/app/node_modules/@nilumi/db/migrations/0001-foundation.sql'))process.exit(1);`,
      ]);
    }
    result.checks.push(
      "workspace exports, migration artifact and production dependency closure verified; development tooling absent",
    );
    const release = createPool(url(sandbox.host.adminUrl, "nilumi_migrator"));
    try {
      await release.query("SET ROLE nilumi_owner");
      await release.query("UPDATE private.setup_migrations SET checksum='pending'");
      assert.equal((await fetch(`${apiBase}/api/v1/ready`)).status, 503);
      assert.equal((await fetch(`${apiBase}/api/v1/health`)).status, 200);
      await eventually(
        async () => (await command(["logs", worker])).stdout.includes('"ready":false'),
        "image_worker_readiness_loss",
      );
    } finally {
      await release.end();
    }
    result.checks.push("pending migration fails image readiness without runtime repair");
    for (const name of names) {
      const log = await command(["logs", name]);
      for (const password of Object.values(passwords))
        assert.ok(!(log.stdout + log.stderr).includes(password));
      await command(["stop", "--time", "10", name]);
      const inspection = JSON.parse((await command(["inspect", name])).stdout)[0];
      assert.equal(inspection.State.ExitCode, 0, "SIGTERM must exit cleanly, not SIGKILL");
    }
    result.checks.push(
      "all images stop with exit 0 on SIGTERM; runtime logs contain no credentials",
    );
    mkdirSync(evidence, { recursive: true });
    writeFileSync(join(evidence, "image-smoke.json"), JSON.stringify(result, null, 2) + "\n");
    console.log("Container health/readiness/packaging/shutdown smoke passes.");
  } finally {
    for (const name of names) await command(["rm", "-f", name]).catch(() => {});
    await sandbox.stop();
  }
}
