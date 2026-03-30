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
  it("renders summary data and saves a check-in", async () => {
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
    const getCheckin = vi.fn().mockResolvedValue({
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

    useAppDataMock.mockReturnValue({
      api: {
        endPeriod: vi.fn(),
        getCheckin,
        saveCheckin,
        startPeriod: vi.fn()
      },
      refresh: vi.fn().mockResolvedValue(undefined),
      status: "ready",
      summary: {
        activePeriod: true,
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
        <TodayRoute />
      </I18nProvider>
    );

    expect(screen.getByText(/current cycle day/i).closest(".metric-card")).toHaveTextContent("3");
    expect(screen.getByText(/period in progress/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(getCheckin).toHaveBeenCalledWith("2026-03-03");
    });

    fireEvent.click(screen.getByRole("button", { name: /save today's check-in/i }));

    await waitFor(() => {
      expect(saveCheckin).toHaveBeenCalledWith(
        "2026-03-03",
        expect.objectContaining({
          discharge: "creamy",
          mood: 4,
          symptomKeys: ["cramps"]
        })
      );
    });

    expect(await screen.findByText(/today's entry was saved/i)).toBeInTheDocument();
  });
});
