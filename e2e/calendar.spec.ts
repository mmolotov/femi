import { expect, test } from "./fixtures";

test.describe("calendar", () => {
  test.beforeEach(async ({ page }) => {
    // Preview mode (no app_demo) starts past onboarding with sample cycle data.
    await page.goto("/calendar");
    await expect(page.getByRole("heading", { name: /^calendar$/i })).toBeVisible();
  });

  test("shows the legend and toggles month/year projections", async ({ page }) => {
    await expect(page.getByText(/logged period day/i)).toBeVisible();

    await page.getByRole("tab", { name: /^year$/i }).click();
    await expect(page.getByRole("tab", { name: /^year$/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    await page.getByRole("tab", { name: /^month$/i }).click();
    await expect(page.getByRole("tab", { name: /^month$/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("navigates to the previous and next month", async ({ page }) => {
    await expect(page.getByText(/may 2026/i)).toBeVisible();

    await page.getByRole("button", { name: /previous month/i }).click();
    await expect(page.getByText(/april 2026/i)).toBeVisible();

    await page.getByRole("button", { name: /next month/i }).click();
    await expect(page.getByText(/may 2026/i)).toBeVisible();
  });

  test("bulk edit saves a toggled period day", async ({ page }) => {
    await page.getByRole("button", { name: /edit period days/i }).click();
    await page.getByRole("button", { name: "2026-05-15" }).click();
    await page.getByRole("button", { name: /save changes/i }).click();

    await expect(page.getByText(/period days updated/i)).toBeVisible();
  });

  test("bulk edit cancel exits without saving", async ({ page }) => {
    await page.getByRole("button", { name: /edit period days/i }).click();
    await page.getByRole("button", { name: "2026-05-15" }).click();
    await page.getByRole("button", { name: /^cancel$/i }).click();

    await expect(page.getByRole("button", { name: /edit period days/i })).toBeVisible();
    await expect(page.getByText(/period days updated/i)).toBeHidden();
  });

  test("clicking a day opens it in the Today view", async ({ page }) => {
    await page.getByRole("button", { name: "2026-05-15" }).click();

    await expect(page.getByRole("region", { name: /week/i })).toBeVisible();
  });
});
