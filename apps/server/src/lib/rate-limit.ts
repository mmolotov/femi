import fastifyRateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(fastifyRateLimit, {
    global: false,
    hook: "preHandler"
  });
}

export function createAuthenticatedRouteRateLimit(app: FastifyInstance) {
  return {
    preHandler: app.rateLimit({
      max: 60,
      timeWindow: "1 minute"
    })
  } as const;
}
