import { z } from "zod";

const mode = z.enum(["development", "test", "pilot", "production"]);
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

const schema = z.object({
  NILUMI_ENV: mode,
  NILUMI_MIGRATOR_DATABASE_URL: databaseUrl("nilumi_migrator"),
});

export type Configuration = Readonly<z.output<typeof schema>>;
export function parseMigratorEnv(input: Record<string, string | undefined>): Configuration {
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
