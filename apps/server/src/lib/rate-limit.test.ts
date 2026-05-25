import { describe, expect, it, vi } from "vitest";

import type { AppEnv } from "./env.js";
import { API_RATE_LIMIT_MAX, API_RATE_LIMIT_WINDOW_MS, registerRateLimit } from "./rate-limit.js";

function createEnv(overrides: Partial<AppEnv> = {}): AppEnv {
  return {
    BOT_TOKEN: "bot-token",
    DATABASE_URL: "postgres://femi:femi@localhost:5432/femi",
    HOST: "0.0.0.0",
    LOG_LEVEL: "info",
    NODE_ENV: "development",
    PORT: 3001,
    TELEGRAM_BOT_SECRET_TOKEN: "secret",
    TELEGRAM_INIT_DATA_EXPIRES_IN: 3600,
    TELEGRAM_WEBHOOK_URL: undefined,
    WEB_APP_URL: "http://localhost:5173",
    WORKER_TICK_MS: 60000,
    ...overrides
  };
}

describe("registerRateLimit", () => {
  it("registers the limiter without a global hook in development", async () => {
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

    await registerRateLimit(app as never, createEnv({ NODE_ENV: "development" }));

    expect(app.register).toHaveBeenCalledWith(expect.any(Function), {
      global: false,
      hook: "preHandler",
      max: API_RATE_LIMIT_MAX,
      timeWindow: API_RATE_LIMIT_WINDOW_MS
    });
    expect(app.log.info).toHaveBeenCalledWith("Skipping global API rate limit in development.");
  });

  it("registers the limiter outside development", async () => {
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

    await registerRateLimit(app as never, createEnv({ NODE_ENV: "production" }));

    expect(app.register).toHaveBeenCalledWith(expect.any(Function), {
      global: true,
      hook: "preHandler",
      max: API_RATE_LIMIT_MAX,
      timeWindow: API_RATE_LIMIT_WINDOW_MS
    });
  });
});
