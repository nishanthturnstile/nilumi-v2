import { createTestTransports, createWorkerDependencies, redactedPaths } from "@nilumi/server";
import pino from "pino";
import { parseWorkerEnv } from "./config/env.js";
import { createWorker } from "./worker.js";

try {
  const config = parseWorkerEnv(process.env);
  const logger = pino({
    level: config.LOG_LEVEL,
    redact: {
      paths: redactedPaths,
      remove: true,
    },
  });
  const transports = createTestTransports(config);
  const dependencies = createWorkerDependencies(
    config.NILUMI_WORKER_DATABASE_URL,
    config.NILUMI_QUEUE_DATABASE_URL,
    [config.NILUMI_STORAGE_HEALTH_URL, config.NILUMI_MAIL_HEALTH_URL].filter(
      (value): value is string => Boolean(value),
    ),
  );
  const worker = createWorker(
    {
      prepare: async () => {
        await dependencies.prepare();
        logger.info({ code: "worker_started" }, "shell_started");
      },
      isReady: dependencies.isReady,
      dispose: async () => {
        transports.close();
        await dependencies.dispose();
        logger.info({ code: "worker_stopped" }, "shell_stopped");
      },
      heartbeat: (state) => {
        logger.info(state, "worker_heartbeat");
      },
    },
    { operationTimeoutMs: 5000 },
  );
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
