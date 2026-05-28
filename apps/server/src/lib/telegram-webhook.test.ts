import { describe, expect, it } from "vitest";
import { vi } from "vitest";

import type { AppEnv } from "./env.js";
import {
  resolveWebhookRegistrationUrl,
  syncTelegramWebhookRegistration
} from "./telegram-webhook.js";

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
    TELEGRAM_BOT_SECRET_TOKEN: "secret",
    TELEGRAM_INIT_DATA_EXPIRES_IN: 3600,
    TELEGRAM_WEBHOOK_URL: undefined,
    TRUST_PROXY: false,
    WEB_APP_URL: "http://localhost:5173",
    WORKER_TICK_MS: 60000,
    ...overrides
  };
}

describe("resolveWebhookRegistrationUrl", () => {
  it("skips non-https webhook urls in development", () => {
    expect(
      resolveWebhookRegistrationUrl(
        createEnv({
          TELEGRAM_WEBHOOK_URL: "http://femi.local:5173/telegram/webhook"
        })
      )
    ).toBeNull();
  });

  it("skips unsupported webhook ports in development", () => {
    expect(
      resolveWebhookRegistrationUrl(
        createEnv({
          TELEGRAM_WEBHOOK_URL: "https://femi.local:5173/telegram/webhook"
        })
      )
    ).toBeNull();
  });

  it("returns https webhook urls unchanged", () => {
    expect(
      resolveWebhookRegistrationUrl(
        createEnv({
          TELEGRAM_WEBHOOK_URL: "https://femi.example.com/telegram/webhook"
        })
      )
    ).toBe("https://femi.example.com/telegram/webhook");
  });

  it("rejects non-https webhook urls outside development", () => {
    expect(() =>
      resolveWebhookRegistrationUrl(
        createEnv({
          NODE_ENV: "production",
          TELEGRAM_WEBHOOK_URL: "http://femi.example.com/telegram/webhook"
        })
      )
    ).toThrow(
      "TELEGRAM_WEBHOOK_URL must use HTTPS and port 80, 88, 443, or 8443 outside local development."
    );
  });

  it("rejects unsupported webhook ports outside development", () => {
    expect(() =>
      resolveWebhookRegistrationUrl(
        createEnv({
          NODE_ENV: "production",
          TELEGRAM_WEBHOOK_URL: "https://femi.example.com:5173/telegram/webhook"
        })
      )
    ).toThrow(
      "TELEGRAM_WEBHOOK_URL must use HTTPS and port 80, 88, 443, or 8443 outside local development."
    );
  });
});

describe("syncTelegramWebhookRegistration", () => {
  it("skips registration when no valid webhook url should be used", async () => {
    const api = {
      getWebhookInfo: vi.fn(),
      setWebhook: vi.fn()
    };
    const logger = {
      info: vi.fn(),
      warn: vi.fn()
    };

    await syncTelegramWebhookRegistration({
      api,
      env: createEnv(),
      logger
    });

    expect(api.getWebhookInfo).not.toHaveBeenCalled();
    expect(api.setWebhook).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalled();
  });

  it("skips setWebhook when Telegram already reports the same url", async () => {
    const api = {
      getWebhookInfo: vi.fn().mockResolvedValue({
        url: "https://femi.example.com/telegram/webhook"
      }),
      setWebhook: vi.fn()
    };
    const logger = {
      info: vi.fn(),
      warn: vi.fn()
    };

    await syncTelegramWebhookRegistration({
      api,
      env: createEnv({
        TELEGRAM_BOT_SECRET_TOKEN: undefined,
        TELEGRAM_WEBHOOK_URL: "https://femi.example.com/telegram/webhook"
      }),
      logger
    });

    expect(api.getWebhookInfo).toHaveBeenCalledTimes(1);
    expect(api.setWebhook).not.toHaveBeenCalled();
  });

  it("re-registers the webhook when the url matches but a secret token is configured", async () => {
    const api = {
      getWebhookInfo: vi.fn().mockResolvedValue({
        url: "https://femi.example.com/telegram/webhook"
      }),
      setWebhook: vi.fn().mockResolvedValue(undefined)
    };
    const logger = {
      info: vi.fn(),
      warn: vi.fn()
    };

    await syncTelegramWebhookRegistration({
      api,
      env: createEnv({
        TELEGRAM_BOT_SECRET_TOKEN: "rotated-secret",
        TELEGRAM_WEBHOOK_URL: "https://femi.example.com/telegram/webhook"
      }),
      logger
    });

    expect(api.getWebhookInfo).toHaveBeenCalledTimes(1);
    expect(api.setWebhook).toHaveBeenCalledWith("https://femi.example.com/telegram/webhook", {
      secret_token: "rotated-secret"
    });
  });

  it("logs and suppresses Telegram 429 responses in development", async () => {
    const api = {
      getWebhookInfo: vi.fn().mockResolvedValue({
        url: ""
      }),
      setWebhook: vi.fn().mockRejectedValue({
        description: "Too Many Requests: retry after 1",
        error_code: 429,
        parameters: {
          retry_after: 1
        }
      })
    };
    const logger = {
      info: vi.fn(),
      warn: vi.fn()
    };

    await expect(
      syncTelegramWebhookRegistration({
        api,
        env: createEnv({
          NODE_ENV: "development",
          TELEGRAM_WEBHOOK_URL: "https://femi.example.com/telegram/webhook"
        }),
        logger
      })
    ).resolves.toBeUndefined();

    expect(api.setWebhook).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("rethrows Telegram 429 responses outside development", async () => {
    const rateLimitError = {
      description: "Too Many Requests: retry after 1",
      error_code: 429,
      parameters: {
        retry_after: 1
      }
    };
    const api = {
      getWebhookInfo: vi.fn().mockResolvedValue({
        url: ""
      }),
      setWebhook: vi.fn().mockRejectedValue(rateLimitError)
    };
    const logger = {
      info: vi.fn(),
      warn: vi.fn()
    };

    await expect(
      syncTelegramWebhookRegistration({
        api,
        env: createEnv({
          NODE_ENV: "production",
          TELEGRAM_WEBHOOK_URL: "https://femi.example.com/telegram/webhook"
        }),
        logger
      })
    ).rejects.toBe(rateLimitError);
  });
});
