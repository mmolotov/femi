// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DaySummary, type DaySummaryCopy } from "./DaySummary";

const copy: DaySummaryCopy = {
  countdownFallback: "No prediction yet",
  countdownLabel: "Next",
  countdownNextPeriod: (days) => `${days}d to period`,
  countdownOvulation: (days) => `${days}d to ovulation`,
  countdownToday: "Today",
  countdownTodayOvulation: "Today ovulation",
  countdownTodayPeriod: "Today period",
  errorFallback: "Something went wrong",
  markPeriodDay: "Mark period day",
  phaseFallback: "Phase unavailable",
  phaseLabel: "Phase",
  phaseNames: {
    follicular: "Follicular",
    luteal: "Luteal",
    menstrual: "Menstrual",
    ovulatory: "Ovulatory"
  },
  probabilityFallback: "unknown",
  probabilityLabel: "Conception probability",
  probabilityValues: {
    low: "low",
    moderate: "moderate",
    peak: "peak"
  },
  removePeriodDay: "Remove period day",
  savingLabel: "Saving",
  title: "Day summary"
};

function renderSummary(overrides: Partial<Parameters<typeof DaySummary>[0]> = {}) {
  const onToggle = vi.fn();
  const defaults = {
    canEdit: true,
    conceptionProbability: "low" as const,
    copy,
    daysToNextPeriod: 3,
    daysToOvulation: null,
    error: null,
    isPeriodDay: false,
    isSaving: false,
    onTogglePeriodDay: onToggle,
    phase: "menstrual" as const
  };

  const utils = render(<DaySummary {...defaults} {...overrides} />);

  return { ...utils, onToggle };
}

describe("DaySummary", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders countdown, phase, and probability for a menstrual day", () => {
    renderSummary();

    expect(screen.getByText("3d to period")).toBeInTheDocument();
    expect(screen.getByText("Menstrual")).toBeInTheDocument();
    expect(screen.getByText("low")).toBeInTheDocument();
  });

  it("picks the nearest countdown between period and ovulation", () => {
    renderSummary({ daysToNextPeriod: 10, daysToOvulation: 2 });

    expect(screen.getByText("2d to ovulation")).toBeInTheDocument();
  });

  it("renders 'mark period day' when the selected day is not logged, and toggles", () => {
    const { onToggle } = renderSummary();

    fireEvent.click(screen.getByRole("button", { name: "Mark period day" }));

    expect(onToggle).toHaveBeenCalled();
  });

  it("renders 'remove period day' when the selected day is already a period day", () => {
    renderSummary({ conceptionProbability: null, isPeriodDay: true });

    expect(screen.getByRole("button", { name: "Remove period day" })).toBeInTheDocument();
  });

  it("uses 'peak' probability label when computed tier is peak", () => {
    renderSummary({
      conceptionProbability: "peak",
      daysToNextPeriod: 14,
      daysToOvulation: 0,
      phase: "ovulatory"
    });

    expect(screen.getByText("peak")).toBeInTheDocument();
    expect(screen.getByText("Today ovulation")).toBeInTheDocument();
    expect(screen.getByText("Ovulatory")).toBeInTheDocument();
  });

  it("renders today's period label when the nearest event is a period day", () => {
    renderSummary({
      daysToNextPeriod: 0,
      daysToOvulation: 3
    });

    expect(screen.getByText("Today period")).toBeInTheDocument();
  });
});
