import { useEffect, useState } from "react";
import type { HistoryCycle, HistoryPhase, HistoryResponse, SymptomKey } from "@femi/shared";

import { Panel } from "../components/Panel";
import { useAppData } from "../data/AppDataProvider";
import { useI18n } from "../i18n/I18nProvider";
import { formatIsoDateForDisplay } from "../lib/date";

function formatScore(value: number | null): string {
  return value === null ? "—" : String(value);
}

function renderPhaseSummary(phase: HistoryPhase, messages: ReturnType<typeof useI18n>["messages"]) {
  if (phase.phase === "menstrual") {
    return (
      <p className="history-line">
        {messages.history.durationLabel} {phase.totalDays} · {messages.history.averageFlowLabel}{" "}
        {phase.averageFlowIntensityLevel ?? "—"} · {messages.history.averagePainLabel}{" "}
        {formatScore(phase.averagePainLevel)}
      </p>
    );
  }

  return (
    <p className="history-line">
      {messages.history.averageMoodLabel} {formatScore(phase.averageMood)} ·{" "}
      {messages.history.averageEnergyLabel} {formatScore(phase.averageEnergy)} ·{" "}
      {messages.history.averagePainLabel} {formatScore(phase.averagePainLevel)}
    </p>
  );
}

function CycleCard({ cycle }: { cycle: HistoryCycle }) {
  const { language, messages } = useI18n();

  return (
    <article className="history-card">
      <header className="history-card-header">
        <strong>
          {formatIsoDateForDisplay(cycle.startedOn, language)}
          {cycle.endedOn ? ` - ${formatIsoDateForDisplay(cycle.endedOn, language)}` : ""}
        </strong>
        <p className="muted">
          {messages.history.cycleLengthLabel} {cycle.cycleLengthDays ?? "—"} ·{" "}
          {messages.history.periodLengthLabel} {cycle.periodLengthDays ?? "—"}
        </p>
      </header>

      <div className="history-phase-list">
        {cycle.phases.map((phase) => (
          <details key={`${cycle.cycleId}-${phase.phase}`} className="history-phase-card">
            <summary className="history-phase-summary">
              <div>
                <strong>{messages.today.phaseNames[phase.phase]}</strong>
                <p className="history-line">
                  {formatIsoDateForDisplay(phase.startDate, language)} -{" "}
                  {formatIsoDateForDisplay(phase.endDate, language)}
                </p>
                {renderPhaseSummary(phase, messages)}
              </div>
            </summary>

            {phase.commonSymptoms.length > 0 ? (
              <div className="token-list">
                {phase.commonSymptoms.map((symptomKey) => (
                  <span key={symptomKey} className="history-tag">
                    {messages.labels.symptoms[symptomKey as SymptomKey]}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="history-day-list">
              {phase.days.map((day) => (
                <div key={`${phase.phase}-${day.date}`} className="history-day-card">
                  <strong>{formatIsoDateForDisplay(day.date, language)}</strong>
                  {day.period ? (
                    <p className="history-line">
                      {messages.history.periodLabel}{" "}
                      {day.period.flowIntensity
                        ? messages.labels.flowIntensity[day.period.flowIntensity]
                        : messages.history.noneLabel}
                    </p>
                  ) : null}
                  {day.checkin ? (
                    <p className="history-line">
                      {messages.history.averageMoodLabel} {formatScore(day.checkin.mood)} ·{" "}
                      {messages.history.averageEnergyLabel} {formatScore(day.checkin.energy)} ·{" "}
                      {messages.history.averagePainLabel} {formatScore(day.checkin.painLevel)}
                    </p>
                  ) : null}
                  {day.symptomKeys.length > 0 ? (
                    <div className="token-list">
                      {day.symptomKeys.map((symptomKey) => (
                        <span key={`${day.date}-${symptomKey}`} className="history-tag">
                          {messages.labels.symptoms[symptomKey as SymptomKey]}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </article>
  );
}

export function HistoryRoute() {
  const { api, status } = useAppData();
  const { messages } = useI18n();
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
      .getHistory(6)
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
      {!history || history.cycles.length === 0 ? (
        <p className="muted">{loadError ?? messages.history.empty}</p>
      ) : (
        <div className="history-list">
          {history.cycles.map((cycle) => (
            <CycleCard key={cycle.cycleId} cycle={cycle} />
          ))}
        </div>
      )}
    </Panel>
  );
}
