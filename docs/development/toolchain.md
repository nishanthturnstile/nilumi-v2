# Qualified toolchain inventory

**SETUP-03 workspace update, 12 October 2026:** application workspace acceptance now passes on Windows and fresh Linux. The project prepares pnpm **12.11.2** without replacing the installed global **12.9.1**. All eight packages use native TypeScript **7.0.2** for primary build/typecheck; classic **5.9.3/6.0.3** remains for compiler APIs and comparison. React Native Web **0.21.4** and React types **19.2.18** pass synthetic workspace export/type qualification. Screens **4.26.2** and test-renderer **1.3.0** remain SETUP-04 candidates. The tables below preserve the SETUP-02 probe matrix, not the application's complete updated selection. See [SETUP-03 validation](setup-03-validation.md) and its exact dependency audit.

Checked 12 October 2026. See [setup-validation.md](setup-validation.md) for host evidence and [SETUP-02 qualification](setup-02-qualification.md) for dependency/runtime checks. Original qualification manifests and lockfiles are retained under `evidence/setup-02-2026-10-12`; the current Tamagui 3 client snapshot is under `evidence/tamagui-3-2026-10-12`. These are isolated probe artifacts, not the application workspace.

## Installed host tools

| Tool | Observed version |
|---|---|
| PowerShell | 7.6.5 |
| Git | 2.55.0.windows.5 |
| Node | 24.21.0 |
| pnpm | 12.9.1 selected and pinned in qualification manifests; strict-peer and frozen installs pass |
| Temurin Java | 25.0.4.1+1-LTS |
| Android Studio build | AI-262.9437.185.2621.16467767 |
| SDK platform / Build-Tools | 36 rev 2 and 37.0 rev 2 / 36.0.0 and 37.0.0 |
| SDK command-line tools / Android CLI | 23.0.0 / 1.0.16500706 |
| ADB / platform-tools | 1.0.41 / 37.0.1-15733141 |
| Emulator | 37.2.12 |
| Maestro | 2.11.0; official Windows release checksum verified; Java 25 startup and explicit emulator hierarchy pass |
| Docker Desktop / Engine / Compose | 4.93.0 / 29.8.1 / 5.5.1 |
| WSL | 3.0.1.0 |

The legacy SDK manager delegates to the new Android CLI and downloaded its embedded CLI on the first inventory command. Prefer `android.exe --no-metrics sdk ...` for subsequent checks. No SDK platforms, Java installations or global PATH entries were changed.

## Selected client matrix

[Expo's SDK reference](https://docs.expo.dev/versions/latest/) specifies SDK 57, React Native 0.86, React 19.2.3 and Android compile/target API 36. The published `expo@57.0.27` archive's `bundledNativeModules.json` and official templates were inspected in a temporary directory, without installing project dependencies.

| Component | Selected version / published constraint |
|---|---|
| Expo / official default template | 57.0.27 / 57.0.29 |
| React / React DOM | 19.2.3 |
| React Native | 0.86.3 |
| React Native Web | ~0.21.0 |
| Expo Router / development client | ~57.0.25 / ~57.0.19 |
| Safe area context / screens | ~5.7.0 / ~4.26.0 |
| Secure store | ~57.0.4 |
| Tamagui / core / config | **3.0.3 / 3.0.3 / 3.0.3 selected**; latest stable checked today; complete v3 config resolves the missing `md` radius token that caused the first Android crash. Native/web interaction, 2 component tests and incremental Java 25 build pass; see [v3 qualification](tamagui-3-qualification.md) |
| Reanimated / Worklets / Gesture Handler | 4.5.1 / 0.10.1 / 2.32.0; pin Expo's versions to avoid incompatible auto-installed latest peers |
| System UI | 57.0.4 |
| Gradle / AGP / Kotlin | Generated wrapper 9.3.1 / React Native Gradle plugin AGP 8.12.0 / resolved Kotlin 2.1.20 |
| Native SDK configuration | compile/target 36, Build-Tools 36.0.0, minSdk 24, NDK 27.1.12297006; native build also installs Build-Tools 35.0.0 for dependency tooling |
| Client TypeScript | 6.0.3; Expo's compatibility check rejects the originally proposed 5.9.3 |
| Native tests | Jest 29.7.0, jest-expo 57.0.5, @react-native/jest-preset 0.86.3, @testing-library/react-native 14.1.0, test-renderer 1.0.0; Jest 30 conflicts with the preset's watcher dependency |
| Web tests / query / Biome | @playwright/test 1.64.0, @tanstack/react-query 5.104.2, @biomejs/biome 2.5.15 |

Registry latest React Native 0.87.1 and React 19.3.0 are outside this Expo pair and are not selected. Use Expo compatibility tooling for native dependencies and replace ranges above with exact resolved versions in the workspace/lockfile. Gradle startup alone does not qualify AGP/native plugins. React Native's [environment guidance](https://reactnative.dev/docs/set-up-your-environment) still recommends JDK 17; keep it as a conditional fallback after a failed or incompatible actual build, rather than switching globally now.

## Selected backend and repository matrix

Versions were checked against npm registry metadata, then qualified with strict-peer/frozen installs, compilation, contract checks and runtime probes. Backend compilation/API/Vitest checks pass on native Windows and a fresh Linux container; synthetic local auth/queue/storage/email integration passes on Windows against Linux services.

| Package | Selected version |
|---|---|
| fastify / zod / @fastify/swagger | 5.12.5 / 4.6.6 / 9.9.2 |
| @fastify/type-provider-zod | 1.0.0, from `github.com/fastify/fastify-type-provider-zod` |
| better-auth / @better-auth/expo | 1.7.7 / 1.7.7 |
| drizzle-orm / drizzle-kit / pg | 0.45.4 / 0.31.11 / 8.23.1 |
| pg-boss | 12.37.1; Node >=22.12.0 |
| openapi-typescript / openapi-fetch | 7.13.0 / 0.17.0 |
| Backend/codegen TypeScript | 5.9.3; current openapi-typescript requires ^5.x. Client uses 6.0.3 separately; generated types compile in both |
| @biomejs/biome | 2.5.15; pin exactly with biome.json when scaffolding |
| tsx / Vitest / Vite | 4.23.15 / 5.0.3 / 8.3.4 |
| @aws-sdk/client-s3 / nodemailer | 3.1149.0 / 10.1.0; synthetic local S3/SMTP compatibility probes only |

The scoped Fastify provider **1.0.0 is selected** after strict-peer installation, request/response validation, OpenAPI generation, generated-client compilation and live loopback HTTP checks passed on Windows and Linux. The core tech-stack reference now uses the scoped package. Its peers require Fastify ^5.5.0, Zod >=4.2.0 and Swagger >=9.5.1, satisfied by the pins above. The unscoped package is not installed.

Node 24.21.0 satisfies the inspected engines for React Native, pg, pg-boss and Biome. Better Auth/Drizzle/pg integration is tested with synthetic disposable data. The application workspace and product behavior still require their own checks.

## Selected Linux images

All image references below include immutable multi-platform index digests; Linux/amd64 execution was observed locally.

| Image tag | Digest |
|---|---|
| node:24.21.0-bookworm-slim | sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 |
| postgres:18.6-bookworm | sha256:afc7e2d441324c0388fa80c3d24f733b4194a4eb7f47dd8ee2b08eb1a24a647c |
| chrislusf/seaweedfs:4.48 | sha256:4e61d15fd35994cb1e43e1e553dff106794841fd9a99ade2fc8c8bfce4d7872d |
| axllent/mailpit:v1.31.5 | sha256:94f6b70c1436defae6799d9ac7ff0eeff9540465b842026d5cdb018f1c0234ea |

Disposable Compose probes passed PostgreSQL/auth/queue, S3 upload/read/delete and SMTP capture. Qualification containers use tmpfs; the actual development foundation must use named volumes as specified by SETUP-05. Existing WSL limits are retained. Start with PostgreSQL 512 MiB/1 CPU, SeaweedFS 1 GiB/2 CPUs and Mailpit 256 MiB/0.5 CPU; build with two Gradle workers and a 3 GiB heap, then revisit with real workload measurements.

## SETUP-05 application qualification

12 October 2026. The application now pins Drizzle ORM 0.45.4, Drizzle Kit 0.31.11, pg 8.23.1, pg-boss 12.37.1 (schema 45) and nodemailer 10.1.0, with exact `@types/pg` 8.23.1 and `@types/nodemailer` 8.0.2. The current dependency audit records 48 exact selections and their engines/peers/integrities. Existing Fastify 5.12.5, Zod 4.6.6 and scoped Fastify Zod provider 1.0.1 remain unchanged. Drizzle Kit brings upstream deprecated esbuild-kit loaders; Expo retains uuid 7.0.3. No incompatible transitive override was forced.

The optional development collector is `otel/opentelemetry-collector-contrib:0.162.0@sha256:39923a8e431bd1f57be82411999d389fcfe40857492e4365456d97a4c1f74be6`. Its stable release and multi-platform index digest were checked against the [official release](https://github.com/open-telemetry/opentelemetry-collector-releases/releases/tag/v0.162.0) and Docker manifest; Linux/amd64 validation, health and synthetic OTLP ingestion pass. It has no external exporter or application SDK auto-instrumentation.

See [SETUP-05 validation](setup-05-validation.md), [the runbook](setup-05-runbook.md) and [its new evidence](evidence/setup-05-2026-10-12/README.md) for actual runtime grants, dependency reachability, readiness and restart recovery. The earlier probe matrices remain historical evidence, not product readiness.

## SETUP-06 test and artifact tooling

12 October 2026. Backend Vitest **5.0.3** / Vite **8.3.4**, Playwright **1.64.0**,
Jest / Babel Jest / Jest globals **29.7.0**, jest-expo **57.0.5**, native Jest preset
**0.86.3**, RNTL **14.1.0**, and test-renderer **1.2.0** are exact workspace pins.
The 58-selection audit lives in SETUP-06 evidence. Vitest 5.0.4 was published today
and fails the existing maturity policy; no age exception was forced. Renderer
1.3.x requires reconciler 0.34 / React 19.3, outside Expo 57; 1.2.0 uses reconciler
0.33 / React 19.2. Strict peers remain enabled. Jest 30 still conflicts with the
Expo preset's Jest 29 watcher family. Revisit these constraints with compatible
upstream families, not transitive overrides.

OpenAPI compatibility uses oasdiff **1.33.0**, explicit checksum-verified preparation,
and warning-or-higher rejection. Its release and platform archive checksums are
committed in `tooling/contracts/checker.json`; unchanged/removal qualification and
byte-drift output are retained. Action versions **checkout 7.0.1**, **setup-node
7.1.0**, **upload-artifact 7.0.2**, and **setup-java 6.0.1** were resolved from their
official release tag objects and pinned to full commit SHAs. Linux CI targets
Ubuntu 24.04; Windows targets Windows 2025. Node/pnpm/native7/Biome and runtime
image digests remain the qualified selections above. Android uses Temurin
**25.0.4.1+1**, clean generated Gradle **9.3.1**, API 36, Build-Tools 36.0.0/35.0.0,
NDK 27.1.12297006 and two workers/3 GiB heap. Local Android clean build passes;
real GitHub qualification is recorded separately in setup-validation.md.
