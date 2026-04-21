import type { ConceptionProbability, CyclePhase } from "@femi/shared";

export type DaySummaryCopy = {
  title: string;
  phaseLabel: string;
  phaseFallback: string;
  phaseNames: Record<CyclePhase, string>;
  countdownLabel: string;
  countdownNextPeriod: (days: number) => string;
  countdownOvulation: (days: number) => string;
  countdownToday: string;
  countdownTodayPeriod: string;
  countdownTodayOvulation: string;
  countdownFallback: string;
  probabilityLabel: string;
  probabilityValues: Record<ConceptionProbability, string>;
  probabilityFallback: string;
  markPeriodDay: string;
  removePeriodDay: string;
  savingLabel: string;
  errorFallback: string;
};

type DaySummaryProps = {
  phase: CyclePhase | null;
  conceptionProbability: ConceptionProbability | null;
  daysToNextPeriod: number | null;
  daysToOvulation: number | null;
  isPeriodDay: boolean;
  canEdit: boolean;
  isSaving: boolean;
  error: string | null;
  onTogglePeriodDay: () => void;
  copy: DaySummaryCopy;
};

function phaseTone(phase: CyclePhase | null): string {
  switch (phase) {
    case "menstrual":
      return "menstrual";
    case "follicular":
      return "follicular";
    case "ovulatory":
      return "ovulatory";
    case "luteal":
      return "luteal";
    default:
      return "neutral";
  }
}

function pickCountdown(
  copy: DaySummaryCopy,
  daysToPeriod: number | null,
  daysToOvulation: number | null
): string {
  const candidates: Array<{
    days: number;
    render: (n: number) => string;
    renderToday: string;
  }> = [];

  if (daysToPeriod !== null && daysToPeriod >= 0) {
    candidates.push({
      days: daysToPeriod,
      render: copy.countdownNextPeriod,
      renderToday: copy.countdownTodayPeriod
    });
  }

  if (daysToOvulation !== null && daysToOvulation >= 0) {
    candidates.push({
      days: daysToOvulation,
      render: copy.countdownOvulation,
      renderToday: copy.countdownTodayOvulation
    });
  }

  if (candidates.length === 0) {
    return copy.countdownFallback;
  }

  const nearest = candidates.reduce((best, candidate) =>
    candidate.days < best.days ? candidate : best
  );

  if (nearest.days === 0) {
    return nearest.renderToday ?? copy.countdownToday;
  }

  return nearest.render(nearest.days);
}

export function DaySummary({
  phase,
  conceptionProbability,
  daysToNextPeriod,
  daysToOvulation,
  isPeriodDay,
  canEdit,
  isSaving,
  error,
  onTogglePeriodDay,
  copy
}: DaySummaryProps) {
  const countdownText = pickCountdown(copy, daysToNextPeriod, daysToOvulation);
  const phaseText = phase ? copy.phaseNames[phase] : copy.phaseFallback;
  const probabilityText = conceptionProbability
    ? copy.probabilityValues[conceptionProbability]
    : copy.probabilityFallback;

  return (
    <section aria-label={copy.title} className="day-summary">
      <div className="day-summary-grid">
        <div className="day-summary-tile">
          <span className="day-summary-label">{copy.countdownLabel}</span>
          <strong className="day-summary-value">{countdownText}</strong>
        </div>
        <div className="day-summary-tile">
          <span className="day-summary-label">{copy.phaseLabel}</span>
          <strong className={`day-summary-value phase-pill ${phaseTone(phase)}`}>
            {phaseText}
          </strong>
        </div>
        <div className="day-summary-tile">
          <span className="day-summary-label">{copy.probabilityLabel}</span>
          <strong
            className={`day-summary-value probability-pill ${conceptionProbability ?? "unknown"}`}
          >
            {probabilityText}
          </strong>
        </div>
      </div>
      <div className="day-summary-action">
        <button
          className="primary-button"
          disabled={!canEdit || isSaving}
          onClick={onTogglePeriodDay}
          type="button"
        >
          {isSaving ? copy.savingLabel : isPeriodDay ? copy.removePeriodDay : copy.markPeriodDay}
        </button>
        {error ? <p className="inline-error">{error}</p> : null}
      </div>
    </section>
  );
}
