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
