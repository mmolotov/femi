import { describe, expect, it } from "vitest";

import { healthResponseSchema, telegramAuthRequestSchema } from "./index.js";

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
});
