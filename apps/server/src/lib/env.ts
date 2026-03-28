import { config } from "dotenv";
import { z } from "zod";

config({
  path: new URL("../../../../.env", import.meta.url),
  quiet: true
});

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  WEB_APP_URL: z.string().url().default("http://localhost"),
  TELEGRAM_WEBHOOK_URL: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
  DATABASE_URL: z.string().min(1),
  BOT_TOKEN: z.string().min(1),
  TELEGRAM_BOT_SECRET_TOKEN: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  TELEGRAM_INIT_DATA_EXPIRES_IN: z.coerce.number().int().positive().default(3600),
  WORKER_TICK_MS: z.coerce.number().int().positive().default(60000)
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(): AppEnv {
  return envSchema.parse(process.env);
}
