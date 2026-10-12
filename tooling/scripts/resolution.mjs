import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  canonical,
  ensureOwnedStore,
  preparedConfig,
  workspaceEnvironment,
} from "./pnpm-local.mjs";
import { readJson, root, run } from "./process.mjs";
import { compiler } from "./typescript.mjs";
import { packages } from "./workspace.mjs";

export function copyWorkspace(destination, { git = false } = {}) {
  mkdirSync(destination, { recursive: true });
  const ignored = new Set([
    "node_modules",
    "dist",
    ".cache",
    ".local",
    ".expo",
    "android",
    "ios",
    "coverage",
  ]);
  const filter = (source) =>
    !ignored.has(source.split(/[\\/]/).at(-1)) &&
    !/^\.env(?!\.example$)/.test(source.split(/[\\/]/).at(-1));
  for (const directory of ["apps", "packages", "tooling", "docs", "infra"])
    cpSync(join(root, directory), join(destination, directory), { recursive: true, filter });
  for (const file of [
    "package.json",
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    "biome.json",
    ".dependency-cruiser.cjs",
    ".gitignore",
    ".gitattributes",
    ".editorconfig",
    ".node-version",
  ])
    cpSync(join(root, file), join(destination, file));
  for (const file of ["README.md", "CONTRIBUTING.md", "AGENTS.md"])
    if (existsSync(join(root, file))) cpSync(join(root, file), join(destination, file));
  if (git) cpSync(join(root, ".git"), join(destination, ".git"), { recursive: true });
}
export function probeEnvironment(input = process.env) {
  const names = new Set([
    "path",
    "systemroot",
    "windir",
    "comspec",
    "pathext",
    "temp",
    "tmp",
    "tmpdir",
    "home",
    "userprofile",
    "localappdata",
    "appdata",
    "lang",
  ]);
  const env = Object.fromEntries(
    Object.entries(input).filter(([key]) => names.has(key.toLowerCase())),
  );
  return {
    ...env,
    CI: "1",
    EXPO_NO_DOTENV: "1",
    EXPO_NO_TELEMETRY: "1",
    EXPO_OFFLINE: "1",
    EXPO_PUBLIC_NILUMI_ENV: "test",
    EXPO_PUBLIC_API_BASE_URL: "http://127.0.0.1:3001",
  };
}
function allFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? allFiles(join(directory, entry.name)) : [join(directory, entry.name)],
  );
}
async function compilerConsumers(base) {
  const directory = join(base, "apps/client/.setup03");
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    join(directory, "consumer.ts"),
    'import * as Contracts from "@nilumi/contracts";\nimport * as ApiClient from "@nilumi/api-client";\nexport const names: string[] = [...Object.keys(Contracts), ...Object.keys(ApiClient)];\n',
  );
  const config = {
    compilerOptions: {
      strict: true,
      skipLibCheck: true,
      target: "ES2020",
      lib: ["ES2020", "DOM"],
      types: [],
      module: "NodeNext",
      moduleResolution: "NodeNext",
      noEmit: true,
    },
    files: ["consumer.ts"],
  };
  const path = join(directory, "tsconfig.consumer.json");
  writeFileSync(path, JSON.stringify(config));
  const versions = [
    ["classic5", "api-client"],
    ["classic6", "client"],
    ["native7", "client"],
  ];
  for (const [kind, id] of versions) {
    const selected = compiler(
      kind,
      packages.find((pkg) => pkg.id === id),
    );
    const args = [
      selected.path,
      "--project",
      path,
      ...(kind === "classic6" ? ["--stableTypeOrdering"] : []),
    ];
    await run(process.execPath, args, { cwd: directory });
    for (const [source, diagnostic] of [
      ['export const bad: number = "wrong";\n', /2322/],
      [
        'export const bad = process.env.SECRET;\nexport const bytes = Buffer.from("x");\n',
        /2580|2591|2304/,
      ],
      ['import "@nilumi/contracts/src/index.ts";\n', /2307|2792|2882/],
    ]) {
      writeFileSync(join(directory, "consumer.ts"), source);
      // TS7 checks side-effect imports; request the same explicit behavior from classic compilers.
      const rejected = await run(process.execPath, [...args, "--noUncheckedSideEffectImports"], {
        capture: true,
        allowFailure: true,
        cwd: directory,
      });
      assert.notEqual(rejected.code, 0, `${kind} must reject negative fixture`);
      assert.match(rejected.stdout + rejected.stderr, diagnostic);
    }
    writeFileSync(
      join(directory, "consumer.ts"),
      'import * as Contracts from "@nilumi/contracts";\nimport * as ApiClient from "@nilumi/api-client";\nexport const names: string[] = [...Object.keys(Contracts), ...Object.keys(ApiClient)];\n',
    );
    console.log(
      `Public declarations and deliberate type/ambient/export errors verified with ${kind}.`,
    );
  }
}
export async function checkResolution() {
  const parent = join(root, ".cache/resolution");
  mkdirSync(parent, { recursive: true });
  const base = mkdtempSync(join(parent, "workspace with spaces "));
  copyWorkspace(base);
  const prepared = await preparedConfig();
  const owner = canonical(base);
  const hash = createHash("sha256").update(owner).digest("hex").slice(0, 8);
  const store =
    process.platform === "win32" ? `C:/pnpm/nv2-${hash}` : join(base, "node_modules/.pnpm");
  const local = {
    ...prepared,
    repositoryRoot: owner,
    virtualStoreDir: ensureOwnedStore(base, store),
  };
  mkdirSync(join(base, ".local"), { recursive: true });
  writeFileSync(join(base, ".local/workspace.json"), JSON.stringify(local));
  await run(prepared.pnpmExecutable, ["install", "--frozen-lockfile"], {
    cwd: base,
    env: workspaceEnvironment(local),
  });
  await run(process.execPath, ["tooling/scripts/tasks.mjs", "build"], {
    cwd: base,
    env: workspaceEnvironment(local),
  });
  const apiFixture = join(base, "apps/api/.setup03");
  const clientFixture = join(base, "packages/api-client/.setup03");
  mkdirSync(apiFixture, { recursive: true });
  mkdirSync(clientFixture, { recursive: true });
  writeFileSync(
    join(apiFixture, "node-consumer.mjs"),
    'import * as Contracts from "@nilumi/contracts";\nimport * as Server from "@nilumi/server";\nimport * as Db from "@nilumi/db";\nif (![Contracts, Server, Db].every(value => typeof value === "object")) process.exit(1);\ntry { await import("@nilumi/db/src/index.ts"); process.exit(1); } catch(error) { if(error.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") throw error; }\n',
  );
  writeFileSync(
    join(clientFixture, "node-consumer.mjs"),
    'import * as ApiClient from "@nilumi/api-client";\nif (typeof ApiClient !== "object") process.exit(1);\n',
  );
  await run(process.execPath, [join(apiFixture, "node-consumer.mjs")], { cwd: base });
  await run(process.execPath, [join(clientFixture, "node-consumer.mjs")], { cwd: base });
  await compilerConsumers(base);
  const app = join(base, "apps/client");
  const metadata = readJson(join(app, "package.json"));
  metadata.main = ".setup03/probe.tsx";
  writeFileSync(join(app, "package.json"), JSON.stringify(metadata, null, 2));
  mkdirSync(join(app, ".setup03"), { recursive: true });
  writeFileSync(
    join(app, "app.json"),
    JSON.stringify({
      expo: {
        name: "Nilumi SETUP-03 resolution probe",
        slug: "nilumi-setup03-probe",
        web: { bundler: "metro", output: "single" },
      },
    }),
  );
  writeFileSync(
    join(app, ".setup03/probe.tsx"),
    'import { registerRootComponent } from "expo";\nimport { Text } from "react-native";\nimport * as Ui from "@nilumi/ui";\nimport * as Contracts from "@nilumi/contracts";\nimport * as ApiClient from "@nilumi/api-client";\nimport { getClientConfig } from "../src/config/env";\nconst config = getClientConfig();\nfunction Probe() { return <Text>{[...Object.keys(Ui), ...Object.keys(Contracts), ...Object.keys(ApiClient), config.EXPO_PUBLIC_NILUMI_ENV].join(" ")}</Text>; }\nregisterRootComponent(Probe);\n',
  );
  const env = workspaceEnvironment(local, probeEnvironment());
  const secret = "NILUMI-PRIVATE-SENTINEL-DO-NOT-BUNDLE";
  // This synthetic inherited private value must not be referenced or appear in artifacts.
  env.NILUMI_API_DATABASE_URL = secret;
  const validationEnvironment = { ...env };
  delete validationEnvironment.EXPO_OFFLINE;
  await run(
    prepared.pnpmExecutable,
    ["--dir", "apps/client", "exec", "expo", "install", "--check"],
    { cwd: base, env: validationEnvironment },
  );
  const artifacts = [];
  for (const platform of ["android", "web"]) {
    const destination = join(base, `.cache/export-${platform}`);
    const exported = await run(
      prepared.pnpmExecutable,
      [
        "--dir",
        "apps/client",
        "exec",
        "expo",
        "export",
        "--platform",
        platform,
        "--output-dir",
        destination,
        "--source-maps",
        "external",
        "--max-workers",
        "2",
        "--no-bytecode",
      ],
      { cwd: base, env, capture: true, allowFailure: true },
    );
    assert.equal(
      exported.code,
      0,
      `${platform} export failed: ${exported.stdout}\n${exported.stderr}`,
    );
    assert.ok(!(exported.stdout + exported.stderr).includes(secret));
    const files = allFiles(destination);
    const maps = files.filter((path) => path.endsWith(".map"));
    assert.ok(maps.length > 0, "Expo must produce source maps");
    const sources = maps
      .flatMap((path) => readJson(path).sources)
      .map((value) => value.replaceAll("\\", "/"));
    for (const expected of [
      "packages/ui/src/index.ts",
      "packages/contracts/dist/index.js",
      "packages/api-client/dist/index.js",
    ])
      assert.ok(
        sources.some((value) => value.includes(expected)),
        `Missing ${expected} in ${platform} graph`,
      );
    assert.ok(
      !sources.some((value) =>
        /(?:packages\/(?:server|db)|apps\/(?:api|worker))\/(?:src|dist)\//.test(value),
      ),
      "Backend must not enter the bundle",
    );
    for (const path of files.filter((file) => /\.(?:js|map|html|json)$/.test(file)))
      assert.ok(
        !readFileSync(path, "utf8").includes(secret),
        "Private sentinel leaked into artifacts",
      );
    artifacts.push({
      platform,
      sourceMaps: maps.length,
      publicEntries: 3,
      backendSources: 0,
      privateSentinelAbsent: true,
    });
    console.log(`${platform} Expo export: actual public entries and synthetic TSX verified.`);
  }
  const evidence = {
    checkedAt: new Date().toISOString(),
    platform: process.platform,
    compilers: ["5.9.3", "6.0.3", "7.0.2"],
    nodeImports: "passed",
    artifacts,
    limitations:
      "Synthetic TSX/package entry resolution only; no shared UI rendering, APK, service or device qualification.",
  };
  writeFileSync(
    join(root, `docs/development/evidence/setup-05-2026-10-12/resolution-${process.platform}.json`),
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
}
