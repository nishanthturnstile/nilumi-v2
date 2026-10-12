import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { readJson, root } from "./process.mjs";

export const ownership = {
  contracts: [],
  db: [],
  "api-client": ["contracts"],
  server: ["contracts", "db"],
  api: ["contracts", "db", "server"],
  worker: ["contracts", "db", "server"],
  ui: [],
  client: ["contracts", "api-client", "ui"],
};
export const packages = Object.keys(ownership).map((id) => ({
  id,
  name: `@nilumi/${id}`,
  path: `${["client", "api", "worker"].includes(id) ? "apps" : "packages"}/${id}`,
  built: !["client", "ui"].includes(id),
}));
export const publicPackages = new Set(["client", "ui", "contracts", "api-client"]);
export function filesBelow(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return filesBelow(path);
    return entry.isFile() && /\.(?:[cm]?ts|tsx|[cm]?js|jsx)$/.test(entry.name) ? [path] : [];
  });
}
export const manifest = (pkg, base = root) => readJson(join(base, pkg.path, "package.json"));
