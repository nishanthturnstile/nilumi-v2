import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readJson, root } from "./process.mjs";
import { manifest, packages } from "./workspace.mjs";

export async function auditDependencies() {
  const policy = readJson(join(root, "tooling/dependency-policy.json"));
  const manifests = [readJson(join(root, "package.json")), ...packages.map((pkg) => manifest(pkg))];
  const requests = new Map();
  for (const pkg of manifests) {
    for (const [name, value] of Object.entries({
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    })) {
      if (value === "workspace:*") continue;
      const match = value.startsWith("npm:") ? /^npm:(.+)@(\d+\.\d+\.\d+)$/.exec(value) : null;
      const realName = match ? match[1] : name;
      const version = match ? match[2] : value;
      if (!/^\d+\.\d+\.\d+$/.test(version))
        throw new Error(`Non-exact dependency: ${pkg.name} ${name}`);
      const key = `${realName}@${version}`;
      const existing = requests.get(key) ?? { name: realName, selected: version, owners: [] };
      existing.owners.push(pkg.name);
      requests.set(key, existing);
    }
  }
  const queue = [...requests.values()];
  const records = [];
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (queue.length) {
        const entry = queue.shift();
        const response = await fetch(
          `https://registry.npmjs.org/${encodeURIComponent(entry.name)}`,
        );
        if (!response.ok) throw new Error(`Dependency registry lookup failed: ${entry.name}`);
        const metadata = await response.json();
        const selected = metadata.versions[entry.selected];
        const latest = metadata["dist-tags"].latest;
        if (!selected || selected.deprecated)
          throw new Error(`Missing/deprecated selected package: ${entry.name}@${entry.selected}`);
        const exception = policy.exceptions[`${entry.name}@${entry.selected}`] ?? null;
        if (latest !== entry.selected && !exception)
          throw new Error(
            `Unreviewed version exception: ${entry.name}@${entry.selected} (latest ${latest})`,
          );
        records.push({
          ...entry,
          latest,
          exception,
          published: metadata.time[entry.selected],
          engines: selected.engines ?? {},
          peers: selected.peerDependencies ?? {},
          integrity: selected.dist.integrity,
        });
      }
    }),
  );
  const output = {
    checkedAt: new Date().toISOString(),
    policy: "latest compatible stable",
    packages: records.sort(
      (a, b) => a.name.localeCompare(b.name) || a.selected.localeCompare(b.selected),
    ),
  };
  const destination = join(
    root,
    process.env.NILUMI_DEPENDENCY_AUDIT_OUTPUT ??
      "docs/development/evidence/setup-06-2026-10-12/dependency-audit.json",
  );
  mkdirSync(join(root, "docs/development/evidence/setup-06-2026-10-12"), { recursive: true });
  writeFileSync(destination, `${JSON.stringify(output, null, 2)}\n`);
  console.log(
    `Audited ${records.length} exact dependency selections; all non-latest selections have explicit constraints.`,
  );
}
