import { describe, expect, it } from "vitest";

import {
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
      cycleLengthDays: 10,
      latestPeriodStart: "2026-03-01",
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

  it("exports the expected symptom tags", () => {
    expect(symptomKeys).toContain("cramps");
    expect(symptomKeys).toContain("pms");
  });
});
