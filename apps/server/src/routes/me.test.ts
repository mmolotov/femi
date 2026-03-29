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

import { registerMeRoutes } from "./me.js";

describe("me routes", () => {
  let app: FastifyInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it("returns the authenticated user profile", async () => {
    app = Fastify();
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

    app = Fastify();
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
        update: updateMock
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

  it("rejects an invalid settings payload", async () => {
    app = Fastify();

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
});
