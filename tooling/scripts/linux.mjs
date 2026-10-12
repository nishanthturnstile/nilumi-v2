import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { startSandbox } from "./infra-sandbox.mjs";
import { root, run } from "./process.mjs";
import { copyWorkspace } from "./resolution.mjs";

export const nodeImage =
  "node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20";
export async function checkLinux() {
  const parent = join(root, ".cache/linux");
  mkdirSync(parent, { recursive: true });
  const source = mkdtempSync(join(parent, "source "));
  copyWorkspace(source, { git: true });
  const output = mkdtempSync(join(parent, "results "));
  const bootstrap = `
import { writeFileSync, mkdirSync } from 'node:fs';
import { prepareArtifact, ensureOwnedStore } from '../tooling/scripts/pnpm-local.mjs';
const pnpmExecutable = await prepareArtifact('/workspace');
const virtualStoreDir = ensureOwnedStore('/workspace', '/workspace/node_modules/.pnpm');
mkdirSync('/workspace/.local', {recursive:true});
writeFileSync('/workspace/.local/workspace.json', JSON.stringify({version:1,repositoryRoot:'/workspace',pnpmExecutable,pnpmVersion:'12.11.2',virtualStoreDir}));
`;
  mkdirSync(join(source, ".cache"), { recursive: true });
  writeFileSync(join(source, ".cache/bootstrap-linux.mjs"), bootstrap);
  const sandbox = await startSandbox();
  writeFileSync(join(source, ".cache/integration-config.json"), JSON.stringify(sandbox.container));
  const script = `set -eu
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq --no-install-recommends git ca-certificates >/dev/null
mkdir /workspace
cp -a /input/. /workspace/
cd /workspace
node .cache/bootstrap-linux.mjs
node tooling/scripts/pnpm-local.mjs install --frozen-lockfile
node tooling/scripts/pnpm-local.mjs install --frozen-lockfile
node tooling/scripts/pnpm-local.mjs run check
node tooling/scripts/pnpm-local.mjs run test
node --input-type=module -e "import {readFileSync,writeFileSync} from 'node:fs'; import {integrationSuite} from './tooling/scripts/integration.mjs'; const result=await integrationSuite(JSON.parse(readFileSync('.cache/integration-config.json')));writeFileSync('/out/integration-linux.json',JSON.stringify(result,null,2));"
node tooling/scripts/pnpm-local.mjs run contracts:generate
node tooling/scripts/pnpm-local.mjs run contracts:check
node tooling/scripts/pnpm-local.mjs run typecheck:compat
node tooling/scripts/pnpm-local.mjs run check:resolution
EXPO_NO_DOTENV=1 EXPO_NO_TELEMETRY=1 EXPO_PUBLIC_NILUMI_ENV=test EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3001 node tooling/scripts/pnpm-local.mjs --filter @nilumi/client exec expo export --platform web
cp docs/development/evidence/setup-05-2026-10-12/resolution-linux.json /out/resolution-linux.json
node --input-type=module -e "import {writeFileSync} from 'node:fs'; import {preservationCheck} from './tooling/scripts/preflight.mjs'; writeFileSync('/out/linux-acceptance.json', JSON.stringify({platform:process.platform,node:process.versions.node,pnpm:'12.11.2',checks:['frozen-install','check','test','test:integration','contracts:generate','contracts:check','typecheck:compat','check:resolution','web-export'],preservation:await preservationCheck()},null,2));"
`;
  let result;
  try {
    result = await run(
      process.platform === "win32" ? "docker.exe" : "docker",
      [
        "run",
        "--rm",
        "--name",
        `nilumi-setup05-${Date.now()}`,
        "--network",
        sandbox.network,
        "--cpus",
        "4",
        "--memory",
        "4g",
        "--volume",
        `${source}:/input:ro`,
        "--volume",
        `${output}:/out`,
        nodeImage,
        "sh",
        "-c",
        script,
      ],
      { capture: true, allowFailure: true },
    );
  } finally {
    await sandbox.stop();
  }
  const evidenceDirectory = join(root, "docs/development/evidence/setup-05-2026-10-12");
  writeFileSync(join(evidenceDirectory, "linux-checks.log"), result.stdout + result.stderr);
  if (result.code)
    throw new Error(`Linux acceptance failed (${result.code}); see linux-checks.log.`);
  const { copyFileSync } = await import("node:fs");
  for (const file of ["resolution-linux.json", "linux-acceptance.json", "integration-linux.json"])
    copyFileSync(join(output, file), join(evidenceDirectory, file));
  console.log(
    "Fresh pinned Linux install, all checks, compatibility comparisons and Expo resolution pass.",
  );
}
