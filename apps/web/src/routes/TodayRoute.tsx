import {
  differenceInDays,
  flowIntensityValues,
  type CalendarResponse,
  type DailyCheckinEntry,
  type CyclePhase,
  type DailyCheckinRequest,
  type FlowIntensity,
  getIsoDateInTimeZone,
  type SymptomKey,
  symptomKeys
} from "@femi/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Panel } from "../components/Panel";
import { useAppData } from "../data/AppDataProvider";
import { useI18n } from "../i18n/I18nProvider";
import {
  formatIsoDateForDisplay,
  formatIsoMonthForDisplay,
  getCalendarLeadingEmptyDays,
  getCalendarWeekdayLabels
} from "../lib/date";

type CheckinFormState = {
  discharge: NonNullable<DailyCheckinEntry["discharge"]> | "";
  energy: NonNullable<DailyCheckinEntry["energy"]> | "";
  mood: NonNullable<DailyCheckinEntry["mood"]> | "";
  note: string;
  painLevel: NonNullable<DailyCheckinEntry["painLevel"]> | "";
  sleepQuality: NonNullable<DailyCheckinEntry["sleepQuality"]> | "";
  symptomKeys: DailyCheckinRequest["symptomKeys"];
};

type CalendarDay = CalendarResponse["days"][number];

const emptyCheckinState: CheckinFormState = {
  discharge: "",
  energy: "",
  mood: "",
  note: "",
  painLevel: "",
  sleepQuality: "",
  symptomKeys: []
};

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

function getPhaseTone(phase: CyclePhase | null): string {
  switch (phase) {
    case "menstrual":
      return "menstrual";
    case "follicular":
      return "follicular";
    case "ovulatory":
      return "ovulatory";
    case "luteal":
      return "luteal";
    default:
      return "neutral";
  }
}

function getPhaseForCycleDay(
  cycleDay: number,
  cycleLengthDays: number,
  periodLengthDays: number
): CyclePhase {
  const ovulationStartDay = Math.min(
    cycleLengthDays,
    Math.max(periodLengthDays + 1, cycleLengthDays - 16)
  );
  const ovulationEndDay = Math.min(
    cycleLengthDays,
    Math.max(ovulationStartDay, cycleLengthDays - 12)
  );

  if (cycleDay <= periodLengthDays) {
    return "menstrual";
  }

  if (cycleDay < ovulationStartDay) {
    return "follicular";
  }

  if (cycleDay <= ovulationEndDay) {
    return "ovulatory";
  }

  return "luteal";
}

function getSelectedCycleDay(
  latestPeriodStart: string | null,
  selectedDate: string,
  averageCycleLengthDays: number
): number | null {
  if (!latestPeriodStart) {
    return null;
  }

  const offset = differenceInDays(latestPeriodStart, selectedDate);
  const normalizedOffset =
    ((offset % averageCycleLengthDays) + averageCycleLengthDays) % averageCycleLengthDays;

  return normalizedOffset + 1;
}

function buildCheckinPayload(input: {
  formState: CheckinFormState;
  isMenstrualPhase: boolean;
  persistedEntry: DailyCheckinEntry | null;
}): DailyCheckinRequest {
  const { formState, isMenstrualPhase, persistedEntry } = input;

  const payload: DailyCheckinRequest = {
    symptomKeys: formState.symptomKeys
  };

  if (formState.mood !== "") {
    payload.mood = formState.mood;
  } else if (persistedEntry?.mood !== null && persistedEntry?.mood !== undefined) {
    payload.mood = null;
  }

  if (formState.energy !== "") {
    payload.energy = formState.energy;
  } else if (persistedEntry?.energy !== null && persistedEntry?.energy !== undefined) {
    payload.energy = null;
  }

  if (formState.painLevel !== "") {
    payload.painLevel = formState.painLevel;
  } else if (persistedEntry?.painLevel !== null && persistedEntry?.painLevel !== undefined) {
    payload.painLevel = null;
  }

  if (!isMenstrualPhase && formState.discharge !== "") {
    payload.discharge = formState.discharge;
  } else if (
    persistedEntry?.discharge !== null &&
    persistedEntry?.discharge !== undefined &&
    (isMenstrualPhase || formState.discharge === "")
  ) {
    payload.discharge = null;
  }

  if (formState.sleepQuality !== "") {
    payload.sleepQuality = formState.sleepQuality;
  } else if (persistedEntry?.sleepQuality !== null && persistedEntry?.sleepQuality !== undefined) {
    payload.sleepQuality = null;
  }

  if (formState.note.trim().length > 0) {
    payload.note = formState.note;
  } else if (persistedEntry?.note !== null && persistedEntry?.note !== undefined) {
    payload.note = null;
  }

  return payload;
}

function toFormState(entry: DailyCheckinEntry): CheckinFormState {
  return {
    discharge: entry.discharge ?? "",
    energy: entry.energy ?? "",
    mood: entry.mood ?? "",
    note: entry.note ?? "",
    painLevel: entry.painLevel ?? "",
    sleepQuality: entry.sleepQuality ?? "",
    symptomKeys: entry.symptomKeys
  };
}

function patchCalendarDay(
  calendar: CalendarResponse | null,
  date: string,
  update: (day: CalendarDay) => CalendarDay
): CalendarResponse | null {
  if (!calendar) {
    return calendar;
  }

  let changed = false;
  const nextDays = calendar.days.map((day) => {
    if (day.date !== date) {
      return day;
    }

    changed = true;
    return update(day);
  });

  return changed
    ? {
        ...calendar,
        days: nextDays
      }
    : calendar;
}

export function TodayRoute() {
  const { api, refresh, status, summary } = useAppData();
  const { language, messages } = useI18n();
  const [formState, setFormState] = useState<CheckinFormState>(emptyCheckinState);
  const [persistedEntry, setPersistedEntry] = useState<DailyCheckinEntry | null>(null);
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [checkinLoadError, setCheckinLoadError] = useState<string | null>(null);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [isLoadingCheckin, setIsLoadingCheckin] = useState(false);
  const [isSavingCheckin, setIsSavingCheckin] = useState(false);
  const [isSavingPeriod, setIsSavingPeriod] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [periodSuccess, setPeriodSuccess] = useState<string | null>(null);
  const [selectedFlowIntensity, setSelectedFlowIntensity] = useState<FlowIntensity | "">("");
  const copyRef = useRef({
    calendarLoadError: messages.calendar.loadError,
    checkinLoadError: messages.app.dataLoadError
  });
  const browserToday = getIsoDateInTimeZone(
    new Date(),
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [month, setMonth] = useState(
    summary ? summary.today.slice(0, 7) : browserToday.slice(0, 7)
  );
  const [monthSource, setMonthSource] = useState<"bootstrap" | "user">("bootstrap");
  const [selectedDate, setSelectedDate] = useState(summary ? summary.today : browserToday);
  const [selectedDateSource, setSelectedDateSource] = useState<"bootstrap" | "user">("bootstrap");

  copyRef.current = {
    calendarLoadError: messages.calendar.loadError,
    checkinLoadError: messages.app.dataLoadError
  };

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
        setCalendarError(
          error instanceof Error ? error.message : copyRef.current.calendarLoadError
        );
      }
    },
    [api, status]
  );

  useEffect(() => {
    if (!summary || selectedDateSource === "user") {
      return;
    }

    if (selectedDate !== summary.today) {
      setSelectedDate(summary.today);
    }

    if (monthSource === "bootstrap") {
      const summaryMonth = summary.today.slice(0, 7);

      if (month !== summaryMonth) {
        setMonth(summaryMonth);
      }
    }
  }, [month, monthSource, selectedDate, selectedDateSource, summary]);

  useEffect(() => {
    void loadCalendar(month);
  }, [loadCalendar, month]);

  useEffect(() => {
    let active = true;

    if (!api || !selectedDate || status !== "ready") {
      setFormState(emptyCheckinState);
      setPersistedEntry(null);
      setCheckinLoadError(null);
      setIsLoadingCheckin(false);
      return;
    }

    setCheckinLoadError(null);
    setIsLoadingCheckin(true);

    void api
      .getCheckin(selectedDate)
      .then((response) => {
        if (!active) {
          return;
        }

        if (!response.entry) {
          setFormState(emptyCheckinState);
          setPersistedEntry(null);
          setCheckinLoadError(null);
          setIsLoadingCheckin(false);
          return;
        }

        setPersistedEntry(response.entry);
        setFormState(toFormState(response.entry));
        setCheckinLoadError(null);
        setIsLoadingCheckin(false);
      })
      .catch((error) => {
        if (active) {
          setFormState(emptyCheckinState);
          setPersistedEntry(null);
          setCheckinLoadError(
            error instanceof Error ? error.message : copyRef.current.checkinLoadError
          );
          setIsLoadingCheckin(false);
        }
      });

    return () => {
      active = false;
    };
  }, [api, selectedDate, status]);

  const selectedDay = useMemo(
    () => calendar?.days.find((day) => day.date === selectedDate) ?? null,
    [calendar, selectedDate]
  );

  const selectedCycleDay = useMemo(
    () =>
      summary
        ? getSelectedCycleDay(
            summary.latestPeriodStart,
            selectedDate,
            summary.averageCycleLengthDays
          )
        : null,
    [selectedDate, summary]
  );

  const selectedPhase = useMemo(() => {
    if (!summary || selectedCycleDay === null) {
      return selectedDay?.isLoggedPeriodDay || selectedDay?.isPredictedPeriodDay
        ? "menstrual"
        : null;
    }

    if (selectedDay?.isLoggedPeriodDay || selectedDay?.isPredictedPeriodDay) {
      return "menstrual";
    }

    return getPhaseForCycleDay(
      selectedCycleDay,
      summary.averageCycleLengthDays,
      summary.averagePeriodLengthDays
    );
  }, [selectedCycleDay, selectedDay, summary]);

  const monthLabel = formatIsoMonthForDisplay(month, language);
  const weekdayLabels = useMemo(() => getCalendarWeekdayLabels(language), [language]);
  const leadingEmptyDays = useMemo(() => getCalendarLeadingEmptyDays(month), [month]);
  const minMonth = "2020-01";
  const maxMonth = addMonths((summary?.today ?? browserToday).slice(0, 7), 24);
  const isFutureSelected = summary ? differenceInDays(summary.today, selectedDate) > 0 : false;
  const isSelectedToday = summary ? selectedDate === summary.today : false;
  const isSelectedDayEditable = !isFutureSelected;
  const isCheckinEditable = isSelectedDayEditable && !isLoadingCheckin && checkinLoadError === null;
  const visibleCheckinError = checkinLoadError ?? checkinError;
  const isMenstrualPhase = selectedPhase === "menstrual";
  const selectedDateLabel = formatIsoDateForDisplay(selectedDate, language);
  const canGoToPreviousMonth = month > minMonth;
  const canGoToNextMonth = month < maxMonth;

  useEffect(() => {
    setSelectedFlowIntensity(selectedDay?.flowIntensity ?? "");
  }, [selectedDay]);

  useEffect(() => {
    setCheckinError(null);
    setCheckinLoadError(null);
    setPeriodError(null);
    setPeriodSuccess(null);
    setSaveSuccess(false);
  }, [selectedDate]);

  async function syncAfterPeriodUpdate(successMessage: string) {
    await loadCalendar(month);

    try {
      await refresh();
    } catch {
      // Keep the confirmed local mutation result even if the summary refresh fails.
    }

    setPeriodSuccess(successMessage);
  }

  async function syncAfterCheckinSave(): Promise<void> {
    await loadCalendar(month);

    try {
      await refresh();
    } catch {
      // Keep the confirmed local mutation result even if the summary refresh fails.
    }
  }

  function applyPeriodDayPatch(input: {
    date: string;
    flowIntensity: FlowIntensity | null;
    isLoggedPeriodDay: boolean;
  }): void {
    setCalendar((current) =>
      patchCalendarDay(current, input.date, (day) => ({
        ...day,
        flowIntensity: input.flowIntensity,
        isLoggedPeriodDay: input.isLoggedPeriodDay,
        isPredictedPeriodDay: input.isLoggedPeriodDay ? false : day.isPredictedPeriodDay
      }))
    );
  }

  function applyCheckinCalendarPatch(input: {
    date: string;
    symptomKeys: readonly SymptomKey[];
  }): void {
    setCalendar((current) =>
      patchCalendarDay(current, input.date, (day) => ({
        ...day,
        symptomKeys: [...input.symptomKeys]
      }))
    );
  }

  async function markPeriodDay() {
    if (!api || !selectedDate) {
      return;
    }

    setIsSavingPeriod(true);
    setPeriodError(null);
    setPeriodSuccess(null);

    try {
      const response = await api.logPeriod({
        date: selectedDate
      });
      await syncAfterPeriodUpdate(messages.today.markPeriodDaySuccess);
      applyPeriodDayPatch({
        date: selectedDate,
        flowIntensity: response.entry.flowIntensity,
        isLoggedPeriodDay: true
      });
    } catch (error) {
      setPeriodError(error instanceof Error ? error.message : messages.today.markPeriodDayError);
    } finally {
      setIsSavingPeriod(false);
    }
  }

  async function updatePeriodDayIntensity() {
    if (!api || !selectedDate) {
      return;
    }

    setIsSavingPeriod(true);
    setPeriodError(null);
    setPeriodSuccess(null);

    try {
      const response = await api.logPeriod({
        date: selectedDate,
        flowIntensity: selectedFlowIntensity || undefined
      });
      await syncAfterPeriodUpdate(messages.calendar.saveSuccess);
      applyPeriodDayPatch({
        date: selectedDate,
        flowIntensity: response.entry.flowIntensity,
        isLoggedPeriodDay: true
      });
    } catch (error) {
      setPeriodError(error instanceof Error ? error.message : messages.calendar.saveError);
    } finally {
      setIsSavingPeriod(false);
    }
  }

  async function removePeriodDay() {
    if (!api || !selectedDate) {
      return;
    }

    setIsSavingPeriod(true);
    setPeriodError(null);
    setPeriodSuccess(null);

    try {
      await api.deletePeriodDay(selectedDate);
      await syncAfterPeriodUpdate(messages.calendar.removeSuccess);
      applyPeriodDayPatch({
        date: selectedDate,
        flowIntensity: null,
        isLoggedPeriodDay: false
      });
    } catch (error) {
      setPeriodError(error instanceof Error ? error.message : messages.calendar.removeError);
    } finally {
      setIsSavingPeriod(false);
    }
  }

  if (!summary) {
    return (
      <Panel title={messages.today.title}>
        <p className="muted">{messages.app.loading}</p>
      </Panel>
    );
  }

  return (
    <>
      <Panel
        aside={
          <strong className="panel-date">{formatIsoDateForDisplay(summary.today, language)}</strong>
        }
        title={messages.today.title}
      >
        <div className="metric-grid">
          <div className="metric-card">
            <span className="metric-label">{messages.today.cycleDayLabel}</span>
            <strong>
              {summary.currentCycleDay === null
                ? messages.today.cycleDayFallback
                : summary.currentCycleDay}
            </strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">{messages.today.phaseLabel}</span>
            <strong>
              {summary.currentPhase
                ? messages.today.phaseNames[summary.currentPhase]
                : messages.today.phaseFallback}
            </strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">{messages.today.nextPeriodLabel}</span>
            <strong>
              {summary.predictedNextPeriodStart
                ? formatIsoDateForDisplay(summary.predictedNextPeriodStart, language)
                : messages.today.nextPeriodFallback}
            </strong>
          </div>
        </div>
      </Panel>

      <Panel description={messages.calendar.description} title={messages.calendar.title}>
        <div className="calendar-toolbar">
          <button
            className="secondary-button"
            disabled={!canGoToPreviousMonth}
            onClick={() => {
              setMonthSource("user");
              setMonth((current) => shiftMonth(current, -1));
            }}
            type="button"
          >
            {messages.calendar.previousMonth}
          </button>
          <strong>{monthLabel}</strong>
          <button
            className="secondary-button"
            disabled={!canGoToNextMonth}
            onClick={() => {
              setMonthSource("user");
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

        <div className="calendar-weekdays" aria-hidden="true">
          {weekdayLabels.map((label) => (
            <span key={label} className="calendar-weekday">
              {label}
            </span>
          ))}
        </div>

        {calendar ? (
          <div className="calendar-grid">
            {Array.from({ length: leadingEmptyDays }, (_, index) => (
              <span
                key={`empty-${month}-${index}`}
                aria-hidden="true"
                className="calendar-day-placeholder"
              />
            ))}
            {calendar.days.map((day) => {
              const dayStatusLabel = day.isLoggedPeriodDay
                ? messages.calendar.loggedBadge
                : day.isPredictedPeriodDay
                  ? messages.calendar.predictedBadge
                  : "";

              return (
                <button
                  key={day.date}
                  aria-label={`${day.date} ${dayStatusLabel}`.trim()}
                  aria-pressed={day.date === selectedDate}
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
                    setSelectedDateSource("user");
                    setSelectedDate(day.date);
                  }}
                  type="button"
                >
                  <span className="calendar-day-number">{Number(day.date.slice(8, 10))}</span>
                  {day.isLoggedPeriodDay ? (
                    <span className="calendar-day-flow">{messages.calendar.loggedBadge}</span>
                  ) : day.isPredictedPeriodDay ? (
                    <span className="calendar-day-flow">{messages.calendar.predictedBadge}</span>
                  ) : null}
                  {day.symptomKeys.length > 0 ? (
                    <span
                      aria-label={`${day.symptomKeys.length} symptoms`}
                      className="calendar-day-symptoms"
                    >
                      <span className="calendar-day-symptom-glyphs" aria-hidden="true">
                        {Array.from({ length: Math.min(day.symptomKeys.length, 4) }, (_, index) => (
                          <i
                            key={`${day.date}-symptom-${index}`}
                            className="calendar-day-symptom-dot"
                          />
                        ))}
                      </span>
                      {day.symptomKeys.length > 4 ? (
                        <span className="calendar-day-symptom-more">
                          +{day.symptomKeys.length - 4}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="muted">{calendarError ?? messages.calendar.empty}</p>
        )}
      </Panel>

      <Panel
        description={messages.today.dayDetailsDescription}
        title={messages.today.dayDetailsTitle}
      >
        <div className="day-details-header">
          <div className="day-details-meta">
            <strong>{selectedDateLabel}</strong>
            <span className="muted">
              {isSelectedToday
                ? messages.today.selectedDateToday
                : messages.today.selectedDateFromCalendar}
            </span>
          </div>
          <span className={`phase-pill ${getPhaseTone(selectedPhase)}`}>
            {selectedPhase
              ? messages.today.phaseNames[selectedPhase]
              : messages.today.phaseFallback}
          </span>
        </div>

        <div className="day-details-grid">
          <section className="detail-card accent-card">
            <header className="detail-card-header">
              <div>
                <h3>{messages.history.periodLabel}</h3>
                <p>{messages.today.selectedDatePeriodDescription}</p>
              </div>
            </header>

            {periodError ? <p className="inline-error">{periodError}</p> : null}
            {periodSuccess ? <p className="inline-success">{periodSuccess}</p> : null}

            {isFutureSelected ? (
              <p className="muted">
                {selectedDay?.isPredictedPeriodDay
                  ? messages.calendar.selectedDatePredicted
                  : messages.calendar.futureDateReadOnly}
              </p>
            ) : selectedDay?.isLoggedPeriodDay ? (
              <>
                <p className="muted">{messages.calendar.selectedDateLogged}</p>
                <label className="field">
                  <span>{messages.calendar.flowIntensityLabel}</span>
                  <select
                    disabled={!api || isSavingPeriod}
                    onChange={(event) => {
                      setSelectedFlowIntensity(event.target.value as FlowIntensity | "");
                    }}
                    value={selectedFlowIntensity}
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
                    className="primary-button"
                    disabled={!api || isSavingPeriod}
                    onClick={() => {
                      void updatePeriodDayIntensity();
                    }}
                    type="button"
                  >
                    {isSavingPeriod
                      ? messages.calendar.savePending
                      : messages.calendar.savePeriodDay}
                  </button>
                  <button
                    className="primary-button action-row-end"
                    disabled={!api || isSavingPeriod}
                    onClick={() => {
                      void removePeriodDay();
                    }}
                    type="button"
                  >
                    {messages.calendar.removePeriodDay}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="muted">{messages.calendar.selectedDateEmpty}</p>
                <button
                  className="primary-button"
                  disabled={!api || isSavingPeriod}
                  onClick={() => {
                    void markPeriodDay();
                  }}
                  type="button"
                >
                  {isSavingPeriod
                    ? messages.today.markPeriodDayPending
                    : messages.today.markPeriodDay}
                </button>
              </>
            )}
          </section>

          <section className="detail-card">
            <header className="detail-card-header">
              <div>
                <h3>{messages.history.checkinLabel}</h3>
                <p>{messages.today.selectedDateCheckinDescription}</p>
              </div>
            </header>

            {isFutureSelected ? (
              <p className="muted">{messages.today.futureCheckinLocked}</p>
            ) : (
              <form
                className="stack-form"
                onSubmit={(event) => {
                  event.preventDefault();

                  if (!api || !selectedDate || !isCheckinEditable) {
                    return;
                  }

                  setIsSavingCheckin(true);
                  setCheckinError(null);
                  setSaveSuccess(false);

                  void api
                    .saveCheckin(
                      selectedDate,
                      buildCheckinPayload({
                        formState,
                        isMenstrualPhase,
                        persistedEntry
                      })
                    )
                    .then(async (response) => {
                      setPersistedEntry(response.entry);
                      setFormState(
                        response.entry ? toFormState(response.entry) : emptyCheckinState
                      );
                      await syncAfterCheckinSave();
                      applyCheckinCalendarPatch({
                        date: selectedDate,
                        symptomKeys: response.entry?.symptomKeys ?? []
                      });
                      setSaveSuccess(true);
                    })
                    .catch((error) => {
                      setCheckinError(
                        error instanceof Error ? error.message : messages.today.saveError
                      );
                    })
                    .finally(() => {
                      setIsSavingCheckin(false);
                    });
                }}
              >
                <div className="field-grid">
                  <label className="field">
                    <span>{messages.today.mood}</span>
                    <select
                      disabled={!isCheckinEditable}
                      onChange={(event) => {
                        setFormState((current) => ({
                          ...current,
                          mood: event.target.value ? Number(event.target.value) : ""
                        }));
                      }}
                      value={formState.mood}
                    >
                      <option value="">{messages.today.scorePlaceholder}</option>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>{messages.today.energy}</span>
                    <select
                      disabled={!isCheckinEditable}
                      onChange={(event) => {
                        setFormState((current) => ({
                          ...current,
                          energy: event.target.value ? Number(event.target.value) : ""
                        }));
                      }}
                      value={formState.energy}
                    >
                      <option value="">{messages.today.scorePlaceholder}</option>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>{messages.today.pain}</span>
                    <select
                      disabled={!isCheckinEditable}
                      onChange={(event) => {
                        setFormState((current) => ({
                          ...current,
                          painLevel: event.target.value ? Number(event.target.value) : ""
                        }));
                      }}
                      value={formState.painLevel}
                    >
                      <option value="">{messages.today.scorePlaceholder}</option>
                      {[0, 1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>{messages.today.sleep}</span>
                    <select
                      disabled={!isCheckinEditable}
                      onChange={(event) => {
                        setFormState((current) => ({
                          ...current,
                          sleepQuality: event.target.value ? Number(event.target.value) : ""
                        }));
                      }}
                      value={formState.sleepQuality}
                    >
                      <option value="">{messages.today.scorePlaceholder}</option>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>

                  {!isMenstrualPhase ? (
                    <label className="field">
                      <span>{messages.today.discharge}</span>
                      <select
                        disabled={!isCheckinEditable}
                        onChange={(event) => {
                          setFormState((current) => ({
                            ...current,
                            discharge: event.target.value as CheckinFormState["discharge"]
                          }));
                        }}
                        value={formState.discharge}
                      >
                        <option value="">{messages.today.dischargePlaceholder}</option>
                        {Object.entries(messages.today.dischargeOptions).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>

                <label className="field">
                  <span>{messages.today.note}</span>
                  <textarea
                    disabled={!isCheckinEditable}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        note: event.target.value
                      }));
                    }}
                    placeholder={messages.today.notePlaceholder}
                    rows={3}
                    value={formState.note}
                  />
                </label>

                <div className="field">
                  <span>{messages.today.symptomsTitle}</span>
                  <small>
                    {isMenstrualPhase
                      ? messages.today.menstrualSymptomsDescription
                      : messages.today.symptomsDescription}
                  </small>
                  <div className="token-list">
                    {symptomKeys.map((symptomKey) => {
                      const isActive = formState.symptomKeys.includes(symptomKey);

                      return (
                        <button
                          key={symptomKey}
                          className={isActive ? "pill-button active" : "pill-button"}
                          disabled={!isCheckinEditable}
                          onClick={() => {
                            if (!isCheckinEditable) {
                              return;
                            }

                            setFormState((current) => ({
                              ...current,
                              symptomKeys: isActive
                                ? current.symptomKeys.filter((value) => value !== symptomKey)
                                : [...current.symptomKeys, symptomKey]
                            }));
                          }}
                          type="button"
                        >
                          {messages.labels.symptoms[symptomKey as SymptomKey]}
                        </button>
                      );
                    })}
                  </div>
                  {formState.symptomKeys.length === 0 ? (
                    <small>{messages.today.symptomNone}</small>
                  ) : null}
                </div>

                {isLoadingCheckin ? <p className="muted">{messages.app.loading}</p> : null}
                {visibleCheckinError ? <p className="inline-error">{visibleCheckinError}</p> : null}
                {saveSuccess ? (
                  <p className="inline-success">{messages.today.saveSuccess}</p>
                ) : null}

                <button
                  className="primary-button"
                  disabled={!api || !isCheckinEditable || isSavingCheckin}
                  type="submit"
                >
                  {isSavingCheckin ? messages.today.saveStatePending : messages.today.saveStateIdle}
                </button>
              </form>
            )}
          </section>
        </div>
      </Panel>
    </>
  );
}
