import {
  serializerCompiler,
  validatorCompiler,
} from "@fastify/type-provider-zod";
import Fastify from "fastify";
import { expect, test } from "vitest";
import { z } from "zod";

test("provider rejects invalid output instead of publishing a broken contract", async () => {
  const app = Fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.get(
    "/probe",
    { schema: { response: { 200: z.object({ status: z.literal("ok") }) } } },
    async () => ({ status: "invalid" }),
  );
  const response = await app.inject("/probe");
  expect(response.statusCode).toBe(500);
  expect(response.json()).not.toHaveProperty("status", "invalid");
  await app.close();
});
