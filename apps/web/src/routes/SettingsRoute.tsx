import { Panel } from "../components/Panel";
import { useI18n } from "../i18n/I18nProvider";
import { useSession } from "../session/SessionProvider";

export function SettingsRoute() {
  const { language, languages, messages, setLanguage } = useI18n();
  const session = useSession();

  const sessionStatusLabel =
    session.status === "authenticated"
      ? messages.settings.sessionAuthenticated
      : session.status === "preview"
        ? messages.settings.sessionPreview
        : session.status === "error"
          ? messages.settings.sessionError
          : messages.settings.sessionAuthenticating;

  const telegramAccountLabel =
    (session.user?.username ??
      [session.user?.firstName, session.user?.lastName].filter(Boolean).join(" ")) ||
    messages.settings.telegramAccountFallback;

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
        description={messages.settings.integrationDescription}
        title={messages.settings.integrationTitle}
      >
        <dl className="details-list">
          <div>
            <dt>{messages.settings.environment}</dt>
            <dd>
              {session.environment === "telegram"
                ? messages.settings.environmentTelegram
                : messages.settings.environmentBrowser}
            </dd>
          </div>
          <div>
            <dt>{messages.settings.sessionStatus}</dt>
            <dd>{sessionStatusLabel}</dd>
          </div>
          <div>
            <dt>{messages.settings.telegramAccount}</dt>
            <dd>{telegramAccountLabel}</dd>
          </div>
          <div>
            <dt>{messages.settings.telegramLanguage}</dt>
            <dd>{session.user?.languageCode ?? messages.settings.telegramLanguageFallback}</dd>
          </div>
          {session.error ? (
            <div>
              <dt>{messages.settings.authErrorLabel}</dt>
              <dd>{session.error}</dd>
            </div>
          ) : null}
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
