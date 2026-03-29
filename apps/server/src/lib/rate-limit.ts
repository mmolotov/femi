import fastifyRateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(fastifyRateLimit, {
    global: true,
    hook: "preHandler",
    max: 60,
    timeWindow: "1 minute"
  });
}
