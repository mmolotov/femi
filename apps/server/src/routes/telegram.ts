import type { FastifyInstance } from "fastify";
import { webhookCallback, type Bot } from "grammy";

import type { AppEnv } from "../lib/env.js";

type TelegramRouteDeps = {
  bot: Bot;
  env: AppEnv;
};

export async function registerTelegramRoutes(
  app: FastifyInstance,
  deps: TelegramRouteDeps
): Promise<void> {
  const webhook = webhookCallback(deps.bot, "fastify", {
    onTimeout: "return",
    secretToken: deps.env.TELEGRAM_BOT_SECRET_TOKEN
  });

  app.post("/telegram/webhook", { config: { rateLimit: false } }, webhook);
}
