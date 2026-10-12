import { join } from "node:path";
import { loadEnvironment } from "./config-check.mjs";
import { root } from "./process.mjs";

export async function database(command) {
  const { provision, migrate, runtimeRoles } = await import("../../packages/db/dist/release.js");
  if (command === "db:provision") {
    const input = loadEnvironment(join(root, "infra/compose/.env.local"), { explicit: true });
    const { guardDisposable } = await import("./infra.mjs");
    guardDisposable(input, command);
    const passwords = Object.fromEntries(
      [...runtimeRoles, "nilumi_migrator"].map((role) => [
        role,
        input[`${role.toUpperCase()}_PASSWORD`],
      ]),
    );
    const url = new URL("postgresql://127.0.0.1:55432/nilumi_dev");
    url.username = "nilumi_provisioner";
    url.password = input.NILUMI_PROVISIONER_PASSWORD;
    await provision(url.href, passwords);
  } else {
    const { parseMigratorEnv } = await import("../../packages/db/dist/config/migration-env.js");
    const input = loadEnvironment(join(root, "packages/db/.env.local"), { explicit: true });
    await migrate(parseMigratorEnv(input).NILUMI_MIGRATOR_DATABASE_URL);
  }
  console.log("Database release step passed; credentials are not displayed.");
}
