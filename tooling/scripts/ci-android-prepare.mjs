// Explicit SDK command-line tools 23.0 / build 16111833 preparation.
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { main, root, run } from "./process.mjs";

await main(async () => {
  if (process.platform !== "linux" || process.arch !== "x64")
    throw new Error("Linux x64 SDK preparation only.");
  const response = await fetch(
    "https://dl.google.com/android/repository/commandlinetools-linux-16111833_latest.zip",
  );
  if (!response.ok) throw new Error("sdk_tools_download_failed");
  const archive = Buffer.from(await response.arrayBuffer());
  if (
    createHash("sha256").update(archive).digest("hex") !==
    "0877a1d048fe4a24efe2eff536ca4223f7adeb58648bb81909d33c446918cfa8"
  )
    throw new Error("sdk_tools_integrity_failed");
  const directory = join(root, ".cache/android-sdk-tools");
  mkdirSync(directory, { recursive: true });
  const path = join(directory, "tools.zip");
  writeFileSync(path, archive);
  await run("unzip", ["-q", path, "-d", directory]);
  console.log("Prepared checksum-verified Android command-line tools 23.0, build 16111833.");
});
