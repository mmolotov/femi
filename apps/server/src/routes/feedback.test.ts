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
  getVerifiedTelegramUserId: () => "10001",
  resolveAuthenticatedUser: resolveAuthenticatedUserMock
}));

import { API_RATE_LIMIT_MAX, API_RATE_LIMIT_WINDOW_MS } from "../lib/rate-limit.js";
import { registerFeedbackRoutes } from "./feedback.js";

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

const authenticatedUser = {
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
    lastName: "Lovelace",
    telegramUserId: "10001",
    username: "ada"
  }
};

describe("feedback routes", () => {
  let app: FastifyInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it("forwards the feedback to the configured chat with sender identity", async () => {
    const sendMessageMock = vi.fn().mockResolvedValue(undefined);

    app = await createTestApp();
    resolveAuthenticatedUserMock.mockResolvedValue(authenticatedUser);

    await registerFeedbackRoutes(app, {
      bot: { api: { sendMessage: sendMessageMock } } as never,
      db: {} as never,
      env: { FEEDBACK_CHAT_ID: "999888777" } as never
    });

    const response = await app.inject({
      body: { message: "Loving the app, but the calendar overflows on iPhone SE." },
      headers: {
        "content-type": "application/json",
        "x-telegram-init-data": "stub"
      },
      method: "POST",
      url: "/api/feedback"
    });

    expect(response.statusCode).toBe(204);
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    const [chatId, text] = sendMessageMock.mock.calls[0]!;
    expect(chatId).toBe("999888777");
    expect(text).toContain("Loving the app, but the calendar overflows on iPhone SE.");
    expect(text).toContain("@ada");
    expect(text).toContain("id 10001");
    expect(text).toContain("Ada Lovelace");
  });

  it("rejects an empty message body before touching the bot", async () => {
    const sendMessageMock = vi.fn();

    app = await createTestApp();

    await registerFeedbackRoutes(app, {
      bot: { api: { sendMessage: sendMessageMock } } as never,
      db: {} as never,
      env: { FEEDBACK_CHAT_ID: "999888777" } as never
    });

    const response = await app.inject({
      body: { message: "   " },
      headers: {
        "content-type": "application/json",
        "x-telegram-init-data": "stub"
      },
      method: "POST",
      url: "/api/feedback"
    });

    expect(response.statusCode).toBe(400);
    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(resolveAuthenticatedUserMock).not.toHaveBeenCalled();
  });

  it("rejects an over-long message body before touching the bot", async () => {
    const sendMessageMock = vi.fn();

    app = await createTestApp();

    await registerFeedbackRoutes(app, {
      bot: { api: { sendMessage: sendMessageMock } } as never,
      db: {} as never,
      env: { FEEDBACK_CHAT_ID: "999888777" } as never
    });

    const response = await app.inject({
      body: { message: "x".repeat(2001) },
      headers: {
        "content-type": "application/json",
        "x-telegram-init-data": "stub"
      },
      method: "POST",
      url: "/api/feedback"
    });

    expect(response.statusCode).toBe(400);
    expect(sendMessageMock).not.toHaveBeenCalled();
  });

  it("returns 503 when FEEDBACK_CHAT_ID is not configured", async () => {
    const sendMessageMock = vi.fn();

    app = await createTestApp();

    await registerFeedbackRoutes(app, {
      bot: { api: { sendMessage: sendMessageMock } } as never,
      db: {} as never,
      env: {} as never
    });

    const response = await app.inject({
      body: { message: "Hello!" },
      headers: {
        "content-type": "application/json",
        "x-telegram-init-data": "stub"
      },
      method: "POST",
      url: "/api/feedback"
    });

    expect(response.statusCode).toBe(503);
    expect(sendMessageMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated feedback submissions", async () => {
    app = await createTestApp();
    resolveAuthenticatedUserMock.mockRejectedValue(new AuthContextErrorMock("Unauthorized", 401));

    await registerFeedbackRoutes(app, {
      bot: { api: { sendMessage: vi.fn() } } as never,
      db: {} as never,
      env: { FEEDBACK_CHAT_ID: "999888777" } as never
    });

    const response = await app.inject({
      body: { message: "Hello!" },
      headers: {
        "content-type": "application/json",
        "x-telegram-init-data": "stub"
      },
      method: "POST",
      url: "/api/feedback"
    });

    expect(response.statusCode).toBe(401);
  });

  it("returns 502 when the bot fails to deliver the message", async () => {
    const sendMessageMock = vi.fn().mockRejectedValue(new Error("network down"));

    app = await createTestApp();
    resolveAuthenticatedUserMock.mockResolvedValue(authenticatedUser);

    await registerFeedbackRoutes(app, {
      bot: { api: { sendMessage: sendMessageMock } } as never,
      db: {} as never,
      env: { FEEDBACK_CHAT_ID: "999888777" } as never
    });

    const response = await app.inject({
      body: { message: "Hello!" },
      headers: {
        "content-type": "application/json",
        "x-telegram-init-data": "stub"
      },
      method: "POST",
      url: "/api/feedback"
    });

    expect(response.statusCode).toBe(502);
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
  });

  it("rate limits repeated feedback submissions when enabled", async () => {
    const sendMessageMock = vi.fn().mockResolvedValue(undefined);

    app = await createTestApp();
    resolveAuthenticatedUserMock.mockResolvedValue(authenticatedUser);

    await registerFeedbackRoutes(app, {
      bot: { api: { sendMessage: sendMessageMock } } as never,
      db: {} as never,
      env: { FEEDBACK_CHAT_ID: "999888777", RATE_LIMIT_ENABLED: true } as never
    });

    for (let index = 0; index < 20; index += 1) {
      const response = await app.inject({
        body: { message: `try ${index}` },
        headers: {
          "content-type": "application/json",
          "x-telegram-init-data": "stub"
        },
        method: "POST",
        remoteAddress: "127.0.0.1",
        url: "/api/feedback"
      });

      expect(response.statusCode).toBe(204);
    }

    const blockedResponse = await app.inject({
      body: { message: "one too many" },
      headers: {
        "content-type": "application/json",
        "x-telegram-init-data": "stub"
      },
      method: "POST",
      remoteAddress: "127.0.0.1",
      url: "/api/feedback"
    });

    expect(blockedResponse.statusCode).toBe(429);
  });

  it("does not rate limit feedback when rate limiting is disabled", async () => {
    const sendMessageMock = vi.fn().mockResolvedValue(undefined);

    app = await createTestApp();
    resolveAuthenticatedUserMock.mockResolvedValue(authenticatedUser);

    await registerFeedbackRoutes(app, {
      bot: { api: { sendMessage: sendMessageMock } } as never,
      db: {} as never,
      env: { FEEDBACK_CHAT_ID: "999888777", RATE_LIMIT_ENABLED: false } as never
    });

    for (let index = 0; index < 21; index += 1) {
      const response = await app.inject({
        body: { message: `try ${index}` },
        headers: {
          "content-type": "application/json",
          "x-telegram-init-data": "stub"
        },
        method: "POST",
        remoteAddress: "127.0.0.1",
        url: "/api/feedback"
      });

      expect(response.statusCode).toBe(204);
    }

    expect(sendMessageMock).toHaveBeenCalledTimes(21);
  });
});
