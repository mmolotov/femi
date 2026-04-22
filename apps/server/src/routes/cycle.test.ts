import fastifyRateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { AuthContextErrorMock, resolveAuthenticatedUserMock } = vi.hoisted(() => {
  class AuthContextErrorMock extends Error {
    readonly statusCode: number;

    constructor(message: string, statusCode: number) {
      super(message);
      this.name = "AuthContextError";
      this.statusCode = statusCode;
    }
  }

  return {
    AuthContextErrorMock,
    resolveAuthenticatedUserMock: vi.fn()
  };
});

vi.mock("../lib/auth-context.js", () => ({
  AuthContextError: AuthContextErrorMock,
  resolveAuthenticatedUser: resolveAuthenticatedUserMock
}));

import { API_RATE_LIMIT_MAX, API_RATE_LIMIT_WINDOW_MS } from "../lib/rate-limit.js";
import { registerCycleRoutes } from "./cycle.js";

const RealDate = Date;

function setMockSystemTime(isoTimestamp: string): void {
  const fixedDate = new RealDate(isoTimestamp);

  global.Date = class extends RealDate {
    constructor(value?: string | number | Date) {
      if (arguments.length === 0) {
        super(fixedDate.toISOString());
        return;
      }

      super(value as string | number);
    }

    static now(): number {
      return fixedDate.getTime();
    }

    static parse = RealDate.parse;
    static UTC = RealDate.UTC;
  } as DateConstructor;
}

function createDatabaseDate(
  utcTimestamp: string,
  localDate?: { day: number; month: number; year: number }
): Date {
  class DatabaseDate extends Date {
    override getDate(): number {
      return localDate?.day ?? super.getDate();
    }

    override getFullYear(): number {
      return localDate?.year ?? super.getFullYear();
    }

    override getMonth(): number {
      return (localDate?.month ?? super.getMonth() + 1) - 1;
    }
  }

  return new DatabaseDate(utcTimestamp);
}

function createSelectBuilder<T>(rows: T[]) {
  const query = {
    limit: vi.fn(async () => rows),
    orderBy: vi.fn(() => query),
    then<TResult1 = T[], TResult2 = never>(
      onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) {
      return Promise.resolve(rows).then(onfulfilled, onrejected);
    }
  };

  return {
    from: vi.fn(() => ({
      where: vi.fn(() => query)
    }))
  };
}

async function createTestApp(): Promise<FastifyInstance> {
  const app = Fastify();

  await app.register(fastifyRateLimit, {
    global: true,
    hook: "preHandler",
    max: API_RATE_LIMIT_MAX,
    timeWindow: API_RATE_LIMIT_WINDOW_MS
  });

  return app;
}

describe("cycle routes", () => {
  let app: FastifyInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    global.Date = RealDate;

    if (app) {
      await app.close();
    }
  });

  it("returns a cycle summary for the authenticated user", async () => {
    app = await createTestApp();
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 28,
        onboardingCompleted: true,
        periodLengthDays: 5,
        remindersEnabled: true,
        timezone: "UTC"
      },
      user: {
        firstName: "Ada",
        id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
        languageCode: "en",
        lastName: null,
        telegramUserId: "10001",
        username: "ada"
      }
    });

    const selectMock = vi
      .fn()
      .mockImplementationOnce(() =>
        createSelectBuilder([
          {
            endedOn: new Date("2026-03-05T00:00:00.000Z"),
            id: "cycle-2",
            startedOn: new Date("2026-03-01T00:00:00.000Z")
          },
          {
            endedOn: new Date("2026-02-05T00:00:00.000Z"),
            id: "cycle-1",
            startedOn: new Date("2026-02-01T00:00:00.000Z")
          }
        ])
      )
      .mockImplementationOnce(() =>
        createSelectBuilder([
          {
            flowLevel: 2,
            happenedOn: new Date("2026-03-01T00:00:00.000Z"),
            notes: null
          }
        ])
      );

    await registerCycleRoutes(app, {
      db: {
        select: selectMock
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "GET",
      url: "/api/cycle/summary"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      summary: {
        averageCycleLengthDays: 28,
        averagePeriodLengthDays: 5,
        currentPhase: expect.any(String),
        forecast: expect.any(Array),
        latestPeriodStart: "2026-03-01",
        onboardingCompleted: true,
        predictedNextPeriodStart: "2026-03-29"
      }
    });
  });

  it("ignores malformed stored dates when building the cycle summary", async () => {
    app = await createTestApp();
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 28,
        onboardingCompleted: true,
        periodLengthDays: 5,
        remindersEnabled: true,
        timezone: "UTC"
      },
      user: {
        firstName: "Ada",
        id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
        languageCode: "en",
        lastName: null,
        telegramUserId: "10001",
        username: "ada"
      }
    });

    const selectMock = vi
      .fn()
      .mockImplementationOnce(() =>
        createSelectBuilder([
          {
            endedOn: null,
            id: "cycle-invalid",
            startedOn: new Date("invalid")
          },
          {
            endedOn: new Date("2026-03-05T00:00:00.000Z"),
            id: "cycle-valid",
            startedOn: new Date("2026-03-01T00:00:00.000Z")
          }
        ])
      )
      .mockImplementationOnce(() =>
        createSelectBuilder([
          {
            flowLevel: 2,
            happenedOn: new Date("invalid"),
            notes: null
          },
          {
            flowLevel: 3,
            happenedOn: new Date("2026-03-01T00:00:00.000Z"),
            notes: null
          }
        ])
      );

    await registerCycleRoutes(app, {
      db: {
        select: selectMock
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "GET",
      url: "/api/cycle/summary"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      summary: {
        latestPeriodStart: "2026-03-01",
        onboardingCompleted: true
      }
    });
  });

  it("preserves stored SQL dates even when local timezone accessors drift west of UTC", async () => {
    app = await createTestApp();
    setMockSystemTime("2026-04-13T12:00:00.000Z");
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 20,
        onboardingCompleted: true,
        periodLengthDays: 2,
        remindersEnabled: true,
        timezone: "Europe/Belgrade"
      },
      user: {
        firstName: "Ada",
        id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
        languageCode: "en",
        lastName: null,
        telegramUserId: "10001",
        username: "ada"
      }
    });

    const selectMock = vi
      .fn()
      .mockImplementationOnce(() =>
        createSelectBuilder([
          {
            endedOn: null,
            id: "cycle-1",
            startedOn: createDatabaseDate("2026-04-01T00:00:00.000Z", {
              day: 31,
              month: 3,
              year: 2026
            })
          }
        ])
      )
      .mockImplementationOnce(() =>
        createSelectBuilder([
          {
            flowLevel: null,
            happenedOn: createDatabaseDate("2026-04-01T00:00:00.000Z", {
              day: 31,
              month: 3,
              year: 2026
            }),
            notes: null
          },
          {
            flowLevel: null,
            happenedOn: createDatabaseDate("2026-04-02T00:00:00.000Z", {
              day: 1,
              month: 4,
              year: 2026
            }),
            notes: null
          }
        ])
      )
      .mockImplementationOnce(() =>
        createSelectBuilder([
          {
            endedOn: null,
            id: "cycle-1",
            startedOn: createDatabaseDate("2026-04-01T00:00:00.000Z", {
              day: 31,
              month: 3,
              year: 2026
            })
          }
        ])
      )
      .mockImplementationOnce(() =>
        createSelectBuilder([
          {
            flowLevel: null,
            happenedOn: createDatabaseDate("2026-04-01T00:00:00.000Z", {
              day: 31,
              month: 3,
              year: 2026
            }),
            notes: null
          },
          {
            flowLevel: null,
            happenedOn: createDatabaseDate("2026-04-02T00:00:00.000Z", {
              day: 1,
              month: 4,
              year: 2026
            }),
            notes: null
          }
        ])
      )
      .mockImplementationOnce(() =>
        createSelectBuilder([
          {
            flowLevel: null,
            happenedOn: createDatabaseDate("2026-04-01T00:00:00.000Z", {
              day: 31,
              month: 3,
              year: 2026
            })
          },
          {
            flowLevel: null,
            happenedOn: createDatabaseDate("2026-04-02T00:00:00.000Z", {
              day: 1,
              month: 4,
              year: 2026
            })
          }
        ])
      )
      .mockImplementationOnce(() => createSelectBuilder([]));

    await registerCycleRoutes(app, {
      db: {
        select: selectMock
      } as never,
      env: {} as never
    });

    const summaryResponse = await app.inject({
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "GET",
      url: "/api/cycle/summary"
    });

    expect(summaryResponse.statusCode).toBe(200);
    expect(summaryResponse.json()).toMatchObject({
      summary: {
        currentCycleDay: 13,
        latestPeriodStart: "2026-04-01",
        onboardingCompleted: true
      }
    });

    const calendarResponse = await app.inject({
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "GET",
      url: "/api/calendar?month=2026-04"
    });

    expect(calendarResponse.statusCode).toBe(200);
    expect(calendarResponse.json()).toMatchObject({
      days: expect.arrayContaining([
        expect.objectContaining({
          date: "2026-04-01",
          isLoggedPeriodDay: true
        }),
        expect.objectContaining({
          date: "2026-04-02",
          isLoggedPeriodDay: true
        })
      ])
    });
  });

  it("rebuilds missing cycles from persisted period logs before returning the summary", async () => {
    app = await createTestApp();
    setMockSystemTime("2026-04-13T12:00:00.000Z");
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 20,
        onboardingCompleted: true,
        periodLengthDays: 2,
        remindersEnabled: true,
        timezone: "Europe/Belgrade"
      },
      user: {
        firstName: "Ada",
        id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
        languageCode: "en",
        lastName: null,
        telegramUserId: "10001",
        username: "ada"
      }
    });

    const deleteWhereMock = vi.fn().mockResolvedValue(undefined);
    const cycleValuesMock = vi.fn().mockResolvedValue(undefined);
    const selectMock = vi
      .fn()
      .mockImplementationOnce(() => createSelectBuilder([]))
      .mockImplementationOnce(() =>
        createSelectBuilder([
          {
            flowLevel: 2,
            happenedOn: new Date("2026-04-01T00:00:00.000Z"),
            notes: null
          },
          {
            flowLevel: 2,
            happenedOn: new Date("2026-04-02T00:00:00.000Z"),
            notes: null
          }
        ])
      )
      .mockImplementationOnce(() =>
        createSelectBuilder([
          {
            endedOn: null,
            id: "cycle-1",
            startedOn: new Date("2026-04-01T00:00:00.000Z")
          }
        ])
      );

    await registerCycleRoutes(app, {
      db: {
        delete: vi.fn(() => ({
          where: deleteWhereMock
        })),
        insert: vi.fn(() => ({
          values: cycleValuesMock
        })),
        select: selectMock
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "GET",
      url: "/api/cycle/summary"
    });

    expect(response.statusCode).toBe(200);
    expect(deleteWhereMock).toHaveBeenCalledTimes(1);
    expect(cycleValuesMock).toHaveBeenCalledWith([
      expect.objectContaining({
        endedOn: null,
        predicted: false,
        userId: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0"
      })
    ]);
    expect(response.json()).toMatchObject({
      summary: {
        currentCycleDay: 13,
        latestPeriodStart: "2026-04-01",
        onboardingCompleted: true
      }
    });
  });

  it("rejects an invalid calendar query before hitting the database", async () => {
    app = await createTestApp();

    await registerCycleRoutes(app, {
      db: {
        select: vi.fn()
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/calendar?month=2026-3"
    });

    expect(response.statusCode).toBe(400);
    expect(resolveAuthenticatedUserMock).not.toHaveBeenCalled();
  });

  it("returns the most recent six months of history and exposes an older-page cursor", async () => {
    app = await createTestApp();
    setMockSystemTime("2026-04-21T12:00:00.000Z");
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 28,
        onboardingCompleted: true,
        periodLengthDays: 5,
        remindersEnabled: true,
        timezone: "UTC"
      },
      user: {
        firstName: "Ada",
        id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
        languageCode: "en",
        lastName: null,
        telegramUserId: "10001",
        username: "ada"
      }
    });

    const cycleRows = [
      {
        endedOn: new Date("2025-09-05T00:00:00.000Z"),
        id: "cycle-1",
        startedOn: new Date("2025-09-01T00:00:00.000Z")
      },
      {
        endedOn: new Date("2025-10-05T00:00:00.000Z"),
        id: "cycle-2",
        startedOn: new Date("2025-10-01T00:00:00.000Z")
      },
      {
        endedOn: new Date("2025-11-05T00:00:00.000Z"),
        id: "cycle-3",
        startedOn: new Date("2025-11-01T00:00:00.000Z")
      },
      {
        endedOn: new Date("2025-12-05T00:00:00.000Z"),
        id: "cycle-4",
        startedOn: new Date("2025-12-01T00:00:00.000Z")
      },
      {
        endedOn: new Date("2026-01-05T00:00:00.000Z"),
        id: "cycle-5",
        startedOn: new Date("2026-01-01T00:00:00.000Z")
      },
      {
        endedOn: new Date("2026-02-05T00:00:00.000Z"),
        id: "cycle-6",
        startedOn: new Date("2026-02-01T00:00:00.000Z")
      },
      {
        endedOn: new Date("2026-03-05T00:00:00.000Z"),
        id: "cycle-7",
        startedOn: new Date("2026-03-01T00:00:00.000Z")
      },
      {
        endedOn: null,
        id: "cycle-8",
        startedOn: new Date("2026-04-01T00:00:00.000Z")
      }
    ];

    const selectMock = vi
      .fn()
      .mockImplementationOnce(() => createSelectBuilder([]))
      .mockImplementationOnce(() => createSelectBuilder([]))
      .mockImplementationOnce(() => createSelectBuilder([]))
      .mockImplementationOnce(() => createSelectBuilder(cycleRows));

    await registerCycleRoutes(app, {
      db: {
        select: selectMock
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "GET",
      url: "/api/history"
    });

    expect(response.statusCode).toBe(200);

    const payload = response.json();

    expect(payload.hasMore).toBe(true);
    expect(payload.nextBefore).toBe("2025-10-01");
    expect(payload.cycles).toHaveLength(7);
    expect(payload.cycles[0]).toMatchObject({
      cycleId: "cycle-8",
      startedOn: "2026-04-01"
    });
    expect(payload.cycles.at(-1)).toMatchObject({
      cycleId: "cycle-2",
      startedOn: "2025-10-01"
    });
  });

  it("returns older history when queried before the oldest loaded cycle", async () => {
    app = await createTestApp();
    setMockSystemTime("2026-04-21T12:00:00.000Z");
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 28,
        onboardingCompleted: true,
        periodLengthDays: 5,
        remindersEnabled: true,
        timezone: "UTC"
      },
      user: {
        firstName: "Ada",
        id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
        languageCode: "en",
        lastName: null,
        telegramUserId: "10001",
        username: "ada"
      }
    });

    const cycleRows = [
      {
        endedOn: new Date("2025-09-05T00:00:00.000Z"),
        id: "cycle-1",
        startedOn: new Date("2025-09-01T00:00:00.000Z")
      },
      {
        endedOn: new Date("2025-10-05T00:00:00.000Z"),
        id: "cycle-2",
        startedOn: new Date("2025-10-01T00:00:00.000Z")
      },
      {
        endedOn: new Date("2025-11-05T00:00:00.000Z"),
        id: "cycle-3",
        startedOn: new Date("2025-11-01T00:00:00.000Z")
      },
      {
        endedOn: new Date("2025-12-05T00:00:00.000Z"),
        id: "cycle-4",
        startedOn: new Date("2025-12-01T00:00:00.000Z")
      },
      {
        endedOn: new Date("2026-01-05T00:00:00.000Z"),
        id: "cycle-5",
        startedOn: new Date("2026-01-01T00:00:00.000Z")
      },
      {
        endedOn: new Date("2026-02-05T00:00:00.000Z"),
        id: "cycle-6",
        startedOn: new Date("2026-02-01T00:00:00.000Z")
      },
      {
        endedOn: new Date("2026-03-05T00:00:00.000Z"),
        id: "cycle-7",
        startedOn: new Date("2026-03-01T00:00:00.000Z")
      },
      {
        endedOn: null,
        id: "cycle-8",
        startedOn: new Date("2026-04-01T00:00:00.000Z")
      }
    ];

    const selectMock = vi
      .fn()
      .mockImplementationOnce(() => createSelectBuilder([]))
      .mockImplementationOnce(() => createSelectBuilder([]))
      .mockImplementationOnce(() => createSelectBuilder([]))
      .mockImplementationOnce(() => createSelectBuilder(cycleRows));

    await registerCycleRoutes(app, {
      db: {
        select: selectMock
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "GET",
      url: "/api/history?before=2025-10-01"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      hasMore: false,
      nextBefore: null,
      cycles: [
        expect.objectContaining({
          cycleId: "cycle-1",
          startedOn: "2025-09-01"
        })
      ]
    });
  });

  it("honors an explicit history limit when provided", async () => {
    app = await createTestApp();
    setMockSystemTime("2026-04-21T12:00:00.000Z");
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 28,
        onboardingCompleted: true,
        periodLengthDays: 5,
        remindersEnabled: true,
        timezone: "UTC"
      },
      user: {
        firstName: "Ada",
        id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
        languageCode: "en",
        lastName: null,
        telegramUserId: "10001",
        username: "ada"
      }
    });

    const cycleRows = [
      {
        endedOn: new Date("2026-01-05T00:00:00.000Z"),
        id: "cycle-1",
        startedOn: new Date("2026-01-01T00:00:00.000Z")
      },
      {
        endedOn: new Date("2026-02-05T00:00:00.000Z"),
        id: "cycle-2",
        startedOn: new Date("2026-02-01T00:00:00.000Z")
      },
      {
        endedOn: new Date("2026-03-05T00:00:00.000Z"),
        id: "cycle-3",
        startedOn: new Date("2026-03-01T00:00:00.000Z")
      }
    ];

    const selectMock = vi
      .fn()
      .mockImplementationOnce(() => createSelectBuilder([]))
      .mockImplementationOnce(() => createSelectBuilder([]))
      .mockImplementationOnce(() => createSelectBuilder([]))
      .mockImplementationOnce(() => createSelectBuilder(cycleRows));

    await registerCycleRoutes(app, {
      db: {
        select: selectMock
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "GET",
      url: "/api/history?limit=1"
    });

    expect(response.statusCode).toBe(200);

    const payload = response.json();

    expect(payload.cycles).toHaveLength(1);
    expect(payload.cycles[0]).toMatchObject({
      cycleId: "cycle-3",
      startedOn: "2026-03-01"
    });
    expect(payload.hasMore).toBe(true);
    expect(payload.nextBefore).toBe("2026-03-01");
  });

  it("rejects an invalid history query before auth lookup", async () => {
    app = await createTestApp();

    await registerCycleRoutes(app, {
      db: {
        select: vi.fn()
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/history?limit=abc"
    });

    expect(response.statusCode).toBe(400);
    expect(resolveAuthenticatedUserMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid daily check-in payload before auth lookup", async () => {
    app = await createTestApp();

    await registerCycleRoutes(app, {
      db: {
        select: vi.fn()
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      body: {},
      method: "PUT",
      url: "/api/checkins/2026-03-04"
    });

    expect(response.statusCode).toBe(400);
    expect(resolveAuthenticatedUserMock).not.toHaveBeenCalled();
  });

  it("rejects an impossible period-log date before auth lookup", async () => {
    app = await createTestApp();

    await registerCycleRoutes(app, {
      db: {
        select: vi.fn()
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      body: {
        date: "2026-02-31"
      },
      method: "POST",
      url: "/api/period/log"
    });

    expect(response.statusCode).toBe(400);
    expect(resolveAuthenticatedUserMock).not.toHaveBeenCalled();
  });

  it("rejects future cycle write requests using the user timezone", async () => {
    app = await createTestApp();
    setMockSystemTime("2026-03-02T00:30:00.000Z");
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 28,
        onboardingCompleted: true,
        periodLengthDays: 5,
        remindersEnabled: true,
        timezone: "America/Los_Angeles"
      },
      user: {
        firstName: "Ada",
        id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
        languageCode: "en",
        lastName: null,
        telegramUserId: "10001",
        username: "ada"
      }
    });

    await registerCycleRoutes(app, {
      db: {
        select: vi.fn()
      } as never,
      env: {} as never
    });

    const requests = [
      app.inject({
        body: {
          mood: 3
        },
        headers: {
          "x-telegram-init-data": "stub"
        },
        method: "PUT",
        url: "/api/checkins/2026-03-02"
      }),
      app.inject({
        body: {
          date: "2026-03-02"
        },
        headers: {
          "x-telegram-init-data": "stub"
        },
        method: "POST",
        url: "/api/period/log"
      }),
      app.inject({
        body: {
          date: "2026-03-02"
        },
        headers: {
          "x-telegram-init-data": "stub"
        },
        method: "POST",
        url: "/api/period/start"
      }),
      app.inject({
        body: {
          date: "2026-03-02"
        },
        headers: {
          "x-telegram-init-data": "stub"
        },
        method: "POST",
        url: "/api/period/end"
      }),
      app.inject({
        headers: {
          "x-telegram-init-data": "stub"
        },
        method: "DELETE",
        url: "/api/period/log/2026-03-02"
      })
    ];

    const responses = await Promise.all(requests);

    expect(responses.map((response) => response.statusCode)).toEqual([400, 400, 400, 400, 400]);
    expect(resolveAuthenticatedUserMock).toHaveBeenCalledTimes(5);
  });

  it("uses timezone-aware today in the cycle summary", async () => {
    app = await createTestApp();
    setMockSystemTime("2026-03-02T00:30:00.000Z");
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 28,
        onboardingCompleted: true,
        periodLengthDays: 5,
        remindersEnabled: true,
        timezone: "America/Los_Angeles"
      },
      user: {
        firstName: "Ada",
        id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
        languageCode: "en",
        lastName: null,
        telegramUserId: "10001",
        username: "ada"
      }
    });

    const selectMock = vi
      .fn()
      .mockImplementationOnce(() =>
        createSelectBuilder([
          {
            endedOn: new Date("2026-03-05T00:00:00.000Z"),
            id: "cycle-2",
            startedOn: new Date("2026-03-01T00:00:00.000Z")
          }
        ])
      )
      .mockImplementationOnce(() =>
        createSelectBuilder([
          {
            flowLevel: 2,
            happenedOn: new Date("2026-03-01T00:00:00.000Z"),
            notes: null
          }
        ])
      );

    await registerCycleRoutes(app, {
      db: {
        select: selectMock
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "GET",
      url: "/api/cycle/summary"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      summary: {
        today: "2026-03-01"
      }
    });
  });

  it("removes a persisted check-in when all saved values are explicitly cleared", async () => {
    app = await createTestApp();
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 28,
        onboardingCompleted: true,
        periodLengthDays: 5,
        remindersEnabled: true,
        timezone: "UTC"
      },
      user: {
        firstName: "Ada",
        id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
        languageCode: "en",
        lastName: null,
        telegramUserId: "10001",
        username: "ada"
      }
    });

    const deleteWhereMock = vi.fn().mockResolvedValue(undefined);
    const transaction = {
      delete: vi.fn(() => ({
        where: deleteWhereMock
      })),
      insert: vi.fn(),
      select: vi.fn(() =>
        createSelectBuilder([
          {
            discharge: null,
            energy: null,
            mood: 4,
            note: "Existing note",
            painLevel: null,
            sleepQuality: null
          }
        ])
      )
    };

    await registerCycleRoutes(app, {
      db: {
        transaction: vi.fn(async (callback) => callback(transaction))
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      body: {
        mood: null,
        note: null,
        symptomKeys: []
      },
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "PUT",
      url: "/api/checkins/2026-03-04"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      entry: null
    });
    expect(transaction.insert).not.toHaveBeenCalled();
    expect(transaction.delete).toHaveBeenCalledTimes(2);
  });

  it("rejects starting a new period while a previous cycle is still open", async () => {
    app = await createTestApp();
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 28,
        onboardingCompleted: true,
        periodLengthDays: 5,
        remindersEnabled: true,
        timezone: "UTC"
      },
      user: {
        firstName: "Ada",
        id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
        languageCode: "en",
        lastName: null,
        telegramUserId: "10001",
        username: "ada"
      }
    });

    const transaction = {
      select: vi.fn(() =>
        createSelectBuilder([
          {
            endedOn: null,
            id: "cycle-open",
            startedOn: new Date("2026-03-01T00:00:00.000Z")
          }
        ])
      )
    };

    await registerCycleRoutes(app, {
      db: {
        transaction: vi.fn(async (callback) => callback(transaction))
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      body: {
        date: "2026-03-05"
      },
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "POST",
      url: "/api/period/start"
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: expect.stringContaining("active period")
    });
  });

  it("rejects ending a period when no open cycle exists", async () => {
    app = await createTestApp();
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 28,
        onboardingCompleted: true,
        periodLengthDays: 5,
        remindersEnabled: true,
        timezone: "UTC"
      },
      user: {
        firstName: "Ada",
        id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
        languageCode: "en",
        lastName: null,
        telegramUserId: "10001",
        username: "ada"
      }
    });

    const transaction = {
      select: vi.fn(() => createSelectBuilder([]))
    };

    await registerCycleRoutes(app, {
      db: {
        transaction: vi.fn(async (callback) => callback(transaction))
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      body: {
        date: "2026-03-05"
      },
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "POST",
      url: "/api/period/end"
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: expect.stringContaining("No started period")
    });
  });
});
