// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HistoryResponse } from "@femi/shared";

const { useAppDataMock } = vi.hoisted(() => ({
  useAppDataMock: vi.fn()
}));

vi.mock("../data/AppDataProvider", () => ({
  useAppData: useAppDataMock
}));

import { I18nProvider } from "../i18n/I18nProvider";
import { useI18n } from "../i18n/I18nProvider";
import { HistoryRoute } from "./HistoryRoute";

function HistoryRouteHarness() {
  const { setLanguage } = useI18n();

  return (
    <>
      <button
        onClick={() => {
          setLanguage("ru");
        }}
        type="button"
      >
        Switch language
      </button>
      <HistoryRoute />
    </>
  );
}

function createHistoryResponse(overrides: Partial<HistoryResponse>) {
  return {
    cycles: [],
    hasMore: false,
    nextBefore: null,
    ...overrides
  };
}

describe("HistoryRoute", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders cycle history grouped by phase", async () => {
    const getHistory = vi.fn().mockResolvedValue(
      createHistoryResponse({
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
          },
          {
            cycleId: "cycle-0",
            cycleLengthDays: 27,
            endedOn: "2026-02-28",
            periodLengthDays: 4,
            phases: [
              {
                averageEnergy: 4,
                averageFlowIntensityLevel: null,
                averageMood: 4,
                averagePainLevel: 1,
                commonSymptoms: [],
                days: [
                  {
                    checkin: null,
                    date: "2026-02-10",
                    period: null,
                    phase: "follicular",
                    symptomKeys: []
                  }
                ],
                endDate: "2026-02-14",
                phase: "follicular",
                startDate: "2026-02-06",
                totalDays: 9
              }
            ],
            startedOn: "2026-02-02"
          }
        ]
      })
    );

    useAppDataMock.mockReturnValue({
      api: {
        getHistory
      },
      status: "ready"
    });

    render(
      <I18nProvider>
        <HistoryRouteHarness />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(getHistory).toHaveBeenCalledWith();
    });

    const cycleCards = document.querySelectorAll(".history-card");

    expect(cycleCards).toHaveLength(2);
    expect(cycleCards[0]).toHaveAttribute("open");
    expect(cycleCards[1]).not.toHaveAttribute("open");
    expect(await screen.findByText(/^Menstrual$/i)).toBeInTheDocument();
    expect(screen.getByText(/cycle length 28/i)).toBeInTheDocument();
    expect(screen.getByText(/cycle length 27/i)).toBeInTheDocument();
    expect(screen.getByText(/average flow 3/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Cramps$/i).length).toBeGreaterThan(0);
  });

  it("allows expanding a previous cycle while keeping its summary visible when collapsed", async () => {
    const getHistory = vi.fn().mockResolvedValue(
      createHistoryResponse({
        cycles: [
          {
            cycleId: "cycle-1",
            cycleLengthDays: 28,
            endedOn: "2026-03-28",
            periodLengthDays: 5,
            phases: [],
            startedOn: "2026-03-01"
          },
          {
            cycleId: "cycle-0",
            cycleLengthDays: 27,
            endedOn: "2026-02-28",
            periodLengthDays: 4,
            phases: [
              {
                averageEnergy: 4,
                averageFlowIntensityLevel: null,
                averageMood: 4,
                averagePainLevel: 1,
                commonSymptoms: [],
                days: [
                  {
                    checkin: null,
                    date: "2026-02-10",
                    period: null,
                    phase: "follicular",
                    symptomKeys: []
                  }
                ],
                endDate: "2026-02-14",
                phase: "follicular",
                startDate: "2026-02-06",
                totalDays: 9
              }
            ],
            startedOn: "2026-02-02"
          }
        ]
      })
    );

    useAppDataMock.mockReturnValue({
      api: {
        getHistory
      },
      status: "ready"
    });

    render(
      <I18nProvider>
        <HistoryRouteHarness />
      </I18nProvider>
    );

    await screen.findByText(/cycle length 27/i);

    const cycleCards = document.querySelectorAll(".history-card");
    const previousSummary = cycleCards[1]?.querySelector(".history-card-summary");

    expect(cycleCards[1]).not.toHaveAttribute("open");

    if (!previousSummary) {
      throw new Error("previous cycle summary not found");
    }

    fireEvent.click(previousSummary);

    expect(cycleCards[1]).toHaveAttribute("open");
    expect(await screen.findByText(/^Follicular$/i)).toBeInTheDocument();
  });

  it("loads older cycles when show more is pressed", async () => {
    const getHistory = vi
      .fn()
      .mockResolvedValueOnce(
        createHistoryResponse({
          cycles: [
            {
              cycleId: "cycle-1",
              cycleLengthDays: 28,
              endedOn: "2026-03-28",
              periodLengthDays: 5,
              phases: [],
              startedOn: "2026-03-01"
            }
          ],
          hasMore: true,
          nextBefore: "2026-03-01"
        })
      )
      .mockResolvedValueOnce(
        createHistoryResponse({
          cycles: [
            {
              cycleId: "cycle-0",
              cycleLengthDays: 30,
              endedOn: "2026-02-28",
              periodLengthDays: 4,
              phases: [],
              startedOn: "2026-01-30"
            }
          ],
          hasMore: false,
          nextBefore: null
        })
      );

    useAppDataMock.mockReturnValue({
      api: {
        getHistory
      },
      status: "ready"
    });

    render(
      <I18nProvider>
        <HistoryRouteHarness />
      </I18nProvider>
    );

    await screen.findByText(/cycle length 28/i);

    fireEvent.click(screen.getByRole("button", { name: /show more/i }));

    await waitFor(() => {
      expect(getHistory).toHaveBeenNthCalledWith(2, { before: "2026-03-01" });
    });

    expect(await screen.findByText(/cycle length 30/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show more/i })).not.toBeInTheDocument();
  });

  it("keeps the newest cycle collapsed if the user closes it before a rerender", async () => {
    const getHistory = vi
      .fn()
      .mockResolvedValueOnce(
        createHistoryResponse({
          cycles: [
            {
              cycleId: "cycle-1",
              cycleLengthDays: 28,
              endedOn: "2026-03-28",
              periodLengthDays: 5,
              phases: [],
              startedOn: "2026-03-01"
            }
          ],
          hasMore: true,
          nextBefore: "2026-03-01"
        })
      )
      .mockResolvedValueOnce(
        createHistoryResponse({
          cycles: [
            {
              cycleId: "cycle-0",
              cycleLengthDays: 30,
              endedOn: "2026-02-28",
              periodLengthDays: 4,
              phases: [],
              startedOn: "2026-01-30"
            }
          ],
          hasMore: false,
          nextBefore: null
        })
      );

    useAppDataMock.mockReturnValue({
      api: {
        getHistory
      },
      status: "ready"
    });

    render(
      <I18nProvider>
        <HistoryRouteHarness />
      </I18nProvider>
    );

    await screen.findByText(/cycle length 28/i);

    const cycleCards = document.querySelectorAll(".history-card");
    const newestSummary = cycleCards[0]?.querySelector(".history-card-summary");

    if (!newestSummary) {
      throw new Error("newest cycle summary not found");
    }

    fireEvent.click(newestSummary);
    expect(cycleCards[0]).not.toHaveAttribute("open");

    fireEvent.click(screen.getByRole("button", { name: /show more/i }));

    await screen.findByText(/cycle length 30/i);
    expect(cycleCards[0]).not.toHaveAttribute("open");
  });

  it("does not refetch history when only the language changes", async () => {
    const getHistory = vi.fn().mockResolvedValue(createHistoryResponse({ cycles: [] }));

    useAppDataMock.mockReturnValue({
      api: {
        getHistory
      },
      status: "ready"
    });

    render(
      <I18nProvider>
        <HistoryRouteHarness />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(getHistory).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: /switch language/i }));

    await waitFor(() => {
      expect(getHistory).toHaveBeenCalledTimes(1);
    });
  });

  it("uses the latest language fallback copy if history loading fails after a language switch", async () => {
    const getHistory = vi.fn().mockRejectedValue(undefined);
    let appData = {
      api: null as null | { getHistory: typeof getHistory },
      status: "loading" as "loading" | "ready"
    };

    useAppDataMock.mockImplementation(() => appData);

    const { rerender } = render(
      <I18nProvider>
        <HistoryRouteHarness />
      </I18nProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /switch language/i }));

    appData = {
      api: {
        getHistory
      },
      status: "ready"
    };

    rerender(
      <I18nProvider>
        <HistoryRouteHarness />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(getHistory).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Не удалось загрузить историю.")).toBeInTheDocument();
    });
  });
});
