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
import { CalendarRoute } from "./CalendarRoute";

describe("CalendarRoute", () => {
  it("renders logged and predicted period days from the API", async () => {
    const logPeriod = vi.fn().mockResolvedValue({
      entry: {
        cycleEnded: false,
        cycleStarted: false,
        date: "2026-03-03",
        flowIntensity: "heavy",
        note: null
      }
    });
    const getCalendar = vi
      .fn()
      .mockResolvedValueOnce({
        days: [
          {
            date: "2026-03-01",
            flowIntensity: "medium",
            isInCurrentCycle: true,
            isLoggedPeriodDay: true,
            isPredictedPeriodDay: false,
            isToday: false,
            symptomKeys: ["cramps"]
          },
          {
            date: "2026-03-03",
            flowIntensity: null,
            isInCurrentCycle: true,
            isLoggedPeriodDay: false,
            isPredictedPeriodDay: false,
            isToday: true,
            symptomKeys: []
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
      })
      .mockResolvedValue({
        days: [
          {
            date: "2026-03-01",
            flowIntensity: "medium",
            isInCurrentCycle: true,
            isLoggedPeriodDay: true,
            isPredictedPeriodDay: false,
            isToday: false,
            symptomKeys: ["cramps"]
          },
          {
            date: "2026-03-03",
            flowIntensity: "heavy",
            isInCurrentCycle: true,
            isLoggedPeriodDay: true,
            isPredictedPeriodDay: false,
            isToday: true,
            symptomKeys: []
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

    useAppDataMock.mockReturnValue({
      api: {
        endPeriod: vi.fn(),
        getCalendar,
        logPeriod,
        startPeriod: vi.fn()
      },
      refresh: vi.fn().mockResolvedValue(undefined),
      status: "ready",
      summary: {
        activePeriod: false,
        averageCycleLengthDays: 28,
        averagePeriodLengthDays: 5,
        currentCycleDay: 3,
        latestPeriodStart: "2026-03-01",
        onboardingCompleted: true,
        predictedNextPeriodStart: "2026-03-29",
        today: "2026-03-03"
      }
    });

    render(
      <I18nProvider>
        <CalendarRoute />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(getCalendar).toHaveBeenCalledWith("2026-03");
    });

    expect((await screen.findAllByText(/^Medium$/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/^Logged period day$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Predicted period day$/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /3/i }));
    fireEvent.change(screen.getByLabelText(/flow intensity/i), {
      target: { value: "heavy" }
    });
    fireEvent.click(screen.getByRole("button", { name: /save period day/i }));

    await waitFor(() => {
      expect(logPeriod).toHaveBeenCalledWith({
        date: "2026-03-03",
        flowIntensity: "heavy"
      });
    });
  });
});
