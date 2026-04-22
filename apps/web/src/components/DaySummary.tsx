import type { ConceptionProbability, CyclePhase } from "@femi/shared";

export type DaySummaryCopy = {
  title: string;
  phaseLabel: string;
  phaseFallback: string;
  phaseNames: Record<CyclePhase, string>;
  probabilityLabel: string;
  probabilityValues: Record<ConceptionProbability, string>;
  probabilityFallback: string;
  markPeriodDay: string;
  removePeriodDay: string;
  savingLabel: string;
  errorFallback: string;
};

type DaySummaryProps = {
  primaryLabel?: string;
  primaryValue?: string;
  phase: CyclePhase | null;
  conceptionProbability: ConceptionProbability | null;
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

export function DaySummary({
  primaryLabel,
  primaryValue,
  phase,
  conceptionProbability,
  isPeriodDay,
  canEdit,
  isSaving,
  error,
  onTogglePeriodDay,
  copy
}: DaySummaryProps) {
  const phaseText = phase ? copy.phaseNames[phase] : copy.phaseFallback;
  const probabilityText = conceptionProbability
    ? copy.probabilityValues[conceptionProbability]
    : copy.probabilityFallback;
  const hasPrimaryTile = Boolean(primaryLabel && primaryValue);

  return (
    <section aria-label={copy.title} className="day-summary">
      <div className="day-summary-grid">
        {hasPrimaryTile ? (
          <div className="day-summary-tile">
            <span className="day-summary-label">{primaryLabel}</span>
            <strong className="day-summary-value">{primaryValue}</strong>
          </div>
        ) : null}
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
