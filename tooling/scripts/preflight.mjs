import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { preparedConfig } from "./pnpm-local.mjs";
import { nodeVersion, pnpmVersion, readJson, root, run } from "./process.mjs";
import { compiler, compilerSelection } from "./typescript.mjs";
import { manifest, packages } from "./workspace.mjs";

export const hashFile = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
// Opt-in audit of the original foundation transition, not a routine checkout check.
export async function preservationCheck() {
  const baseline = readJson(
    join(root, "docs/development/evidence/setup-05-2026-10-12/preservation-baseline.json"),
  );
  const permitted = new Set([
    "docs/development/toolchain.md",
    "docs/implementation/001-development-environment-and-project-foundation.md",
  ]);
  for (const entry of baseline.files) {
    if (!permitted.has(entry.path) && hashFile(join(root, entry.path)) !== entry.sha256)
      throw new Error(`Preservation failed: ${entry.path}`);
  }
  if (hashFile(join(root, ".git/index")) !== baseline.indexHash)
    throw new Error("Git index bytes changed.");
  const staged = await run(
    process.platform === "win32" ? "git.exe" : "git",
    ["ls-files", "--stage"],
    { capture: true, env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } },
  );
  if (JSON.stringify(staged.stdout.trim().split(/\r?\n/)) !== JSON.stringify(baseline.staged))
    throw new Error("Original staged blobs changed.");
  return {
    protectedFiles: baseline.files.filter((entry) => !permitted.has(entry.path)).length,
    stagedBlobs: baseline.staged.length,
    indexUnchanged: true,
  };
}
export async function preflight() {
  if (process.versions.node !== nodeVersion)
    throw new Error(`Use Node ${nodeVersion}; current ${process.versions.node}.`);
  if (readJson(join(root, "package.json")).packageManager !== `pnpm@${pnpmVersion}`)
    throw new Error("Root package-manager pin mismatch.");
  await preparedConfig();
  const selections = compilerSelection();
  for (const pkg of packages) {
    const data = manifest(pkg);
    if (
      data.devDependencies["@biomejs/biome"] !== "2.5.15" ||
      !existsSync(join(root, pkg.path, "biome.json"))
    )
      throw new Error(`Missing Biome pin/config: ${pkg.name}`);
    compiler(selections[pkg.name].compiler, pkg);
  }
  if (!existsSync(join(root, "pnpm-lock.yaml"))) throw new Error("Application lock is missing.");
  for (const path of [
    ".env.local",
    "apps/client/.env.local",
    ".local/workspace.json",
    "apps/api/dist/index.js",
    "apps/client/android/build.gradle",
  ]) {
    const result = await run(
      process.platform === "win32" ? "git.exe" : "git",
      ["check-ignore", "--no-index", path],
      { capture: true, allowFailure: true, env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } },
    );
    if (result.code) throw new Error(`Sensitive/generated path is not ignored: ${path}`);
  }
  console.log("Node/pnpm/compiler pins, package tooling and ignored outputs pass.");
}
