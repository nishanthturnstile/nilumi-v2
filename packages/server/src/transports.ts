import nodemailer from "nodemailer";

export type TransportConfig = Readonly<{
  NILUMI_ENV: "development" | "test" | "pilot" | "production";
  NILUMI_TEST_TRANSPORTS: "disabled" | "synthetic";
  NILUMI_MAIL_TRANSPORT: "disabled" | "mailpit";
  NILUMI_SMTP_HOST?: string | undefined;
  NILUMI_SMTP_PORT?: number | undefined;
}>;
export function validateTransports(config: TransportConfig) {
  if (
    ["pilot", "production"].includes(config.NILUMI_ENV) &&
    (config.NILUMI_TEST_TRANSPORTS !== "disabled" || config.NILUMI_MAIL_TRANSPORT !== "disabled")
  )
    throw new Error("test_transport_forbidden");
  if (
    config.NILUMI_MAIL_TRANSPORT === "mailpit" &&
    (!config.NILUMI_SMTP_HOST ||
      !["127.0.0.1", "localhost", "mailpit"].includes(config.NILUMI_SMTP_HOST) ||
      !config.NILUMI_SMTP_PORT)
  )
    throw new Error("mailpit_endpoint_required");
}
export function createTestTransports(config: TransportConfig) {
  validateTransports(config);
  const requireSynthetic = (fixture: string) => {
    if (config.NILUMI_TEST_TRANSPORTS !== "synthetic" || fixture !== "setup-synthetic-v1")
      throw new Error("synthetic_fixture_required");
  };
  const mail =
    config.NILUMI_MAIL_TRANSPORT === "mailpit"
      ? nodemailer.createTransport({
          host: config.NILUMI_SMTP_HOST,
          port: config.NILUMI_SMTP_PORT,
          secure: false,
          ignoreTLS: true,
          connectionTimeout: 750,
          socketTimeout: 1000,
          logger: false,
          debug: false,
        })
      : undefined;
  return {
    async sms(fixture: string) {
      requireSynthetic(fixture);
      return { accepted: true };
    },
    async ai(fixture: string) {
      requireSynthetic(fixture);
      return { kind: "synthetic-result" };
    },
    async speech(fixture: string) {
      requireSynthetic(fixture);
      return { kind: "synthetic-speech-result" };
    },
    async email(fixture: string) {
      if (fixture !== "setup-synthetic-v1" || !mail) throw new Error("mailpit_fixture_required");
      await mail.sendMail({
        from: "setup@example.invalid",
        to: "fixture@example.invalid",
        subject: "Nilumi synthetic setup",
        text: "Content-free local fixture.",
      });
    },
    close() {
      mail?.close();
    },
  };
}
