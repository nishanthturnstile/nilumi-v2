// Explicit exact Linux JDK preparation; no version/range resolution or JVM fallback.
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { main, root } from "./process.mjs";

await main(async () => {
  if (process.platform !== "linux" || process.arch !== "x64")
    throw new Error("Linux x64 JDK preparation only.");
  const response = await fetch(
    "https://github.com/adoptium/temurin25-binaries/releases/download/jdk-25.0.4.1%2B1/OpenJDK25U-jdk_x64_linux_hotspot_25.0.4.1_1.tar.gz",
  );
  if (!response.ok) throw new Error("jdk_download_failed");
  const archive = Buffer.from(await response.arrayBuffer());
  if (
    createHash("sha256").update(archive).digest("hex") !==
    "dbb698396d478e7fa2b1e50f4103324b2a99b90569ee27c33f2261f9215cf41e"
  )
    throw new Error("jdk_integrity_failed");
  mkdirSync(join(root, ".cache"), { recursive: true });
  writeFileSync(join(root, ".cache/temurin-25.0.4.1_1.tar.gz"), archive);
  console.log("Prepared checksum-verified Temurin 25.0.4.1+1 Linux x64 archive.");
});
