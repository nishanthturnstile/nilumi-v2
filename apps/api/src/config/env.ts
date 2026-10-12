import { z } from "zod";

const mode = z.enum(["development", "test", "pilot", "production"]);
const logLevel = z
  .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
  .default("info");
const databaseUrl = (role: string) =>
  z
    .string()
    .trim()
    .min(1)
    .refine((value) => {
      try {
        const url = new URL(value);
        const credentials = decodeURIComponent(url.username + url.password);
        return (
          ["postgres:", "postgresql:"].includes(url.protocol) &&
          decodeURIComponent(url.username) === role &&
          Boolean(url.hostname && url.pathname.slice(1) && url.password) &&
          !/replace|placeholder|<|>/i.test(credentials)
        );
      } catch {
        return false;
      }
    }, "database_role_url");

export class ConfigurationError extends Error {
  readonly issues: ReadonlyArray<{ variable: string; code: string }>;
  constructor(issues: ReadonlyArray<{ variable: string; code: string }>) {
    super(
      "Invalid configuration: " +
        issues.map((issue) => `${issue.variable}:${issue.code}`).join(", "),
    );
    this.name = "ConfigurationError";
    this.issues = issues;
  }
}

const schema = z
  .object({
    NILUMI_ENV: mode,
    NILUMI_TEST_TRANSPORTS: z.enum(["disabled", "synthetic"]).default("disabled"),
    NILUMI_MAIL_TRANSPORT: z.enum(["disabled", "mailpit"]).default("disabled"),
    NILUMI_SMTP_HOST: z.enum(["127.0.0.1", "localhost", "mailpit"]).optional(),
    NILUMI_SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    NILUMI_STORAGE_HEALTH_URL: z.url().optional(),
    NILUMI_MAIL_HEALTH_URL: z.url().optional(),
    HOST: z.string().trim().min(1).default("127.0.0.1"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    LOG_LEVEL: logLevel,
    NILUMI_API_DATABASE_URL: databaseUrl("nilumi_api"),
    NILUMI_AUTH_DATABASE_URL: databaseUrl("nilumi_auth"),
  })
  .superRefine((value, context) => {
    if (
      ["pilot", "production"].includes(value.NILUMI_ENV) &&
      (value.NILUMI_TEST_TRANSPORTS !== "disabled" || value.NILUMI_MAIL_TRANSPORT !== "disabled")
    )
      context.addIssue({
        code: "custom",
        path: ["NILUMI_TEST_TRANSPORTS"],
        message: "test_transport_forbidden",
      });
    if (
      value.NILUMI_MAIL_TRANSPORT === "mailpit" &&
      (!value.NILUMI_SMTP_HOST || !value.NILUMI_SMTP_PORT)
    )
      context.addIssue({
        code: "custom",
        path: ["NILUMI_SMTP_HOST"],
        message: "mailpit_endpoint_required",
      });
  });

export type Configuration = Readonly<z.output<typeof schema>>;
export function parseApiEnv(input: Record<string, string | undefined>): Configuration {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new ConfigurationError(
      result.error.issues.map((issue) => ({
        variable: String(issue.path[0] ?? "configuration"),
        code: issue.code,
      })),
    );
  return Object.freeze(result.data);
}
