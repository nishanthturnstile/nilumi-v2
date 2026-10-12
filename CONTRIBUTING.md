# Contributing to Nilumi

Read [the core baseline](docs/core/), [workspace standards](docs/development/workspace-standards.md) and [the runbook](docs/development/README.md). Preserve existing staged work; do not reset or stage unrelated changes.

Use short focused branches and reviewable changes. Product authorization and state transitions belong to shared backend services. HTTP/queue adapters invoke those services; UI renders data and callbacks. Prefer explicit function/factory injection over frameworks, generic repositories or speculative layers.

Branch from current `development` using `codex/<short-purpose>` (or a reviewed team prefix), keep
branches short lived, and open focused PRs into `development`. Promote reviewed `development` to
`main` through a PR using the repository template. Do not push directly to protected `main`, force
push shared branches or merge while `Foundation required` is failing. The aggregate includes
conditional Android smoke; its job names and protection policy are documented in the SETUP-06 runbook.

Use kebab-case files, PascalCase components and camelCase functions. Framework-required route names and `.native`/`.web` extensions are exceptions. Use explicit type imports and named exports except where a framework requires a default. Handle errors at process/transport boundaries; return stable safe codes without request contents, SQL or provider details. Logs must exclude household content, credentials, cookies, phone numbers and OTPs.

Biome is the only formatter/linter for supported authored languages. Run `format`, then `check`, relevant behavior tests and compiler comparisons when changing dependencies/configuration. Markdown/YAML/SQL use editor settings/manual review until a demonstrated need requires dedicated tooling. Do not rewrite qualification evidence or generated artifacts.

Add dependencies with exact versions through the prepared launcher (`add --save-exact`). Run `audit:dependencies`, review engines/peers/build scripts, update the lock explicitly, then verify frozen Windows/Linux installs. Keep Expo's native/React family together; do not weaken strict peer or maturity checks. Document any non-latest selection and its revisit condition in `tooling/dependency-policy.json`.

Fixtures must be synthetic and isolated. Test behavior, boundary rejection, configuration privacy and meaningful failure modes. Application/API/worker test frameworks arrive with their implementations rather than fake-success commands. SETUP-05 supplies separate reviewed provisioning/migration commands; runtime processes never perform DDL. See the local dependency runbook for disposable integration fixtures. Deployment remains a later milestone.
