import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { main, readJson, root, run } from "./process.mjs";

const pin = readJson(join(root, "tooling/contracts/checker.json"));
const directory = join(root, ".local/tools", `oasdiff-${pin.version}`);
const executable = join(directory, process.platform === "win32" ? "oasdiff.exe" : "oasdiff");
const current = join(root, "packages/contracts/generated/openapi.json");
const baseline = join(root, "tooling/contracts/generated/bootstrap-v1.json");
export async function prepareChecker() {
  const platform = process.platform === "win32" ? "windows" : process.platform;
  const selected = pin.archives[`${platform}_${process.arch}`];
  if (!selected) throw new Error("unsupported_checker_platform");
  const response = await fetch(selected.url);
  if (!response.ok) throw new Error("checker_download_failed");
  const archive = Buffer.from(await response.arrayBuffer());
  if (createHash("sha256").update(archive).digest("hex") !== selected.sha256)
    throw new Error("checker_integrity_failed");
  mkdirSync(directory, { recursive: true });
  const path = join(directory, "archive.tar.gz");
  writeFileSync(path, archive);
  await run("tar", [
    "-xzf",
    path,
    "-C",
    directory,
    process.platform === "win32" ? "oasdiff.exe" : "oasdiff",
  ]);
  console.log(`Prepared checksum-verified oasdiff ${pin.version}.`);
}
async function compare(base, revision, allowFailure = false) {
  if (!existsSync(executable))
    throw new Error("Run contracts:prepare explicitly; checks never download.");
  return run(executable, ["breaking", base, revision, "--fail-on", "WARN", "--format", "json"], {
    capture: true,
    allowFailure,
  });
}
export async function compatibility(baseRef) {
  if (!baseRef || !/^[0-9a-f]{40}$/.test(baseRef))
    throw new Error("Exact PR base commit SHA required.");
  const schema = "packages/contracts/generated/openapi.json";
  await run("git", ["cat-file", "-e", `${baseRef}^{commit}`], { capture: true });
  mkdirSync(join(root, ".cache"), { recursive: true });
  const base = await run("git", ["show", `${baseRef}:${schema}`], {
    capture: true,
    allowFailure: true,
  });
  const temporary = mkdtempSync(join(root, ".cache/contract-base-"));
  const path = join(temporary, "base.json");
  if (base.code) {
    const bootstrap = readJson(join(root, "tooling/contracts/baseline.json"));
    if (baseRef !== bootstrap.bootstrapBaseCommit)
      throw new Error("missing_base_contract_requires_review");
    if (createHash("sha256").update(readFileSync(baseline)).digest("hex") !== bootstrap.sha256)
      throw new Error("bootstrap_contract_changed");
    writeFileSync(path, readFileSync(baseline));
    console.log("Explicit first-baseline bootstrap: PR base has no generated contract.");
  } else writeFileSync(path, base.stdout);
  const result = await compare(path, current, true);
  const evidence = join(root, "docs/development/evidence/setup-06-2026-10-12");
  mkdirSync(evidence, { recursive: true });
  writeFileSync(
    join(evidence, "contract-compat.json"),
    `${JSON.stringify({ baseRef, checker: pin.version, code: result.code, output: result.stdout }, null, 2)}\n`,
  );
  if (result.code) throw new Error("OpenAPI compatibility failed; see contract-compat.json.");
  console.log("OpenAPI compatibility passes against exact PR base.");
}
export async function qualifyChecker() {
  mkdirSync(join(root, ".cache"), { recursive: true });
  const directory = mkdtempSync(join(root, ".cache/contract-qualification-"));
  const schema = readJson(current);
  const removed = structuredClone(schema);
  delete removed.paths["/api/v1/health"];
  const broken = join(directory, "removed-endpoint.json");
  writeFileSync(broken, JSON.stringify(removed));
  assert.equal((await compare(current, current, true)).code, 0);
  const result = await compare(current, broken, true);
  assert.notEqual(result.code, 0, "removed endpoint must fail compatibility");
  const evidence = join(root, "docs/development/evidence/setup-06-2026-10-12");
  mkdirSync(evidence, { recursive: true });
  writeFileSync(
    join(evidence, "contract-checker-qualification.json"),
    `${JSON.stringify({ checker: pin.version, unchanged: "accepted", removedEndpoint: "rejected", output: result.stdout }, null, 2)}\n`,
  );
  console.log("Checker qualification passes: unchanged accepted; removed v1 endpoint rejected.");
}
if (process.argv[1]?.endsWith("contract-compat.mjs"))
  await main(async () => {
    if (process.argv[2] !== "prepare") throw new Error("Specify prepare.");
    await prepareChecker();
  });
