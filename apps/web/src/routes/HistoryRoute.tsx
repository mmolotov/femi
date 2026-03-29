import { useEffect, useState } from "react";
import type { FlowIntensity, HistoryResponse, SymptomKey } from "@femi/shared";

import { Panel } from "../components/Panel";
import { useAppData } from "../data/AppDataProvider";
import { useI18n } from "../i18n/I18nProvider";
import { formatIsoDateForDisplay } from "../lib/date";

function formatScore(value: number | null): string {
  return value === null ? "—" : String(value);
}

export function HistoryRoute() {
  const { api, status } = useAppData();
  const { language, messages } = useI18n();
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!api || status !== "ready") {
      setHistory(null);
      setLoadError(null);
      return;
    }

    void api
      .getHistory(30)
      .then((response) => {
        if (active) {
          setHistory(response);
          setLoadError(null);
        }
      })
      .catch((error) => {
        if (active) {
          setHistory(null);
          setLoadError(error instanceof Error ? error.message : messages.history.loadError);
        }
      });

    return () => {
      active = false;
    };
  }, [api, messages.history.loadError, status]);

  return (
    <Panel description={messages.history.description} title={messages.history.title}>
      {!history || history.days.length === 0 ? (
        <p className="muted">{loadError ?? messages.history.empty}</p>
      ) : (
        <div className="history-list">
          {history.days.map((day) => (
            <article key={day.date} className="history-card">
              <header className="history-card-header">
                <strong>{formatIsoDateForDisplay(day.date, language)}</strong>
              </header>

              {day.period ? (
                <section className="history-section">
                  <span className="metric-label">{messages.history.periodLabel}</span>
                  <p className="history-line">
                    {day.period.cycleStarted ? messages.history.periodStarted : ""}
                    {day.period.cycleStarted && day.period.cycleEnded ? " / " : ""}
                    {day.period.cycleEnded ? messages.history.periodEnded : ""}
                    {day.period.flowIntensity
                      ? ` · ${messages.labels.flowIntensity[day.period.flowIntensity as FlowIntensity]}`
                      : ""}
                  </p>
                </section>
              ) : null}

              {day.checkin ? (
                <section className="history-section">
                  <span className="metric-label">{messages.history.checkinLabel}</span>
                  <p className="history-line">
                    {messages.history.scoreMood} {formatScore(day.checkin.mood)} ·{" "}
                    {messages.history.scoreEnergy} {formatScore(day.checkin.energy)} ·{" "}
                    {messages.history.scorePain} {formatScore(day.checkin.painLevel)}
                  </p>
                </section>
              ) : null}

              {day.symptomKeys.length > 0 ? (
                <section className="history-section">
                  <span className="metric-label">{messages.history.symptomsLabel}</span>
                  <div className="token-list">
                    {day.symptomKeys.map((symptomKey) => (
                      <span key={symptomKey} className="history-tag">
                        {messages.labels.symptoms[symptomKey as SymptomKey]}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
