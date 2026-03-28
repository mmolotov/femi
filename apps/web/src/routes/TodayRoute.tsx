import { useEffect, useState } from "react";

import { Panel } from "../components/Panel";

type HealthResponse = {
  service: string;
  status: string;
  timestamp: string;
};

export function TodayRoute() {
  const [apiStatus, setApiStatus] = useState<HealthResponse | null>(null);

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
      <Panel description="The first screen is reserved for the shortest daily flow." title="Today">
        <div className="metric-grid">
          <div className="metric-card">
            <span className="metric-label">Current goal</span>
            <strong>Fast check-ins under 10 seconds</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">API status</span>
            <strong>{apiStatus?.status ?? "unavailable"}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Last heartbeat</span>
            <strong>{apiStatus?.timestamp ?? "not connected yet"}</strong>
          </div>
        </div>
      </Panel>

      <Panel
        description="These are placeholders for Milestone 1, kept visible so the shell matches the roadmap."
        title="Planned quick inputs"
      >
        <ul className="token-list">
          <li>Mood</li>
          <li>Energy</li>
          <li>Pain</li>
          <li>Discharge</li>
          <li>Sleep</li>
          <li>Symptoms</li>
        </ul>
      </Panel>
    </>
  );
}
