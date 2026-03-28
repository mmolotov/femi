import { useEffect, useState } from "react";

import { Panel } from "../components/Panel";
import { useI18n } from "../i18n/I18nProvider";

type HealthResponse = {
  service: string;
  status: string;
  timestamp: string;
};

export function TodayRoute() {
  const [apiStatus, setApiStatus] = useState<HealthResponse | null>(null);
  const { language, messages } = useI18n();

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/health")
      .then((response) => response.json())
      .then((payload: HealthResponse) => {
        if (!cancelled) {
          setApiStatus(payload);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiStatus(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Panel description={messages.today.description} title={messages.today.title}>
        <div className="metric-grid">
          <div className="metric-card">
            <span className="metric-label">{messages.today.currentGoalLabel}</span>
            <strong>{messages.today.currentGoalValue}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">{messages.today.apiStatusLabel}</span>
            <strong>{apiStatus?.status ?? messages.today.apiUnavailable}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">{messages.today.lastHeartbeatLabel}</span>
            <strong>
              {apiStatus?.timestamp
                ? new Date(apiStatus.timestamp).toLocaleString(language)
                : messages.today.lastHeartbeatFallback}
            </strong>
          </div>
        </div>
      </Panel>

      <Panel
        description={messages.today.quickInputsDescription}
        title={messages.today.quickInputsTitle}
      >
        <ul className="token-list">
          {messages.today.quickInputs.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
