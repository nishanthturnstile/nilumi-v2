import { afterEach, describe, expect, test } from "vitest";
import { buildApp } from "../../apps/api/dist/app.js";
import { createApiClient } from "../../packages/api-client/dist/index.js";
import { healthSchema, problemSchema } from "../../packages/contracts/dist/index.js";

const apps = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});
describe("schema-validated API adapter", () => {
  test("live transport uses generated client; private request inputs stay out of errors", async () => {
    const app = buildApp({ LOG_LEVEL: "silent" });
    apps.push(app);
    const baseUrl = await app.listen({ host: "127.0.0.1", port: 0 });
    expect(
      healthSchema.parse(await createApiClient({ baseUrl, platform: "web" }).getHealth()),
    ).toEqual({ status: "ok" });
    for (const url of ["/api/v1/health?private=SYNTHETIC_SENTINEL", "/SYNTHETIC_SENTINEL"]) {
      const response = await app.inject({ url, headers: { "x-request-id": "SYNTHETIC_SENTINEL" } });
      expect([400, 404]).toContain(response.statusCode);
      expect(problemSchema.parse(response.json()).requestId).not.toBe("SYNTHETIC_SENTINEL");
      expect(response.body).not.toContain("SYNTHETIC_SENTINEL");
      expect(response.headers["cache-control"]).toBe("no-store");
    }
  });
  test("readiness follows dependency loss while liveness remains available", async () => {
    let ready = true;
    const app = buildApp({ LOG_LEVEL: "silent" }, { isReady: async () => ready });
    apps.push(app);
    expect((await app.inject("/api/v1/ready")).statusCode).toBe(200);
    ready = false;
    const response = await app.inject("/api/v1/ready");
    expect(response.statusCode).toBe(503);
    expect(problemSchema.parse(response.json()).code).toBe("not_ready");
    expect((await app.inject("/api/v1/health")).statusCode).toBe(200);
  });
});
