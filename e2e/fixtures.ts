import { test as base, expect } from "@playwright/test";

// Pin "now" so specs that reference concrete dates do not depend on the machine
// or CI clock. The app derives "today" from new Date() in the browser, so the
// fake clock is installed before each test navigates.
export const FIXED_NOW = new Date("2026-05-28T12:00:00.000Z");

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(FIXED_NOW);
    await use(page);
  }
});

export { expect };
export type { Page } from "@playwright/test";
