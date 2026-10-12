# SETUP-05 local runbook

Run from the Windows checkout on `development`; quote its absolute path when changing directories. Every Windows pnpm invocation uses `node tooling/scripts/pnpm-local.mjs`. Explicitly run `prepare` and `install --frozen-lockfile` if the workspace is not prepared. Ordinary checks never install dependencies or pull images.

## Prepare local services

Explicitly pull the three tag+digest image references in `infra/compose/compose.yaml` with `docker pull <reference>` before startup. Pull the pinned OTel image separately if diagnostics are wanted. Startup and integration commands use `--pull never` and fail if images are absent.

Copy `infra/compose/.env.example` to `.env.local`. Keep `NILUMI_ENV=development` and `NILUMI_DISPOSABLE=YES`; fill in independent disposable provisioning, migrator, API, auth, worker and queue passwords. These are local disposable credentials, never pilot/production credentials. Provisioning passwords stay in that infrastructure file; do not copy it into an application process.

```powershell
node tooling/scripts/pnpm-local.mjs run infra:up
node tooling/scripts/pnpm-local.mjs run db:provision
```

Copy `packages/db/.env.example` to `.env.local`; set only the release role URL: `postgresql://nilumi_migrator:<URL-encoded-local-password>@127.0.0.1:55432/nilumi_dev`. Keep provisioning/owner credentials out of this file. Then:

```powershell
node tooling/scripts/pnpm-local.mjs run db:migrate
node tooling/scripts/pnpm-local.mjs run db:migrate
```

Migration validates the immutable SQL checksum and database history. Do not edit a migration already applied to a retained database, delete its marker, or give runtime roles migration privileges to clear a failure. Use a reviewed new migration for schema/grant changes, or the explicit reset below for disposable development.

## Process configuration and endpoints

Copy API/worker examples to their own ignored `.env.local`. Supply API/auth URLs only to API and worker/queue URLs only to worker, using each exact `nilumi_*` username and its own password. Each URL targets `127.0.0.1:55432/nilumi_dev`. Set `NILUMI_STORAGE_HEALTH_URL=http://127.0.0.1:58333` and `NILUMI_MAIL_HEALTH_URL=http://127.0.0.1:58025/readyz` in both process files. No root `DATABASE_URL` or provisioning fallback exists. The blank examples deliberately fail validation.

To enable synthetic adapters explicitly, set `NILUMI_TEST_TRANSPORTS=synthetic`. For local email additionally set `NILUMI_MAIL_TRANSPORT=mailpit`, `NILUMI_SMTP_HOST=127.0.0.1`, and `NILUMI_SMTP_PORT=51025`. Test adapters accept `setup-synthetic-v1`, not arbitrary phone numbers, OTPs, prompts or recordings. Their enablement fails startup in pilot/production; disabled adapters provide no live-provider fallback.

| Surface | Host process / browser | Service-network endpoint |
|---|---|---|
| PostgreSQL | `127.0.0.1:55432` | `postgres:5432` |
| SeaweedFS S3 / reachability | `http://127.0.0.1:58333` | `http://seaweed:8333` |
| Mailpit SMTP | `127.0.0.1:51025` | `mailpit:1025` |
| Mailpit UI / readiness | `http://127.0.0.1:58025` / `/readyz` | `http://mailpit:8025` / `/readyz` |
| API live / ready | `http://127.0.0.1:3001/api/v1/health` / `/api/v1/ready` | Host API is not a Compose service |
| Worker heartbeat | Pino `worker_heartbeat` with `ready` boolean | Host worker is not a Compose service |
| Metro development client | Host port `8082`, explicit emulator ADB reverse | Host Metro is not a Compose service |
| Optional OTLP HTTP / collector health | `127.0.0.1:54318` / `127.0.0.1:51313` | `otel:4318` / `otel:13133` |

Service names resolve only on the Compose network. In a container, loopback means that container. Master/filer/volume administration ports are not host-published. Local S3 is disposable development storage without pilot credentials; S3 signing, CORS, presigned transfer/expiry and production access policies remain separate gates.

```powershell
node tooling/scripts/pnpm-local.mjs run build
node tooling/scripts/pnpm-local.mjs run config:check -- --target api
node tooling/scripts/pnpm-local.mjs run config:check -- --target worker
node --env-file=apps/api/.env.local apps/api/dist/main.js
# In another terminal:
node --env-file=apps/worker/.env.local apps/worker/dist/main.js
# In another terminal, with the public client example configured:
node tooling/scripts/pnpm-local.mjs --filter @nilumi/client exec expo start --dev-client --port 8082
```

For Android, use the existing [shell runbook](setup-04-runbook.md) and explicit emulator ADB reverse for Metro 8082 and API 3001. Only the public API base URL and mode enter client configuration. Do not expose DB/SMTP/service URLs through Expo variables.

`/health` reports liveness. `/ready` returns 200 only after actual role/migration/grant/queue and dependency checks pass; otherwise it returns a safe 503 Problem with a generated request ID. Worker startup requires DB/queue compatibility and emits content-free readiness heartbeats every ten seconds; migration/dependency loss changes the heartbeat to false. A queue error latches unready; investigate and restart after correction.

## Stop, reset and diagnostics

```powershell
node tooling/scripts/pnpm-local.mjs run infra:down
# Explicit destruction of this disposable project's three data volumes:
node tooling/scripts/pnpm-local.mjs run dev:reset -- --confirm-disposable
# Optional diagnostics:
node tooling/scripts/pnpm-local.mjs run infra:up -- --diagnostics
node tooling/scripts/pnpm-local.mjs run diagnostics:check
```

Normal down retains volumes. Reset requires both disposable-development markers and the confirmation flag; it targets only the fixed `nilumi-disposable-dev` project. Docker/Compose target overrides and non-local daemon contexts are rejected. Do not place pilot/production data in this project. Stop host processes before reset; then repeat provisioning/migration. Diagnostics have no external exporter or content/log pipeline; the application has no automatically enabled OTel SDK.

## Verification and troubleshooting

Run `setup:check`, `check`, `test`, `test:integration`, `boundaries`, `contracts:generate`, `contracts:check`, `audit:dependencies`, and `check:linux` through the launcher. Integration starts a randomly named Compose project with random loopback ports, creates an ephemeral DB, uses actual runtime credentials and deletes only its own generated resources in cleanup. It needs cached images and a local Docker daemon. It never reads the developer's DB URLs or data.

`check:linux` explicitly prepares a fresh pnpm artifact and performs frozen installs in the pinned Node container, including Git/CA package preparation. It shares a separate disposable service network, runs the same integration suite with independently installed Linux modules, and copies content-free evidence into SETUP-05. It does not mount Windows `node_modules`. Evidence writing is explicit qualification output; normal checks do not fetch or repair tools.

If startup fails, first validate the intended private file; diagnostics show variable names/codes, never values. Verify cached image digests, local Docker context and dependency health. A port conflict requires stopping the specific conflicting local service; do not clean unrelated Docker projects. A changed retained PostgreSQL password must be applied through the explicit provision step; changing `POSTGRES_PASSWORD` alone cannot modify an initialized volume. Pending application/pg-boss migrations or grant mismatches require release review; runtime cannot self-repair. Raw SQL/provider errors should not be copied into routine logs. Keep synthetic tests separate from real data, and use [validation](setup-05-validation.md) for the qualification limits.
