# SETUP-04 shell qualification

12 October 2026, Asia/Calcutta. Application shells and public health contracts are implemented. Results qualify the development shell; they do not establish product, infrastructure or pilot readiness.

| Gate | Windows | Fresh Linux |
|---|---|---|
| Exact dependencies, strict peers, frozen install | Pass | Pass |
| Biome, explicit native7 compilation/typecheck, boundaries | Pass | Pass |
| Synthetic behavior tests, including independent worker process | 26/26 | 26/26 |
| Contract generation and byte-level drift check | Pass | Pass |
| Generated public declarations under TS5/6/7 | Pass | Pass |
| Negative ambient/type/export and public source closure checks | Pass | Pass |
| Expo compatibility and static web export | Pass | Pass |
| Browser hydration, labelled input, edit/button interaction, disabled state, focus, fonts, narrow layout and both themes | Edge pass | Browser runtime not exercised |
| Clean CNG Android x86_64 development APK | Pass: 660 tasks, 13m49s | Native build not exercised |
| Installed APK, emulator field/button flow | Maestro pass, API 37 / Fabric | Not applicable |
| Metro refresh without APK rebuild | Marker observed; source restored | Not applicable |

Evidence is in [the SETUP-04 directory](evidence/setup-04-2026-10-12/README.md). The final fresh Linux run checks its independently installed dependency tree, never Windows node_modules. All eight application compiler selections remain native7; classic compilers are explicit compatibility comparisons and codegen peers. The dependency audit records 41 exact selections, including the reviewed fresh scoped Fastify Zod provider 1.0.1 and Expo-compatible native version exceptions.

The API validates requests and responses, rejects invalid handler output safely, separates live/ready status and bounds failing or stalled readiness probes. Its generated client performs a real loopback health round-trip and rejects malformed DTOs. Native transport uses `credentials: omit`; web uses `same-origin`. These tests do not implement authentication cookies, CSRF or tenant cache isolation. Worker tests cover startup failure, independent process startup/heartbeat, readiness loss, timeout and idempotent bounded shutdown; Linux additionally observes SIGTERM disposal. Windows force-termination of a child process is not counted as POSIX signal qualification.

## Runtime findings corrected

- Metro needs extensionless authored imports in client/UI source; Node-built packages retain NodeNext `.js` imports. Both actual public package entrypoints compile and bundle.
- Tamagui v3's web DOM primitives require explicit ARIA props; React Native accessibility props were appearing as inert browser attributes. The screen now selects platform-specific labels/states, and browser queries verify them.
- Tamagui's input line-height is a multiplier across these runtimes. Passing 26 made a roughly 416-unit line box; the corrected 1.6 preserves a normal field on Android and web. Minimum control dimensions still grow with native text scaling.
- Mixed-script splitting can produce empty boundary runs. Omitting those runs removes duplicate offset keys; the final runtime has no resulting key warning.
- Metro's Windows `--localhost` listener was IPv6-only; default binding and explicit ADB reverse resolved emulator access. The first-run developer prompt appeared after bundling, so the flow waits before dismissing it. The native field uses a stable test ID to avoid tapping its visible label.
- A temporary marker proved Metro delivery on the existing APK. The marker was removed and original source bytes restored. No native rebuild was used for that check.

Tamagui's internal package-export fallback warnings, upstream native/Gradle deprecation warnings and Maestro's Java 25 Unsafe warning remain visible. They are not suppressed or represented as application failures. Browser runtime checks capture both page and console errors; the final run has none.

## Preservation and completion boundary

The repository already had an initial commit when this work began. SETUP-03's older index snapshot therefore failed before edits. The old snapshot and all historical evidence were retained; a separate SETUP-04 baseline checks 101 protected files, all 186 indexed entries and the current index bytes. Core documents and the original WSL recovery copy remain untouched. No Git staging, reset, reinitialization or commit was performed.

API/worker readiness intentionally remains false until SETUP-05 supplies actual role, dependency and migration/grant checks. No privileged universal DB URL, production fallback, provider call or household fixture is introduced. This does not qualify restricted database grants, queue recovery, authentication, product state transitions, physical Android/arm64, iPhone Safari/PWA/HTTPS installation, full TalkBack/VoiceOver behavior, signing/distribution, offline persistence, service workers or production operations. The explicit 200% text sample and labelled controls are shell diagnostics, not a complete accessibility audit or product readiness claim.

Use [the shell runbook](setup-04-runbook.md) for commands and [implementation notes](../implementation/setup-04-shells-and-contracts.md) for ownership and CNG/codegen design.
