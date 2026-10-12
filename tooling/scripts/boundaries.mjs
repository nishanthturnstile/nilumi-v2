import { readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { relative, resolve } from "node:path";
import ts from "typescript";
import { pnpm } from "./pnpm-local.mjs";
import { readJson, root } from "./process.mjs";
import { filesBelow, manifest, ownership, packages, publicPackages } from "./workspace.mjs";

const builtins = new Set(
  builtinModules.flatMap((value) => [value, value.replace(/^node:/, ""), `node:${value}`]),
);
const normalized = (path) => path.replaceAll("\\", "/");
const serverDependencies =
  /^(?:pg|pg-boss|fastify|better-auth|drizzle-orm|nodemailer|@aws-sdk\/|@fastify\/|node:)/;
export function ownerOf(path, base = root) {
  const rel = normalized(relative(base, resolve(base, path)));
  return packages.find((pkg) => rel === pkg.path || rel.startsWith(`${pkg.path}/`))?.id ?? null;
}
export function inspectManifests(base = root) {
  const findings = [];
  const edges = new Map(packages.map((pkg) => [pkg.id, new Set()]));
  for (const pkg of packages) {
    const data = manifest(pkg, base);
    if (data.name !== pkg.name || data.private !== true || data.version !== "0.0.0")
      findings.push(`${pkg.id}:manifest-identity`);
    for (const dependency of Object.keys(data.dependencies ?? {})) {
      if (
        publicPackages.has(pkg.id) &&
        serverDependencies.test(dependency) &&
        !(pkg.id === "client" && dependency === "better-auth")
      )
        findings.push(`${pkg.id}:manifest-server-dependency:${dependency}`);
    }
    for (const [dependency, value] of Object.entries({
      ...data.dependencies,
      ...data.devDependencies,
      ...data.peerDependencies,
      ...data.optionalDependencies,
    })) {
      if (!dependency.startsWith("@nilumi/")) continue;
      const target = dependency.slice("@nilumi/".length);
      if (!ownership[pkg.id].includes(target) || value !== "workspace:*")
        findings.push(`${pkg.id}:manifest-boundary:${target}`);
      if (edges.has(target)) edges.get(pkg.id).add(target);
    }
  }
  return { findings, edges };
}
export function inspectSource(path, text, base = root) {
  const source = ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const owner = ownerOf(path, base);
  const publicCode = publicPackages.has(owner);
  const findings = [];
  const edges = new Set();
  const rel = normalized(relative(base, path));
  const publicGetter = rel === "apps/client/src/config/env.ts";
  const domainCode = /^packages\/server\/src\/modules\/[^/]+\/domain\//.test(rel);
  const add = (rule) => findings.push(`${rel}:${rule}`);
  const inspectSpecifier = (specifier) => {
    if (specifier.startsWith("@nilumi/")) {
      const parts = specifier.split("/");
      const target = parts[1];
      if (!ownership[owner]?.includes(target)) add(`source-boundary:${target}`);
      if (parts.length !== 2) add("unsupported-package-subpath");
      if (target) edges.add(target);
    } else if (specifier.startsWith(".")) {
      const target = ownerOf(resolve(path, "..", specifier), base);
      if (!target || target !== owner) add("relative-package-escape");
    } else if (specifier.startsWith("#") || specifier.startsWith("@/")) add("cross-package-alias");
    const clientSdk =
      owner === "client" && /^better-auth\/(?:client|react)(?:\/|$)/.test(specifier);
    if (
      publicCode &&
      (builtins.has(specifier) || (serverDependencies.test(specifier) && !clientSdk))
    )
      add("public-server-dependency");
    if (
      domainCode &&
      (builtins.has(specifier) ||
        serverDependencies.test(specifier) ||
        /(?:expo|react-native)/.test(specifier) ||
        /(?:adapters|config|main|use-cases)/.test(specifier) ||
        specifier === "@nilumi/db")
    )
      add("domain-dependency");
    if (
      /^packages\/server\/src\/modules\/[^/]+\/use-cases\//.test(rel) &&
      /(?:fastify|expo|apps\/|main\.)/.test(specifier)
    )
      add("use-case-dependency");
  };
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      inspectSpecifier(node.moduleSpecifier.text);
    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    )
      inspectSpecifier(node.argument.literal.text);
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require"))
    ) {
      const argument = node.arguments[0];
      if (argument && ts.isStringLiteralLike(argument)) inspectSpecifier(argument.text);
      else add("computed-module-import");
    }
    if (
      publicCode &&
      ts.isIdentifier(node) &&
      ["Buffer", "global", "__dirname", "__filename", "require", "module"].includes(node.text)
    )
      add("public-node-global");
    if (publicCode && ts.isIdentifier(node) && node.text === "process") {
      const envAccess = node.parent;
      const valueAccess = envAccess?.parent;
      let ancestor = node.parent;
      while (ancestor && !ts.isFunctionDeclaration(ancestor)) ancestor = ancestor.parent;
      const valid =
        publicGetter &&
        ancestor?.name?.text === "getClientConfig" &&
        ts.isPropertyAccessExpression(envAccess) &&
        envAccess.name.text === "env" &&
        ts.isPropertyAccessExpression(valueAccess) &&
        ["EXPO_PUBLIC_API_BASE_URL", "EXPO_PUBLIC_NILUMI_ENV"].includes(valueAccess.name.text);
      if (!valid) add("private-environment-access");
    }
    if (
      domainCode &&
      ts.isIdentifier(node) &&
      ["process", "global", "Buffer", "__dirname", "__filename"].includes(node.text)
    )
      add("domain-ambient-dependency");
    if (
      publicCode &&
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "globalThis" &&
      node.argumentExpression &&
      ts.isStringLiteralLike(node.argumentExpression) &&
      ["process", "Buffer", "require", "module"].includes(node.argumentExpression.text)
    )
      add("public-node-global");
    ts.forEachChild(node, visit);
  };
  visit(source);
  return { findings: [...new Set(findings)], edges };
}
export function validateWorkspace(base = root) {
  const { findings, edges } = inspectManifests(base);
  for (const pkg of packages) {
    const data = manifest(pkg, base);
    if (data.compilerOptions?.paths) findings.push(`${pkg.id}:cross-package-alias`);
    const config = readJson(resolve(base, pkg.path, "tsconfig.json"));
    if (config.compilerOptions?.paths || config.compilerOptions?.baseUrl)
      findings.push(`${pkg.id}:cross-package-alias`);
    if (data.imports) findings.push(`${pkg.id}:cross-package-alias`);
    for (const path of filesBelow(resolve(base, pkg.path, "src"))) {
      const inspection = inspectSource(path, readFileSync(path, "utf8"), base);
      findings.push(...inspection.findings);
      for (const target of inspection.edges) if (edges.has(target)) edges.get(pkg.id).add(target);
    }
  }
  for (const origin of edges.keys()) {
    const active = new Set();
    const walk = (node) => {
      if (active.has(node)) {
        findings.push(`${origin}:package-cycle`);
        return;
      }
      active.add(node);
      for (const target of edges.get(node) ?? []) {
        if (publicPackages.has(origin) && !publicPackages.has(target))
          findings.push(`${origin}:public-closure:${target}`);
        walk(target);
      }
      active.delete(node);
    };
    walk(origin);
  }
  return [...new Set(findings)];
}
export function inspectCruiseGraph(graph) {
  const findings = [];
  for (const module of graph.modules ?? []) {
    const owner = ownerOf(module.source);
    for (const dependency of module.dependencies ?? []) {
      const target = ownerOf(dependency.resolved ?? dependency.module);
      if (owner && target && owner !== target && !ownership[owner].includes(target))
        findings.push(`${owner}:resolved-source-boundary:${target}`);
      if (dependency.circular) findings.push(`${owner}:source-cycle`);
      if (dependency.couldNotResolve) findings.push(`${module.source}:unresolved-import`);
    }
  }
  return findings;
}
export async function checkBoundaries() {
  const findings = validateWorkspace();
  const inputs = packages.map((pkg) => `${pkg.path}/src`);
  const result = await pnpm(
    [
      "exec",
      "depcruise",
      "--config",
      ".dependency-cruiser.cjs",
      "--output-type",
      "json",
      ...inputs,
    ],
    { capture: true, allowFailure: true },
  );
  const graph = JSON.parse(result.stdout);
  findings.push(...inspectCruiseGraph(graph));
  if (result.code || findings.length)
    throw new Error(
      `Boundary check failed:\n${findings.join("\n")}\n${JSON.stringify(graph.summary?.violations ?? [])}`,
    );
  console.log(
    "Manifest, authored-source closure, AST policies and resolved dependency graph pass.",
  );
}
