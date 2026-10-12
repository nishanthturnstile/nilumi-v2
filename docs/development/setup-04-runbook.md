# Running the SETUP-04 shells

All Windows pnpm commands below use the prepared repository launcher. Ordinary checks do not install or repair tools. If dependencies need preparation, run explicit `prepare` and `install --frozen-lockfile` as described in README.

```powershell
node tooling/scripts/pnpm-local.mjs run check
node tooling/scripts/pnpm-local.mjs run test
node tooling/scripts/pnpm-local.mjs run contracts:generate
node tooling/scripts/pnpm-local.mjs run contracts:check
node tooling/scripts/pnpm-local.mjs run typecheck:compat
node tooling/scripts/pnpm-local.mjs run check:resolution
node tooling/scripts/pnpm-local.mjs run check:linux
```

`check` includes explicit native7 compilation/typechecks, boundaries and generated-contract drift. `typecheck:compat` deliberately compares the isolated classic compilers; it is not an automatic fallback.

Copy each application's `.env.example` to its ignored `.env.local` and provide only its own process configuration. The public client getter accepts only `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_NILUMI_ENV`; production/pilot require HTTPS. Local URLs are examples, not production defaults. Never expose API/auth/worker/queue role URLs through Expo variables. API/worker startup reads inherited environment, so use an explicit shell environment or Node's `--env-file` with the intended process's file. Configuration diagnostics exclude rejected values.

Build backend packages before starting the two independent processes:

```powershell
node tooling/scripts/pnpm-local.mjs run build
node --env-file=apps/api/.env.local apps/api/dist/main.js
node --env-file=apps/worker/.env.local apps/worker/dist/main.js
```

API liveness is `GET /api/v1/health`. Readiness is `GET /api/v1/ready`; expect 503 until actual dependency/migration/grant checks arrive in SETUP-05. A worker `ready:false` heartbeat is expected. Valid role URLs here establish configuration shape, not credential/grant qualification or a database connection.

Build the emulator APK using clean CNG, then start the development client:

```powershell
node tooling/scripts/pnpm-local.mjs run android:dev-build
node tooling/scripts/pnpm-local.mjs --filter @nilumi/client exec expo start --dev-client --port 8082
```

`android:dev-build` targets x86_64 only for the emulator and checks that native sources are untracked before regeneration. It reuses the qualified `C:/nilumi-sdk` junction to the existing SDK, adds command-scoped Java 25 options and passes the plugin's short CMake staging property. It does not change global SDK/JVM settings. Build arm64 and qualify the actual phone separately before calling it physical-device acceptance. Expo Go is a diagnostic only.

Use explicit emulator selection for install, ADB reverse and the checked-in Maestro flow (`apps/client/maestro/component-check.yaml`). That flow opens the dev-client URL on port 8082, dismisses its delayed first-run prompt, enters synthetic text and presses the Nilumi button. Set ADB reverse for 8082 first. On this Windows host, Expo's `--localhost` bound Metro to IPv6-only `::1`; default binding plus explicit ADB reverse allowed the emulator's loopback URL. Check the listener before diagnosing a failed bundle as an app regression.

For web:

```powershell
node tooling/scripts/pnpm-local.mjs --filter @nilumi/client exec expo export --platform web
```

Serve `apps/client/dist` through a local HTTP server to inspect hydration. This is a static shell export, not a deployed PWA or a qualified iPhone installation. Keep all fonts/licences bundled; asset preparation is explicit, local-only after downloading the pinned sources, and never runs during checks.

Follow [the implementation notes](../implementation/setup-04-shells-and-contracts.md) and [validation report](setup-04-validation.md) for limitations and acceptance evidence. Product authorization, authentication cookies/CSRF, tenant cache isolation, queue recovery, provider calls and distribution remain later work.
