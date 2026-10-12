# SETUP-05 evidence — 12 October 2026

This directory contains new development qualification evidence. Earlier evidence/core documents and the original Git index/blobs remain protected by the extended preservation baseline.

| Artifact | What it records |
|---|---|
| `preservation-baseline.json` | Original core/historical hashes plus all SETUP-04 evidence, current indexed entries and index bytes |
| `windows-checks.log`, `windows-acceptance.json` | Frozen Windows install; setup/check/test/integration/boundaries/contracts; classic comparisons; dependency pin audit; diagnostics; fresh Windows package/Expo resolution |
| `linux-checks.log`, `linux-acceptance.json` | Independently prepared/frozen Linux dependencies, application checks, integrations, contracts, compiler comparisons and Expo exports |
| `integration-win32.json`, `integration-linux.json` | Actual role/grant/context checks, synthetic S3/SMTP, queue/worker restart and process readiness results |
| `resolution-win32.json`, `resolution-linux.json` | Public declaration and bundle closure checks with private sentinel absent |
| `dependency-audit.json` | 48 exact selected/latest versions, engines, peers, integrity and constrained exceptions |
| `dependency-health.json`, `dependency-health-production.json` | Non-clean npm advisory audits (all: 2 high/3 moderate; production selection: 2 high/2 moderate) |
| `otel.json` | Pinned optional collector validation, health, synthetic OTLP acceptance and content sentinel removal |
| `linux-attempt-format.log`, `windows-attempt-storage.log` | Earlier failed qualification snapshots retained for diagnosis; final results are the acceptance files |

All Windows pnpm commands used `node tooling/scripts/pnpm-local.mjs`; primary compilation used the explicit compiler-selection launcher. Integration created only isolated synthetic data and cleaned its generated Docker projects/DBs. Exact tool/image pins are in the [toolchain inventory](../../toolchain.md). See [validation](../../setup-05-validation.md) and [the runbook](../../setup-05-runbook.md) for boundaries and the unresolved dependency-security gate. These artifacts are not product/pilot admission evidence.
