import { expect, test } from "@playwright/test";

/**
 * Smoke test for a deployed URL (live provider, so the result may be Live or Demo; both must complete).
 * Run with: E2E_BASE_URL=https://… npx playwright test e2e/production.spec.ts
 */
test.skip(!process.env.E2E_BASE_URL, "production check needs E2E_BASE_URL");
test.setTimeout(120_000);

test("deployed app: routes respond and the primary flow completes for a signed-out visitor", async ({ page, request }, info) => {
  for (const path of ["/", "/notes", "/demo/landscape-1.jpg", "/favicon.ico"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }

  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/");
  await page.getByRole("button", { name: /A lighthouse on a cliff/ }).click();
  await page.getByRole("button", { name: "Generate" }).click();
  const card = page.getByTestId("generation").first();
  await expect(card).toBeVisible({ timeout: 90_000 });
  await expect(card.getByText(/^(Live|Demo)$/)).toBeVisible();
  await expect(card.getByRole("img")).toHaveJSProperty("complete", true);
  await page.screenshot({ path: `research/screenshots/prod-${info.project.name}-result.png` });

  await page.reload();
  await expect(page.getByTestId("generation")).toHaveCount(1);
  expect(errors).toEqual([]);
});
