import fastifyRateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";

export const API_RATE_LIMIT_MAX = 100;
export const API_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(fastifyRateLimit, {
    global: true,
    hook: "preHandler",
    max: API_RATE_LIMIT_MAX,
    timeWindow: API_RATE_LIMIT_WINDOW_MS
  });
}
