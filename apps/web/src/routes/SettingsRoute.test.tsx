// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  beforeEach(() => {
    useAppDataMock.mockReturnValue({
      deleteAccount: vi.fn().mockResolvedValue(undefined),
      me: {
        settings: {
          cycleLengthDays: 28,
          onboardingCompleted: true,
          periodLengthDays: 5,
          remindersEnabled: true,
          timezone: "UTC"
        }
      },
      updateSettings: vi.fn().mockResolvedValue(undefined)
    });
    useSessionMock.mockReturnValue({
      environment: "telegram",
      error: null,
      signOut: vi.fn(),
      status: "authenticated",
      user: {
        firstName: "Ada",
        languageCode: "en",
        lastName: null,
        username: "ada"
      }
    });
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("saves updated tracking preferences", async () => {
    const updateSettings = vi.fn().mockResolvedValue(undefined);

    useAppDataMock.mockReturnValue({
      deleteAccount: vi.fn().mockResolvedValue(undefined),
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

    render(
      <MemoryRouter>
        <I18nProvider>
          <SettingsRoute />
        </I18nProvider>
      </MemoryRouter>
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

  it("allows clearing numeric fields without submitting invalid settings", () => {
    const updateSettings = vi.fn().mockResolvedValue(undefined);

    useAppDataMock.mockReturnValue({
      deleteAccount: vi.fn().mockResolvedValue(undefined),
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

    render(
      <MemoryRouter>
        <I18nProvider>
          <SettingsRoute />
        </I18nProvider>
      </MemoryRouter>
    );

    const cycleLengthInput = screen.getByLabelText(/cycle length/i);

    fireEvent.change(cycleLengthInput, {
      target: { value: "" }
    });

    expect(cycleLengthInput).toHaveValue(null);
    expect(screen.getByRole("button", { name: /save settings/i })).toBeDisabled();
    expect(updateSettings).not.toHaveBeenCalled();
  });

  it("opens the delete dialog and closes it with Escape", async () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <SettingsRoute />
        </I18nProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /delete account and data/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cancel/i })).toHaveFocus();
    });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("confirms account deletion via the destructive action", async () => {
    const deleteAccount = vi.fn().mockResolvedValue(undefined);

    useAppDataMock.mockReturnValue({
      deleteAccount,
      me: {
        settings: {
          cycleLengthDays: 28,
          onboardingCompleted: true,
          periodLengthDays: 5,
          remindersEnabled: true,
          timezone: "UTC"
        }
      },
      updateSettings: vi.fn().mockResolvedValue(undefined)
    });

    render(
      <MemoryRouter>
        <I18nProvider>
          <SettingsRoute />
        </I18nProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /delete account and data/i }));
    fireEvent.click(await screen.findByRole("button", { name: /delete permanently/i }));

    await waitFor(() => {
      expect(deleteAccount).toHaveBeenCalledTimes(1);
    });
  });

  it("no longer renders timezone or reminders controls", () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <SettingsRoute />
        </I18nProvider>
      </MemoryRouter>
    );

    expect(screen.queryByLabelText(/timezone/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/reminders enabled/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("switches the interface language from the dropdown", () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <SettingsRoute />
        </I18nProvider>
      </MemoryRouter>
    );

    const languageSelect = screen.getByRole("combobox");
    expect(languageSelect).toHaveValue("en");

    fireEvent.change(languageSelect, { target: { value: "ru" } });

    expect(languageSelect).toHaveValue("ru");
    expect(screen.getByRole("button", { name: "Сохранить настройки" })).toBeInTheDocument();
  });

  it("shows only the linked account in the Telegram integration panel", () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <SettingsRoute />
        </I18nProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Telegram account")).toBeInTheDocument();
    expect(screen.getByText("ada")).toBeInTheDocument();
    expect(screen.queryByText(/runtime environment/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/session status/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/telegram language/i)).not.toBeInTheDocument();
  });

  it("opens the About dialog and closes it with the close button", async () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <SettingsRoute />
        </I18nProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /about the app/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/about femi/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /close/i })).toHaveFocus();
    });

    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes the About dialog with Escape", async () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <SettingsRoute />
        </I18nProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /about the app/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
