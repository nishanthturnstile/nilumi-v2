import { randomUUID } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { root, run } from "./process.mjs";

// Only generated projects are eligible for cleanup. Never reads developer .env files.
export async function startSandbox() {
  mkdirSync(join(root, ".cache"), { recursive: true });
  const directory = mkdtempSync(join(root, ".cache/setup05-"));
  const project = `nilumi-setup05-test-${randomUUID().slice(0, 8)}`;
  const docker = process.platform === "win32" ? "docker.exe" : "docker";
  const env = { ...process.env, NILUMI_PROVISIONER_PASSWORD: randomUUID() };
  for (const key of [
    "COMPOSE_FILE",
    "COMPOSE_PROJECT_NAME",
    "COMPOSE_PROFILES",
    "DOCKER_HOST",
    "DOCKER_CONTEXT",
  ])
    delete env[key];
  const context = await run(
    docker,
    ["context", "inspect", "--format", "{{.Endpoints.docker.Host}}"],
    { capture: true, env },
  );
  if (!/^(npipe:\/\/|unix:\/\/)/.test(context.stdout.trim()))
    throw new Error("local_docker_required");
  const source = readFileSync(join(root, "infra/compose/compose.yaml"), "utf8")
    .replace("name: nilumi-disposable-dev", `name: ${project}`)
    .replaceAll(/127\.0\.0\.1:(55432|58333|58025|51025|54318|51313):/g, "127.0.0.1::");
  const file = join(directory, "compose.yaml");
  writeFileSync(file, source);
  copyFileSync(join(root, "infra/compose/otel.yaml"), join(directory, "otel.yaml"));
  const compose = (args) =>
    run(docker, ["compose", "--project-name", project, "-f", file, ...args], {
      env,
      capture: true,
    });
  const stop = () => compose(["down", "--volumes"]);
  try {
    await compose(["up", "-d", "--wait", "--pull", "never"]);
    const port = async (service, internal) =>
      Number((await compose(["port", service, String(internal)])).stdout.trim().split(":").at(-1));
    const pgPort = await port("postgres", 5432);
    const storagePort = await port("seaweed", 8333);
    const mailPort = await port("mailpit", 8025);
    const smtpPort = await port("mailpit", 1025);
    return {
      stop,
      network: `${project}_default`,
      host: {
        adminUrl: `postgresql://nilumi_provisioner:${env.NILUMI_PROVISIONER_PASSWORD}@127.0.0.1:${pgPort}/nilumi_dev`,
        storageUrl: `http://127.0.0.1:${storagePort}`,
        mailUrl: `http://127.0.0.1:${mailPort}`,
        smtpHost: "127.0.0.1",
        smtpPort,
      },
      container: {
        adminUrl: `postgresql://nilumi_provisioner:${env.NILUMI_PROVISIONER_PASSWORD}@postgres:5432/nilumi_dev`,
        storageUrl: "http://seaweed:8333",
        mailUrl: "http://mailpit:8025",
        smtpHost: "mailpit",
        smtpPort: 1025,
      },
    };
  } catch (error) {
    await stop();
    throw error;
  }
}
