import type { FastifyInstance } from "fastify";

import { healthResponseSchema } from "@femi/shared";

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  const buildPayload = (service: string) =>
    healthResponseSchema.parse({
      service,
      status: "ok",
      timestamp: new Date().toISOString()
    });

  app.get("/health", async () => buildPayload("server"));
  app.get("/api/health", async () => buildPayload("api"));
}
