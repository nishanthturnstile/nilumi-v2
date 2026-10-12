import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { expo } from "@better-auth/expo";
import swagger from "@fastify/swagger";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "@fastify/type-provider-zod";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import Fastify from "fastify";
import createClient from "openapi-fetch";
import openapiTS, { astToString } from "openapi-typescript";
import pg from "pg";
import { PgBoss } from "pg-boss";
import { z } from "zod";
import type { paths } from "./generated.js";
import { schema } from "./schema.js";

const Health = z.object({ status: z.literal("ok") });
const app = Fastify().withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
await app.register(swagger, {
  openapi: { info: { title: "Setup qualification", version: "0.0.0" } },
  transform: jsonSchemaTransform,
});
app.get(
  "/api/v1/health",
  { schema: { response: { 200: Health } } },
  async () => ({ status: "ok" as const }),
);
app.post(
  "/api/v1/echo",
  {
    schema: {
      body: z.object({ value: z.string().min(1) }),
      response: { 200: z.object({ value: z.string() }) },
    },
  },
  async (request) => request.body,
);
await app.ready();
assert.deepEqual(Health.parse((await app.inject("/api/v1/health")).json()), {
  status: "ok",
});
assert.equal(
  (
    await app.inject({
      method: "POST",
      url: "/api/v1/echo",
      payload: { value: "" },
    })
  ).statusCode,
  400,
);
const spec = app.swagger();
await writeFile("openapi.json", JSON.stringify(spec, null, 2));
await writeFile(
  "generated.ts",
  astToString(await openapiTS(spec as Parameters<typeof openapiTS>[0])),
);
const origin = await app.listen({ host: "127.0.0.1", port: 0 });
const client = createClient<paths>({ baseUrl: origin });
const result = await client.GET("/api/v1/health");
assert.deepEqual(result.data, { status: "ok" });
await app.close();
const pool = new pg.Pool({
  connectionString: "postgres://setup:setup-only@127.0.0.1:55482/setup",
});
const db = drizzle(pool, { schema });
const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: "synthetic-setup-only-secret-32-characters",
  baseURL: "http://127.0.0.1:55483",
  plugins: [expo()],
});
assert.equal(typeof auth.handler, "function");
const boss = new PgBoss({
  connectionString: "postgres://setup:setup-only@127.0.0.1:55482/setup",
  schema: "pgboss_setup_probe",
});
assert.equal(typeof boss.start, "function");
await pool.end();
console.log(
  "PASS: Fastify/Zod validation, OpenAPI generation, HTTP client round-trip, Better Auth/Expo/Drizzle and pg-boss imports",
);
