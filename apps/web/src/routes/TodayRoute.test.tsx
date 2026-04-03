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
import { TodayRoute } from "./TodayRoute";

describe("TodayRoute", () => {
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

    expect(await screen.findByText(/this day is not marked as a period day yet/i)).toBeInTheDocument();

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
});
