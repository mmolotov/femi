import { expect, test, type Page } from "./fixtures";

async function completeOnboarding(page: Page) {
  await page.goto("/?app_demo=1");
  await page.getByRole("button", { name: /^continue$/i }).click();
  await page.getByLabel(/usual cycle length/i).fill("30");
  await page.getByLabel(/usual period length/i).fill("6");
  await page.getByRole("button", { name: /save setup/i }).click();
  await expect(page.getByRole("heading", { name: /day summary/i })).toBeVisible();
}

test.describe("today check-in", () => {
  test.beforeEach(async ({ page }) => {
    await completeOnboarding(page);
  });

  test("marks and removes a period day", async ({ page }) => {
    // Onboarding logs today as a period day.
    await page.getByRole("button", { name: /remove period day/i }).click();
    await expect(page.getByRole("button", { name: /mark period day/i })).toBeVisible();

    await page.getByRole("button", { name: /mark period day/i }).click();
    await expect(page.getByRole("button", { name: /remove period day/i })).toBeVisible();
  });

  test("saves a daily check-in across all fields", async ({ page }) => {
    await page.getByRole("combobox", { name: /flow intensity/i }).selectOption({ index: 1 });
    await page.getByRole("combobox", { name: /^mood$/i }).selectOption("4");
    await page.getByRole("combobox", { name: /^energy$/i }).selectOption("3");
    await page.getByRole("combobox", { name: /^pain$/i }).selectOption("2");
    await page.getByRole("combobox", { name: /sleep quality/i }).selectOption("4");
    await page.getByRole("button", { name: /^cramps$/i }).click();
    await page.getByRole("textbox", { name: /optional note/i }).fill("Felt tired but okay.");
    await page.getByRole("button", { name: /save check-in/i }).click();

    await expect(page.getByText(/the entry for this day was saved/i)).toBeVisible();
  });

  test("navigates to another date via the week strip", async ({ page }) => {
    const weekStrip = page.getByRole("region", { name: /week/i });
    const monday = weekStrip.getByRole("button").filter({ hasText: "Mon" });

    await monday.click();

    await expect(monday).toHaveAttribute("aria-pressed", "true");
  });

  test("edits a saved check-in and clears a numeric field", async ({ page }) => {
    const mood = page.getByRole("combobox", { name: /^mood$/i });
    await mood.selectOption("4");
    await page.getByRole("button", { name: /save check-in/i }).click();
    await expect(page.getByText(/the entry for this day was saved/i)).toBeVisible();

    // Navigate away and back so the form refetches the persisted entry.
    const weekStrip = page.getByRole("region", { name: /week/i });
    await weekStrip.getByRole("button").filter({ hasText: "Mon" }).click();
    await weekStrip.getByRole("button", { name: /today/i }).click();
    await expect(page.getByRole("combobox", { name: /^mood$/i })).toHaveValue("4");

    // Clearing a previously-saved numeric field must save without error.
    await page.getByRole("combobox", { name: /^mood$/i }).selectOption("");
    await page.getByRole("button", { name: /save check-in/i }).click();
    await expect(page.getByText(/the entry for this day was saved/i)).toBeVisible();
  });
});
