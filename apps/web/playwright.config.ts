import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests for the Velora storefront.
 *
 * These drive a real Chromium browser through the full shopper journey
 * (browse -> product -> cart -> checkout -> order confirmation) against a
 * running web + API + Postgres stack. Locally they reuse whatever is already
 * on :3000/:4000; in CI the `webServer` block boots the stack first.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm --prefix ../.. run dev:e2e",
    url: "http://localhost:3000",
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
  },
});
