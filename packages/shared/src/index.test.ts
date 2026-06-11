import { describe, expect, it } from "vitest";

import {
  buildPeriodForecast,
  calendarQuerySchema,
  dailyCheckinRequestSchema,
  healthResponseSchema,
  onboardingSetupRequestSchema,
  symptomKeys,
  telegramAuthRequestSchema,
  updateUserSettingsRequestSchema
} from "./index.js";

describe("shared schemas", () => {
  it("accepts a valid health payload", () => {
    const payload = healthResponseSchema.parse({
      service: "api",
      status: "ok",
      timestamp: new Date().toISOString()
    });

    expect(payload.status).toBe("ok");
  });

  it("rejects an empty Telegram auth request", () => {
    const parsed = telegramAuthRequestSchema.safeParse({
      initDataRaw: ""
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts a valid onboarding payload", () => {
    const payload = onboardingSetupRequestSchema.parse({
      cycleLengthDays: 29,
      latestPeriodStart: "2026-03-01",
      periodLengthDays: 5,
      timezone: "Europe/Berlin"
    });

    expect(payload.cycleLengthDays).toBe(29);
  });

  it("rejects an invalid cycle length in onboarding", () => {
    const parsed = onboardingSetupRequestSchema.safeParse({
      cycleLengthDays: 9,
      latestPeriodStart: "2026-03-01",
      periodLengthDays: 5
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects an impossible onboarding date", () => {
    const parsed = onboardingSetupRequestSchema.safeParse({
      cycleLengthDays: 29,
      latestPeriodStart: "2026-02-31",
      periodLengthDays: 5
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts a daily check-in with scores, note, and symptoms", () => {
    const payload = dailyCheckinRequestSchema.parse({
      mood: 4,
      energy: 3,
      painLevel: 2,
      discharge: "creamy",
      sleepQuality: 5,
      note: "Mild cramps in the morning.",
      symptomKeys: ["cramps", "fatigue"]
    });

    expect(payload.symptomKeys).toEqual(["cramps", "fatigue"]);
  });

  it("accepts a daily check-in clear request with explicit nulls", () => {
    const payload = dailyCheckinRequestSchema.parse({
      mood: null,
      note: null,
      symptomKeys: []
    });

    expect(payload.mood).toBeNull();
    expect(payload.note).toBeNull();
  });

  it("rejects an empty daily check-in payload", () => {
    const parsed = dailyCheckinRequestSchema.safeParse({});

    expect(parsed.success).toBe(false);
  });

  it("rejects duplicate symptom keys in a daily check-in", () => {
    const parsed = dailyCheckinRequestSchema.safeParse({
      symptomKeys: ["cramps", "cramps"]
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts partial settings updates", () => {
    const payload = updateUserSettingsRequestSchema.parse({
      cycleLengthDays: 30
    });

    expect(payload.cycleLengthDays).toBe(30);
  });

  it("rejects an invalid calendar month query", () => {
    const parsed = calendarQuerySchema.safeParse({
      month: "2026-3"
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects an impossible calendar month query", () => {
    const parsed = calendarQuerySchema.safeParse({
      month: "2026-13"
    });

    expect(parsed.success).toBe(false);
  });

  it("exports the expected symptom tags", () => {
    expect(symptomKeys).toContain("cramps");
    expect(symptomKeys).toContain("pms");
  });
});

describe("buildPeriodForecast", () => {
  it("predicts the next period one average cycle after the latest start", () => {
    const forecast = buildPeriodForecast({
      averageCycleLengthDays: 28,
      averagePeriodLengthDays: 5,
      fromDate: "2026-01-15",
      latestCycleStart: "2026-01-01",
      months: 1
    });

    expect(forecast[0]).toEqual({ periodStart: "2026-01-29", periodEnd: "2026-02-02" });
  });

  it("rolls an overdue prediction forward to today instead of into the past", () => {
    // Cycle started 2026-01-01, averages 28 days, so the next start (2026-01-29)
    // is already overdue on 2026-01-31. The first window must not land in the
    // past; it rolls to today so no past day is flagged as a predicted period.
    const forecast = buildPeriodForecast({
      averageCycleLengthDays: 28,
      averagePeriodLengthDays: 5,
      fromDate: "2026-01-31",
      latestCycleStart: "2026-01-01",
      months: 1
    });

    expect(forecast[0]?.periodStart).toBe("2026-01-31");
    expect(forecast.every((entry) => entry.periodStart >= "2026-01-31")).toBe(true);
  });
});
