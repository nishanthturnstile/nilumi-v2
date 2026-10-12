# SETUP-04 — application shells and public contracts

12 October 2026. Implements the SETUP-04 work packages in the parent foundation plan, following `docs/core` and the SETUP-03 compiler, configuration and boundary policies.

Eight packages retain their existing ownership and private identities. Expo Router consumes UI, contracts and generated transport only. API and worker have separate composition roots; shared product services remain reserved for later work. No authentication, capture, tasks, sheets, feed, provider, database or queue handlers are introduced.

## Client

The official `expo-template-blank-typescript@57.0.29` provides the scaffold basis and development assets, adapted to `src/app` Router routes. Asset provenance records archive integrity and SHA-256 hashes. The app identity is deliberately `dev.nilumi.shell`, with `nilumi-dev` scheme and development branding; distribution ownership and production identity are unresolved later decisions.

Expo compatibility tooling installs the exact development client through a Windows adapter whose pnpm subprocess uses the repository launcher. CNG configuration and an authored Windows CMake staging plugin regenerate native sources; no generated Gradle/vendor files are edited. Native output remains ignored. The qualified SDK junction and Java options are command scoped and preserve existing options. Tamagui 3 retains the complete v6 configuration, overrides Nilumi radius/theme values and uses unstyled controls without an optimizing compiler.

The internal screen bundles licensed Nunito and Noto Sans Tamil faces, including exact 750 instances prepared with isolated fonttools 4.66.1 from pinned Google Fonts source. Text preserves script runs, grows without global scaling caps and accommodates Tamil line boxes. The input uses the bundled Tamil face for mixed editable content; per-run editable font styling is not provided by this shell. The contextual Phosphor flask uses separate fully opaque strong/ink paths. Catalogue colours retain the core document's native sRGB fallbacks for both themes.

Web ARIA props and native accessibility props are selected explicitly. Focus, disabled, loading and error examples are diagnostic fixtures. The health button exercises the real public health route when configured, with timeout/abort and safe unavailable text; no product API is mocked.

## API, worker and contracts

`buildApp` registers Zod validators/serializers, schema-generated OpenAPI, safe Pino logging, generated request IDs, no-store responses and Problem Details. `/api/v1/health` reports process liveness; `/api/v1/ready` reports readiness through an explicitly injected bounded dependency/migration/grant check. The default is unready. `main.ts` alone reads process configuration, listens and handles bounded shutdown.

The worker root independently parses its role-specific configuration, starts, emits content-free readiness heartbeats and shuts down within a bound. Its default readiness is false until SETUP-05 supplies real dependency checks. Timed preparation, readiness loss and idempotent shutdown are tested; no queue consumer or provider runs.

`contracts:generate` registers schemas in memory without a listener, environment reads or external connections. openapi-typescript uses the API package's isolated classic TypeScript peer; application compilation still routes through the selection map to native TypeScript 7. Generated JSON and client types are checked in as reviewable artifacts and excluded from formatting. `contracts:check`, also included in `check`, rejects byte-level drift. The openapi-fetch transport selects native `omit` versus web `same-origin` credentials and validates the health DTO at runtime.

## Verification and remaining gates

See [SETUP-04 validation](../development/setup-04-validation.md) and its evidence for observed platform results. Backend injection/loopback tests use synthetic inputs and never connect to a provider/database. Linux installs its own frozen dependencies in the pinned image. Native acceptance covers the emulator development shell, not signed distribution, physical Android, iPhone Safari/PWA, product accessibility or pilot readiness.

Historical SETUP-02/03 evidence, core documents and the WSL recovery copy remain untouched. SETUP-03's index snapshot predates the existing initial commit; SETUP-04 records the current index and all protected historical files separately. Tooling writes new evidence into SETUP-04 instead of overwriting SETUP-03.
