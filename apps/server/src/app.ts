import { createDatabaseConnection, type DatabaseConnection } from "@femi/db";
import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import type { Bot } from "grammy";

import { createBot } from "./bot/create-bot.js";
import { getEnv, type AppEnv } from "./lib/env.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerTelegramRoutes } from "./routes/telegram.js";

type AppContext = {
  app: FastifyInstance;
  bot: Bot;
  db: DatabaseConnection;
  env: AppEnv;
};

export async function createAppContext(): Promise<AppContext> {
  const env = getEnv();
  const db = createDatabaseConnection(env.DATABASE_URL);
  const bot = createBot(env);

  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL
    }
  });

  await app.register(cors, {
    origin: true
  });

  await registerHealthRoutes(app);
  await registerAuthRoutes(app, {
    db: db.db,
    env
  });
  await registerTelegramRoutes(app, {
    bot,
    env
  });

  return { app, bot, db, env };
}
