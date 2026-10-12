import pino from "pino";
import { parseWorkerEnv } from "./config/env.js";
import { createWorker } from "./worker.js";

try {
  const config = parseWorkerEnv(process.env);
  const logger = pino({
    level: config.LOG_LEVEL,
    redact: { paths: ["config", "err"], remove: true },
  });
  const worker = createWorker({
    prepare: async () => {
      logger.info({ code: "worker_started" }, "shell_started");
    },
    // Dependency/migration/grant checks arrive with SETUP-05. Never claim readiness now.
    isReady: async () => false,
    dispose: async () => {
      logger.info({ code: "worker_stopped" }, "shell_stopped");
    },
    heartbeat: (state) => {
      logger.info(state, "worker_heartbeat");
    },
  });
  const stop = async () => {
    const deadline = setTimeout(() => process.exit(1), 5500);
    try {
      await worker.stop();
    } catch {
      process.exitCode = 1;
    } finally {
      clearTimeout(deadline);
    }
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  await worker.start();
} catch {
  process.stderr.write("Worker startup failed: configuration_or_startup\n");
  process.exitCode = 1;
}
