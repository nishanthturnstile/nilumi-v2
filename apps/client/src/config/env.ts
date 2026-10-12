import { z } from "zod";

const variables = ["EXPO_PUBLIC_API_BASE_URL", "EXPO_PUBLIC_NILUMI_ENV"];
const schema = z
  .object({
    EXPO_PUBLIC_API_BASE_URL: z
      .string()
      .trim()
      .url()
      .refine((value) => {
        try {
          const url = new URL(value);
          return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
        } catch {
          return false;
        }
      }, "public_url"),
    EXPO_PUBLIC_NILUMI_ENV: z.enum(["development", "test", "pilot", "production"]),
  })
  .superRefine((value, context) => {
    let protocol: string;
    try {
      protocol = new URL(value.EXPO_PUBLIC_API_BASE_URL).protocol;
    } catch {
      return;
    }
    if (["pilot", "production"].includes(value.EXPO_PUBLIC_NILUMI_ENV) && protocol !== "https:")
      context.addIssue({
        code: "custom",
        path: ["EXPO_PUBLIC_API_BASE_URL"],
        message: "https_required",
      });
  });
export type ClientConfiguration = Readonly<z.output<typeof schema>>;
export function parseClientEnv(input: Record<string, string | undefined>): ClientConfiguration {
  const unknown = Object.keys(input).filter(
    (key) => key.startsWith("EXPO_PUBLIC_") && !variables.includes(key),
  );
  if (unknown.length) throw new Error("Invalid configuration: unapproved public variable names");
  const result = schema.safeParse(input);
  if (!result.success)
    throw new Error(
      "Invalid configuration: " +
        result.error.issues.map((issue) => `${String(issue.path[0])}:${issue.code}`).join(", "),
    );
  return Object.freeze(result.data);
}
export function getClientConfig(): ClientConfiguration {
  return parseClientEnv({
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_NILUMI_ENV: process.env.EXPO_PUBLIC_NILUMI_ENV,
  });
}
