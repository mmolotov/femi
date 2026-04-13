import fastifyRateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";

import type { AppEnv } from "./env.js";

export const API_RATE_LIMIT_MAX = 100;
export const API_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function registerRateLimit(app: FastifyInstance, env: AppEnv): Promise<void> {
  if (env.NODE_ENV === "development") {
    app.log.info("Skipping global API rate limit in development.");
    return;
  }

  await app.register(fastifyRateLimit, {
    global: true,
    hook: "preHandler",
    max: API_RATE_LIMIT_MAX,
    timeWindow: API_RATE_LIMIT_WINDOW_MS
  });
}
