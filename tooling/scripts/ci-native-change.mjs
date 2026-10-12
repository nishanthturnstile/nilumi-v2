import { appendFileSync } from "node:fs";
import { main, run } from "./process.mjs";

await main(async () => {
  const base = process.env.NILUMI_CHANGE_BASE_SHA;
  let build = true;
  if (base && /^[0-9a-f]{40}$/.test(base) && !/^0+$/.test(base)) {
    const result = await run("git", ["diff", "--name-only", base, "HEAD"], { capture: true });
    build = result.stdout
      .split(/\r?\n/)
      .some(
        (path) =>
          /^(apps\/client\/|packages\/ui\/|packages\/api-client\/|packages\/contracts\/|patches\/|package\.json$|pnpm-|biome\.json$|tooling\/|\.github\/workflows\/)/.test(
            path,
          ) || /(^|\/)(package\.json|tsconfig[^/]*\.json|babel\.config\.[^/]+)$/.test(path),
      );
  }
  // Run bootstrap, manual, unknown base and relevant changes; no unconditional skip.
  appendFileSync(process.env.GITHUB_OUTPUT, `android=${build}\n`);
});
