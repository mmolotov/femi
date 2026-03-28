import { createAppContext } from "./app.js";

const { app, bot, db, env } = await createAppContext();

async function syncTelegramWebhook(): Promise<void> {
  if (!env.TELEGRAM_WEBHOOK_URL) {
    app.log.info("TELEGRAM_WEBHOOK_URL is not set, skipping webhook registration.");
    return;
  }

  await bot.api.setWebhook(env.TELEGRAM_WEBHOOK_URL, {
    secret_token: env.TELEGRAM_BOT_SECRET_TOKEN
  });

  app.log.info(
    {
      webhookUrl: env.TELEGRAM_WEBHOOK_URL
    },
    "Telegram webhook registered."
  );
}

const closeGracefully = async (signal: string) => {
  app.log.info({ signal }, "shutting down server");
  await app.close();
  await db.pool.end();
  process.exit(0);
};

process.on("SIGINT", () => {
  void closeGracefully("SIGINT");
});

process.on("SIGTERM", () => {
  void closeGracefully("SIGTERM");
});

await app.listen({
  host: env.HOST,
  port: env.PORT
});

await syncTelegramWebhook();
