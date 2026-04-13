import type { AppEnv } from "./env.js";

const allowedWebhookPorts = new Set(["", "80", "88", "443", "8443"]);

type TelegramWebhookApi = {
  getWebhookInfo(): Promise<{
    url?: string;
  }>;
  setWebhook(
    url: string,
    options: {
      secret_token?: string;
    }
  ): Promise<unknown>;
};

type Logger = {
  info(payload: unknown, message?: string): void;
  info(message: string): void;
  warn(payload: unknown, message?: string): void;
  warn(message: string): void;
};

export function resolveWebhookRegistrationUrl(env: AppEnv): string | null {
  if (!env.TELEGRAM_WEBHOOK_URL) {
    return null;
  }

  const parsedUrl = new URL(env.TELEGRAM_WEBHOOK_URL);
  const isHttps = parsedUrl.protocol === "https:";
  const hasAllowedPort = allowedWebhookPorts.has(parsedUrl.port);

  if (isHttps && hasAllowedPort) {
    return env.TELEGRAM_WEBHOOK_URL;
  }

  if (env.NODE_ENV === "development") {
    return null;
  }

  throw new Error(
    "TELEGRAM_WEBHOOK_URL must use HTTPS and port 80, 88, 443, or 8443 outside local development."
  );
}

function isTelegramRateLimitError(
  error: unknown
): error is { description?: string; error_code?: number; parameters?: { retry_after?: number } } {
  return (
    typeof error === "object" &&
    error !== null &&
    ("error_code" in error || "parameters" in error || "description" in error)
  );
}

export async function syncTelegramWebhookRegistration(input: {
  api: TelegramWebhookApi;
  env: AppEnv;
  logger: Logger;
}): Promise<void> {
  const webhookUrl = resolveWebhookRegistrationUrl(input.env);

  if (!webhookUrl) {
    input.logger.info(
      "TELEGRAM_WEBHOOK_URL is not set or is skipped for local development; skipping webhook registration."
    );
    return;
  }

  const currentWebhook = await input.api.getWebhookInfo();

  if (currentWebhook.url === webhookUrl && !input.env.TELEGRAM_BOT_SECRET_TOKEN) {
    input.logger.info(
      {
        webhookUrl
      },
      "Telegram webhook is already configured and no secret rotation is required."
    );
    return;
  }

  try {
    await input.api.setWebhook(webhookUrl, {
      secret_token: input.env.TELEGRAM_BOT_SECRET_TOKEN
    });
  } catch (error) {
    if (
      input.env.NODE_ENV === "development" &&
      isTelegramRateLimitError(error) &&
      error.error_code === 429
    ) {
      input.logger.warn(
        {
          retryAfterSeconds: error.parameters?.retry_after ?? null,
          webhookUrl
        },
        "Telegram rate-limited webhook registration; keeping the server running."
      );
      return;
    }

    throw error;
  }

  input.logger.info(
    {
      webhookUrl
    },
    "Telegram webhook registered."
  );
}
