import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = path.resolve("dist");
const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(
    new URL(req.url, "http://localhost").pathname,
  );
  const file = path.resolve(
    root,
    `.${pathname === "/" ? "/index.html" : pathname}`,
  );
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  try {
    const data = await readFile(file);
    res.setHeader(
      "content-type",
      file.endsWith(".js")
        ? "application/javascript"
        : file.endsWith(".html")
          ? "text/html"
          : "application/octet-stream",
    );
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await page.getByText("Nilumi setup qualification", { exact: true }).waitFor();
await page.getByPlaceholder("Synthetic input").fill("setup");
await page.getByRole("button", { name: "Validate input", exact: true }).click();
await page.getByText("Qualification passed", { exact: true }).waitFor();
await page.screenshot({ path: "web-probe.png" });
assert.deepEqual(errors, []);
await browser.close();
await new Promise((resolve) => server.close(resolve));
console.log(
  "PASS: exported Expo/Tamagui web hydrates and handles input/button interaction in Windows Edge; no browser page errors",
);
