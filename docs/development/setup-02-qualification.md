# SETUP-02 dependency and tool qualification

Date: 12 October 2026, Asia/Calcutta. This follows the [post-restart host validation](setup-validation.md) and qualifies the [toolchain matrix](toolchain.md) for the [foundation plan](../implementation/001-development-environment-and-project-foundation.md).

**Outcome:** SETUP-02 acceptance passes using the recorded Windows build configuration. Exact client/backend pins and Linux image digests are established. Tamagui **3.0.3 is now selected** after correcting the initial probe configuration and passing Android/web interaction, component tests and an incremental Java 25 build. See [v3 qualification and root cause](tamagui-3-qualification.md); its client snapshot supersedes the original 2.7.7 client selection. SETUP-03 can begin. Physical-phone APK testing, iPhone Safari/PWA and actual CI remain later foundation work.

## Scope and execution

The probes run in `C:\Users\Nishanth Murugan\AppData\Local\Temp\nilumi setup 02-20261012`, using native PowerShell, Node, pnpm, Java, Gradle, Android SDK and Maestro. This path deliberately includes spaces. Separate `backend` and `client` installs qualify their different compiler requirements. The official Expo blank TypeScript template 57.0.29 supplied the isolated client; application workspace scaffolding under `apps/` and `packages/` has not begun.

Exact manifests, lockfiles, pnpm settings, OpenAPI output and container configuration are saved in [qualification evidence](evidence/setup-02-2026-10-12/). The temporary source remains available for inspection. No production credentials or live SMS/email/model calls were used. SMTP messages went only to loopback Mailpit with synthetic `.invalid` addresses.

## Observed checks

| Check | Result and boundary |
|---|---|
| Dependency resolution | Client and backend strict-peer installs pass with pnpm 12.9.1; backend/client frozen reinstalls pass |
| Windows compile | Backend TypeScript 5.9.3 and client TypeScript 6.0.3 pass; public generated types compile in both |
| Expo compatibility | `expo install --check` passes; `expo-doctor` passes 21/21 checks |
| Web build/runtime | Static Expo Router export passes; Windows Edge headless loads/hydrates Tamagui, enters synthetic input and presses a button; no page errors |
| Native component runner | Jest 29.7.0 + jest-expo 57.0.5 + RNTL 14.1.0 execute the actual Tamagui field/button interaction |
| Formatting/lint tooling | Pinned Biome 2.5.15 formats and checks authored probe files; generated files are excluded from formatting |
| Fastify / Zod / Swagger | Valid response parses, invalid input returns 400; Vitest checks invalid handler output becomes 500 rather than a broken response contract |
| OpenAPI / typed fetch | Generated OpenAPI and TypeScript client compile and perform a real loopback HTTP request; regeneration has zero SHA-256 drift |
| Better Auth / Drizzle / Expo plugin | Four synthetic auth tables generated with Drizzle Kit; synthetic email/password registration passes on isolated PostgreSQL; client Expo/SecureStore configuration compiles and bundles |
| pg-boss | Explicit bootstrap creates queue/schema; separate runtime with `migrate:false` processes a harmless synthetic job |
| SeaweedFS | S3 create bucket, put/read object, delete object and delete bucket pass through @aws-sdk/client-s3 |
| Mailpit | Local SMTP fixture accepted and observed through Mailpit API |
| Linux portability | Fresh Linux-only frozen install under pinned Node 24.21.0 image passes backend probe, TypeScript and Vitest; Windows node_modules are never mounted as Linux dependencies |
| Maestro Windows | Official 2.11.0 archive checksum verified; native Java 25 CLI starts, obtains explicit emulator hierarchy and passes a Settings launch/search/text-input/back flow (1/1, 23 seconds) |
| Native APK | Java 25 / Gradle 9.3.1 debug APK build passes, including all chosen C++ modules; final matrix rebuild 455 tasks, 5m03s; x86_64. Installed final APK renders Tamagui 2.7.7 and passes the actual input/button Maestro flow (1/1; 35 seconds) |
| Metro refresh | Changing the probe title appears in the emulator UI hierarchy without rebuilding the APK; restored the original source afterward |

These checks qualify the versions and development environment. Restricted runtime roles, real product authentication, queue restart recovery and deployed application images remain their later work-package checks.

## Compatibility decisions discovered by execution

1. Keep Expo's React 19.2.3 / React Native 0.86.3 pair. Pin Metro config 0.86.3, Reanimated 4.5.1, Worklets 0.10.1 and Gesture Handler 2.32.0; automatically selecting newer peers caused strict-peer failures.
2. Client TypeScript is **6.0.3** as required by Expo's check. Backend/codegen remains **5.9.3** to satisfy openapi-typescript 7.13.0's published peer. Use package-local compiler commands in the future monorepo. The generated client is compatible with both compilers.
3. Use **Jest 29.7.0**, not 30, with this jest-expo preset. Transform Tamagui and Better Auth ESM dependencies, including `.mjs`, in Jest. Do not mock the tested field/button or disable strict peer checks to hide these mismatches.
4. Tamagui 3 reserves `true` token names, unlike 2.x. Use a complete v3-compatible configuration and its separate unstyled imports; the original probe's partial v2-style configuration was insufficient for v3 styled controls.
5. Select **@fastify/type-provider-zod 1.0.0**, from the Fastify repository, after actual schema/generation/client checks. The core tech-stack reference is updated; Zod/Fastify architecture is unchanged.
6. Review pnpm 12's recorded `allowBuilds` and automatic exact-version `minimumReleaseAgeExclude` entries when establishing the workspace policy. esbuild and sharp are the explicitly permitted build scripts in these probes. Do not copy old pnpm v10 configuration or relax strict peers.
7. **Corrected after investigation:** the first Tamagui 3.0.3 crash was an unresolved default Input radius token, `md`, in our incomplete configuration. Android requires numeric corner radii. The [v3 follow-up](tamagui-3-qualification.md) reproduces that failure, resolves it with complete v3 configuration, and qualifies **3.0.3**. The earlier downgrade to 2.7.7 was a temporary fallback, not evidence that v3 is generally incompatible. Original evidence/build timings below describe that fallback run; the follow-up contains the current client selection and results.

## Windows Java socket workaround

Gradle wrapper `--version` originally passed on Java 25, but a real build failed while Java created its Windows NIO selector pipe, before compilation. Setting `java.net.preferIPv4Stack` did not solve it. A minimal `Selector.open()` probe passed when the command used:

```powershell
$env:JAVA_TOOL_OPTIONS = '-Djdk.net.unixdomain.tmpdir=C:\Windows\Temp'
```

The property is supported by the [OpenJDK Windows socket implementation](https://github.com/openjdk/jdk/blob/jdk-25%2B36/src/java.base/windows/classes/sun/nio/ch/UnixDomainSocketsUtil.java). A matching [Codex Windows issue](https://github.com/openai/codex/issues/40902) reports the same workaround. Our selector test and subsequent Gradle compilation are the local evidence. This setting is command-scoped; no global JDK switch or Codex configuration change was made. Preserve any existing JAVA_TOOL_OPTIONS when integrating a future repository wrapper.

The generated native matrix reports Gradle 9.3.1, Kotlin 2.1.20, compile/target SDK 36, minSdk 24 and NDK 27.1.12297006. React Native's plugin pins AGP 8.12.0. Gradle installed its licensed NDK and dependency Build-Tools 35.0.0 alongside the existing 36/37 installations. This is a successful tool download, not a reason to change the Expo defaults.

## Windows native build configuration

The qualified build retains the original physical source directory, the installed SDK and Java 25. It uses these Windows-only settings:

- A dedicated pnpm virtual store at `C:/pnpm/nq02c`, with `virtualStoreDirMaxLength: 32`. These supported [pnpm path settings](https://pnpm.io/settings/node-modules) shorten dependency/CMake paths. The real monorepo needs its own store; Linux keeps separate dependencies and OS-appropriate paths.
- The junction `C:\nilumi-sdk`, verified to target the existing SDK, as process-local `ANDROID_HOME` and `ANDROID_SDK_ROOT`. No SDK files or saved SDK environment variables were moved/changed.
- Command-scoped Java options `-Djdk.net.unixdomain.tmpdir=C:\Windows\Temp --enable-native-access=ALL-UNNAMED`. The first fixes the observed Windows selector failure; the second permits Prefab CLI 2.1.0's JNA native library, avoiding a warning that AGP treated as an error. See [Java 25 native-access semantics](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/doc-files/RestrictedMethods.html).
- Short app CMake staging at `C:/nc/nq02`, through `-PnilumiWindowsCxxDir=C:/nc/nq02`. An authored Expo CNG plugin (`with-windows-cxx-staging.cjs`) sets AGP's documented [buildStagingDirectory](https://developer.android.com/reference/tools/gradle-api/8.12/com/android/build/api/dsl/Cmake#buildStagingDirectory()) only when this Windows property is supplied. It is outside the temporary Gradle `build/` directory and survives clean CNG regeneration. No generated native or vendor source is manually patched.

Both complete APK builds pass, including the final Tamagui 2.7.7 dependency matrix. The first successful clean build took 4m42s; the final matrix build took 5m03s, with 455 actionable tasks. The successful runs contain no CMake path warnings. Preserve existing JVM/Node options when wrapping commands for the actual workspace.

| Observed failure | Qualified resolution |
|---|---|
| 269-character Prefab batch path; `CreateProcess error=2`; LongPathsEnabled=0 | Short dedicated virtual store and shorter package directory names |
| Java 25 restricted-method warning from Prefab's JNA | Explicit native access for the command's JVMs |
| CMake object-directory overflow / repeated dirty Ninja manifest | Short dependency paths and app CMake staging |
| `CLANG_~1.EXE` instead of `clang++` beneath the spaced SDK path; undefined C++ standard-library symbols | SDK junction avoids the executable-name shortening |
| App JNI codegen path exceeded Ninja's 260-character limit | CNG-configured short app staging directory |

The failed build logs are archived to explain the required configuration. A temporary `N:` source alias was also tested: Gradle canonicalized it back to the physical path, so it did not resolve app staging. That alias was removed and is not part of the qualified approach. No existing drive mapping or registry setting was changed.

## Qualified native launch and remaining gates

The development APK is installed only on the emulator. The USB Pixel 8 remains authorized/reachable from the host validation; its ARM64 application build and device-specific behavior belong to SETUP-04/07. No physical-phone screenshot or identifier is archived.

Windows initially bound Metro's `--localhost` server to IPv6 `::1`, while ADB reverse forwarded to IPv4, producing an unexpected-end-of-stream load error. Command-scoped `NODE_OPTIONS=--dns-result-order=ipv4first` (appended to existing options) and `REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1` make Metro listen on IPv4 loopback. The actual app flow opens the explicit development-client URI, handles Expo's initial developer menu and validates input through Maestro. Metro runs in watch mode with two workers; do not use CI mode when testing refresh.

The generated APK is not committed. Its checksum and runtime matrix are in `android-build-manifest.json`; synthetic screenshots, the passing flow/JUnit reports and build logs are archived. The application workspace has not been created. Bring the selected pins and Windows-only short-path/CNG configuration into SETUP-03/04, then verify the actual monorepo and both target devices. Native/font/accessibility completeness, restricted DB credentials, job restart recovery, web HTTPS/PWA installation and observed CI are not inferred from these isolated checks.

After evidence capture, the qualification Metro server and its emulator ADB reverse mapping were stopped/removed. The temporary Compose project was shut down and removed without touching existing containers or volumes. Sources, pinned dependency caches, the SDK junction, CMake staging and the synthetic emulator APK remain available for inspection/reproduction. No Git staging, commit or remote change occurred; the five original staged object IDs are preserved.

Maestro's first emulator search encountered Gboard's one-time stylus tutorial, interrupting text entry. The passing Settings flow conditionally dismisses that visible tutorial and retries entry; it does not change the emulator's persistent keyboard preferences. The passing JUnit report and flow are saved in the evidence directory. Java emits a protobuf Unsafe deprecation warning during Maestro startup, but the CLI/driver/flow completes successfully.

## Disposable containers and resources

The probe uses the unique Compose project `nilumi-setup02-qualify`. PostgreSQL binds a dynamically assigned loopback port because Windows rejected the original fixed port 55482. SeaweedFS S3, Mailpit UI and SMTP bind only loopback. Existing containers and volumes are untouched.

The initial SeaweedFS volume cap of two was consumed by its default collection, preventing allocation for the S3 bucket. Raising the cap to 16 with 32 MiB logical volumes fixed the S3 round-trip. Qualification data uses bounded tmpfs; the future development stack uses named volumes and a reviewed volume-growth configuration.

Measured during Gradle + emulator + three-container operation: approximately 3.8–12 GiB free host memory at recorded samples, with the low sample during C++ compilation; Gradle JVM around 1.6 GiB working set and Kotlin daemon around 1.3 GiB in an earlier sample; qualification containers together around 160 MiB. Container limits are PostgreSQL 512 MiB/1 CPU, SeaweedFS 1 GiB/2 CPUs and Mailpit 256 MiB/0.5 CPU. Existing WSL limits of 16 GiB/8 CPUs remain unchanged. Gradle uses two workers and a 3 GiB heap; Metro also uses two workers. The build passes without changing WSL allocation. Re-measure with the actual workspace and workloads; avoid concurrent duplicate builds.

