import { expect, test } from "@playwright/test";

test("exported shell supports direct links, reload, mixed input and API transport", async ({
  page,
}) => {
  await page.goto("/?component-check=synthetic");
  await expect(page.getByRole("heading", { name: "Nilumi · வணக்கம்" })).toBeVisible();
  await page.getByRole("textbox", { name: "Mixed-script field" }).fill("சரி synthetic");
  await page.getByRole("button", { name: "Check interaction", exact: true }).click();
  await expect(page.getByText("Interaction checked · சரி")).toBeVisible();
  await expect(page.getByRole("button", { name: "Disabled button", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Check API liveness", exact: true }).click();
  await expect(page.getByText("API is alive; dependency readiness is separate")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Nilumi · வணக்கம்" })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("component-check")).toBe("synthetic");
});

test("API paths never fall back to cached/static shell content", async ({ request }) => {
  const response = await request.get("/api/v1/ready");
  expect(response.status()).toBe(503);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect((await response.json()).code).toBe("not_ready");
  expect((await request.get("/api/v1/missing")).status()).toBe(404);
});
