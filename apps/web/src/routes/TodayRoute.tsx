import {
  addDaysToIsoDate,
  differenceInDays,
  flowIntensityValues,
  getIsoDateInTimeZone,
  resolveConceptionProbability,
  resolveCyclePhase,
  resolveOvulationDay,
  symptomKeys,
  type CalendarResponse,
  type ConceptionProbability,
  type CyclePhase,
  type CycleSummary,
  type DailyCheckinEntry,
  type DailyCheckinRequest,
  type FlowIntensity,
  type SymptomKey
} from "@femi/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DaySummary, type DaySummaryCopy } from "../components/DaySummary";
import { Panel } from "../components/Panel";
import { WeekStrip, type WeekStripCopy } from "../components/WeekStrip";
import { useAppData } from "../data/AppDataProvider";
import { useI18n } from "../i18n/I18nProvider";
import { formatIsoDateForDisplay, getCalendarWeekdayLabels } from "../lib/date";

type CheckinFormState = {
  discharge: NonNullable<DailyCheckinEntry["discharge"]> | "";
  energy: NonNullable<DailyCheckinEntry["energy"]> | "";
  flowIntensity: FlowIntensity | "";
  mood: NonNullable<DailyCheckinEntry["mood"]> | "";
  note: string;
  painLevel: NonNullable<DailyCheckinEntry["painLevel"]> | "";
  sleepQuality: NonNullable<DailyCheckinEntry["sleepQuality"]> | "";
  symptomKeys: DailyCheckinRequest["symptomKeys"];
};

const emptyCheckinState: CheckinFormState = {
  discharge: "",
  energy: "",
  flowIntensity: "",
  mood: "",
  note: "",
  painLevel: "",
  sleepQuality: "",
  symptomKeys: []
};

function toFormState(
  entry: DailyCheckinEntry | null,
  flowIntensity: FlowIntensity | null
): CheckinFormState {
  if (!entry) {
    return { ...emptyCheckinState, flowIntensity: flowIntensity ?? "" };
  }

  return {
    discharge: entry.discharge ?? "",
    energy: entry.energy ?? "",
    flowIntensity: flowIntensity ?? "",
    mood: entry.mood ?? "",
    note: entry.note ?? "",
    painLevel: entry.painLevel ?? "",
    sleepQuality: entry.sleepQuality ?? "",
    symptomKeys: entry.symptomKeys
  };
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

function collectOvulationDays(summary: CycleSummary): string[] {
  const ovulationDay = resolveOvulationDay(summary.averageCycleLengthDays);

  if (ovulationDay === null) {
    return [];
  }

  const offsetFromCycleStart = ovulationDay - 1;
  const starts: string[] = [];

  if (summary.latestPeriodStart) {
    starts.push(summary.latestPeriodStart);
  }

  for (const forecastEntry of summary.forecast) {
    starts.push(forecastEntry.periodStart);
  }

  return starts.map((start) => addDaysToIsoDate(start, offsetFromCycleStart));
}

function collectPredictedPeriodDays(summary: CycleSummary): string[] {
  const dates: string[] = [];

  for (const entry of summary.forecast) {
    const span = Math.abs(differenceInDays(entry.periodStart, entry.periodEnd)) + 1;

    for (let index = 0; index < span; index += 1) {
      dates.push(addDaysToIsoDate(entry.periodStart, index));
    }
  }

  return dates;
}

function resolveNextOvulationDate(today: string, ovulationDays: readonly string[]): string | null {
  for (const date of ovulationDays) {
    if (differenceInDays(today, date) >= 0) {
      return date;
    }
  }

  return null;
}

function resolveNextPeriodStart(today: string, summary: CycleSummary): string | null {
  if (
    summary.predictedNextPeriodStart &&
    differenceInDays(today, summary.predictedNextPeriodStart) >= 0
  ) {
    return summary.predictedNextPeriodStart;
  }

  for (const entry of summary.forecast) {
    if (differenceInDays(today, entry.periodStart) >= 0) {
      return entry.periodStart;
    }
  }

  return null;
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

export function TodayRoute() {
  const { api, refresh, status, summary } = useAppData();
  const { language, messages } = useI18n();
  const navigate = useNavigate();

  const browserToday = getIsoDateInTimeZone(
    new Date(),
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const today = summary?.today ?? browserToday;

  const [selectedDate, setSelectedDate] = useState(today);
  const [formState, setFormState] = useState<CheckinFormState>(emptyCheckinState);
  const [persistedEntry, setPersistedEntry] = useState<DailyCheckinEntry | null>(null);
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [checkinLoadError, setCheckinLoadError] = useState<string | null>(null);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [isLoadingCheckin, setIsLoadingCheckin] = useState(false);
  const [isSavingCheckin, setIsSavingCheckin] = useState(false);
  const [isTogglingPeriod, setIsTogglingPeriod] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedDateSource, setSelectedDateSource] = useState<"bootstrap" | "user">("bootstrap");
  const copyRef = useRef({
    calendarLoadError: messages.calendar.loadError,
    checkinLoadError: messages.app.dataLoadError
  });

  copyRef.current = {
    calendarLoadError: messages.calendar.loadError,
    checkinLoadError: messages.app.dataLoadError
  };

  const selectedMonth = selectedDate.slice(0, 7);

  useEffect(() => {
    if (!summary || selectedDateSource === "user") {
      return;
    }

    if (selectedDate !== summary.today) {
      setSelectedDate(summary.today);
    }
  }, [selectedDate, selectedDateSource, summary]);

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
    void loadCalendar(selectedMonth);
  }, [loadCalendar, selectedMonth]);

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

        setPersistedEntry(response.entry ?? null);
        setIsLoadingCheckin(false);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setPersistedEntry(null);
        setCheckinLoadError(
          error instanceof Error ? error.message : copyRef.current.checkinLoadError
        );
        setIsLoadingCheckin(false);
      });

    return () => {
      active = false;
    };
  }, [api, selectedDate, status]);

  const selectedDay = useMemo(
    () => calendar?.days.find((day) => day.date === selectedDate) ?? null,
    [calendar, selectedDate]
  );

  useEffect(() => {
    setFormState(toFormState(persistedEntry, selectedDay?.flowIntensity ?? null));
    setSaveSuccess(false);
    setCheckinError(null);
  }, [persistedEntry, selectedDay]);

  useEffect(() => {
    setCheckinError(null);
    setPeriodError(null);
    setSaveSuccess(false);
  }, [selectedDate]);

  const markerData = useMemo(() => {
    if (!summary) {
      return {
        ovulationDays: [] as string[],
        periodDays: [] as string[],
        predictedPeriodDays: [] as string[]
      };
    }

    const loggedPeriodDaysFromCalendar =
      calendar?.days.filter((day) => day.isLoggedPeriodDay).map((day) => day.date) ?? [];
    const predictedFromForecast = collectPredictedPeriodDays(summary);
    const ovulationDays = collectOvulationDays(summary);

    return {
      ovulationDays,
      periodDays: loggedPeriodDaysFromCalendar,
      predictedPeriodDays: predictedFromForecast
    };
  }, [calendar, summary]);

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

  const selectedPhase: CyclePhase | null = useMemo(() => {
    if (!summary || selectedCycleDay === null) {
      return selectedDay?.isLoggedPeriodDay || selectedDay?.isPredictedPeriodDay
        ? "menstrual"
        : null;
    }

    if (selectedDay?.isLoggedPeriodDay || selectedDay?.isPredictedPeriodDay) {
      return "menstrual";
    }

    return resolveCyclePhase(
      selectedCycleDay,
      summary.averageCycleLengthDays,
      summary.averagePeriodLengthDays
    );
  }, [selectedCycleDay, selectedDay, summary]);

  const conceptionProbability: ConceptionProbability | null = useMemo(() => {
    if (!summary || selectedCycleDay === null) {
      return null;
    }

    return resolveConceptionProbability(
      selectedCycleDay,
      summary.averageCycleLengthDays,
      summary.averagePeriodLengthDays
    );
  }, [selectedCycleDay, summary]);

  const nextPeriodDate = summary ? resolveNextPeriodStart(today, summary) : null;
  const nextOvulationDate = resolveNextOvulationDate(today, markerData.ovulationDays);
  const daysToNextPeriod = nextPeriodDate ? differenceInDays(today, nextPeriodDate) : null;
  const daysToOvulation = nextOvulationDate ? differenceInDays(today, nextOvulationDate) : null;

  const isFutureSelected = differenceInDays(today, selectedDate) > 0;
  const isSelectedDayEditable = !isFutureSelected;
  const isCheckinEditable = isSelectedDayEditable && !isLoadingCheckin && checkinLoadError === null;
  const visibleCheckinError = checkinLoadError ?? checkinError;
  const isMenstrualPhase = selectedPhase === "menstrual";
  const isLoggedPeriodDay = selectedDay?.isLoggedPeriodDay ?? false;
  const selectedDateLabel = formatIsoDateForDisplay(selectedDate, language);
  const weekdayLabels = useMemo(() => getCalendarWeekdayLabels(language), [language]);

  const weekStripCopy: WeekStripCopy = messages.week;
  const daySummaryCopy: DaySummaryCopy = {
    countdownFallback: messages.today.nextCountdownFallback,
    countdownLabel: messages.today.nextLabel,
    countdownNextPeriod: (days) => interpolate(messages.today.nextCountdownPeriod, { n: days }),
    countdownOvulation: (days) => interpolate(messages.today.nextCountdownOvulation, { n: days }),
    countdownToday: messages.today.nextCountdownToday,
    countdownTodayOvulation: messages.today.nextCountdownTodayOvulation,
    countdownTodayPeriod: messages.today.nextCountdownTodayPeriod,
    errorFallback: messages.today.markPeriodDayError,
    markPeriodDay: messages.today.markPeriodDay,
    phaseFallback: messages.today.phaseFallback,
    phaseLabel: messages.today.phaseLabel,
    phaseNames: messages.today.phaseNames,
    probabilityFallback: messages.today.conceptionProbabilityFallback,
    probabilityLabel: messages.today.conceptionProbabilityLabel,
    probabilityValues: messages.today.conceptionProbabilityValues,
    removePeriodDay: messages.today.removePeriodDay,
    savingLabel: messages.today.markPeriodDayPending,
    title: messages.today.summaryTitle
  };

  const formatDayLabel = useCallback(
    (iso: string) => formatIsoDateForDisplay(iso, language),
    [language]
  );
  const formatRangeLabel = useCallback(
    (startIso: string, endIso: string) =>
      `${formatIsoDateForDisplay(startIso, language)} – ${formatIsoDateForDisplay(endIso, language)}`,
    [language]
  );

  async function togglePeriodDay() {
    if (!api || !selectedDate) {
      return;
    }

    setPeriodError(null);
    setIsTogglingPeriod(true);

    try {
      if (isLoggedPeriodDay) {
        await api.deletePeriodDay(selectedDate);
      } else {
        await api.logPeriod({ date: selectedDate });
      }

      await loadCalendar(selectedMonth);

      try {
        await refresh();
      } catch {
        // Keep the confirmed local mutation result even if the summary refresh fails.
      }
    } catch (error) {
      setPeriodError(
        error instanceof Error
          ? error.message
          : isLoggedPeriodDay
            ? messages.today.removePeriodDayError
            : messages.today.markPeriodDayError
      );
    } finally {
      setIsTogglingPeriod(false);
    }
  }

  async function submitCheckin() {
    if (!api || !selectedDate || !isCheckinEditable) {
      return;
    }

    setIsSavingCheckin(true);
    setCheckinError(null);
    setSaveSuccess(false);

    try {
      const response = await api.saveCheckin(
        selectedDate,
        buildCheckinPayload({ formState, isMenstrualPhase, persistedEntry })
      );

      if (isMenstrualPhase && formState.flowIntensity) {
        try {
          await api.logPeriod({
            date: selectedDate,
            flowIntensity: formState.flowIntensity
          });
        } catch {
          // Flow intensity can stay on the previous value without failing the check-in save.
        }
      }

      setPersistedEntry(response.entry ?? null);
      await loadCalendar(selectedMonth);

      try {
        await refresh();
      } catch {
        // Keep the confirmed local mutation result even if the summary refresh fails.
      }

      setSaveSuccess(true);
    } catch (error) {
      setCheckinError(error instanceof Error ? error.message : messages.today.saveError);
    } finally {
      setIsSavingCheckin(false);
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
      <WeekStrip
        copy={weekStripCopy}
        formatDayLabel={formatDayLabel}
        formatRangeLabel={formatRangeLabel}
        onOpenCalendar={() => navigate("/calendar")}
        onSelect={(date) => {
          setSelectedDateSource("user");
          setSelectedDate(date);
        }}
        ovulationDays={markerData.ovulationDays}
        periodDays={markerData.periodDays}
        predictedPeriodDays={markerData.predictedPeriodDays}
        selectedDate={selectedDate}
        today={today}
        weekdayLabels={weekdayLabels}
      />

      <Panel
        aside={<strong className="panel-date">{selectedDateLabel}</strong>}
        title={messages.today.summaryTitle}
      >
        <DaySummary
          canEdit={isSelectedDayEditable}
          conceptionProbability={conceptionProbability}
          copy={daySummaryCopy}
          daysToNextPeriod={daysToNextPeriod}
          daysToOvulation={daysToOvulation}
          error={periodError}
          isPeriodDay={isLoggedPeriodDay}
          isSaving={isTogglingPeriod}
          onTogglePeriodDay={() => {
            void togglePeriodDay();
          }}
          phase={selectedPhase}
        />
      </Panel>

      <Panel
        description={
          isMenstrualPhase
            ? messages.today.menstrualCheckinDescription
            : messages.today.checkinDescription
        }
        title={
          isMenstrualPhase ? messages.today.menstrualCheckinTitle : messages.today.checkinTitle
        }
      >
        {isFutureSelected ? (
          <p className="muted">{messages.today.futureCheckinLocked}</p>
        ) : (
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault();
              void submitCheckin();
            }}
          >
            {isMenstrualPhase ? (
              <label className="field">
                <span>{messages.calendar.flowIntensityLabel}</span>
                <select
                  disabled={!isCheckinEditable}
                  onChange={(event) => {
                    setFormState((current) => ({
                      ...current,
                      flowIntensity: event.target.value as FlowIntensity | ""
                    }));
                  }}
                  value={formState.flowIntensity}
                >
                  <option value="">{messages.calendar.flowIntensityPlaceholder}</option>
                  {flowIntensityValues.map((value) => (
                    <option key={value} value={value}>
                      {messages.labels.flowIntensity[value]}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {calendarError ? <p className="inline-error">{calendarError}</p> : null}

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
            {saveSuccess ? <p className="inline-success">{messages.today.saveSuccess}</p> : null}

            <button
              className="primary-button"
              disabled={!api || !isCheckinEditable || isSavingCheckin}
              type="submit"
            >
              {isSavingCheckin ? messages.today.saveStatePending : messages.today.saveStateIdle}
            </button>
          </form>
        )}
      </Panel>
    </>
  );
}
