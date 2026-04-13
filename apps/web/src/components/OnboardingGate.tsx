import {
  addDaysToIsoDate,
  buildCalendarMonthDays,
  buildPeriodForecast,
  cycleLengthRange,
  getIsoDateInTimeZone
} from "@femi/shared";
import { periodLengthRange } from "@femi/shared";
import { useMemo, useState } from "react";

import { useAppData } from "../data/AppDataProvider";
import { useI18n } from "../i18n/I18nProvider";
import {
  formatIsoMonthForDisplay,
  getCalendarLeadingEmptyDays,
  getCalendarWeekdayLabels
} from "../lib/date";
import { isNumberInRange, parseIntegerInput } from "../lib/numberInput";

function formatMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));

  return formatMonth(date);
}

function addMonths(month: string, delta: number): string {
  return shiftMonth(month, delta);
}

function buildLoggedPeriodDates(
  latestPeriodStart: string,
  periodLengthDays: number,
  today: string
) {
  const periodEnd = addDaysToIsoDate(latestPeriodStart, periodLengthDays - 1);
  const loggedEnd = periodEnd < today ? periodEnd : today;

  if (latestPeriodStart > loggedEnd) {
    return [latestPeriodStart];
  }

  const dates: string[] = [];
  let cursor = latestPeriodStart;

  while (cursor <= loggedEnd) {
    dates.push(cursor);
    cursor = addDaysToIsoDate(cursor, 1);
  }

  return dates;
}

export function OnboardingGate() {
  const { completeOnboarding, me } = useAppData();
  const { language, messages } = useI18n();
  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [cycleLengthInput, setCycleLengthInput] = useState(
    String(me?.settings.cycleLengthDays ?? 28)
  );
  const [latestPeriodStart, setLatestPeriodStart] = useState(
    getIsoDateInTimeZone(new Date(), browserTimeZone)
  );
  const [previewMonth, setPreviewMonth] = useState(
    getIsoDateInTimeZone(new Date(), browserTimeZone).slice(0, 7)
  );
  const [periodLengthInput, setPeriodLengthInput] = useState(
    String(me?.settings.periodLengthDays ?? 5)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = getIsoDateInTimeZone(new Date(), browserTimeZone);
  const minDate = "2020-01-01";
  const minMonth = "2020-01";
  const maxMonth = addMonths(today.slice(0, 7), 24);
  const parsedCycleLengthDays = parseIntegerInput(cycleLengthInput);
  const parsedPeriodLengthDays = parseIntegerInput(periodLengthInput);
  const hasValidCycleLength = isNumberInRange(parsedCycleLengthDays, cycleLengthRange);
  const hasValidPeriodLength = isNumberInRange(parsedPeriodLengthDays, periodLengthRange);
  const previewCycleLengthDays = hasValidCycleLength
    ? parsedCycleLengthDays
    : (me?.settings.cycleLengthDays ?? 28);
  const previewPeriodLengthDays = hasValidPeriodLength
    ? parsedPeriodLengthDays
    : (me?.settings.periodLengthDays ?? 5);
  const canSubmit =
    hasValidCycleLength &&
    hasValidPeriodLength &&
    latestPeriodStart >= minDate &&
    latestPeriodStart <= today;

  const previewForecast = useMemo(
    () =>
      buildPeriodForecast({
        averageCycleLengthDays: previewCycleLengthDays,
        averagePeriodLengthDays: previewPeriodLengthDays,
        fromDate: latestPeriodStart,
        latestCycleStart: latestPeriodStart
      }),
    [latestPeriodStart, previewCycleLengthDays, previewPeriodLengthDays]
  );
  const previewCalendar = useMemo(
    () =>
      buildCalendarMonthDays({
        currentCycleStart: latestPeriodStart,
        currentPeriodEnd: addDaysToIsoDate(latestPeriodStart, previewPeriodLengthDays - 1),
        month: previewMonth || today.slice(0, 7),
        periodDays: buildLoggedPeriodDates(latestPeriodStart, previewPeriodLengthDays, today).map(
          (date) => ({
            date
          })
        ),
        predictedNextPeriodStart: previewForecast[0]?.periodStart ?? null,
        predictedPeriodLengthDays: previewPeriodLengthDays,
        predictedPeriods: previewForecast,
        today
      }),
    [latestPeriodStart, previewForecast, previewMonth, previewPeriodLengthDays, today]
  );
  const weekdayLabels = useMemo(() => getCalendarWeekdayLabels(language), [language]);
  const leadingEmptyDays = useMemo(() => getCalendarLeadingEmptyDays(previewMonth), [previewMonth]);

  return (
    <section className="panel onboarding-panel">
      <header className="panel-header">
        <div>
          <h2>{messages.onboarding.title}</h2>
          <p>{messages.onboarding.description}</p>
        </div>
      </header>

      <form
        className="stack-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) {
            return;
          }

          setIsSaving(true);
          setError(null);

          void completeOnboarding({
            cycleLengthDays: parsedCycleLengthDays,
            latestPeriodStart,
            periodLengthDays: parsedPeriodLengthDays,
            timezone: browserTimeZone
          })
            .catch((nextError) => {
              setError(
                nextError instanceof Error ? nextError.message : messages.onboarding.saveError
              );
            })
            .finally(() => {
              setIsSaving(false);
            });
        }}
      >
        <label className="field">
          <span>{messages.onboarding.cycleLengthLabel}</span>
          <input
            max={45}
            min={20}
            onChange={(event) => {
              setCycleLengthInput(event.target.value);
            }}
            required
            type="number"
            value={cycleLengthInput}
          />
          <small>{messages.onboarding.cycleLengthHint}</small>
        </label>

        <label className="field">
          <span>{messages.onboarding.periodLengthLabel}</span>
          <input
            max={10}
            min={2}
            onChange={(event) => {
              setPeriodLengthInput(event.target.value);
            }}
            required
            type="number"
            value={periodLengthInput}
          />
          <small>{messages.onboarding.periodLengthHint}</small>
        </label>

        <label className="field">
          <span>{messages.onboarding.latestPeriodStartLabel}</span>
          <input
            max={today}
            min={minDate}
            onChange={(event) => {
              setLatestPeriodStart(event.target.value);
              setPreviewMonth(event.target.value.slice(0, 7));
            }}
            required
            type="date"
            value={latestPeriodStart}
          />
          <small>{messages.onboarding.latestPeriodStartHint}</small>
        </label>

        <section className="onboarding-preview">
          <header className="panel-header">
            <div>
              <h3>{messages.calendar.title}</h3>
              <p>{messages.onboarding.latestPeriodStartHint}</p>
            </div>
          </header>

          <div className="calendar-toolbar">
            <button
              className="secondary-button"
              disabled={!previewMonth || previewMonth <= minMonth}
              onClick={() => {
                setPreviewMonth((current) => shiftMonth(current, -1));
              }}
              type="button"
            >
              {messages.calendar.previousMonth}
            </button>
            <strong>{formatIsoMonthForDisplay(previewMonth, language)}</strong>
            <button
              className="secondary-button"
              disabled={!previewMonth || previewMonth >= maxMonth}
              onClick={() => {
                setPreviewMonth((current) => shiftMonth(current, 1));
              }}
              type="button"
            >
              {messages.calendar.nextMonth}
            </button>
          </div>

          <div className="calendar-legend">
            <span className="legend-item">
              <i className="legend-dot logged" />
              {messages.calendar.legendLogged}
            </span>
            <span className="legend-item">
              <i className="legend-dot predicted" />
              {messages.calendar.legendPredicted}
            </span>
          </div>

          <div className="calendar-weekdays" aria-hidden="true">
            {weekdayLabels.map((label) => (
              <span key={label} className="calendar-weekday">
                {label}
              </span>
            ))}
          </div>

          <div className="calendar-grid onboarding-calendar-grid">
            {Array.from({ length: leadingEmptyDays }, (_, index) => (
              <span
                key={`empty-${previewMonth}-${index}`}
                aria-hidden="true"
                className="calendar-day-placeholder"
              />
            ))}
            {previewCalendar.map((day) => (
              <div
                key={day.date}
                className={[
                  "calendar-day",
                  day.isLoggedPeriodDay ? "logged" : "",
                  day.isPredictedPeriodDay ? "predicted" : "",
                  day.isToday ? "today" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="calendar-day-number">{Number(day.date.slice(8, 10))}</span>
                {day.isLoggedPeriodDay ? (
                  <span className="calendar-day-flow">{messages.calendar.loggedBadge}</span>
                ) : day.isPredictedPeriodDay ? (
                  <span className="calendar-day-flow">{messages.calendar.predictedBadge}</span>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {error ? <p className="inline-error">{error}</p> : null}

        <button className="primary-button" disabled={isSaving || !canSubmit} type="submit">
          {isSaving ? messages.onboarding.submitPending : messages.onboarding.submitIdle}
        </button>
      </form>
    </section>
  );
}
