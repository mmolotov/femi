import type { Database } from "@femi/db";
import { feedbackRequestSchema } from "@femi/shared";
import type { FastifyInstance } from "fastify";
import type { Bot } from "grammy";

import {
  AuthContextError,
  getVerifiedTelegramUserId,
  resolveAuthenticatedUser
} from "../lib/auth-context.js";
import type { AppEnv } from "../lib/env.js";
import { API_RATE_LIMIT_WINDOW_MS } from "../lib/rate-limit.js";

type FeedbackRouteDeps = {
  bot: Bot;
  db: Database;
  env: AppEnv;
};

// Tighter than the global limit: this relays straight into the developer's DMs,
// so cap submissions per account to blunt spam.
const FEEDBACK_RATE_LIMIT_MAX = 5;

function formatFeedbackMessage(
  user: {
    firstName: string | null;
    languageCode: string | null;
    lastName: string | null;
    telegramUserId: string;
    username: string | null;
  },
  message: string
): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";
  const details = [
    user.username ? `@${user.username}` : null,
    `id ${user.telegramUserId}`,
    user.languageCode ? `lang ${user.languageCode}` : null
  ]
    .filter(Boolean)
    .join(", ");

  // Plain text only (no parse_mode), so the user's message cannot inject
  // Telegram markup or be interpreted as commands.
  return `femi feedback\n\nFrom: ${name} (${details})\n\n${message}`;
}

export async function registerFeedbackRoutes(
  app: FastifyInstance,
  deps: FeedbackRouteDeps
): Promise<void> {
  app.post(
    "/api/feedback",
    {
      preHandler: deps.env.RATE_LIMIT_ENABLED
        ? app.rateLimit({
            keyGenerator: (request) => getVerifiedTelegramUserId(request, deps.env) ?? request.ip,
            max: FEEDBACK_RATE_LIMIT_MAX,
            timeWindow: API_RATE_LIMIT_WINDOW_MS
          })
        : undefined
    },
    async (request, reply) => {
      const parsedBody = feedbackRequestSchema.safeParse(request.body);

      if (!parsedBody.success) {
        return reply.code(400).send({
          error: "Invalid request body."
        });
      }

      if (!deps.env.FEEDBACK_CHAT_ID) {
        request.log.warn("Feedback received but FEEDBACK_CHAT_ID is not configured.");
        return reply.code(503).send({
          error: "Feedback is not configured."
        });
      }

      try {
        const authenticatedUser = await resolveAuthenticatedUser(request, deps.db, deps.env);

        await deps.bot.api.sendMessage(
          deps.env.FEEDBACK_CHAT_ID,
          formatFeedbackMessage(authenticatedUser.user, parsedBody.data.message)
        );

        return reply.code(204).send();
      } catch (error) {
        if (error instanceof AuthContextError) {
          return reply.code(error.statusCode).send({
            error: error.message
          });
        }

        request.log.error({ err: error }, "Failed to deliver feedback message.");
        return reply.code(502).send({
          error: "Feedback could not be delivered."
        });
      }
    }
  );
}
