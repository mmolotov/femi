// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { useAppDataMock } = vi.hoisted(() => ({
  useAppDataMock: vi.fn()
}));

vi.mock("../data/AppDataProvider", () => ({
  useAppData: useAppDataMock
}));

import { I18nProvider } from "../i18n/I18nProvider";
import { OnboardingGate } from "./OnboardingGate";

describe("OnboardingGate", () => {
  afterEach(() => {
    cleanup();
  });

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

    // Dismiss the disclaimer gate before interacting with the onboarding form.
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

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

  it("allows clearing numeric fields without submitting invalid onboarding data", () => {
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

    const { getByLabelText, getByRole } = render(
      <I18nProvider>
        <OnboardingGate />
      </I18nProvider>
    );

    // Dismiss the disclaimer gate before interacting with the onboarding form.
    fireEvent.click(getByRole("button", { name: /^continue$/i }));

    const cycleLengthInput = getByLabelText(/usual cycle length/i);

    fireEvent.change(cycleLengthInput, {
      target: { value: "" }
    });

    expect(cycleLengthInput).toHaveValue(null);
    expect(getByRole("button", { name: /save setup/i })).toBeDisabled();
    expect(completeOnboarding).not.toHaveBeenCalled();
  });

  it("keeps the disclaimer until an explicit choice: backdrop is inert, Continue dismisses", () => {
    useAppDataMock.mockReturnValue({
      completeOnboarding: vi.fn().mockResolvedValue(undefined),
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

    const { container, getByRole, queryByRole } = render(
      <I18nProvider>
        <OnboardingGate />
      </I18nProvider>
    );

    expect(getByRole("dialog")).toBeInTheDocument();

    // Clicking the dimmed backdrop must NOT acknowledge the notice.
    const backdrop = container.querySelector(".dialog-backdrop");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);
    expect(getByRole("dialog")).toBeInTheDocument();

    // Continue is the explicit acknowledgement and dismisses the dialog.
    fireEvent.click(getByRole("button", { name: /continue/i }));
    expect(queryByRole("dialog")).not.toBeInTheDocument();
  });
});
