# SETUP-04 evidence

12 October 2026. Synthetic application-shell qualification only. Read [the validation report](../../setup-04-validation.md) for scope and remaining gates.

- `preservation-baseline.json`: task-start historical-file and current index snapshot, separate from retained SETUP-03 evidence.
- `dependency-audit.json`: exact stable pins, engines, peers, publication timestamps, registry integrity and reviewed compatibility exceptions.
- `windows-check.log`, `windows-tests.log`, `windows-compat.log`, `windows-frozen-install.log`: authored checks and explicit compiler comparisons.
- `linux-checks.log`, `linux-acceptance.json`, `resolution-linux.json`: fresh pinned Linux install, behavior/codegen/compilation and public export evidence.
- `resolution-win32.json`: actual public entrypoints, declaration consumers and synthetic native/web resolution; this complements the real shell build.
- `android-build.log`, `native-build.json`: clean CNG x86_64 development build and APK hash. Generated Android sources/APK remain ignored.
- `maestro-component-check.log`, `android.png`: real emulator field edit, button interaction and mixed-script/error/disabled rendering.
- `metro-reload.log`, `metro-reload-result.json`: temporary marker observed on the existing development APK; source restored.
- `web-export.log`, `web-runtime.json`, `web-light.png`, `web-dark.png`: static export and Edge runtime behavior, fonts, focus and narrow layout.
- `expo-install.log`: Expo compatibility installation of the development client through the prepared Windows launcher adapter.
- `windows-acceptance.json`: observed versions, checks and preservation summary.

Asset/template/archive provenance and licensed font/icon notices are committed under `apps/client/assets`; generated OpenAPI and TypeScript contracts are committed under their owning packages. No private configuration is required to regenerate contracts. No provider, actual database role, product handler, real household or production operation is exercised by this milestone.
