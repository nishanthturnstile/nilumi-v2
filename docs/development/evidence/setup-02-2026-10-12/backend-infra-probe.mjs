import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import nodemailer from "nodemailer";
import pg from "pg";
import { PgBoss } from "pg-boss";
import { schema } from "./schema.ts";

const port = process.env.SETUP_PROBE_PG_PORT;
assert.ok(port && /^\d+$/.test(port), "Disposable PostgreSQL port required");
const connectionString = `postgres://setup:setup-only@127.0.0.1:${port}/setup`;
const pool = new pg.Pool({ connectionString });
const migration = await readFile(
  "probe-migrations/0000_clumsy_harrier.sql",
  "utf8",
);
await pool.query("CREATE SCHEMA IF NOT EXISTS auth_probe");
if (
  !(await pool.query("SELECT to_regclass('auth_probe.user') AS existing"))
    .rows[0].existing
)
  await pool.query(migration);
const auth = betterAuth({
  database: drizzleAdapter(drizzle(pool, { schema }), { provider: "pg" }),
  secret: "synthetic-setup-only-secret-32-characters",
  baseURL: "http://127.0.0.1:55483",
  emailAndPassword: { enabled: true },
  plugins: [expo()],
});
const registered = await auth.api.signUpEmail({
  body: {
    email: `${randomUUID()}@example.invalid`,
    password: "Synthetic-setup-only-password",
    name: "Setup fixture",
  },
});
assert.ok(registered.user.id);
const bootstrap = new PgBoss({
  connectionString,
  schema: "pgboss_setup_probe",
});
bootstrap.on("error", (e) =>
  console.error("bootstrap queue error:", e.message),
);
await bootstrap.start();
await bootstrap.createQueue("setup_probe");
await bootstrap.stop();
const worker = new PgBoss({
  connectionString,
  schema: "pgboss_setup_probe",
  migrate: false,
});
worker.on("error", (e) => console.error("queue error:", e.message));
await worker.start();
const processed = new Promise((resolve, reject) => {
  worker
    .work("setup_probe", { pollingIntervalSeconds: 1 }, async (jobs) => {
      for (const job of jobs) {
        assert.equal(job.data.kind, "synthetic-setup");
        resolve();
      }
    })
    .catch(reject);
});
const jobId = await worker.send("setup_probe", { kind: "synthetic-setup" });
assert.ok(jobId);
let timer;
await Promise.race([
  processed,
  new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("Queue processing timeout")),
      20000,
    );
  }),
]);
clearTimeout(timer);
await worker.stop();
await pool.end();
console.log(
  "PASS: PostgreSQL/Drizzle/Better Auth registration and pg-boss runtime job execution",
);
const s3 = new S3Client({
  endpoint: "http://127.0.0.1:58333",
  region: "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId: "synthetic", secretAccessKey: "synthetic" },
});
const Bucket = "nilumi-setup-probe";
await s3.send(new CreateBucketCommand({ Bucket }));
await s3.send(
  new PutObjectCommand({
    Bucket,
    Key: "fixture.txt",
    Body: "content-free setup fixture",
  }),
);
const object = await s3.send(
  new GetObjectCommand({ Bucket, Key: "fixture.txt" }),
);
assert.equal(
  await object.Body.transformToString(),
  "content-free setup fixture",
);
await s3.send(new DeleteObjectCommand({ Bucket, Key: "fixture.txt" }));
await s3.send(new DeleteBucketCommand({ Bucket }));
s3.destroy();
const smtp = nodemailer.createTransport({
  host: "127.0.0.1",
  port: 51025,
  secure: false,
  ignoreTLS: true,
});
await smtp.sendMail({
  from: "setup@example.invalid",
  to: "fixture@example.invalid",
  subject: "Nilumi synthetic setup probe",
  text: "Content-free local-only fixture.",
});
const messages = await (
  await fetch("http://127.0.0.1:58025/api/v1/messages")
).json();
assert.ok(messages.total >= 1);
console.log(
  "PASS: PostgreSQL/Drizzle/Better Auth registration, pg-boss bootstrap and runtime job execution, SeaweedFS S3 round-trip/delete, Mailpit local SMTP capture",
);
