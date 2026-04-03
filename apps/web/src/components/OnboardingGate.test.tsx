// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { useAppDataMock } = vi.hoisted(() => ({
  useAppDataMock: vi.fn()
}));

vi.mock("../data/AppDataProvider", () => ({
  useAppData: useAppDataMock
}));

import { I18nProvider } from "../i18n/I18nProvider";
import { OnboardingGate } from "./OnboardingGate";

describe("OnboardingGate", () => {
  it("submits onboarding values through the app data layer", async () => {
    const completeOnboarding = vi.fn().mockResolvedValue(undefined);
    useAppDataMock.mockReturnValue({
      completeOnboarding,
      me: {
        settings: {
          cycleLengthDays: 28,
          onboardingCompleted: false,
          periodLengthDays: 5,
          remindersEnabled: true,
          timezone: "UTC"
        },
        user: {
          firstName: "Ada",
          id: "user-1",
          languageCode: "en",
          lastName: null,
          telegramUserId: "10001",
          username: "ada"
        }
      }
    });

    const { container } = render(
      <I18nProvider>
        <OnboardingGate />
      </I18nProvider>
    );

    fireEvent.change(screen.getByLabelText(/usual cycle length/i), {
      target: { value: "30" }
    });
    fireEvent.change(screen.getByLabelText(/usual period length/i), {
      target: { value: "6" }
    });
    fireEvent.change(screen.getByLabelText(/latest period start date/i), {
      target: { value: "2026-03-01" }
    });

    expect(
      container.querySelectorAll(".onboarding-calendar-grid .calendar-day.logged").length
    ).toBeGreaterThanOrEqual(1);
    expect(
      container.querySelectorAll(".onboarding-calendar-grid .calendar-day.predicted").length
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /save setup/i }));

    await waitFor(() => {
      expect(completeOnboarding).toHaveBeenCalledWith(
        expect.objectContaining({
          cycleLengthDays: 30,
          latestPeriodStart: "2026-03-01",
          periodLengthDays: 6
        })
      );
    });
  });
});
