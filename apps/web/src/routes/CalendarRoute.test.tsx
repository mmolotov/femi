// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const { useAppDataMock } = vi.hoisted(() => ({
  useAppDataMock: vi.fn()
}));

vi.mock("../data/AppDataProvider", () => ({
  useAppData: useAppDataMock
}));

import { I18nProvider } from "../i18n/I18nProvider";
import { CalendarRoute } from "./CalendarRoute";

function createCalendarResponse(month: string, loggedDays: readonly string[] = []) {
  return {
    days: loggedDays.map((date) => ({
      date,
      flowIntensity: null,
      isInCurrentCycle: true,
      isLoggedPeriodDay: true,
      isPredictedPeriodDay: false,
      isToday: false,
      symptomKeys: []
    })),
    month
  };
}

function createSummary() {
  return {
    activePeriod: false,
    averageCycleLengthDays: 28,
    averagePeriodLengthDays: 5,
    currentCycleDay: 3,
    currentPhase: "follicular" as const,
    forecast: [{ periodEnd: "2026-04-02", periodStart: "2026-03-29" }],
    latestPeriodStart: "2026-03-01",
    onboardingCompleted: true,
    predictedNextPeriodStart: "2026-03-29",
    today: "2026-03-03"
  };
}

function renderCalendar() {
  return render(
    <I18nProvider>
      <MemoryRouter>
        <CalendarRoute />
      </MemoryRouter>
    </I18nProvider>
  );
}

describe("CalendarRoute", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a month grid by default and shows day cells", async () => {
    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar: vi
          .fn()
          .mockImplementation(async (month: string) =>
            createCalendarResponse(month, ["2026-03-01", "2026-03-02"])
          ),
        getCheckin: vi.fn(),
        logPeriod: vi.fn(),
        saveCheckin: vi.fn(),
        startPeriod: vi.fn()
      },
      refresh: vi.fn().mockResolvedValue(undefined),
      status: "ready",
      summary: createSummary()
    });

    renderCalendar();

    expect(await screen.findByRole("heading", { name: "Calendar" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "2026-03-15" })).toBeInTheDocument();
  });

  it("switches to year projection and renders twelve mini months", async () => {
    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar: vi
          .fn()
          .mockImplementation(async (month: string) => createCalendarResponse(month)),
        getCheckin: vi.fn(),
        logPeriod: vi.fn(),
        saveCheckin: vi.fn(),
        startPeriod: vi.fn()
      },
      refresh: vi.fn().mockResolvedValue(undefined),
      status: "ready",
      summary: createSummary()
    });

    const { container } = renderCalendar();

    fireEvent.click(await screen.findByRole("tab", { name: "Year" }));

    await waitFor(() => {
      expect(container.querySelectorAll(".mini-month")).toHaveLength(12);
    });
  });

  it("toggles bulk edits for past days and saves them via the API", async () => {
    const logPeriod = vi.fn().mockResolvedValue({ entry: null });
    const deletePeriodDay = vi.fn().mockResolvedValue(undefined);
    const getCalendar = vi
      .fn()
      .mockImplementation(async (month: string) => createCalendarResponse(month, ["2026-03-01"]));

    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay,
        endPeriod: vi.fn(),
        getCalendar,
        getCheckin: vi.fn(),
        logPeriod,
        saveCheckin: vi.fn(),
        startPeriod: vi.fn()
      },
      refresh: vi.fn().mockResolvedValue(undefined),
      status: "ready",
      summary: createSummary()
    });

    renderCalendar();

    await screen.findByRole("button", { name: "2026-03-02" });

    fireEvent.click(screen.getByRole("button", { name: "Edit period days" }));
    fireEvent.click(screen.getByRole("button", { name: "2026-03-01" }));
    fireEvent.click(screen.getByRole("button", { name: "2026-03-02" }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(deletePeriodDay).toHaveBeenCalledWith("2026-03-01");
      expect(logPeriod).toHaveBeenCalledWith({ date: "2026-03-02" });
    });
  });

  it("does not toggle future dates in bulk mode", async () => {
    const logPeriod = vi.fn().mockResolvedValue({ entry: null });

    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar: vi
          .fn()
          .mockImplementation(async (month: string) => createCalendarResponse(month)),
        getCheckin: vi.fn(),
        logPeriod,
        saveCheckin: vi.fn(),
        startPeriod: vi.fn()
      },
      refresh: vi.fn().mockResolvedValue(undefined),
      status: "ready",
      summary: createSummary()
    });

    renderCalendar();

    await screen.findByRole("button", { name: "2026-03-02" });

    fireEvent.click(screen.getByRole("button", { name: "Edit period days" }));
    const futureButton = screen.getByRole("button", { name: "2026-03-15" });
    expect(futureButton).toBeDisabled();
  });
});
