# Current Tamagui 3 client evidence

This isolated client snapshot supersedes the client selection in `../setup-02-2026-10-12/`. Backend/container evidence there remains current. See [root cause and validation](../../tamagui-3-qualification.md).

Reconstruct the client using the original snapshot's instructions, then overlay **all** `client-*` files here, removing the prefix and restoring the screen/layout/test paths as described there. In particular, use this manifest, lockfile, pnpm settings and Tamagui config together; do not mix the 2.x lockfile/config with these sources. The original generated API contract and official template assets remain required.

The `.txt` reproduction sources deliberately contain the incomplete configuration that triggers Android's radius cast failure. They are diagnostic inputs only; do not include them in the working application's TypeScript sources. The original exception identifies `borderBottomLeftRadius`; the reproduced native log identifies `borderTopLeftRadius`. The passing application uses the complete v3 config and exercises the default styled Input radius without an explicit override.

`tamagui3-original-maestro.xml` records the numeric-radius workaround before the complete config fix. `tamagui3-fixed-maestro.xml` and its log record the complete-config flow. The v3 build log is incremental; the unchanged development APK receives v3 JavaScript through Metro. The Jest log also checks the actual v3 unstyled `Input`, `ButtonFrame` and `ButtonText` exports. Screenshots show synthetic test data only.

Windows build/JVM/Metro settings remain those in the SETUP-02 report. No compiler, beta native registry or dependency patch was needed. No product app scaffolding is included in this evidence snapshot.
