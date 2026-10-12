# Post-restart setup validation

Recorded on 12 October 2026 (Asia/Calcutta), against [SETUP-001](../implementation/001-development-environment-and-project-foundation.md). Application scaffolding has not started.

## Result

SETUP-01 preservation and host inventory checks pass, with the exact iPhone OS version still user-reported as “latest”. SETUP-02 acceptance now passes: native Windows tools, Platform 36, accelerated emulator, authorized USB access, Docker/Linux execution, dependency qualification, Java 25 APK, Maestro and Metro refresh are verified. See the follow-up [qualification report](setup-02-qualification.md) and [selected matrix](toolchain.md). The detailed preflight below preserves its original observations; later outcomes supersede its pending entries.

## Workspace preservation

The active checkout is `C:\Users\Nishanth Murugan\projects\nishanth - projects win\nilumi-v2`. The recovery checkout remains `/home/dev/dev/projects/nishanth/nilumi-v2` in Ubuntu-24.04, inspected read-only through `\\wsl.localhost\Ubuntu-24.04`.

Before documentation edits, SHA-256 comparisons matched all seven Markdown files, `.git/HEAD` and `.git/config`. Both indexes contain the same five staged file paths, modes and object IDs (`git ls-files --stage` comparison produced no differences). The binary index hashes differ; semantic staged contents are identical. Git can refresh index filesystem metadata, so byte equality is not required to establish preservation. `git diff --name-only` was empty. All existing local Markdown link targets resolve; heading anchors were not independently checked.

Branch `main` remains unborn, with no commits or remote. The five core documents remain staged; implementation/development evidence remains unstaged. No Git reinitialization, staging, commit, checkout deletion or recovery-copy modification occurred. A committed recovery baseline still belongs to later foundation work.

## Native execution and inventory

| Check | Observed evidence | Result |
|---|---|---|
| Command host | PowerShell 7.6.5, Core, Win32NT; Windows build 10.0.26300.9550; Windows C: checkout | Pass |
| Restart | Last boot reported 12 October 2026, 10:57:39 IST | Observed |
| Node execution | `process.platform=win32`, `arch=x64`; executable under native Windows nvm installation; cwd matches checkout | Pass |
| CPU / virtualization | Ryzen 7 7730U, 8 cores / 16 logical processors; firmware virtualization enabled | Pass |
| RAM / disk | Approximately 31.4 GiB usable RAM, 16.5 GiB free at initial check; C: approximately 288 GiB free | Observed |
| GPU | AMD Radeon (TM) Graphics; driver 31.0.21924.7001 | Observed; emulator boot passes |
| WSL | 3.0.1.0, kernel 6.18.40.1-1; Ubuntu-24.04 and docker-desktop running as WSL2 | Pass |
| Resource settings | Existing `.wslconfig`: memory 16GB, 8 processors, swap 4GB, gradual automatic memory reclaim; AVD: 2 GiB RAM / 8 cores | Retained; concurrent Gradle/Metro/infra load measurement pending |
| Persistent session | Temporary native Node HTTP server remained reachable from two subsequent agent commands on loopback; exact response `nilumi-native-preflight` | Pass; test server stopped afterward |

All commands below resolve to Windows executables. Git is under `C:\Program Files\Git\cmd`; Java under Eclipse Adoptium; Android tools under `%LOCALAPPDATA%\Android\Sdk`; Docker under `C:\Program Files\Docker\Docker\resources\bin`. Node/pnpm resolve through the Windows nvm `.nodejs` directory. No WSL executables build or run the active checkout.

## Android and Java

| Check | Observed evidence | Result |
|---|---|---|
| Java | Temurin 25.0.4.1+1-LTS; `JAVA_HOME` and executable agree | Pass |
| Platform 36 | `platforms/android-36`, revision 2, API level 36; `android.jar` present; SDK package listing confirms installation | Pass |
| Other SDK packages | Platform 37.0 rev 2, Build-Tools 36.0.0 / 37.0.0, command-line tools 23.0.0, platform-tools 37.0.1, emulator 37.2.12 | Observed |
| Licensing | `android-sdk-license` file exists; SDK CLI listing succeeds. Legacy `sdkmanager --licenses` reports that the option is no longer needed | Current CLI check passes; actual dependency installation/build remains pending |
| Acceleration | `emulator -accel-check` reports WHPX usable; boot log confirms Windows Hypervisor Platform operational | Pass |
| Existing AVD | `Medium_Phone_API_37.0`, Google Play x86_64 image rev 6; `sys.boot_completed=1`; Android 17 / API 37 | Pass |
| USB phone | Pixel 8, authorized `device` state; Android 17 / API 37 confirmed by explicit-device `getprop`; Windows PnP status OK | Pass |
| ADB server | One native `adb.exe` server observed; emulator and phone both discovered | Pass |
| Agent emulator access | Explicit emulator selection; Settings launch, Home key input, PNG capture/pull and visual inspection succeed | Pass |
| Maestro / scrcpy | Neither resolves on PATH | Maestro qualification pending; scrcpy optional |
| Desktop GUI control | Active computer-use surface supports browsers and disables native desktop APIs | Optional capability unavailable; ADB is usable |
| iPhone | User confirms connected phone with latest iOS; exact version and Safari/PWA behavior not independently inspected | Pending SETUP-07 evidence |

The acceleration command also emitted an initial `Unknown argument` diagnostic containing a path fragment after the space in the Windows username. Its subsequent accelerator result and the successful AVD boot prove acceleration works. Keep paths quoted and qualify the actual native build in this checkout.

The [Expo bare template 57.0.29](https://registry.npmjs.org/expo-template-bare-minimum/57.0.29) contains Gradle wrapper **9.3.1**. Its wrapper was extracted into a temporary directory and `gradlew.bat --version` exited successfully under the installed Java 25.0.4.1 on Windows. This verifies the wrapper's JVM startup, including the spaced Java path. Gradle officially supports Java 25 from [9.1.0](https://docs.gradle.org/current/userguide/compatibility.html). No Android project, native-module compilation or APK was built; Java 25 compatibility for the complete Expo/AGP/native-module combination remains unqualified. Retain Java 25 and test the generated build before choosing a fallback JDK.

Only the emulator screenshot was retained, after visual inspection for sensitive content: [ADB screenshot](evidence/2026-10-12-android-emulator.png). No phone screenshot, personal serial number or personal log contents are stored here. App-launch/input checks ran on the emulator; phone access was qualified through authorization and read-only shell properties.

## Docker

Docker client/engine 29.8.1, Desktop 4.93.0 and Compose 5.5.1 respond. Context is `desktop-linux`; server is Linux/amd64 on the WSL2 kernel. Engine reports 8 CPUs and approximately 15.6 GiB memory, consistent with existing WSL limits.

A disposable, network-disabled Linux container ran with 128 MiB memory / one CPU, no volumes and automatic removal:

```powershell
docker run --rm --pull=never --network none --memory 128m --cpus 1 --entrypoint node node:24-bookworm-slim -e 'console.log(JSON.stringify({platform:process.platform,arch:process.arch,node:process.version}))'
```

Output: `{"platform":"linux","arch":"x64","node":"v24.21.0"}`. The locally inspected image digest was `node@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20`. Existing containers/volumes were left intact. This passes container execution; it does not qualify future application images or local service health.

## Remaining foundation gates

- Pin and validate the dependency matrix with installs, Expo doctor, contract smoke checks and native/web builds. Actual generated wrapper/AGP versions take precedence over template metadata.
- Qualify Maestro on Windows with explicit device selection and a shell flow once a development APK exists.
- Select exact PostgreSQL, SeaweedFS and Mailpit image tags/digests and test the future dependency stack. Measure combined Gradle/emulator/infra load before adjusting resource limits.
- Build an Android development APK under Java 25; demonstrate Metro refresh and application/device networking.
- Record the exact iPhone OS and perform actual Safari/PWA checks in SETUP-07.

No manifests, workspace, application source or generated Android project were added. SETUP-03–07 remain unstarted; full F01–F13 completion is not claimed.

## SETUP-06 qualification — 12 October 2026

The preceding sections retain the original preflight observations. SETUP-03–05
are implemented with separate retained evidence. SETUP-06 CI, images, contract
compatibility and manual release scaffolding are implemented. **SETUP-06 functional
acceptance passes:** all seven required jobs were observed green in the real
[PR run](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38265453992).
The tested implementation head is `31beb6b0a622c4fd025f7e628510a47e333826d1`;
GitHub tested merge commit `7abd0df28444a24617429d3abd96fc4814505fbb` against
base `f471e4f08d2d8e6cd677b6bae355bb573afec6bd`. The subsequent `main` ancestry
merge changes no files; this evidence commit records the observed result.

| Check | Observed result |
|---|---|
| Windows frozen install/check/native7/boundaries | Pass |
| Windows Node behavior tests / API Vitest / native Jest+RNTL | 32 / 2 / 2 pass |
| Windows restricted-role integration | Pass; actual isolated API/auth/worker/queue roles |
| Fresh Linux frozen install/check/test/integration/contracts | Pass; independent modules in pinned Node container |
| Classic compiler comparisons/public export closure | Fresh Linux pass |
| Generated schema/type byte drift | Pass; negative drift in both outputs rejected and restored |
| oasdiff 1.33.0 vs PR base `f471e4f08d2d8e6cd677b6bae355bb573afec6bd` | Pass; removed v1 endpoint negative qualification fails as expected |
| Windows Playwright exported shell/direct-link/reload/API forwarding | 2 pass |
| Non-root API/worker/web packaging and health/ready/shutdown | Pass on local Linux engine; exact IDs in image-smoke.json |
| Clean CNG Windows Android x86_64 debug build | Pass, Java 25.0.4.1 / Gradle 9.3.1; 660 tasks, BUILD SUCCESSFUL |
| Protected `main` | Applied: up-to-date PR, `Foundation required`, enforced admins, resolved conversations, no force/deletion |
| Real GitHub Linux + Windows + integration/browser/images/Android | **All pass**, including `Foundation required`; links below |

| Real GitHub job | Observed result |
|---|---|
| [Linux foundation](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38265453992/job/114866354654) | Pass: frozen install, Biome, native7, boundaries, Node/Vitest/Jest, generation/drift/compatibility, web export |
| [Windows smoke](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38265453992/job/114866354863) | Pass: portable commands, client/server compile, tests and contracts |
| [Restricted-role integration](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38265453992/job/114866354977) | Pass: ephemeral PostgreSQL/pg-boss, actual role/grant/context/recovery/readiness checks and backend Vitest |
| [Web shell browser](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38265453992/job/114866354777) | Pass: exported shell, direct link/reload/input/liveness and API-path isolation |
| [Linux image smoke](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38265453992/job/114866354926) | Pass: privileged migration/queue job before startup, non-root production closure, health/ready/marker loss and SIGTERM exit 0 |
| [Android debug smoke](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38265453992/job/114866980253) | Pass: exact JDK/SDK preparation, clean CNG/x86_64 assembleDebug; BUILD SUCCESSFUL in 9m45s, all 660 tasks executed |
| [Foundation required](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38265453992/job/114871292843) | Pass: every required result green; Android ran rather than skipped |

[PR #2](https://github.com/nishanthturnstile/nilumi-v2/pull/2) remains open for review.
Protected `main` requires the GitHub Actions app's `Foundation required`, strict
up-to-date branches and resolved conversations, including for admins. Development
now includes main's prior merge commit; no core/historical file changed.

Hosted [image-smoke output](evidence/setup-06-2026-10-12/github-image-smoke.json)
records exact API/worker/web image IDs, required workspace exports/SQL and absence
of compiler/Biome/Drizzle Kit/Vitest runtime resolution. Health/ready, pending
migration rejection, worker heartbeat and all shutdown exit codes passed.
[Contract compatibility output](evidence/setup-06-2026-10-12/github-contract-compat.json)
is `code: 0`, `output: []` against the exact PR base. The Linux job also observed
both generated artifacts' byte drift rejected/restored and a removed v1 endpoint
rejected by oasdiff. The complete hosted
[Android log](evidence/setup-06-2026-10-12/github-android-debug-build.log),
[job metadata](evidence/setup-06-2026-10-12/github-ci.json) and
[artifact IDs/digests](evidence/setup-06-2026-10-12/github-artifacts.json) are retained.
Contract/web artifact ID is `11754227955`, image-smoke `11754522300`, and Android
debug `11755067203`; artifacts identify the exact tested merge commit above.

New evidence is under [SETUP-06](evidence/setup-06-2026-10-12/README.md).
The clean local Android build log is
[android-debug-build.log](evidence/setup-06-2026-10-12/android-debug-build.log);
prior local emulator/Metro interaction evidence remains in SETUP-04 and is not
counted as a new physical-device/iPhone qualification. Packaging attempts that
failed legacy offline resolution and declaration-only dependency lookup, and
the initial Linux Jest transform-path failure, are retained separately from the
passing results. Hosted attempts also rejected the initial Java version
selector and exposed Linux AGP/CMake's Java 25 native-access warning; the final
run uses a checksum-pinned exact archive and the command-scoped flag already
qualified on Windows. Both failed required runs remain in the evidence and were
not counted as acceptance. Strict peers/age checks were retained; test-renderer 1.2.0 is the
latest compatible React 19.2 selection, and mature Vitest 5.0.3 is selected.

Git Credential Manager's existing GitHub session permits pushes/API operations
without writing or displaying its token; `gh` has no independently stored login.
The existing GitHub repository reports `private=false`; its visibility was
preserved. All eight workspace packages remain private. No provider/deployment
secrets, signing, auto-deployment, pilot/production migrations or OTA were added.
The advisory audit remains **non-clean: 2 high, 4 moderate**. It retains the prior
five advisories and adds `sprintf-js` in the test tooling tree; no incompatible
override was forced. Dependency-security acceptance remains separate and open.
SETUP-07 device checks and product/pilot readiness remain unfinished. The manual
release record captures image IDs/commit/schema hashes and rejects ID reuse;
the release Compose scaffold validates with synthetic configuration. No rollout
or pilot/production migration was performed.

## Dependency remediation follow-up — 12 October 2026

See [the dependency security record](dependency-security.md) and new evidence under
`evidence/setup-06-2026-10-12/dependency-remediation/`. The original SETUP-06 audit and
qualification evidence remain historical and unchanged.

The decoder has a committed CommonJS patch with bounded UTF-8 scanning and removal
of the outer quadratic replacement map. Parent-scoped exact overrides remove the
vulnerable esbuild, UUID and sprintf-js paths. The raw audit is now **2 high, 1 moderate**;
the moderate decoder alert is version-based despite the installed patch. Forge and
braces remain active upstream advisories, with conditional local acceptance until
12 November 2026 under the documented exposure restrictions.

Windows frozen install, check, test, test:integration, contracts:check, direct-selection
audit, web export, three Playwright tests, native Jest parser/component tests, and fresh
Android/web resolution exports passed. Seven focused dependency tests verify malformed
queries and ordinary behavior, real Drizzle SQL generation, xcode IDs, YAML config loading
and the installed Expo native matrix. Local image health/readiness/shutdown passed;
its artifacts identify the base commit plus dirty working tree, not an immutable release.

Fresh pinned Linux qualification passed. The hosted PR run
[38274234393](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38274234393)
completed successfully with all seven jobs green for source head
`1bc787ae658b40481eda3e5f7a3d5ccaecb47711`, qualified as PR merge
`186451175a6a0845f4ec462f6f0f48ada9565a64` against exact development base
`c941e03d504abd1024c43e1dc7a47e8c205bb431`.

| Observed check | Job URL |
|---|---|
| Linux foundation | [success](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38274234393/job/114895692236) |
| Windows smoke | [success](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38274234393/job/114895692468) |
| Restricted role integration | [success](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38274234393/job/114895692245) |
| Web shell browser | [success](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38274234393/job/114895692505) |
| Linux image smoke | [success](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38274234393/job/114895692456) |
| Android debug smoke | [success](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38274234393/job/114896406828) |
| Foundation required | [success](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38274234393/job/114900563823) |

Hosted contract byte-drift qualification passed; oasdiff 1.33.0 comparison returned
code 0 and `[]` against the exact PR base. Hosted image artifacts include immutable
merge SHA/image IDs and successful health/readiness/shutdown assertions. Android's
debug build passed; its log and artifact IDs/digests are retained in the new evidence.
The Linux/Windows jobs run the seven focused dependency regressions and native parser
test at the committed revision. The cancelled duplicate push run is not counted.

The first Linux live-Expo-metadata attempt failed when new same-day SDK patches
appeared; its failure log is retained. The qualified family is held by the existing
maturity policy, and compatibility uses the installed SDK matrix while registry
freshness remains separately audited. All 173 previously tracked core/evidence files
remain unchanged. No global audit ignore, incompatible native major or stack migration
was added.

The four remediations can be closed for the qualified graph. Dependency-security
acceptance is conditional on the two dated exceptions; the upstream highs remain
unresolved and the audit is not clean. Physical device qualification remains SETUP-07.
