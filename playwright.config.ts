import { defineConfig } from "@playwright/test";

const PORT = 3200;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: { baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  // Demo mode: the free provider is never called, so runs are deterministic and offline-safe.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run build && npx next start -p ${PORT}`,
        port: PORT,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: { GENERATION_MODE: "demo" },
      },
});
