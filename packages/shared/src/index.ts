import { z } from "zod";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const yearMonthPattern = /^\d{4}-\d{2}$/;
const dayInMilliseconds = 24 * 60 * 60 * 1000;

export const cycleLengthRange = {
  max: 90,
  min: 10
} as const;

export const periodLengthRange = {
  max: 21,
  min: 1
} as const;

/** Allowed range for the user-configurable late-period notice threshold. */
export const latePeriodThresholdRange = {
  max: 14,
  min: 1
} as const;

/**
 * Default for how many days past the average cycle length a cycle may run —
 * with no period logged — before the app treats it as a possible delay and
 * surfaces a notice. Users can override this in tracking settings.
 */
export const LATE_PERIOD_THRESHOLD_DAYS = 2;

function hasUniqueValues(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

export function isValidIsoDate(value: string): boolean {
  if (!isoDatePattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  const normalizedDate = new Date(Date.UTC(year, month - 1, day));

  return (
    normalizedDate.getUTCFullYear() === year &&
    normalizedDate.getUTCMonth() === month - 1 &&
    normalizedDate.getUTCDate() === day
  );
}

export function isValidYearMonth(value: string): boolean {
  if (!yearMonthPattern.test(value)) {
    return false;
  }

  const [year, month] = value.split("-").map(Number);

  return Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12;
}

export const isoDateSchema = z
  .string()
  .regex(isoDatePattern, "Expected a date in YYYY-MM-DD format.")
  .refine((value) => isValidIsoDate(value), {
    message: "Expected a real calendar date in YYYY-MM-DD format."
  });
export const yearMonthSchema = z
  .string()
  .regex(yearMonthPattern, "Expected a month in YYYY-MM format.")
  .refine((value) => isValidYearMonth(value), {
    message: "Expected a real month in YYYY-MM format."
  });
const timezoneSchema = z.string().trim().min(1).max(64);
const optionalNoteSchema = z.string().trim().max(1000).optional();
const nullableOptionalNoteSchema = z.string().trim().max(1000).nullable().optional();
export const cyclePhaseValues = ["menstrual", "follicular", "ovulatory", "luteal"] as const;

export const cycleLengthDaysSchema = z
  .number()
  .int()
  .min(cycleLengthRange.min, `Cycle length must be at least ${cycleLengthRange.min} days.`)
  .max(cycleLengthRange.max, `Cycle length must be at most ${cycleLengthRange.max} days.`);

export const periodLengthDaysSchema = z
  .number()
  .int()
  .min(periodLengthRange.min, `Period length must be at least ${periodLengthRange.min} days.`)
  .max(periodLengthRange.max, `Period length must be at most ${periodLengthRange.max} days.`);

export const latePeriodThresholdDaysSchema = z
  .number()
  .int()
  .min(
    latePeriodThresholdRange.min,
    `Delay notice threshold must be at least ${latePeriodThresholdRange.min} days.`
  )
  .max(
    latePeriodThresholdRange.max,
    `Delay notice threshold must be at most ${latePeriodThresholdRange.max} days.`
  );

export const wellbeingScoreSchema = z
  .number()
  .int()
  .min(1, "Score must be at least 1.")
  .max(5, "Score must be at most 5.");

export const painLevelSchema = z
  .number()
  .int()
  .min(0, "Pain level must be at least 0.")
  .max(5, "Pain level must be at most 5.");

export const flowIntensityValues = ["spotting", "light", "medium", "heavy"] as const;
export const dischargeValues = ["none", "dry", "sticky", "creamy", "watery"] as const;
export const conceptionProbabilityValues = ["low", "moderate", "peak"] as const;
export const symptomKeys = [
  "cramps",
  "headache",
  "nausea",
  "acne",
  "bloating",
  "breast_tenderness",
  "fatigue",
  "pms"
] as const;

export const flowIntensitySchema = z.enum(flowIntensityValues);
export const dischargeSchema = z.enum(dischargeValues);
export const symptomKeySchema = z.enum(symptomKeys);
export const cyclePhaseSchema = z.enum(cyclePhaseValues);
export const conceptionProbabilitySchema = z.enum(conceptionProbabilityValues);

const symptomKeysArraySchema = z
  .array(symptomKeySchema)
  .max(8, "No more than 8 symptom tags can be selected.")
  .refine((values) => hasUniqueValues(values), {
    message: "Symptom tags must be unique."
  });

export const healthResponseSchema = z.object({
  service: z.string(),
  status: z.literal("ok"),
  timestamp: z.string()
});

export const telegramAuthRequestSchema = z.object({
  initDataRaw: z.string().min(1)
});

export const feedbackMessageMaxLength = 2000;
export const feedbackRequestSchema = z.object({
  message: z.string().trim().min(1).max(feedbackMessageMaxLength)
});

export const telegramUserSchema = z.object({
  id: z.string().uuid(),
  telegramUserId: z.string(),
  username: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  languageCode: z.string().nullable()
});

export const telegramAuthResponseSchema = z.object({
  user: telegramUserSchema
});

export const userSettingsSchema = z.object({
  cycleLengthDays: cycleLengthDaysSchema,
  periodLengthDays: periodLengthDaysSchema,
  latePeriodThresholdDays: latePeriodThresholdDaysSchema,
  timezone: timezoneSchema,
  remindersEnabled: z.boolean(),
  onboardingCompleted: z.boolean()
});

export const meResponseSchema = z.object({
  user: telegramUserSchema,
  settings: userSettingsSchema
});

export const onboardingSetupRequestSchema = z.object({
  cycleLengthDays: cycleLengthDaysSchema,
  latestPeriodStart: isoDateSchema,
  periodLengthDays: periodLengthDaysSchema,
  timezone: timezoneSchema.optional()
});

export const updateUserSettingsRequestSchema = z.object({
  cycleLengthDays: cycleLengthDaysSchema.optional(),
  latestPeriodStart: isoDateSchema.optional(),
  periodLengthDays: periodLengthDaysSchema.optional(),
  latePeriodThresholdDays: latePeriodThresholdDaysSchema.optional(),
  timezone: timezoneSchema.optional(),
  remindersEnabled: z.boolean().optional()
});

export const updateUserSettingsResponseSchema = z.object({
  settings: userSettingsSchema
});

export const cycleSummarySchema = z.object({
  today: isoDateSchema,
  currentCycleDay: z.number().int().positive().nullable(),
  currentPhase: cyclePhaseSchema.nullable(),
  activePeriod: z.boolean(),
  predictedNextPeriodStart: isoDateSchema.nullable(),
  latestPeriodStart: isoDateSchema.nullable(),
  averageCycleLengthDays: cycleLengthDaysSchema,
  averagePeriodLengthDays: periodLengthDaysSchema,
  forecast: z.array(
    z.object({
      periodEnd: isoDateSchema,
      periodStart: isoDateSchema
    })
  ),
  onboardingCompleted: z.boolean()
});

export const cycleSummaryResponseSchema = z.object({
  summary: cycleSummarySchema
});

export const calendarQuerySchema = z.object({
  month: yearMonthSchema
});

export const calendarDaySchema = z.object({
  date: isoDateSchema,
  isToday: z.boolean(),
  isInCurrentCycle: z.boolean(),
  isLoggedPeriodDay: z.boolean(),
  isPredictedPeriodDay: z.boolean(),
  flowIntensity: flowIntensitySchema.nullable(),
  symptomKeys: symptomKeysArraySchema
});

export const calendarResponseSchema = z.object({
  month: yearMonthSchema,
  days: z.array(calendarDaySchema)
});

export const periodStartRequestSchema = z.object({
  date: isoDateSchema,
  flowIntensity: flowIntensitySchema.optional(),
  note: optionalNoteSchema
});

export const periodEndRequestSchema = z.object({
  date: isoDateSchema
});

export const periodLogRequestSchema = z.object({
  date: isoDateSchema,
  flowIntensity: flowIntensitySchema.optional(),
  note: optionalNoteSchema
});

export const periodLogEntrySchema = z.object({
  date: isoDateSchema,
  flowIntensity: flowIntensitySchema.nullable(),
  note: z.string().max(1000).nullable(),
  cycleStarted: z.boolean(),
  cycleEnded: z.boolean()
});

export const periodLogResponseSchema = z.object({
  entry: periodLogEntrySchema
});

export const dailyCheckinRequestSchema = z
  .object({
    mood: wellbeingScoreSchema.nullable().optional(),
    energy: wellbeingScoreSchema.nullable().optional(),
    painLevel: painLevelSchema.nullable().optional(),
    discharge: dischargeSchema.nullable().optional(),
    sleepQuality: wellbeingScoreSchema.nullable().optional(),
    note: nullableOptionalNoteSchema,
    symptomKeys: symptomKeysArraySchema.default([])
  })
  .refine(
    (value) =>
      "mood" in value ||
      "energy" in value ||
      "painLevel" in value ||
      "discharge" in value ||
      "sleepQuality" in value ||
      "note" in value ||
      value.symptomKeys.length > 0,
    {
      message: "At least one check-in value must be provided."
    }
  );

export const dailyCheckinEntrySchema = z.object({
  date: isoDateSchema,
  mood: wellbeingScoreSchema.nullable(),
  energy: wellbeingScoreSchema.nullable(),
  painLevel: painLevelSchema.nullable(),
  discharge: dischargeSchema.nullable(),
  sleepQuality: wellbeingScoreSchema.nullable(),
  note: z.string().max(1000).nullable(),
  symptomKeys: symptomKeysArraySchema
});

export const dailyCheckinResponseSchema = z.object({
  entry: dailyCheckinEntrySchema.nullable()
});

export const historyDaySchema = z.object({
  date: isoDateSchema,
  phase: cyclePhaseSchema.nullable(),
  checkin: dailyCheckinEntrySchema.nullable(),
  period: periodLogEntrySchema.nullable(),
  symptomKeys: symptomKeysArraySchema
});

export const historyQuerySchema = z.object({
  before: isoDateSchema.optional(),
  limit: z.coerce.number().int().min(1).max(12).optional()
});

export const historyPhaseSchema = z.object({
  phase: cyclePhaseSchema,
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  totalDays: z.number().int().positive(),
  averageFlowIntensityLevel: z.number().min(1).max(4).nullable(),
  averagePainLevel: painLevelSchema.nullable(),
  averageMood: wellbeingScoreSchema.nullable(),
  averageEnergy: wellbeingScoreSchema.nullable(),
  commonSymptoms: symptomKeysArraySchema,
  days: z.array(historyDaySchema)
});

export const historyCycleSchema = z.object({
  cycleId: z.string(),
  startedOn: isoDateSchema,
  endedOn: isoDateSchema.nullable(),
  cycleLengthDays: z.number().int().positive().nullable(),
  periodLengthDays: z.number().int().positive().nullable(),
  phases: z.array(historyPhaseSchema)
});

export const historyResponseSchema = z.object({
  cycles: z.array(historyCycleSchema),
  hasMore: z.boolean(),
  nextBefore: isoDateSchema.nullable()
});

function parseIsoDateValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getIsoDateInTimeZone(date: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      timeZone: timezone,
      year: "numeric"
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fall back to the existing UTC-based date if the stored timezone is invalid.
  }

  return formatIsoDate(date);
}

export function addDaysToIsoDate(date: string, days: number): string {
  const nextDate = parseIsoDateValue(date);

  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return formatIsoDate(nextDate);
}

export function differenceInDays(startDate: string, endDate: string): number {
  return Math.round(
    (parseIsoDateValue(endDate).getTime() - parseIsoDateValue(startDate).getTime()) /
      dayInMilliseconds
  );
}

function calculateAverageLength(
  lengths: readonly number[],
  fallback: number,
  range: { min: number; max: number }
): number {
  const validLengths = lengths.filter(
    (value) => Number.isInteger(value) && value >= range.min && value <= range.max
  );

  if (validLengths.length === 0) {
    return fallback;
  }

  return Math.round(validLengths.reduce((sum, value) => sum + value, 0) / validLengths.length);
}

export function calculateAverageCycleLength(
  cycleLengths: readonly number[],
  fallbackCycleLengthDays: number
): number {
  return calculateAverageLength(cycleLengths, fallbackCycleLengthDays, cycleLengthRange);
}

export function calculateAveragePeriodLength(
  periodLengths: readonly number[],
  fallbackPeriodLengthDays: number
): number {
  return calculateAverageLength(periodLengths, fallbackPeriodLengthDays, periodLengthRange);
}

export function calculateCurrentCycleDay(
  latestCycleStart: string | null,
  today: string
): number | null {
  if (!latestCycleStart) {
    return null;
  }

  const daysSinceCycleStart = differenceInDays(latestCycleStart, today);

  if (daysSinceCycleStart < 0) {
    return null;
  }

  return daysSinceCycleStart + 1;
}

export function predictNextPeriodStart(
  latestCycleStart: string | null,
  cycleLengths: readonly number[],
  fallbackCycleLengthDays: number
): string | null {
  if (!latestCycleStart) {
    return null;
  }

  return addDaysToIsoDate(
    latestCycleStart,
    calculateAverageCycleLength(cycleLengths, fallbackCycleLengthDays)
  );
}

export function resolveCyclePhase(
  cycleDay: number | null,
  cycleLengthDays: number,
  periodLengthDays: number
): CyclePhase | null {
  if (cycleDay === null || cycleDay < 1) {
    return null;
  }

  if (cycleDay <= periodLengthDays) {
    return "menstrual";
  }

  const ovulationStartDay = Math.min(
    cycleLengthDays,
    Math.max(periodLengthDays + 1, cycleLengthDays - 16)
  );
  const ovulationEndDay = Math.min(
    cycleLengthDays,
    Math.max(ovulationStartDay, cycleLengthDays - 12)
  );

  if (cycleDay < ovulationStartDay) {
    return "follicular";
  }

  if (cycleDay <= ovulationEndDay) {
    return "ovulatory";
  }

  return "luteal";
}

export function resolveOvulationDay(cycleLengthDays: number): number | null {
  if (
    !Number.isInteger(cycleLengthDays) ||
    cycleLengthDays < cycleLengthRange.min ||
    cycleLengthDays > cycleLengthRange.max
  ) {
    return null;
  }

  return cycleLengthDays - 14;
}

export function resolveConceptionProbability(
  cycleDay: number | null,
  cycleLengthDays: number,
  periodLengthDays: number
): ConceptionProbability | null {
  if (cycleDay === null || !Number.isInteger(cycleDay) || cycleDay < 1) {
    return null;
  }

  const ovulationDay = resolveOvulationDay(cycleLengthDays);

  if (ovulationDay === null) {
    return null;
  }

  if (
    !Number.isInteger(periodLengthDays) ||
    periodLengthDays < periodLengthRange.min ||
    periodLengthDays > periodLengthRange.max
  ) {
    return null;
  }

  if (cycleDay <= periodLengthDays) {
    return "low";
  }

  if (cycleDay === ovulationDay || cycleDay === ovulationDay - 1) {
    return "peak";
  }

  if (cycleDay >= ovulationDay - 4 && cycleDay <= ovulationDay + 1) {
    return "moderate";
  }

  return "low";
}

export function buildPeriodForecast({
  averageCycleLengthDays,
  averagePeriodLengthDays,
  fromDate,
  latestCycleStart,
  months = 6
}: {
  averageCycleLengthDays: number;
  averagePeriodLengthDays: number;
  fromDate: string;
  latestCycleStart: string | null;
  months?: number;
}): Array<{
  periodEnd: string;
  periodStart: string;
}> {
  if (
    !latestCycleStart ||
    !Number.isInteger(averageCycleLengthDays) ||
    !Number.isInteger(averagePeriodLengthDays) ||
    averageCycleLengthDays < 1 ||
    averagePeriodLengthDays < 1 ||
    months < 1
  ) {
    return [];
  }

  const horizon = addDaysToIsoDate(fromDate, months * 31);
  const forecast: Array<{ periodEnd: string; periodStart: string }> = [];
  let cursor = addDaysToIsoDate(latestCycleStart, averageCycleLengthDays);

  // If the next expected period is already overdue (its predicted start falls
  // before the forecast origin), roll it forward to `fromDate`. An overdue
  // period is "expected now", not in the past — so the forecast, and the
  // calendar/Today markers built from it, never highlight past predicted days.
  if (differenceInDays(cursor, fromDate) > 0) {
    cursor = fromDate;
  }

  while (differenceInDays(cursor, horizon) >= 0) {
    forecast.push({
      periodEnd: addDaysToIsoDate(cursor, averagePeriodLengthDays - 1),
      periodStart: cursor
    });
    cursor = addDaysToIsoDate(cursor, averageCycleLengthDays);
  }

  return forecast;
}

export function buildCyclePeriodWindows(
  periodDatesInput: readonly string[],
  fallbackPeriodLengthDays: number
): Array<{
  endedOn: string;
  startedOn: string;
}> {
  const periodDates = [...new Set(periodDatesInput)].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0
  );

  if (periodDates.length === 0) {
    return [];
  }

  const windows: Array<{ endedOn: string; startedOn: string }> = [];
  let currentStart = periodDates[0];
  let currentEnd = addDaysToIsoDate(currentStart, fallbackPeriodLengthDays - 1);

  for (const date of periodDates.slice(1)) {
    const nextAllowedDate = addDaysToIsoDate(currentEnd, 1);

    if (date <= nextAllowedDate) {
      if (date > currentEnd) {
        currentEnd = date;
      }

      continue;
    }

    windows.push({
      endedOn: currentEnd,
      startedOn: currentStart
    });

    currentStart = date;
    currentEnd = addDaysToIsoDate(currentStart, fallbackPeriodLengthDays - 1);
  }

  windows.push({
    endedOn: currentEnd,
    startedOn: currentStart
  });

  return windows;
}

export function resolvePeriodEnd(
  latestCycleStart: string | null,
  latestCycleEnd: string | null,
  fallbackPeriodLengthDays: number
): string | null {
  if (!latestCycleStart) {
    return null;
  }

  if (latestCycleEnd) {
    return latestCycleEnd;
  }

  return addDaysToIsoDate(latestCycleStart, fallbackPeriodLengthDays - 1);
}

export function isPeriodActive(
  today: string,
  latestCycleStart: string | null,
  latestCycleEnd: string | null,
  fallbackPeriodLengthDays: number
): boolean {
  const resolvedPeriodEnd = resolvePeriodEnd(
    latestCycleStart,
    latestCycleEnd,
    fallbackPeriodLengthDays
  );

  if (!latestCycleStart || !resolvedPeriodEnd) {
    return false;
  }

  return (
    differenceInDays(latestCycleStart, today) >= 0 &&
    differenceInDays(today, resolvedPeriodEnd) >= 0
  );
}

export type CalendarMonthDayMarkerInput = {
  date: string;
  flowIntensity?: FlowIntensity | null;
  isPeriodDay?: boolean;
  symptomKeys?: readonly SymptomKey[];
};

export type BuildCalendarMonthDaysInput = {
  month: string;
  today: string;
  currentCycleStart: string | null;
  currentPeriodEnd: string | null;
  predictedNextPeriodStart: string | null;
  predictedPeriodLengthDays: number;
  predictedPeriods?: ReadonlyArray<{
    periodEnd: string;
    periodStart: string;
  }>;
  periodDays?: readonly CalendarMonthDayMarkerInput[];
};

export function buildCalendarMonthDays({
  month,
  today,
  currentCycleStart,
  currentPeriodEnd,
  predictedNextPeriodStart,
  predictedPeriodLengthDays,
  predictedPeriods,
  periodDays = []
}: BuildCalendarMonthDaysInput): CalendarDay[] {
  const [year, monthNumber] = month.split("-").map(Number);
  const monthEnd = new Date(Date.UTC(year, monthNumber, 0));
  const loggedDaysByDate = new Map(periodDays.map((entry) => [entry.date, entry]));

  return Array.from({ length: monthEnd.getUTCDate() }, (_, index) => {
    const date = formatIsoDate(new Date(Date.UTC(year, monthNumber - 1, index + 1)));
    const loggedDay = loggedDaysByDate.get(date);
    const fallbackPredictedPeriods =
      predictedNextPeriodStart === null
        ? []
        : [
            {
              periodEnd: addDaysToIsoDate(predictedNextPeriodStart, predictedPeriodLengthDays - 1),
              periodStart: predictedNextPeriodStart
            }
          ];
    const currentPredictedPeriod =
      currentCycleStart && currentPeriodEnd
        ? [
            {
              periodEnd: currentPeriodEnd,
              periodStart: currentCycleStart
            }
          ]
        : [];
    const resolvedPredictedPeriods = [
      ...currentPredictedPeriod,
      ...(predictedPeriods ?? fallbackPredictedPeriods)
    ];
    const hasLoggedPeriod = loggedDay !== undefined && loggedDay.isPeriodDay !== false;
    const isPredictedPeriodDay =
      resolvedPredictedPeriods.some(
        (period) =>
          differenceInDays(period.periodStart, date) >= 0 &&
          differenceInDays(date, period.periodEnd) >= 0
      ) && !hasLoggedPeriod;

    const isInCurrentCycle =
      currentCycleStart !== null &&
      differenceInDays(currentCycleStart, date) >= 0 &&
      (predictedNextPeriodStart === null || differenceInDays(date, predictedNextPeriodStart) > 0);

    return calendarDaySchema.parse({
      date,
      flowIntensity: loggedDay?.flowIntensity ?? null,
      isInCurrentCycle,
      isLoggedPeriodDay: hasLoggedPeriod,
      isPredictedPeriodDay,
      isToday: date === today,
      symptomKeys: [...(loggedDay?.symptomKeys ?? [])]
    });
  });
}

export type CalendarDay = z.infer<typeof calendarDaySchema>;
export type CalendarResponse = z.infer<typeof calendarResponseSchema>;
export type ConceptionProbability = z.infer<typeof conceptionProbabilitySchema>;
export type CyclePhase = z.infer<typeof cyclePhaseSchema>;
export type CycleSummary = z.infer<typeof cycleSummarySchema>;
export type CycleSummaryResponse = z.infer<typeof cycleSummaryResponseSchema>;
export type DailyCheckinEntry = z.infer<typeof dailyCheckinEntrySchema>;
export type DailyCheckinRequest = z.infer<typeof dailyCheckinRequestSchema>;
export type DailyCheckinResponse = z.infer<typeof dailyCheckinResponseSchema>;
export type Discharge = z.infer<typeof dischargeSchema>;
export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;
export type FlowIntensity = z.infer<typeof flowIntensitySchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type HistoryCycle = z.infer<typeof historyCycleSchema>;
export type HistoryDay = z.infer<typeof historyDaySchema>;
export type HistoryPhase = z.infer<typeof historyPhaseSchema>;
export type HistoryResponse = z.infer<typeof historyResponseSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
export type OnboardingSetupRequest = z.infer<typeof onboardingSetupRequestSchema>;
export type PeriodLogEntry = z.infer<typeof periodLogEntrySchema>;
export type PeriodLogRequest = z.infer<typeof periodLogRequestSchema>;
export type PeriodLogResponse = z.infer<typeof periodLogResponseSchema>;
export type SymptomKey = z.infer<typeof symptomKeySchema>;
export type TelegramAuthRequest = z.infer<typeof telegramAuthRequestSchema>;
export type TelegramAuthResponse = z.infer<typeof telegramAuthResponseSchema>;
export type TelegramUser = z.infer<typeof telegramUserSchema>;
export type UpdateUserSettingsRequest = z.infer<typeof updateUserSettingsRequestSchema>;
export type UpdateUserSettingsResponse = z.infer<typeof updateUserSettingsResponseSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
