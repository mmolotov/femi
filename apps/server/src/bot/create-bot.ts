import { Bot } from "grammy";

import type { AppEnv } from "../lib/env.js";

export function createBot(env: AppEnv): Bot {
  const bot = new Bot(env.BOT_TOKEN);

  bot.command("start", async (ctx) => {
    await ctx.reply("Open femi from the button below.", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Open femi",
              web_app: {
                url: env.WEB_APP_URL
              }
            }
          ]
        ]
      }
    });
  });

  bot.command("help", async (ctx) => {
    await ctx.reply("femi is a simple Telegram Mini App for cycle and symptom tracking.");
  });

  return bot;
}
