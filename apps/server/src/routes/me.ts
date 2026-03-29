import type { Database } from "@femi/db";
import { userSettings } from "@femi/db";
import {
  meResponseSchema,
  updateUserSettingsRequestSchema,
  updateUserSettingsResponseSchema
} from "@femi/shared";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import { AuthContextError, resolveAuthenticatedUser } from "../lib/auth-context.js";
import type { AppEnv } from "../lib/env.js";
import { createAuthenticatedRouteRateLimit } from "../lib/rate-limit.js";

type MeRouteDeps = {
  db: Database;
  env: AppEnv;
};

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
  const authenticatedRouteRateLimit = createAuthenticatedRouteRateLimit(app);

  app.get("/api/me", authenticatedRouteRateLimit, async (request, reply) => {
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

  app.patch("/api/me/settings", authenticatedRouteRateLimit, async (request, reply) => {
    const parsedBody = updateUserSettingsRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({
        error: "Invalid request body."
      });
    }

    try {
      const authenticatedUser = await resolveAuthenticatedUser(request, deps.db, deps.env);
      const nextSettings = {
        cycleLengthDays:
          parsedBody.data.cycleLengthDays ?? authenticatedUser.settings.cycleLengthDays,
        onboardingCompleted:
          authenticatedUser.settings.onboardingCompleted ||
          parsedBody.data.cycleLengthDays !== undefined ||
          parsedBody.data.periodLengthDays !== undefined,
        periodLengthDays:
          parsedBody.data.periodLengthDays ?? authenticatedUser.settings.periodLengthDays,
        remindersEnabled:
          parsedBody.data.remindersEnabled ?? authenticatedUser.settings.remindersEnabled,
        timezone: parsedBody.data.timezone ?? authenticatedUser.settings.timezone,
        updatedAt: new Date()
      };

      const [updatedSettings] = await deps.db
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
