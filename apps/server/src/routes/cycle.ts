import type { Database } from "@femi/db";
import { cycles, dailyCheckins, periodLogs, symptomLogs } from "@femi/db";
import {
  buildCalendarMonthDays,
  calculateAverageCycleLength,
  calculateAveragePeriodLength,
  calculateCurrentCycleDay,
  calendarQuerySchema,
  calendarResponseSchema,
  dailyCheckinEntrySchema,
  cycleSummaryResponseSchema,
  dailyCheckinRequestSchema,
  dailyCheckinResponseSchema,
  differenceInDays,
  flowIntensityValues,
  formatIsoDate,
  historyQuerySchema,
  historyResponseSchema,
  isPeriodActive,
  periodLogEntrySchema,
  periodEndRequestSchema,
  periodLogRequestSchema,
  periodLogResponseSchema,
  periodStartRequestSchema,
  predictNextPeriodStart,
  type DailyCheckinEntry,
  type FlowIntensity,
  type PeriodLogEntry,
  type SymptomKey
} from "@femi/shared";
import { and, asc, desc, eq, gte, isNull, lte } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { AuthContextError, resolveAuthenticatedUser } from "../lib/auth-context.js";
import type { AppEnv } from "../lib/env.js";
import { authenticatedRouteRateLimit } from "../lib/rate-limit.js";

type CycleRouteDeps = {
  db: Database;
  env: AppEnv;
};

type CycleRow = {
  endedOn: Date | null;
  id: string;
  startedOn: Date;
};

type PeriodLogRow = {
  flowLevel: number | null;
  happenedOn: Date;
  notes: string | null;
};

const dateParamsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date in YYYY-MM-DD format.")
});

const flowIntensityToLevelMap: Record<FlowIntensity, number> = {
  heavy: 4,
  light: 2,
  medium: 3,
  spotting: 1
};

const flowLevels = flowIntensityValues.reduce<Record<number, FlowIntensity>>(
  (accumulator, value) => {
    accumulator[flowIntensityToLevelMap[value]] = value;

    return accumulator;
  },
  {}
);

function parseIsoDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function toIsoDate(value: Date | null): string | null {
  return value ? formatIsoDate(value) : null;
}

function getTodayIsoDate(): string {
  return formatIsoDate(new Date());
}

function getMonthRange(month: string): { end: string; start: string } {
  const [year, monthNumber] = month.split("-").map(Number);
  const monthEnd = new Date(Date.UTC(year, monthNumber, 0));

  return {
    end: formatIsoDate(monthEnd),
    start: `${month}-01`
  };
}

function getCycleLengths(rows: readonly CycleRow[]): number[] {
  return rows.slice(0, -1).map((row, index) => {
    const previousCycle = rows[index + 1];

    return differenceInDays(formatIsoDate(previousCycle.startedOn), formatIsoDate(row.startedOn));
  });
}

function getPeriodLengths(rows: readonly CycleRow[]): number[] {
  return rows
    .filter((row): row is { endedOn: Date; id: string; startedOn: Date } => row.endedOn !== null)
    .map((row) => differenceInDays(formatIsoDate(row.startedOn), formatIsoDate(row.endedOn)) + 1);
}

function levelToFlowIntensity(level: number | null): FlowIntensity | null {
  if (level === null) {
    return null;
  }

  return flowLevels[level] ?? null;
}

function assertCanStartCycle(latestCycle: CycleRow | null, nextStartedOn: string): void {
  if (!latestCycle) {
    return;
  }

  const latestStartedOn = formatIsoDate(latestCycle.startedOn);
  const latestEndedOn = toIsoDate(latestCycle.endedOn);

  if (nextStartedOn === latestStartedOn) {
    return;
  }

  if (differenceInDays(nextStartedOn, latestStartedOn) > 0) {
    throw new AuthContextError(
      "A newer cycle already exists. Starting an earlier cycle would corrupt cycle history.",
      400
    );
  }

  if (latestEndedOn === null) {
    throw new AuthContextError(
      "An active period is already open. End it before starting a new one.",
      400
    );
  }

  if (differenceInDays(nextStartedOn, latestEndedOn) >= 0) {
    throw new AuthContextError(
      "The selected start date overlaps the most recent recorded cycle.",
      400
    );
  }
}

async function loadCycleRows(db: Database, userId: string): Promise<CycleRow[]> {
  return db
    .select({
      endedOn: cycles.endedOn,
      id: cycles.id,
      startedOn: cycles.startedOn
    })
    .from(cycles)
    .where(and(eq(cycles.userId, userId), eq(cycles.predicted, false)))
    .orderBy(desc(cycles.startedOn));
}

async function loadSummaryData(
  db: Database,
  userId: string,
  settings: {
    cycleLengthDays: number;
    onboardingCompleted: boolean;
    periodLengthDays: number;
  }
) {
  const cycleRows = await loadCycleRows(db, userId);
  const latestCycle = cycleRows[0] ?? null;
  const cycleLengths = getCycleLengths(cycleRows);
  const periodLengths = getPeriodLengths(cycleRows);
  const today = getTodayIsoDate();
  const latestPeriodStart = latestCycle ? formatIsoDate(latestCycle.startedOn) : null;
  const latestPeriodEnd = latestCycle ? toIsoDate(latestCycle.endedOn) : null;
  const averageCycleLengthDays = calculateAverageCycleLength(
    cycleLengths,
    settings.cycleLengthDays
  );
  const averagePeriodLengthDays = calculateAveragePeriodLength(
    periodLengths,
    settings.periodLengthDays
  );

  return {
    averageCycleLengthDays,
    averagePeriodLengthDays,
    cycleLengths,
    cycleRows,
    latestPeriodEnd,
    latestPeriodStart,
    summary: {
      activePeriod: isPeriodActive(
        today,
        latestPeriodStart,
        latestPeriodEnd,
        averagePeriodLengthDays
      ),
      averageCycleLengthDays,
      averagePeriodLengthDays,
      currentCycleDay: calculateCurrentCycleDay(latestPeriodStart, today),
      latestPeriodStart,
      onboardingCompleted: settings.onboardingCompleted,
      predictedNextPeriodStart: predictNextPeriodStart(
        latestPeriodStart,
        cycleLengths,
        averageCycleLengthDays
      ),
      today
    }
  };
}

async function loadPeriodLogRow(
  db: Database,
  userId: string,
  date: string
): Promise<PeriodLogRow | null> {
  const [row] = await db
    .select({
      flowLevel: periodLogs.flowLevel,
      happenedOn: periodLogs.happenedOn,
      notes: periodLogs.notes
    })
    .from(periodLogs)
    .where(and(eq(periodLogs.userId, userId), eq(periodLogs.happenedOn, parseIsoDate(date))))
    .limit(1);

  return row ?? null;
}

async function upsertPeriodLog(
  db: Database,
  userId: string,
  date: string,
  values: {
    flowIntensity?: FlowIntensity;
    note?: string;
  }
): Promise<PeriodLogRow> {
  const existingRow = await loadPeriodLogRow(db, userId, date);
  const flowLevel =
    values.flowIntensity !== undefined
      ? flowIntensityToLevelMap[values.flowIntensity]
      : (existingRow?.flowLevel ?? null);
  const notes =
    values.note !== undefined
      ? values.note.trim().length > 0
        ? values.note
        : null
      : (existingRow?.notes ?? null);

  const [row] = await db
    .insert(periodLogs)
    .values({
      flowLevel,
      happenedOn: parseIsoDate(date),
      notes,
      userId
    })
    .onConflictDoUpdate({
      set: {
        flowLevel,
        notes,
        updatedAt: new Date()
      },
      target: [periodLogs.userId, periodLogs.happenedOn]
    })
    .returning({
      flowLevel: periodLogs.flowLevel,
      happenedOn: periodLogs.happenedOn,
      notes: periodLogs.notes
    });

  return row;
}

async function loadSymptomKeys(db: Database, userId: string, date: string): Promise<SymptomKey[]> {
  const rows = await db
    .select({
      symptomKey: symptomLogs.symptomKey
    })
    .from(symptomLogs)
    .where(and(eq(symptomLogs.userId, userId), eq(symptomLogs.happenedOn, parseIsoDate(date))))
    .orderBy(asc(symptomLogs.symptomKey));

  return rows.map((row) => row.symptomKey as SymptomKey);
}

async function syncSymptomKeys(
  db: Database,
  userId: string,
  date: string,
  symptomKeys: readonly SymptomKey[]
): Promise<void> {
  const happenedOn = parseIsoDate(date);

  await db
    .delete(symptomLogs)
    .where(and(eq(symptomLogs.userId, userId), eq(symptomLogs.happenedOn, happenedOn)));

  if (symptomKeys.length === 0) {
    return;
  }

  await db.insert(symptomLogs).values(
    symptomKeys.map((symptomKey) => ({
      happenedOn,
      symptomKey,
      userId
    }))
  );
}

async function buildPeriodEntry(
  db: Database,
  userId: string,
  cycleRows: readonly CycleRow[],
  date: string
) {
  const periodLog = await loadPeriodLogRow(db, userId, date);
  const cycleStarted = cycleRows.some((row) => formatIsoDate(row.startedOn) === date);
  const cycleEnded = cycleRows.some((row) => toIsoDate(row.endedOn) === date);

  return periodLogResponseSchema.shape.entry.parse({
    cycleEnded,
    cycleStarted,
    date,
    flowIntensity: levelToFlowIntensity(periodLog?.flowLevel ?? null),
    note: periodLog?.notes ?? null
  });
}

export async function registerCycleRoutes(
  app: FastifyInstance,
  deps: CycleRouteDeps
): Promise<void> {
  app.get("/api/cycle/summary", authenticatedRouteRateLimit, async (request, reply) => {
    try {
      const authenticatedUser = await resolveAuthenticatedUser(request, deps.db, deps.env);
      const { summary } = await loadSummaryData(
        deps.db,
        authenticatedUser.user.id,
        authenticatedUser.settings
      );

      return reply.send(
        cycleSummaryResponseSchema.parse({
          summary
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

  app.get("/api/calendar", authenticatedRouteRateLimit, async (request, reply) => {
    const parsedQuery = calendarQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return reply.code(400).send({
        error: "Invalid calendar query."
      });
    }

    try {
      const authenticatedUser = await resolveAuthenticatedUser(request, deps.db, deps.env);
      const { averagePeriodLengthDays, summary } = await loadSummaryData(
        deps.db,
        authenticatedUser.user.id,
        authenticatedUser.settings
      );
      const range = getMonthRange(parsedQuery.data.month);

      const [periodRows, symptomRows] = await Promise.all([
        deps.db
          .select({
            flowLevel: periodLogs.flowLevel,
            happenedOn: periodLogs.happenedOn
          })
          .from(periodLogs)
          .where(
            and(
              eq(periodLogs.userId, authenticatedUser.user.id),
              gte(periodLogs.happenedOn, parseIsoDate(range.start)),
              lte(periodLogs.happenedOn, parseIsoDate(range.end))
            )
          )
          .orderBy(asc(periodLogs.happenedOn)),
        deps.db
          .select({
            happenedOn: symptomLogs.happenedOn,
            symptomKey: symptomLogs.symptomKey
          })
          .from(symptomLogs)
          .where(
            and(
              eq(symptomLogs.userId, authenticatedUser.user.id),
              gte(symptomLogs.happenedOn, parseIsoDate(range.start)),
              lte(symptomLogs.happenedOn, parseIsoDate(range.end))
            )
          )
          .orderBy(asc(symptomLogs.happenedOn), asc(symptomLogs.symptomKey))
      ]);

      const markerMap = new Map<
        string,
        {
          flowIntensity: FlowIntensity | null;
          symptomKeys: SymptomKey[];
        }
      >();

      for (const row of periodRows) {
        const date = formatIsoDate(row.happenedOn);

        markerMap.set(date, {
          flowIntensity: levelToFlowIntensity(row.flowLevel),
          symptomKeys: markerMap.get(date)?.symptomKeys ?? []
        });
      }

      for (const row of symptomRows) {
        const date = formatIsoDate(row.happenedOn);
        const existing = markerMap.get(date) ?? {
          flowIntensity: null,
          symptomKeys: []
        };

        markerMap.set(date, {
          ...existing,
          symptomKeys: [...existing.symptomKeys, row.symptomKey as SymptomKey]
        });
      }

      return reply.send(
        calendarResponseSchema.parse({
          days: buildCalendarMonthDays({
            currentCycleStart: summary.latestPeriodStart,
            month: parsedQuery.data.month,
            periodDays: Array.from(markerMap.entries()).map(([date, value]) => ({
              date,
              flowIntensity: value.flowIntensity,
              symptomKeys: value.symptomKeys
            })),
            predictedNextPeriodStart: summary.predictedNextPeriodStart,
            predictedPeriodLengthDays: averagePeriodLengthDays,
            today: summary.today
          }),
          month: parsedQuery.data.month
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

  app.get("/api/history", authenticatedRouteRateLimit, async (request, reply) => {
    const parsedQuery = historyQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return reply.code(400).send({
        error: "Invalid history query."
      });
    }

    try {
      const authenticatedUser = await resolveAuthenticatedUser(request, deps.db, deps.env);
      const limit = parsedQuery.data.limit ?? 30;
      const [checkinRows, periodRows, symptomRows, cycleRows] = await Promise.all([
        deps.db
          .select({
            discharge: dailyCheckins.discharge,
            energy: dailyCheckins.energy,
            happenedOn: dailyCheckins.happenedOn,
            mood: dailyCheckins.mood,
            note: dailyCheckins.note,
            painLevel: dailyCheckins.painLevel,
            sleepQuality: dailyCheckins.sleepQuality
          })
          .from(dailyCheckins)
          .where(eq(dailyCheckins.userId, authenticatedUser.user.id))
          .orderBy(desc(dailyCheckins.happenedOn))
          .limit(limit),
        deps.db
          .select({
            flowLevel: periodLogs.flowLevel,
            happenedOn: periodLogs.happenedOn,
            notes: periodLogs.notes
          })
          .from(periodLogs)
          .where(eq(periodLogs.userId, authenticatedUser.user.id))
          .orderBy(desc(periodLogs.happenedOn))
          .limit(limit),
        deps.db
          .select({
            happenedOn: symptomLogs.happenedOn,
            symptomKey: symptomLogs.symptomKey
          })
          .from(symptomLogs)
          .where(eq(symptomLogs.userId, authenticatedUser.user.id))
          .orderBy(desc(symptomLogs.happenedOn), asc(symptomLogs.symptomKey))
          .limit(limit * 8),
        loadCycleRows(deps.db, authenticatedUser.user.id)
      ]);

      const dayMap = new Map<
        string,
        {
          checkin: DailyCheckinEntry | null;
          period: PeriodLogEntry | null;
          symptomKeys: SymptomKey[];
        }
      >();

      for (const row of symptomRows) {
        const date = formatIsoDate(row.happenedOn);
        const existing = dayMap.get(date) ?? {
          checkin: null,
          period: null,
          symptomKeys: []
        };

        dayMap.set(date, {
          ...existing,
          symptomKeys: [...existing.symptomKeys, row.symptomKey as SymptomKey]
        });
      }

      for (const row of checkinRows) {
        const date = formatIsoDate(row.happenedOn);
        const existing = dayMap.get(date) ?? {
          checkin: null,
          period: null,
          symptomKeys: []
        };

        dayMap.set(date, {
          ...existing,
          checkin: dailyCheckinEntrySchema.parse({
            date,
            discharge: row.discharge,
            energy: row.energy,
            mood: row.mood,
            note: row.note,
            painLevel: row.painLevel,
            sleepQuality: row.sleepQuality,
            symptomKeys: existing.symptomKeys
          })
        });
      }

      for (const row of periodRows) {
        const date = formatIsoDate(row.happenedOn);
        const existing = dayMap.get(date) ?? {
          checkin: null,
          period: null,
          symptomKeys: []
        };

        dayMap.set(date, {
          ...existing,
          period: periodLogEntrySchema.parse({
            cycleEnded: cycleRows.some((cycleRow) => toIsoDate(cycleRow.endedOn) === date),
            cycleStarted: cycleRows.some((cycleRow) => formatIsoDate(cycleRow.startedOn) === date),
            date,
            flowIntensity: levelToFlowIntensity(row.flowLevel),
            note: row.notes
          })
        });
      }

      const days = Array.from(dayMap.entries())
        .sort(([left], [right]) => (left < right ? 1 : left > right ? -1 : 0))
        .slice(0, limit)
        .map(([date, value]) => ({
          checkin:
            value.checkin === null
              ? null
              : dailyCheckinEntrySchema.parse({
                  ...value.checkin,
                  symptomKeys: value.symptomKeys
                }),
          date,
          period: value.period,
          symptomKeys: value.symptomKeys
        }));

      return reply.send(
        historyResponseSchema.parse({
          days
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

  app.get("/api/checkins/:date", authenticatedRouteRateLimit, async (request, reply) => {
    const parsedParams = dateParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return reply.code(400).send({
        error: "Invalid check-in date."
      });
    }

    try {
      const authenticatedUser = await resolveAuthenticatedUser(request, deps.db, deps.env);
      const [checkinRow, symptomKeys] = await Promise.all([
        deps.db
          .select({
            discharge: dailyCheckins.discharge,
            energy: dailyCheckins.energy,
            happenedOn: dailyCheckins.happenedOn,
            mood: dailyCheckins.mood,
            note: dailyCheckins.note,
            painLevel: dailyCheckins.painLevel,
            sleepQuality: dailyCheckins.sleepQuality
          })
          .from(dailyCheckins)
          .where(
            and(
              eq(dailyCheckins.userId, authenticatedUser.user.id),
              eq(dailyCheckins.happenedOn, parseIsoDate(parsedParams.data.date))
            )
          )
          .limit(1)
          .then((rows) => rows[0] ?? null),
        loadSymptomKeys(deps.db, authenticatedUser.user.id, parsedParams.data.date)
      ]);

      if (!checkinRow) {
        return reply.send(
          dailyCheckinResponseSchema.parse({
            entry: null
          })
        );
      }

      return reply.send(
        dailyCheckinResponseSchema.parse({
          entry: {
            date: parsedParams.data.date,
            discharge: checkinRow.discharge,
            energy: checkinRow.energy,
            mood: checkinRow.mood,
            note: checkinRow.note,
            painLevel: checkinRow.painLevel,
            sleepQuality: checkinRow.sleepQuality,
            symptomKeys
          }
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

  app.put("/api/checkins/:date", authenticatedRouteRateLimit, async (request, reply) => {
    const parsedParams = dateParamsSchema.safeParse(request.params);
    const parsedBody = dailyCheckinRequestSchema.safeParse(request.body);

    if (!parsedParams.success || !parsedBody.success) {
      return reply.code(400).send({
        error: "Invalid check-in payload."
      });
    }

    try {
      const authenticatedUser = await resolveAuthenticatedUser(request, deps.db, deps.env);
      const happenedOn = parseIsoDate(parsedParams.data.date);

      const entry = await deps.db.transaction(async (transaction) => {
        const existingRow = await transaction
          .select({
            discharge: dailyCheckins.discharge,
            energy: dailyCheckins.energy,
            mood: dailyCheckins.mood,
            note: dailyCheckins.note,
            painLevel: dailyCheckins.painLevel,
            sleepQuality: dailyCheckins.sleepQuality
          })
          .from(dailyCheckins)
          .where(
            and(
              eq(dailyCheckins.userId, authenticatedUser.user.id),
              eq(dailyCheckins.happenedOn, happenedOn)
            )
          )
          .limit(1)
          .then((rows) => rows[0] ?? null);

        const nextValues = {
          discharge: parsedBody.data.discharge ?? existingRow?.discharge ?? null,
          energy: parsedBody.data.energy ?? existingRow?.energy ?? null,
          mood: parsedBody.data.mood ?? existingRow?.mood ?? null,
          note:
            parsedBody.data.note !== undefined
              ? parsedBody.data.note.trim().length > 0
                ? parsedBody.data.note
                : null
              : (existingRow?.note ?? null),
          painLevel: parsedBody.data.painLevel ?? existingRow?.painLevel ?? null,
          sleepQuality: parsedBody.data.sleepQuality ?? existingRow?.sleepQuality ?? null
        };

        const [checkinRow] = await transaction
          .insert(dailyCheckins)
          .values({
            happenedOn,
            ...nextValues,
            userId: authenticatedUser.user.id
          })
          .onConflictDoUpdate({
            set: {
              ...nextValues,
              updatedAt: new Date()
            },
            target: [dailyCheckins.userId, dailyCheckins.happenedOn]
          })
          .returning({
            discharge: dailyCheckins.discharge,
            energy: dailyCheckins.energy,
            mood: dailyCheckins.mood,
            note: dailyCheckins.note,
            painLevel: dailyCheckins.painLevel,
            sleepQuality: dailyCheckins.sleepQuality
          });

        await syncSymptomKeys(
          transaction,
          authenticatedUser.user.id,
          parsedParams.data.date,
          parsedBody.data.symptomKeys
        );

        return {
          date: parsedParams.data.date,
          discharge: checkinRow.discharge,
          energy: checkinRow.energy,
          mood: checkinRow.mood,
          note: checkinRow.note,
          painLevel: checkinRow.painLevel,
          sleepQuality: checkinRow.sleepQuality,
          symptomKeys: [...parsedBody.data.symptomKeys]
        };
      });

      return reply.send(
        dailyCheckinResponseSchema.parse({
          entry
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

  app.post("/api/period/log", authenticatedRouteRateLimit, async (request, reply) => {
    const parsedBody = periodLogRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({
        error: "Invalid period log payload."
      });
    }

    try {
      const authenticatedUser = await resolveAuthenticatedUser(request, deps.db, deps.env);

      await upsertPeriodLog(deps.db, authenticatedUser.user.id, parsedBody.data.date, {
        flowIntensity: parsedBody.data.flowIntensity,
        note: parsedBody.data.note
      });

      const cycleRows = await loadCycleRows(deps.db, authenticatedUser.user.id);

      return reply.send(
        periodLogResponseSchema.parse({
          entry: await buildPeriodEntry(
            deps.db,
            authenticatedUser.user.id,
            cycleRows,
            parsedBody.data.date
          )
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

  app.post("/api/period/start", authenticatedRouteRateLimit, async (request, reply) => {
    const parsedBody = periodStartRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({
        error: "Invalid period start payload."
      });
    }

    try {
      const authenticatedUser = await resolveAuthenticatedUser(request, deps.db, deps.env);

      await deps.db.transaction(async (transaction) => {
        const [latestCycle] = await transaction
          .select({
            endedOn: cycles.endedOn,
            id: cycles.id,
            startedOn: cycles.startedOn
          })
          .from(cycles)
          .where(and(eq(cycles.userId, authenticatedUser.user.id), eq(cycles.predicted, false)))
          .orderBy(desc(cycles.startedOn))
          .limit(1);

        assertCanStartCycle(latestCycle ?? null, parsedBody.data.date);

        await upsertPeriodLog(transaction, authenticatedUser.user.id, parsedBody.data.date, {
          flowIntensity: parsedBody.data.flowIntensity,
          note: parsedBody.data.note
        });

        await transaction
          .insert(cycles)
          .values({
            predicted: false,
            startedOn: parseIsoDate(parsedBody.data.date),
            userId: authenticatedUser.user.id
          })
          .onConflictDoUpdate({
            set: {
              predicted: false,
              updatedAt: new Date()
            },
            target: [cycles.userId, cycles.startedOn]
          });
      });

      const cycleRows = await loadCycleRows(deps.db, authenticatedUser.user.id);

      return reply.send(
        periodLogResponseSchema.parse({
          entry: await buildPeriodEntry(
            deps.db,
            authenticatedUser.user.id,
            cycleRows,
            parsedBody.data.date
          )
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

  app.post("/api/period/end", authenticatedRouteRateLimit, async (request, reply) => {
    const parsedBody = periodEndRequestSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({
        error: "Invalid period end payload."
      });
    }

    try {
      const authenticatedUser = await resolveAuthenticatedUser(request, deps.db, deps.env);

      await deps.db.transaction(async (transaction) => {
        const [latestCycle] = await transaction
          .select({
            endedOn: cycles.endedOn,
            id: cycles.id,
            startedOn: cycles.startedOn
          })
          .from(cycles)
          .where(
            and(
              eq(cycles.userId, authenticatedUser.user.id),
              eq(cycles.predicted, false),
              isNull(cycles.endedOn),
              lte(cycles.startedOn, parseIsoDate(parsedBody.data.date))
            )
          )
          .orderBy(desc(cycles.startedOn))
          .limit(1);

        if (!latestCycle) {
          throw new AuthContextError("No started period was found to end.", 400);
        }

        await transaction
          .update(cycles)
          .set({
            endedOn: parseIsoDate(parsedBody.data.date),
            updatedAt: new Date()
          })
          .where(eq(cycles.id, latestCycle.id));

        await upsertPeriodLog(transaction, authenticatedUser.user.id, parsedBody.data.date, {});
      });

      const cycleRows = await loadCycleRows(deps.db, authenticatedUser.user.id);

      return reply.send(
        periodLogResponseSchema.parse({
          entry: await buildPeriodEntry(
            deps.db,
            authenticatedUser.user.id,
            cycleRows,
            parsedBody.data.date
          )
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
