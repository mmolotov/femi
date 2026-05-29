import { describe, expect, it, vi } from "vitest";

import type { AppEnv } from "./env.js";
import { API_RATE_LIMIT_MAX, API_RATE_LIMIT_WINDOW_MS, registerRateLimit } from "./rate-limit.js";

function createEnv(overrides: Partial<AppEnv> = {}): AppEnv {
  return {
    BOT_TOKEN: "bot-token",
    DATABASE_URL: "postgres://femi:femi@localhost:5432/femi",
    HOST: "0.0.0.0",
    LOG_LEVEL: "info",
    MONITORING_ENABLED: true,
    MONITORING_HOST: "127.0.0.1",
    MONITORING_PORT: 3002,
    MONITORING_RETENTION_DAYS: 30,
    NODE_ENV: "development",
    PORT: 3001,
    RATE_LIMIT_ENABLED: true,
    TELEGRAM_BOT_SECRET_TOKEN: "secret",
    TELEGRAM_INIT_DATA_EXPIRES_IN: 3600,
    TELEGRAM_WEBHOOK_URL: undefined,
    TRUST_PROXY: false,
    WEB_APP_URL: "http://localhost:5173",
    WORKER_TICK_MS: 60000,
    ...overrides
  };
}

describe("registerRateLimit", () => {
  it("registers without a global hook when rate limiting is disabled", async () => {
    const app = {
      log: {
        info: vi.fn()
      },
      register: vi.fn().mockResolvedValue(undefined)
    } as unknown as {
      log: {
        info: ReturnType<typeof vi.fn>;
      };
      register: ReturnType<typeof vi.fn>;
    };

    await registerRateLimit(app as never, createEnv({ RATE_LIMIT_ENABLED: false }));

    expect(app.register).toHaveBeenCalledWith(expect.any(Function), {
      global: false,
      hook: "preHandler",
      keyGenerator: expect.any(Function),
      max: API_RATE_LIMIT_MAX,
      timeWindow: API_RATE_LIMIT_WINDOW_MS
    });
    expect(app.log.info).toHaveBeenCalledWith(
      "Skipping API rate limiting (RATE_LIMIT_ENABLED=false)."
    );
  });

  it("registers a global limiter when rate limiting is enabled", async () => {
    const app = {
      log: {
        info: vi.fn()
      },
      register: vi.fn().mockResolvedValue(undefined)
    } as unknown as {
      log: {
        info: ReturnType<typeof vi.fn>;
      };
      register: ReturnType<typeof vi.fn>;
    };

    await registerRateLimit(app as never, createEnv({ RATE_LIMIT_ENABLED: true }));

    expect(app.register).toHaveBeenCalledWith(expect.any(Function), {
      global: true,
      hook: "preHandler",
      keyGenerator: expect.any(Function),
      max: API_RATE_LIMIT_MAX,
      timeWindow: API_RATE_LIMIT_WINDOW_MS
    });
  });

  it("keys rate limiting on CF-Connecting-IP with a connection-IP fallback", async () => {
    const app = {
      log: {
        info: vi.fn()
      },
      register: vi.fn().mockResolvedValue(undefined)
    } as unknown as {
      log: {
        info: ReturnType<typeof vi.fn>;
      };
      register: ReturnType<typeof vi.fn>;
    };

    await registerRateLimit(app as never, createEnv());

    const [, options] = app.register.mock.calls[0] as [
      unknown,
      { keyGenerator: (request: { headers: Record<string, string>; ip: string }) => string }
    ];

    expect(
      options.keyGenerator({ headers: { "cf-connecting-ip": "203.0.113.7" }, ip: "10.0.0.1" })
    ).toBe("203.0.113.7");
    expect(options.keyGenerator({ headers: {}, ip: "10.0.0.1" })).toBe("10.0.0.1");
  });
});
