# Development instructions

- Prefer Biome for supported languages. Each package pins `@biomejs/biome` and commits an inherited `biome.json`. Respect existing tooling and avoid multiple formatters on the same files.
- Read `docs/core` as the authoritative baseline and the relevant implementation plan before changes. SETUP-03 reserves infrastructure; SETUP-04 owns application shells.
- On Windows run every repository pnpm invocation through `node tooling/scripts/pnpm-local.mjs`. Use explicit `prepare`/`install`; checks must never silently install, download or change global tools.
- Preserve existing staged blobs, core documents, historical evidence and the original WSL recovery copy. Do not reset/reinitialize/stage/commit unrelated work or renormalize existing documents.
- Maintain eight private packages and their dependency direction. Public code cannot import backend code, Node IO or private environment configuration, including type-only and unreexported paths.
- Primary compiler routing comes from `tooling/typescript/compiler-selection.json`. Invoke the explicit launcher; never rely on ambiguous `tsc` bins or automatically retry failures with classic compilers. Any fallback needs reviewed evidence.
- Use exact latest-compatible stable pins, isolated dependencies and strict peers. Never force incompatible native or compiler-API versions. Update the audit and run Windows/Linux checks for dependency/tooling changes.
- Runtime configuration is process-specific, pure and redacted. No universal privileged DB URL, production fallback, real provider calls or household data in tooling tests.
- Follow naming, explicit injection, synthetic fixtures and generated-artifact guidance in CONTRIBUTING.md. Run meaningful checks appropriate to changes, report limitations honestly and do not count probes as product readiness.

## Agent skills

### Issue tracker

Track issues and specs in GitHub Issues for `nishanthturnstile/nilumi-v2`.
See `docs/agents/issue-tracker.md`.

### Domain docs

Use a single-context layout: root `GLOSSARY.md` and `docs/adr/`.
See `docs/agents/domain.md`.
