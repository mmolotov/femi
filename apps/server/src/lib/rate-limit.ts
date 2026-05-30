import fastifyRateLimit from "@fastify/rate-limit";
import type { FastifyInstance, FastifyRequest } from "fastify";

import type { AppEnv } from "./env.js";

export const API_RATE_LIMIT_MAX = 100;
export const API_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function rateLimitKey(request: FastifyRequest, env: AppEnv): string {
  // Trust Cloudflare's CF-Connecting-IP only when we are explicitly behind a
  // trusted proxy; otherwise a direct client could forge the header to rotate
  // its bucket. With TRUST_PROXY off, fall back to the connection IP.
  if (env.TRUST_PROXY) {
    const cfConnectingIp = request.headers["cf-connecting-ip"];

    if (typeof cfConnectingIp === "string" && cfConnectingIp.length > 0) {
      return cfConnectingIp;
    }
  }

  return request.ip;
}

export async function registerRateLimit(app: FastifyInstance, env: AppEnv): Promise<void> {
  const enableGlobalLimit = env.RATE_LIMIT_ENABLED;

  if (!enableGlobalLimit) {
    app.log.info("Skipping API rate limiting (RATE_LIMIT_ENABLED=false).");
  }

  await app.register(fastifyRateLimit, {
    global: enableGlobalLimit,
    hook: "preHandler",
    keyGenerator: (request) => rateLimitKey(request, env),
    max: API_RATE_LIMIT_MAX,
    timeWindow: API_RATE_LIMIT_WINDOW_MS
  });
}
