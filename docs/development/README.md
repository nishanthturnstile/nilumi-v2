# Developer runbook

The [SETUP-03 plan](../implementation/setup-03-workspace-and-standards.md) supplies workspace infrastructure. [Validation](setup-03-validation.md) records observed checks; [toolchain history](toolchain.md) retains SETUP-02 outcomes. SETUP-04–07 supply application/native/device/database/CI acceptance.

## Prepare and install

Use native Node 24.21.0. On Windows, run `node tooling/scripts/pnpm-local.mjs prepare`, then `node tooling/scripts/pnpm-local.mjs install --frozen-lockfile`. The ignored `.local/workspace.json` records a verified native pnpm 12.11.2 executable and owned short virtual store. Use the launcher for **every** command, for example `node tooling/scripts/pnpm-local.mjs run check` or `... exec biome check .`.

Preparation discovers the underlying native manager, removes Corepack's bootstrap marker, and explicitly prepares the exact version. If pnpm's preparation helper fails, explicit preparation can integrity-verify the exact official native artifact and place it under ignored local tooling. Routine commands never take that download path. No global Corepack/Node/pnpm/SDK settings change.

On Linux, explicitly prepare the manager with the same script or the native-artifact bootstrap used by `check:linux`; keep the default `node_modules/.pnpm` store. After preparation/install, plain `pnpm` is supported. Use independent Linux dependencies, never mounted Windows dependencies. The disposable Linux check copies only source/manifests/config/docs and installs independently in the pinned Node image.

## Commands

| Command | Behavior |
|---|---|
| `setup:check` | Pins, package tooling, ignored output and preservation |
| `check` | Preflight + Biome + native7 types/build + boundaries |
| `test` | Synthetic configuration, ownership, process and boundary behavior |
| `typecheck:compat` | Classic5/6 comparisons; TS6 stable type ordering |
| `build` | Shared libraries and config modules; no application server/export |
| `check:resolution` | Fresh copy/install, Node and TS5/6/7 consumers, fixture Expo exports |
| `check:linux` | Pinned disposable Linux installation and acceptance |
| `format` / `format:check` | Explicit authored-file formatting / read-only check |
| `audit:dependencies` | Registry snapshot and exact-pin/exception review; explicitly writes audit evidence |
| `config:check --target <target>` | Validate selected configuration; values never displayed |

Normal check/test commands may write ignored build/cache output, never authored source, lock or index. Registry audit, preparation, installation and formatting are explicitly mutating commands. There are no SETUP-03 app-start, migration, infrastructure, generated-contract or deployment commands.

## Environment files

Copy the intended target's `.env.example` to `.env.local` only when configuring it. Client config has two public values; API, worker and migrator credentials remain separate. Blank private examples intentionally fail validation until SETUP-05 supplies local credentials. Normal check/test uses synthetic inputs and needs no service.

`config:check --target api` optionally reads `apps/api/.env.local`; `--env-file <path>` requires that explicit file to exist. Process environment overrides file values. Client/worker/migrator follow the same target-specific rule. No root catch-all file or universal DATABASE_URL is loaded. Client HTTP is allowed only in development/test; pilot/production public URLs require HTTPS. Username checks are configuration hygiene, not grant qualification.

For a host/web fixture use `http://127.0.0.1:3001`. Actual emulator/LAN/phone URL and HTTPS trust are SETUP-04/07 work; there is no API listening yet.

## Troubleshooting and preservation

Missing manager/store ownership or moved checkout: run explicit prepare; never delete a foreign store. A dependency-verification mismatch requires explicit install. Maturity exceptions are exact qualified/reviewed versions; prune changes may require a second frozen install to synchronize pnpm's installed metadata. Never suppress peer checks.

The original `.git/index` hash and staged blobs are checked independently. Core/evidence hashes must remain unchanged; only planned parent/toolchain annotations are exempt. No Git staging/commit occurred. A separate clean Linux checkout can later install normally; this preservation guard belongs to the current foundation transition.

Windows native build handoff remains the tested SDK junction, separate short CXX staging, command-scoped Java socket/native-access flags and IPv4 Metro options from SETUP-02. Preserve existing JVM/Node options; implement/requalify the actual CNG wrapper during SETUP-04.
