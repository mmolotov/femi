import { expect, test } from "@playwright/test";

test("loads the foundation shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /Simple cycle tracking, built for calm daily use/i
    })
  ).toBeVisible();
});
