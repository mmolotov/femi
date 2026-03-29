import { useState } from "react";

import { useAppData } from "../data/AppDataProvider";
import { useI18n } from "../i18n/I18nProvider";

export function OnboardingGate() {
  const { completeOnboarding, me } = useAppData();
  const { messages } = useI18n();
  const [cycleLengthDays, setCycleLengthDays] = useState(me?.settings.cycleLengthDays ?? 28);
  const [periodLengthDays, setPeriodLengthDays] = useState(me?.settings.periodLengthDays ?? 5);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="panel onboarding-panel">
      <header className="panel-header">
        <div>
          <h2>{messages.onboarding.title}</h2>
          <p>{messages.onboarding.description}</p>
        </div>
      </header>

      <form
        className="stack-form"
        onSubmit={(event) => {
          event.preventDefault();
          setIsSaving(true);
          setError(null);

          void completeOnboarding({
            cycleLengthDays,
            periodLengthDays,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          })
            .catch((nextError) => {
              setError(
                nextError instanceof Error ? nextError.message : messages.onboarding.saveError
              );
            })
            .finally(() => {
              setIsSaving(false);
            });
        }}
      >
        <label className="field">
          <span>{messages.onboarding.cycleLengthLabel}</span>
          <input
            max={45}
            min={20}
            onChange={(event) => {
              setCycleLengthDays(Number(event.target.value));
            }}
            required
            type="number"
            value={cycleLengthDays}
          />
          <small>{messages.onboarding.cycleLengthHint}</small>
        </label>

        <label className="field">
          <span>{messages.onboarding.periodLengthLabel}</span>
          <input
            max={10}
            min={2}
            onChange={(event) => {
              setPeriodLengthDays(Number(event.target.value));
            }}
            required
            type="number"
            value={periodLengthDays}
          />
          <small>{messages.onboarding.periodLengthHint}</small>
        </label>

        {error ? <p className="inline-error">{error}</p> : null}

        <button className="primary-button" disabled={isSaving} type="submit">
          {isSaving ? messages.onboarding.submitPending : messages.onboarding.submitIdle}
        </button>
      </form>
    </section>
  );
}
