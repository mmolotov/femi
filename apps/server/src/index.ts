import { createAppContext } from "./app.js";
import { syncTelegramWebhookRegistration } from "./lib/telegram-webhook.js";

const { app, bot, db, env } = await createAppContext();

async function syncTelegramWebhook(): Promise<void> {
  await syncTelegramWebhookRegistration({
    api: bot.api,
    env,
    logger: app.log
  });
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
