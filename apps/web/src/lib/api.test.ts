// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import { createApiClient } from "./api";

describe("createApiClient", () => {
  it("extracts the error field from JSON API error responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: "Latest period start cannot be in the future." })
      })
    );

    const client = createApiClient("init-data");

    await expect(
      client.updateSettings({
        latestPeriodStart: "2030-01-01"
      })
    ).rejects.toThrow("Latest period start cannot be in the future.");
  });
});
