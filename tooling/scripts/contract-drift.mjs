import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { contracts } from "./contracts.mjs";
import { main, root } from "./process.mjs";

await main(async () => {
  await contracts({ check: true });
  const files = [
    "packages/contracts/generated/openapi.json",
    "packages/api-client/src/generated/schema.ts",
  ];
  for (const file of files) {
    const path = join(root, file);
    const original = readFileSync(path);
    try {
      // Valid trailing whitespace is still byte drift and must not be normalized away.
      writeFileSync(path, Buffer.concat([original, Buffer.from("\n")]));
      await assert.rejects(contracts({ check: true }), /Contract drift:/);
    } finally {
      writeFileSync(path, original);
    }
  }
  await contracts({ check: true });
  const evidence = join(root, "docs/development/evidence/setup-06-2026-10-12");
  mkdirSync(evidence, { recursive: true });
  writeFileSync(
    join(evidence, "contract-drift-qualification.json"),
    `${JSON.stringify({ unchanged: "accepted", byteDriftRejected: files, restored: "passes" }, null, 2)}\n`,
  );
  console.log("Byte drift in both generated artifacts is rejected; originals restored and pass.");
});
