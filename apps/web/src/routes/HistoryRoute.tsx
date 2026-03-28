import { Panel } from "../components/Panel";

export function HistoryRoute() {
  return (
    <Panel
      description="History becomes useful after cycle logs and check-ins exist."
      title="History"
    >
      <div className="empty-state">
        <p>No entries yet.</p>
        <p className="muted">This screen is ready for daily check-ins and symptom logs.</p>
      </div>
    </Panel>
  );
}
