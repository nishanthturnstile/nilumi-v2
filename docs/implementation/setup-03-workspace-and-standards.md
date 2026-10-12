# SETUP-03 — Workspace, standards and current dependency qualification

**Version:** 1.1 · **Date:** 12 October 2026  
**Status:** Complete — Windows and fresh Linux workspace acceptance passed · **Baseline:** Nilumi v2.4  
**Owner:** Founder with Codex

## 1. Summary and outcome

Create a reproducible pnpm workspace with explicit package boundaries, safe configuration interfaces, pinned Biome tooling and Windows/Linux verification. Target TypeScript 7.0.2 for application typechecking and library compilation; retain classic TypeScript only for compiler-API tooling and comparisons. Use exact latest-compatible stable pins with documented exceptions. Application shells remain SETUP-04.

This is the reviewed version 1.1 approved for implementation on 12 October. Execution results are recorded separately in [SETUP-03 validation](../development/setup-03-validation.md).

## 2. Scope and preserved inputs

Include manifests, one application lockfile, compiler/export configuration, launchers, formatting/linting, dependency enforcement, environment parsers, tooling tests and documentation. Defer screens, endpoints, worker startup, auth, generated OpenAPI, database provisioning, Compose, native builds, devices and CI to SETUP-04–07.

Preserve the repository, five staged core documents and qualification evidence. No initial commit or remote exists. Historical probe locks stay immutable. Allowed existing-document edits are the parent foundation crosslink/status and toolchain annotations. The [preservation baseline](../development/evidence/setup-03-2026-10-12/preservation-baseline.json) covers existing files and index identity.

## 3. Dependency policy and selected versions

Select the latest stable release satisfying framework/runtime/peer constraints. Exact pins only; no blanket transitive overrides, prereleases, or suppressed peers. Refresh metadata before lock finalization; record incompatible newer releases and revisit triggers. Changed pins require new evidence.

| Component | Previous | Target |
|---|---|---|
| Application compiler | 5.9.3 / 6.0.3 | TypeScript 7.0.2 |
| pnpm | 12.9.1 | 12.11.2 |
| React Native Web | 0.21.2 | 0.21.4 |
| React types | 19.2.14 | 19.2.18 |
| Screens, SETUP-04 | 4.26.0 | 4.26.2 |
| Test renderer, SETUP-04 | 1.0.0 | 1.3.0 |

Retain Expo 57.0.27/template 57.0.29, Tamagui/core/config 3.0.3, React Query 5.104.2, Fastify 5.12.5, Zod 4.6.6, Swagger 9.9.2/scoped Zod provider 1.0.0, Better Auth/Expo 1.7.7, Drizzle ORM 0.45.4/Kit 0.31.11, pg 8.23.1, pg-boss 12.37.1, openapi-typescript 7.13.0/fetch 0.17.0, Biome 2.5.15, dependency-cruiser 18.6.0, tsx 4.23.15, Vitest 5.0.3/Vite 8.3.4, AWS S3 client 3.1149.0, Nodemailer 10.1.0, RNTL 14.1.0/Playwright 1.64.0, jest-expo 57.0.5/Expo Doctor 1.20.4. Install only packages actually consumed by this milestone.

Expo constraints retain React/DOM 19.2.3, RN/Metro 0.86.3, Reanimated 4.5.1, Worklets 0.10.1, Gesture Handler 2.32.0, safe areas 5.7.0, Babel 7.29.7 and future Jest 29.7.0 rather than unrelated newest majors. Keep Node 24.21.0/types 24.19.2. See [Expo matrix](https://docs.expo.dev/versions/latest/), [TypeScript release](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) and the execution dependency audit.

## 4. Workspace and technical design

Eight private `@nilumi/*` packages, version 0.0.0: client/API/worker under `apps`, server/DB/contracts/API-client/UI under `packages`. Client may depend on UI/API-client/contracts; API and worker on server/DB/contracts; server on DB/contracts; API-client on contracts. DB/contracts/UI have no Nilumi package dependencies. Internal edges use `workspace:*`; apps cannot import one another. Create useful directories only; reserved export roots must not imply product implementation.

Root classic TypeScript 5.9.3 supports AST/dependency tooling and later OpenAPI's ^5.x API contract. Root `@nilumi/typescript-native` aliases `npm:typescript@7.0.2`. Client/UI keep local classic 6.0.3; other packages keep 5.9.3 for comparison. Explicitly resolve the native alias's package.json/bin; never trust ambiguous `pnpm exec tsc`. Both build and typecheck consume a committed selection map, initially native7 for all eight packages. Any necessary fallback is explicit, evidence-backed and committed; no retry-on-failure fallback. TS6 comparisons pass stableTypeOrdering; TS5/shared configs do not.

Portable libraries use ES2020/DOM, types:[], ESM/declarations; Node packages use ES2023/NodeNext and explicit Node types. Client extends Expo defaults with no emit; UI has bundler/React JSX and source exports. Set rootDir/output/ambient types, strict/index/optional/casing/verbatim rules. Avoid removed TS7 options and deprecation suppression. Explicit package exports, .js Node relative imports, topological builds, no cross-package aliases.

Pin pnpm 12.11.2 with isolated layout, one lock, strict peers/engines/cycles, exact saves, reviewed script approvals/release-age policy, verifyDepsBeforeRun:error and pmOnFail:error. Windows commands always use a dependency-free Node launcher with owned short per-checkout store. Explicit prepare discovers the underlying native executable outside the workspace, removes COREPACK_ROOT, runs exact-version preparation, validates and caches the new executable path. Routine commands invoke the cached executable directly, without downloads or global switches. Use argument arrays/shell:false/hidden launch, propagate failure/interruption, reject foreign/stale stores. Linux prepares the exact manager separately. [pnpm with](https://pnpm.io/cli/with).

Pin Biome 2.5.15 per project with inherited configs; two spaces/LF/100 columns/double quotes/semicolons. Exclude evidence, generated/native/build/dependency/cache/local output. Add editor/Git standards without renormalization. Boundaries combine manifest validation, dependency-cruiser and AST policies. Inspect types/reexports/dynamic literals/all authored source; canonicalize source/dist ownership; reject cycles, unsupported deep imports, aliases/relative escapes/forbidden dependencies, including unreexported source. Public packages cannot access Node globals/private env. Future domain restrictions forbid IO/framework/composition dependencies. Node/TS export denial is distinct from Metro warning/fallback.

Pure config parsers accept records without loading env or connecting services. Client reads EXPO_PUBLIC_API_BASE_URL/EXPO_PUBLIC_NILUMI_ENV statically in app source. API uses NILUMI_ENV/HOST/PORT/LOG_LEVEL/NILUMI_API_DATABASE_URL/NILUMI_AUTH_DATABASE_URL; worker uses NILUMI_ENV/LOG_LEVEL/NILUMI_WORKER_DATABASE_URL/NILUMI_QUEUE_DATABASE_URL; migrator uses NILUMI_ENV/NILUMI_MIGRATOR_DATABASE_URL. Explicit modes development/test/pilot/production; API defaults loopback/3001 and log info. Examples have blank credentials. Reject invalid/placeholder/missing/role-mismatched values with name/code-only diagnostics. Actual grants are SETUP-05. Optional default .env.local, required explicit file, process values override files. Synthetic ordinary checks.

Commands: setup:check, lint, format, format:check, build, typecheck, typecheck:compat, boundaries, check, test, check:resolution, config:check. No fake-success future commands.

## 5. Work packages

| ID | Work | Depends on | Status |
|---|---|---|---|
| 03-A | Preservation baseline | SETUP-02 | Complete |
| 03-B | pnpm, manifests, audit, lock | 03-A | Complete |
| 03-C | Compiler qualification, exports, probes | 03-B | Complete |
| 03-D | Biome, boundaries, standards | 03-C | Complete |
| 03-E | Config interfaces and behavior tests | 03-C | Complete |
| 03-F | Docs and Windows/Linux acceptance | 03-D/E | Complete |

README/CONTRIBUTING/AGENTS/PR guidance explain commands, selection, ownership, synthetic fixtures and generated artifacts.

## 6. Verification and promotion gates

Native Windows and fresh pinned-Node Linux installs; never share Windows node_modules. Verify strict/frozen installs, exact compiler routing, TS7 positives/negatives, classic comparisons, declarations/ESM consumers TS5/6/7, loader-free Node runtime, ambient isolation, all forbidden edge forms, config failures/precedence/redaction, launcher paths/collisions/cache/failure/interruption and preservation.

Ignored temporary workspace copies get separate dependencies/stores and fixture-only Expo Android/web entries/config. Synthetic RN TSX and real public imports must resolve with source maps free of first-party backend code. Disable dotenv and strip inherited app variables/secrets; use private sentinel checks. These prove resolution/fixture transformation, not real UI/native/database/device readiness. Promote only on passing gates; evidence-backed map fallbacks cannot be described as TS7 acceptance.

## 7. Release and recovery

No deployment/migration/remote operations. No git init/reset/add/commit/renormalization/broad clean. Preserve historical evidence and WSL recovery. Recovery targets only introduced files and owned outputs, never foreign stores or original checkout cleanup.

## 8. Open items and assumptions

Latest-compatible stable is confirmed. No user decision blocks SETUP-03. Runtime qualification of updated pins remains execution work. Android identity/CNG, DB credentials/grants, GitHub/CI and iPhone HTTPS remain SETUP-04–07.

## 9. Independent review

A fresh reviewer checked version 1.1, identifying the Corepack bootstrap constraint, compiler-selection map and stableTypeOrdering comparison requirement. All were incorporated; no blocking planning finding remained. Review did not certify runtime behavior.

## 10. Handoff

Implementation and required gates are complete. See the validation report for execution discoveries and per-platform evidence; historical SETUP-02 evidence is unchanged. SETUP-04 follows for real application shells. All eight compiler selections remain native7; no fallback or global toolchain switch occurred.
