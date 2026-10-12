import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { cleanEnvironment, main, pnpmVersion, readJson, root, run } from "./process.mjs";

export const markerName = ".nilumi-workspace-owner.json";
export const canonical = (path) => realpathSync(path);
export function storeMarker(directory, repositoryRoot) {
  const rel = relative(canonical(repositoryRoot), resolve(directory)).replaceAll("\\", "/");
  // pnpm replaces its internal virtual-store directory during initial installation.
  // Keep that ownership record outside node_modules; external short stores retain it inside.
  if (rel === "node_modules" || rel.startsWith("node_modules/")) {
    const hash = createHash("sha256").update(resolve(directory)).digest("hex").slice(0, 8);
    return join(repositoryRoot, ".local", `pnpm-store-owner-${hash}.json`);
  }
  return join(directory, markerName);
}
export function samePath(a, b, platform = process.platform) {
  return platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;
}
export function ensureOwnedStore(repositoryRoot, baseDirectory) {
  const owner = canonical(repositoryRoot);
  for (let suffix = 1; suffix < 1000; suffix++) {
    const directory = suffix === 1 ? baseDirectory : `${baseDirectory}-${suffix}`;
    const marker = storeMarker(directory, owner);
    if (existsSync(marker)) {
      try {
        if (samePath(readJson(marker).repositoryRoot, owner)) return canonical(directory);
      } catch {
        /* Invalid/foreign markers are never overwritten. */
      }
      continue;
    }
    if (existsSync(directory) && readdirSync(directory).length) continue;
    mkdirSync(directory, { recursive: true });
    mkdirSync(dirname(marker), { recursive: true });
    writeFileSync(marker, `${JSON.stringify({ version: 1, repositoryRoot: owner }, null, 2)}\n`, {
      flag: "wx",
    });
    return canonical(directory);
  }
  throw new Error("No free dedicated pnpm store; choose a different store base during prepare.");
}
export function validateLocalConfig(config, repositoryRoot = root) {
  if (config.version !== 1 || !samePath(config.repositoryRoot, canonical(repositoryRoot))) {
    throw new Error("Stale .local/workspace.json: run explicit prepare for this checkout.");
  }
  if (!isAbsolute(config.pnpmExecutable) || !existsSync(config.pnpmExecutable)) {
    throw new Error(
      "Prepared pnpm executable is missing: run explicit prepare; checks never download it.",
    );
  }
  if (process.platform === "win32" && !config.pnpmExecutable.endsWith(".exe")) {
    throw new Error("Windows requires the prepared native pnpm executable, not a .cmd shim.");
  }
  if (
    !isAbsolute(config.virtualStoreDir) ||
    !existsSync(storeMarker(config.virtualStoreDir, repositoryRoot))
  ) {
    throw new Error("Dedicated pnpm store ownership is missing: run explicit prepare.");
  }
  const marker = readJson(storeMarker(config.virtualStoreDir, repositoryRoot));
  if (!samePath(marker.repositoryRoot, canonical(repositoryRoot)))
    throw new Error("Foreign pnpm store: repair local configuration without deleting that store.");
  return config;
}
export function workspaceEnvironment(config, input = process.env) {
  const env = cleanEnvironment(input);
  for (const key of Object.keys(env))
    if (key.toLowerCase() === "pnpm_config_virtual_store_dir") delete env[key];
  env.PNPM_CONFIG_VIRTUAL_STORE_DIR = config.virtualStoreDir.replaceAll("\\", "/");
  return env;
}
export async function preparedConfig(repositoryRoot = root) {
  const path = join(repositoryRoot, ".local/workspace.json");
  if (!existsSync(path))
    throw new Error("Run node tooling/scripts/pnpm-local.mjs prepare before repository commands.");
  const config = validateLocalConfig(readJson(path), repositoryRoot);
  const version = await run(config.pnpmExecutable, ["--version"], {
    capture: true,
    cwd: repositoryRoot,
    env: workspaceEnvironment(config),
  });
  if (version.stdout.trim() !== pnpmVersion)
    throw new Error(`Prepared pnpm must be ${pnpmVersion}; run explicit prepare.`);
  return config;
}
export async function prepare(repositoryRoot = root, storeBase) {
  const owner = canonical(repositoryRoot);
  const temporary = mkdtempSync(join(tmpdir(), "nilumi pnpm bootstrap "));
  const launcher = process.platform === "win32" ? "pnpm.exe" : "pnpm";
  const discovered = await run(
    launcher,
    ["--dir", temporary, "exec", "node", "--print", "process.env.npm_execpath"],
    { capture: true, cwd: temporary },
  );
  const native = discovered.stdout.trim();
  if (
    !isAbsolute(native) ||
    !existsSync(native) ||
    (process.platform === "win32" && !native.endsWith(".exe"))
  ) {
    throw new Error(
      "Bootstrap needs a native pnpm executable; unsupported shim. No global tools were changed.",
    );
  }
  const bootstrap = await run(
    native,
    [
      "with",
      pnpmVersion,
      "--dir",
      temporary,
      "exec",
      "node",
      "--print",
      "process.env.npm_execpath",
    ],
    { capture: true, allowFailure: true, cwd: temporary, env: cleanEnvironment() },
  );
  let pnpmExecutable = bootstrap.stdout.trim().split(/\r?\n/).at(-1);
  if (bootstrap.code) {
    console.log(
      "Bootstrap pnpm with failed; explicit prepare will verify and extract the exact official native artifact.",
    );
    pnpmExecutable = await prepareArtifact(owner);
  }
  if (!pnpmExecutable || !isAbsolute(pnpmExecutable) || !existsSync(pnpmExecutable))
    throw new Error("Cannot discover prepared native pnpm path.");
  const version = await run(pnpmExecutable, ["--version"], { capture: true, cwd: temporary });
  if (version.stdout.trim() !== pnpmVersion)
    throw new Error("Prepared pnpm version does not match the exact pin.");
  const hash = createHash("sha256")
    .update(process.platform === "win32" ? owner.toLowerCase() : owner)
    .digest("hex")
    .slice(0, 8);
  const base =
    storeBase ??
    (process.platform === "win32" ? `C:/pnpm/nv2-${hash}` : join(owner, "node_modules/.pnpm"));
  const virtualStoreDir = ensureOwnedStore(owner, resolve(base));
  const config = {
    version: 1,
    repositoryRoot: owner,
    pnpmExecutable,
    pnpmVersion,
    virtualStoreDir,
  };
  mkdirSync(join(owner, ".local"), { recursive: true });
  writeFileSync(join(owner, ".local/workspace.json"), `${JSON.stringify(config, null, 2)}\n`);
  console.log(
    `Prepared pnpm ${pnpmVersion} for ${basename(owner)}; dedicated store ownership verified.`,
  );
  return config;
}
export async function prepareArtifact(repositoryRoot) {
  const platform = process.platform === "win32" ? "win32" : process.platform;
  const artifact = `@pnpm/exe.${platform}-${process.arch}`;
  const metadataResponse = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(artifact)}/${pnpmVersion}`,
  );
  if (!metadataResponse.ok) throw new Error("Cannot fetch the exact native pnpm metadata.");
  const metadata = await metadataResponse.json();
  if (metadata.version !== pnpmVersion || !metadata.dist.integrity.startsWith("sha512-"))
    throw new Error("Invalid native pnpm artifact metadata.");
  const response = await fetch(metadata.dist.tarball);
  if (!response.ok) throw new Error("Cannot download the pinned native pnpm artifact.");
  const archive = Buffer.from(await response.arrayBuffer());
  if (`sha512-${createHash("sha512").update(archive).digest("base64")}` !== metadata.dist.integrity)
    throw new Error("Native pnpm artifact integrity mismatch.");
  const tar = gunzipSync(archive);
  const executableName = process.platform === "win32" ? "pnpm.exe" : "pnpm";
  const destination = join(repositoryRoot, ".local/tools", `pnpm-${pnpmVersion}`, executableName);
  for (let offset = 0; offset + 512 <= tar.length; ) {
    const header = tar.subarray(offset, offset + 512);
    const name = header.subarray(0, 100).toString().replace(/\0.*$/, "");
    if (!name) break;
    const size =
      Number.parseInt(header.subarray(124, 136).toString().replace(/\0.*$/, "").trim(), 8) || 0;
    if (name === `package/${executableName}` && [0, 48].includes(header[156])) {
      mkdirSync(join(repositoryRoot, ".local/tools", `pnpm-${pnpmVersion}`), { recursive: true });
      writeFileSync(destination, tar.subarray(offset + 512, offset + 512 + size), { mode: 0o755 });
      return destination;
    }
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  throw new Error("Pinned artifact does not contain the expected native pnpm executable.");
}
export async function pnpm(args, options = {}) {
  const config = await preparedConfig();
  return await run(config.pnpmExecutable, args, { env: workspaceEnvironment(config), ...options });
}
if (process.argv[1] && samePath(resolve(process.argv[1]), fileURLToPath(import.meta.url))) {
  await main(async () => {
    const args = process.argv.slice(2);
    if (args[0] === "prepare") await prepare(root, args[1]);
    else {
      if (!args.length) throw new Error("Specify prepare or pnpm arguments, such as run check.");
      const result = await pnpm(args, { allowFailure: true });
      process.exitCode = result.code;
    }
  });
}
