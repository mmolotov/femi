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
import { TodayRoute } from "./TodayRoute";

function createCalendarDay(
  date: string,
  overrides: Partial<{
    flowIntensity: "spotting" | "light" | "medium" | "heavy" | null;
    isInCurrentCycle: boolean;
    isLoggedPeriodDay: boolean;
    isPredictedPeriodDay: boolean;
    isToday: boolean;
    symptomKeys: readonly string[];
  }> = {}
) {
  return {
    date,
    flowIntensity: null,
    isInCurrentCycle: true,
    isLoggedPeriodDay: false,
    isPredictedPeriodDay: false,
    isToday: false,
    symptomKeys: [],
    ...overrides
  };
}

function createSummary(
  today: string,
  overrides: Partial<{
    activePeriod: boolean;
    averageCycleLengthDays: number;
    averagePeriodLengthDays: number;
    currentCycleDay: number;
    currentPhase: "menstrual" | "follicular" | "ovulatory" | "luteal";
    forecast: Array<{ periodEnd: string; periodStart: string }>;
    latestPeriodStart: string | null;
    predictedNextPeriodStart: string | null;
  }> = {}
) {
  return {
    activePeriod: false,
    averageCycleLengthDays: 28,
    averagePeriodLengthDays: 5,
    currentCycleDay: 10,
    currentPhase: "follicular" as const,
    forecast: [{ periodEnd: "2026-04-02", periodStart: "2026-03-29" }],
    latestPeriodStart: "2026-03-01",
    onboardingCompleted: true,
    predictedNextPeriodStart: "2026-03-29",
    today,
    ...overrides
  };
}

function renderToday() {
  return render(
    <I18nProvider>
      <MemoryRouter>
        <TodayRoute />
      </MemoryRouter>
    </I18nProvider>
  );
}

describe("TodayRoute", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the week strip, day summary, and check-in form", async () => {
    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar: vi.fn().mockResolvedValue({
          days: [createCalendarDay("2026-03-03", { isToday: true })],
          month: "2026-03"
        }),
        getCheckin: vi.fn().mockResolvedValue({ entry: null }),
        logPeriod: vi.fn(),
        saveCheckin: vi.fn(),
        startPeriod: vi.fn()
      },
      refresh: vi.fn().mockResolvedValue(undefined),
      status: "ready",
      summary: createSummary("2026-03-03")
    });

    renderToday();

    expect(await screen.findByRole("button", { name: /mark period day/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save check-in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/mood/i)).toBeInTheDocument();
  });

  it("shows flow intensity selector only when the selected day is menstrual", async () => {
    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar: vi.fn().mockResolvedValue({
          days: [createCalendarDay("2026-03-03", { isLoggedPeriodDay: true, isToday: true })],
          month: "2026-03"
        }),
        getCheckin: vi.fn().mockResolvedValue({ entry: null }),
        logPeriod: vi.fn().mockResolvedValue({ entry: null }),
        saveCheckin: vi.fn().mockResolvedValue({ entry: null }),
        startPeriod: vi.fn()
      },
      refresh: vi.fn().mockResolvedValue(undefined),
      status: "ready",
      summary: createSummary("2026-03-03", {
        activePeriod: true,
        currentCycleDay: 3,
        currentPhase: "menstrual"
      })
    });

    renderToday();

    expect(await screen.findByLabelText(/flow intensity/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/discharge/i)).not.toBeInTheDocument();
  });

  it("shows the event name in the summary when ovulation is today", async () => {
    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar: vi.fn().mockResolvedValue({
          days: [createCalendarDay("2026-03-03", { isToday: true })],
          month: "2026-03"
        }),
        getCheckin: vi.fn().mockResolvedValue({ entry: null }),
        logPeriod: vi.fn(),
        saveCheckin: vi.fn(),
        startPeriod: vi.fn()
      },
      refresh: vi.fn().mockResolvedValue(undefined),
      status: "ready",
      summary: createSummary("2026-03-03", {
        averageCycleLengthDays: 28,
        currentCycleDay: 14,
        currentPhase: "ovulatory",
        latestPeriodStart: "2026-02-18"
      })
    });

    renderToday();

    expect(await screen.findByText("Today ovulation")).toBeInTheDocument();
  });

  it("toggles a period day via the summary button", async () => {
    const logPeriod = vi.fn().mockResolvedValue({ entry: null });
    const getCalendar = vi.fn().mockResolvedValue({
      days: [createCalendarDay("2026-03-03", { isToday: true })],
      month: "2026-03"
    });

    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar,
        getCheckin: vi.fn().mockResolvedValue({ entry: null }),
        logPeriod,
        saveCheckin: vi.fn(),
        startPeriod: vi.fn()
      },
      refresh: vi.fn().mockResolvedValue(undefined),
      status: "ready",
      summary: createSummary("2026-03-03")
    });

    renderToday();

    await screen.findByRole("button", { name: /mark period day/i });
    fireEvent.click(screen.getByRole("button", { name: /mark period day/i }));

    await waitFor(() => {
      expect(logPeriod).toHaveBeenCalledWith({ date: "2026-03-03" });
    });
  });

  it("saves a check-in with flow intensity for menstrual days", async () => {
    const saveCheckin = vi.fn().mockResolvedValue({ entry: null });
    const logPeriod = vi.fn().mockResolvedValue({ entry: null });
    const getCheckin = vi.fn().mockResolvedValue({ entry: null });

    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar: vi.fn().mockResolvedValue({
          days: [createCalendarDay("2026-03-03", { isLoggedPeriodDay: true, isToday: true })],
          month: "2026-03"
        }),
        getCheckin,
        logPeriod,
        saveCheckin,
        startPeriod: vi.fn()
      },
      refresh: vi.fn().mockResolvedValue(undefined),
      status: "ready",
      summary: createSummary("2026-03-03", {
        activePeriod: true,
        currentCycleDay: 3,
        currentPhase: "menstrual"
      })
    });

    renderToday();

    await waitFor(() => {
      expect(getCheckin).toHaveBeenCalledWith("2026-03-03");
    });

    fireEvent.change(await screen.findByLabelText(/flow intensity/i), {
      target: { value: "heavy" }
    });
    fireEvent.change(screen.getByLabelText(/mood/i), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: /save check-in/i }));

    await waitFor(() => {
      expect(saveCheckin).toHaveBeenCalledWith("2026-03-03", expect.objectContaining({ mood: 4 }));
    });

    await waitFor(() => {
      expect(logPeriod).toHaveBeenCalledWith({
        date: "2026-03-03",
        flowIntensity: "heavy"
      });
    });
  });

  it("sends explicit nulls when previously saved check-in fields are cleared", async () => {
    const saveCheckin = vi.fn().mockResolvedValue({ entry: null });

    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar: vi.fn().mockResolvedValue({
          days: [createCalendarDay("2026-03-03", { isToday: true })],
          month: "2026-03"
        }),
        getCheckin: vi.fn().mockResolvedValue({
          entry: {
            date: "2026-03-03",
            discharge: null,
            energy: null,
            mood: 4,
            note: "Existing note",
            painLevel: null,
            sleepQuality: null,
            symptomKeys: []
          }
        }),
        logPeriod: vi.fn(),
        saveCheckin,
        startPeriod: vi.fn()
      },
      refresh: vi.fn().mockResolvedValue(undefined),
      status: "ready",
      summary: createSummary("2026-03-03")
    });

    renderToday();

    const moodField = await screen.findByLabelText(/mood/i);

    await waitFor(() => {
      expect((moodField as HTMLSelectElement).value).toBe("4");
    });

    fireEvent.change(moodField, { target: { value: "" } });
    fireEvent.change(screen.getByLabelText(/note/i), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /save check-in/i }));

    await waitFor(() => {
      expect(saveCheckin).toHaveBeenCalledWith(
        "2026-03-03",
        expect.objectContaining({
          mood: null,
          note: null,
          symptomKeys: []
        })
      );
    });
  });

  it("selects a different day via the week strip and loads its check-in", async () => {
    const getCheckin = vi.fn().mockResolvedValue({ entry: null });

    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar: vi.fn().mockResolvedValue({
          days: [
            createCalendarDay("2026-03-02"),
            createCalendarDay("2026-03-03", { isToday: true })
          ],
          month: "2026-03"
        }),
        getCheckin,
        logPeriod: vi.fn(),
        saveCheckin: vi.fn(),
        startPeriod: vi.fn()
      },
      refresh: vi.fn().mockResolvedValue(undefined),
      status: "ready",
      summary: createSummary("2026-03-03")
    });

    renderToday();

    await waitFor(() => {
      expect(getCheckin).toHaveBeenCalledWith("2026-03-03");
    });

    fireEvent.click(await screen.findByRole("button", { name: /3\/2\/2026/ }));

    await waitFor(() => {
      expect(getCheckin).toHaveBeenCalledWith("2026-03-02");
    });
  });

  it("locks the form and hides save for future dates", async () => {
    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar: vi.fn().mockResolvedValue({
          days: [
            createCalendarDay("2026-03-03", { isToday: true }),
            createCalendarDay("2026-03-05")
          ],
          month: "2026-03"
        }),
        getCheckin: vi.fn().mockResolvedValue({ entry: null }),
        logPeriod: vi.fn(),
        saveCheckin: vi.fn(),
        startPeriod: vi.fn()
      },
      refresh: vi.fn().mockResolvedValue(undefined),
      status: "ready",
      summary: createSummary("2026-03-03")
    });

    renderToday();

    fireEvent.click(await screen.findByRole("button", { name: /3\/5\/2026/ }));

    await waitFor(() => {
      expect(screen.getByText(/future dates can be reviewed/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /save check-in/i })).not.toBeInTheDocument();
  });
});
