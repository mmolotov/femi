import {
  addDaysToIsoDate,
  buildCalendarMonthDays,
  buildCyclePeriodWindows,
  buildPeriodForecast,
  calculateAverageCycleLength,
  calculateAveragePeriodLength,
  calculateCurrentCycleDay,
  differenceInDays,
  formatIsoDate,
  resolveCyclePhase,
  type CalendarResponse,
  type CyclePhase,
  type CycleSummaryResponse,
  type DailyCheckinEntry,
  type DailyCheckinRequest,
  type DailyCheckinResponse,
  type FlowIntensity,
  type HistoryDay,
  type HistoryResponse,
  type MeResponse,
  type OnboardingSetupRequest,
  type PeriodLogResponse,
  type SymptomKey,
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

const flowIntensityLevel: Record<FlowIntensity, number> = {
  heavy: 4,
  light: 2,
  medium: 3,
  spotting: 1
};

function getToday(): string {
  return formatIsoDate(new Date());
}

function buildLoggedPeriodDates(latestPeriodStart: string, periodLengthDays: number, today: string) {
  const periodEnd = addDaysToIsoDate(latestPeriodStart, periodLengthDays - 1);
  const loggedEnd = periodEnd < today ? periodEnd : today;

  if (latestPeriodStart > loggedEnd) {
    return [latestPeriodStart];
  }

  const dates: string[] = [];
  let cursor = latestPeriodStart;

  while (cursor <= loggedEnd) {
    dates.push(cursor);
    cursor = addDaysToIsoDate(cursor, 1);
  }

  return dates;
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
        discharge: null,
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

function getPeriodDateSet(): Set<string> {
  return new Set(Object.keys(demoState.periodLogs));
}

function inferCyclePeriodEnd(cycle: DemoCycle, nextCycleStart: string | null): string {
  const fallbackEnd = addDaysToIsoDate(cycle.startedOn, demoState.me.settings.periodLengthDays - 1);
  let resolvedEnd = cycle.endedOn ?? fallbackEnd;
  const periodDates = getPeriodDateSet();

  if (periodDates.has(cycle.startedOn)) {
    let cursor = cycle.startedOn;

    while (periodDates.has(addDaysToIsoDate(cursor, 1))) {
      const nextDate = addDaysToIsoDate(cursor, 1);

      if (nextCycleStart && nextDate >= nextCycleStart) {
        break;
      }

      cursor = nextDate;
    }

    if (cursor > resolvedEnd) {
      resolvedEnd = cursor;
    }
  }

  if (nextCycleStart && resolvedEnd >= nextCycleStart) {
    return addDaysToIsoDate(nextCycleStart, -1);
  }

  return resolvedEnd;
}

function getSummary(): CycleSummaryResponse {
  const today = getToday();
  const [latestCycle] = demoState.cycles;
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
  const latestPeriodStart = latestCycle?.startedOn ?? null;
  const latestPeriodEnd = latestCycle ? inferCyclePeriodEnd(latestCycle, null) : null;
  const currentCycleDay = calculateCurrentCycleDay(latestPeriodStart, today);
  const forecast = buildPeriodForecast({
    averageCycleLengthDays,
    averagePeriodLengthDays,
    fromDate: today,
    latestCycleStart: latestPeriodStart
  });

  return {
    summary: {
      activePeriod:
        latestPeriodStart !== null &&
        latestPeriodEnd !== null &&
        differenceInDays(latestPeriodStart, today) >= 0 &&
        differenceInDays(today, latestPeriodEnd) >= 0,
      averageCycleLengthDays,
      averagePeriodLengthDays,
      currentCycleDay,
      currentPhase: resolveCyclePhase(
        currentCycleDay,
        averageCycleLengthDays,
        averagePeriodLengthDays
      ),
      forecast,
      latestPeriodStart,
      onboardingCompleted: demoState.me.settings.onboardingCompleted,
      predictedNextPeriodStart: forecast[0]?.periodStart ?? null,
      today
    }
  };
}

function getCalendar(month: string): CalendarResponse {
  const summary = getSummary().summary;

  return {
    days: buildCalendarMonthDays({
      currentCycleStart: summary.latestPeriodStart,
      currentPeriodEnd: demoState.cycles[0] ? inferCyclePeriodEnd(demoState.cycles[0], null) : null,
      month,
      periodDays: Object.entries(demoState.periodLogs).map(([date, value]) => ({
        date,
        flowIntensity: value.flowIntensity,
        symptomKeys: demoState.checkins[date]?.symptomKeys ?? []
      })),
      predictedNextPeriodStart: summary.predictedNextPeriodStart,
      predictedPeriodLengthDays: summary.averagePeriodLengthDays,
      predictedPeriods: summary.forecast,
      today: summary.today
    }),
    month
  };
}

function averageNullable(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getCommonSymptoms(days: readonly HistoryDay[]): SymptomKey[] {
  const counts = new Map<SymptomKey, number>();

  for (const day of days) {
    for (const symptomKey of day.symptomKeys) {
      counts.set(symptomKey, (counts.get(symptomKey) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .slice(0, 3)
    .map(([symptomKey]) => symptomKey);
}

function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    dates.push(cursor);
    cursor = addDaysToIsoDate(cursor, 1);
  }

  return dates;
}

function buildPhaseRanges(
  cycleStart: string,
  cycleLengthDays: number,
  periodLengthDays: number
): Array<{ endDate: string; phase: CyclePhase; startDate: string }> {
  const ovulationStartDay = Math.min(
    cycleLengthDays,
    Math.max(periodLengthDays + 1, cycleLengthDays - 16)
  );
  const ovulationEndDay = Math.min(cycleLengthDays, Math.max(ovulationStartDay, cycleLengthDays - 12));
  const windows: Array<{ endDay: number; phase: CyclePhase; startDay: number }> = [
    { endDay: periodLengthDays, phase: "menstrual", startDay: 1 },
    { endDay: Math.max(periodLengthDays, ovulationStartDay - 1), phase: "follicular", startDay: periodLengthDays + 1 },
    { endDay: ovulationEndDay, phase: "ovulatory", startDay: ovulationStartDay },
    { endDay: cycleLengthDays, phase: "luteal", startDay: ovulationEndDay + 1 }
  ];

  return windows
    .filter((window) => window.startDay <= window.endDay)
    .map((window) => ({
      endDate: addDaysToIsoDate(cycleStart, window.endDay - 1),
      phase: window.phase,
      startDate: addDaysToIsoDate(cycleStart, window.startDay - 1)
    }));
}

function createHistoryDay(date: string, phase: CyclePhase): HistoryDay {
  const cycleStarted = demoState.cycles.some((cycle) => cycle.startedOn === date);
  const cycleEnded = demoState.cycles.some((cycle) => cycle.endedOn === date);

  return {
    checkin: demoState.checkins[date] ?? null,
    date,
    period: demoState.periodLogs[date]
      ? {
          cycleEnded,
          cycleStarted,
          date,
          flowIntensity: demoState.periodLogs[date].flowIntensity,
          note: demoState.periodLogs[date].note
        }
      : null,
    phase,
    symptomKeys: demoState.checkins[date]?.symptomKeys ?? []
  };
}

function getHistory(limit = 6): HistoryResponse {
  const today = getToday();
  const cyclesAscending = [...demoState.cycles].sort((left, right) =>
    left.startedOn < right.startedOn ? -1 : left.startedOn > right.startedOn ? 1 : 0
  );
  const recentCycles = cyclesAscending.slice(-limit);

  return {
    cycles: recentCycles
      .map((cycle, index) => {
        const nextCycle = recentCycles[index + 1] ?? null;
        const nextCycleStart = nextCycle?.startedOn ?? null;
        const cycleLengthDays = nextCycleStart
          ? differenceInDays(cycle.startedOn, nextCycleStart)
          : differenceInDays(cycle.startedOn, today) + 1;
        const periodEnd = inferCyclePeriodEnd(cycle, nextCycleStart);
        const periodLengthDays = differenceInDays(cycle.startedOn, periodEnd) + 1;
        const phases = buildPhaseRanges(cycle.startedOn, cycleLengthDays, periodLengthDays).map(
          (phaseRange) => {
            const days = getDateRange(phaseRange.startDate, phaseRange.endDate).map((date) =>
              createHistoryDay(date, phaseRange.phase)
            );
            const flowLevels = days
              .map((day) => day.period?.flowIntensity)
              .filter((value): value is FlowIntensity => value !== null && value !== undefined)
              .map((value) => flowIntensityLevel[value]);
            const painLevels = days
              .map((day) => day.checkin?.painLevel)
              .filter((value): value is number => value !== null && value !== undefined);
            const moodValues = days
              .map((day) => day.checkin?.mood)
              .filter((value): value is number => value !== null && value !== undefined);
            const energyValues = days
              .map((day) => day.checkin?.energy)
              .filter((value): value is number => value !== null && value !== undefined);

            return {
              averageEnergy: averageNullable(energyValues),
              averageFlowIntensityLevel: averageNullable(flowLevels),
              averageMood: averageNullable(moodValues),
              averagePainLevel: averageNullable(painLevels),
              commonSymptoms: getCommonSymptoms(days),
              days,
              endDate: phaseRange.endDate,
              phase: phaseRange.phase,
              startDate: phaseRange.startDate,
              totalDays: days.length
            };
          }
        );

        return {
          cycleId: `${cycle.startedOn}-${index}`,
          cycleLengthDays: nextCycleStart ? differenceInDays(cycle.startedOn, nextCycleStart) : null,
          endedOn: nextCycleStart ? addDaysToIsoDate(nextCycleStart, -1) : null,
          periodLengthDays,
          phases,
          startedOn: cycle.startedOn
        };
      })
      .reverse()
  };
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

function syncCyclesFromPeriodLogs(): void {
  const cycleWindows = buildCyclePeriodWindows(
    Object.keys(demoState.periodLogs),
    demoState.me.settings.periodLengthDays
  );

  demoState.cycles = cycleWindows
    .map((cycleWindow, index) => ({
      endedOn: index === cycleWindows.length - 1 ? null : cycleWindow.endedOn,
      startedOn: cycleWindow.startedOn
    }))
    .sort((left, right) => (left.startedOn < right.startedOn ? 1 : -1));
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
      demoState.periodLogs = Object.fromEntries(
        buildLoggedPeriodDates(input.latestPeriodStart, input.periodLengthDays, getToday()).map(
          (date) => [
            date,
            {
              flowIntensity: null,
              note: null
            }
          ]
        )
      ) as typeof demoState.periodLogs;
      syncCyclesFromPeriodLogs();

      return {
        settings: demoState.me.settings
      };
    },
    async deletePeriodDay(date: string): Promise<void> {
      delete demoState.periodLogs[date];
      syncCyclesFromPeriodLogs();
    },
    async endPeriod(date: string): Promise<PeriodLogResponse> {
      const latestOpenCycle = demoState.cycles.find(
        (cycle) => cycle.endedOn === null && cycle.startedOn <= date
      );

      if (latestOpenCycle) {
        latestOpenCycle.endedOn = date;
      }

      const response = upsertPeriodLog(date);
      syncCyclesFromPeriodLogs();

      return response;
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
      const response = upsertPeriodLog(input.date, input.flowIntensity, input.note);
      syncCyclesFromPeriodLogs();

      return response;
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
      const response = upsertPeriodLog(input.date, input.flowIntensity, input.note);
      syncCyclesFromPeriodLogs();

      return response;
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
