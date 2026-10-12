# Workspace standards

Eight private `@nilumi` packages use exact dependencies and explicit exports. See the ownership table in the plan. Source/manifest checks include all authored files, not only exported roots, so unreexported backend imports in public packages fail.

## Compilers and exports

All eight package selections currently target native TypeScript 7.0.2. Root classic 5.9.3 supplies AST and dependency-cruiser APIs; client/UI classic 6.0.3 supplies Expo tooling/comparison. Both build and typecheck read the committed selection map. Version-checked absolute launchers avoid the multiple `tsc` bins. Classic fallbacks require explicit reason and evidence; failures never trigger fallback retries.

Contracts/API-client emit portable ES2020 ESM/declarations with no ambient Node types. Server/DB/API/worker use ES2023 NodeNext and explicit Node types. UI exports source; the client extends Expo defaults. Node internal relative imports use `.js`. Public root exports reserve interfaces; empty roots implement no product behavior. DB migration config is private Node-only tooling, not a client contract.

Native builds run topologically. Classic declaration comparisons emit into ignored separate caches. TypeScript 6 comparisons use `stableTypeOrdering`; TS5 never sees that option. AST/dependency tools keep the classic API; unstable TS7 APIs and blanket overrides are unnecessary.

## Boundaries and privacy

Manifest validation detects unused forbidden edges. The classic AST extracts imports, erased types, reexports and literal dynamic imports from every source file. Package-level edges combine those sources and manifests; domain-path rules remain separate. Resolved dependency-cruiser targets map source/dist back to owners and catch file cycles/unresolved imports. Computed imports, deep cross-package imports, cross-package aliases and relative escapes fail.

Public packages cannot read Node globals or private env. The only permitted process reads are the two static client public accesses in its configuration module. Domain rules forbid DB/IO/framework/adapters/composition dependencies when real feature modules arrive. Package exports are not absolute filesystem security: Node/TS reject unexported bare subpaths; Metro may warn and fall back, so repository policy is enforced before bundling.

Biome uses its recommended preset plus application noConsole policy, with controlled tooling diagnostics. Each package inherits the root configuration and pins the same binary. Generated files/evidence are excluded. Formatting is explicit; checks do not rewrite files. Standard errors/logs must exclude request/private data and raw provider/SQL details.

## Dependency review

The metadata audit records selected/latest versions, engines, peers, integrity and exception reasons. Fresh-release exceptions are individually exact and documented. Expo determines its React/native family; classic compilers remain only for compatibility/API needs. Do not override transitive dependencies merely to change the displayed version. The inherited Expo dependency graph currently reports deprecated uuid 7.0.3; it remains an upstream-owned transitive selection, not an application direct dependency or a waived vulnerability check.

SETUP-03 tests infrastructure behavior and synthetic transforms. Tamagui configuration/rendering, real native builds, protected APIs, database privileges, physical devices and CI must pass their later checks.
