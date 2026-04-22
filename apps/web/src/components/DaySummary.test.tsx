// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DaySummary, type DaySummaryCopy } from "./DaySummary";

const copy: DaySummaryCopy = {
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
    error: null,
    isPeriodDay: false,
    isSaving: false,
    onTogglePeriodDay: onToggle,
    phase: "menstrual" as const,
    primaryLabel: "Next",
    primaryValue: "3d to period"
  };

  const utils = render(<DaySummary {...defaults} {...overrides} />);

  return { ...utils, onToggle };
}

describe("DaySummary", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders countdown, phase, and probability for a menstrual day", () => {
    const { container } = renderSummary();

    expect(container.querySelectorAll(".day-summary-tile")).toHaveLength(3);
    expect(screen.getByText("Phase")).toBeInTheDocument();
    expect(screen.getByText("3d to period")).toBeInTheDocument();
    expect(screen.getByText("Menstrual")).toBeInTheDocument();
    expect(screen.getByText("low")).toBeInTheDocument();
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
      phase: "ovulatory",
      primaryValue: "Today ovulation"
    });

    expect(screen.getByText("peak")).toBeInTheDocument();
    expect(screen.getByText("Today ovulation")).toBeInTheDocument();
    expect(screen.getByText("Ovulatory")).toBeInTheDocument();
  });

  it("hides the first summary tile when no primary label/value are provided", () => {
    const { container } = renderSummary({
      primaryLabel: undefined,
      primaryValue: undefined
    });

    expect(container.querySelectorAll(".day-summary-tile")).toHaveLength(2);
    expect(screen.queryByText("3d to period")).not.toBeInTheDocument();
  });

  it("renders all summary tiles for longer localized phase labels", () => {
    const { container } = renderSummary({
      phase: "ovulatory",
      copy: {
        ...copy,
        phaseNames: {
          ...copy.phaseNames,
          ovulatory: "Овуляторная фаза"
        }
      }
    });

    expect(container.querySelectorAll(".day-summary-tile")).toHaveLength(3);
    expect(screen.getByText("Овуляторная фаза")).toBeInTheDocument();
  });
});
