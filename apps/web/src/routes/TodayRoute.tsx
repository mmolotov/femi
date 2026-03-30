import { symptomKeys, type DailyCheckinRequest, type SymptomKey } from "@femi/shared";
import { useEffect, useState } from "react";

import { Panel } from "../components/Panel";
import { useAppData } from "../data/AppDataProvider";
import { useI18n } from "../i18n/I18nProvider";
import { formatIsoDateForDisplay } from "../lib/date";

type CheckinFormState = {
  discharge: DailyCheckinRequest["discharge"] | "";
  energy: DailyCheckinRequest["energy"] | "";
  mood: DailyCheckinRequest["mood"] | "";
  note: string;
  painLevel: DailyCheckinRequest["painLevel"] | "";
  sleepQuality: DailyCheckinRequest["sleepQuality"] | "";
  symptomKeys: DailyCheckinRequest["symptomKeys"];
};

const emptyCheckinState: CheckinFormState = {
  discharge: "",
  energy: "",
  mood: "",
  note: "",
  painLevel: "",
  sleepQuality: "",
  symptomKeys: []
};

export function TodayRoute() {
  const { api, refresh, status, summary } = useAppData();
  const { language, messages } = useI18n();
  const [formState, setFormState] = useState<CheckinFormState>(emptyCheckinState);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    if (!api || !summary || status !== "ready") {
      setFormState(emptyCheckinState);
      return;
    }

    void api
      .getCheckin(summary.today)
      .then((response) => {
        if (!active) {
          return;
        }

        if (!response.entry) {
          setFormState(emptyCheckinState);
          return;
        }

        setFormState({
          discharge: response.entry.discharge ?? "",
          energy: response.entry.energy ?? "",
          mood: response.entry.mood ?? "",
          note: response.entry.note ?? "",
          painLevel: response.entry.painLevel ?? "",
          sleepQuality: response.entry.sleepQuality ?? "",
          symptomKeys: response.entry.symptomKeys
        });
      })
      .catch(() => {
        if (active) {
          setFormState(emptyCheckinState);
        }
      });

    return () => {
      active = false;
    };
  }, [api, status, summary]);

  if (!summary) {
    return (
      <Panel description={messages.today.description} title={messages.today.title}>
        <p className="muted">{messages.app.loading}</p>
      </Panel>
    );
  }

  return (
    <>
      <Panel description={messages.today.description} title={messages.today.title}>
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
            <span className="metric-label">{messages.today.nextPeriodLabel}</span>
            <strong>
              {summary.predictedNextPeriodStart
                ? formatIsoDateForDisplay(summary.predictedNextPeriodStart, language)
                : messages.today.nextPeriodFallback}
            </strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">{messages.today.activePeriodLabel}</span>
            <strong>
              {summary.activePeriod
                ? messages.today.activePeriodYes
                : messages.today.activePeriodNo}
            </strong>
          </div>
        </div>
      </Panel>

      <Panel
        description={messages.today.periodActionsDescription}
        title={messages.today.periodActionsTitle}
      >
        <div className="action-row">
          <button
            className="secondary-button"
            disabled={!api || isSaving}
            onClick={() => {
              if (!api) {
                return;
              }

              setIsSaving(true);
              setError(null);
              setSaveSuccess(false);

              void api
                .startPeriod({
                  date: summary.today
                })
                .then(async () => {
                  await refresh();
                  setSaveSuccess(true);
                })
                .catch((nextError) => {
                  setError(
                    nextError instanceof Error ? nextError.message : messages.today.startPeriodError
                  );
                })
                .finally(() => {
                  setIsSaving(false);
                });
            }}
            type="button"
          >
            {messages.today.startPeriod}
          </button>

          <button
            className="secondary-button"
            disabled={!api || isSaving}
            onClick={() => {
              if (!api) {
                return;
              }

              setIsSaving(true);
              setError(null);
              setSaveSuccess(false);

              void api
                .endPeriod(summary.today)
                .then(async () => {
                  await refresh();
                  setSaveSuccess(true);
                })
                .catch((nextError) => {
                  setError(
                    nextError instanceof Error ? nextError.message : messages.today.endPeriodError
                  );
                })
                .finally(() => {
                  setIsSaving(false);
                });
            }}
            type="button"
          >
            {messages.today.endPeriod}
          </button>
        </div>
      </Panel>

      <Panel description={messages.today.checkinDescription} title={messages.today.checkinTitle}>
        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();

            if (!api) {
              return;
            }

            setIsSaving(true);
            setError(null);
            setSaveSuccess(false);

            void api
              .saveCheckin(summary.today, {
                discharge: formState.discharge || undefined,
                energy: formState.energy || undefined,
                mood: formState.mood || undefined,
                note: formState.note || undefined,
                painLevel: formState.painLevel || undefined,
                sleepQuality: formState.sleepQuality || undefined,
                symptomKeys: formState.symptomKeys
              })
              .then(() => {
                setSaveSuccess(true);
              })
              .catch((nextError) => {
                setError(nextError instanceof Error ? nextError.message : messages.today.saveError);
              })
              .finally(() => {
                setIsSaving(false);
              });
          }}
        >
          <div className="field-grid">
            <label className="field">
              <span>{messages.today.mood}</span>
              <select
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

            <label className="field">
              <span>{messages.today.discharge}</span>
              <select
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
          </div>

          <label className="field">
            <span>{messages.today.note}</span>
            <textarea
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
            <small>{messages.today.symptomsDescription}</small>
            <div className="token-list">
              {symptomKeys.map((symptomKey) => {
                const isActive = formState.symptomKeys.includes(symptomKey);

                return (
                  <button
                    key={symptomKey}
                    className={isActive ? "pill-button active" : "pill-button"}
                    onClick={() => {
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

          {error ? <p className="inline-error">{error}</p> : null}
          {saveSuccess ? <p className="inline-success">{messages.today.saveSuccess}</p> : null}

          <button className="primary-button" disabled={!api || isSaving} type="submit">
            {isSaving ? messages.today.saveStatePending : messages.today.saveStateIdle}
          </button>
        </form>
      </Panel>
    </>
  );
}
