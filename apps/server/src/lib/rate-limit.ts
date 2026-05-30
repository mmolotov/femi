import fastifyRateLimit from "@fastify/rate-limit";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { getVerifiedTelegramUserId } from "./auth-context.js";
import type { AppEnv } from "./env.js";

// Generous per-identity quota. The HMAC-verified Telegram user id is the real
// abuse boundary; the rate limit is just defensive throttling, so the cap is
// well above the busiest legitimate session (active week-strip / calendar
// navigation + check-in saves + history pagination easily reaches 60+ requests
// per 15 min). Keying per user (not per IP) also avoids 429-ing whole CGNAT
// carriers — RU/UA mobile networks share one egress IP across many users.
export const API_RATE_LIMIT_MAX = 1000;
export const API_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function rateLimitKey(request: FastifyRequest, env: AppEnv): string {
  // Authenticated routes get a per-user bucket. Prefix the key so the TG id
  // space cannot collide with an IP literal.
  const telegramUserId = getVerifiedTelegramUserId(request, env);
  if (telegramUserId) {
    return `tg:${telegramUserId}`;
  }

  // Unauthenticated routes (health, telegram webhook, pre-auth bootstrap) fall
  // back to IP. Trust Cloudflare's CF-Connecting-IP only when explicitly behind
  // a trusted proxy; otherwise a direct client could forge the header to
  // rotate its bucket.
  if (env.TRUST_PROXY) {
    const cfConnectingIp = request.headers["cf-connecting-ip"];

    if (typeof cfConnectingIp === "string" && cfConnectingIp.length > 0) {
      return `ip:${cfConnectingIp}`;
    }
  }

  return `ip:${request.ip}`;
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
