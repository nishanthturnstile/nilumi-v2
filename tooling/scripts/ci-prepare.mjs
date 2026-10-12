// Explicit bootstrap for fresh CI/container hosts; never called by checks.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ensureOwnedStore, prepareArtifact } from "./pnpm-local.mjs";
import { main, nodeVersion, pnpmVersion, root } from "./process.mjs";

await main(async () => {
  if (process.versions.node !== nodeVersion) throw new Error("node_pin_mismatch");
  const pnpmExecutable = await prepareArtifact(root);
  const virtualStoreDir = ensureOwnedStore(root, join(root, "node_modules/.pnpm"));
  mkdirSync(join(root, ".local"), { recursive: true });
  writeFileSync(
    join(root, ".local/workspace.json"),
    JSON.stringify({
      version: 1,
      repositoryRoot: root,
      pnpmExecutable,
      pnpmVersion,
      virtualStoreDir,
    }),
  );
});
