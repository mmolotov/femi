import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  webServer: {
    command:
      "pnpm --filter @femi/web build && pnpm --filter @femi/web exec vite preview --host 127.0.0.1 --port 4173",
    reuseExistingServer: true,
    url: "http://127.0.0.1:4173"
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    // Pin locale + timezone so date formatting and "today" are deterministic
    // regardless of the CI machine (the clock itself is fixed in e2e/fixtures.ts).
    locale: "en-US",
    timezoneId: "UTC",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ]
});
