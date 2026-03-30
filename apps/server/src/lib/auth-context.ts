import type { Database } from "@femi/db";
import { userSettings, users } from "@femi/db";
import { parse, validate } from "@telegram-apps/init-data-node";
import { eq } from "drizzle-orm";
import type { FastifyRequest } from "fastify";

import type { AppEnv } from "./env.js";

type ParsedTelegramUser = {
  id: string | number | bigint;
};

type AuthenticatedUserContext = {
  settings: {
    cycleLengthDays: number;
    onboardingCompleted: boolean;
    periodLengthDays: number;
    remindersEnabled: boolean;
    timezone: string;
  };
  user: {
    firstName: string | null;
    id: string;
    languageCode: string | null;
    lastName: string | null;
    telegramUserId: string;
    username: string | null;
  };
};

export class AuthContextError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "AuthContextError";
  }
}

const telegramInitDataHeader = "x-telegram-init-data";

function readTelegramInitDataHeader(request: FastifyRequest): string {
  const headerValue = request.headers[telegramInitDataHeader];

  if (typeof headerValue === "string" && headerValue.trim().length > 0) {
    return headerValue;
  }

  if (Array.isArray(headerValue) && typeof headerValue[0] === "string" && headerValue[0].trim()) {
    return headerValue[0];
  }

  throw new AuthContextError("Missing Telegram authentication header.", 401);
}

function parseTelegramUserId(initDataRaw: string, env: AppEnv): bigint {
  try {
    validate(initDataRaw, env.BOT_TOKEN, {
      expiresIn: env.TELEGRAM_INIT_DATA_EXPIRES_IN
    });
  } catch {
    throw new AuthContextError("Invalid Telegram init data.", 401);
  }

  const initData = parse(initDataRaw) as {
    user?: ParsedTelegramUser;
  };
  const telegramUser = initData.user;

  if (
    !telegramUser ||
    (typeof telegramUser.id !== "string" &&
      typeof telegramUser.id !== "number" &&
      typeof telegramUser.id !== "bigint")
  ) {
    throw new AuthContextError("Telegram user data is missing.", 401);
  }

  return BigInt(telegramUser.id);
}

export async function resolveAuthenticatedUser(
  request: FastifyRequest,
  db: Database,
  env: AppEnv
): Promise<AuthenticatedUserContext> {
  const initDataRaw = readTelegramInitDataHeader(request);
  const telegramUserId = parseTelegramUserId(initDataRaw, env);

  const [authenticatedUser] = await db
    .select({
      firstName: users.firstName,
      id: users.id,
      languageCode: users.languageCode,
      lastName: users.lastName,
      onboardingCompleted: userSettings.onboardingCompleted,
      periodLengthDays: userSettings.periodLengthDays,
      remindersEnabled: userSettings.remindersEnabled,
      telegramUserId: users.telegramUserId,
      timezone: userSettings.timezone,
      username: users.username,
      cycleLengthDays: userSettings.cycleLengthDays
    })
    .from(users)
    .innerJoin(userSettings, eq(userSettings.userId, users.id))
    .where(eq(users.telegramUserId, telegramUserId))
    .limit(1);

  if (!authenticatedUser) {
    throw new AuthContextError("Authenticated user was not found.", 404);
  }

  return {
    settings: {
      cycleLengthDays: authenticatedUser.cycleLengthDays,
      onboardingCompleted: authenticatedUser.onboardingCompleted,
      periodLengthDays: authenticatedUser.periodLengthDays,
      remindersEnabled: authenticatedUser.remindersEnabled,
      timezone: authenticatedUser.timezone
    },
    user: {
      firstName: authenticatedUser.firstName,
      id: authenticatedUser.id,
      languageCode: authenticatedUser.languageCode,
      lastName: authenticatedUser.lastName,
      telegramUserId: authenticatedUser.telegramUserId.toString(),
      username: authenticatedUser.username
    }
  };
}
