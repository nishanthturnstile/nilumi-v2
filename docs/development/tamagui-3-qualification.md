# Tamagui 3 qualification and correction

12 October 2026. Tamagui **3.0.3**, the npm `latest` release checked today, is now selected for SETUP-02 alongside `@tamagui/core` and `@tamagui/config` **3.0.3**. The earlier 2.7.7 recommendation is superseded. The failed probe did not establish a general incompatibility with Expo 57 or React Native 0.86.3.

## Cause and reproduction

The original error preserved in Maestro's emulator hierarchy identifies `borderBottomLeftRadius` on `AndroidTextInput`, followed by `java.lang.String cannot be cast to java.lang.Double`. The initial probe combined v3 styled controls with an incomplete v2-style configuration: numeric radius keys, a small numeric font scale and camelCase theme keys.

The published v3 [Input skin](https://github.com/tamagui/tamagui/blob/a49cc7ea6b93ba384e77a4880ae48ac4a5635c14/code/ui/tamagui/src/components/Input.tsx) defaults to `size="md"`, which applies `borderRadius: "md"`, `fontSize: "sm"` and named spacing. Our radius tokens did not contain `md`. That unresolved string reached a native radius property requiring a number. Web export and the JavaScript component renderer did not detect Android's property setter failure.

The isolated reproduction confirms the causal link: the incomplete configuration with an explicit numeric input radius passes Maestro; removing that override causes the same string-to-number exception on `borderTopLeftRadius`. Which corner appears first varies with native property application order. The original exception and reproduction log are archived in [v3 evidence](evidence/tamagui-3-2026-10-12/).

## Qualified fix

Use v3-compatible configuration rather than downgrading or patching installed dependencies. The probe uses the complete `defaultConfig` from `@tamagui/config/v6`, including named radius/font/space tokens, control sizing and hyphenated theme keys. It spreads that configuration into `createTamagui` and sets `onlyAllowShorthands: false` for its explicit style properties. The styled Input deliberately has **no explicit radius override**, so the passing Android flow exercises the previously failing default.

All Tamagui packages are aligned at 3.0.3; the lockfile has one core/web version and peer context. No optional compiler or beta native registry is enabled, and no native module, Java version or SDK setting is added to fix this issue. Metro was restarted with a cleared cache after changing the configuration.

V3 unstyled behavior is imported separately. The tested surface is `Input`, `ButtonFrame` and `ButtonText` from `tamagui/unstyled`; **that surface does not export `Button`** in 3.0.3. Compose the frame/text primitives with Nilumi's own styles instead of carrying forward the v2 `unstyled` prop. Styled controls remain available from `tamagui` or component subpaths. See the [v3 migration guide](https://tamagui.dev/docs/guides/how-to-upgrade) and [native setup guidance](https://tamagui.dev/docs/core/native).

The v6 defaults are a qualification baseline, not approval to change Nilumi's product palette, typography or dimensions. During SETUP-04, retain the documented design values while defining complete v3-compatible tokens/fonts/themes and testing the actual primitives. Do not replace the full configuration with a tiny custom token object while continuing to use default styled skins.

## Observed validation

| Check | Result |
|---|---|
| Exact installation | pnpm 12.9.1 strict-peer, frozen install passes |
| TypeScript / Biome | Client TypeScript 6.0.3 passes; pinned Biome checks nine authored files |
| Expo compatibility | `expo install --check` passes; Expo Doctor 21/21 |
| Component tests | 2/2 pass: styled input/button interaction and unstyled Input/ButtonFrame/ButtonText behavior |
| Web | Clear-cache static Expo export; Windows Edge enters text and presses button; no browser page errors |
| Android runtime | API 37 / Android 17 emulator, Fabric, actual input/button Maestro flow 1/1 passes in 1m14s including cold bundling; screenshot inspected |
| Windows native build | Java 25 / Gradle 9.3.1 incremental `assembleDebug` passes in 1m03s; 455 tasks, 19 executed and 436 up-to-date |

The upgrade is JavaScript/configuration-only, so the development APK checksum remains `63eb3d7bc96e88ce383e0df0e42e5a32f79c0e8de0e808e44700a86eda3cdb4f`; Metro delivers the v3 application code. This run is an incremental build, not another clean CNG/native compilation. Earlier clean native builds and their Windows settings remain recorded in [SETUP-02 qualification](setup-02-qualification.md).

Metro still reports internal Tamagui package-export fallbacks; these are nonfatal in the passing checks and were not silenced. The missing token/theme warnings and native radius crash are resolved. Physical Android phone, iPhone Safari/PWA and actual application/CI checks remain their planned later gates.

The new [client evidence snapshot](evidence/tamagui-3-2026-10-12/) supersedes only the client selection; the original SETUP-02 evidence remains intact for historical comparison and backend/container reproduction. No application workspace scaffold or Git staging/commit was made.

After evidence capture, the qualification Metro server was stopped and its emulator ADB reverse mapping removed. The synthetic emulator APK and temporary probe sources remain available for reproduction.
