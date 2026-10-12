import createClient from "openapi-fetch";
import type { paths } from "./generated.js";

const client = createClient<paths>({ baseUrl: "http://127.0.0.1" });
const result = await client.GET("/api/v1/health");
if (result.data) {
  const status: "ok" = result.data.status;
  void status;
}
