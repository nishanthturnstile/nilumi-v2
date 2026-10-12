import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { root, run } from "./process.mjs";

const image =
  "otel/opentelemetry-collector-contrib:0.162.0@sha256:39923a8e431bd1f57be82411999d389fcfe40857492e4365456d97a4c1f74be6";
export async function diagnostics() {
  const docker = process.platform === "win32" ? "docker.exe" : "docker";
  const name = `nilumi-setup05-otel-test-${randomUUID().slice(0, 8)}`;
  const binding = `${join(root, "infra/compose/otel.yaml")}:/etc/otel.yaml:ro`;
  await run(docker, [
    "run",
    "--rm",
    "--pull=never",
    "--volume",
    binding,
    image,
    "validate",
    "--config=/etc/otel.yaml",
  ]);
  try {
    await run(
      docker,
      [
        "run",
        "-d",
        "--pull=never",
        "--name",
        name,
        "--memory",
        "256m",
        "--cpus",
        "0.5",
        "--volume",
        binding,
        "-p",
        "127.0.0.1::4318",
        "-p",
        "127.0.0.1::13133",
        image,
        "--config=/etc/otel.yaml",
      ],
      { capture: true },
    );
    const port = async (target) =>
      (await run(docker, ["port", name, target], { capture: true })).stdout
        .trim()
        .split(":")
        .at(-1);
    const health = await port("13133");
    const http = await port("4318");
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        ready = (await fetch(`http://127.0.0.1:${health}`)).ok;
      } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error("otel_health_failed");
    const result = await fetch(`http://127.0.0.1:${http}/v1/traces`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        resourceSpans: [
          {
            resource: {
              attributes: [{ key: "service.name", value: { stringValue: "nilumi.synthetic" } }],
            },
            scopeSpans: [
              {
                spans: [
                  {
                    traceId: "12345678901234567890123456789012",
                    spanId: "1234567890123456",
                    name: "PRIVATE-SENTINEL",
                    kind: 1,
                    startTimeUnixNano: "1791800000000000000",
                    endTimeUnixNano: "1791800000001000000",
                    attributes: [{ key: "otp", value: { stringValue: "PRIVATE-SENTINEL" } }],
                  },
                ],
              },
            ],
          },
        ],
      }),
    });
    if (!result.ok) throw new Error("otel_synthetic_trace_failed");
    await new Promise((resolve) => setTimeout(resolve, 500));
    const logs = await run(docker, ["logs", name], { capture: true });
    if ((logs.stdout + logs.stderr).includes("PRIVATE-SENTINEL"))
      throw new Error("otel_content_leak");
    const directory = join(root, "docs/development/evidence/setup-05-2026-10-12");
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      join(directory, "otel.json"),
      `${JSON.stringify({ image, validation: "pass", health: "pass", syntheticOtlp: "pass", contentSentinelAbsent: true, limitations: "Optional local collector only; application SDK instrumentation and operational alerting are not qualified." }, null, 2)}\n`,
    );
    console.log(
      "Optional local OTel collector validates, accepts synthetic trace and excludes content sentinel.",
    );
  } finally {
    await run(docker, ["rm", "--force", name], { capture: true, allowFailure: true });
  }
}
