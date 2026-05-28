import type { Database } from "@femi/db";
import { describe, expect, it, vi } from "vitest";

import { pruneSnapshots, retentionCutoff } from "./retention.js";

describe("retentionCutoff", () => {
  it("subtracts the retention window in days", () => {
    const now = new Date("2026-05-26T12:00:00.000Z");
    expect(retentionCutoff(now, 30).toISOString()).toBe("2026-04-26T12:00:00.000Z");
  });
});

describe("pruneSnapshots", () => {
  function fakeDb(rowCount: number | null) {
    const execute = vi.fn().mockResolvedValue({ rowCount });
    return { db: { execute } as unknown as Database, execute };
  }

  it("returns the number of rows deleted", async () => {
    const { db, execute } = fakeDb(7);

    const deleted = await pruneSnapshots(db, 30, new Date("2026-05-26T12:00:00Z"));

    expect(deleted).toBe(7);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("is no-op safe when nothing is eligible (null rowCount -> 0)", async () => {
    const { db } = fakeDb(null);

    expect(await pruneSnapshots(db, 30)).toBe(0);
  });
});
