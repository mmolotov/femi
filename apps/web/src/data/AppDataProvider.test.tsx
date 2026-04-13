// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createApiClientMock, createDemoApiClientMock, useSessionMock } = vi.hoisted(() => ({
  createApiClientMock: vi.fn(),
  createDemoApiClientMock: vi.fn(),
  useSessionMock: vi.fn()
}));

vi.mock("../demo/mockApp", () => ({
  createDemoApiClient: createDemoApiClientMock
}));

vi.mock("../lib/api", () => ({
  createApiClient: createApiClientMock
}));

vi.mock("../session/SessionProvider", () => ({
  useSession: useSessionMock
}));

import { I18nProvider, useI18n } from "../i18n/I18nProvider";
import { AppDataProvider, useAppData } from "./AppDataProvider";

function AppDataProbe() {
  const { setLanguage } = useI18n();
  const appData = useAppData();

  return (
    <>
      <span>{appData.status}</span>
      {appData.me ? (
        <span>{appData.me.settings.onboardingCompleted ? "onboarded" : "pending"}</span>
      ) : null}
      {appData.summary ? (
        <span>{appData.summary.latestPeriodStart ?? "no-period-start"}</span>
      ) : null}
      {appData.error ? <span>{appData.error}</span> : null}
      <button
        onClick={() => {
          setLanguage("ru");
        }}
        type="button"
      >
        Switch language
      </button>
      <button
        onClick={() => {
          void appData.completeOnboarding({
            cycleLengthDays: 30,
            latestPeriodStart: "2026-03-01",
            periodLengthDays: 6,
            timezone: "UTC"
          });
        }}
        type="button"
      >
        Complete onboarding
      </button>
    </>
  );
}

describe("AppDataProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/");
    useSessionMock.mockReturnValue({
      environment: "telegram",
      error: null,
      initDataRaw: "init-data",
      status: "authenticated",
      user: {
        firstName: "Ada",
        id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
        languageCode: "en",
        lastName: null,
        telegramUserId: "10001",
        username: "ada"
      }
    });
    createApiClientMock.mockReturnValue({
      completeOnboarding: vi.fn().mockResolvedValue({
        settings: {
          cycleLengthDays: 30,
          onboardingCompleted: true,
          periodLengthDays: 6,
          remindersEnabled: true,
          timezone: "UTC"
        }
      }),
      getCycleSummary: vi.fn().mockResolvedValue({
        summary: {
          activePeriod: false,
          averageCycleLengthDays: 28,
          averagePeriodLengthDays: 5,
          currentCycleDay: 10,
          currentPhase: "follicular",
          forecast: [],
          latestPeriodStart: "2026-03-01",
          onboardingCompleted: true,
          predictedNextPeriodStart: null,
          today: "2026-03-10"
        }
      }),
      getMe: vi.fn().mockResolvedValue({
        settings: {
          cycleLengthDays: 28,
          onboardingCompleted: true,
          periodLengthDays: 5,
          remindersEnabled: true,
          timezone: "UTC"
        },
        user: {
          firstName: "Ada",
          id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
          languageCode: "en",
          lastName: null,
          telegramUserId: "10001",
          username: "ada"
        }
      })
    });
    createDemoApiClientMock.mockReturnValue({
      getCycleSummary: vi.fn().mockResolvedValue({
        summary: {
          activePeriod: false,
          averageCycleLengthDays: 28,
          averagePeriodLengthDays: 5,
          currentCycleDay: null,
          currentPhase: null,
          forecast: [],
          latestPeriodStart: null,
          onboardingCompleted: false,
          predictedNextPeriodStart: null,
          today: "2026-03-10"
        }
      }),
      getMe: vi.fn().mockResolvedValue({
        settings: {
          cycleLengthDays: 28,
          onboardingCompleted: false,
          periodLengthDays: 5,
          remindersEnabled: true,
          timezone: "UTC"
        },
        user: {
          firstName: "Demo",
          id: "demo-user",
          languageCode: "en",
          lastName: null,
          telegramUserId: "0",
          username: "demo_user"
        }
      })
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("does not rerun bootstrap data loading when the language changes", async () => {
    render(
      <I18nProvider>
        <AppDataProvider>
          <AppDataProbe />
        </AppDataProvider>
      </I18nProvider>
    );

    const api = createApiClientMock.mock.results[0]?.value as {
      getCycleSummary: ReturnType<typeof vi.fn>;
      getMe: ReturnType<typeof vi.fn>;
    };

    await waitFor(() => {
      expect(screen.getByText("ready")).toBeInTheDocument();
    });

    expect(api.getMe).toHaveBeenCalledTimes(1);
    expect(api.getCycleSummary).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /switch language/i }));

    await waitFor(() => {
      expect(screen.getByText("ready")).toBeInTheDocument();
    });

    expect(api.getMe).toHaveBeenCalledTimes(1);
    expect(api.getCycleSummary).toHaveBeenCalledTimes(1);
  });

  it("does not switch to demo mode when Telegram bootstrap failed", async () => {
    useSessionMock.mockReturnValue({
      environment: "telegram",
      error: "Telegram auth failed",
      initDataRaw: null,
      status: "error",
      user: null
    });

    render(
      <I18nProvider>
        <AppDataProvider>
          <AppDataProbe />
        </AppDataProvider>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("error")).toBeInTheDocument();
    });

    expect(createDemoApiClientMock).not.toHaveBeenCalled();
    expect(createApiClientMock).not.toHaveBeenCalled();
  });

  it("ignores app_demo for an authenticated Telegram session", async () => {
    window.history.replaceState({}, "", "/?app_demo=1");

    render(
      <I18nProvider>
        <AppDataProvider>
          <AppDataProbe />
        </AppDataProvider>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("ready")).toBeInTheDocument();
    });

    expect(createApiClientMock).toHaveBeenCalledTimes(1);
    expect(createDemoApiClientMock).not.toHaveBeenCalled();
  });

  it("still uses the demo client for browser preview even when app_demo is present", async () => {
    window.history.replaceState({}, "", "/?app_demo=1");
    useSessionMock.mockReturnValue({
      environment: "browser",
      error: null,
      initDataRaw: null,
      status: "preview",
      user: null
    });

    render(
      <I18nProvider>
        <AppDataProvider>
          <AppDataProbe />
        </AppDataProvider>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("ready")).toBeInTheDocument();
    });

    expect(createDemoApiClientMock).toHaveBeenCalledTimes(1);
    expect(createApiClientMock).not.toHaveBeenCalled();
  });

  it("surfaces demo bootstrap failures instead of hanging in loading", async () => {
    useSessionMock.mockReturnValue({
      environment: "browser",
      error: null,
      initDataRaw: null,
      status: "preview",
      user: null
    });
    createDemoApiClientMock.mockReturnValue({
      getCycleSummary: vi.fn().mockRejectedValue(new Error("Demo data failed to load.")),
      getMe: vi.fn().mockResolvedValue({
        settings: {
          cycleLengthDays: 28,
          onboardingCompleted: false,
          periodLengthDays: 5,
          remindersEnabled: true,
          timezone: "UTC"
        },
        user: {
          firstName: "Demo",
          id: "demo-user",
          languageCode: "en",
          lastName: null,
          telegramUserId: "0",
          username: "demo_user"
        }
      })
    });

    render(
      <I18nProvider>
        <AppDataProvider>
          <AppDataProbe />
        </AppDataProvider>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("error")).toBeInTheDocument();
      expect(screen.getByText("Demo data failed to load.")).toBeInTheDocument();
    });
  });

  it("preserves completed onboarding state when the post-save summary refresh fails", async () => {
    const getMe = vi
      .fn()
      .mockResolvedValueOnce({
        settings: {
          cycleLengthDays: 28,
          onboardingCompleted: false,
          periodLengthDays: 5,
          remindersEnabled: true,
          timezone: "UTC"
        },
        user: {
          firstName: "Ada",
          id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
          languageCode: "en",
          lastName: null,
          telegramUserId: "10001",
          username: "ada"
        }
      })
      .mockResolvedValueOnce({
        settings: {
          cycleLengthDays: 30,
          onboardingCompleted: true,
          periodLengthDays: 6,
          remindersEnabled: true,
          timezone: "UTC"
        },
        user: {
          firstName: "Ada",
          id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
          languageCode: "en",
          lastName: null,
          telegramUserId: "10001",
          username: "ada"
        }
      });
    const getCycleSummary = vi
      .fn()
      .mockResolvedValueOnce({
        summary: {
          activePeriod: false,
          averageCycleLengthDays: 28,
          averagePeriodLengthDays: 5,
          currentCycleDay: null,
          currentPhase: null,
          forecast: [],
          latestPeriodStart: null,
          onboardingCompleted: false,
          predictedNextPeriodStart: null,
          today: "2026-03-10"
        }
      })
      .mockRejectedValueOnce(new Error("Summary refresh failed."));
    const completeOnboarding = vi.fn().mockResolvedValue({
      settings: {
        cycleLengthDays: 30,
        onboardingCompleted: true,
        periodLengthDays: 6,
        remindersEnabled: true,
        timezone: "UTC"
      }
    });

    createApiClientMock.mockReturnValue({
      completeOnboarding,
      getCycleSummary,
      getMe
    });

    render(
      <I18nProvider>
        <AppDataProvider>
          <AppDataProbe />
        </AppDataProvider>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("pending")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /complete onboarding/i }));

    await waitFor(() => {
      expect(completeOnboarding).toHaveBeenCalled();
      expect(screen.getByText("ready")).toBeInTheDocument();
      expect(screen.getByText("onboarded")).toBeInTheDocument();
      expect(screen.getByText("2026-03-01")).toBeInTheDocument();
    });
  });
});
