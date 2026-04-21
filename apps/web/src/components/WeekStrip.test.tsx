// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WeekStrip, type WeekStripCopy } from "./WeekStrip";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const copy: WeekStripCopy = {
  stripLabel: "Week strip",
  previousWeek: "Previous week",
  nextWeek: "Next week",
  openCalendar: "Open full calendar",
  periodMarker: "period day",
  predictedMarker: "predicted period",
  ovulationMarker: "ovulation",
  todayMarker: "today"
};

function renderStrip(overrides: Partial<Parameters<typeof WeekStrip>[0]> = {}) {
  const onSelect = vi.fn();
  const onOpenCalendar = vi.fn();
  const defaults = {
    copy,
    formatDayLabel: (iso: string) => iso,
    formatRangeLabel: (start: string, end: string) => `${start} → ${end}`,
    onOpenCalendar,
    onSelect,
    ovulationDays: ["2026-04-15"] as readonly string[],
    periodDays: ["2026-04-13"] as readonly string[],
    predictedPeriodDays: ["2026-04-17"] as readonly string[],
    selectedDate: "2026-04-15",
    today: "2026-04-15",
    weekdayLabels
  };

  const utils = render(<WeekStrip {...defaults} {...overrides} />);

  return { ...utils, onOpenCalendar, onSelect };
}

describe("WeekStrip", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders Monday through Sunday of the selected date's week", () => {
    renderStrip();

    expect(screen.getByRole("button", { name: "2026-04-13 — period day" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "2026-04-15 — today, ovulation" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "2026-04-17 — predicted period" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2026-04-19" })).toBeInTheDocument();
  });

  it("fires onSelect when a day cell is clicked", () => {
    const { onSelect } = renderStrip();

    fireEvent.click(screen.getByRole("button", { name: "2026-04-16" }));

    expect(onSelect).toHaveBeenCalledWith("2026-04-16");
  });

  it("shifts to the next week when the next-week button is clicked", () => {
    renderStrip();

    fireEvent.click(screen.getByRole("button", { name: "Next week" }));

    expect(screen.getByRole("button", { name: /2026-04-20/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /2026-04-13/ })).not.toBeInTheDocument();
  });

  it("invokes the open-calendar callback", () => {
    const { onOpenCalendar } = renderStrip();

    fireEvent.click(screen.getByRole("button", { name: "Open full calendar" }));

    expect(onOpenCalendar).toHaveBeenCalled();
  });

  it("moves selection by one day when the user presses arrow right", () => {
    const { container, onSelect } = renderStrip();
    const grid = container.querySelector(".week-strip-days");

    if (!grid) {
      throw new Error("week-strip-days container not found");
    }

    fireEvent.keyDown(grid, { key: "ArrowRight" });

    expect(onSelect).toHaveBeenCalledWith("2026-04-16");
  });
});
