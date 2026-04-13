import { describe, expect, it } from "vitest";

import {
  contraceptionLogs,
  cycles,
  dailyCheckins,
  notes,
  periodLogs,
  symptomLogs
} from "./schema.js";

describe("database schema", () => {
  it("maps persisted calendar date columns to SQL date types", () => {
    expect(cycles.startedOn.getSQLType()).toBe("date");
    expect(cycles.endedOn.getSQLType()).toBe("date");
    expect(periodLogs.happenedOn.getSQLType()).toBe("date");
    expect(dailyCheckins.happenedOn.getSQLType()).toBe("date");
    expect(symptomLogs.happenedOn.getSQLType()).toBe("date");
    expect(notes.happenedOn.getSQLType()).toBe("date");
    expect(contraceptionLogs.happenedOn.getSQLType()).toBe("date");
  });
});
