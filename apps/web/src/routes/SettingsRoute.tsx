import { Panel } from "../components/Panel";
import { useI18n } from "../i18n/I18nProvider";

export function SettingsRoute() {
  const { language, languages, messages, setLanguage } = useI18n();

  return (
    <>
      <Panel description={messages.settings.description} title={messages.settings.title}>
        <dl className="details-list">
          <div>
            <dt>{messages.settings.productType}</dt>
            <dd>{messages.settings.productTypeValue}</dd>
          </div>
          <div>
            <dt>{messages.settings.coreModel}</dt>
            <dd>{messages.settings.coreModelValue}</dd>
          </div>
          <div>
            <dt>{messages.settings.dataPosture}</dt>
            <dd>{messages.settings.dataPostureValue}</dd>
          </div>
        </dl>
      </Panel>

      <Panel
        description={messages.settings.languageDescription}
        title={messages.settings.languageTitle}
      >
        <div className="language-grid" role="list">
          {languages.map((option) => (
            <button
              key={option.code}
              className={option.code === language ? "language-button active" : "language-button"}
              onClick={() => {
                setLanguage(option.code);
              }}
              type="button"
            >
              <span>{option.label}</span>
              <span className="language-code">{option.code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        description={messages.settings.importantNoticeDescription}
        title={messages.settings.importantNoticeTitle}
      >
        <p className="notice">{messages.settings.importantNotice}</p>
      </Panel>
    </>
  );
}
