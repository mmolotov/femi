import {
  addDaysToIsoDate,
  differenceInDays,
  getIsoDateInTimeZone,
  resolveOvulationDay,
  type CalendarResponse,
  type CycleSummary
} from "@femi/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Panel } from "../components/Panel";
import { useAppData } from "../data/AppDataProvider";
import { useI18n } from "../i18n/I18nProvider";
import {
  formatIsoMonthForDisplay,
  getCalendarLeadingEmptyDays,
  getCalendarWeekdayLabels
} from "../lib/date";

type Projection = "month" | "year";

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function monthIso(year: number, month: number): string {
  return `${year}-${pad2(month + 1)}`;
}

function parseMonthIso(iso: string): { year: number; month: number } {
  const [yearStr, monthStr] = iso.split("-");
  return { month: Number(monthStr) - 1, year: Number(yearStr) };
}

function addMonths(iso: string, delta: number): string {
  const { year, month } = parseMonthIso(iso);
  const next = new Date(Date.UTC(year, month + delta, 1));
  return monthIso(next.getUTCFullYear(), next.getUTCMonth());
}

function addYears(iso: string, delta: number): string {
  const { year, month } = parseMonthIso(iso);
  return monthIso(year + delta, month);
}

function daysInMonth(iso: string): number {
  const { year, month } = parseMonthIso(iso);
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function collectOvulationDays(summary: CycleSummary): string[] {
  const ovulationDay = resolveOvulationDay(summary.averageCycleLengthDays);
  if (ovulationDay === null) return [];
  const offset = ovulationDay - 1;
  const starts: string[] = [];
  if (summary.latestPeriodStart) starts.push(summary.latestPeriodStart);
  for (const entry of summary.forecast) starts.push(entry.periodStart);
  return starts.map((start) => addDaysToIsoDate(start, offset));
}

function collectPredictedPeriodDays(summary: CycleSummary): string[] {
  const dates: string[] = [];
  for (const entry of summary.forecast) {
    const span = Math.abs(differenceInDays(entry.periodStart, entry.periodEnd)) + 1;
    for (let i = 0; i < span; i += 1) {
      dates.push(addDaysToIsoDate(entry.periodStart, i));
    }
  }
  return dates;
}

type DayState = {
  iso: string;
  day: number;
  isToday: boolean;
  isLogged: boolean;
  isPredicted: boolean;
  isOvulation: boolean;
  isFuture: boolean;
  isInMonth: boolean;
};

function buildMonthGrid(
  viewMonth: string,
  today: string,
  loggedSet: Set<string>,
  predictedSet: Set<string>,
  ovulationSet: Set<string>
): DayState[] {
  const leading = getCalendarLeadingEmptyDays(viewMonth);
  const days = daysInMonth(viewMonth);
  const firstDayIso = `${viewMonth}-01`;
  const gridStart = addDaysToIsoDate(firstDayIso, -leading);
  const totalCells = Math.ceil((leading + days) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const iso = addDaysToIsoDate(gridStart, index);
    const monthPart = iso.slice(0, 7);
    const dayPart = Number(iso.slice(8, 10));
    return {
      day: dayPart,
      iso,
      isFuture: differenceInDays(today, iso) > 0,
      isInMonth: monthPart === viewMonth,
      isLogged: loggedSet.has(iso),
      isOvulation: ovulationSet.has(iso),
      isPredicted: predictedSet.has(iso) && !loggedSet.has(iso),
      isToday: iso === today
    };
  });
}

export function CalendarRoute() {
  const { api, refresh, status, summary } = useAppData();
  const { language, messages } = useI18n();
  const navigate = useNavigate();

  const browserToday = getIsoDateInTimeZone(
    new Date(),
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const today = summary?.today ?? browserToday;
  const initialMonth = today.slice(0, 7);

  const [projection, setProjection] = useState<Projection>("month");
  const [viewMonth, setViewMonth] = useState<string>(initialMonth);
  const [monthData, setMonthData] = useState<Record<string, CalendarResponse>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkToggled, setBulkToggled] = useState<Set<string>>(() => new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const weekdayLabels = useMemo(() => getCalendarWeekdayLabels(language), [language]);
  const ovulationSet = useMemo(
    () => new Set(summary ? collectOvulationDays(summary) : []),
    [summary]
  );
  const predictedSet = useMemo(
    () => new Set(summary ? collectPredictedPeriodDays(summary) : []),
    [summary]
  );

  const monthsNeeded = useMemo(() => {
    if (projection === "month") return [viewMonth];
    const year = Number(viewMonth.slice(0, 4));
    return Array.from({ length: 12 }, (_, index) => monthIso(year, index));
  }, [projection, viewMonth]);

  const fetchMonth = useCallback(
    async (month: string) => {
      if (!api || status !== "ready") return;
      try {
        const response = await api.getCalendar(month);
        setMonthData((current) => ({ ...current, [month]: response }));
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : messages.calendar.loadError);
      }
    },
    [api, messages.calendar.loadError, status]
  );

  useEffect(() => {
    setLoadError(null);
    for (const month of monthsNeeded) {
      if (!monthData[month]) {
        void fetchMonth(month);
      }
    }
  }, [fetchMonth, monthData, monthsNeeded]);

  const loggedSetByMonth = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const [month, response] of Object.entries(monthData)) {
      const logged = new Set<string>();
      for (const day of response.days) {
        if (day.isLoggedPeriodDay) logged.add(day.date);
      }
      map.set(month, logged);
    }
    return map;
  }, [monthData]);

  function effectiveLoggedSet(month: string): Set<string> {
    const base = loggedSetByMonth.get(month) ?? new Set<string>();
    if (!bulkMode || bulkToggled.size === 0) return base;
    const merged = new Set(base);
    for (const iso of bulkToggled) {
      if (iso.startsWith(`${month}-`)) {
        if (merged.has(iso)) merged.delete(iso);
        else merged.add(iso);
      }
    }
    return merged;
  }

  function exitBulkMode() {
    setBulkMode(false);
    setBulkToggled(new Set());
    setBulkError(null);
    setBulkSuccess(false);
  }

  function handleDayClick(iso: string, isFuture: boolean) {
    if (!bulkMode) {
      navigate("/");
      return;
    }
    if (isFuture) return;
    setBulkSuccess(false);
    setBulkError(null);
    setBulkToggled((current) => {
      const next = new Set(current);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  }

  async function saveBulkChanges() {
    if (!api || bulkToggled.size === 0) {
      exitBulkMode();
      return;
    }

    setBulkSaving(true);
    setBulkError(null);
    setBulkSuccess(false);

    const changes = Array.from(bulkToggled).map((iso) => {
      const month = iso.slice(0, 7);
      const wasLogged = loggedSetByMonth.get(month)?.has(iso) ?? false;
      return { iso, wasLogged };
    });

    let failures = 0;

    for (const change of changes) {
      try {
        if (change.wasLogged) {
          await api.deletePeriodDay(change.iso);
        } else {
          await api.logPeriod({ date: change.iso });
        }
      } catch {
        failures += 1;
      }
    }

    const affectedMonths = new Set(changes.map((change) => change.iso.slice(0, 7)));
    await Promise.all(Array.from(affectedMonths).map((month) => fetchMonth(month)));

    try {
      await refresh();
    } catch {
      // Forecast refresh failure should not mask the successful toggle.
    }

    setBulkSaving(false);

    if (failures > 0) {
      setBulkError(messages.calendar.bulkEditSaveError);
      setBulkToggled(new Set());
      setBulkMode(false);
      return;
    }

    setBulkSuccess(true);
    setBulkToggled(new Set());
    setBulkMode(false);
  }

  const isLoadingMonth = projection === "month" && !monthData[viewMonth];

  return (
    <Panel
      aside={
        <button className="secondary-button" onClick={() => navigate("/")} type="button">
          {messages.calendar.backToToday}
        </button>
      }
      description={messages.calendar.description}
      title={messages.calendar.title}
    >
      <div className="calendar-controls">
        <div className="segmented" role="tablist">
          <button
            aria-selected={projection === "month"}
            className={projection === "month" ? "segmented-item active" : "segmented-item"}
            onClick={() => setProjection("month")}
            role="tab"
            type="button"
          >
            {messages.calendar.projectionMonth}
          </button>
          <button
            aria-selected={projection === "year"}
            className={projection === "year" ? "segmented-item active" : "segmented-item"}
            onClick={() => setProjection("year")}
            role="tab"
            type="button"
          >
            {messages.calendar.projectionYear}
          </button>
        </div>

        <div className="calendar-nav">
          <button
            aria-label={
              projection === "month"
                ? messages.calendar.previousMonth
                : messages.calendar.previousYear
            }
            className="secondary-button"
            onClick={() => {
              setViewMonth((current) =>
                projection === "month" ? addMonths(current, -1) : addYears(current, -1)
              );
            }}
            type="button"
          >
            ‹
          </button>
          <strong className="calendar-range">
            {projection === "month"
              ? formatIsoMonthForDisplay(viewMonth, language)
              : viewMonth.slice(0, 4)}
          </strong>
          <button
            aria-label={
              projection === "month" ? messages.calendar.nextMonth : messages.calendar.nextYear
            }
            className="secondary-button"
            onClick={() => {
              setViewMonth((current) =>
                projection === "month" ? addMonths(current, 1) : addYears(current, 1)
              );
            }}
            type="button"
          >
            ›
          </button>
        </div>

        {projection === "month" ? (
          <div className="calendar-bulk">
            {bulkMode ? (
              <>
                <button
                  className="primary-button"
                  disabled={bulkSaving}
                  onClick={() => {
                    void saveBulkChanges();
                  }}
                  type="button"
                >
                  {bulkSaving
                    ? messages.calendar.bulkEditSavePending
                    : messages.calendar.bulkEditSave}
                </button>
                <button
                  className="secondary-button"
                  disabled={bulkSaving}
                  onClick={exitBulkMode}
                  type="button"
                >
                  {messages.calendar.bulkEditCancel}
                </button>
              </>
            ) : (
              <button className="secondary-button" onClick={() => setBulkMode(true)} type="button">
                {messages.calendar.bulkEditEnter}
              </button>
            )}
          </div>
        ) : null}
      </div>

      {bulkMode ? <p className="muted">{messages.calendar.bulkEditHint}</p> : null}
      {bulkError ? <p className="inline-error">{bulkError}</p> : null}
      {bulkSuccess ? (
        <p className="inline-success">{messages.calendar.bulkEditSaveSuccess}</p>
      ) : null}
      {loadError ? <p className="inline-error">{loadError}</p> : null}

      <ul className="calendar-legend">
        <li>
          <span className="legend-dot period" /> {messages.calendar.legendLogged}
        </li>
        <li>
          <span className="legend-dot predicted" /> {messages.calendar.legendPredicted}
        </li>
        <li>
          <span className="legend-dot ovulation" /> {messages.calendar.legendOvulation}
        </li>
        <li>
          <span className="legend-dot today" /> {messages.calendar.legendToday}
        </li>
      </ul>

      {projection === "month" ? (
        <MonthGrid
          bulkMode={bulkMode}
          bulkToggled={bulkToggled}
          isLoading={isLoadingMonth}
          loadingLabel={messages.app.loading}
          loggedSet={effectiveLoggedSet(viewMonth)}
          onDayClick={handleDayClick}
          ovulationSet={ovulationSet}
          predictedSet={predictedSet}
          today={today}
          viewMonth={viewMonth}
          weekdayLabels={weekdayLabels}
        />
      ) : (
        <YearGrid
          language={language}
          loggedSetByMonth={loggedSetByMonth}
          months={monthsNeeded}
          onSelectMonth={(month) => {
            setViewMonth(month);
            setProjection("month");
          }}
          ovulationSet={ovulationSet}
          predictedSet={predictedSet}
          today={today}
        />
      )}
    </Panel>
  );
}

type MonthGridProps = {
  viewMonth: string;
  today: string;
  weekdayLabels: readonly string[];
  loggedSet: Set<string>;
  predictedSet: Set<string>;
  ovulationSet: Set<string>;
  bulkMode: boolean;
  bulkToggled: Set<string>;
  isLoading: boolean;
  loadingLabel: string;
  onDayClick: (iso: string, isFuture: boolean) => void;
};

function MonthGrid({
  viewMonth,
  today,
  weekdayLabels,
  loggedSet,
  predictedSet,
  ovulationSet,
  bulkMode,
  bulkToggled,
  isLoading,
  loadingLabel,
  onDayClick
}: MonthGridProps) {
  const days = buildMonthGrid(viewMonth, today, loggedSet, predictedSet, ovulationSet);

  return (
    <>
      <div className="calendar-grid-head" aria-hidden="true">
        {weekdayLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="calendar-grid" role="grid">
        {days.map((day) => {
          const classes = [
            "calendar-cell",
            day.isInMonth ? "" : "out-of-month",
            day.isToday ? "today" : "",
            day.isLogged ? "period" : "",
            day.isPredicted ? "predicted" : "",
            day.isOvulation ? "ovulation" : "",
            day.isFuture ? "future" : "",
            bulkMode && bulkToggled.has(day.iso) ? "bulk-toggled" : ""
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={day.iso}
              aria-label={day.iso}
              className={classes}
              disabled={bulkMode && day.isFuture}
              onClick={() => onDayClick(day.iso, day.isFuture)}
              type="button"
            >
              <span>{day.day}</span>
            </button>
          );
        })}
      </div>
      {isLoading ? <p className="muted">{loadingLabel}</p> : null}
    </>
  );
}

type YearGridProps = {
  months: readonly string[];
  today: string;
  language: string;
  loggedSetByMonth: Map<string, Set<string>>;
  predictedSet: Set<string>;
  ovulationSet: Set<string>;
  onSelectMonth: (month: string) => void;
};

function YearGrid({
  months,
  today,
  language,
  loggedSetByMonth,
  predictedSet,
  ovulationSet,
  onSelectMonth
}: YearGridProps) {
  return (
    <div className="year-grid">
      {months.map((month) => {
        const logged = loggedSetByMonth.get(month) ?? new Set<string>();
        const days = buildMonthGrid(month, today, logged, predictedSet, ovulationSet);

        return (
          <button
            key={month}
            className="mini-month"
            onClick={() => onSelectMonth(month)}
            type="button"
          >
            <span className="mini-month-title">{formatIsoMonthForDisplay(month, language)}</span>
            <span className="mini-month-grid" aria-hidden="true">
              {days.map((day) => {
                const classes = [
                  "mini-day",
                  day.isInMonth ? "" : "out-of-month",
                  day.isToday ? "today" : "",
                  day.isLogged ? "period" : "",
                  day.isPredicted ? "predicted" : "",
                  day.isOvulation ? "ovulation" : ""
                ]
                  .filter(Boolean)
                  .join(" ");
                return <span key={day.iso} className={classes} />;
              })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
