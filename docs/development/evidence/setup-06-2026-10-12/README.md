# SETUP-06 evidence — 12 October 2026

All seven required GitHub jobs were observed green in
[PR run 38265453992](https://github.com/nishanthturnstile/nilumi-v2/actions/runs/38265453992),
including Android and the required aggregate. SETUP-06 functional acceptance passes.
This directory contains only new synthetic foundation evidence; core documents
and SETUP-02/03/04/05 evidence remain unchanged.

| Artifact | Purpose |
|---|---|
| `preservation-baseline.json` | SHA-256 hashes of core and all earlier evidence before SETUP-06 |
| `windows-checks.log`, `windows-acceptance.json` | Frozen install/check/Node+Vitest+Jest/contract/audit qualification |
| `linux-checks.log`, `linux-acceptance.json` | Independently installed frozen Linux qualification |
| `integration-win32.json`, `integration-linux.json` | Actual runtime roles, denial/context, synthetic transports, queue restart/readiness |
| `dependency-audit.json` | Exact versions, compatibility constraints, peers/engines/integrities |
| `contract-compat.json` | Pinned checker output against exact PR base commit |
| `contract-checker-qualification.json` | Unchanged schema accepted; removed v1 endpoint rejected |
| `contract-drift-qualification.json` | Byte drift rejected in both generated artifacts and originals restored |
| `image-build-*.log`, `image-smoke.json` | Non-root Linux image builds, production closure, live/ready/marker loss/shutdown |
| `android-debug-build.log` | Clean CNG Windows x86_64 debug build, Java 25 / Gradle 9.3.1 |
| `main-protection.json` | Observed required status/PR/admin/conversation/no-force/no-delete protection |
| `github-ci.json`, `github-artifacts.json` | Seven observed green jobs, exact source/merge commits, job URLs and immutable artifact IDs/digests |
| `github-contract-compat.json`, `github-image-smoke.json` | Actual hosted compatibility and migration/production closure/health/readiness/shutdown results |
| `github-android-debug-build.log` | Observed successful Linux CNG/debug build, 660 executed tasks |
| `github-attempt-android*.log` | Earlier failed required Android setup/native-access attempts, preserved and superseded by the green run |
| `release-artifact-record.json`, `release-duplicate-rejected.log`, `release-compose-qualification.json` | Exact local release record, overwrite rejection and synthetic Compose validation; no deployment |
| `dependency-health.json` | Non-clean advisory audit: 2 high, 4 moderate; dependency-security acceptance remains open |
| `image-attempt-*.log`, `linux-attempt-jest-path.log` | Retained failed packaging/Jest path attempts, superseded by passing results |

Playwright's two local exported-shell tests pass; its temporary HTML/trace report
is under ignored `.cache` and CI publishes browser artifacts. Local Android device
interaction/Metro evidence from SETUP-04 is preserved; SETUP-06's new clean APK
build does not imply a new physical-device or iPhone qualification. See
[the runbook](../../setup-06-runbook.md), [release scaffold](../../release-scaffold.md)
and [validation](../../setup-validation.md) for limitations and real GitHub URLs.
