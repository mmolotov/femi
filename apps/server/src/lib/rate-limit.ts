import fastifyRateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";

import type { AppEnv } from "./env.js";

export const API_RATE_LIMIT_MAX = 100;
export const API_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function registerRateLimit(app: FastifyInstance, env: AppEnv): Promise<void> {
  const enableGlobalLimit = env.NODE_ENV !== "development";

  if (!enableGlobalLimit) {
    app.log.info("Skipping global API rate limit in development.");
  }

  await app.register(fastifyRateLimit, {
    global: enableGlobalLimit,
    hook: "preHandler",
    max: API_RATE_LIMIT_MAX,
    timeWindow: API_RATE_LIMIT_WINDOW_MS
  });
}
