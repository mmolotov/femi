import type { Database } from "@femi/db";
import { userSettings, users } from "@femi/db";
import { telegramAuthRequestSchema, telegramAuthResponseSchema } from "@femi/shared";
import { parse, validate } from "@telegram-apps/init-data-node";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import type { AppEnv } from "../lib/env.js";

type AuthRouteDeps = {
  db: Database;
  env: AppEnv;
};

type ParsedTelegramUser = {
  id: string | number | bigint;
  username?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  languageCode?: unknown;
};

function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function registerAuthRoutes(app: FastifyInstance, deps: AuthRouteDeps): Promise<void> {
  app.post("/api/auth/telegram", async (request, reply) => {
    const parsedBody = telegramAuthRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({
        error: "Invalid request body."
      });
    }

    try {
      validate(parsedBody.data.initDataRaw, deps.env.BOT_TOKEN, {
        expiresIn: deps.env.TELEGRAM_INIT_DATA_EXPIRES_IN
      });
    } catch {
      return reply.code(401).send({
        error: "Invalid Telegram init data."
      });
    }

    const initData = parse(parsedBody.data.initDataRaw) as {
      user?: ParsedTelegramUser;
    };
    const telegramUser = initData.user;

    if (
      !telegramUser ||
      (typeof telegramUser.id !== "string" &&
        typeof telegramUser.id !== "number" &&
        typeof telegramUser.id !== "bigint")
    ) {
      return reply.code(401).send({
        error: "Telegram user data is missing."
      });
    }

    const telegramUserId = BigInt(telegramUser.id);
    const username = toNullableString(telegramUser.username);
    const firstName = toNullableString(telegramUser.firstName);
    const lastName = toNullableString(telegramUser.lastName);
    const languageCode = toNullableString(telegramUser.languageCode);

    const [persistedUser] = await deps.db
      .insert(users)
      .values({
        telegramUserId,
        username,
        firstName,
        lastName,
        languageCode
      })
      .onConflictDoUpdate({
        target: users.telegramUserId,
        set: {
          username,
          firstName,
          lastName,
          languageCode,
          updatedAt: new Date()
        }
      })
      .returning();

    await deps.db
      .insert(userSettings)
      .values({
        userId: persistedUser.id
      })
      .onConflictDoNothing({
        target: userSettings.userId
      });

    const [freshUser] = await deps.db
      .select({
        id: users.id,
        telegramUserId: users.telegramUserId,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        languageCode: users.languageCode
      })
      .from(users)
      .where(eq(users.id, persistedUser.id))
      .limit(1);

    if (!freshUser) {
      return reply.code(500).send({
        error: "User could not be loaded after upsert."
      });
    }

    return reply.send(
      telegramAuthResponseSchema.parse({
        user: {
          id: freshUser.id,
          telegramUserId: freshUser.telegramUserId.toString(),
          username: freshUser.username,
          firstName: freshUser.firstName,
          lastName: freshUser.lastName,
          languageCode: freshUser.languageCode
        }
      })
    );
  });
}
