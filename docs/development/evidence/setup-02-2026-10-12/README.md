# Qualification evidence snapshot

These files record the isolated SETUP-02 probes on 12 October 2026. They are not application workspace manifests. See [the qualification report](../../setup-02-qualification.md) for results and limitations.

The Tamagui 2.7.7 client selection here is historical. Use the [Tamagui 3 client snapshot](../tamagui-3-2026-10-12/) as an overlay for the current qualified client. Keep the original backend/container evidence here.

The original runnable sources remain under `C:\Users\Nishanth Murugan\AppData\Local\Temp\nilumi setup 02-20261012`. To reconstruct them elsewhere:

- Create separate `backend/` and `client/` directories. Copy each prefixed manifest to its usual name: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `biome.json`, `tsconfig.json`.
- Restore `backend-*.ts`/`.mjs` to their unprefixed names. Restore `backend-generated.ts` as `generated.ts`, and restore the bootstrap SQL under `probe-migrations/0000_clumsy_harrier.sql`.
- Restore the client `app.json`, `jest.config.cjs`, `tamagui.config.ts`, `contract-probe.ts`, `web-probe.mjs`, `with-windows-cxx-staging.cjs` and `maestro.yaml`. Put `client-layout.tsx` at `app/_layout.tsx`, `client-screen.tsx` at `app/index.tsx` and `client-primitives.test.tsx` at `tests/primitives.test.tsx`. Copy `backend-generated.ts` to client `generated-contract.ts`.
- The official Expo blank TypeScript template 57.0.29 supplies the client assets referenced by app.json. Ignore generated `android/`, `ios/`, `.expo/`, `dist/` and `node_modules/`; use Expo CNG to regenerate Android.
- Restore `qualification-compose.yaml` as `compose.yaml`, using the unique disposable project name `nilumi-setup02-qualify`. Obtain PostgreSQL's loopback port with `docker compose -p nilumi-setup02-qualify port postgres 5432` and set `SETUP_PROBE_PG_PORT` for `infra-probe.mjs`.

Use pnpm 12.9.1 and frozen installs. Backend checks are `pnpm exec tsx probe.ts`, `pnpm exec tsc --noEmit`, `pnpm exec vitest run provider.test.ts` and, with disposable Compose running, `pnpm exec tsx infra-probe.mjs`. Client checks are `pnpm exec expo install --check`, `pnpm exec expo-doctor`, `pnpm exec tsc --noEmit`, `pnpm exec jest --runInBand`, `pnpm exec expo export --platform web` and `node web-probe.mjs`. Web runtime uses the installed Windows Edge browser through Playwright.

Java 25 Android builds in the Codex command host require the command-scoped socket-directory and native-access options recorded in the report. Windows native builds also use a short dedicated pnpm virtual store, a 32-character package-directory limit, the SDK junction and CNG-configured short CMake staging through `-PnilumiWindowsCxxDir=C:/nc/nq02`. No build-drive alias is required; that unsuccessful experiment was removed. Use OS-specific local paths when reconstructing rather than assuming the archived machine-specific paths are portable. Metro uses IPv4 loopback, ADB reverse and watch mode as documented in the report. Maestro is pinned at the per-user installation, with no cloud account required. Screenshots here are synthetic probe screens; no physical-phone screenshots or identifiers are retained.

Credentials in probe source/Compose are explicit synthetic, local-only fixtures. Do not reuse them outside disposable qualification.
