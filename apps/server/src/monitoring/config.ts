import { z } from "zod";

import {
  activityByDaySql,
  activityWindowsSql,
  dailyCheckinFieldCompletionSql,
  newUsersByDaySql,
  newUsersByWeekSql,
  notificationJobStatusesSql,
  overviewTotalsSql,
  topSymptoms30dSql,
  trackingMixSql
} from "./queries.js";

// How the dashboard should render a metric's latest snapshot. (The 36.2 UI task
// will consume `displayTypes`; the union is inferred into MetricDefinition below.)
export const displayTypes = ["value", "bar", "line", "table"] as const;

const metricDefinitionSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9_]*$/u, "must be snake_case (a-z, 0-9, underscore)"),
  title: z.string().min(1),
  display: z.enum(displayTypes),
  // Interval scheduling: re-run the query when this many minutes have elapsed
  // since its last snapshot. (Cron-string schedules are a planned extension.)
  everyMinutes: z.number().int().positive(),
  sql: z.string().min(1)
});

export type MetricDefinition = z.infer<typeof metricDefinitionSchema>;

// The monitoring config. Add a metric by appending an entry here (with its SQL
// in queries.ts); it then flows through the scheduler, API, and UI with no other
// code changes. See README.md.
const metricDefinitions: MetricDefinition[] = [
  {
    id: "overview_totals",
    title: "Overview totals",
    display: "value",
    everyMinutes: 1440,
    sql: overviewTotalsSql
  },
  {
    id: "new_users_by_day",
    title: "New users by day",
    display: "line",
    everyMinutes: 1440,
    sql: newUsersByDaySql
  },
  {
    id: "new_users_by_week",
    title: "New users by week",
    display: "line",
    everyMinutes: 1440,
    sql: newUsersByWeekSql
  },
  {
    id: "activity_by_day",
    title: "Activity by day",
    // A (day × activity_type) breakdown reads clearly as a table; a flat bar
    // chart would collapse the two dimensions into duplicate-labeled bars.
    display: "table",
    everyMinutes: 720,
    sql: activityByDaySql
  },
  {
    id: "activity_windows",
    title: "Active users (1d / 7d / 30d)",
    display: "value",
    everyMinutes: 720,
    sql: activityWindowsSql
  },
  {
    id: "tracking_mix",
    title: "Tracking mix",
    display: "bar",
    everyMinutes: 1440,
    sql: trackingMixSql
  },
  {
    id: "top_symptoms_30d",
    title: "Top symptoms (30 days)",
    display: "table",
    everyMinutes: 1440,
    sql: topSymptoms30dSql
  },
  {
    id: "daily_checkin_field_completion",
    title: "Daily check-in field completion",
    display: "bar",
    everyMinutes: 1440,
    sql: dailyCheckinFieldCompletionSql
  },
  {
    id: "notification_job_statuses",
    title: "Notification job statuses",
    display: "table",
    everyMinutes: 360,
    sql: notificationJobStatusesSql
  }
];

// Validate every definition and reject duplicate ids. Throws on the first
// problem so a malformed config fails fast at startup instead of silently
// dropping or mis-scheduling a metric.
export function validateMetrics(definitions: readonly unknown[]): MetricDefinition[] {
  const parsed = definitions.map((definition, index) => {
    const result = metricDefinitionSchema.safeParse(definition);

    if (!result.success) {
      const detail = result.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
      throw new Error(`Invalid monitoring metric at index ${index}: ${detail}`);
    }

    return result.data;
  });

  const seen = new Set<string>();
  for (const metric of parsed) {
    if (seen.has(metric.id)) {
      throw new Error(`Duplicate monitoring metric id: "${metric.id}"`);
    }
    seen.add(metric.id);
  }

  return parsed;
}

export function loadMetrics(): MetricDefinition[] {
  return validateMetrics(metricDefinitions);
}
