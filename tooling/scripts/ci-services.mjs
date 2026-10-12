// Explicit image preparation, separate from test/start commands using --pull never.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { main, root, run } from "./process.mjs";

await main(async () => {
  const source = readFileSync(join(root, "infra/compose/compose.yaml"), "utf8");
  const images = [...source.matchAll(/^ {4}image: (.+)$/gm)].map((match) => match[1].trim());
  for (const image of images.slice(0, 3))
    await run(process.platform === "win32" ? "docker.exe" : "docker", ["pull", image]);
});
