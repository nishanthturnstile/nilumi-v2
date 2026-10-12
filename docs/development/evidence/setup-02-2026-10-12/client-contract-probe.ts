import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import createClient from "openapi-fetch";
import type { paths } from "./generated-contract";
export const transport = createClient<paths>({ baseUrl: "http://127.0.0.1" });
export const authTransport = createAuthClient({
  baseURL: "http://127.0.0.1",
  plugins: [
    expoClient({ scheme: "nilumi-setup02-probe", storage: SecureStore }),
  ],
});
async function compileResponse() {
  const { data } = await transport.GET("/api/v1/health");
  if (data) {
    const status: "ok" = data.status;
    return status;
  }
}
void compileResponse;
