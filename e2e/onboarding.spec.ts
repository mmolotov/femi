import { expect, test } from "./fixtures";

test.describe("onboarding", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?app_demo=1");
    await expect(
      page.getByRole("heading", { name: /a short setup before the first entry/i })
    ).toBeVisible();
  });

  test("shows the disclaimer popup with Continue and Close, and Continue reveals the form", async ({
    page
  }) => {
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /important notice/i })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /^close$/i })).toBeVisible();

    await dialog.getByRole("button", { name: /^continue$/i }).click();

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByLabel(/usual cycle length/i)).toBeVisible();
  });

  test("disables Save setup for out-of-range cycle and period lengths", async ({ page }) => {
    await page.getByRole("button", { name: /^continue$/i }).click();

    const save = page.getByRole("button", { name: /save setup/i });
    await expect(save).toBeEnabled();

    await page.getByLabel(/usual cycle length/i).fill("5");
    await expect(save).toBeDisabled();
    await page.getByLabel(/usual cycle length/i).fill("30");
    await expect(save).toBeEnabled();

    await page.getByLabel(/usual period length/i).fill("1");
    await expect(save).toBeDisabled();
    await page.getByLabel(/usual period length/i).fill("6");
    await expect(save).toBeEnabled();
  });

  test("completes onboarding and lands on Today", async ({ page }) => {
    await page.getByRole("button", { name: /^continue$/i }).click();

    await page.getByLabel(/usual cycle length/i).fill("30");
    await page.getByLabel(/usual period length/i).fill("6");
    await page.getByLabel(/latest period start/i).fill("2026-05-20");
    await page.getByRole("button", { name: /save setup/i }).click();

    await expect(page.getByRole("heading", { name: /day summary/i })).toBeVisible();
  });

  test("calendar preview reacts to the latest period start date", async ({ page }) => {
    await page.getByRole("button", { name: /^continue$/i }).click();

    await page.getByLabel(/latest period start/i).fill("2026-03-10");

    await expect(page.getByText(/march 2026/i)).toBeVisible();
  });
});
