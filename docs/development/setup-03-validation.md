# SETUP-03 workspace qualification

**Date:** 12 October 2026, Asia/Calcutta  
**Status:** Required Windows and fresh Linux workspace checks pass.  
**Plan:** [SETUP-03 v1.1](../implementation/setup-03-workspace-and-standards.md)

Eight private workspace packages, one application lock, process-specific pure configuration parsers, pinned Biome, compiler/dependency launchers and executable boundary policies are implemented. TypeScript **7.0.2 is selected for all eight packages**, with no fallback. Classic 5.9.3/6.0.3 remains isolated for compiler-API tools and comparison. Global Node/pnpm/SDK/JVM settings were not changed.

## Acceptance evidence

| Check | Windows | Fresh Linux |
|---|---|---|
| pnpm 12.11.2 strict install and frozen reinstall | Pass | Pass |
| Node 24.21.0 and version-checked native compiler routing | Pass | Pass |
| Biome and shared native7 compilation/typechecks | Pass | Pass |
| Manifest/source closure/AST/resolved dependency boundaries | Pass | Pass |
| Behavior tests | 17/17 | 17/17 |
| Classic5/6 compilation and comparison | Pass | Pass |
| Public declaration consumers under TS5/6/7 | Pass | Pass |
| Deliberate assignment, Node ambient and unexported-path errors | Rejected by each compiler | Rejected by each compiler |
| Built ESM imports under Node without TS loader | Pass | Pass |
| Expo dependency check and Android/web synthetic exports | Pass | Pass |
| Public entry source maps; no first-party backend code | Pass | Pass |
| Private synthetic sentinel absent from output/artifacts | Pass | Pass |
| Original 93 protected files, 5 staged blobs and index bytes | Unchanged | Matching copied baseline |

See [evidence](evidence/setup-03-2026-10-12/README.md), the metadata audit, per-platform resolution records and Linux execution log. Linux uses the immutable Node 24.21.0 bookworm-slim image, four CPUs and 4 GiB memory; dependencies are installed independently inside the disposable container. Windows node_modules/local env/native output is never mounted as Linux dependencies. The baseline's two permitted existing documents are the parent foundation plan and toolchain annotation.

## Execution findings and corrections

- The first old-manager `pnpm with` preparation hit a cached package-path lookup failure. Explicit retry prepared the verified exact native executable; routine commands use that cached path. An integrity-checked official native-artifact preparation path is also available and was exercised by the fresh Linux bootstrap.
- pnpm's exact release-age check required the already-qualified Zod 4.6.6 exception. The new dependency-cruiser 18.6.0 selector is explicitly reviewed and passes negative boundary qualification. Unused historical selectors are pruned; a subsequent frozen install synchronizes installed metadata. No maturity/peer policy was disabled.
- TypeScript 6 reports unexported side-effect imports with TS2882; the negative test recognizes that rejection alongside classic5/native7 diagnostics.
- Linux pnpm replaces its internal virtual-store directory on first install. Ownership records for internal stores now live under ignored `.local`, outside node_modules; external Windows stores retain their own marker. A regression test simulates replacement and verifies continued ownership.
- Generated Linux bootstrap code belongs under ignored cache, not the authored lint surface. The final fresh Linux run checks exactly the authored configurations/source.
- Public URL validation now catches URL-constructor errors and rejects embedded credentials without copying rejected inputs into diagnostics. Examples and CLI diagnostics remain process-specific and content-free.
- The AST policy confines the two public process reads to the client getter, rejects public Node globals and future domain ambient reads, and leaves approved Better Auth client SDK imports available to later client implementation while blocking backend APIs.

## Completion boundary and handoff

This establishes the workspace portion of foundation F03. It does not certify screens, Tamagui rendering, application startup, OpenAPI generation, database credentials/grants, APKs, physical devices, iPhone HTTPS/PWA or observed GitHub CI. Those remain SETUP-04–07. Screens 4.26.2 and test-renderer 1.3.0 remain later candidate pins, not installed/qualified runtime integrations here.

Begin SETUP-04 using the qualified workspace and the prior Windows short-path/CNG/JVM handoff. Preserve classic compiler APIs and explicit routing; application feature/transport implementations and actual native/device acceptance are still required.
