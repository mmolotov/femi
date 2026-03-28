import { z } from "zod";

export const healthResponseSchema = z.object({
  service: z.string(),
  status: z.literal("ok"),
  timestamp: z.string()
});

export const telegramAuthRequestSchema = z.object({
  initDataRaw: z.string().min(1)
});

export const telegramUserSchema = z.object({
  id: z.string().uuid(),
  telegramUserId: z.string(),
  username: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  languageCode: z.string().nullable()
});

export const telegramAuthResponseSchema = z.object({
  user: telegramUserSchema
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type TelegramAuthRequest = z.infer<typeof telegramAuthRequestSchema>;
export type TelegramAuthResponse = z.infer<typeof telegramAuthResponseSchema>;
