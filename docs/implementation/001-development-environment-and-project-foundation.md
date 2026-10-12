# Nilumi implementation plan: development environment and project foundation

**Plan ID:** SETUP-001 · **Version:** 1.4 · **Date:** 12 October 2026
**Status:** SETUP-01/02 host qualification and SETUP-03 workspace acceptance passed; SETUP-04 shells/contracts implemented and qualified; SETUP-05–07 not started
**Owner:** Founder with Codex · **Requirements baseline:** Nilumi v2.4
**Format:** [Implementation-plan template](IMPLEMENTATION-PLAN-TEMPLATE.md)

## 1. Summary and outcome

Prepare this Windows machine and one Nilumi monorepo for reproducible Android and web/PWA development, backend development, device testing and Linux container builds. Finish with a running application shell, API health endpoint, worker startup, local dependencies, generated contract smoke check and passing foundation checks. The sign-in → household → capture → confirmation → saved record → handoff journey belongs to the following implementation plan.

**Recommendation:** use Windows-native Git, Node, pnpm, Metro, Android SDK/ADB, editor and Codex execution for the primary checkout. Keep WSL2 as Docker Desktop's Linux backend and for occasional Linux diagnostics. Verify deployment compatibility through Linux containers and Linux CI. This is a development-workflow recommendation; production remains Linux VM + Docker Compose through Dokploy.

The reason is this project's combination of Android builds, a Windows emulator, a USB-connected Android phone and agent-assisted device testing. Keeping those tools together reduces filesystem, networking and ADB bridging work. WSL2 remains viable; agent device access does not inherently require moving the source. Microsoft's guidance is to keep files on the filesystem native to the tools that build them. [Microsoft filesystem guidance](https://learn.microsoft.com/en-us/windows/wsl/filesystems).

Use one repository with separate client, API and worker applications. Use pnpm workspaces directly; add a task scheduler such as Turborepo only if measured build times justify it. Share backend application services and public contracts while enforcing a boundary between client-safe code and server code.

## 2. Scope

### Included

- Host inventory, Windows toolchain, Android emulator and both available physical devices.
- A verified Codex workflow for editing/running the project and an Android screenshot/input test where the active tools support it.
- Safe transition from the current WSL checkout to a Windows checkout, preserving existing work.
- Repository structure, package ownership, coding standards, dependency boundaries and contributor/agent guidance.
- Expo Android/web shell and representative custom-design primitives; Fastify/API and separate worker shells.
- Docker Compose local PostgreSQL, SeaweedFS and Mailpit; optional local observability profile.
- Initial database/schema/role bootstrap and reviewed release-migration mechanism, without implementing product tables or product authorization flows.
- Runtime configuration, isolated test transports, OpenAPI generation, testing entry points and CI/build/release scaffolding.
- Developer runbook, troubleshooting, recorded tool versions and setup acceptance evidence.

### Follows in later plans

Product sign-in and recovery, household membership/consent, captures, extraction, confirmation, records, RLS policies on actual product tables, handoffs, notifications, grounded Q&A, offline persistence and deletion/exit implementations. No live model/Sarvam/MSG91/Resend calls, payment integration, production rollout or real-family data in this setup milestone. Signing for distribution, OTA updates, pilot backup/restore and full observability qualification also follow before their relevant release gates.

The [product calendar](../core/product-plan.md#section-14-2) already includes an early vertical-slice milestone. This plan supplies its environment/foundation prerequisite; it does not change the product calendar into a new deadline or waive any [release gate](../core/requirements-and-features.md#section-12-2).

## 3. Inputs and traceability

### Inspected state

The table below preserves the pre-restart inspection history. **Post-restart validation, 12 October:** this chat now executes Windows-native PowerShell in the Windows checkout. Platform 36 is installed; Docker runs a Linux container; the existing API 37 emulator boots with WHPX; the authorized Pixel 8 is reachable through native ADB. All seven documents and staged entries match the retained WSL recovery copy. Gradle 9.3.1 from the Expo 57 template starts under Java 25; actual APK/native-module qualification remains pending. See [setup validation](../development/setup-validation.md) and [candidate toolchain matrix](../development/toolchain.md) for evidence and remaining gates. Historical statements that this chat still runs in WSL or that Platform 36 is missing no longer describe the active host.

| Item | Evidence through 12 October 2026 | Implication |
|---|---|---|
| Current execution | WSL2 kernel; checkout `/home/dev/dev/projects/nishanth/nilumi-v2` | This chat currently executes Linux commands; installing Windows tools does not automatically change its execution host |
| Source | Five core Markdown files plus this setup plan and its reusable template; no application manifests | Add foundation code later; retain core documents as authority |
| Windows checkout | Founder placed the repository at `C:\Users\Nishanth Murugan\projects\nishanth - projects win\nilumi-v2`; all seven Markdown files, Git `HEAD` and staged index matched the WSL copy during validation | Transfer content verified; native Codex execution and runtime qualification still pending; retain the WSL recovery copy |
| Git | Existing `.git`, branch `main`, five core files staged, no commits, no configured remote | Preserve the index and files; do not reinitialize or assume a cloneable history already exists |
| Linux Node/pnpm | Node `v24.21.0`, pnpm `12.9.1` | These are WSL installations, not evidence of a Windows-native toolchain |
| Windows | 64-bit OS build `10.0.26300`; approximately 31 GiB reported physical memory | Emulator plus lean containers is a reasonable starting workload; disk/CPU/GPU/virtualization still need verification |
| Windows tools | Node `24.21.0` installation found under the Windows Node version manager; Git, Android Studio, ADB, emulator and Docker files present; Temurin `jdk-25.0.4.101-hotspot` installed | Installation evidence only; executable readiness/version commands did not return usable results from the current WSL session; recheck in fresh native PowerShell after restart |
| Saved environment | Machine `ANDROID_HOME` points to the SDK under the founder's Windows profile; `JAVA_HOME` points to JDK 25; saved PATH contains Node-manager, Git, Java and Android entries | Reopen applications after restart and verify variable expansion and actual executable resolution; do not treat the current inherited WSL environment as proof of missing installations |
| Android SDK/emulator | Platform `android-37.0`, Build-Tools `36.0.0` and `37.0.0`, command-line tools and an API 37 AVD configuration found; API 36 platform not found | Founder will add SDK Platform 36; download completion, licenses, emulator boot/acceleration and device connection remain unverified |
| Restart | Founder intends to restart the machine after preparing tools | No restart performed by the agent; startup, Docker engine and native tool checks follow the restart |
| Devices | Founder confirmed Android phone and iPhone | Require Android USB/device checks and actual iPhone Safari/PWA checks |

### Requirement mapping

| Source | Foundation work | Evidence now; remaining feature evidence later |
|---|---|---|
| [Tech stack](../core/tech-stack.md#section-12-1-stack) | SETUP-02–06: selected tools and process boundaries | Version manifest, compilable packages, Linux images; production qualification remains later |
| [API contract, J14](../core/architecture.md#section-11-14) | SETUP-04/06: schema → OpenAPI → generated client | Health DTO validation and generation/drift checks; protected auth, commands and SSE later |
| [Database contract, J15](../core/architecture.md#section-11-15) | SETUP-05: schemas, roles, restricted startup and migration commands | Role/bootstrap smoke evidence; actual product RLS and transaction race suite later |
| [Client architecture](../core/architecture.md#section-11-13) and [design reference](../core/DESIGN-SYSTEM.md) | SETUP-04/07: native/web shell and catalogue primitives | Tamil/Latin, scaling, focus and device smoke checks; complete design library later |
| [Operations, J12](../core/requirements-and-features.md#section-10-11) | SETUP-05: Mailpit and explicitly local test transports | No real SMS/email/model sends in setup; delivery/processor qualification later |
| A1/A2, B1, C1/C2, D1, E1 in [requirements](../core/requirements-and-features.md#section-10) | Foundation enables the next journey | Not implemented or counted complete by this setup plan |

## 4. Decisions and technical design

### 4.1 Development host and device access

| Concern | Primary arrangement |
|---|---|
| Source, package install, Metro and host API/worker development | Windows local filesystem, PowerShell and Windows-native executables |
| Android builds and emulator | Windows Android Studio/SDK, JDK, Gradle wrapper and Windows Hypervisor Platform |
| Physical Android | Windows ADB over USB initially; wireless debugging optional after USB works |
| PostgreSQL/storage/email | Linux containers through Docker Desktop's WSL2 backend, named volumes, host-published loopback ports |
| Linux compatibility | Linux CI and container builds; no assumption that passing Windows tests proves deployment compatibility |
| iPhone | Real Safari and installed PWA over a trusted HTTPS development origin; native iOS is outside P1 |

Use the founder's Windows checkout at `C:\Users\Nishanth Murugan\projects\nishanth - projects win\nilumi-v2`. Keep paths correctly quoted because this location contains spaces; verify build tools and generated paths during qualification. There is no need to relocate solely because spaces exist. Avoid OneDrive, UNC build paths and installing dependencies with Linux Node under `/mnt/c`. Optional WSL work must use a separate Linux checkout with its own dependencies; exchange changes through Git, never share `node_modules` or generated native directories across operating systems. Retain the original WSL copy until native setup passes and a recoverable Git baseline exists. [Microsoft filesystem guidance](https://learn.microsoft.com/en-us/windows/wsl/filesystems).

Use Docker Desktop's existing WSL2 engine rather than installing a second Docker daemon inside Ubuntu. Select Linux containers and verify engine/Compose readiness. Keep database/storage state in named volumes rather than source-folder bind mounts. [Docker WSL2 backend](https://docs.docker.com/desktop/features/wsl/).

Codex supports Windows-native PowerShell execution and WSL2 execution. After transition, open the Windows checkout as a native project and verify the actual command environment. Maintain development servers in a supported persistent terminal/session and test that they survive individual agent commands. Native execution is supported; emulator/phone GUI access depends on the installed control tools and permissions and must be demonstrated, not assumed. [Official OpenAI Windows guidance](https://learn.chatgpt.com/docs/windows/windows-sandbox), [WSL guidance](https://learn.chatgpt.com/docs/windows/wsl).

For Android, first qualify explicit-device ADB screenshots, app launch, input and logs; add one Maestro flow for the shell. Maestro documents direct Windows CLI installation, so WSL port bridging is a fallback. Optional `scrcpy` mirrors the USB phone in a Windows window for human review and, where available, desktop computer-use tooling. Neither mirroring nor successful ADB discovery proves an agent can control that window; qualify the active integration separately. [Maestro installation](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli), [scrcpy](https://github.com/Genymobile/scrcpy).

Windows does not provide Apple's native iOS Simulator. Playwright WebKit is useful browser coverage but does not certify iPhone Safari/PWA behavior. Use the available iPhone for manual setup checks; later automated iPhone browser access may need additional tooling/another host. A Mac is not required for this plan's Android + iOS web targets. [React Native environment guidance](https://reactnative.dev/docs/set-up-your-environment).

### 4.2 Toolchain and version policy

| Tool | Setup policy |
|---|---|
| Node | Selected Node 24 LTS; choose a supported exact patch at execution and use it on Windows, Linux CI and container images |
| pnpm | One compatible stable version in root `packageManager`; one committed workspace lockfile; frozen installs in CI |
| Android Studio/SDK | Retain installed SDK 37 and Android 17 emulator; add SDK Platform 36 for Expo's documented default build. Qualify command-line tools, licenses, native build and emulator separately |
| Java | JDK 25 is installed; inspect the generated Gradle/Android Gradle Plugin and native-module compatibility and test the build before requiring a different JDK. JDK 17 remains the documented React Native fallback |
| Expo/React Native/React | Qualify the current stable Expo release and its supported React/React Native pair together; use `expo install` for Expo/native dependencies |
| Native generation | Expo CNG/config plugins; generate Android locally, keep generated native directories ignored, no undocumented edits inside them |
| UI | Tamagui without its optional compiler initially; verify compatible peer dependencies and basic Android/web rendering before expanding |
| Backend | Selected Fastify, Zod, OpenAPI provider, Better Auth/Expo adapter, Drizzle/Kit/`pg` and pg-boss versions qualified together |
| Containers | Explicit supported versions and recorded digests for Node/PostgreSQL/SeaweedFS/Mailpit; no `latest` runtime tags |
| Repository tools | Exact pinned Biome and test/code-generation tools; Node-compatible stable releases |

Expo's current reference lists SDK 57 / React Native 0.86 / React 19.2.3 with Android compile/target SDK 36. Treat that as the initial compatibility candidate, and verify stable release metadata plus Tamagui/native-module support during setup; do not independently upgrade React Native. Record the qualified matrix in the developer runbook. Java 17 is the current React Native setup recommendation, subject to the chosen build toolchain. [Expo SDK reference](https://docs.expo.dev/versions/latest/), [React Native setup](https://reactnative.dev/docs/set-up-your-environment).

**Compatibility clarification, 12 October:** Android runtime version, compilation SDK and build JVM are separate choices. An app compiled against API 36 can be tested on Android 17; Android applications are generally forward-compatible, subject to actual runtime testing. Keep the existing API 37 AVD rather than requiring a replacement API 36 emulator. [Android forward compatibility](https://developer.android.com/guide/topics/manifest/uses-sdk-element#fc).

SDK 37 is not categorically unsupported by Expo: `expo-build-properties` exposes compilation/target SDK overrides and its current example uses compile SDK 37 with target SDK 36. Android Gradle Plugin 9.2 documents API 37 support. Use the Expo-generated defaults initially, with SDK Platform 36 available; qualify any SDK override against the selected Gradle/plugin/native libraries separately rather than automatically upgrading the whole build chain. Installing a newer platform does not replace an explicitly requested older platform. [Expo build properties](https://docs.expo.dev/versions/latest/sdk/build-properties/), [Android Gradle Plugin compatibility](https://developer.android.com/build/releases/agp-9-2-0-release-notes).

Gradle supports running on Java 25 from version 9.1.0. This does not certify all React Native/Expo native-module plugins. Inspect the actual generated wrapper/plugin versions and run a clean Android build with the installed JDK 25 before declaring it incompatible. If the generated toolchain or modules require another JVM, install JDK 17 alongside it and select the qualified build JDK explicitly; align CLI and Android Studio Gradle JVM settings. No Java uninstall or global JDK switch is authorized merely by this documentation update. [Gradle Java compatibility](https://docs.gradle.org/current/userguide/compatibility.html), [React Native JDK guidance](https://reactnative.dev/docs/set-up-your-environment).

Use the Microsoft Windows Hypervisor Platform for the emulator, preserving WSL2/Hyper-V compatibility. Verify BIOS virtualization and `emulator -accel-check`. Do not follow old HAXM instructions or disable Hyper-V to install an alternate emulator driver. Android recommends WHPX and is retiring AEHD at the end of 2026. [Android emulator acceleration](https://developer.android.com/studio/run/emulator-acceleration).

Pin dependencies when the compatibility smoke checks pass. Prefer current stable compatible releases over preview versions. Record reviewed exceptions and required install/build scripts using settings supported by the pinned pnpm version; do not copy old pnpm v10 settings into a newer toolchain. Install only dependencies needed by this milestone and the initial compatibility checks. [pnpm settings](https://pnpm.io/settings).

The baseline names `fastify-type-provider-zod`, while current Fastify Type Providers documentation lists `@fastify/type-provider-zod` and other pages still name the unscoped package. Resolve package provenance, availability and Swagger/Zod compatibility during SETUP-02; pin one provider and update the exact package references in the core docs if necessary. This does not reopen the Zod/Fastify/OpenAPI architecture. [Fastify Type Providers](https://fastify.dev/docs/latest/Reference/Type-Providers/), [current unscoped provider documentation](https://github.com/turkerdev/fastify-type-provider-zod).

### 4.3 Repository structure

Use one private application repository, recommended on GitHub for CI, with independent application images/builds from the same revision. Remote account/name remains an execution input. Shared internal packages remain private and use `workspace:*`. Do not split client/API/worker into separately versioned repositories during the pilot.

The following is the target layout, not a claim these files already exist:

```text
nilumi-v2/
  apps/
    client/
      src/app/              # Expo Router routes/layouts only
      src/features/         # feature screens, hooks, local presentation
      src/platform/         # .native/.web transports and platform adapters
      src/providers/        # UI, query and session presentation providers
      tests/                # outside the Router route directory
      assets/               # fonts, icons, splash assets, license notices
      app.config.ts
    api/
      src/app.ts            # buildApp factory, independently testable
      src/main.ts           # startup/shutdown and dependency composition
      src/plugins/          # config, logging, auth integration, HTTP concerns
      src/routes/           # HTTP adapters to backend use cases
    worker/
      src/main.ts           # separate process and graceful shutdown
      src/handlers/         # queue adapters to the same backend use cases
  packages/
    server/src/
      modules/              # product modules added with each feature
      adapters/             # provider implementations and composition helpers
    db/
      src/schema/           # Drizzle auth/app definitions added when needed
      src/transactions/     # scoped wrappers added with domain persistence
      migrations/           # reviewed immutable SQL + Drizzle metadata
      bootstrap/            # role/schema provisioning, separate from runtime
    contracts/src/          # public Zod DTOs, safe errors and SSE payload schemas
    api-client/src/
      generated/            # OpenAPI-generated TS, never hand-edited
      transport/            # fetch injection and safe error handling
    ui/src/                 # Nilumi tokens and custom primitive components
  tooling/
    scripts/                # cross-platform Node scripts
    typescript/             # shared strict base + Node/Expo-specific settings
  infra/
    compose/                # local dependencies and app-container smoke profile
    docker/                 # independently built API/worker/web images
  tests/
    integration/            # DB/queue/contract foundation checks
    e2e/web/                # Playwright
    e2e/android/            # Maestro flows
    fixtures/               # synthetic data only
  docs/
    core/                   # existing authoritative documents
    implementation/         # this template/plan and later feature plans
    development/            # setup, commands, version matrix, troubleshooting
    decisions/              # short additional ADRs; reference core contracts
    contracts/              # reproducible OpenAPI document
  .github/workflows/
  .github/PULL_REQUEST_TEMPLATE.md
  AGENTS.md
  README.md
  CONTRIBUTING.md
  .editorconfig
  .gitattributes
  .gitignore
  biome.json
  package.json
  pnpm-workspace.yaml
  pnpm-lock.yaml
```

Create directories when they contain useful code or documentation; do not populate every future module with empty layers. `apps/client` serves both Android and responsive web/PWA. A separate Next.js/web application is unnecessary for the selected stack. Expo supports pnpm workspaces and automatic Metro monorepo configuration. Start with isolated pnpm dependencies, qualify native builds, and document a hoisted fallback only if a real library incompatibility requires it. Keep one React/native-module version and explicit peer dependencies. [Expo monorepos](https://docs.expo.dev/guides/monorepos/).

### 4.4 Boundaries and design patterns

| Boundary | Rule |
|---|---|
| Client | Imports `ui`, `api-client` and client-safe `contracts`; never `server`, `db`, API/worker entry points or server configuration |
| API and worker | Composition roots wire infrastructure; HTTP/queue handlers validate/map inputs and invoke shared use cases |
| Server modules | Organize by product feature; domain functions express deterministic rules; use cases coordinate authorization, transactions and adapters |
| Persistence | Drizzle schema/SQL and transaction helpers in `db`; repositories receive the active transaction rather than using a global pool |
| Provider adapters | Small explicit interfaces where storage, email, SMS, AI/speech and push cross the application boundary; create only when needed |
| Contracts | Public request/response/event schemas, never database-row exports or unrestricted internal types |
| API client | Generated types + `openapi-fetch`; platform fetch/cookie details injected; feature-specific TanStack Query hooks stay near client features |
| UI | Nilumi tokens/recipes own visuals; components receive data/callbacks and have no authority over household permissions |

Use feature modules with explicit dependency injection through constructors/factories or function arguments. Avoid a generic dependency-injection container, generic base repository, event bus, CQRS framework or speculative service layers. A small use case may be one function. Domain rules must be usable by both API and worker without importing HTTP or Expo. Enforce import boundaries through package exports and a pinned dependency-graph check, such as dependency-cruiser, with cross-package and domain-subtree rules.

Use React hooks/composition, TanStack Query for server state and local component state for transient presentation. Add no Redux/global-state framework without an actual need. Keep platform adaptation in `.native.ts(x)` / `.web.ts(x)` modules and narrow interfaces; share the visual recipes. Route files remain small and contain no backend business logic.

These patterns operationalize the existing [application/database boundaries](../core/architecture.md#section-11-11); they do not change domain invariants, visibility, deadlines, exit rights or confirmation rules.

### 4.5 Coding and repository standards

- TypeScript strict mode, `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`; separate Node and Expo compiler settings. Use `unknown` at external boundaries, validated schemas and narrow public exports. ESM for backend packages; retain Expo-required configuration-file formats.
- Biome owns formatting, import organization and linting for supported languages. Pin it in this repository and commit `biome.json`; all workspace projects inherit the root configuration. Avoid overlapping ESLint/Prettier formatters. Validate unsupported SQL/YAML/Markdown using their relevant checks, not assumptions about Biome coverage. [Biome language support](https://biomejs.dev/introduction/language-support/).
- `camelCase` functions/values, `PascalCase` React components/types, `snake_case` database objects and the agreed API wire names. Match filenames/import case exactly; use LF text through `.gitattributes` with exceptions for Windows-native scripts where needed.
- No unhandled promises, silent catch-and-success, unrestricted non-null assertions or broad `any`. Exceptions need a narrow explanation; avoid large suppression blocks. Use `AbortSignal`, bounded I/O timeouts and clear expected-failure mapping at network boundaries.
- Validate process-specific environment variables once at startup. Backend secrets never enter `EXPO_PUBLIC_*`, mobile/web bundles or shared configuration exports. Redact cookies, OTPs, tokens, household content and provider payloads from routine logs; use request/operation IDs.
- Keep root/workspace scripts portable using Node and pnpm rather than Bash-only command chains. Use the committed Gradle wrapper for Android builds, not a globally selected Gradle version.
- Co-locate focused unit/component tests outside Router's route directory. Test meaningful behavior and risky boundaries; avoid implementation-mirroring tests or snapshot-only assertions. Treat generated code/assets as generated and exclude them from manual formatting rules where appropriate.
- Trunk-based Git: `main`, short branches, coherent reviewable changes, required CI where remote capabilities allow it, no force-push to `main`. PR description states problem/result and validation; migrations/contracts/platform effects receive explicit review. No publication of internal packages.
- Commit lockfiles, migrations, template, contributor/agent instructions and configuration. Ignore build outputs, generated native folders, local databases/certificates, test screenshots/logs, secrets, keystores and local agent state. Preserve licensed font/icon notices. Hooks are optional conveniences; CI is the authoritative check.
- Root `AGENTS.md` names authoritative docs, allowed dependency direction, commands, Biome ownership, synthetic-data rules and required feature checks. Reconcile any generated Expo agent instructions with the root guide; do not let scaffolding silently replace product decisions.

### 4.6 Development services and local networking

Core Compose services are PostgreSQL, SeaweedFS and Mailpit with explicit images, health checks and named volumes. Optional diagnostics can add the selected local OpenTelemetry/Grafana profile without running the whole monitoring stack on every edit. Dokploy remains a deployment target, not a mandatory local orchestration layer.

Use host-native API/worker/Metro processes for fast development initially; also provide an app-container profile for deployment smoke checks. Container-to-container connections use Compose service names; host processes use published loopback ports. Only expose the dev app/API endpoints needed for device testing, not database/storage administration or ADB servers to the LAN.

Define one endpoint matrix in the runbook:

| Client/test | Endpoint strategy |
|---|---|
| Windows browser | Trusted local HTTPS reverse proxy; same origin routes `/api/v1` and `/api/auth` to API and remaining paths to web/Metro |
| Android emulator | Emulator host alias `10.0.2.2` for diagnostic reachability, or qualified ADB reverse ports; use a build-specific public base URL for application calls |
| Android USB phone | Explicit-device `adb reverse` for Metro/API development ports where supported; separately verify application HTTP/TLS behavior |
| Android Wi-Fi phone | PC private-LAN address or qualified development hostname, bounded firewall rules on the private network |
| iPhone Safari/PWA | Trusted HTTPS origin reachable over private LAN; DNS/certificate hostname matches and certificate trust verified on the phone |

`localhost` on a phone refers to that phone unless a specific reverse-port mapping is in effect. `0.0.0.0` is a bind address, not a client URL. An Expo tunnel for Metro is not automatically an API tunnel. Keep native and web base URL configuration separate when connectivity requires it.

For iPhone HTTPS, use a local reverse proxy and a development CA/certificate with the device hostname/IP SANs, or a deliberately selected temporary HTTPS test deployment. Never commit the CA key. Test actual device trust. Configure manifest/icons, standalone display and SPA deep-link routing for the PWA shell; Expo web export alone is not the full installation setup. A service worker, if added, may cache only explicitly approved public/static assets; `/api/*` and protected responses retain `no-store`. [Expo local HTTPS](https://docs.expo.dev/guides/local-https-development/), [Expo PWA guidance](https://docs.expo.dev/guides/progressive-web-apps/).

## 5. Work packages and sequence

The plan was created on 11 October. The founder has since copied the checkout and installed host tools; the agent has performed read-only installation/copy validation. Product scaffolding has not started.

| Work package | Status on 12 October 2026 |
|---|---|
| SETUP-01 | Host/preservation acceptance passed: native execution, inventory, matching docs and staged entries, WSL recovery copy retained; exact iPhone OS remains user-reported |
| SETUP-02 | Acceptance passed: exact matrix/image digests recorded; strict/frozen installs, Expo Doctor 21/21, Windows + Linux backend checks, local dependency integration, Java 25 APK, emulator runtime/Maestro and Metro refresh pass. Windows short-path/CNG/JVM settings documented; Tamagui 3.0.3 qualified after correcting the initial probe configuration |
| SETUP-03 | Complete: eight private packages, pnpm 12.11.2, native TypeScript 7.0.2, strict/frozen Windows/Linux installs, 17 behavior tests, boundaries and synthetic Node/Expo exports; see the dedicated plan and evidence |
| SETUP-04 | Complete within shell scope: Expo development client, Nilumi component check, independent API/worker roots, generated contracts, Windows/Linux checks, clean CNG emulator APK and Metro refresh; see [validation](../development/setup-04-validation.md). Product/infrastructure/device release gates remain later |
| SETUP-05–07 | Not started |

### SETUP-01 — Inventory and preserve the existing workspace

**Depends on:** none.

1. Record CPU architecture/virtualization, GPU/emulator support, free disk space, OS/WSL versions and Docker engine status. Review existing Windows installations/PATH before adding duplicates. Use Android Studio's current hardware requirements; approximately 32 GB RAM is a workable starting point, not proof the machine passes every requirement. [Android Studio requirements](https://developer.android.com/studio/install.html).
2. Use the founder's already-created Windows checkout; compare its files/index/metadata with the WSL recovery copy before further changes. Preserve all current/untracked documentation and do not overwrite divergent work. Do not use clone alone while the repository has no commits, or delete the WSL source during transition.
3. Compare file hashes, document links and Git status after transfer. Do not transfer dependency/build directories if they appear later. Keep the WSL source as a recovery copy until Windows setup passes; stop concurrent edits in both copies.
4. Record available Android/iPhone OS versions and USB/cable readiness without storing personal device identifiers in public evidence. GitHub account/repository destination may be resolved later in SETUP-06.

**Acceptance:** inventory recorded; target and preservation approach documented; all current work recoverable; no existing files/index state lost.

### SETUP-02 — Install and qualify Windows tools

**Depends on:** SETUP-01.

1. Install/reuse Windows-native Git, Node 24, pinned pnpm, editor and Android Studio. Set per-user `JAVA_HOME`, `ANDROID_HOME` and PATH without replacing unrelated entries; reopen terminals and verify the actual executable locations. Use one native ADB server.
2. Retain the installed JDK 25, SDK 37, Build-Tools 36/37 and Android 17 AVD. Complete SDK Platform 36 installation and license checks. Qualify the generated build's JVM/Gradle/plugin matrix before deciding whether JDK 17 is needed alongside Java 25. Verify the existing AVD boots with usable acceleration; inspect its image capabilities, adding a Google Play-capable image only if needed for later tests. Enable WHPX/BIOS virtualization if needed, acknowledging any required restart. The emulator runtime need not match compile SDK exactly; use one AVD initially to control resource use.
3. Verify Docker Desktop's Linux engine/Compose; set a measured resource budget that leaves room for Gradle and the emulator. Do not replace existing WSL configuration blindly.
4. Verify native Codex/editor operation in the Windows checkout. Demonstrate filesystem access, portable script execution and persistent dev-server behavior. Qualify ADB/Maestro; optionally install scrcpy for the available Android phone.
5. Resolve the compatibility matrix before scaffolding: stable Expo/React/React Native pair, Tamagui and native modules, backend/schema/auth/queue/codegen versions, pnpm and exact container tags/digests. Record exact versions and any exceptions in `docs/development/toolchain.md`.

**Acceptance:** Windows tools resolve to Windows installations; accelerated emulator boots; ADB sees the emulator and authorized USB phone; Docker runs a Linux container; matrix documented; no production credentials needed.

**Execution result, 12 October:** acceptance passes; see [SETUP-02 qualification](../development/setup-02-qualification.md) and [selected pins](../development/toolchain.md). Expo 57 requires client TypeScript 6.0.3; backend/codegen uses 5.9.3. Tamagui 3.0.3 is selected after resolving a missing default Input radius token in the initial probe configuration; see [v3 root cause and qualification](../development/tamagui-3-qualification.md). Java 25 builds the development APK with command-scoped socket/native-access options. Windows builds use a short dedicated pnpm store, 32-character package directory names, an SDK junction and CNG-configured short app CMake staging. Source stays in the selected physical Windows location; no source drive alias or JDK switch is required. The actual monorepo, ARM64 phone application, iPhone PWA and CI still require their later checks.

### SETUP-03 — Workspace and standards

**Depends on:** SETUP-02.

1. Initialize the pnpm workspace and private manifests using the target layout; retain the existing Git repository. Add `packageManager`, Node engine/pin, workspace dependencies and the single lockfile.
2. Configure compatible Node/Expo TypeScript settings, stable package exports and development/build outputs. Choose source/built export behavior explicitly per package and test resolution in both Metro and Node; no circular package dependencies or server imports from the client.
3. Add pinned Biome, boundary checking, editor settings, ignore/attribute files, root commands, root `AGENTS.md`, `README.md`, `CONTRIBUTING.md` and PR template. Document naming, errors, logging, tests and dependency review.
4. Add process-specific `.env.example` files with placeholders, safe defaults and public/client versus private/server separation. Add environment validation; missing required values fail with safe diagnostics. No fallback to a production service or universal privileged DB URL.
5. Preserve the existing product docs and design reference; link this plan from the development documentation. Update core exact-package/tooling references only where the qualified setup resolves a previously provisional name; avoid duplicating product requirements.

**Acceptance:** clean frozen install, formatting/lint/type checks and import-boundary checks work on Windows and Linux; package exports resolve; no secrets or generated native/build output tracked.

**Execution result, 12 October:** acceptance passes; see [SETUP-03 plan](setup-03-workspace-and-standards.md) and [workspace validation](../development/setup-03-validation.md). Native TypeScript 7.0.2 is selected for all eight packages; classic 5.9.3/6.0.3 remains isolated for tooling APIs/comparison. pnpm 12.11.2 is prepared per checkout without changing global tools. Synthetic export/type probes do not certify application UI, native APKs, DB roles or devices; SETUP-04–07 remain required.

### SETUP-04 — Client/API/worker shells and public contracts

**Depends on:** SETUP-03.

1. Scaffold one Expo Router TypeScript client using the qualified official template. Add `expo-dev-client` and native dependencies through Expo compatibility tooling. Use a local Android development build and `expo start --dev-client`; Expo Go may be a quick diagnostic, but does not qualify the native setup. [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/).
2. Set a development-only app identity/scheme, app config, safe areas, provider composition and public API configuration. Production application ID/domain/signing ownership remains a later distribution decision. Apply CNG through app config/plugins; verify a clean regeneration can rebuild Android. [Expo CNG](https://docs.expo.dev/workflow/continuous-native-generation/).
3. Build a small internal component-check screen with Nilumi text, button and field, catalogue tokens, bundled fonts and one contextual Phosphor asset. Include mixed Tamil/Latin, large text, loading/error/disabled states and focus/screen-reader labels. Leave complex sheets, tasks and feed behavior for the first feature/UI work. Qualify Tamagui without compiler optimization. [Tamagui Expo guide](https://tamagui.dev/docs/guides/expo).
4. Scaffold Fastify `buildApp` separately from startup, process-specific config, safe Pino logging, Problem Details handling and schema-validated `/api/v1/health`. Separate liveness from readiness; readiness reflects required dependencies/migration status without exposing versions or secrets publicly.
5. Scaffold a worker composition root with startup/readiness/heartbeat and bounded graceful shutdown, independent of API startup. No production handlers or user-facing queue behavior yet.
6. Generate OpenAPI from the route schemas without booting a live server or calling providers; generate `api-client` types using `openapi-typescript` and a small `openapi-fetch` transport. Validate the health response in the backend. TanStack Query can exercise the shared client on the shell; no mocked product API presented as implemented functionality.

**Acceptance:** Android and web render the same custom shell; API/client schema and compiled types agree; worker is a distinct process; no product auth or capture feature counted complete.

### SETUP-05 — Local dependencies, database bootstrap and isolated transports

**Depends on:** SETUP-03; process smoke checks use SETUP-04.

1. Add lean Compose dependencies and `.env.example`, named volumes, health checks and an explicit disposable-development reset command. Keep reset separate from normal startup; it must never run against a pilot/production environment.
2. Bootstrap `auth`, `app`, `pgboss` and `private` schemas and the agreed owner/migrator/API/auth/worker/queue/ACL/lifecycle roles. Keep provisioning credentials outside runtime configuration; give runtime roles only required grants. No runtime DDL or migrations. Add a checked, versioned migration entry point and baseline/schema readiness marker.
3. Provision pg-boss schema and one synthetic setup queue during the release/bootstrap step using its qualified version. Verify restricted enqueue and queue execution/supervision startup with runtime migrations disabled. Use content-free synthetic jobs, not copies of household content; full domain/ledger/queue atomicity and job authorization come with the first feature.
4. Add credential/grant and isolation smoke checks using an ephemeral test database and disposable fixtures: runtime roles cannot assume privileged roles or own/alter/truncate product objects. Use a test-only protected table to verify missing context denies access and transaction-local settings clear after rollback/commit; this does not replace product-table RLS tests.
5. Verify host API/worker can reach local dependencies and that worker restart does not lose an eligible synthetic job. Queue attempts may repeat; make the synthetic handler harmless/idempotent and record the result. Real per-queue retries/SLOs remain for worker implementation.
6. Route local test email to Mailpit. Provide explicitly development-only OTP/SMS and AI/speech test transports as needed, with synthetic fixtures and no live sends. Enabling those test transports in a pilot/production environment must fail startup. Do not echo real OTPs or content into routine logs.
7. Add optional OpenTelemetry diagnostics profile and validate Pino redaction, request IDs and worker heartbeat. Full GlitchTip/Uptime Kuma deployment and alert qualification are later operational work.

**Acceptance:** dependency health passes, schema/bootstrap is repeatable, restricted processes start, pending migrations fail readiness, synthetic job recovery works and test transports cannot activate in real-data deployments.

### SETUP-06 — CI, Linux artifacts and release scaffolding

**Depends on:** SETUP-03–05.

1. Configure the recommended private GitHub remote when its owner/name are known; preserve existing work in the first commit. Add short-branch/PR conventions and protected-main required checks where the account plan permits them. Local setup can proceed without a remote, but GitHub CI completion cannot be claimed without a real run.
2. Add Linux checks for frozen install, Biome, TypeScript, boundaries, tests, OpenAPI generation/drift and web export. Add a Windows smoke job for portable commands and client/server compilation. Pin action revisions and tool versions; use minimal workflow permissions. Do not expose provider/deployment secrets to PR checks.
3. Run ephemeral PostgreSQL/queue integration checks with the actual restricted roles, plus backend/API Vitest checks. Add Playwright shell/deep-link checks. Use Jest + `jest-expo` + React Native Testing Library for native component tests, rather than forcing Vitest to emulate native modules. [Expo unit-testing guidance](https://docs.expo.dev/develop/unit-testing/).
4. Commit the generated OpenAPI document/types and verify regeneration produces no drift. Compare v1 contract changes against the PR base with a qualified OpenAPI compatibility checker; bootstrap the first baseline explicitly and preserve prior release artifacts for later installed-client compatibility checks.
5. Build minimal non-root API/worker Linux images and a web export/serving image from the monorepo root. Verify required workspace artifacts, package exports and production-only dependencies survive packaging. Start them with the dependency containers, exercise health/readiness/shutdown, and ensure builds contain no local secrets.
6. Provide an Android debug/development build smoke check in CI at bootstrap and on native/dependency/config changes, with recorded device checks locally. An emulator on every PR is not necessary for the foundation; add broader mobile flows with the first journey.
7. Document release artifact IDs/commit SHA, one privileged migration job before readiness, queue provisioning during releases and compatible API/worker rollout. Manual-only deployment scaffold initially; no auto-deploy to the VM, no signing secrets and no EAS Update/OTA activation in this milestone.

**Acceptance:** observed Linux and Windows CI jobs pass; Linux artifacts start with restricted credentials; Android debug build passes; generated contract checks work; publishing/deployment remains an explicit later action.

### SETUP-07 — Devices, runbook and setup handoff

**Depends on:** SETUP-04–06.

1. Run the Android development build on the accelerated emulator and USB phone. Verify Metro refresh, API reachability, package imports, Tamil/Latin fonts, large text, keyboard, Android Back and TalkBack for the representative controls.
2. Capture a synthetic screen through ADB and run a shell-navigation/input Maestro flow with explicit device selection. If desktop computer use is available, verify it can inspect/interact with the emulator or scrcpy window. Record a separate result for that capability; otherwise retain tested ADB/Maestro access and explain the tool limitation.
3. Export and serve the web shell through trusted HTTPS. Open on the actual iPhone, add to Home Screen and verify launch/deep links, safe areas, touch/keyboard, Tamil/Latin, large text and VoiceOver for the representative controls. Push, offline behavior and protected sessions are not yet qualified.
4. Verify PWA routing preserves `/api/*` handling and excludes protected responses from service-worker caches. Test reachable base URLs across host, emulator and both phones; document certificate trust, USB authorization, firewall and disconnect/reconnect troubleshooting.
5. Add `docs/development/README.md`, toolchain/setup/run/test/reset instructions, environment/service matrix, Linux/Windows distinctions and evidence links. Record emulator/device OS/build and tool versions, pass/fail, known limitations and next-plan blockers.
6. Review the completed setup against §6 below. Create the next implementation plan with requirement IDs for the first journey; finalize session/OTP and source-span decisions before their respective implementation, rather than treating setup as approval of their unspecified values.

**Acceptance:** all required foundation checks pass or are explicitly recorded as unfinished; actual Android/iPhone evidence exists; developer can follow the runbook from a clean install; next feature plan has a clear starting point.

## 6. Verification and definition of done

### Proposed command surface

These commands are intended deliverables, not commands available in today's documentation-only repository:

| Command | Purpose |
|---|---|
| `pnpm setup:check` | Safe toolchain/config preflight; does not print secrets |
| `pnpm infra:up` / `pnpm infra:down` | Start/stop dependency containers without deleting data |
| `pnpm db:bootstrap` / `pnpm db:migrate` | Explicit privileged provisioning/release operations, never app-start hooks |
| `pnpm dev:api` / `pnpm dev:worker` / `pnpm dev:client` | Independent host-native development processes |
| `pnpm android` / `pnpm web` | Qualified Android development build or web development entry point |
| `pnpm check` | Non-mutating lint, types, boundaries and generated-contract drift |
| `pnpm test` / `pnpm test:integration` | Fast behavior checks / isolated PostgreSQL and queue checks |
| `pnpm test:web` / `pnpm test:android` | Playwright / Maestro; explicit supported runtime/device prerequisites |
| `pnpm contracts:generate` | Deterministic schema → OpenAPI → client generation |
| `pnpm build` / `pnpm build:containers` | Workspace/web outputs / Linux app images |
| `pnpm dev:reset` | Guarded explicit reset of named disposable-development state |

### Required acceptance evidence

| ID | Check | Environment / evidence |
|---|---|---|
| F01 | Existing docs, staged work and Git state preserved across transition | Before/after hashes and Git status; recovery copy retained |
| F02 | Correct tool versions and filesystem; native execution verified | Windows executable/version report; Linux CI/image manifest |
| F03 | Frozen install, strict compilation, lint and dependency boundaries pass | Windows + Linux checks; deliberate client→server import rejected |
| F04 | Android native build and Metro reload work | Accelerated AVD + actual Android phone, development APK |
| F05 | Shared UI meets representative catalogue behavior | Both phone targets; Tamil/Latin, scaling, focus/keyboard and screen-reader evidence |
| F06 | iPhone web shell installs and launches over HTTPS | Actual Safari/PWA, direct route launch and certificate trust |
| F07 | API/worker are independent; contracts generated and validated | Health DTO round-trip, generated TS compilation and drift check |
| F08 | Bootstrap/migrations restricted; runtime cannot silently repair schema | Isolated database role/grant checks; pending schema/readiness failure |
| F09 | Synthetic queue survives restart with harmless repeated attempts | Restricted producer/queue process logs and content-free result |
| F10 | Docker images start under Linux with required workspace dependencies | Compose app smoke, health/readiness/shutdown results |
| F11 | Local provider isolation and redaction hold | No live outbound providers; invalid real-data/test-mode startup rejected |
| F12 | Android agent-test access works through ADB/Maestro | Screenshot and input/flow evidence; GUI-control result recorded separately |
| F13 | Runbook works, actual CI passes, generated artifacts are reproducible | Clean installation run and observed workflow results |

Record evidence in `docs/development/setup-validation.md` during execution. Do not commit screenshots containing personal notifications or sensitive phone content. Desktop GUI control is optional if ADB/Maestro works; full iPhone automation is not a completion criterion. Failed required checks keep the corresponding work package incomplete.

Passing this milestone establishes a working development foundation. It does not establish product correctness, real-user authorization, OTP delivery, notification receipts, multilingual model quality, offline/forget/exit safety, performance SLOs or pilot recovery readiness.

## 7. Release, migration and recovery

No live deployment or data migration occurs while writing this plan. During execution, preserve the original WSL checkout until verified Windows operation and a recoverable Git baseline exist; no automatic cleanup of the old checkout.

Development data is disposable, but normal restart/rebuild commands must preserve volumes. The reset command explicitly validates its environment and targets only local disposable state. Never use a reset or `drizzle push` workflow for pilot/production migrations.

Release migrations and queue provisioning run with the release credentials, while API/worker processes only check schema readiness. Use additive/expand-and-contract changes compatible with the previous API/worker release and installed v1 clients. Serialize release migrations. Do not promise that an app rollback reverses a data migration; irreversible/destructive schema work needs a separately reviewed migration/recovery plan. Actual pilot backup/restore checks remain mandatory before real-family use.

Debug signing is sufficient here. Before any private-pilot APK distribution, choose permanent app identity, protected signing-key storage and upgrade continuity. EAS cloud builds are optional, not a requirement to develop/build Android locally; cloud execution and any OTA policy require their own later configuration and processor/secret review.

## 8. Risks, dependencies and open questions

| Item | Impact | Resolution / trigger | Blocks which work? |
|---|---|---|---|
| Windows-native execution transition | Resolved: active PowerShell/Node are Windows-native and checkout preservation verified | Retain WSL recovery source until native foundation passes and a recoverable Git baseline exists | No current native-host blocker |
| Combined workload resource budget | Inventory and accelerated AVD boot pass; concurrent Gradle/Metro/infra load still unmeasured | Retain existing 16GB/8-CPU WSL budget; measure during build/infra qualification | Full SETUP-02 workload qualification |
| GitHub owner/name and account capabilities unknown | Remote creation, branch rules and observed CI run | Resolve when connecting remote; one private monorepo recommended, no external repository created by this plan | Remote part of SETUP-06, not local scaffolding |
| Permanent Android application ID/domain/signing | Distribution and later upgrades | Use clearly development-only identity now; decide before distributing pilot APKs | Pilot distribution only |
| Expo/Tamagui/backend package compatibility | Build or schema generation may fail | SETUP-02 matrix; stable compatible versions, Expo doctor and actual native/web builds; qualify exact Zod provider name | SETUP-03/04 |
| Device TLS/network topology | iPhone HTTPS or Android API may be unreachable | Endpoint matrix and real-device certificate/connectivity checks; no broad firewall disablement | SETUP-07 |
| Agent GUI tools vary by session | Native source location alone does not grant screen/control access | Qualify ADB/Maestro independently; test installed desktop integration, report actual limitations | Optional GUI-control evidence only |
| Session/OTP limits, provenance/clock policy, job retry policy and AI enforcement remain open | First feature could encode unreviewed behavior | Finalize just before the corresponding feature; no numeric defaults silently made authoritative by scaffolding | Relevant later feature plans |
| Pilot/production deletion, backup, signing, observability and processor policies | Setup could be mistaken for release readiness | Carry existing gates forward; no real data admitted on foundation smoke evidence | Pilot/production release, not foundation |

No further product clarification is needed to write or review this setup plan. The known execution inputs above can be resolved at their work packages. Founder has already confirmed both physical devices and the selected architecture; those decisions need no repetition.

## 9. Review record

**Second-pass self-review completed: 11 October 2026.** Review covered the core v2.4 documents, current repository/machine evidence, platform/tool documentation, package dependency direction, setup scope, verification and recovery. No sub-agents or runtime implementation were used for this review.

**Follow-up reviewed: 12 October 2026.** Updated the selected checkout location, inspected installation evidence, partial work-package status and Java 25/SDK 37 compatibility clarification. SDK Platform 36 is a founder-confirmed pending download, not a completed installation. No application/native build has run, and no runtime readiness check is marked passed.

| Review finding | Incorporated resolution |
|---|---|
| Existing repository is staged but has no commits | Preserve files/index/metadata before transfer; no reinitialization or clone-only migration |
| Windows native development does not imply guaranteed agent GUI/device control | Separate native command, ADB/Maestro and optional desktop-control evidence |
| Android tooling needs to coexist with WSL2/Docker | Windows SDK and WHPX; Docker's Linux backend retained; no alternate daemon/ADB exposure |
| Newer installed Java/Android versions were described too categorically | Separate runtime/compile/JVM choices; retain Android 17/SDK 37/Java 25, add API 36 for defaults, qualify actual build before selecting a fallback JDK |
| Physical iPhone target differs from native iOS Simulator | Actual HTTPS Safari/PWA acceptance; no Mac/native-iOS prerequisite introduced |
| Expo Go and web export alone do not qualify the selected client | Development APK/CNG, native-module smoke and manifest/installation/deep-link checks |
| Current pnpm/Expo and Zod-provider guidance differs from older tutorials | Qualify version matrix and provider provenance; no stale Metro hacks or copied obsolete pnpm settings |
| Using Vitest everywhere would leave native component behavior poorly represented | Native Jest/Expo testing separated from backend Vitest; device checks remain required |
| Generic shared packages could expose backend code or secrets | Client-safe contracts, explicit package exports and dependency-graph checks |
| Runtime migrations or privileged convenience credentials would violate agreed DB contracts | Separate bootstrap/migrator commands, restricted runtime startup and readiness failure |
| A large foundation could absorb the first feature journey | Limit to shells, representative primitives and synthetic dependency/contract smoke checks |
| Localhost/certificates, persistent dev servers and resource pressure can block device testing | Explicit endpoint matrix, device trust checks, supported sessions and inventory/resource budget |
| A successful setup could be misreported as pilot readiness | Foundation definition of done separated from product/evaluation/backup release gates |

Documentation review is complete. Exact dependency versions, build behavior, device connectivity and CI results still require execution evidence; none is marked as passed here.

## 10. Execution handoff

SETUP-01–03 acceptance is complete within each work package's boundary. Begin SETUP-04 using the [workspace validation](../development/setup-03-validation.md), prior [native qualification evidence](../development/setup-02-qualification.md) and [selected matrix](../development/toolchain.md). Carry the tested Windows-only CNG/path/JVM configuration into actual application shells, preserve the index and WSL recovery copy, and requalify native/runtime behavior in SETUP-04. Routine library/configuration choices follow the selected stack; ask for user input only where an unresolved ownership, product, privacy or cost decision materially affects the next step.

**Original founder actions before/after restart (retained as the preflight checklist; current results are linked above):**

1. Complete SDK Platform 36 installation in Android Studio; retain SDK 37 and the Android 17 emulator.
2. Restart Windows, then open Docker Desktop and boot the existing emulator. The agent does not restart the machine as part of a docs update.
3. Open the Windows checkout in Codex with native PowerShell execution; verify the actual command host rather than assuming the current WSL chat switched automatically.
4. Connect the Android phone, enable USB debugging and accept the computer authorization prompt.
5. Run the following in a fresh native PowerShell; record failures without reinstalling or changing JDKs blindly:

```powershell
node --version
git --version
java -version
adb --version
emulator -accel-check
docker version
docker compose version
adb devices
```

Node 24.21.0 and pnpm 12.9.1 execute natively. Platform 36, Docker server/container execution, WHPX and both authorized Android targets are verified. Java 25/Gradle 9.3.1 builds the isolated x86_64 development APK, which runs on the emulator with the now-qualified Tamagui 3.0.3 configuration and passes Maestro. The original 2.7.7 fallback also passed Metro refresh; the v3 follow-up reproduces and fixes its missing-radius-token failure. Isolated backend/container checks also pass. Application workspace pinning and actual monorepo/device/CI validation remain foundation execution tasks; isolated probes do not establish product readiness.

Once F01–F13 pass, produce the next implementation plan for the narrow sign-in → household → text capture → confirmation → saved record flow, followed by one handoff to exercise domain/ledger/worker behavior. Map that plan to A1/A2, B1, C1/C2, D1 and E1 and include the applicable consent, access, correction and release protections. The full product roadmap remains in the core documents.
