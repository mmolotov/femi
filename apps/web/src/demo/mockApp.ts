import {
  addDaysToIsoDate,
  buildCalendarMonthDays,
  calculateAverageCycleLength,
  calculateAveragePeriodLength,
  calculateCurrentCycleDay,
  differenceInDays,
  formatIsoDate,
  type CalendarResponse,
  type CycleSummaryResponse,
  type DailyCheckinEntry,
  type DailyCheckinRequest,
  type DailyCheckinResponse,
  type FlowIntensity,
  type HistoryResponse,
  type MeResponse,
  type OnboardingSetupRequest,
  type PeriodLogResponse,
  type UpdateUserSettingsRequest,
  type UpdateUserSettingsResponse
} from "@femi/shared";

import type { ApiClient } from "../lib/api";

type DemoCycle = {
  endedOn: string | null;
  startedOn: string;
};

type DemoPeriodLog = {
  flowIntensity: FlowIntensity | null;
  note: string | null;
};

type DemoState = {
  checkins: Record<string, DailyCheckinEntry>;
  cycles: DemoCycle[];
  me: MeResponse;
  periodLogs: Record<string, DemoPeriodLog>;
};

type DemoMode = "preview" | "reset";

function getToday(): string {
  return formatIsoDate(new Date());
}

function hasDemoFlag(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("app_demo") === "1";
}

function createResetState(): DemoState {
  return {
    checkins: {},
    cycles: [],
    me: {
      settings: {
        cycleLengthDays: 28,
        onboardingCompleted: false,
        periodLengthDays: 5,
        remindersEnabled: true,
        timezone: "UTC"
      },
      user: {
        firstName: "Demo",
        id: "c6f3d9d7-f0d6-4fcb-a325-7c4e7bbd0e31",
        languageCode: "en",
        lastName: "User",
        telegramUserId: "0",
        username: "demo_user"
      }
    },
    periodLogs: {}
  };
}

function createPreviewState(): DemoState {
  const today = getToday();
  const currentCycleStart = addDaysToIsoDate(today, -2);
  const previousCycleStart = addDaysToIsoDate(currentCycleStart, -28);
  const previousCycleEnd = addDaysToIsoDate(previousCycleStart, 4);

  return {
    checkins: {
      [today]: {
        date: today,
        discharge: "creamy",
        energy: 3,
        mood: 4,
        note: "Demo preview entry",
        painLevel: 2,
        sleepQuality: 4,
        symptomKeys: ["cramps"]
      }
    },
    cycles: [
      {
        endedOn: null,
        startedOn: currentCycleStart
      },
      {
        endedOn: previousCycleEnd,
        startedOn: previousCycleStart
      }
    ],
    me: {
      settings: {
        cycleLengthDays: 28,
        onboardingCompleted: true,
        periodLengthDays: 5,
        remindersEnabled: true,
        timezone: "UTC"
      },
      user: {
        firstName: "Preview",
        id: "c6f3d9d7-f0d6-4fcb-a325-7c4e7bbd0e31",
        languageCode: "en",
        lastName: "User",
        telegramUserId: "0",
        username: "preview_user"
      }
    },
    periodLogs: {
      [previousCycleStart]: {
        flowIntensity: "light",
        note: null
      },
      [addDaysToIsoDate(previousCycleStart, 1)]: {
        flowIntensity: "medium",
        note: null
      },
      [addDaysToIsoDate(previousCycleStart, 2)]: {
        flowIntensity: "heavy",
        note: null
      },
      [currentCycleStart]: {
        flowIntensity: "light",
        note: null
      },
      [addDaysToIsoDate(currentCycleStart, 1)]: {
        flowIntensity: "medium",
        note: null
      },
      [today]: {
        flowIntensity: "medium",
        note: null
      }
    }
  };
}

function createInitialState(mode: DemoMode): DemoState {
  return mode === "reset" ? createResetState() : createPreviewState();
}

let demoState = createPreviewState();

function cloneState<T>(value: T): T {
  return structuredClone(value);
}

function getCycleLengths(cycles: readonly DemoCycle[]): number[] {
  return cycles.slice(0, -1).map((cycle, index) => {
    const previous = cycles[index + 1];

    return differenceInDays(previous.startedOn, cycle.startedOn);
  });
}

function getPeriodLengths(cycles: readonly DemoCycle[]): number[] {
  return cycles
    .filter((cycle): cycle is { endedOn: string; startedOn: string } => cycle.endedOn !== null)
    .map((cycle) => differenceInDays(cycle.startedOn, cycle.endedOn) + 1);
}

function getSummary(): CycleSummaryResponse {
  const today = getToday();
  const [latestCycle] = demoState.cycles;
  const latestPeriodStart = latestCycle?.startedOn ?? null;
  const latestPeriodEnd =
    latestCycle?.endedOn ??
    (latestPeriodStart
      ? addDaysToIsoDate(latestPeriodStart, demoState.me.settings.periodLengthDays - 1)
      : null);
  const cycleLengths = getCycleLengths(demoState.cycles);
  const periodLengths = getPeriodLengths(demoState.cycles);
  const averageCycleLengthDays = calculateAverageCycleLength(
    cycleLengths,
    demoState.me.settings.cycleLengthDays
  );
  const averagePeriodLengthDays = calculateAveragePeriodLength(
    periodLengths,
    demoState.me.settings.periodLengthDays
  );

  return {
    summary: {
      activePeriod:
        latestPeriodStart !== null &&
        latestPeriodEnd !== null &&
        differenceInDays(latestPeriodStart, today) >= 0 &&
        differenceInDays(today, latestPeriodEnd) >= 0,
      averageCycleLengthDays,
      averagePeriodLengthDays,
      currentCycleDay: calculateCurrentCycleDay(latestPeriodStart, today),
      latestPeriodStart,
      onboardingCompleted: demoState.me.settings.onboardingCompleted,
      predictedNextPeriodStart:
        latestPeriodStart === null
          ? null
          : addDaysToIsoDate(latestPeriodStart, averageCycleLengthDays),
      today
    }
  };
}

function getHistory(limit = 30): HistoryResponse {
  const dates = Array.from(
    new Set([
      ...Object.keys(demoState.checkins),
      ...Object.keys(demoState.periodLogs),
      ...demoState.cycles.flatMap(
        (cycle) => [cycle.startedOn, cycle.endedOn].filter(Boolean) as string[]
      )
    ])
  )
    .sort((left, right) => (left < right ? 1 : left > right ? -1 : 0))
    .slice(0, limit);

  return {
    days: dates.map((date) => ({
      checkin: demoState.checkins[date] ?? null,
      date,
      period: demoState.periodLogs[date]
        ? {
            cycleEnded: demoState.cycles.some((cycle) => cycle.endedOn === date),
            cycleStarted: demoState.cycles.some((cycle) => cycle.startedOn === date),
            date,
            flowIntensity: demoState.periodLogs[date].flowIntensity,
            note: demoState.periodLogs[date].note
          }
        : null,
      symptomKeys: demoState.checkins[date]?.symptomKeys ?? []
    }))
  };
}

function getCalendar(month: string): CalendarResponse {
  const summary = getSummary().summary;

  return {
    days: buildCalendarMonthDays({
      currentCycleStart: summary.latestPeriodStart,
      month,
      periodDays: Object.entries(demoState.periodLogs).map(([date, value]) => ({
        date,
        flowIntensity: value.flowIntensity,
        symptomKeys: demoState.checkins[date]?.symptomKeys ?? []
      })),
      predictedNextPeriodStart: summary.predictedNextPeriodStart,
      predictedPeriodLengthDays: summary.averagePeriodLengthDays,
      today: summary.today
    }),
    month
  };
}

function sortCyclesDescending(): void {
  demoState.cycles.sort((left, right) => (left.startedOn < right.startedOn ? 1 : -1));
}

function upsertPeriodLog(
  date: string,
  flowIntensity?: FlowIntensity,
  note?: string
): PeriodLogResponse {
  demoState.periodLogs[date] = {
    flowIntensity: flowIntensity ?? demoState.periodLogs[date]?.flowIntensity ?? null,
    note: note ?? demoState.periodLogs[date]?.note ?? null
  };

  return {
    entry: {
      cycleEnded: demoState.cycles.some((cycle) => cycle.endedOn === date),
      cycleStarted: demoState.cycles.some((cycle) => cycle.startedOn === date),
      date,
      flowIntensity: demoState.periodLogs[date].flowIntensity,
      note: demoState.periodLogs[date].note
    }
  };
}

export function isDemoAppMode(): boolean {
  return hasDemoFlag();
}

export function createDemoApiClient(): ApiClient {
  demoState = cloneState(createInitialState(hasDemoFlag() ? "reset" : "preview"));

  return {
    async completeOnboarding(input: OnboardingSetupRequest): Promise<UpdateUserSettingsResponse> {
      demoState.me.settings = {
        ...demoState.me.settings,
        cycleLengthDays: input.cycleLengthDays,
        onboardingCompleted: true,
        periodLengthDays: input.periodLengthDays,
        timezone: input.timezone ?? demoState.me.settings.timezone
      };

      return {
        settings: demoState.me.settings
      };
    },
    async endPeriod(date: string): Promise<PeriodLogResponse> {
      const latestOpenCycle = demoState.cycles.find(
        (cycle) => cycle.endedOn === null && cycle.startedOn <= date
      );

      if (latestOpenCycle) {
        latestOpenCycle.endedOn = date;
      }

      return upsertPeriodLog(date);
    },
    async getCalendar(month: string): Promise<CalendarResponse> {
      return getCalendar(month);
    },
    async getCheckin(date: string): Promise<DailyCheckinResponse> {
      return {
        entry: demoState.checkins[date] ?? null
      };
    },
    async getCycleSummary(): Promise<CycleSummaryResponse> {
      return getSummary();
    },
    async getHistory(limit?: number): Promise<HistoryResponse> {
      return getHistory(limit);
    },
    async getMe(): Promise<MeResponse> {
      return cloneState(demoState.me);
    },
    async logPeriod(input): Promise<PeriodLogResponse> {
      return upsertPeriodLog(input.date, input.flowIntensity, input.note);
    },
    async saveCheckin(date: string, input: DailyCheckinRequest): Promise<DailyCheckinResponse> {
      demoState.checkins[date] = {
        date,
        discharge: input.discharge ?? null,
        energy: input.energy ?? null,
        mood: input.mood ?? null,
        note: input.note ?? null,
        painLevel: input.painLevel ?? null,
        sleepQuality: input.sleepQuality ?? null,
        symptomKeys: [...input.symptomKeys]
      };

      return {
        entry: demoState.checkins[date]
      };
    },
    async startPeriod(input): Promise<PeriodLogResponse> {
      if (!demoState.cycles.some((cycle) => cycle.startedOn === input.date)) {
        demoState.cycles.push({
          endedOn: null,
          startedOn: input.date
        });
        sortCyclesDescending();
      }

      return upsertPeriodLog(input.date, input.flowIntensity, input.note);
    },
    async updateSettings(input: UpdateUserSettingsRequest): Promise<UpdateUserSettingsResponse> {
      demoState.me.settings = {
        ...demoState.me.settings,
        ...input
      };

      return {
        settings: demoState.me.settings
      };
    }
  };
}
