import { buildApp } from "./app.js";
import { parseApiEnv } from "./config/env.js";

try {
  const config = parseApiEnv(process.env);
  const app = buildApp(config);
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
  await app.listen({ host: config.HOST, port: config.PORT });
  app.log.info({ code: "api_started" }, "shell_started");
} catch {
  process.stderr.write("API startup failed: configuration_or_startup\n");
  process.exitCode = 1;
}
