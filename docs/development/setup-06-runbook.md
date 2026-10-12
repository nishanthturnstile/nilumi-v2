# SETUP-06 CI and Linux artifacts

Use Node 24.21.0 and the explicit repository launcher for pnpm 12.11.2. Primary
compilation uses `tooling/typescript/compiler-selection.json` and native TypeScript
7.0.2; Biome 2.5.15 remains the sole supported-language formatter. Eight private
`@nilumi/*` packages retain their existing dependency direction. CI runs the same
manifest, AST, complete-source and resolved dependency boundary checks as the host.

## Prepare and verify

On an already prepared Windows checkout:

```powershell
node tooling/scripts/pnpm-local.mjs install --frozen-lockfile
node tooling/scripts/pnpm-local.mjs run check
node tooling/scripts/pnpm-local.mjs run test
node tooling/scripts/pnpm-local.mjs run contracts:check
node tooling/scripts/pnpm-local.mjs run contracts:prepare
node tooling/scripts/pnpm-local.mjs run contracts:qualify
node tooling/scripts/pnpm-local.mjs run contracts:qualify-drift
node tooling/scripts/pnpm-local.mjs run contracts:compat <exact-PR-base-commit-SHA>
node tooling/scripts/ci-services.mjs
node tooling/scripts/pnpm-local.mjs run test:integration
node tooling/scripts/pnpm-local.mjs exec playwright install chromium
node tooling/scripts/pnpm-local.mjs run web:export
node tooling/scripts/pnpm-local.mjs run test:web
node tooling/scripts/pnpm-local.mjs run check:linux
```

Fresh CI/container hosts explicitly run `node tooling/scripts/ci-prepare.mjs`
before frozen installation. It verifies Node and prepares the official exact
pnpm native artifact with registry integrity verification and owned local storage.
Ordinary checks never prepare tools, install modules or pull dependency images.
Linux browser preparation explicitly uses `playwright install --with-deps chromium`.

`test` runs the existing Node behavior/boundary tests, backend/API Vitest, and
Jest 29 + jest-expo 57 + RNTL native component tests. `test:integration` starts
its own randomly named disposable Compose dependencies and ephemeral database,
provisions the actual SETUP-05 roles, migrates/provisions pg-boss 12.37.1/schema
45, and verifies grants, missing context, queue restart and readiness. pg-boss is
a PostgreSQL-backed library/runtime, so its service is the restricted queue
consumer/worker against that PostgreSQL service; it has no standalone broker
image. No test reads developer DB URLs or sends real provider requests.

Playwright uses the actual exported shell and a loopback schema-validated API
fixture. Its direct-link/reload check is the existing `/` shell with a synthetic
query parameter; no product navigation journey is implied. API paths proxy
separately with `no-store` and never fall through to static HTML. No service
worker, protected-response caching, authentication journey or device readiness
is introduced by this milestone.

## Contracts

The generated OpenAPI JSON and api-client declarations are committed. Run
`contracts:check` **before** generation to detect byte drift. CI also regenerates
and runs Git diff against the committed artifacts. `contracts:qualify-drift`
proves even trailing whitespace fails for both artifacts, restores original
bytes in `finally`, then rechecks them.

oasdiff 1.33.0 is pinned by release/archive SHA-256 for Windows and Linux x64 in
`tooling/contracts/checker.json`. Explicit preparation downloads/extracts it;
comparison checks only use the prepared binary, with warning-or-higher findings
failing. Qualification proves an unchanged contract passes and removal of a v1
endpoint fails. See the [upstream checker](https://github.com/oasdiff/oasdiff/releases/tag/v1.33.0).

CI checks the **exact PR base commit**, rather than a moving branch name. The
first schema snapshot is frozen in `tooling/contracts/generated/bootstrap-v1.json`
with a checksum and exact bootstrap base commit. Only that explicitly recorded
commit can use the first-baseline exception when its contract is absent; all
other missing base contracts fail closed. The current remote baseline already
contains the generated schema, so normal comparison applies to this PR.
Never replace the bootstrap snapshot or delete retained release schemas to
clear a compatibility failure. OpenAPI checks cover structural compatibility,
not authorization, behavior, queue payload compatibility or all installed-client
semantics; those remain release review responsibilities.

## Images and local smoke

```powershell
node tooling/scripts/pnpm-local.mjs run build
node tooling/scripts/pnpm-local.mjs run build:containers
node tooling/scripts/pnpm-local.mjs run test:containers
```

Build from the **monorepo root**, using `infra/docker/Dockerfile`. Node and
dependency runtime images use the immutable digests in the toolchain inventory.
API/worker/web targets run as the existing `node` user; smoke adds a read-only
filesystem, temporary `/tmp`, drops capabilities and disables privilege gain.
Routine image commands write ignored `.cache/container-evidence`; CI and dated
qualification explicitly select `NILUMI_EVIDENCE_DIRECTORY=docs/development/evidence/setup-06-2026-10-12`.
This keeps release builds from modifying tracked qualification evidence.
API health checks use dependency readiness. Worker readiness is its content-free
heartbeat, not an HTTP endpoint. SIGTERM shutdown must return exit code zero
within ten seconds, without forced termination.

Packaging copies the installed production dependency closure without another
resolution/install. Workspace packages explicitly include their compiled exports;
DB includes immutable SQL migrations. Peer/optional dependencies are taken only
from the qualified installed graph. No devDependencies are traversed. Smoke
imports workspace exports and rejects compiler, Biome, migration-kit and Vitest
resolution in the images, then exercises live/ready, dependency marker loss,
worker heartbeat, web serving/API forwarding and clean shutdown. The earlier
legacy pnpm deploy failure is retained as evidence; no unfrozen deploy fallback
is used.

The Docker context is an allowlist, with `.env*`, dependency folders, native
generated projects, local caches, Git history, docs and signing material excluded.
Runtime credentials enter only generated ignored smoke env files or reviewed
release process configuration. No private build arguments, provider secrets or
local env files enter image layers. Web config is public build-time data: override
`EXPO_PUBLIC_API_BASE_URL` with the reviewed same-origin public URL when preparing
a later environment; the bootstrap default is loopback/test only. Never label
these shell artifacts pilot-ready.

## GitHub required checks

`.github/workflows/ci.yml` uses pull_request, push and manual dispatch, with
contents-read permission, SHA-pinned actions, pinned tools, explicit preparation
and no provider/deployment secrets. The stable `Foundation required` check gates:

- Linux foundation: frozen install, Biome, native7 build/typecheck, boundaries,
  Node/Vitest/Jest tests, byte drift, checker qualification, PR-base compatibility,
  web export.
- Windows smoke: frozen install, the portable check/test commands and client/server
  compilation.
- Restricted-role PostgreSQL/queue integration and backend Vitest.
- Playwright exported-shell/deep-link/API-path checks.
- Non-root Linux image packaging/startup/readiness/shutdown.
- Android debug smoke when bootstrap/manual/native/dependency/config/public-package
  changes require it. It cleanly regenerates CNG and builds x86_64 assembleDebug,
  with two Gradle workers and a 3 GiB heap; no per-PR emulator matrix or signing.

Android may skip only when the change detector proves no relevant change. An
unknown base builds conservatively; an unavailable base/detector failure fails
the Linux gate. A failed/cancelled dependency makes the aggregate fail.
The PR template explicitly requires this check and actual run/job evidence.
Configure `main` to require an up-to-date PR and `Foundation required`, enforce
the rule for admins, require resolved conversations and disable force pushes and
deletion, where the GitHub account plan permits protection. Do not claim this
policy is applied without the recorded API result.

Actions artifacts retain current contract/client/web artifacts for 90 days and
debug APKs for 14 days. Release artifacts must be copied to a durable immutable
release store before CI retention expires; CI artifact retention alone does not
preserve installed-client baselines indefinitely. Evidence and final acceptance
are in [setup validation](setup-validation.md) and the
[SETUP-06 evidence index](evidence/setup-06-2026-10-12/README.md).
