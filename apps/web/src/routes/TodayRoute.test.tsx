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
import { TodayRoute } from "./TodayRoute";

function createCalendarDay(date: string) {
  return {
    date,
    flowIntensity: null,
    isInCurrentCycle: true,
    isLoggedPeriodDay: false,
    isPredictedPeriodDay: false,
    isToday: false,
    symptomKeys: []
  };
}

function createSummary(today: string) {
  return {
    activePeriod: false,
    averageCycleLengthDays: 28,
    averagePeriodLengthDays: 5,
    currentCycleDay: 10,
    currentPhase: "follicular" as const,
    forecast: [
      {
        periodEnd: "2032-01-12",
        periodStart: "2032-01-08"
      }
    ],
    latestPeriodStart: "2031-11-10",
    onboardingCompleted: true,
    predictedNextPeriodStart: "2032-01-08",
    today
  };
}

describe("TodayRoute", () => {
  afterEach(() => {
    cleanup();
  });

  it("uses the selected calendar date for period actions and check-ins", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const saveCheckin = vi.fn().mockResolvedValue({
      entry: {
        date: "2026-03-03",
        discharge: "creamy",
        energy: 3,
        mood: 4,
        note: "Mild cramps",
        painLevel: 2,
        sleepQuality: 5,
        symptomKeys: ["cramps"]
      }
    });
    const deletePeriodDay = vi.fn().mockResolvedValue(undefined);
    const getCheckin = vi.fn().mockImplementation(async (date: string) => {
      if (date === "2026-03-03") {
        return {
          entry: {
            date: "2026-03-03",
            discharge: null,
            energy: 3,
            mood: 4,
            note: "Mild cramps",
            painLevel: 2,
            sleepQuality: 5,
            symptomKeys: ["cramps"]
          }
        };
      }

      return { entry: null };
    });
    const getCalendar = vi.fn().mockResolvedValue({
      days: [
        {
          date: "2026-03-01",
          flowIntensity: null,
          isInCurrentCycle: true,
          isLoggedPeriodDay: false,
          isPredictedPeriodDay: false,
          isToday: false,
          symptomKeys: []
        },
        {
          date: "2026-03-03",
          flowIntensity: "light",
          isInCurrentCycle: true,
          isLoggedPeriodDay: true,
          isPredictedPeriodDay: false,
          isToday: true,
          symptomKeys: ["cramps"]
        },
        {
          date: "2026-03-29",
          flowIntensity: null,
          isInCurrentCycle: false,
          isLoggedPeriodDay: false,
          isPredictedPeriodDay: true,
          isToday: false,
          symptomKeys: []
        }
      ],
      month: "2026-03"
    });
    const logPeriod = vi.fn().mockResolvedValue({
      entry: {
        cycleEnded: false,
        cycleStarted: false,
        date: "2026-03-03",
        flowIntensity: null,
        note: null
      }
    });

    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay,
        endPeriod: vi.fn(),
        getCalendar,
        getCheckin,
        logPeriod,
        saveCheckin,
        startPeriod: vi.fn()
      },
      refresh,
      status: "ready",
      summary: {
        activePeriod: true,
        averageCycleLengthDays: 28,
        averagePeriodLengthDays: 5,
        currentCycleDay: 3,
        currentPhase: "menstrual",
        forecast: [
          {
            periodEnd: "2026-04-02",
            periodStart: "2026-03-29"
          }
        ],
        latestPeriodStart: "2026-03-01",
        onboardingCompleted: true,
        predictedNextPeriodStart: "2026-03-29",
        today: "2026-03-03"
      }
    });

    render(
      <I18nProvider>
        <TodayRoute />
      </I18nProvider>
    );

    expect(screen.getByText(/current cycle day/i).closest(".metric-card")).toHaveTextContent("3");
    expect(await screen.findByRole("heading", { name: "Today" })).toBeInTheDocument();
    expect(await screen.findByText("Mon")).toBeInTheDocument();

    await waitFor(() => {
      expect(getCheckin).toHaveBeenCalledWith("2026-03-03");
      expect(getCalendar).toHaveBeenCalledWith("2026-03");
    });

    fireEvent.change(screen.getByLabelText(/flow intensity/i), {
      target: { value: "heavy" }
    });
    fireEvent.click(screen.getByRole("button", { name: /save period details/i }));

    await waitFor(() => {
      expect(logPeriod).toHaveBeenCalledWith({
        date: "2026-03-03",
        flowIntensity: "heavy"
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /remove period day/i }));

    await waitFor(() => {
      expect(deletePeriodDay).toHaveBeenCalledWith("2026-03-03");
    });

    fireEvent.click(screen.getByRole("button", { name: /^2026-03-01$/i }));

    expect(
      await screen.findByText(/this day is not marked as a period day yet/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^mark period day$/i }));

    await waitFor(() => {
      expect(logPeriod).toHaveBeenCalledWith({
        date: "2026-03-01"
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /^2026-03-03 period$/i }));

    await waitFor(() => {
      expect(getCheckin).toHaveBeenCalledWith("2026-03-03");
    });

    fireEvent.click(screen.getByRole("button", { name: /save check-in/i }));

    await waitFor(() => {
      expect(saveCheckin).toHaveBeenCalledWith(
        "2026-03-03",
        expect.objectContaining({
          mood: 4,
          symptomKeys: ["cramps"]
        })
      );
    });

    expect(await screen.findByText(/the entry for this day was saved/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^2026-03-29 forecast$/i }));

    expect(await screen.findByText(/future dates can be reviewed/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save check-in/i })).not.toBeInTheDocument();
  });

  it("preserves a zero pain level when saving a check-in", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const saveCheckin = vi.fn().mockResolvedValue({
      entry: {
        date: "2026-03-03",
        discharge: null,
        energy: null,
        mood: null,
        note: null,
        painLevel: 0,
        sleepQuality: null,
        symptomKeys: []
      }
    });

    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar: vi.fn().mockResolvedValue({
          days: [
            {
              date: "2026-03-03",
              flowIntensity: null,
              isInCurrentCycle: true,
              isLoggedPeriodDay: false,
              isPredictedPeriodDay: false,
              isToday: true,
              symptomKeys: []
            }
          ],
          month: "2026-03"
        }),
        getCheckin: vi.fn().mockResolvedValue({
          entry: {
            date: "2026-03-03",
            discharge: null,
            energy: null,
            mood: null,
            note: null,
            painLevel: null,
            sleepQuality: null,
            symptomKeys: []
          }
        }),
        logPeriod: vi.fn(),
        saveCheckin,
        startPeriod: vi.fn()
      },
      refresh,
      status: "ready",
      summary: {
        activePeriod: false,
        averageCycleLengthDays: 28,
        averagePeriodLengthDays: 5,
        currentCycleDay: 10,
        currentPhase: "follicular",
        forecast: [
          {
            periodEnd: "2026-04-02",
            periodStart: "2026-03-29"
          }
        ],
        latestPeriodStart: "2026-03-01",
        onboardingCompleted: true,
        predictedNextPeriodStart: "2026-03-29",
        today: "2026-03-03"
      }
    });

    render(
      <I18nProvider>
        <TodayRoute />
      </I18nProvider>
    );

    expect(await screen.findByRole("heading", { name: "Today" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/pain/i), {
      target: { value: "0" }
    });
    fireEvent.click(screen.getByRole("button", { name: /save check-in/i }));

    await waitFor(() => {
      expect(saveCheckin).toHaveBeenCalledWith(
        "2026-03-03",
        expect.objectContaining({
          painLevel: 0
        })
      );
    });
  });

  it("sends explicit nulls when previously saved check-in fields are cleared", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const saveCheckin = vi.fn().mockResolvedValue({
      entry: null
    });

    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar: vi.fn().mockResolvedValue({
          days: [
            {
              date: "2026-03-03",
              flowIntensity: null,
              isInCurrentCycle: true,
              isLoggedPeriodDay: false,
              isPredictedPeriodDay: false,
              isToday: true,
              symptomKeys: []
            }
          ],
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
      refresh,
      status: "ready",
      summary: {
        activePeriod: false,
        averageCycleLengthDays: 28,
        averagePeriodLengthDays: 5,
        currentCycleDay: 10,
        currentPhase: "follicular",
        forecast: [
          {
            periodEnd: "2026-04-02",
            periodStart: "2026-03-29"
          }
        ],
        latestPeriodStart: "2026-03-01",
        onboardingCompleted: true,
        predictedNextPeriodStart: "2026-03-29",
        today: "2026-03-03"
      }
    });

    render(
      <I18nProvider>
        <TodayRoute />
      </I18nProvider>
    );

    expect(await screen.findByRole("heading", { name: "Today" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/mood/i), {
      target: { value: "" }
    });
    fireEvent.change(screen.getByLabelText(/note/i), {
      target: { value: "" }
    });
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

  it("syncs the initial selected date to summary.today when summary arrives later", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const getCheckin = vi.fn().mockResolvedValue({ entry: null });
    const getCalendar = vi.fn().mockImplementation(async (month: string) => ({
      days:
        month === "2031-12"
          ? [createCalendarDay("2031-12-05")]
          : [createCalendarDay(`${month}-01`)],
      month
    }));

    let appData: {
      api: Record<string, unknown>;
      refresh: typeof refresh;
      status: "ready";
      summary: ReturnType<typeof createSummary> | null;
    } = {
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar,
        getCheckin,
        logPeriod: vi.fn(),
        saveCheckin: vi.fn(),
        startPeriod: vi.fn()
      },
      refresh,
      status: "ready" as const,
      summary: null
    };

    useAppDataMock.mockImplementation(() => appData);

    const { rerender } = render(
      <I18nProvider>
        <TodayRoute />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(getCalendar).toHaveBeenCalled();
      expect(getCheckin).toHaveBeenCalled();
    });

    appData = {
      ...appData,
      summary: createSummary("2031-12-05")
    };

    rerender(
      <I18nProvider>
        <TodayRoute />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(getCalendar).toHaveBeenCalledWith("2031-12");
      expect(getCheckin).toHaveBeenCalledWith("2031-12-05");
    });

    expect(screen.getByRole("button", { name: /^2031-12-05$/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("does not overwrite a user-selected calendar date after summary refreshes", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const getCheckin = vi.fn().mockResolvedValue({ entry: null });
    const getCalendar = vi.fn().mockResolvedValue({
      days: [createCalendarDay("2031-12-05"), createCalendarDay("2031-12-07")],
      month: "2031-12"
    });

    let appData: {
      api: Record<string, unknown>;
      refresh: typeof refresh;
      status: "ready";
      summary: ReturnType<typeof createSummary> | null;
    } = {
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar,
        getCheckin,
        logPeriod: vi.fn(),
        saveCheckin: vi.fn(),
        startPeriod: vi.fn()
      },
      refresh,
      status: "ready" as const,
      summary: createSummary("2031-12-05")
    };

    useAppDataMock.mockImplementation(() => appData);

    const { rerender } = render(
      <I18nProvider>
        <TodayRoute />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(getCheckin).toHaveBeenCalledWith("2031-12-05");
    });

    fireEvent.click(screen.getByRole("button", { name: /^2031-12-07$/i }));

    await waitFor(() => {
      expect(getCheckin).toHaveBeenCalledWith("2031-12-07");
    });

    appData = {
      ...appData,
      summary: createSummary("2032-01-01")
    };

    rerender(
      <I18nProvider>
        <TodayRoute />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^2031-12-07$/i })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });

    expect(getCheckin).not.toHaveBeenCalledWith("2032-01-01");
  });

  it("keeps a user-navigated month instead of snapping back to the summary month", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const getCheckin = vi.fn().mockResolvedValue({ entry: null });
    const getCalendar = vi.fn().mockImplementation(async (month: string) => ({
      days: [createCalendarDay(`${month}-01`)],
      month
    }));

    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar,
        getCheckin,
        logPeriod: vi.fn(),
        saveCheckin: vi.fn(),
        startPeriod: vi.fn()
      },
      refresh,
      status: "ready",
      summary: createSummary("2031-12-05")
    });

    render(
      <I18nProvider>
        <TodayRoute />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(getCalendar).toHaveBeenCalledWith("2031-12");
    });

    fireEvent.click(screen.getByRole("button", { name: /next month/i }));

    await waitFor(() => {
      expect(getCalendar).toHaveBeenCalledWith("2032-01");
    });

    expect(screen.getByText("January 2032")).toBeInTheDocument();
  });

  it("keeps the logged day visible after a successful save even if the calendar reread is stale", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const getCheckin = vi.fn().mockResolvedValue({ entry: null });
    const getCalendar = vi.fn().mockResolvedValue({
      days: [createCalendarDay("2026-04-12")],
      month: "2026-04"
    });
    const logPeriod = vi.fn().mockResolvedValue({
      entry: {
        cycleEnded: false,
        cycleStarted: false,
        date: "2026-04-12",
        flowIntensity: null,
        note: null
      }
    });

    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar,
        getCheckin,
        logPeriod,
        saveCheckin: vi.fn(),
        startPeriod: vi.fn()
      },
      refresh,
      status: "ready",
      summary: {
        activePeriod: false,
        averageCycleLengthDays: 28,
        averagePeriodLengthDays: 5,
        currentCycleDay: 10,
        currentPhase: "follicular",
        forecast: [],
        latestPeriodStart: "2026-04-01",
        onboardingCompleted: true,
        predictedNextPeriodStart: null,
        today: "2026-04-12"
      }
    });

    render(
      <I18nProvider>
        <TodayRoute />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(getCalendar).toHaveBeenCalledWith("2026-04");
    });

    fireEvent.click(screen.getByRole("button", { name: /mark period day/i }));

    await waitFor(() => {
      expect(logPeriod).toHaveBeenCalledWith({
        date: "2026-04-12"
      });
      expect(screen.getByText(/this date is already marked as a period day/i)).toBeInTheDocument();
    });
  });

  it("blocks saving until a selected date check-in loads successfully", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const saveCheckin = vi.fn().mockResolvedValue({
      entry: {
        date: "2026-03-02",
        discharge: null,
        energy: null,
        mood: 4,
        note: null,
        painLevel: null,
        sleepQuality: null,
        symptomKeys: []
      }
    });
    const getCheckin = vi.fn().mockImplementation(async (date: string) => {
      if (date === "2026-03-03") {
        throw new Error("Check-in data could not be loaded.");
      }

      return { entry: null };
    });

    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar: vi.fn().mockResolvedValue({
          days: [createCalendarDay("2026-03-02"), createCalendarDay("2026-03-03")],
          month: "2026-03"
        }),
        getCheckin,
        logPeriod: vi.fn(),
        saveCheckin,
        startPeriod: vi.fn()
      },
      refresh,
      status: "ready",
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
        today: "2026-03-03"
      }
    });

    render(
      <I18nProvider>
        <TodayRoute />
      </I18nProvider>
    );

    const saveButton = await screen.findByRole("button", { name: /save check-in/i });

    await waitFor(() => {
      expect(screen.getByText("Check-in data could not be loaded.")).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });

    fireEvent.click(saveButton);
    expect(saveCheckin).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /^2026-03-02$/i }));

    await waitFor(() => {
      expect(getCheckin).toHaveBeenCalledWith("2026-03-02");
      expect(screen.queryByText("Check-in data could not be loaded.")).not.toBeInTheDocument();
      expect(saveButton).not.toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText(/mood/i), {
      target: { value: "4" }
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveCheckin).toHaveBeenCalledWith(
        "2026-03-02",
        expect.objectContaining({
          mood: 4
        })
      );
    });
  });

  it("keeps check-in save successful when only the follow-up refresh fails", async () => {
    const refresh = vi.fn().mockRejectedValue(new Error("Summary refresh failed."));
    const saveCheckin = vi.fn().mockResolvedValue({
      entry: {
        date: "2026-03-03",
        discharge: null,
        energy: null,
        mood: 4,
        note: null,
        painLevel: null,
        sleepQuality: null,
        symptomKeys: []
      }
    });

    useAppDataMock.mockReturnValue({
      api: {
        deletePeriodDay: vi.fn(),
        endPeriod: vi.fn(),
        getCalendar: vi.fn().mockResolvedValue({
          days: [createCalendarDay("2026-03-03")],
          month: "2026-03"
        }),
        getCheckin: vi.fn().mockResolvedValue({
          entry: null
        }),
        logPeriod: vi.fn(),
        saveCheckin,
        startPeriod: vi.fn()
      },
      refresh,
      status: "ready",
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
        today: "2026-03-03"
      }
    });

    render(
      <I18nProvider>
        <TodayRoute />
      </I18nProvider>
    );

    expect(await screen.findByRole("heading", { name: "Today" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/mood/i), {
      target: { value: "4" }
    });
    fireEvent.click(screen.getByRole("button", { name: /save check-in/i }));

    await waitFor(() => {
      expect(saveCheckin).toHaveBeenCalledWith(
        "2026-03-03",
        expect.objectContaining({
          mood: 4
        })
      );
      expect(refresh).toHaveBeenCalled();
      expect(screen.getByText(/the entry for this day was saved/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/check-in could not be saved/i)).not.toBeInTheDocument();
  });
});
