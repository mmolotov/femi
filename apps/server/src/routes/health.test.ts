import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { registerHealthRoutes } from "./health.js";

describe("health routes", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await registerHealthRoutes(app);
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns an api health payload", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      service: "api",
      status: "ok"
    });
  });
});
