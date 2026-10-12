import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const pnpmVersion = "12.11.2";
export const nodeVersion = "24.21.0";
export const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

export function cleanEnvironment(input = process.env) {
  const result = { ...input };
  for (const key of Object.keys(result)) {
    if (["corepack_root", "pnpm_config_pm_on_fail"].includes(key.toLowerCase())) delete result[key];
  }
  result.PNPM_CONFIG_PM_ON_FAIL = "error";
  return result;
}

export async function run(command, args, options = {}) {
  const { capture = false, allowFailure = false, ...spawnOptions } = options;
  return await new Promise((done, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: cleanEnvironment(),
      shell: false,
      windowsHide: true,
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
      ...spawnOptions,
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (data) => {
      stdout += data;
    });
    child.stderr?.on("data", (data) => {
      stderr += data;
    });
    const interrupt = () => child.kill("SIGINT");
    const terminate = () => child.kill("SIGTERM");
    process.on("SIGINT", interrupt);
    process.on("SIGTERM", terminate);
    const cleanup = () => {
      process.off("SIGINT", interrupt);
      process.off("SIGTERM", terminate);
    };
    child.once("error", (error) => {
      cleanup();
      reject(new Error(`Cannot launch ${command}: ${error.code}`));
    });
    child.once("exit", (code, signal) => {
      cleanup();
      const result = { code: code ?? (signal === "SIGINT" ? 130 : 143), stdout, stderr, signal };
      if (result.code && !allowFailure) {
        if (capture) process.stderr.write(stderr);
        reject(new Error(`Command failed (${result.code}): ${command}`));
      } else done(result);
    });
  });
}

export async function main(action) {
  try {
    await action();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
