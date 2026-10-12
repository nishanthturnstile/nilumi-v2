import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tooling/playwright",
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: ".cache/playwright-report", open: "never" }]],
  outputDir: ".cache/playwright-results",
  use: { baseURL: "http://127.0.0.1:8082", trace: "retain-on-failure" },
  webServer: [
    {
      command: "node tooling/scripts/web-fixture.mjs",
      url: "http://127.0.0.1:3001/api/v1/health",
      reuseExistingServer: false,
    },
    {
      command: "node infra/docker/web-server.mjs",
      url: "http://127.0.0.1:8082",
      reuseExistingServer: false,
      env: {
        NILUMI_WEB_DIRECTORY: "apps/client/dist",
        NILUMI_API_UPSTREAM: "http://127.0.0.1:3001",
        PORT: "8082",
      },
    },
  ],
});
