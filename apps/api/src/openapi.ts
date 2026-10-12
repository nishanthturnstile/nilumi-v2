import type { OpenAPIV3 } from "openapi-types";
import { buildApp } from "./app.js";

/** Registers schemas in memory. Never listens, loads environment, or connects. */
export async function generateOpenApi() {
  const app = buildApp({ LOG_LEVEL: "silent" });
  try {
    await app.ready();
    const document = app.swagger() as OpenAPIV3.Document;
    for (const path of Object.values(document.paths ?? {})) {
      for (const operation of [path?.get]) {
        for (const [status, response] of Object.entries(operation?.responses ?? {})) {
          if (
            Number(status) >= 400 &&
            "content" in response &&
            response.content?.["application/json"]
          ) {
            response.content["application/problem+json"] = response.content["application/json"];
            delete response.content["application/json"];
          }
        }
      }
    }
    return document;
  } finally {
    await app.close();
  }
}
