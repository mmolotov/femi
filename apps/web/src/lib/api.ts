import {
  calendarResponseSchema,
  cycleSummaryResponseSchema,
  dailyCheckinResponseSchema,
  historyResponseSchema,
  meResponseSchema,
  periodLogResponseSchema,
  updateUserSettingsResponseSchema,
  type CalendarResponse,
  type CycleSummaryResponse,
  type DailyCheckinRequest,
  type DailyCheckinResponse,
  type HistoryResponse,
  type MeResponse,
  type OnboardingSetupRequest,
  type PeriodLogRequest,
  type PeriodLogResponse,
  type UpdateUserSettingsRequest,
  type UpdateUserSettingsResponse
} from "@femi/shared";

import { readErrorMessage } from "./httpError";

const telegramInitDataHeader = "x-telegram-init-data";

type ApiClient = {
  completeOnboarding(input: OnboardingSetupRequest): Promise<UpdateUserSettingsResponse>;
  deleteAccount(): Promise<void>;
  deletePeriodDay(date: string): Promise<void>;
  endPeriod(date: string): Promise<PeriodLogResponse>;
  getCalendar(month: string): Promise<CalendarResponse>;
  getCheckin(date: string): Promise<DailyCheckinResponse>;
  getCycleSummary(): Promise<CycleSummaryResponse>;
  getHistory(input?: { before?: string }): Promise<HistoryResponse>;
  getMe(): Promise<MeResponse>;
  logPeriod(input: PeriodLogRequest): Promise<PeriodLogResponse>;
  saveCheckin(date: string, input: DailyCheckinRequest): Promise<DailyCheckinResponse>;
  sendFeedback(message: string): Promise<void>;
  startPeriod(input: {
    date: string;
    flowIntensity?: PeriodLogRequest["flowIntensity"];
    note?: string;
  }): Promise<PeriodLogResponse>;
  updateSettings(input: UpdateUserSettingsRequest): Promise<UpdateUserSettingsResponse>;
};

async function requestJson<T>(
  initDataRaw: string,
  input: RequestInfo | URL,
  init: RequestInit,
  parse: (payload: unknown) => T
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      [telegramInitDataHeader]: initDataRaw
    }
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, `Request failed with status ${response.status}.`)
    );
  }

  return parse(await response.json());
}

export function createApiClient(initDataRaw: string): ApiClient {
  return {
    async completeOnboarding(input) {
      return requestJson(
        initDataRaw,
        "/api/me/settings",
        {
          body: JSON.stringify(input),
          headers: {
            "content-type": "application/json"
          },
          method: "PATCH"
        },
        (payload) => updateUserSettingsResponseSchema.parse(payload)
      );
    },
    async deleteAccount() {
      const response = await fetch("/api/me", {
        headers: {
          [telegramInitDataHeader]: initDataRaw
        },
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, `Request failed with status ${response.status}.`)
        );
      }
    },
    async deletePeriodDay(date) {
      const response = await fetch(`/api/period/log/${encodeURIComponent(date)}`, {
        headers: {
          [telegramInitDataHeader]: initDataRaw
        },
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, `Request failed with status ${response.status}.`)
        );
      }
    },
    async endPeriod(date) {
      return requestJson(
        initDataRaw,
        "/api/period/end",
        {
          body: JSON.stringify({ date }),
          headers: {
            "content-type": "application/json"
          },
          method: "POST"
        },
        (payload) => periodLogResponseSchema.parse(payload)
      );
    },
    async getCalendar(month) {
      return requestJson(
        initDataRaw,
        `/api/calendar?month=${encodeURIComponent(month)}`,
        {
          method: "GET"
        },
        (payload) => calendarResponseSchema.parse(payload)
      );
    },
    async getCheckin(date) {
      return requestJson(
        initDataRaw,
        `/api/checkins/${encodeURIComponent(date)}`,
        {
          method: "GET"
        },
        (payload) => dailyCheckinResponseSchema.parse(payload)
      );
    },
    async getCycleSummary() {
      return requestJson(
        initDataRaw,
        "/api/cycle/summary",
        {
          method: "GET"
        },
        (payload) => cycleSummaryResponseSchema.parse(payload)
      );
    },
    async getHistory(input) {
      const searchParams = new URLSearchParams();

      if (input?.before) {
        searchParams.set("before", input.before);
      }

      const search = searchParams.size > 0 ? `?${searchParams.toString()}` : "";

      return requestJson(
        initDataRaw,
        `/api/history${search}`,
        {
          method: "GET"
        },
        (payload) => historyResponseSchema.parse(payload)
      );
    },
    async getMe() {
      return requestJson(
        initDataRaw,
        "/api/me",
        {
          method: "GET"
        },
        (payload) => meResponseSchema.parse(payload)
      );
    },
    async logPeriod(input) {
      return requestJson(
        initDataRaw,
        "/api/period/log",
        {
          body: JSON.stringify(input),
          headers: {
            "content-type": "application/json"
          },
          method: "POST"
        },
        (payload) => periodLogResponseSchema.parse(payload)
      );
    },
    async saveCheckin(date, input) {
      return requestJson(
        initDataRaw,
        `/api/checkins/${encodeURIComponent(date)}`,
        {
          body: JSON.stringify(input),
          headers: {
            "content-type": "application/json"
          },
          method: "PUT"
        },
        (payload) => dailyCheckinResponseSchema.parse(payload)
      );
    },
    async sendFeedback(message) {
      const response = await fetch("/api/feedback", {
        body: JSON.stringify({ message }),
        headers: {
          "content-type": "application/json",
          [telegramInitDataHeader]: initDataRaw
        },
        method: "POST"
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, `Request failed with status ${response.status}.`)
        );
      }
    },
    async startPeriod(input) {
      return requestJson(
        initDataRaw,
        "/api/period/start",
        {
          body: JSON.stringify(input),
          headers: {
            "content-type": "application/json"
          },
          method: "POST"
        },
        (payload) => periodLogResponseSchema.parse(payload)
      );
    },
    async updateSettings(input) {
      return requestJson(
        initDataRaw,
        "/api/me/settings",
        {
          body: JSON.stringify(input),
          headers: {
            "content-type": "application/json"
          },
          method: "PATCH"
        },
        (payload) => updateUserSettingsResponseSchema.parse(payload)
      );
    }
  };
}

export type { ApiClient };
