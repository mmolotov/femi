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

import { registerCycleRoutes } from "./cycle.js";

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

describe("cycle routes", () => {
  let app: FastifyInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it("returns a cycle summary for the authenticated user", async () => {
    app = Fastify();
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

    await registerCycleRoutes(app, {
      db: {
        select: vi.fn(() =>
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
        latestPeriodStart: "2026-03-01",
        onboardingCompleted: true,
        predictedNextPeriodStart: "2026-03-29"
      }
    });
  });

  it("rejects an invalid calendar query before hitting the database", async () => {
    app = Fastify();

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

  it("rejects an invalid daily check-in payload before auth lookup", async () => {
    app = Fastify();

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

  it("rejects starting a new period while a previous cycle is still open", async () => {
    app = Fastify();
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
    app = Fastify();
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
