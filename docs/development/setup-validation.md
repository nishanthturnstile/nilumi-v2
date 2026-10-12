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
