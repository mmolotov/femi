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
import { registerMeRoutes } from "./me.js";

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

describe("me routes", () => {
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

  it("returns the authenticated user profile", async () => {
    app = await createTestApp();
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 29,
        onboardingCompleted: false,
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

    await registerMeRoutes(app, {
      db: {} as never,
      env: {} as never
    });

    const response = await app.inject({
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "GET",
      url: "/api/me"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      settings: {
        cycleLengthDays: 29,
        onboardingCompleted: false
      },
      user: {
        firstName: "Ada",
        telegramUserId: "10001",
        username: "ada"
      }
    });
  });

  it("deletes only the authenticated user account", async () => {
    const returningMock = vi
      .fn()
      .mockResolvedValue([{ id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0" }]);
    const whereMock = vi.fn(() => ({
      returning: returningMock
    }));
    const deleteMock = vi.fn(() => ({
      where: whereMock
    }));

    app = await createTestApp();
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 29,
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

    await registerMeRoutes(app, {
      db: {
        delete: deleteMock
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "DELETE",
      url: "/api/me"
    });

    expect(response.statusCode).toBe(204);
    expect(deleteMock).toHaveBeenCalledTimes(1);
    const deleteFilter = whereMock.mock.calls.at(0)?.at(0);

    expect(deleteFilter).toBeDefined();
    expect(deleteFilter).toMatchObject({
      queryChunks: expect.arrayContaining([
        expect.objectContaining({ value: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0" })
      ])
    });
    expect(deleteFilter).not.toMatchObject({
      queryChunks: expect.arrayContaining([expect.objectContaining({ value: "other-user-id" })])
    });
  });

  it("rejects unauthenticated account deletion", async () => {
    app = await createTestApp();
    resolveAuthenticatedUserMock.mockRejectedValue(new AuthContextErrorMock("Unauthorized", 401));

    await registerMeRoutes(app, {
      db: {} as never,
      env: {} as never
    });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/me"
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: "Unauthorized"
    });
  });

  it("rate limits repeated account deletion attempts", async () => {
    const returningMock = vi
      .fn()
      .mockResolvedValue([{ id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0" }]);
    const whereMock = vi.fn(() => ({
      returning: returningMock
    }));
    const deleteMock = vi.fn(() => ({
      where: whereMock
    }));

    app = await createTestApp();
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 29,
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

    await registerMeRoutes(app, {
      db: {
        delete: deleteMock
      } as never,
      env: {} as never
    });

    for (let index = 0; index < 10; index += 1) {
      const response = await app.inject({
        headers: {
          "x-telegram-init-data": "stub"
        },
        method: "DELETE",
        remoteAddress: "127.0.0.1",
        url: "/api/me"
      });

      expect(response.statusCode).toBe(204);
    }

    const blockedResponse = await app.inject({
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "DELETE",
      remoteAddress: "127.0.0.1",
      url: "/api/me"
    });

    expect(blockedResponse.statusCode).toBe(429);
  });

  it("updates settings and marks onboarding complete", async () => {
    const returningMock = vi.fn().mockResolvedValue([
      {
        cycleLengthDays: 30,
        onboardingCompleted: true,
        periodLengthDays: 6,
        remindersEnabled: true,
        timezone: "Europe/Berlin"
      }
    ]);
    const whereMock = vi.fn(() => ({
      returning: returningMock
    }));
    const setMock = vi.fn(() => ({
      where: whereMock
    }));
    const updateMock = vi.fn(() => ({
      set: setMock
    }));
    const transactionMock = vi.fn(async (callback) =>
      callback({
        update: updateMock
      })
    );

    app = await createTestApp();
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 28,
        onboardingCompleted: false,
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

    await registerMeRoutes(app, {
      db: {
        transaction: transactionMock
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      body: {
        cycleLengthDays: 30,
        periodLengthDays: 6,
        timezone: "Europe/Berlin"
      },
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "PATCH",
      url: "/api/me/settings"
    });

    expect(response.statusCode).toBe(200);
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        cycleLengthDays: 30,
        onboardingCompleted: true,
        periodLengthDays: 6,
        timezone: "Europe/Berlin"
      })
    );
    expect(response.json()).toMatchObject({
      settings: {
        cycleLengthDays: 30,
        onboardingCompleted: true,
        periodLengthDays: 6,
        timezone: "Europe/Berlin"
      }
    });
  });

  it("seeds onboarding period days up to today", async () => {
    const returningMock = vi.fn().mockResolvedValue([
      {
        cycleLengthDays: 30,
        onboardingCompleted: true,
        periodLengthDays: 6,
        remindersEnabled: true,
        timezone: "Europe/Berlin"
      }
    ]);
    const periodConflictUpdateMock = vi.fn().mockResolvedValue(undefined);
    const periodInsertMock = vi.fn(() => ({
      onConflictDoUpdate: periodConflictUpdateMock
    }));
    const cycleConflictUpdateMock = vi.fn().mockResolvedValue(undefined);
    const cycleInsertMock = vi.fn(() => ({
      onConflictDoUpdate: cycleConflictUpdateMock
    }));
    const whereMock = vi.fn(() => ({
      returning: returningMock
    }));
    const setMock = vi.fn(() => ({
      where: whereMock
    }));
    const updateMock = vi.fn(() => ({
      set: setMock
    }));
    const transactionMock = vi.fn(async (callback) =>
      callback({
        insert: vi
          .fn()
          .mockImplementationOnce(() => ({
            values: cycleInsertMock
          }))
          .mockImplementationOnce(() => ({
            values: periodInsertMock
          })),
        update: updateMock
      })
    );

    app = await createTestApp();
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 28,
        onboardingCompleted: false,
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

    await registerMeRoutes(app, {
      db: {
        transaction: transactionMock
      } as never,
      env: {} as never
    });

    const response = await app.inject({
      body: {
        cycleLengthDays: 30,
        latestPeriodStart: "2026-03-01",
        periodLengthDays: 6,
        timezone: "Europe/Berlin"
      },
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "PATCH",
      url: "/api/me/settings"
    });

    expect(response.statusCode).toBe(200);
    expect(cycleInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0"
      })
    );
    expect(periodInsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ userId: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0" })
      ])
    );
  });

  it("rejects an invalid settings payload", async () => {
    app = await createTestApp();

    await registerMeRoutes(app, {
      db: {} as never,
      env: {} as never
    });

    const response = await app.inject({
      body: {
        cycleLengthDays: 10
      },
      method: "PATCH",
      url: "/api/me/settings"
    });

    expect(response.statusCode).toBe(400);
    expect(resolveAuthenticatedUserMock).not.toHaveBeenCalled();
  });

  it("rejects an impossible latest period start before auth lookup", async () => {
    app = await createTestApp();

    await registerMeRoutes(app, {
      db: {} as never,
      env: {} as never
    });

    const response = await app.inject({
      body: {
        latestPeriodStart: "2026-02-31"
      },
      method: "PATCH",
      url: "/api/me/settings"
    });

    expect(response.statusCode).toBe(400);
    expect(resolveAuthenticatedUserMock).not.toHaveBeenCalled();
  });

  it("rejects a future latest period start using the effective timezone", async () => {
    app = await createTestApp();
    setMockSystemTime("2026-03-02T00:30:00.000Z");
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 28,
        onboardingCompleted: false,
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

    await registerMeRoutes(app, {
      db: {} as never,
      env: {} as never
    });

    const response = await app.inject({
      body: {
        latestPeriodStart: "2026-03-02"
      },
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "PATCH",
      url: "/api/me/settings"
    });

    expect(response.statusCode).toBe(400);
    expect(resolveAuthenticatedUserMock).toHaveBeenCalled();
  });

  it("rejects latestPeriodStart updates after onboarding is already complete", async () => {
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

    await registerMeRoutes(app, {
      db: {} as never,
      env: {} as never
    });

    const response = await app.inject({
      body: {
        latestPeriodStart: "2026-03-01"
      },
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "PATCH",
      url: "/api/me/settings"
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: "Latest period start can only be updated during onboarding."
    });
  });

  it("rate limits repeated access to authenticated endpoints", async () => {
    app = await createTestApp();
    resolveAuthenticatedUserMock.mockResolvedValue({
      settings: {
        cycleLengthDays: 29,
        onboardingCompleted: false,
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

    await registerMeRoutes(app, {
      db: {} as never,
      env: {} as never
    });

    for (let index = 0; index < API_RATE_LIMIT_MAX; index += 1) {
      const response = await app.inject({
        headers: {
          "x-telegram-init-data": "stub"
        },
        method: "GET",
        remoteAddress: "127.0.0.1",
        url: "/api/me"
      });

      expect(response.statusCode).toBe(200);
    }

    const blockedResponse = await app.inject({
      headers: {
        "x-telegram-init-data": "stub"
      },
      method: "GET",
      remoteAddress: "127.0.0.1",
      url: "/api/me"
    });

    expect(blockedResponse.statusCode).toBe(429);
  });
});
