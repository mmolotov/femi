import { expect, test } from "./fixtures";

test.describe("settings and account", () => {
  test.beforeEach(async ({ page }) => {
    // Preview mode (no app_demo) starts past onboarding so Settings is reachable.
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /tracking preferences/i })).toBeVisible();
  });

  test("changes tracking settings and shows a success message", async ({ page }) => {
    await page.getByLabel(/cycle length \(days\)/i).fill("31");
    await page.getByRole("button", { name: /save settings/i }).click();

    await expect(page.getByText(/settings saved/i)).toBeVisible();
  });

  test("switches the theme", async ({ page }) => {
    const ink = page.getByRole("radio", { name: /^ink$/i });
    await ink.click();
    await expect(ink).toHaveAttribute("aria-checked", "true");
  });

  test("switches the language to Russian", async ({ page }) => {
    await page.getByRole("combobox", { name: /language/i }).selectOption("ru");

    await expect(page.getByRole("button", { name: /сохранить настройки/i })).toBeVisible();
  });

  test("shows the Telegram account in the Account panel", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /^account$/i })).toBeVisible();
    await expect(page.getByText(/telegram account/i)).toBeVisible();
  });

  test("opens and closes the About dialog", async ({ page }) => {
    await page.getByRole("button", { name: /about the app/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /about femi/i })).toBeVisible();

    await dialog.getByRole("button", { name: /^close$/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("cancelling the delete dialog keeps the account", async ({ page }) => {
    await page.getByRole("button", { name: /delete account and data/i }).click();
    await expect(page.getByRole("heading", { name: /delete account and all data/i })).toBeVisible();

    await page.getByRole("button", { name: /^cancel$/i }).click();

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("heading", { name: /tracking preferences/i })).toBeVisible();
  });

  test("confirming deletion shows the post-delete onboarding state", async ({ page }) => {
    await page.getByRole("button", { name: /delete account and data/i }).click();
    await page.getByRole("button", { name: /delete permanently/i }).click();

    await expect(
      page.getByRole("heading", { name: /a short setup before the first entry/i })
    ).toBeVisible();
  });
});
