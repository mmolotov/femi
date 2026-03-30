import { z } from "zod";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const yearMonthPattern = /^\d{4}-\d{2}$/;
const dayInMilliseconds = 24 * 60 * 60 * 1000;

export const cycleLengthRange = {
  max: 45,
  min: 20
} as const;

export const periodLengthRange = {
  max: 10,
  min: 2
} as const;

function hasUniqueValues(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

const isoDateSchema = z.string().regex(isoDatePattern, "Expected a date in YYYY-MM-DD format.");
const yearMonthSchema = z.string().regex(yearMonthPattern, "Expected a month in YYYY-MM format.");
const timezoneSchema = z.string().trim().min(1).max(64);
const optionalNoteSchema = z.string().trim().max(1000).optional();

export const cycleLengthDaysSchema = z
  .number()
  .int()
  .min(cycleLengthRange.min, "Cycle length must be at least 20 days.")
  .max(cycleLengthRange.max, "Cycle length must be at most 45 days.");

export const periodLengthDaysSchema = z
  .number()
  .int()
  .min(periodLengthRange.min, "Period length must be at least 2 days.")
  .max(periodLengthRange.max, "Period length must be at most 10 days.");

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
  periodLengthDays: periodLengthDaysSchema,
  timezone: timezoneSchema.optional()
});

export const updateUserSettingsRequestSchema = z.object({
  cycleLengthDays: cycleLengthDaysSchema.optional(),
  periodLengthDays: periodLengthDaysSchema.optional(),
  timezone: timezoneSchema.optional(),
  remindersEnabled: z.boolean().optional()
});

export const updateUserSettingsResponseSchema = z.object({
  settings: userSettingsSchema
});

export const cycleSummarySchema = z.object({
  today: isoDateSchema,
  currentCycleDay: z.number().int().positive().nullable(),
  activePeriod: z.boolean(),
  predictedNextPeriodStart: isoDateSchema.nullable(),
  latestPeriodStart: isoDateSchema.nullable(),
  averageCycleLengthDays: cycleLengthDaysSchema,
  averagePeriodLengthDays: periodLengthDaysSchema,
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
  flowIntensity: flowIntensitySchema,
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
    mood: wellbeingScoreSchema.optional(),
    energy: wellbeingScoreSchema.optional(),
    painLevel: painLevelSchema.optional(),
    discharge: dischargeSchema.optional(),
    sleepQuality: wellbeingScoreSchema.optional(),
    note: optionalNoteSchema,
    symptomKeys: symptomKeysArraySchema.default([])
  })
  .refine(
    (value) =>
      value.mood !== undefined ||
      value.energy !== undefined ||
      value.painLevel !== undefined ||
      value.discharge !== undefined ||
      value.sleepQuality !== undefined ||
      value.note !== undefined ||
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
  checkin: dailyCheckinEntrySchema.nullable(),
  period: periodLogEntrySchema.nullable(),
  symptomKeys: symptomKeysArraySchema
});

export const historyQuerySchema = z.object({
  limit: z.number().int().min(1).max(90).optional()
});

export const historyResponseSchema = z.object({
  days: z.array(historyDaySchema)
});

function parseIsoDateValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
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
  symptomKeys?: readonly SymptomKey[];
};

export type BuildCalendarMonthDaysInput = {
  month: string;
  today: string;
  currentCycleStart: string | null;
  predictedNextPeriodStart: string | null;
  predictedPeriodLengthDays: number;
  periodDays?: readonly CalendarMonthDayMarkerInput[];
};

export function buildCalendarMonthDays({
  month,
  today,
  currentCycleStart,
  predictedNextPeriodStart,
  predictedPeriodLengthDays,
  periodDays = []
}: BuildCalendarMonthDaysInput): CalendarDay[] {
  const [year, monthNumber] = month.split("-").map(Number);
  const monthEnd = new Date(Date.UTC(year, monthNumber, 0));
  const loggedDaysByDate = new Map(periodDays.map((entry) => [entry.date, entry]));

  return Array.from({ length: monthEnd.getUTCDate() }, (_, index) => {
    const date = formatIsoDate(new Date(Date.UTC(year, monthNumber - 1, index + 1)));
    const loggedDay = loggedDaysByDate.get(date);
    const isPredictedPeriodDay =
      predictedNextPeriodStart !== null &&
      differenceInDays(predictedNextPeriodStart, date) >= 0 &&
      differenceInDays(predictedNextPeriodStart, date) < predictedPeriodLengthDays;

    const isInCurrentCycle =
      currentCycleStart !== null &&
      differenceInDays(currentCycleStart, date) >= 0 &&
      (predictedNextPeriodStart === null || differenceInDays(date, predictedNextPeriodStart) > 0);

    return calendarDaySchema.parse({
      date,
      flowIntensity: loggedDay?.flowIntensity ?? null,
      isInCurrentCycle,
      isLoggedPeriodDay: loggedDay !== undefined,
      isPredictedPeriodDay,
      isToday: date === today,
      symptomKeys: [...(loggedDay?.symptomKeys ?? [])]
    });
  });
}

export type CalendarDay = z.infer<typeof calendarDaySchema>;
export type CalendarResponse = z.infer<typeof calendarResponseSchema>;
export type CycleSummary = z.infer<typeof cycleSummarySchema>;
export type CycleSummaryResponse = z.infer<typeof cycleSummaryResponseSchema>;
export type DailyCheckinEntry = z.infer<typeof dailyCheckinEntrySchema>;
export type DailyCheckinRequest = z.infer<typeof dailyCheckinRequestSchema>;
export type DailyCheckinResponse = z.infer<typeof dailyCheckinResponseSchema>;
export type Discharge = z.infer<typeof dischargeSchema>;
export type FlowIntensity = z.infer<typeof flowIntensitySchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type HistoryDay = z.infer<typeof historyDaySchema>;
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
