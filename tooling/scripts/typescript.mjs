import { existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { main, readJson, root, run } from "./process.mjs";
import { packages } from "./workspace.mjs";

const require = createRequire(import.meta.url);
export function compilerSelection() {
  const selection = readJson(join(root, "tooling/typescript/compiler-selection.json"));
  if (selection.version !== 1 || Object.keys(selection.packages).length !== packages.length)
    throw new Error("Compiler map must explicitly cover all eight packages.");
  for (const pkg of packages) {
    const entry = selection.packages[pkg.name];
    if (!entry || !["native7", "classic5", "classic6"].includes(entry.compiler))
      throw new Error(`Missing/invalid compiler selection: ${pkg.name}`);
    if (entry.compiler !== "native7" && (!entry.reason || !entry.evidence))
      throw new Error(`Classic fallback needs committed evidence: ${pkg.name}`);
  }
  return selection.packages;
}
export function compiler(kind, pkg) {
  const localRequire = createRequire(join(root, pkg.path, "package.json"));
  const metadataPath =
    kind === "native7"
      ? require.resolve("@nilumi/typescript-native/package.json")
      : localRequire.resolve("typescript/package.json");
  const metadata = readJson(metadataPath);
  const expected = { native7: "7.0.2", classic5: "5.9.3", classic6: "6.0.3" }[kind];
  if (metadata.version !== expected)
    throw new Error(`Unexpected ${kind} compiler for ${pkg.name}: ${metadata.version}`);
  const executable = typeof metadata.bin === "string" ? metadata.bin : metadata.bin.tsc;
  const path = join(dirname(metadataPath), executable);
  if (!existsSync(path))
    throw new Error("Pinned compiler launcher is missing; install dependencies explicitly.");
  return { path, version: expected };
}
export async function compile(action, requested, { compatibility = false, base = root } = {}) {
  const selections = compilerSelection();
  const targets = requested ? packages.filter((pkg) => pkg.name === requested) : packages;
  if (!targets.length) throw new Error(`Unknown package: ${requested}`);
  for (const pkg of targets) {
    if (action === "build" && !pkg.built) continue;
    const kind = compatibility
      ? ["client", "ui"].includes(pkg.id)
        ? "classic6"
        : "classic5"
      : selections[pkg.name].compiler;
    const selected = compiler(kind, pkg);
    const version = await run(process.execPath, [selected.path, "--version"], {
      capture: true,
      cwd: base,
    });
    if (!version.stdout.includes(selected.version))
      throw new Error("Compiler executable and package version differ.");
    const project = join(
      base,
      pkg.path,
      action === "build" ? "tsconfig.build.json" : "tsconfig.json",
    );
    const args = [selected.path, "--project", project];
    if (kind === "classic6") args.push("--stableTypeOrdering");
    if (action !== "build") args.push("--noEmit");
    if (action === "build" && compatibility) {
      const destination = join(base, ".cache/compat", kind, pkg.id);
      mkdirSync(destination, { recursive: true });
      args.push("--outDir", destination);
    }
    console.log(`${action}: ${pkg.name} → ${kind} ${selected.version}`);
    await run(process.execPath, args, { cwd: join(base, pkg.path) });
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(async () => {
    const [action = "typecheck", requested] = process.argv.slice(2);
    if (!["build", "typecheck", "compat"].includes(action))
      throw new Error("Unknown compiler action.");
    if (action === "typecheck" || action === "compat") await compile("build");
    await compile(action === "compat" ? "typecheck" : action, requested, {
      compatibility: action === "compat",
    });
  });
}
