import { join } from "node:path";
import { loadEnvironment } from "./config-check.mjs";
import { root, run } from "./process.mjs";

export function guardDisposable(input, command, args = []) {
  if (!["infra:up", "infra:down", "dev:reset", "db:provision"].includes(command))
    throw new Error("Unknown disposable infrastructure operation.");
  if (input.NILUMI_ENV !== "development" || input.NILUMI_DISPOSABLE !== "YES")
    throw new Error("Infrastructure commands require explicit disposable development mode.");
  if (
    !input.NILUMI_PROVISIONER_PASSWORD ||
    /replace|placeholder/i.test(input.NILUMI_PROVISIONER_PASSWORD)
  )
    throw new Error("Disposable provisioning password required.");
  if (command === "dev:reset" && !args.includes("--confirm-disposable"))
    throw new Error(
      "Reset requires --confirm-disposable; deletes only nilumi-disposable-dev volumes.",
    );
  // Never target a remote daemon, alternate compose file/project or inherited profiles.
  if (
    input.DOCKER_HOST ||
    input.DOCKER_CONTEXT ||
    input.COMPOSE_FILE ||
    input.COMPOSE_PROJECT_NAME ||
    input.COMPOSE_PROFILES
  )
    throw new Error("Infrastructure commands reject Docker/Compose target overrides.");
}
export async function infra(command, args) {
  const input = loadEnvironment(join(root, "infra/compose/.env.local"), { explicit: true });
  guardDisposable(input, command, args);
  const docker = process.platform === "win32" ? "docker.exe" : "docker";
  const context = await run(
    docker,
    ["context", "inspect", "--format", "{{.Endpoints.docker.Host}}"],
    { capture: true },
  );
  if (!/^(npipe:\/\/|unix:\/\/)/.test(context.stdout.trim()))
    throw new Error("Only a local Docker daemon is allowed.");
  await run(
    docker,
    [
      "compose",
      "--project-name",
      "nilumi-disposable-dev",
      "--env-file",
      "infra/compose/.env.local",
      "-f",
      "infra/compose/compose.yaml",
      ...(command !== "infra:up" || args.includes("--diagnostics")
        ? ["--profile", "diagnostics"]
        : []),
      ...(command === "infra:up"
        ? ["up", "-d", "--wait", "--pull", "never"]
        : command === "infra:down"
          ? ["down"]
          : ["down", "--volumes"]),
    ],
    { env: input },
  );
}
