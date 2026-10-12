import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseEnv } from "node:util";
import { root } from "./process.mjs";

export function loadEnvironment(path, { explicit = false, inherited = process.env } = {}) {
  if (explicit && !existsSync(path)) throw new Error("Explicit environment file does not exist.");
  const file = existsSync(path) ? parseEnv(readFileSync(path, "utf8")) : {};
  return { ...file, ...inherited };
}
export async function configCheck(args) {
  const targetIndex = args.indexOf("--target");
  const target = args[targetIndex + 1];
  if (targetIndex < 0 || !["client", "api", "worker", "migrator"].includes(target))
    throw new Error("Specify --target client|api|worker|migrator.");
  const targets = {
    api: ["apps/api", "dist/config/env.js", "parseApiEnv"],
    worker: ["apps/worker", "dist/config/env.js", "parseWorkerEnv"],
    migrator: ["packages/db", "dist/config/migration-env.js", "parseMigratorEnv"],
    client: ["apps/client", ".cache/client-config/config/env.js", "parseClientEnv"],
  };
  const [directory, entry, method] = targets[target];
  const fileIndex = args.indexOf("--env-file");
  if (fileIndex >= 0 && !args[fileIndex + 1]) throw new Error("--env-file needs a path.");
  const file =
    fileIndex >= 0 ? resolve(root, args[fileIndex + 1]) : resolve(root, directory, ".env.local");
  const input = loadEnvironment(file, { explicit: fileIndex >= 0 });
  const module = await import(pathToFileURL(resolve(root, directory, entry)));
  module[method](input);
  console.log(`${target} configuration is valid; values are not displayed.`);
}
