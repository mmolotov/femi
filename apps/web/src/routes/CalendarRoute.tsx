import { Panel } from "../components/Panel";
import { useI18n } from "../i18n/I18nProvider";

export function CalendarRoute() {
  const { messages } = useI18n();

  return (
    <Panel description={messages.calendar.description} title={messages.calendar.title}>
      <div className="empty-state">
        <p>{messages.calendar.body}</p>
        <p className="muted">{messages.calendar.muted}</p>
      </div>
    </Panel>
  );
}
