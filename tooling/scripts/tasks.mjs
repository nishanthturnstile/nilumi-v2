import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pnpm } from "./pnpm-local.mjs";
import { main, root, run } from "./process.mjs";
import { compile, compiler, compilerSelection } from "./typescript.mjs";
import { packages } from "./workspace.mjs";

export async function emitClientConfig() {
  const pkg = packages.find((item) => item.id === "client");
  const kind = compilerSelection()[pkg.name].compiler;
  const selected = compiler(kind, pkg);
  const args = [
    selected.path,
    "--project",
    "tsconfig.json",
    "--noEmit",
    "false",
    "--declaration",
    "false",
    "--outDir",
    ".cache/client-config",
  ];
  if (kind === "classic6") args.push("--stableTypeOrdering");
  await run(process.execPath, args, { cwd: join(root, pkg.path) });
}
async function types() {
  await compile("build");
  await compile("typecheck");
}
await main(async () => {
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case "setup:check":
      await (await import("./preflight.mjs")).preflight();
      break;
    case "build":
      await compile("build");
      break;
    case "typecheck":
      await types();
      break;
    case "typecheck:compat":
      await compile("build");
      await compile("build", undefined, { compatibility: true });
      await compile("typecheck", undefined, { compatibility: true });
      break;
    case "boundaries":
      await compile("build");
      await (await import("./boundaries.mjs")).checkBoundaries();
      break;
    case "check":
      await (await import("./preflight.mjs")).preflight();
      await pnpm(["exec", "biome", "check", "."]);
      await types();
      await (await import("./boundaries.mjs")).checkBoundaries();
      break;
    case "test": {
      await compile("build");
      await emitClientConfig();
      const tests = readdirSync(join(root, "tooling/tests"))
        .filter((name) => name.endsWith(".test.mjs"))
        .map((name) => `tooling/tests/${name}`);
      await run(process.execPath, ["--test", ...tests]);
      break;
    }
    case "config:check":
      await compile("build");
      await emitClientConfig();
      await (await import("./config-check.mjs")).configCheck(args);
      break;
    case "audit:dependencies":
      await (await import("./audit-dependencies.mjs")).auditDependencies();
      break;
    case "check:resolution":
      await compile("build");
      await (await import("./resolution.mjs")).checkResolution();
      break;
    case "check:linux":
      await (await import("./linux.mjs")).checkLinux();
      break;
    default:
      throw new Error(`Unknown task: ${command ?? "none"}`);
  }
});
