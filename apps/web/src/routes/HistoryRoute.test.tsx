// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { useAppDataMock } = vi.hoisted(() => ({
  useAppDataMock: vi.fn()
}));

vi.mock("../data/AppDataProvider", () => ({
  useAppData: useAppDataMock
}));

import { I18nProvider } from "../i18n/I18nProvider";
import { HistoryRoute } from "./HistoryRoute";

describe("HistoryRoute", () => {
  it("renders cycle history grouped by phase", async () => {
    const getHistory = vi.fn().mockResolvedValue({
      cycles: [
        {
          cycleId: "cycle-1",
          cycleLengthDays: 28,
          endedOn: "2026-03-28",
          periodLengthDays: 5,
          phases: [
            {
              averageEnergy: 3,
              averageFlowIntensityLevel: 3,
              averageMood: 4,
              averagePainLevel: 2,
              commonSymptoms: ["cramps"],
              days: [
                {
                  checkin: {
                    date: "2026-03-03",
                    discharge: null,
                    energy: 3,
                    mood: 4,
                    note: "Mild cramps",
                    painLevel: 2,
                    sleepQuality: 5,
                    symptomKeys: ["cramps"]
                  },
                  date: "2026-03-03",
                  period: {
                    cycleEnded: false,
                    cycleStarted: true,
                    date: "2026-03-03",
                    flowIntensity: "medium",
                    note: null
                  },
                  phase: "menstrual",
                  symptomKeys: ["cramps"]
                }
              ],
              endDate: "2026-03-05",
              phase: "menstrual",
              startDate: "2026-03-01",
              totalDays: 5
            }
          ],
          startedOn: "2026-03-01"
        }
      ]
    });

    useAppDataMock.mockReturnValue({
      api: {
        getHistory
      },
      status: "ready"
    });

    render(
      <I18nProvider>
        <HistoryRoute />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(getHistory).toHaveBeenCalledWith(6);
    });

    expect(await screen.findByText(/^Menstrual$/i)).toBeInTheDocument();
    expect(screen.getByText(/cycle length 28/i)).toBeInTheDocument();
    expect(screen.getByText(/average flow 3/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Cramps$/i).length).toBeGreaterThan(0);
  });
});
