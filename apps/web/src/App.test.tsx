// @vitest-environment jsdom

import type { PropsWithChildren } from "react";

import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

const { useAppDataMock, useSessionMock } = vi.hoisted(() => ({
  useAppDataMock: vi.fn(),
  useSessionMock: vi.fn()
}));

const messages = {
  app: {
    loading: "Loading...",
    previewBody: "Preview mode",
    previewTitle: "Preview",
    primaryNavLabel: "Primary navigation",
    signedOutBody: "Your account has been removed.",
    signedOutTitle: "Account deleted",
    syncErrorBody: "Could not sync data",
    syncErrorTitle: "Sync error",
    tabs: {
      history: "History",
      settings: "Settings",
      today: "Today"
    }
  },
  theme: {
    dark: "Dark",
    description: "Theme settings",
    light: "Light",
    system: "System",
    title: "Theme"
  }
};

vi.mock("./i18n/I18nProvider", () => ({
  I18nProvider: ({ children }: PropsWithChildren) => children,
  useI18n: () => ({
    direction: "ltr",
    language: "en",
    languages: [],
    messages,
    setLanguage: vi.fn()
  })
}));

vi.mock("./session/SessionProvider", () => ({
  SessionProvider: ({ children }: PropsWithChildren) => children,
  useSession: useSessionMock
}));

vi.mock("./data/AppDataProvider", () => ({
  AppDataProvider: ({ children }: PropsWithChildren) => children,
  useAppData: useAppDataMock
}));

vi.mock("./theme/ThemeProvider", () => ({
  ThemeProvider: ({ children }: PropsWithChildren) => children,
  useTheme: () => ({
    choice: "light",
    resolved: "light",
    setChoice: vi.fn(),
    toggle: vi.fn()
  })
}));

vi.mock("./routes/TodayRoute", () => ({
  TodayRoute: () => <h2>Today</h2>
}));

vi.mock("./routes/HistoryRoute", () => ({
  HistoryRoute: () => <h2>History</h2>
}));

vi.mock("./routes/CalendarRoute", () => ({
  CalendarRoute: () => <h2>Calendar</h2>
}));

vi.mock("./routes/SettingsRoute", () => ({
  SettingsRoute: () => (
    <>
      <h2>Language</h2>
      <button type="button">Русский</button>
    </>
  )
}));

vi.mock("./components/OnboardingGate", () => ({
  OnboardingGate: () => <div>Onboarding</div>
}));

describe("App shell", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    useSessionMock.mockReturnValue({
      environment: "browser",
      error: null,
      initDataRaw: null,
      signOut: vi.fn(),
      status: "authenticated",
      user: {
        firstName: "Test",
        id: "user-1",
        languageCode: "ru",
        lastName: "User",
        telegramUserId: "tg-1",
        username: "tester"
      }
    });
    useAppDataMock.mockReturnValue({
      api: null,
      completeOnboarding: vi.fn(),
      deleteAccount: vi.fn(),
      error: null,
      me: {
        id: "user-1",
        settings: {
          cycleLengthDays: 28,
          onboardingCompleted: true,
          periodLengthDays: 5,
          remindersEnabled: true,
          timezone: "UTC"
        }
      },
      refresh: vi.fn(),
      status: "ready",
      summary: null,
      updateSettings: vi.fn()
    });
  });

  it("renders the primary navigation tabs", async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("link", { name: "Today" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "History" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Settings" })).toBeInTheDocument();
  });

  it("renders the language selector on the settings screen", async () => {
    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Language" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Русский/i })).toBeInTheDocument();
  });

  it("renders the signed-out public screen after account deletion", async () => {
    useSessionMock.mockReturnValue({
      environment: "browser",
      error: null,
      initDataRaw: null,
      signOut: vi.fn(),
      status: "signed_out",
      user: null
    });

    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText("Account deleted")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
  });
});
