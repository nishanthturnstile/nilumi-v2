import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  ensureOwnedStore,
  markerName,
  storeMarker,
  validateLocalConfig,
  workspaceEnvironment,
} from "../scripts/pnpm-local.mjs";
import { cleanEnvironment, run } from "../scripts/process.mjs";
import { compiler, compilerSelection } from "../scripts/typescript.mjs";
import { packages } from "../scripts/workspace.mjs";

test("store ownership keeps foreign and unmarked directories intact", () => {
  const temporary = mkdtempSync(join(tmpdir(), "nilumi ownership fixture "));
  try {
    const owner = join(temporary, "repo with spaces");
    mkdirSync(owner);
    const base = join(temporary, "store");
    mkdirSync(base);
    writeFileSync(join(base, "foreign.txt"), "do not alter");
    const selected = ensureOwnedStore(owner, base);
    assert.equal(selected, `${base}-2`);
    assert.equal(ensureOwnedStore(owner, base), selected);
    assert.equal(readFileSync(join(base, "foreign.txt"), "utf8"), "do not alter");
    assert.ok(existsSync(join(selected, markerName)));
    const config = {
      version: 1,
      repositoryRoot: owner,
      virtualStoreDir: selected,
      pnpmExecutable: process.execPath,
    };
    assert.equal(validateLocalConfig(config, owner), config);
    assert.throws(
      () => validateLocalConfig({ ...config, repositoryRoot: temporary }, owner),
      /Stale/,
    );
    assert.throws(
      () =>
        validateLocalConfig({ ...config, pnpmExecutable: join(temporary, "missing.exe") }, owner),
      /missing/,
    );
    writeFileSync(join(selected, markerName), JSON.stringify({ repositoryRoot: temporary }));
    assert.throws(() => validateLocalConfig(config, owner), /Foreign/);
  } finally {
    rmSync(temporary, { recursive: true });
  }
});
test("child environment drops bootstrap overrides and preserves user options", () => {
  const input = {
    CorePack_Root: "bootstrap",
    pnpm_config_pm_on_fail: "ignore",
    JAVA_TOOL_OPTIONS: "existing",
    NODE_OPTIONS: "existing",
    pnpm_config_virtual_store_dir: "foreign",
  };
  const env = workspaceEnvironment({ virtualStoreDir: "C:\\test store" }, input);
  assert.equal(env.CorePack_Root, undefined);
  assert.equal(env.pnpm_config_pm_on_fail, undefined);
  assert.equal(env.PNPM_CONFIG_PM_ON_FAIL, "error");
  assert.equal(env.PNPM_CONFIG_VIRTUAL_STORE_DIR, "C:/test store");
  assert.equal(env.JAVA_TOOL_OPTIONS, "existing");
  assert.equal(env.NODE_OPTIONS, "existing");
  assert.equal(cleanEnvironment(input).CorePack_Root, undefined);
});
test("internal store ownership survives pnpm replacing its dependency directory", () => {
  const owner = mkdtempSync(join(tmpdir(), "nilumi internal store fixture "));
  try {
    const store = ensureOwnedStore(owner, join(owner, "node_modules/.pnpm"));
    const marker = storeMarker(store, owner);
    assert.ok(marker.startsWith(join(owner, ".local")));
    assert.ok(existsSync(marker));
    assert.ok(store.startsWith(join(owner, "node_modules")));
    rmSync(store, { recursive: true });
    mkdirSync(store);
    assert.ok(existsSync(marker));
    assert.equal(ensureOwnedStore(owner, store), store);
    assert.equal(
      validateLocalConfig(
        {
          version: 1,
          repositoryRoot: owner,
          virtualStoreDir: store,
          pnpmExecutable: process.execPath,
        },
        owner,
      ).virtualStoreDir,
      store,
    );
  } finally {
    rmSync(owner, { recursive: true });
  }
});
test("argument arrays preserve spaces and shell metacharacters", async () => {
  const expected = ["path with spaces", "$(not-a-command)", "a&b", "literal;value", "`literal`"];
  const result = await run(
    process.execPath,
    ["--eval", "process.stdout.write(JSON.stringify(process.argv.slice(1)))", ...expected],
    { capture: true },
  );
  assert.deepEqual(JSON.parse(result.stdout), expected);
});
test("child failure and interruption produce non-success results", async () => {
  const failed = await run(process.execPath, ["--eval", "process.exit(23)"], {
    capture: true,
    allowFailure: true,
  });
  assert.equal(failed.code, 23);
  const interrupted = await run(
    process.execPath,
    ["--eval", "process.kill(process.pid, 'SIGINT')"],
    { capture: true, allowFailure: true },
  );
  assert.notEqual(interrupted.code, 0);
});
test("all selections route to pinned native7 independently of ambiguous tsc bins", () => {
  const selections = compilerSelection();
  for (const pkg of packages) {
    assert.equal(selections[pkg.name].compiler, "native7");
    const selected = compiler("native7", pkg);
    assert.equal(selected.version, "7.0.2");
    assert.ok(existsSync(selected.path));
    assert.notEqual(
      selected.path,
      compiler(["client", "ui"].includes(pkg.id) ? "classic6" : "classic5", pkg).path,
    );
  }
});
