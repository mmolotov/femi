import { userSettings } from "@femi/db";
import { getIsoDateInTimeZone } from "@femi/shared";
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

function createDbMock(userRow: UserRow, initialTimezone: string | null = "Europe/Moscow") {
  const settings = { timezone: initialTimezone, cycleLengthDays: 31, onboardingCompleted: true };
  const settingsUpdateMock = vi.fn(async ({ set }: { set: { timezone: string } }) => {
    Object.assign(settings, set);
  });
  const valuesMock = vi.fn();

  const db = {
    insert: vi.fn((table) =>
      table === userSettings
        ? {
            values: (values: { userId: string; timezone?: string }) => {
              valuesMock(values);
              return {
                onConflictDoNothing: async () => {
                  settings.timezone ??= values.timezone ?? "UTC";
                },
                onConflictDoUpdate: async (conflict: { set: { timezone: string } }) => {
                  if (settings.timezone === null) {
                    settings.timezone = values.timezone ?? "UTC";
                  } else {
                    await settingsUpdateMock(conflict);
                  }
                }
              };
            }
          }
        : {
            values: (values: unknown) => {
              valuesMock(values);
              return {
                onConflictDoUpdate: () => ({
                  returning: async () => [{ id: userRow.id }]
                })
              };
            }
          }
    ),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => [userRow])
        }))
      }))
    }))
  };

  return { db, valuesMock, settings, settingsUpdateMock };
}

describe("auth routes", () => {
  let app: FastifyInstance;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it.each(["Europe/Moscow", null])(
    "uses the device timezone at login for an account with timezone %s",
    async (initialTimezone) => {
      app = Fastify();
      const userRow: UserRow = {
        firstName: "Ada",
        id: "7d8ff976-fb53-4bfb-b732-12f6e18dc4d0",
        languageCode: "en",
        lastName: null,
        telegramUserId: 10001n,
        username: null
      };
      const { db, settings, settingsUpdateMock } = createDbMock(userRow, initialTimezone);
      await registerAuthRoutes(app, { db: db as never, env: testEnv });
      const initDataRaw = sign(
        { user: { first_name: "Ada", id: 10001 } },
        TEST_BOT_TOKEN,
        new Date()
      );

      const response = await app.inject({
        method: "POST",
        url: "/api/auth/telegram",
        body: { initDataRaw, timezone: "Europe/Belgrade" }
      });

      expect(response.statusCode).toBe(200);
      expect(settings).toMatchObject({
        timezone: "Europe/Belgrade",
        cycleLengthDays: 31,
        onboardingCompleted: true
      });
      expect(getIsoDateInTimeZone(new Date("2026-11-08T22:00:00Z"), settings.timezone!)).toBe(
        "2026-11-08"
      );
      if (initialTimezone !== null) {
        expect(settingsUpdateMock).toHaveBeenCalledWith({
          target: userSettings.userId,
          set: { timezone: "Europe/Belgrade", updatedAt: expect.any(Date) }
        });
      }
    }
  );

  it.each([
    { initDataRaw: "invalid", timezone: "Europe/Belgrade", status: 401 },
    { initDataRaw: "invalid", timezone: "Not/A_Timezone", status: 400 }
  ])("rejects auth with $timezone and invalid init data ($status)", async (input) => {
    app = Fastify();
    const db = { insert: vi.fn() };
    await registerAuthRoutes(app, { db: db as never, env: testEnv });
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/telegram",
      body: { initDataRaw: input.initDataRaw, timezone: input.timezone }
    });
    expect(response.statusCode).toBe(input.status);
    expect(db.insert).not.toHaveBeenCalled();
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
    const { db, valuesMock, settings, settingsUpdateMock } = createDbMock(userRow);

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
    expect(settings.timezone).toBe("Europe/Moscow");
    expect(settingsUpdateMock).not.toHaveBeenCalled();
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
