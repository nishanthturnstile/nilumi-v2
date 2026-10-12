import { createHash } from "node:crypto";
import { existsSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { pnpm } from "./pnpm-local.mjs";
import { main, root, run } from "./process.mjs";

await main(async () => {
  const client = join(root, "apps/client");
  const android = resolve(client, "android");
  if (!android.startsWith(`${resolve(root)}${process.platform === "win32" ? "\\" : "/"}`))
    throw new Error("Native output must remain inside the workspace.");
  const tracked = await run("git", ["ls-files", "apps/client/android"], {
    capture: true,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
  });
  if (tracked.stdout.trim()) throw new Error("Refusing CNG clean over tracked native sources.");
  const env = {
    ...process.env,
    CI: "1",
    EXPO_NO_DOTENV: "1",
    EXPO_NO_TELEMETRY: "1",
    EXPO_NO_GIT_STATUS: "1",
  };
  await pnpm(
    [
      "--filter",
      "@nilumi/client",
      "exec",
      "expo",
      "prebuild",
      "--platform",
      "android",
      "--clean",
      "--no-install",
    ],
    { env },
  );
  const args = [
    "assembleDebug",
    "--no-daemon",
    "--max-workers=2",
    "-Dorg.gradle.jvmargs=-Xmx3g",
    "-PreactNativeArchitectures=x86_64",
  ];
  if (process.platform === "win32") {
    const sdk = "C:/nilumi-sdk";
    if (
      !existsSync(sdk) ||
      !env.ANDROID_HOME ||
      realpathSync(sdk) !== realpathSync(env.ANDROID_HOME)
    )
      throw new Error("Expected the qualified C:/nilumi-sdk junction to the configured SDK.");
    env.ANDROID_HOME = sdk;
    env.ANDROID_SDK_ROOT = sdk;
    env.JAVA_TOOL_OPTIONS =
      `${env.JAVA_TOOL_OPTIONS ?? ""} -Djdk.net.unixdomain.tmpdir=C:\\Windows\\Temp --enable-native-access=ALL-UNNAMED`.trim();
    const id = createHash("sha256").update(root).digest("hex").slice(0, 8);
    args.push(`-PnilumiWindowsCxxDir=C:/nc/nilumi-${id}`);
    await run("cmd.exe", ["/d", "/c", "gradlew.bat", ...args], { cwd: android, env });
  } else {
    await run("./gradlew", args, { cwd: android, env });
  }
  console.log(
    "Clean CNG emulator development APK built (x86_64). Physical-device qualification remains separate.",
  );
});
