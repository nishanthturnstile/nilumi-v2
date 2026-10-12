# SETUP-05 development qualification

12 October 2026, Asia/Calcutta. The local dependency/bootstrap/transport implementation is present. Functional foundation checks pass on Windows and independently installed Linux. Dependency-security acceptance remains open; this is not a clean security audit or product/pilot readiness claim.

| Gate | Windows | Fresh Linux |
|---|---|---|
| Frozen install, exact pins, isolated dependencies, strict peers | Pass | Pass, two frozen installs |
| `setup:check`, `check`, explicit native7 compilation, boundaries | Pass | Pass |
| Synthetic behavior tests | 29/29 | 29/29 |
| `contracts:generate` / `contracts:check` | Pass, no contract change | Pass |
| Classic5/6 comparisons and public declarations under TS5/6/7 | Pass | Pass |
| Fresh public package/Expo Android and web resolution | Pass | Pass |
| Dependency/service health, synthetic S3 put/read/delete | Pass | Pass |
| Repeatable provisioning and immutable migration bootstrap | Pass | Pass |
| Actual runtime roles: privileged assumption, DDL, owner change and truncate denied | Pass | Pass |
| Test-only forced RLS: missing context denied, commit/rollback clears same pooled connection | Pass | Pass |
| Restricted enqueue, queue supervision, queue policy changes denied | Pass | Pass |
| Pending baseline/queue migration and missing grants fail readiness without repair | Pass | Pass |
| Eligible synthetic job survives independent worker process restart | Pass | Pass |
| API `/ready` and worker heartbeat reflect actual dependencies and migration loss | Pass | Pass |
| Synthetic local SMTP captured by Mailpit | Pass | Pass |
| Test SMS/AI/speech fixture validation; pilot/production enablement rejected | Pass | Pass |
| Pino content/credential/OTP redaction and generated request IDs | Pass | Pass |
| Optional pinned OTel collector validation, health and synthetic OTLP | Pass, Linux/amd64 container | Independently installed application SDK not exercised |
| npm advisory audit, all workspace dependencies | **Non-clean: 2 high, 3 moderate** | Same frozen dependency selections; registry audit recorded on host |

The [evidence index](evidence/setup-05-2026-10-12/README.md) identifies exact commands and results. Integration uses randomly named Compose projects, random loopback ports and an ephemeral test database; it never uses developer role URLs, pilot/prod credentials or household data. Linux connects over service names on its own disposable network and installs its own modules in the pinned Node image. Windows processes reach the container dependencies through their published loopback ports.

The queue qualification uses pg-boss 12.37.1/schema 45 with runtime migrations, scheduling, reindexing and persisted queue-stat partitions disabled. Consumers retain supervision. Tests revoke enqueue/supervision grants and change the queue version to prove failure without runtime repair, then restore only through the test migrator. Queue-policy mutation is denied. The synthetic handler's only effect is validation, so repeated invocation is harmless. Recovery covers an eligible job retained while the consumer/worker is stopped, not exhaustive crash timing, domain effects, queue SLOs or backup restoration.

The API and worker have real dependency checks in their independent composition roots. A missing baseline or changed checksum/version/grant fails readiness; the API returns safe 503, and the worker heartbeat becomes false. Pool limits total twelve configured connections for one API/worker pair; release/test connections require separate headroom. No product table, product RLS, Better Auth registration, domain/ledger atomicity, job authorization or live provider is qualified by these checks.

## Dependency-security limitation

The exact-pin/engine/peer/integrity audit passes for 48 selections. Both frozen installs and all compiler/runtime checks pass. `pnpm audit --json` exits 1 with five advisories; `--prod` exits 1 with four (2 high, 2 moderate). Their full dependency paths are retained separately from the passing qualification results.

| Package/path | Severity | Status |
|---|---|---|
| Drizzle Kit → esbuild-kit → esbuild 0.18.20 | Moderate | Newly introduced release-tool dependency; [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99). The affected development-server feature is not invoked by these SQL migration/build commands; this is a bounded usage observation, not remediation. |
| Expo/config plugins → xcode → uuid 7.0.3 | Moderate | Present in the starting lock; [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq). |
| Expo/router → query-string → decode-uri-component 0.2.2 | Moderate | Present in the starting lock; [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr). |
| Expo/code-signing-certificates → node-forge 1.4.0 | High | Present in the starting lock; audit reports no published patched selection; [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv). |
| Metro/file-map → micromatch → braces 3.0.3 | High | Present in the starting lock; audit reports no published patched selection; [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). |

No blanket overrides, native-family upgrades or incompatible compiler-API replacements were forced. Dependency-security acceptance requires a separately reviewed compatible upstream update or constrained mitigation with evidence; it remains an open gate. The audit has not established exploitability or absence of risk in the application, and production-dependency classification alone does not establish runtime reachability.

## Preservation and limits

SETUP-05 extends the prior preservation baseline to hash all SETUP-04 evidence, retaining the original snapshot. Core documents, SETUP-02/03/04 evidence, indexed blobs and index bytes are unchanged. No Git staging, reset, reinitialization or commit occurred. The original WSL recovery copy was not accessed or modified.

A Git read refreshed index stat metadata during review. Preservation rejected that change; every indexed blob was verified unchanged, then the original index bytes were restored from a hash-matching disposable qualification snapshot. The final preservation check passes against the original baseline.

During implementation, one Linux snapshot caught an unformatted diagnostics branch; the corrected final snapshot passes. A bounded S3 fixture exposed that master health could precede gateway readiness; Compose now checks both master and S3. The failed attempts are retained under the new evidence directory. Deprecation warnings from the upstream Expo uuid and Drizzle Kit esbuild-kit tree remain visible.

Local S3 CRUD does not qualify signing, CORS, presigned upload/download expiry, access policies or deletion/retention semantics. The optional OTel profile is a local collector with no external exporter or application auto-instrumentation; full GlitchTip/Uptime Kuma, alerting and production telemetry are deferred. Signing/OTA, physical devices, pilot backup/restore, real SMS/email/model/speech sends and all product authorization remain outside SETUP-05.
