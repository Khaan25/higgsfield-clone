import { expect, test as base, type Page } from "@playwright/test";
import fs from "node:fs";

const EXAMPLE = "A lighthouse on a cliff at golden hour, waves crashing, cinematic wide shot";

/** Every test fails on any console error unless that test declares it as expected. */
const test = base.extend<{ consoleErrors: string[]; allowConsoleErrors: RegExp[] }>({
  allowConsoleErrors: [[], { option: true }],
  consoleErrors: async ({ page }, provide) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await provide(errors);
  },
});

test.afterEach(async ({ consoleErrors, allowConsoleErrors }) => {
  expect(consoleErrors.filter((e) => !allowConsoleErrors.some((r) => r.test(e)))).toEqual([]);
});

const prompt = (page: Page) => page.getByLabel("Describe your image");
const generate = (page: Page) => page.getByRole("button", { name: "Generate" });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Type an idea/ })).toBeVisible();
});

test("navigation: header, source link, logo and key dialog", async ({ page }) => {
  await expect(page).toHaveTitle(/Lumen Studio/);
  await expect(page.getByRole("link", { name: /Source/ })).toHaveAttribute("href", "https://github.com/Khaan25/higgsfield-clone");
  await page.getByRole("button", { name: /Gemini key|Add key/ }).click();
  await expect(page.getByRole("dialog", { name: "Use your own Gemini key" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("link", { name: "Lumen" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("prompt validation: empty, too long, and recovery", async ({ page }) => {
  await generate(page).click();
  await expect(page.getByText("Describe the image you want first.")).toBeVisible();
  await expect(prompt(page)).toHaveAttribute("aria-invalid", "true");

  await prompt(page).fill("x".repeat(1001));
  await generate(page).click();
  await expect(page.getByText(/Keep it under 1000 characters/)).toBeVisible();
  await expect(page.getByText("1001/1000")).toBeVisible();

  await prompt(page).fill("a quiet harbour at dawn");
  await expect(page.getByText(/Keep it under/)).toBeHidden();
  await expect(page.getByTestId("generation")).toHaveCount(0);
});

test("demo generation: labelled result and deterministic image", async ({ page }) => {
  await page.getByRole("button", { name: EXAMPLE }).click();
  await expect(prompt(page)).toHaveValue(EXAMPLE);
  await expect(page.getByRole("button", { name: /Aspect ratio: 16:9/ })).toBeVisible();
  await generate(page).click();

  const card = page.getByTestId("generation").first();
  await expect(card).toBeVisible();
  await expect(card.getByText("Demo", { exact: true })).toBeVisible();
  await expect(card.getByRole("img")).toHaveAttribute("src", "/demo/landscape-1.jpg");
  await expect(page.getByTestId("fallback-banner")).toContainText("Showing demo images");
});

test("result presentation: lightbox details, copy-ready prompt, reuse settings", async ({ page }) => {
  await prompt(page).fill("a red bicycle against a brick wall");
  await page.getByRole("button", { name: /^Style:/ }).click();
  await page.getByRole("menuitemradio", { name: /Cinematic/ }).click();
  await generate(page).click();
  await page.getByRole("button", { name: "Open image 1" }).click();

  const dialog = page.getByRole("dialog", { name: "Image details" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Demo sample (not generated from this prompt)")).toBeVisible();
  await expect(dialog.getByText("a red bicycle against a brick wall")).toBeVisible();
  await expect(dialog.getByText("Cinematic")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Download" })).toBeVisible();
  await page.keyboard.press("Escape");
  await prompt(page).fill("something else entirely");
  await page.getByRole("button", { name: "Open image 1" }).click();

  await dialog.getByRole("button", { name: "Reuse settings" }).click();
  await expect(dialog).toBeHidden();
  await expect(prompt(page)).toHaveValue("a red bicycle against a brick wall");
  await expect(page.getByRole("button", { name: /^Style: Cinematic/ })).toBeVisible();
});

test("history: persists across reload, search and delete", async ({ page }) => {
  for (const p of ["a snowy mountain cabin", "a bowl of fresh oranges"]) {
    await prompt(page).fill(p);
    await generate(page).click();
    await expect(page.getByTestId("generation").filter({ hasText: p })).toBeVisible();
  }
  await page.reload();
  await expect(page.getByTestId("generation")).toHaveCount(2);
  await expect(prompt(page)).toHaveValue("a bowl of fresh oranges"); // draft restored too

  await page.getByPlaceholder("Search prompts").fill("cabin");
  await expect(page.getByTestId("generation")).toHaveCount(1);
  await page.getByPlaceholder("Search prompts").fill("");

  await page.getByTestId("generation").filter({ hasText: "cabin" }).getByRole("button", { name: "Delete generation" }).click();
  await expect(page.getByTestId("generation")).toHaveCount(1);
  await page.reload();
  await expect(page.getByTestId("generation")).toHaveCount(1);
});

test("fallback banner explains a rate limit and offers retry", async ({ page }) => {
  await page.route("**/api/generate", (r) =>
    r.fulfill({ json: { error: { kind: "rate_limited", message: "The free image provider is rate-limiting requests.", retryAfter: 30 } } }),
  );
  await prompt(page).fill("a paper boat in a puddle");
  await generate(page).click();
  const banner = page.getByTestId("fallback-banner");
  await expect(banner).toContainText("rate-limiting us right now");
  await expect(banner).toContainText("about 30s");
  await expect(banner.getByRole("button", { name: "Retry live" })).toBeVisible();
  await expect(page.getByTestId("generation").first().getByText("Demo", { exact: true })).toBeVisible();
  await banner.getByRole("button", { name: "Dismiss notice" }).click();
  await expect(banner).toBeHidden();
});

test.describe("bring your own Gemini key", () => {
  test.use({ allowConsoleErrors: [/status of 400/] }); // the browser logs Google's mocked 400 for the bad key

  test("bad key shows a fixable error; good key generates in the browser only", async ({ page }) => {
    const image = fs.readFileSync("public/demo/landscape-3.jpg").toString("base64");
    await page.route("https://generativelanguage.googleapis.com/**", (r) =>
      r.request().headers()["x-goog-api-key"] === "bad-key-0000000000000000000"
        ? r.fulfill({ status: 400, json: { error: { code: 400, message: "API key not valid. Please pass a valid API key." } } })
        : r.fulfill({ json: { outputs: [{ type: "image", mime_type: "image/jpeg", data: image }] } }),
    );
    let serverCalls = 0;
    page.on("request", (r) => r.url().includes("/api/generate") && serverCalls++);

    await page.getByRole("button", { name: /^Model:/ }).click();
    await page.getByRole("menuitemradio", { name: /Nano Banana 2 Lite/ }).click();
    const dialog = page.getByRole("dialog", { name: "Use your own Gemini key" });
    await dialog.getByLabel("Gemini API key").fill("bad-key-0000000000000000000");
    await dialog.getByRole("button", { name: "Save key" }).click();
    await expect(page.getByRole("button", { name: /^Model: Nano Banana 2 Lite/ })).toBeVisible();

    await prompt(page).fill("misty pine forest at sunrise");
    await generate(page).click();
    await expect(page.getByTestId("error-banner")).toContainText("Gemini rejected this API key");

    await page.getByTestId("error-banner").getByRole("button", { name: "Update key" }).click();
    await dialog.getByLabel("Gemini API key").fill("good-key-000000000000000000");
    await dialog.getByRole("button", { name: "Save key" }).click();
    await generate(page).click();

    const card = page.getByTestId("generation").first();
    await expect(card.getByText("Live", { exact: true })).toBeVisible();
    await expect(card).toContainText("Nano Banana 2 Lite");
    expect(serverCalls).toBe(0);
    expect(await page.evaluate(() => [!!sessionStorage.getItem("lumen:gemini-key"), !!localStorage.getItem("lumen:gemini-key")])).toEqual([true, false]);
  });
});
