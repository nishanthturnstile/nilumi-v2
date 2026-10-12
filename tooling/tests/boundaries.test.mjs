import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { inspectCruiseGraph, inspectSource, validateWorkspace } from "../scripts/boundaries.mjs";
import { root } from "../scripts/process.mjs";
import { packages } from "../scripts/workspace.mjs";

function fixture(action) {
  const base = mkdtempSync(join(tmpdir(), "nilumi boundary fixture "));
  try {
    for (const pkg of packages) {
      mkdirSync(join(base, pkg.path, "src"), { recursive: true });
      for (const file of ["package.json", "tsconfig.json"])
        cpSync(join(root, pkg.path, file), join(base, pkg.path, file));
      writeFileSync(join(base, pkg.path, "src/index.ts"), "export {};\n");
    }
    return action(base);
  } finally {
    rmSync(base, { recursive: true });
  }
}
test("permitted manifest and authored-source graph passes", () =>
  fixture((base) => {
    writeFileSync(
      join(base, "apps/client/src/index.ts"),
      'import * as contracts from "@nilumi/contracts"; export { contracts };',
    );
    assert.deepEqual(validateWorkspace(base), []);
  }));
test("real checker rejects direct, erased, reexported, dynamic, computed, alias and escaped edges", () => {
  for (const [source, expected] of [
    ['import "@nilumi/server";', "source-boundary"],
    ['import type { Hidden } from "@nilumi/db";', "source-boundary"],
    ['export * from "@nilumi/server";', "source-boundary"],
    ['void import("@nilumi/server");', "source-boundary"],
    ['const target = "@nilumi/server"; void import(target);', "computed-module-import"],
    ['import "@/private";', "cross-package-alias"],
    ['import "../../../packages/server/src/index.js";', "relative-package-escape"],
    ['import "@nilumi/contracts/src/index.ts";', "unsupported-package-subpath"],
    ['import "node:fs";', "public-server-dependency"],
    ["export const value = process.env.SECRET;", "private-environment-access"],
    ['export const value = Buffer.from("private");', "public-node-global"],
    ['export const value = globalThis["process"];', "public-node-global"],
  ])
    fixture((base) => {
      writeFileSync(join(base, "apps/client/src/index.ts"), source);
      assert.ok(
        validateWorkspace(base).some((value) => value.includes(expected)),
        expected,
      );
    });
});
test("unreexported public source participates in complete closure", () =>
  fixture((base) => {
    writeFileSync(join(base, "packages/contracts/src/not-exported.ts"), 'import "@nilumi/db";');
    const findings = validateWorkspace(base);
    assert.ok(findings.some((value) => value.includes("source-boundary")));
    assert.ok(findings.some((value) => value.includes("client:public-closure:db")));
  }));
test("unused illegal manifest dependency and package cycles fail", () =>
  fixture((base) => {
    const path = join(base, "packages/db/package.json");
    const data = JSON.parse(readFileSync(path, "utf8"));
    data.dependencies["@nilumi/server"] = "workspace:*";
    writeFileSync(path, JSON.stringify(data));
    const findings = validateWorkspace(base);
    assert.ok(findings.some((value) => value.includes("manifest-boundary")));
    assert.ok(findings.some((value) => value.includes("package-cycle")));
  }));
test("source policy allows only the two exact public env reads", () => {
  const path = join(root, "apps/client/src/config/env.ts");
  assert.deepEqual(
    inspectSource(
      path,
      "export function getClientConfig() { const a = process.env.EXPO_PUBLIC_API_BASE_URL; const b = process.env.EXPO_PUBLIC_NILUMI_ENV; return {a, b}; }",
    ).findings,
    [],
  );
  assert.ok(
    inspectSource(path, 'export const a = process.env["EXPO_PUBLIC_API_BASE_URL"];').findings
      .length,
  );
  assert.ok(
    inspectSource(
      join(root, "packages/contracts/src/index.ts"),
      "export const a = process.env.EXPO_PUBLIC_API_BASE_URL;",
    ).findings.length,
  );
});
test("future domain restrictions and resolved dist ownership cannot be bypassed", () => {
  const domain = join(root, "packages/server/src/modules/example/domain/rule.ts");
  assert.ok(
    inspectSource(domain, 'import "node:fs";').findings.some((value) =>
      value.includes("domain-dependency"),
    ),
  );
  assert.ok(inspectSource(domain, "export const rule = process.env.PRIVATE;").findings.length);
  assert.deepEqual(
    inspectSource(join(root, "apps/client/src/platform/auth.ts"), 'import "better-auth/client";')
      .findings,
    [],
  );
  assert.ok(
    inspectSource(join(root, "packages/contracts/src/index.ts"), 'import "better-auth/client";')
      .findings.length,
  );
  assert.ok(
    inspectCruiseGraph({
      modules: [
        {
          source: "apps/client/src/index.ts",
          dependencies: [{ module: "@nilumi/server", resolved: "packages/server/dist/index.js" }],
        },
      ],
    }).length,
  );
});
