// Materialize only the installed production dependency closure. No resolution/download/install.
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, symlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { main, root } from "./process.mjs";

export function packageRuntime(app, destination) {
  if (!["api", "worker"].includes(app)) throw new Error("runtime_package_required");
  if (existsSync(destination)) throw new Error("runtime_destination_exists");
  const copied = new Map();
  const locate = (directory, name) => {
    const require = createRequire(join(directory, "package.json"));
    // Search installed Node module locations without invoking exports: declaration-only
    // dependencies can legitimately have no runtime main/package.json export.
    for (const candidate of require.resolve.paths(name) ?? []) {
      const path = join(candidate, name);
      if (existsSync(path)) return realpathSync(path);
    }
    throw new Error(`production_dependency_missing:${name}`);
  };
  const materialize = (directory, output) => {
    const source = realpathSync(directory);
    if (copied.has(source)) return copied.get(source);
    const manifest = JSON.parse(readFileSync(join(source, "package.json")));
    const target =
      output ??
      join(
        destination,
        "node_modules/.nilumi",
        createHash("sha256").update(relative(root, source)).digest("hex").slice(0, 16),
      );
    copied.set(source, target);
    mkdirSync(target, { recursive: true });
    if (manifest.name.startsWith("@nilumi/")) {
      cpSync(join(source, "package.json"), join(target, "package.json"));
      for (const file of manifest.files ?? [])
        cpSync(join(source, file), join(target, file), { recursive: true });
    } else
      cpSync(source, target, {
        recursive: true,
        filter: (path) =>
          !["node_modules", ".git"].includes(path.split(/[\\/]/).at(-1)) &&
          !/^\.env/.test(path.split(/[\\/]/).at(-1)),
      });
    const required = { ...manifest.dependencies };
    const optional = { ...manifest.optionalDependencies };
    for (const [name, version] of Object.entries(manifest.peerDependencies ?? {})) {
      if (manifest.peerDependenciesMeta?.[name]?.optional) optional[name] = version;
      else required[name] = version;
    }
    for (const name of new Set([...Object.keys(required), ...Object.keys(optional)])) {
      let dependency;
      try {
        dependency = locate(source, name);
      } catch (error) {
        if (name in required && !(name in optional)) throw error;
        continue;
      }
      const resolved = materialize(dependency);
      const link = join(target, "node_modules", name);
      mkdirSync(dirname(link), { recursive: true });
      symlinkSync(relative(dirname(link), resolved), link, "dir");
    }
    return target;
  };
  materialize(join(root, "apps", app), destination);
  console.log(
    `Packaged ${app}: ${copied.size} installed production packages and workspace exports.`,
  );
}
if (process.argv[1]?.endsWith("package-runtime.mjs"))
  await main(async () => packageRuntime(process.argv[2], process.argv[3]));
