import { sign } from "@telegram-apps/init-data-node";
import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import { registerAuthRoutes } from "./auth.js";

const TEST_BOT_TOKEN = "12345:test-bot-token";

const testEnv = {
  BOT_TOKEN: TEST_BOT_TOKEN,
  TELEGRAM_INIT_DATA_EXPIRES_IN: 3600
} as never;

type UserRow = {
  firstName: string | null;
  id: string;
  languageCode: string | null;
  lastName: string | null;
  telegramUserId: bigint;
  username: string | null;
};

function createDbMock(userRow: UserRow) {
  const valuesMock = vi.fn(() => ({
    onConflictDoNothing: vi.fn(async () => undefined),
    onConflictDoUpdate: vi.fn(() => ({
      returning: vi.fn(async () => [{ id: userRow.id }])
    }))
  }));

  const db = {
    insert: vi.fn(() => ({
      values: valuesMock
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => [userRow])
        }))
      }))
    }))
  };

  return { db, valuesMock };
}

describe("auth routes", () => {
  let app: FastifyInstance;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it("registers a Telegram user that has no username", async () => {
    app = Fastify();

    const userRow: UserRow = {
      firstName: "Ada",
      id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
      languageCode: "en",
      lastName: null,
      telegramUserId: 10001n,
      username: null
    };
    const { db, valuesMock } = createDbMock(userRow);

    await registerAuthRoutes(app, { db: db as never, env: testEnv });

    // Telegram omits `username` entirely for accounts without one, so the
    // signed payload must not contain the field at all.
    const initDataRaw = sign(
      {
        user: {
          first_name: "Ada",
          id: 10001,
          language_code: "en"
        }
      },
      TEST_BOT_TOKEN,
      new Date()
    );

    const response = await app.inject({
      body: { initDataRaw },
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      url: "/api/auth/telegram"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      user: {
        firstName: "Ada",
        id: userRow.id,
        languageCode: "en",
        lastName: null,
        telegramUserId: "10001",
        username: null
      }
    });
    expect(valuesMock).toHaveBeenNthCalledWith(1, {
      firstName: "Ada",
      languageCode: "en",
      lastName: null,
      telegramUserId: 10001n,
      username: null
    });
    expect(valuesMock).toHaveBeenNthCalledWith(2, {
      userId: userRow.id
    });
  });

  it("stores the username when the Telegram account has one", async () => {
    app = Fastify();

    const userRow: UserRow = {
      firstName: "Ada",
      id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
      languageCode: "en",
      lastName: "Lovelace",
      telegramUserId: 10001n,
      username: "ada"
    };
    const { db, valuesMock } = createDbMock(userRow);

    await registerAuthRoutes(app, { db: db as never, env: testEnv });

    const initDataRaw = sign(
      {
        user: {
          first_name: "Ada",
          id: 10001,
          language_code: "en",
          last_name: "Lovelace",
          username: "ada"
        }
      },
      TEST_BOT_TOKEN,
      new Date()
    );

    const response = await app.inject({
      body: { initDataRaw },
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      url: "/api/auth/telegram"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      user: {
        firstName: "Ada",
        id: userRow.id,
        languageCode: "en",
        lastName: "Lovelace",
        telegramUserId: "10001",
        username: "ada"
      }
    });
    expect(valuesMock).toHaveBeenNthCalledWith(1, {
      firstName: "Ada",
      languageCode: "en",
      lastName: "Lovelace",
      telegramUserId: 10001n,
      username: "ada"
    });
  });
});
