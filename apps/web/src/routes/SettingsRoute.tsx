import { cycleLengthRange, periodLengthRange } from "@femi/shared";
import { useEffect, useId, useRef, useState } from "react";

import { Panel } from "../components/Panel";
import { useAppData } from "../data/AppDataProvider";
import { useI18n } from "../i18n/I18nProvider";
import { isNumberInRange, parseIntegerInput } from "../lib/numberInput";
import { useSession } from "../session/SessionProvider";
import { type ThemeChoice, useTheme } from "../theme/ThemeProvider";

export function SettingsRoute() {
  const { language, languages, messages, setLanguage } = useI18n();
  const { deleteAccount, me, updateSettings } = useAppData();
  const session = useSession();
  const { choice: themeChoice, setChoice: setThemeChoice } = useTheme();
  const themeOptions: Array<{ value: ThemeChoice; label: string }> = [
    { value: "light", label: messages.theme.light },
    { value: "dark", label: messages.theme.dark },
    { value: "system", label: messages.theme.system }
  ];
  const [cycleLengthInput, setCycleLengthInput] = useState(
    String(me?.settings.cycleLengthDays ?? 28)
  );
  const [periodLengthInput, setPeriodLengthInput] = useState(
    String(me?.settings.periodLengthDays ?? 5)
  );
  const [timezone, setTimezone] = useState(
    me?.settings.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [remindersEnabled, setRemindersEnabled] = useState(me?.settings.remindersEnabled ?? true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteDialogTitleId = useId();
  const deleteDialogDescriptionId = useId();
  const deleteDialogErrorId = useId();
  const cancelDeleteButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmDeleteButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const wasDeleteDialogOpenRef = useRef(false);

  useEffect(() => {
    if (!me) {
      return;
    }

    setCycleLengthInput(String(me.settings.cycleLengthDays));
    setPeriodLengthInput(String(me.settings.periodLengthDays));
    setTimezone(me.settings.timezone);
    setRemindersEnabled(me.settings.remindersEnabled);
  }, [me]);

  useEffect(() => {
    if (!isDeleteDialogOpen) {
      if (wasDeleteDialogOpenRef.current) {
        lastFocusedElementRef.current?.focus();
        lastFocusedElementRef.current = null;
      }

      wasDeleteDialogOpenRef.current = false;
      return;
    }

    wasDeleteDialogOpenRef.current = true;
    const animationFrameId = window.requestAnimationFrame(() => {
      cancelDeleteButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (!isDeleting) {
          setDeleteError(null);
          setIsDeleteDialogOpen(false);
        }

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = [
        cancelDeleteButtonRef.current,
        confirmDeleteButtonRef.current
      ].filter((element): element is HTMLButtonElement => element !== null);

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDeleteDialogOpen, isDeleting]);

  const parsedCycleLengthDays = parseIntegerInput(cycleLengthInput);
  const parsedPeriodLengthDays = parseIntegerInput(periodLengthInput);
  const canSave =
    isNumberInRange(parsedCycleLengthDays, cycleLengthRange) &&
    isNumberInRange(parsedPeriodLengthDays, periodLengthRange) &&
    timezone.trim().length > 0;

  const sessionStatusLabel =
    session.status === "authenticated"
      ? messages.settings.sessionAuthenticated
      : session.status === "preview"
        ? messages.settings.sessionPreview
        : session.status === "signed_out"
          ? messages.settings.sessionSignedOut
          : session.status === "error"
            ? messages.settings.sessionError
            : messages.settings.sessionAuthenticating;

  const telegramAccountLabel =
    (session.user?.username ??
      [session.user?.firstName, session.user?.lastName].filter(Boolean).join(" ")) ||
    messages.settings.telegramAccountFallback;

  return (
    <>
      <Panel
        description={messages.settings.preferencesDescription}
        title={messages.settings.preferencesTitle}
      >
        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSave) {
              return;
            }

            setIsSaving(true);
            setSaveError(null);
            setSaveSuccess(false);

            void updateSettings({
              cycleLengthDays: parsedCycleLengthDays,
              periodLengthDays: parsedPeriodLengthDays,
              remindersEnabled,
              timezone
            })
              .then(() => {
                setSaveSuccess(true);
              })
              .catch((error) => {
                setSaveError(error instanceof Error ? error.message : messages.settings.saveError);
              })
              .finally(() => {
                setIsSaving(false);
              });
          }}
        >
          <div className="field-grid">
            <label className="field">
              <span>{messages.settings.cycleLengthLabel}</span>
              <input
                max={45}
                min={20}
                onChange={(event) => {
                  setCycleLengthInput(event.target.value);
                }}
                type="number"
                value={cycleLengthInput}
              />
            </label>

            <label className="field">
              <span>{messages.settings.periodLengthLabel}</span>
              <input
                max={10}
                min={2}
                onChange={(event) => {
                  setPeriodLengthInput(event.target.value);
                }}
                type="number"
                value={periodLengthInput}
              />
            </label>
          </div>

          <label className="field">
            <span>{messages.settings.timezoneLabel}</span>
            <input
              onChange={(event) => {
                setTimezone(event.target.value);
              }}
              type="text"
              value={timezone}
            />
          </label>

          <label className="toggle-field">
            <input
              checked={remindersEnabled}
              onChange={(event) => {
                setRemindersEnabled(event.target.checked);
              }}
              type="checkbox"
            />
            <span>{messages.settings.remindersEnabledLabel}</span>
          </label>

          {saveError ? <p className="inline-error">{saveError}</p> : null}
          {saveSuccess ? <p className="inline-success">{messages.settings.saveSuccess}</p> : null}

          <button className="primary-button" disabled={isSaving || !canSave} type="submit">
            {isSaving ? messages.settings.savePending : messages.settings.saveIdle}
          </button>
        </form>
      </Panel>

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

      <Panel description={messages.theme.description} title={messages.theme.title}>
        <div className="theme-segment" role="radiogroup" aria-label={messages.theme.title}>
          {themeOptions.map((option) => (
            <button
              key={option.value}
              aria-checked={themeChoice === option.value}
              className={themeChoice === option.value ? "active" : ""}
              onClick={() => {
                setThemeChoice(option.value);
              }}
              role="radio"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
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
        description={messages.settings.accountDescription}
        title={messages.settings.accountTitle}
      >
        <div className="account-danger-card">
          <p className="notice">{messages.settings.accountWarning}</p>
          <button
            className="destructive-button"
            onClick={() => {
              lastFocusedElementRef.current =
                document.activeElement instanceof HTMLElement ? document.activeElement : null;
              setDeleteError(null);
              setIsDeleteDialogOpen(true);
            }}
            type="button"
          >
            {messages.settings.deleteAccountIdle}
          </button>
        </div>
      </Panel>

      <Panel
        description={messages.settings.importantNoticeDescription}
        title={messages.settings.importantNoticeTitle}
      >
        <p className="notice">{messages.settings.importantNotice}</p>
      </Panel>

      {isDeleteDialogOpen ? (
        <div
          className="dialog-backdrop"
          onClick={() => {
            if (isDeleting) {
              return;
            }

            setDeleteError(null);
            setIsDeleteDialogOpen(false);
          }}
        >
          <div
            aria-describedby={
              deleteError
                ? `${deleteDialogDescriptionId} ${deleteDialogErrorId}`
                : deleteDialogDescriptionId
            }
            aria-labelledby={deleteDialogTitleId}
            aria-modal="true"
            className="dialog-card"
            onClick={(event) => {
              event.stopPropagation();
            }}
            role="dialog"
          >
            <h3 id={deleteDialogTitleId}>{messages.settings.deleteDialogTitle}</h3>
            <p id={deleteDialogDescriptionId}>{messages.settings.deleteDialogDescription}</p>
            {deleteError ? (
              <p className="inline-error" id={deleteDialogErrorId}>
                {deleteError}
              </p>
            ) : null}
            <div className="action-row">
              <button
                className="secondary-button"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteError(null);
                  setIsDeleteDialogOpen(false);
                }}
                ref={cancelDeleteButtonRef}
                type="button"
              >
                {messages.settings.deleteDialogCancel}
              </button>
              <button
                className="destructive-button"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleting(true);
                  setDeleteError(null);

                  void deleteAccount()
                    .then(() => {
                      setIsDeleteDialogOpen(false);
                    })
                    .catch((error) => {
                      setDeleteError(
                        error instanceof Error ? error.message : messages.settings.deleteError
                      );
                    })
                    .finally(() => {
                      setIsDeleting(false);
                    });
                }}
                ref={confirmDeleteButtonRef}
                type="button"
              >
                {isDeleting
                  ? messages.settings.deletePending
                  : messages.settings.deleteDialogConfirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
