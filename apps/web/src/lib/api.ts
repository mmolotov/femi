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

const telegramInitDataHeader = "x-telegram-init-data";

type ApiClient = {
  completeOnboarding(input: OnboardingSetupRequest): Promise<UpdateUserSettingsResponse>;
  deletePeriodDay(date: string): Promise<void>;
  endPeriod(date: string): Promise<PeriodLogResponse>;
  getCalendar(month: string): Promise<CalendarResponse>;
  getCheckin(date: string): Promise<DailyCheckinResponse>;
  getCycleSummary(): Promise<CycleSummaryResponse>;
  getHistory(limit?: number): Promise<HistoryResponse>;
  getMe(): Promise<MeResponse>;
  logPeriod(input: PeriodLogRequest): Promise<PeriodLogResponse>;
  saveCheckin(date: string, input: DailyCheckinRequest): Promise<DailyCheckinResponse>;
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
    const errorText = await response.text();

    throw new Error(errorText || `Request failed with status ${response.status}.`);
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
    async deletePeriodDay(date) {
      const response = await fetch(`/api/period/log/${encodeURIComponent(date)}`, {
        headers: {
          [telegramInitDataHeader]: initDataRaw
        },
        method: "DELETE"
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(errorText || `Request failed with status ${response.status}.`);
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
    async getHistory(limit) {
      const search = limit ? `?limit=${encodeURIComponent(String(limit))}` : "";

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
