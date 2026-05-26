import type { MetricDefinition } from "./config.js";

// A metric is due when it has never run, or when its interval has elapsed since
// the last snapshot. Pure function so the scheduling logic is trivially testable.
export function isMetricDue(
  metric: MetricDefinition,
  lastGeneratedAt: Date | null,
  now: Date
): boolean {
  if (!lastGeneratedAt) {
    return true;
  }

  const elapsedMs = now.getTime() - lastGeneratedAt.getTime();
  return elapsedMs >= metric.everyMinutes * 60_000;
}
