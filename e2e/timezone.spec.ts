import { getIsoDateInTimeZone } from "../packages/shared/src/index";
import { expect, test } from "./fixtures";

test.use({ timezoneId: "Europe/Belgrade" });

test("uses the device date for today and return navigation after Telegram login", async ({
  page
}) => {
  // Sunday at 23:00 in Serbia, but already Monday in the stale account timezone.
  const now = new Date("2026-11-08T22:00:00Z");
  await page.clock.setFixedTime(now);
  let timezone = "Europe/Moscow";
  const user = {
    id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
    telegramUserId: "10001",
    firstName: "Ada",
    lastName: null,
    username: null,
    languageCode: "en"
  };

  // Emulate the Telegram host while keeping the real session/data providers.
  await page.route("https://telegram.org/js/telegram-web-app.js", (route) =>
    route.fulfill({ body: "", contentType: "application/javascript" })
  );
  await page.addInitScript(() => {
    Object.assign(window, {
      TelegramWebviewProxy: {
        postEvent(event: string) {
          if (event === "web_app_request_viewport") {
            window.dispatchEvent(
              new MessageEvent("message", {
                source: window,
                data: JSON.stringify({
                  eventType: "viewport_changed",
                  eventData: { height: 800, width: 400, is_expanded: true, is_state_stable: true }
                })
              })
            );
          }
        }
      }
    });
  });

  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/telegram") {
      const body = route.request().postDataJSON() as { timezone?: string };
      timezone = body.timezone ?? timezone;
      await route.fulfill({ json: { user } });
    } else if (path === "/api/me") {
      await route.fulfill({
        json: {
          user,
          settings: {
            cycleLengthDays: 28,
            periodLengthDays: 5,
            latePeriodThresholdDays: 3,
            onboardingCompleted: true,
            remindersEnabled: false,
            timezone
          }
        }
      });
    } else if (path === "/api/cycle/summary") {
      await route.fulfill({
        json: {
          summary: {
            activePeriod: false,
            averageCycleLengthDays: 28,
            averagePeriodLengthDays: 5,
            currentCycleDay: null,
            currentPhase: null,
            forecast: [],
            latestPeriodStart: null,
            onboardingCompleted: true,
            predictedNextPeriodStart: null,
            today: getIsoDateInTimeZone(now, timezone)
          }
        }
      });
    } else if (path === "/api/calendar") {
      await route.fulfill({ json: { month: "2026-11", days: [] } });
    } else if (path.startsWith("/api/checkins/")) {
      await route.fulfill({ json: { entry: null } });
    } else {
      throw new Error(`Unexpected API request: ${path}`);
    }
  });

  const launchParams = new URLSearchParams({
    tgWebAppPlatform: "ios",
    tgWebAppVersion: "6.1",
    tgWebAppThemeParams: JSON.stringify({ bg_color: "#ffffff", text_color: "#000000" }),
    tgWebAppData: new URLSearchParams({
      auth_date: String(now.getTime() / 1000),
      hash: "test-hash",
      signature: "test-signature",
      user: JSON.stringify({ id: 10001, first_name: "Ada" })
    }).toString()
  });
  await page.goto(`/?${launchParams}`);
  await expect(page.getByRole("heading", { name: /day summary/i })).toBeVisible();

  const week = page.getByRole("region", { name: /week/i });
  const today = week.getByRole("button", { name: /11\/8\/2026/ });
  await expect(today).toHaveAttribute("aria-current", "date");
  await expect(today).toHaveAttribute("aria-pressed", "true");
  expect(timezone).toBe("Europe/Belgrade");

  await week.getByRole("button", { name: /next week/i }).click();
  const tomorrow = week.getByRole("button", { name: /11\/9\/2026/ });
  await expect(tomorrow).not.toHaveAttribute("aria-current", "date");
  await tomorrow.click();
  await expect(page.getByRole("button", { name: /mark period day/i })).toBeDisabled();
  await page.getByRole("button", { name: /back to today/i }).click();
  await expect(today).toHaveAttribute("aria-current", "date");
  await expect(today).toHaveAttribute("aria-pressed", "true");
  await expect(week.getByRole("button", { name: /11\/2\/2026/ })).toBeVisible();
  await expect(tomorrow).toHaveCount(0);

  await page.getByRole("button", { name: /open full calendar/i }).click();
  await expect(page.getByRole("button", { name: "2026-11-08", exact: true })).toHaveClass(/today/);
  await expect(page.getByRole("button", { name: "2026-11-09", exact: true })).not.toHaveClass(
    /today/
  );
});
