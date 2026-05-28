import { expect, test } from "@playwright/test";

test.describe("history", () => {
  test.beforeEach(async ({ page }) => {
    // Preview mode (no app_demo) provides sample cycle history with a check-in.
    await page.goto("/history");
    await expect(page.getByRole("heading", { name: /^history$/i })).toBeVisible();
  });

  test("shows cycle summaries with the current cycle expanded, and collapses on click", async ({
    page
  }) => {
    // Cycle summary (period log data) is always visible.
    await expect(page.getByText(/period length/i).first()).toBeVisible();
    // Current cycle is expanded by default, so its phase summaries are visible.
    await expect(page.getByText(/menstrual/i).first()).toBeVisible();

    // Collapsing the current cycle hides its phase summaries.
    await page.locator("details.history-card > summary").first().click();
    await expect(page.getByText(/menstrual/i).first()).toBeHidden();
  });

  test("expanding a phase reveals the saved check-in mood and symptom tag", async ({ page }) => {
    const currentCyclePhaseSummaries = page
      .locator("details.history-card")
      .first()
      .locator("details.history-phase-card > summary");

    const count = await currentCyclePhaseSummaries.count();
    for (let index = 0; index < count; index += 1) {
      await currentCyclePhaseSummaries.nth(index).click();
    }

    await expect(page.getByText(/cramps/i).first()).toBeVisible();
    await expect(page.getByText(/mood 4/i).first()).toBeVisible();
  });
});
