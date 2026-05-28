import fastifyRateLimit from "@fastify/rate-limit";
import type { FastifyInstance, FastifyRequest } from "fastify";

import type { AppEnv } from "./env.js";

export const API_RATE_LIMIT_MAX = 100;
export const API_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function rateLimitKey(request: FastifyRequest): string {
  // Behind Cloudflare the real visitor IP is in CF-Connecting-IP, which clients
  // cannot forge (Cloudflare overwrites it). Keying on it avoids both bucketing
  // every user under the proxy IP and X-Forwarded-For spoofing. Falls back to
  // the connection IP for any non-proxied path.
  const cfConnectingIp = request.headers["cf-connecting-ip"];

  if (typeof cfConnectingIp === "string" && cfConnectingIp.length > 0) {
    return cfConnectingIp;
  }

  return request.ip;
}

export async function registerRateLimit(app: FastifyInstance, env: AppEnv): Promise<void> {
  const enableGlobalLimit = env.NODE_ENV !== "development";

  if (!enableGlobalLimit) {
    app.log.info("Skipping global API rate limit in development.");
  }

  await app.register(fastifyRateLimit, {
    global: enableGlobalLimit,
    hook: "preHandler",
    keyGenerator: rateLimitKey,
    max: API_RATE_LIMIT_MAX,
    timeWindow: API_RATE_LIMIT_WINDOW_MS
  });
}
