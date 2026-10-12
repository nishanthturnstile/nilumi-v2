import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pnpm, preparedConfig, workspaceEnvironment } from "./pnpm-local.mjs";
import { main, root } from "./process.mjs";

// Expo owns native compatibility selection; its package-manager subprocess still
// must pass through the repository launcher, including on Windows.
await main(async () => {
  const shim = join(root, ".cache/expo-pnpm-launcher");
  mkdirSync(shim, { recursive: true });
  if (process.platform !== "win32")
    throw new Error("This adapter is for Windows; use the prepared launcher on Linux.");
  writeFileSync(
    join(shim, "pnpm.cmd"),
    `@echo off\r\n"${process.execPath}" "${join(root, "tooling/scripts/pnpm-local.mjs")}" --filter @nilumi/client %*\r\n`,
  );
  const env = workspaceEnvironment(await preparedConfig());
  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
  env[pathKey] = `${shim};${env[pathKey] ?? ""}`;
  env.EXPO_NO_DOTENV = "1";
  env.EXPO_NO_TELEMETRY = "1";
  await pnpm(
    ["--filter", "@nilumi/client", "exec", "expo", "install", "expo-dev-client@57.0.19", "--pnpm"],
    { env },
  );
});
