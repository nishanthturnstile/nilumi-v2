// Explicit release job. This file is never imported by API/worker startup.
import { parseMigratorEnv } from "./node_modules/@nilumi/db/dist/config/migration-env.js";
import { migrate } from "./node_modules/@nilumi/db/dist/release.js";

try {
  if (process.env.NILUMI_RELEASE_REVIEWED !== "YES") throw new Error("review_required");
  await migrate(parseMigratorEnv(process.env).NILUMI_MIGRATOR_DATABASE_URL);
  process.stdout.write("Release schema and queue provisioning passed.\n");
} catch {
  process.stderr.write("Release migration failed: configuration_or_migration\n");
  process.exitCode = 1;
}
