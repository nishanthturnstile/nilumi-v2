import { z } from "zod";

export const healthSchema = z.strictObject({ status: z.literal("ok") });
export const readinessSchema = z.strictObject({ status: z.literal("ready") });
export const problemSchema = z.strictObject({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  code: z.enum(["invalid_request", "not_found", "not_ready", "internal_error"]),
  requestId: z.string(),
});
export type Health = z.infer<typeof healthSchema>;
export type Problem = z.infer<typeof problemSchema>;
