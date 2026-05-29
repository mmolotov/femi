import { expect, test } from "./fixtures";

test("completes the M1 browser-demo happy path", async ({ page }) => {
  await page.goto("/?app_demo=1");

  await expect(
    page.getByRole("heading", {
      name: /a short setup before the first entry/i
    })
  ).toBeVisible();

  // Dismiss the disclaimer popup that gates the onboarding form.
  await page.getByRole("button", { name: /^continue$/i }).click();

  await page.getByLabel(/usual cycle length/i).fill("30");
  await page.getByLabel(/usual period length/i).fill("6");
  await page.getByRole("button", { name: /save setup/i }).click();

  // Onboarding logs today as a period day and lands on the Today screen.
  await expect(page.getByRole("heading", { name: /day summary/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /remove period day/i })).toBeVisible();

  await page.getByRole("combobox", { name: /^mood$/i }).selectOption("4");
  await page.getByRole("combobox", { name: /^energy$/i }).selectOption("3");
  await page.getByRole("button", { name: /^cramps$/i }).click();
  await page.getByRole("button", { name: /save check-in/i }).click();

  await expect(page.getByText(/the entry for this day was saved/i)).toBeVisible();

  // The Calendar opens from the week strip (there is no Calendar tab in the nav).
  await page.getByRole("button", { name: /open full calendar/i }).click();
  await expect(page.getByText(/logged period day/i)).toBeVisible();

  await page.getByRole("link", { name: /^settings$/i }).click();
  await expect(page.getByRole("heading", { name: /tracking preferences/i })).toBeVisible();
  await page.getByLabel(/cycle length \(days\)/i).fill("31");
  await page.getByRole("button", { name: /save settings/i }).click();
  await expect(page.getByText(/settings saved/i)).toBeVisible();

  await page.getByRole("link", { name: /^history$/i }).click();
  await expect(page.getByRole("heading", { name: /^history$/i })).toBeVisible();
  // The cycle summary stays visible regardless of collapse state and reflects onboarding.
  await expect(page.getByText(/period length 6/i)).toBeVisible();
});
