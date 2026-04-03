// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
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
  it("reuses the merged home screen route", async () => {
    useAppDataMock.mockReturnValue({
      api: null,
      refresh: vi.fn(),
      status: "ready",
      summary: {
        activePeriod: false,
        averageCycleLengthDays: 28,
        averagePeriodLengthDays: 5,
        currentCycleDay: 3,
        currentPhase: "follicular",
        forecast: [],
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

    expect(await screen.findByRole("heading", { name: "Today" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Calendar" })).toBeInTheDocument();
    expect(await screen.findByText("Mon")).toBeInTheDocument();
  });
});
