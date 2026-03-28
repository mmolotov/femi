import { Panel } from "../components/Panel";
import { useI18n } from "../i18n/I18nProvider";

export function HistoryRoute() {
  const { messages } = useI18n();

  return (
    <Panel description={messages.history.description} title={messages.history.title}>
      <div className="empty-state">
        <p>{messages.history.body}</p>
        <p className="muted">{messages.history.muted}</p>
      </div>
    </Panel>
  );
}
