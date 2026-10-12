# Developer runbook

The [SETUP-03 plan](../implementation/setup-03-workspace-and-standards.md) supplies workspace infrastructure. [SETUP-04](setup-04-runbook.md) supplies application shells. [SETUP-05](setup-05-runbook.md) supplies local dependencies, restricted DB/queue release steps and real process readiness. [Toolchain history](toolchain.md) retains earlier qualification outcomes; device/CI and product acceptance remain separate gates.

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
| `infra:up` / `infra:down` | Guarded local dependency startup / stop, retaining named volumes |
| `dev:reset -- --confirm-disposable` | Explicit destruction of only the disposable-development volumes |
| `db:provision` / `db:migrate` | Separate provisioning and checked release-only migration |
| `test:integration` | Actual runtime credentials, disposable DB, queue restart, local S3/SMTP |
| `diagnostics:check` | Optional pinned local collector and synthetic OTLP check |

Normal check/test commands may write ignored build/cache output, never authored source, lock or index. Registry audit, preparation, installation, formatting and integration qualification evidence are explicit operations. SETUP-05 adds local infrastructure and DB release commands; deployment remains outside this foundation.

## Environment files

Copy the intended target's `.env.example` to `.env.local` only when configuring it. Client config has two public values; API, worker, migrator and provisioning credentials remain separate. Blank private examples intentionally fail validation; use the SETUP-05 runbook to provision independent local credentials. Normal check/test uses synthetic inputs and needs no service; `test:integration` explicitly starts isolated dependencies.

`config:check --target api` optionally reads `apps/api/.env.local`; `--env-file <path>` requires that explicit file to exist. Process environment overrides file values. Client/worker/migrator follow the same target-specific rule. No root catch-all file or universal DATABASE_URL is loaded. Client HTTP is allowed only in development/test; pilot/production public URLs require HTTPS. Username checks are configuration hygiene, not grant qualification.

For a host/web fixture use `http://127.0.0.1:3001`. Follow the SETUP-04/05 runbooks for process startup and emulator reverse ports; physical-phone/LAN and HTTPS trust remain separate qualification.

## Troubleshooting and preservation

Missing manager/store ownership or moved checkout: run explicit prepare; never delete a foreign store. A dependency-verification mismatch requires explicit install. Maturity exceptions are exact qualified/reviewed versions; prune changes may require a second frozen install to synchronize pnpm's installed metadata. Never suppress peer checks.

The original `.git/index` hash and staged blobs are checked independently. Core/evidence hashes must remain unchanged; only planned parent/toolchain annotations are exempt. No Git staging/commit occurred. A separate clean Linux checkout can later install normally; this preservation guard belongs to the current foundation transition.

Windows native build handoff remains the tested SDK junction, separate short CXX staging, command-scoped Java socket/native-access flags and IPv4 Metro options from SETUP-02. Preserve existing JVM/Node options; implement/requalify the actual CNG wrapper during SETUP-04.
