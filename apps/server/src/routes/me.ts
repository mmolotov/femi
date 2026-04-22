import type { Database } from "@femi/db";
import { cycles, periodLogs, userSettings, users } from "@femi/db";
import {
  getIsoDateInTimeZone,
  meResponseSchema,
  updateUserSettingsRequestSchema,
  updateUserSettingsResponseSchema
} from "@femi/shared";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import { AuthContextError, resolveAuthenticatedUser } from "../lib/auth-context.js";
import type { AppEnv } from "../lib/env.js";
import { API_RATE_LIMIT_WINDOW_MS } from "../lib/rate-limit.js";

type MeRouteDeps = {
  db: Database;
  env: AppEnv;
};

function parseIsoDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const nextDate = parseIsoDate(date);

  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return formatIsoDate(nextDate);
}

function buildLoggedPeriodDates(
  latestPeriodStart: string,
  periodLengthDays: number,
  today: string
) {
  const periodEnd = addDays(latestPeriodStart, periodLengthDays - 1);
  const loggedEnd = periodEnd < today ? periodEnd : today;

  if (latestPeriodStart > loggedEnd) {
    return [latestPeriodStart];
  }

  const dates: string[] = [];
  let cursor = latestPeriodStart;

  while (cursor <= loggedEnd) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return dates;
}

function isFutureIsoDate(date: string, today: string): boolean {
  return date > today;
}

function toSettingsResponse(settings: {
  cycleLengthDays: number;
  onboardingCompleted: boolean;
  periodLengthDays: number;
  remindersEnabled: boolean;
  timezone: string;
}) {
  return {
    cycleLengthDays: settings.cycleLengthDays,
    onboardingCompleted: settings.onboardingCompleted,
    periodLengthDays: settings.periodLengthDays,
    remindersEnabled: settings.remindersEnabled,
    timezone: settings.timezone
  };
}

export async function registerMeRoutes(app: FastifyInstance, deps: MeRouteDeps): Promise<void> {
  app.get("/api/me", async (request, reply) => {
    try {
      const authenticatedUser = await resolveAuthenticatedUser(request, deps.db, deps.env);

      return reply.send(
        meResponseSchema.parse({
          settings: toSettingsResponse(authenticatedUser.settings),
          user: authenticatedUser.user
        })
      );
    } catch (error) {
      if (error instanceof AuthContextError) {
        return reply.code(error.statusCode).send({
          error: error.message
        });
      }

      throw error;
    }
  });

  app.delete(
    "/api/me",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: API_RATE_LIMIT_WINDOW_MS
        }
      }
    },
    async (request, reply) => {
      try {
        const authenticatedUser = await resolveAuthenticatedUser(request, deps.db, deps.env);
        const [deletedUser] = await deps.db
          .delete(users)
          .where(eq(users.id, authenticatedUser.user.id))
          .returning({ id: users.id });

        if (!deletedUser) {
          return reply.code(404).send({
            error: "User was not found."
          });
        }

        return reply.code(204).send();
      } catch (error) {
        if (error instanceof AuthContextError) {
          return reply.code(error.statusCode).send({
            error: error.message
          });
        }

        throw error;
      }
    }
  );

  app.patch("/api/me/settings", async (request, reply) => {
    const parsedBody = updateUserSettingsRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({
        error: "Invalid request body."
      });
    }

    try {
      const authenticatedUser = await resolveAuthenticatedUser(request, deps.db, deps.env);
      const effectiveTimezone = parsedBody.data.timezone ?? authenticatedUser.settings.timezone;
      const today = getIsoDateInTimeZone(new Date(), effectiveTimezone);

      if (
        parsedBody.data.latestPeriodStart !== undefined &&
        authenticatedUser.settings.onboardingCompleted
      ) {
        return reply.code(400).send({
          error: "Latest period start can only be updated during onboarding."
        });
      }

      if (
        parsedBody.data.latestPeriodStart !== undefined &&
        isFutureIsoDate(parsedBody.data.latestPeriodStart, today)
      ) {
        return reply.code(400).send({
          error: "Latest period start cannot be in the future."
        });
      }
      const nextSettings = {
        cycleLengthDays:
          parsedBody.data.cycleLengthDays ?? authenticatedUser.settings.cycleLengthDays,
        onboardingCompleted:
          authenticatedUser.settings.onboardingCompleted ||
          parsedBody.data.cycleLengthDays !== undefined ||
          parsedBody.data.periodLengthDays !== undefined ||
          parsedBody.data.latestPeriodStart !== undefined,
        periodLengthDays:
          parsedBody.data.periodLengthDays ?? authenticatedUser.settings.periodLengthDays,
        remindersEnabled:
          parsedBody.data.remindersEnabled ?? authenticatedUser.settings.remindersEnabled,
        timezone: effectiveTimezone,
        updatedAt: new Date()
      };

      const updatedSettings = await deps.db.transaction(async (transaction) => {
        const [settings] = await transaction
          .update(userSettings)
          .set(nextSettings)
          .where(eq(userSettings.userId, authenticatedUser.user.id))
          .returning({
            cycleLengthDays: userSettings.cycleLengthDays,
            onboardingCompleted: userSettings.onboardingCompleted,
            periodLengthDays: userSettings.periodLengthDays,
            remindersEnabled: userSettings.remindersEnabled,
            timezone: userSettings.timezone
          });

        if (!settings) {
          return null;
        }

        if (parsedBody.data.latestPeriodStart) {
          const latestPeriodStart = parseIsoDate(parsedBody.data.latestPeriodStart);
          const loggedPeriodDates = buildLoggedPeriodDates(
            parsedBody.data.latestPeriodStart,
            settings.periodLengthDays,
            today
          );

          await transaction
            .insert(cycles)
            .values({
              predicted: false,
              startedOn: latestPeriodStart,
              userId: authenticatedUser.user.id
            })
            .onConflictDoUpdate({
              set: {
                predicted: false,
                updatedAt: new Date()
              },
              target: [cycles.userId, cycles.startedOn]
            });

          await transaction
            .insert(periodLogs)
            .values(
              loggedPeriodDates.map((date) => ({
                happenedOn: parseIsoDate(date),
                userId: authenticatedUser.user.id
              }))
            )
            .onConflictDoUpdate({
              set: {
                updatedAt: new Date()
              },
              target: [periodLogs.userId, periodLogs.happenedOn]
            });
        }

        return settings;
      });

      if (!updatedSettings) {
        return reply.code(404).send({
          error: "User settings were not found."
        });
      }

      return reply.send(
        updateUserSettingsResponseSchema.parse({
          settings: toSettingsResponse(updatedSettings)
        })
      );
    } catch (error) {
      if (error instanceof AuthContextError) {
        return reply.code(error.statusCode).send({
          error: error.message
        });
      }

      throw error;
    }
  });
}
