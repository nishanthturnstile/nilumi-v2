import { healthSchema } from "@nilumi/contracts";
import createClient from "openapi-fetch";
import type { paths } from "./generated/schema.js";

export type { paths } from "./generated/schema.js";
export function createApiClient(options: {
  baseUrl: string;
  platform: "web" | "native";
  fetch?: typeof globalThis.fetch;
}) {
  const transport = createClient<paths>({
    baseUrl: options.baseUrl,
    credentials: options.platform === "native" ? "omit" : "same-origin",
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });
  return {
    transport,
    async getHealth(signal?: AbortSignal) {
      const result = await transport.GET("/api/v1/health", signal ? { signal } : {});
      if (!result.response.ok) throw new Error("health_unavailable");
      return healthSchema.parse(result.data);
    },
  };
}
