# Nilumi v2

Nilumi's Android and responsive web/PWA client share contracts with one backend and a separate worker. The authoritative product, architecture and design requirements live in [docs/core](docs/core/). SETUP-03 supplies workspace infrastructure; application screens, endpoints and service startup begin in SETUP-04.

Use Node **24.21.0**, pnpm **12.11.2**, TypeScript **7.0.2** for primary checks/builds, and Biome **2.5.15**. Classic TypeScript 5.9.3/6.0.3 remains isolated for compiler-API tools and compatibility checks.

## Windows quick start

Run in native PowerShell in this checkout:

```powershell
node tooling/scripts/pnpm-local.mjs prepare
node tooling/scripts/pnpm-local.mjs install --frozen-lockfile
node tooling/scripts/pnpm-local.mjs run check
node tooling/scripts/pnpm-local.mjs run test
node tooling/scripts/pnpm-local.mjs run typecheck:compat
node tooling/scripts/pnpm-local.mjs run check:resolution
```

Every Windows pnpm invocation goes through the launcher, including `exec`, `add` and `why`. It supplies the owned short dependency-store path and invokes a verified prepared native executable. Ordinary commands do not download or repair dependencies. Only explicit `prepare` and `install` perform those operations; existing global tools remain unchanged.

## Linux quick start

With native Node 24.21.0 and a pnpm bootstrap executable available:

```sh
node tooling/scripts/pnpm-local.mjs prepare
node tooling/scripts/pnpm-local.mjs install --frozen-lockfile
pnpm check
pnpm test
pnpm typecheck:compat
pnpm check:resolution
```

Linux keeps its own dependencies. Do not reuse Windows `node_modules`, stores or native outputs. The [developer runbook](docs/development/README.md) explains disposable Linux verification, configuration and troubleshooting.

## Package ownership

Client → UI/API-client/contracts; API/worker → server/DB/contracts; server → DB/contracts; API-client → contracts. UI, contracts and DB have no Nilumi package dependencies. The [workspace standards](docs/development/workspace-standards.md) describe exports, compiler selection and enforcement.

`check` runs safe preflight, Biome, compilation/typechecks and boundaries. `test` runs synthetic tooling/configuration behavior tests. `check:resolution` verifies real package entrypoints and synthetic Expo Android/web bundling in an isolated copy. These checks do not certify a running application, native APK, database privileges, physical device or pilot release.
