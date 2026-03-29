import {
  flowIntensityValues,
  formatIsoDate,
  type CalendarResponse,
  type FlowIntensity
} from "@femi/shared";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Panel } from "../components/Panel";
import { useAppData } from "../data/AppDataProvider";
import { useI18n } from "../i18n/I18nProvider";
import { formatIsoDateForDisplay, formatIsoMonthForDisplay } from "../lib/date";

function formatMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));

  return formatMonth(date);
}

export function CalendarRoute() {
  const { api, refresh, status, summary } = useAppData();
  const { language, messages } = useI18n();
  const [month, setMonth] = useState(summary ? summary.today.slice(0, 7) : formatMonth(new Date()));
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    summary ? summary.today : formatIsoDate(new Date())
  );
  const [flowIntensity, setFlowIntensity] = useState<FlowIntensity | "">("");

  const loadCalendar = useCallback(
    async (nextMonth: string) => {
      if (!api || status !== "ready") {
        setCalendar(null);
        setCalendarError(null);
        return;
      }

      try {
        const response = await api.getCalendar(nextMonth);

        setCalendar(response);
        setCalendarError(null);
      } catch (error) {
        setCalendar(null);
        setCalendarError(error instanceof Error ? error.message : messages.calendar.loadError);
      }
    },
    [api, messages.calendar.loadError, status]
  );

  useEffect(() => {
    if (summary) {
      setMonth(summary.today.slice(0, 7));
      setSelectedDate(summary.today);
    }
  }, [summary]);

  useEffect(() => {
    const nextSelectedDate =
      summary && summary.today.startsWith(`${month}-`) ? summary.today : `${month}-01`;

    setSelectedDate(nextSelectedDate);
  }, [month, summary]);

  useEffect(() => {
    void loadCalendar(month);
  }, [loadCalendar, month]);

  const selectedDay = useMemo(
    () => calendar?.days.find((day) => day.date === selectedDate) ?? null,
    [calendar, selectedDate]
  );

  useEffect(() => {
    setFlowIntensity(selectedDay?.flowIntensity ?? "");
  }, [selectedDay]);

  async function syncAfterPeriodUpdate(successMessage: string) {
    await Promise.all([refresh(), loadCalendar(month)]);
    setActionSuccess(successMessage);
  }

  async function handlePeriodLog() {
    if (!api || !selectedDate || !flowIntensity) {
      return;
    }

    setIsSaving(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.logPeriod({
        date: selectedDate,
        flowIntensity
      });
      await syncAfterPeriodUpdate(messages.calendar.saveSuccess);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : messages.calendar.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  const monthLabel = formatIsoMonthForDisplay(month, language);

  return (
    <Panel description={messages.calendar.description} title={messages.calendar.title}>
      <div className="calendar-toolbar">
        <button
          className="secondary-button"
          onClick={() => {
            setMonth((current) => shiftMonth(current, -1));
          }}
          type="button"
        >
          {messages.calendar.previousMonth}
        </button>
        <strong>{monthLabel}</strong>
        <button
          className="secondary-button"
          onClick={() => {
            setMonth((current) => shiftMonth(current, 1));
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
        <span className="legend-item">
          <i className="legend-dot today" />
          {messages.calendar.legendToday}
        </span>
      </div>

      {calendar ? (
        <div className="calendar-grid">
          {calendar.days.map((day) => (
            <button
              key={day.date}
              className={[
                "calendar-day",
                day.isToday ? "today" : "",
                day.isLoggedPeriodDay ? "logged" : "",
                day.isPredictedPeriodDay ? "predicted" : "",
                day.date === selectedDate ? "selected" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                setSelectedDate(day.date);
                setActionError(null);
                setActionSuccess(null);
              }}
              type="button"
            >
              <span className="calendar-day-number">{Number(day.date.slice(8, 10))}</span>
              {day.flowIntensity ? (
                <span className="calendar-day-flow">
                  {messages.labels.flowIntensity[day.flowIntensity]}
                </span>
              ) : null}
              {day.symptomKeys.length > 0 ? (
                <span className="calendar-day-symptoms">
                  {day.symptomKeys.length} {messages.calendar.tagsSuffix}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : (
        <p className="muted">{calendarError ?? messages.calendar.empty}</p>
      )}

      <div className="calendar-actions">
        <div className="field">
          <span>{messages.calendar.selectedDateLabel}</span>
          <strong>
            {selectedDate
              ? formatIsoDateForDisplay(selectedDate, language)
              : messages.calendar.selectedDateFallback}
          </strong>
        </div>

        <label className="field">
          <span>{messages.calendar.flowIntensityLabel}</span>
          <select
            onChange={(event) => {
              setFlowIntensity(event.target.value as FlowIntensity | "");
            }}
            value={flowIntensity}
          >
            <option value="">{messages.calendar.flowIntensityPlaceholder}</option>
            {flowIntensityValues.map((value) => (
              <option key={value} value={value}>
                {messages.labels.flowIntensity[value]}
              </option>
            ))}
          </select>
        </label>

        <div className="action-row">
          <button
            className="secondary-button"
            disabled={!api || !selectedDate || isSaving}
            onClick={() => {
              if (!api || !selectedDate) {
                return;
              }

              setIsSaving(true);
              setActionError(null);
              setActionSuccess(null);

              void api
                .startPeriod({
                  date: selectedDate,
                  flowIntensity: flowIntensity || undefined
                })
                .then(() => syncAfterPeriodUpdate(messages.calendar.startSuccess))
                .catch((error) => {
                  setActionError(
                    error instanceof Error ? error.message : messages.calendar.saveError
                  );
                })
                .finally(() => {
                  setIsSaving(false);
                });
            }}
            type="button"
          >
            {messages.calendar.startPeriod}
          </button>

          <button
            className="secondary-button"
            disabled={!api || !selectedDate || isSaving}
            onClick={() => {
              if (!api || !selectedDate) {
                return;
              }

              setIsSaving(true);
              setActionError(null);
              setActionSuccess(null);

              void api
                .endPeriod(selectedDate)
                .then(() => syncAfterPeriodUpdate(messages.calendar.endSuccess))
                .catch((error) => {
                  setActionError(
                    error instanceof Error ? error.message : messages.calendar.saveError
                  );
                })
                .finally(() => {
                  setIsSaving(false);
                });
            }}
            type="button"
          >
            {messages.calendar.endPeriod}
          </button>

          <button
            className="primary-button"
            disabled={!api || !selectedDate || !flowIntensity || isSaving}
            onClick={() => {
              void handlePeriodLog();
            }}
            type="button"
          >
            {isSaving ? messages.calendar.savePending : messages.calendar.savePeriodDay}
          </button>
        </div>

        {actionError ? <p className="inline-error">{actionError}</p> : null}
        {actionSuccess ? <p className="inline-success">{actionSuccess}</p> : null}
      </div>
    </Panel>
  );
}
