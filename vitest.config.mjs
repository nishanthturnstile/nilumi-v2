import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tooling/vitest/**/*.test.mjs"], environment: "node", testTimeout: 10000 },
});
