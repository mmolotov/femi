// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { useAppDataMock, useSessionMock } = vi.hoisted(() => ({
  useAppDataMock: vi.fn(),
  useSessionMock: vi.fn()
}));

vi.mock("../data/AppDataProvider", () => ({
  useAppData: useAppDataMock
}));

vi.mock("../session/SessionProvider", () => ({
  useSession: useSessionMock
}));

import { I18nProvider } from "../i18n/I18nProvider";
import { SettingsRoute } from "./SettingsRoute";

describe("SettingsRoute", () => {
  it("saves updated tracking preferences", async () => {
    const updateSettings = vi.fn().mockResolvedValue(undefined);

    useAppDataMock.mockReturnValue({
      me: {
        settings: {
          cycleLengthDays: 28,
          onboardingCompleted: true,
          periodLengthDays: 5,
          remindersEnabled: true,
          timezone: "UTC"
        }
      },
      updateSettings
    });
    useSessionMock.mockReturnValue({
      environment: "telegram",
      error: null,
      status: "authenticated",
      user: {
        firstName: "Ada",
        languageCode: "en",
        lastName: null,
        username: "ada"
      }
    });

    render(
      <I18nProvider>
        <SettingsRoute />
      </I18nProvider>
    );

    fireEvent.change(screen.getByLabelText(/cycle length/i), {
      target: { value: "30" }
    });
    fireEvent.change(screen.getByLabelText(/period length/i), {
      target: { value: "6" }
    });
    fireEvent.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          cycleLengthDays: 30,
          periodLengthDays: 6
        })
      );
    });

    expect(await screen.findByText(/settings saved/i)).toBeInTheDocument();
  });
});
