import { describe, expect, it } from "vitest";

import {
  addDaysToIsoDate,
  buildCalendarMonthDays,
  buildCyclePeriodWindows,
  buildPeriodForecast,
  calculateAverageCycleLength,
  calculateAveragePeriodLength,
  calculateCurrentCycleDay,
  differenceInDays,
  isPeriodActive,
  predictNextPeriodStart,
  resolveCyclePhase,
  resolvePeriodEnd
} from "./index.js";

describe("cycle utilities", () => {
  it("adds days to an ISO date", () => {
    expect(addDaysToIsoDate("2026-03-01", 3)).toBe("2026-03-04");
  });

  it("calculates difference in calendar days", () => {
    expect(differenceInDays("2026-03-01", "2026-03-05")).toBe(4);
  });

  it("calculates the current cycle day", () => {
    expect(calculateCurrentCycleDay("2026-03-01", "2026-03-05")).toBe(5);
  });

  it("returns null current cycle day without a cycle start", () => {
    expect(calculateCurrentCycleDay(null, "2026-03-05")).toBeNull();
  });

  it("calculates average cycle length from valid history", () => {
    expect(calculateAverageCycleLength([27, 28, 29], 30)).toBe(28);
  });

  it("falls back when cycle history is empty", () => {
    expect(calculateAverageCycleLength([], 30)).toBe(30);
    expect(calculateAveragePeriodLength([], 5)).toBe(5);
  });

  it("predicts the next period start from the latest cycle start", () => {
    expect(predictNextPeriodStart("2026-03-01", [28, 28], 30)).toBe("2026-03-29");
  });

  it("builds a rolling forecast for the next six months", () => {
    expect(
      buildPeriodForecast({
        averageCycleLengthDays: 28,
        averagePeriodLengthDays: 5,
        fromDate: "2026-03-01",
        latestCycleStart: "2026-03-01"
      })
    ).toContainEqual({
      periodEnd: "2026-04-02",
      periodStart: "2026-03-29"
    });
  });

  it("resolves the current cycle phase", () => {
    expect(resolveCyclePhase(3, 28, 5)).toBe("menstrual");
    expect(resolveCyclePhase(8, 28, 5)).toBe("follicular");
    expect(resolveCyclePhase(14, 28, 5)).toBe("ovulatory");
    expect(resolveCyclePhase(23, 28, 5)).toBe("luteal");
  });

  it("resolves an open period end using fallback length", () => {
    expect(resolvePeriodEnd("2026-03-01", null, 5)).toBe("2026-03-05");
  });

  it("detects an active period with an open end", () => {
    expect(isPeriodActive("2026-03-03", "2026-03-01", null, 5)).toBe(true);
    expect(isPeriodActive("2026-03-07", "2026-03-01", null, 5)).toBe(false);
  });

  it("builds calendar markers with logged and predicted period days", () => {
    const days = buildCalendarMonthDays({
      currentCycleStart: "2026-03-01",
      currentPeriodEnd: "2026-03-05",
      month: "2026-03",
      periodDays: [
        {
          date: "2026-03-01",
          flowIntensity: "medium",
          symptomKeys: ["cramps"]
        }
      ],
      predictedNextPeriodStart: "2026-03-29",
      predictedPeriodLengthDays: 5,
      today: "2026-03-03"
    });

    expect(days).toHaveLength(31);
    expect(days.find((day) => day.date === "2026-03-01")).toMatchObject({
      flowIntensity: "medium",
      isLoggedPeriodDay: true,
      symptomKeys: ["cramps"]
    });
    expect(days.find((day) => day.date === "2026-03-03")).toMatchObject({
      isInCurrentCycle: true,
      isPredictedPeriodDay: true,
      isToday: true
    });
    expect(days.find((day) => day.date === "2026-03-29")).toMatchObject({
      isPredictedPeriodDay: true
    });
  });

  it("groups period days into cycle windows using the first day as cycle start", () => {
    expect(
      buildCyclePeriodWindows(["2026-03-03", "2026-03-01", "2026-03-04", "2026-03-29"], 5)
    ).toEqual([
      {
        endedOn: "2026-03-05",
        startedOn: "2026-03-01"
      },
      {
        endedOn: "2026-04-02",
        startedOn: "2026-03-29"
      }
    ]);
  });
});
