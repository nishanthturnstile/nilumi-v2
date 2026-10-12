// Manual release records and privileged migration only. No deployment/registry/OTA calls.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseMigratorEnv } from "../../packages/db/dist/config/migration-env.js";
import { migrate } from "../../packages/db/dist/release.js";
import { root, run } from "./process.mjs";

export async function release(command, args) {
  if (command === "release:migrate") {
    if (args[0] !== "--manual-reviewed")
      throw new Error("Manual reviewed migration flag required.");
    try {
      await migrate(parseMigratorEnv(process.env).NILUMI_MIGRATOR_DATABASE_URL);
    } catch {
      throw new Error("release_migration_failed");
    }
    console.log(
      "Reviewed schema and queue provisioning complete; runtime readiness may now be evaluated.",
    );
    return;
  }
  const [id] = args;
  if (!id || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(id))
    throw new Error("Safe immutable artifact ID required.");
  const dirty = await run("git", ["status", "--porcelain"], { capture: true });
  if (dirty.stdout.trim()) throw new Error("Release artifact requires a clean committed checkout.");
  const sha = (await run("git", ["rev-parse", "HEAD"], { capture: true })).stdout.trim();
  const destination = resolve(root, ".local/releases", id);
  if (existsSync(destination)) throw new Error("Prior release artifacts must not be overwritten.");
  const images = {};
  for (const name of ["api", "worker", "web"]) {
    const image = JSON.parse(
      (
        await run(
          process.platform === "win32" ? "docker.exe" : "docker",
          ["image", "inspect", `nilumi-setup06-${name}:${sha}`],
          { capture: true },
        )
      ).stdout,
    )[0];
    if (image.Config.Labels["org.opencontainers.image.revision"] !== sha)
      throw new Error("image_commit_mismatch");
    images[name] = image.Id;
  }
  mkdirSync(destination, { recursive: true });
  const files = [
    "packages/contracts/generated/openapi.json",
    "packages/api-client/src/generated/schema.ts",
  ];
  const contracts = {};
  for (const file of files) {
    const bytes = readFileSync(join(root, file));
    const name = file.split("/").at(-1);
    writeFileSync(join(destination, name), bytes, { flag: "wx" });
    contracts[name] = createHash("sha256").update(bytes).digest("hex");
  }
  writeFileSync(
    join(destination, "manifest.json"),
    JSON.stringify(
      { id, sha, images, contracts, deployment: "manual-only; not deployed" },
      null,
      2,
    ) + "\n",
    { flag: "wx" },
  );
  console.log(
    `Recorded immutable artifact ${id} at commit ${sha}; retain this directory with exported image archives.`,
  );
}
