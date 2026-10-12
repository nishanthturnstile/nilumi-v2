# Dependency security qualification

Checked 12 October 2026. Scope: the six high/moderate advisories recorded at SETUP-06;
no stack migration, signing, OTA, provider traffic or production deployment.

The previous audit is historical evidence and remains unchanged. New output is in
`evidence/setup-06-2026-10-12/dependency-remediation/`. The raw audit remains non-clean:
**2 high, 1 moderate**. The moderate decoder entry retains its original package version
but is locally patched. Neither advisory suppression nor a fabricated package version
is used. Verification status and hosted run links are recorded in `setup-validation.md`.

## Remediation

| Advisory | Change | Closure basis |
|---|---|---|
| [decode-uri-component](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) | Commit a pnpm patch for 0.2.2. Backport the 0.5.0 bounded UTF-8 scanner; remove the remaining outer per-run replacement map. | Regression tests exercise malformed keys, values, array members and fragments, including 100,000 distinct runs, inside a 10-second subprocess. Original 0.2.2 fails; the upstream 0.5.0 distinct-run case also exceeds a bounded deadline. |
| [esbuild](https://github.com/advisories/GHSA-67mh-4wv8-2f99) | Override only `@esbuild-kit/core-utils@3.3.2>esbuild` to exact 0.28.2. | Removes vulnerable 0.18.20 from the lock graph. Real Drizzle SQL generation and a second no-change generation qualify config/schema transformation. |
| [uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | Override only `xcode@3.0.1>uuid` to exact 11.1.1. | Patched CommonJS release; xcode's argument-free v4 call preserves 24-character uppercase IDs. The affected v5 buffer write rejects invalid bounds. |
| [sprintf-js](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) | Override only `@istanbuljs/load-nyc-config@1.1.0>js-yaml` to exact 4.3.2. | Removes old argparse/sprintf-js from the lock graph. Actual Istanbul loader qualifies ordinary/extended YAML and array/scalar settings; native Jest tests qualify the transformer chain. |

The decoder is reached through query-string 7.1.3 and Expo Router's bundled alternate
`react-navigation/core/getStateFromPath` parser. The main Router fork uses URLSearchParams;
its ordinary parser does not establish reachability of this dependency. Native Jest
tests deliberately exercise the alternate parser, and Playwright exercises real shell
interaction/reload with a malformed query.

The patch preserves the 0.2.2 CommonJS function export, literal-plus normalization,
type rejection, tolerant malformed-byte behavior, valid UTF-8 and percent encoding.
BOM-adjacent ASCII now decodes consistently and overlapping malformed BOM sequences
resolve left-to-right. Literal `$&`, `$` followed by a backtick, and `$'` are preserved
as data instead of replacement-string instructions. BOM/C2 compatibility passes are
linear; the scanner always advances and examines at most four bytes per sequence.
This extends the upstream fix because its outer replacement map retained quadratic
behavior for distinct runs. Preserve the package's MIT license. Source and installed
hashes are in `patch-provenance.json`; the original package version remains truthful.

Exact overrides intentionally cross the old parents' semver ranges. They are reviewed
compatibility exceptions, not broad overrides of Expo, React Native, Jest or the compiler.
UUID 11.1.1 retains CommonJS, unlike later ESM-only majors. YAML 4 removes deprecated
unsafe YAML tags; they are not part of ordinary nyc configuration. Replace these
overrides/patches when a qualified parent release resolves the corresponding chain.

The Docker build context and fresh-workspace copies include `patches/` before frozen
installation. Patch-only changes also trigger Android CI smoke.

## Temporary accepted risks

The user authorized the proposed bounded acceptance on 12 October 2026. Owner:
repository maintainer. **Review no later than 12 November 2026**, or immediately when
any condition below changes. These are local scope exceptions, not claims that the
upstream vulnerabilities are fixed. Do not close upstream/Dependabot alerts as remediated.

| Advisory | Current evidence and acceptance conditions | Reopen trigger |
|---|---|---|
| [node-forge 1.4.0 — high](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | Expo CLI/certificate tooling contains real signature-verification sinks. The app config currently has no update-signing configuration; no attacker-supplied certificate/signature verification is authorized. Tooling remains outside backend runtime images. | Any untrusted certificate/signature input, signing/updates configuration, runtime import or relevant upstream patch. Qualify a reviewed backport or published fix before enabling that path. |
| [braces 3.0.3 — high](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Installed through Metro/Jest micromatch. Inspected ordinary matching calls use picomatch, while braces AST sinks are exposed by parse/braces/braceExpand APIs. Current configuration is authored in the repository. CI is ephemeral and time bounded. | User-supplied glob/brace patterns, externally supplied configuration, direct brace parsing, new runtime imports or a relevant upstream patch. Enforce input/depth limits before any new untrusted-pattern use. |

These observations are not an exhaustive proof of every transitive call path. Review
changes to native/build configuration and dependency consumers against the conditions.
The [braces maintainer discussion](https://github.com/micromatch/braces/issues/70)
disputes the applicability to controlled patterns; the advisory still remains active.
Forge [proposed fixes](https://github.com/digitalbazaar/forge/pull/1152) are not a published
patched release. Neither discussion is treated as a vulnerability withdrawal.

## Verification and revisit

Run every repository pnpm command through `node tooling/scripts/pnpm-local.mjs` on
Windows. Frozen installs, check, test, test:integration, contracts:check, native tests,
browser tests, fresh Linux resolution/export, runtime image smoke and Android CI
qualification must pass after changing this dependency graph.

`audit:dependencies` checks registry freshness separately from native compatibility.
During this run new Expo-family patches appeared before the 1440-minute maturity gate;
the previously qualified exact family is retained with explicit policy exceptions.
Expo compatibility qualification uses the installed SDK's bundled matrix (`EXPO_OFFLINE=1`),
so live metadata cannot silently redefine the frozen family's expected versions.
The first failed live-metadata Linux attempt is retained, not relabeled as passing.
Revisit those patch selections in the next coordinated Expo qualification.

Use `NILUMI_EVIDENCE_DIRECTORY` for integration/Linux/resolution/container output and
`NILUMI_DEPENDENCY_AUDIT_OUTPUT` for the direct-selection audit when retaining new
qualification output, so historical SETUP evidence is preserved.

An audit exit code of 1 remains expected while the two accepted upstream advisories
and version-based decoder alert remain. Record its actual JSON and status. A new
advisory, changed exposure condition, expired acceptance or failed required check
requires renewed review; a green build alone cannot establish security acceptance.
