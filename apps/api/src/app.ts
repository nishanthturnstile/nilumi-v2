import { randomUUID } from "node:crypto";
import swagger from "@fastify/swagger";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "@fastify/type-provider-zod";
import { healthSchema, problemSchema, readinessSchema } from "@nilumi/contracts";
import { redactedPaths } from "@nilumi/server";
import Fastify, { LogController } from "fastify";
import { z } from "zod";
import type { Configuration } from "./config/env.js";

export interface AppDependencies {
  /** Must check required roles, dependencies and migration/grant status. */
  isReady?: (signal: AbortSignal) => Promise<boolean>;
  readinessTimeoutMs?: number;
}

export function buildApp(
  config: Pick<Configuration, "LOG_LEVEL">,
  dependencies: AppDependencies = {},
) {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      redact: { paths: redactedPaths, remove: true },
      serializers: {
        req: () => ({}),
        res: () => ({}),
        err: () => ({ type: "Error", message: "internal_error", stack: "" }),
      },
    },
    logController: new LogController({ disableRequestLogging: true }),
    requestIdHeader: false,
    genReqId: () => randomUUID(),
    forceCloseConnections: true,
  }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.register(swagger, {
    openapi: { info: { title: "Nilumi public shell", version: "1.0.0" }, openapi: "3.0.3" },
    transform: jsonSchemaTransform,
  });
  app.addHook("onRequest", async (_request, reply) => {
    reply.header("Cache-Control", "no-store");
  });
  const problem = (
    status: number,
    code: "invalid_request" | "not_found" | "not_ready" | "internal_error",
    requestId: string,
  ) => ({
    type: "about:blank",
    title: {
      invalid_request: "Invalid request",
      not_found: "Not found",
      not_ready: "Not ready",
      internal_error: "Internal error",
    }[code],
    status,
    code,
    requestId,
  });
  app.setErrorHandler((error, request, reply) => {
    const invalid =
      typeof error === "object" &&
      error !== null &&
      (("validation" in error && Boolean(error.validation)) ||
        ("statusCode" in error && error.statusCode === 400));
    const status = invalid ? 400 : 500;
    const code = status === 400 ? "invalid_request" : "internal_error";
    app.log.warn({ code, requestId: request.id }, "request_failed");
    reply
      .code(status)
      .type("application/problem+json")
      .send(problem(status, code, request.id));
  });
  app.setNotFoundHandler((request, reply) => {
    reply
      .code(404)
      .type("application/problem+json")
      .send(problem(404, "not_found", request.id));
  });
  app.register(async (routes) => {
    routes.get(
      "/api/v1/health",
      {
        schema: {
          operationId: "getHealth",
          querystring: z.strictObject({}),
          response: { 200: healthSchema, 400: problemSchema, 500: problemSchema },
        },
      },
      async () => healthSchema.parse({ status: "ok" }),
    );
    routes.get(
      "/api/v1/ready",
      {
        schema: {
          operationId: "getReadiness",
          querystring: z.strictObject({}),
          response: {
            200: readinessSchema,
            400: problemSchema,
            500: problemSchema,
            503: problemSchema,
          },
        },
      },
      async (request, reply) => {
        const controller = new AbortController();
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          const ready = await Promise.race([
            dependencies.isReady?.(controller.signal) ?? Promise.resolve(false),
            new Promise<boolean>((resolve) => {
              timeout = setTimeout(() => {
                controller.abort();
                resolve(false);
              }, dependencies.readinessTimeoutMs ?? 1000);
            }),
          ]);
          if (ready) return readinessSchema.parse({ status: "ready" });
        } catch {
          // Dependency errors are deliberately content-free at the transport boundary.
        } finally {
          clearTimeout(timeout);
          controller.abort();
        }
        return reply
          .code(503)
          .type("application/problem+json")
          .send(problem(503, "not_ready", request.id));
      },
    );
  });
  return app;
}
