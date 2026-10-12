import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { root } from "../scripts/process.mjs";

const client = createRequire(join(root, "apps/client/package.json"));
const router = createRequire(client.resolve("expo-router/package.json"));
const query = createRequire(router.resolve("query-string"));
const decoder = query("decode-uri-component");
const queryString = router("query-string");

test("frozen client pins match the installed Expo SDK native compatibility matrix", () => {
  const expo = createRequire(client.resolve("expo/package.json"));
  const cli = createRequire(expo.resolve("@expo/cli"));
  const matrix = JSON.parse(
    readFileSync(
      join(dirname(client.resolve("expo/package.json")), "bundledNativeModules.json"),
      "utf8",
    ),
  );
  const manifest = client("./package.json");
  assert.equal(client("expo/package.json").version, manifest.dependencies.expo);
  for (const [name, version] of Object.entries({
    ...manifest.dependencies,
    ...manifest.devDependencies,
  })) {
    if (matrix[name])
      assert.equal(
        cli("semver").satisfies(version, matrix[name]),
        true,
        `${name} must satisfy the installed SDK's ${matrix[name]}`,
      );
  }
});

test("patched decoder preserves CommonJS, plus handling and multilingual query semantics", () => {
  assert.equal(typeof decoder, "function");
  for (const text of ["தமிழ்", "தமிழ் 😀", "a+b", "a/b?x=1", "\u0000"]) {
    assert.equal(decoder(encodeURIComponent(text)), text);
    assert.equal(queryString.parse(`name=${encodeURIComponent(text)}`).name, text);
  }
  assert.equal(decoder("a+b%2Bc"), "a b+c");
  assert.equal(queryString.parse("a+b=c+d")["a b"], "c d");
  assert.equal(queryString.parse("a=%EA", { decode: false }).a, "%EA");
  assert.deepEqual([...queryString.parse("a=one&a=two").a], ["one", "two"]);
  assert.deepEqual([...queryString.parse("a=one,two", { arrayFormat: "comma" }).a], ["one", "two"]);
  assert.equal(
    queryString.parseUrl("/shell?a=1#%E0%AE%A4", { parseFragmentIdentifier: true })
      .fragmentIdentifier,
    "த",
  );
  assert.throws(() => decoder(null), TypeError);
});

test("malformed UTF-8 retains tolerant decoding without recursive splitting", () => {
  for (const [input, expected] of [
    ["%", "%"],
    ["%G0", "%G0"],
    ["%C3%41", "%C3A"],
    ["%C3%A5%ab", "å%ab"],
    ["%ED%A0%80", "%ED%A0%80"],
    ["%F4%90%80%80", "%F4%90%80%80"],
    ["%FE%FF", "\uFFFD\uFFFD"],
    ["%41%FE%FF", "A\uFFFD\uFFFD"],
    ["%FF%FE%FF", "\uFFFD\uFFFD%FF"],
    ["%24%26%ab", "$&%ab"],
    ["%24%60%ab", "$`%ab"],
    ["%24%27%ab", "$'%ab"],
    ["%C2", "\uFFFD"],
    ["%2525%ab", "%25%ab"],
  ])
    assert.equal(decoder(input), expected);
});

test("malformed attacker queries finish inside an isolated bounded process", () => {
  const script = `
    const assert = require('node:assert/strict');
    const qs = require(${JSON.stringify(router.resolve("query-string"))});
    for (const token of ['%EA', '%ED%A0%80', '%F4%90%80%80', '%80', '%G0']) {
      const value = token.repeat(10000);
      assert.equal(typeof qs.parse('name=' + value).name, 'string');
      assert.equal(Object.keys(qs.parse(value + '=ok')).length, 1);
      assert.equal(qs.parse('name=' + value + ',ok', {arrayFormat:'comma'}).name[1], 'ok');
      assert.equal(typeof qs.parseUrl('/shell#' + value, {parseFragmentIdentifier:true}).fragmentIdentifier, 'string');
    }
    // Distinct runs must not cause one full-string replacement per run.
    const distinct = Array.from({length:100000}, (_, i) =>
      String(i).padStart(6, '0').split('').map(c => '%' + c.charCodeAt(0).toString(16)).join('') + '%G0'
    ).join('');
    assert.equal(qs.parse('name=' + distinct).name.length, 900000);
  `;
  const result = spawnSync(process.execPath, ["-e", script], {
    timeout: 10000,
    encoding: "utf8",
    windowsHide: true,
  });
  assert.equal(result.error, undefined, "malformed URL parsing must terminate within 10 seconds");
  assert.equal(result.status, 0, result.stderr);
});

test("xcode uses patched CommonJS UUID and retains its 24-character ID contract", () => {
  const expo = createRequire(client.resolve("expo/package.json"));
  const config = createRequire(expo.resolve("@expo/config-plugins/package.json"));
  const xcode = createRequire(config.resolve("xcode"));
  const uuid = xcode("uuid");
  assert.equal(xcode("uuid/package.json").version, "11.1.1");
  const project = config("xcode").project("synthetic.pbxproj");
  project.hash = { project: { objects: {} } };
  const ids = new Set(Array.from({ length: 100 }, () => project.generateUuid()));
  assert.equal(ids.size, 100);
  for (const id of ids) assert.match(id, /^[A-F0-9]{24}$/);
  assert.throws(() => uuid.v5("synthetic", uuid.v5.DNS, new Uint8Array(8), 4), RangeError);
});

test("Istanbul loads ordinary and extended YAML configuration without the sprintf dependency", async () => {
  const babel = createRequire(client.resolve("babel-jest"));
  const instrument = createRequire(babel.resolve("babel-plugin-istanbul"));
  const loader = createRequire(instrument.resolve("@istanbuljs/load-nyc-config"));
  assert.equal(loader("js-yaml/package.json").version, "4.3.2");
  const yaml = createRequire(loader.resolve("js-yaml"));
  assert.equal(yaml("argparse/package.json").version, "2.0.1");
  assert.equal("sprintf-js" in (yaml("argparse/package.json").dependencies ?? {}), false);
  const parent = join(root, ".cache");
  mkdirSync(parent, { recursive: true });
  const directory = mkdtempSync(join(parent, "security-nyc-"));
  writeFileSync(join(directory, "package.json"), '{"name":"synthetic-config","private":true}');
  writeFileSync(join(directory, "base.yaml"), "all: true\ninclude:\n  - 'src/**/*.ts'\n");
  writeFileSync(
    join(directory, ".nycrc.yaml"),
    "extends: ./base.yaml\nexclude: 'tests/**'\nextension: .ts\nreporter:\n  - text\n  - json\n",
  );
  const result = await instrument("@istanbuljs/load-nyc-config").loadNycConfig({ cwd: directory });
  assert.equal(result.all, true);
  assert.deepEqual(result.include, ["src/**/*.ts"]);
  assert.deepEqual(result.exclude, ["tests/**"]);
  assert.deepEqual(result.extension, [".ts"]);
  assert.deepEqual(result.reporter, ["text", "json"]);
});

test("Drizzle SQL generation and config transformation work with patched nested esbuild", () => {
  const db = createRequire(join(root, "packages/db/package.json"));
  const kitPath = db.resolve("drizzle-kit");
  const kit = createRequire(kitPath);
  const loader = createRequire(kit.resolve("@esbuild-kit/esm-loader"));
  const core = createRequire(loader.resolve("@esbuild-kit/core-utils"));
  assert.equal(core("esbuild/package.json").version, "0.28.2");
  const parent = join(root, "packages/db/.cache");
  mkdirSync(parent, { recursive: true });
  const directory = mkdtempSync(join(parent, "security-generation-"));
  writeFileSync(
    join(directory, "schema.ts"),
    'import { pgTable, integer, text } from "drizzle-orm/pg-core";\nexport const synthetic = pgTable("synthetic_security", { id: integer().primaryKey(), label: text().notNull() });\n',
  );
  const output = join(directory, "migrations");
  writeFileSync(
    join(directory, "config.ts"),
    `export default ${JSON.stringify({ dialect: "postgresql", schema: join(directory, "schema.ts").replaceAll("\\", "/"), out: output })};\n`,
  );
  for (let iteration = 0; iteration < 2; iteration++) {
    const result = spawnSync(
      process.execPath,
      [join(dirname(kitPath), "bin.cjs"), "generate", `--config=${join(directory, "config.ts")}`],
      {
        cwd: join(root, "packages/db"),
        encoding: "utf8",
        timeout: 30000,
        windowsHide: true,
        env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot },
      },
    );
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  const sqlFiles = readdirSync(output).filter((file) => file.endsWith(".sql"));
  assert.equal(sqlFiles.length, 1);
  assert.match(
    readFileSync(join(output, sqlFiles[0]), "utf8"),
    /CREATE TABLE "synthetic_security"/,
  );
});
