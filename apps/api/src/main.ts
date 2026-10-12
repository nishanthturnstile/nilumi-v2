import { createApiDependencies, createTestTransports } from "@nilumi/server";
import { buildApp } from "./app.js";
import { parseApiEnv } from "./config/env.js";

try {
  const config = parseApiEnv(process.env);
  const transports = createTestTransports(config);
  const dependencies = createApiDependencies(
    config.NILUMI_API_DATABASE_URL,
    config.NILUMI_AUTH_DATABASE_URL,
    [config.NILUMI_STORAGE_HEALTH_URL, config.NILUMI_MAIL_HEALTH_URL].filter(
      (value): value is string => Boolean(value),
    ),
  );
  const app = buildApp(config, { isReady: dependencies.isReady });
  app.addHook("onClose", async () => {
    transports.close();
    await dependencies.dispose();
  });
  try {
    await dependencies.prepare();
  } catch {
    await app.close();
    throw new Error("api_dependencies_failed");
  }
  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 5000);
    try {
      await app.close();
    } catch {
      app.log.error({ code: "api_shutdown_failed" }, "shell_shutdown_failed");
      process.exitCode = 1;
    } finally {
      clearTimeout(deadline);
    }
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    await app.listen({ host: config.HOST, port: config.PORT });
  } catch {
    await stop();
    throw new Error("api_listen_failed");
  }
  app.log.info({ code: "api_started" }, "shell_started");
} catch {
  process.stderr.write("API startup failed: configuration_or_startup\n");
  process.exitCode = 1;
}
