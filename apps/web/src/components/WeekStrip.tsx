import { addDaysToIsoDate } from "@femi/shared";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";

export type WeekStripCopy = {
  stripLabel: string;
  previousWeek: string;
  nextWeek: string;
  openCalendar: string;
  backToToday: string;
  periodMarker: string;
  predictedMarker: string;
  ovulationMarker: string;
  todayMarker: string;
};

type WeekStripProps = {
  selectedDate: string;
  today: string;
  periodDays: readonly string[];
  predictedPeriodDays: readonly string[];
  ovulationDays: readonly string[];
  onSelect: (date: string) => void;
  onOpenCalendar?: () => void;
  weekdayLabels: readonly string[];
  formatDayLabel: (isoDate: string) => string;
  formatRangeLabel: (startIso: string, endIso: string) => string;
  copy: WeekStripCopy;
};

const SWIPE_THRESHOLD_PX = 40;

function mondayOf(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const weekdayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const delta = weekdayIndex === 0 ? -6 : 1 - weekdayIndex;

  return addDaysToIsoDate(isoDate, delta);
}

export function WeekStrip({
  selectedDate,
  today,
  periodDays,
  predictedPeriodDays,
  ovulationDays,
  onSelect,
  onOpenCalendar,
  weekdayLabels,
  formatDayLabel,
  formatRangeLabel,
  copy
}: WeekStripProps) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(selectedDate));

  useEffect(() => {
    setWeekStart(mondayOf(selectedDate));
  }, [selectedDate]);

  const { days, isTodayWeekVisible, rangeLabel } = useMemo(() => {
    const periodSet = new Set(periodDays);
    const predictedSet = new Set(predictedPeriodDays);
    const ovulationSet = new Set(ovulationDays);
    const weekEnd = addDaysToIsoDate(weekStart, 6);

    return {
      days: Array.from({ length: 7 }, (_, index) => {
        const iso = addDaysToIsoDate(weekStart, index);

        return {
          dayNumber: Number(iso.slice(8, 10)),
          iso,
          isOvulation: ovulationSet.has(iso),
          isPeriod: periodSet.has(iso),
          isPredicted: !periodSet.has(iso) && predictedSet.has(iso),
          isSelected: iso === selectedDate,
          isToday: iso === today,
          weekdayLabel: weekdayLabels[index] ?? ""
        };
      }),
      isTodayWeekVisible: today >= weekStart && today <= weekEnd,
      rangeLabel: formatRangeLabel(weekStart, addDaysToIsoDate(weekStart, 6))
    };
  }, [
    formatRangeLabel,
    ovulationDays,
    periodDays,
    predictedPeriodDays,
    selectedDate,
    today,
    weekStart,
    weekdayLabels
  ]);

  const touchStartX = useRef<number | null>(null);

  function shiftWeek(delta: number) {
    setWeekStart((current) => addDaysToIsoDate(current, delta * 7));
  }

  function jumpToToday() {
    setWeekStart(mondayOf(today));
    onSelect(today);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startX = touchStartX.current;

    touchStartX.current = null;

    if (startX === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? startX;
    const delta = endX - startX;

    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) {
      return;
    }

    shiftWeek(delta > 0 ? -1 : 1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onSelect(addDaysToIsoDate(selectedDate, -1));
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      onSelect(addDaysToIsoDate(selectedDate, 1));
    }
  }

  return (
    <section aria-label={copy.stripLabel} className="week-strip">
      <header className="week-strip-header">
        <button
          aria-label={copy.previousWeek}
          className="week-strip-nav"
          onClick={() => shiftWeek(-1)}
          type="button"
        >
          ‹
        </button>
        <span className="week-strip-range">{rangeLabel}</span>
        <button
          aria-label={copy.nextWeek}
          className="week-strip-nav"
          onClick={() => shiftWeek(1)}
          type="button"
        >
          ›
        </button>
        {onOpenCalendar ? (
          <button
            aria-label={copy.openCalendar}
            className="week-strip-open-calendar"
            onClick={onOpenCalendar}
            type="button"
          >
            <svg
              aria-hidden="true"
              fill="none"
              focusable="false"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              viewBox="0 0 16 16"
              width="16"
            >
              <rect height="10" rx="2" width="12" x="2" y="3" />
              <path d="M5 2v3" />
              <path d="M11 2v3" />
              <path d="M2 6.5h12" />
              <path d="M5 9h2" />
              <path d="M9 9h2" />
            </svg>
          </button>
        ) : null}
      </header>
      <div
        className="week-strip-days"
        onKeyDown={handleKeyDown}
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
      >
        {days.map((day) => {
          const markerLabels = [
            day.isToday ? copy.todayMarker : "",
            day.isPeriod ? copy.periodMarker : "",
            day.isPredicted ? copy.predictedMarker : "",
            day.isOvulation ? copy.ovulationMarker : ""
          ]
            .filter(Boolean)
            .join(", ");
          const classes = [
            "week-strip-day",
            day.isToday ? "today" : "",
            day.isSelected ? "selected" : "",
            day.isPeriod ? "period" : "",
            day.isPredicted ? "predicted" : "",
            day.isOvulation ? "ovulation" : ""
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={day.iso}
              aria-current={day.isToday ? "date" : undefined}
              aria-label={
                markerLabels.length > 0
                  ? `${formatDayLabel(day.iso)} — ${markerLabels}`
                  : formatDayLabel(day.iso)
              }
              aria-pressed={day.isSelected}
              className={classes}
              onClick={() => onSelect(day.iso)}
              type="button"
            >
              <span className="week-strip-weekday" aria-hidden="true">
                {day.weekdayLabel}
              </span>
              <span className="week-strip-number" aria-hidden="true">
                {day.dayNumber}
              </span>
              <span aria-hidden="true" className="week-strip-markers">
                {day.isPeriod ? <span className="week-strip-marker period" /> : null}
                {day.isPredicted ? <span className="week-strip-marker predicted" /> : null}
                {day.isOvulation ? <span className="week-strip-marker ovulation" /> : null}
              </span>
            </button>
          );
        })}
      </div>
      {!isTodayWeekVisible ? (
        <div className="week-strip-actions">
          <button className="week-strip-back-today" onClick={jumpToToday} type="button">
            {copy.backToToday}
          </button>
        </div>
      ) : null}
    </section>
  );
}
