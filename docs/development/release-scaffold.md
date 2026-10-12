# Manual release scaffold

This is an explicit later release procedure; SETUP-06 does not deploy, run
pilot/production migrations, provision a VM, publish registry images, sign an
application or activate EAS Update/OTA. There is no deployment workflow or
provider/deployment secret in PR CI.

## Artifact record

After required checks pass, use a clean committed checkout to build/smoke the
three images, then run:

```powershell
node tooling/scripts/pnpm-local.mjs run release:record <unique-artifact-ID>
```

The record under ignored `.local/releases/<ID>/` contains the exact commit SHA,
API/worker/web image IDs, generated OpenAPI JSON, api-client declarations and
their SHA-256 hashes. It refuses dirty checkouts, label/SHA mismatches and reuse
of an existing artifact ID. Retain the complete directory and immutable exported
image archives in the reviewed release store. Prior release schema/type artifacts
remain immutable. Before promotion, compare the proposed OpenAPI with **every
still-supported installed-client release**, using the prepared pinned checker:

```text
oasdiff breaking <retained-release>/openapi.json packages/contracts/generated/openapi.json --fail-on WARN --format json
```

PR-base compatibility is necessary but not sufficient for retained Android
clients. Record supported schema/client/queue versions in the release review;
behavioral compatibility and queue policies require their own fixtures. Keep the
previous artifact manifest available for recovery and never overwrite a release
baseline with the proposed schema.

## Privileged migration and rollout ordering

Infrastructure provisioning is separate and reviewed: SETUP-05's provisioning
step creates schemas/roles through its infrastructure identity. API, auth, worker
and queue credentials never receive owner/migrator privileges. A release receives
only `nilumi_migrator` credentials and performs **one privileged migration job**
before any new runtime is admitted as ready. That job validates immutable SQL
history, provisions pg-boss schema/definitions and the synthetic foundation
queue, then applies reviewed grants. Runtime always uses `migrate: false`.

The manual host entry is:

```powershell
# Supply only reviewed migrator configuration in this process; do not print it.
node tooling/scripts/pnpm-local.mjs run release:migrate --manual-reviewed
```

Alternatively, `infra/docker/release.compose.yaml` defines a one-shot `migrate`
service using the immutable API image and explicit `node migrate.mjs`. API and
worker depend on its successful completion; web waits for healthy API. The
scaffold requires explicit immutable image references, environment, dependency
network and process-specific role URLs with no production defaults. Only the
migration service receives the migrator URL. No ingress/host/deployment target is
selected. Review the concrete external configuration and rollout before using
it in an environment. Do not dump interpolated Compose config or credentials
into logs. Smoke qualification uses only the isolated synthetic dependency stack.

For compatible rollout, first apply backward-compatible expand migrations and
queue definitions that support **both** old/new API and worker versions. Stop
admitting traffic if the privileged step fails. Drain old workers with bounded
SIGTERM; verify durable eligible jobs survive restart, then start compatible new
workers/API and check readiness before admitting traffic. Use the same reviewed
release manifest for the pair; do not let an old worker consume an incompatible
new payload. Retain supervision and retry/recovery behavior. Publish new native
clients only after their backend contract is available; remove old fields/queue
versions only after installed-client/job compatibility review in a later release.

Rollback selects the prior immutable API/worker pair **only if** it remains
compatible with the current schema, grants, queue versions and retained jobs.
Never reverse an applied migration, delete its readiness marker or expand runtime
privileges to force rollback. If rollback compatibility fails, keep traffic
closed and use a reviewed forward repair. Real data backup/restore, product
atomicity, authorization, notification SLOs, full observability, signing and
distribution remain separate gates.
