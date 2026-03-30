import { expect, test } from "@playwright/test";

test("completes the M1 browser-demo happy path", async ({ page }) => {
  await page.goto("/?app_demo=1");

  await expect(
    page.getByRole("heading", {
      name: /a short setup before the first entry/i
    })
  ).toBeVisible();

  await page.getByLabel(/usual cycle length/i).fill("30");
  await page.getByLabel(/usual period length/i).fill("6");
  await page.getByRole("button", { name: /save setup/i }).click();

  await expect(page.getByRole("heading", { name: /^today$/i })).toBeVisible();

  await page.getByRole("button", { name: /log period start/i }).click();
  await page.getByRole("combobox", { name: /^mood$/i }).selectOption("4");
  await page.getByRole("combobox", { name: /^energy$/i }).selectOption("3");
  await page.getByRole("button", { name: /^cramps$/i }).click();
  await page.getByRole("button", { name: /save today's check-in/i }).click();

  await expect(page.getByText(/today's entry was saved/i)).toBeVisible();

  await page.getByRole("link", { name: /^settings$/i }).click();
  await expect(page.getByRole("heading", { name: /tracking preferences/i })).toBeVisible();
  await page.getByLabel(/cycle length \(days\)/i).fill("31");
  await page.getByRole("button", { name: /save settings/i }).click();
  await expect(page.getByText(/settings saved/i)).toBeVisible();

  await page.getByRole("link", { name: /^history$/i }).click();
  await expect(page.getByText(/mood 4/i)).toBeVisible();

  await page.getByRole("link", { name: /^calendar$/i }).click();
  await expect(page.getByText(/^Logged period day$/i)).toBeVisible();
});
