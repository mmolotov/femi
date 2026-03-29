import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
};

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  telegramUserId: bigint("telegram_user_id", { mode: "bigint" }).notNull().unique(),
  username: varchar("username", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  languageCode: varchar("language_code", { length: 32 }),
  ...timestamps
});

export const userSettings = pgTable("user_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  cycleLengthDays: integer("cycle_length_days").default(28).notNull(),
  periodLengthDays: integer("period_length_days").default(5).notNull(),
  timezone: varchar("timezone", { length: 64 }).default("UTC").notNull(),
  remindersEnabled: boolean("reminders_enabled").default(true).notNull(),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  ...timestamps
});

export const cycles = pgTable(
  "cycles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startedOn: timestamp("started_on", { mode: "date" }).notNull(),
    endedOn: timestamp("ended_on", { mode: "date" }),
    predicted: boolean("predicted").default(false).notNull(),
    ...timestamps
  },
  (table) => ({
    userStartedOnUniqueIdx: uniqueIndex("cycles_user_started_on_idx").on(
      table.userId,
      table.startedOn
    )
  })
);

export const periodLogs = pgTable(
  "period_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    happenedOn: timestamp("happened_on", { mode: "date" }).notNull(),
    flowLevel: integer("flow_level"),
    notes: text("notes"),
    ...timestamps
  },
  (table) => ({
    userHappenedOnUniqueIdx: uniqueIndex("period_logs_user_happened_on_idx").on(
      table.userId,
      table.happenedOn
    )
  })
);

export const dailyCheckins = pgTable(
  "daily_checkins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    happenedOn: timestamp("happened_on", { mode: "date" }).notNull(),
    mood: integer("mood"),
    energy: integer("energy"),
    painLevel: integer("pain_level"),
    discharge: varchar("discharge", { length: 64 }),
    sleepQuality: integer("sleep_quality"),
    note: text("note"),
    ...timestamps
  },
  (table) => ({
    userHappenedOnUniqueIdx: uniqueIndex("daily_checkins_user_happened_on_idx").on(
      table.userId,
      table.happenedOn
    )
  })
);

export const symptomLogs = pgTable(
  "symptom_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    happenedOn: timestamp("happened_on", { mode: "date" }).notNull(),
    symptomKey: varchar("symptom_key", { length: 64 }).notNull(),
    severity: integer("severity"),
    ...timestamps
  },
  (table) => ({
    userHappenedOnSymptomUniqueIdx: uniqueIndex("symptom_logs_user_happened_on_symptom_idx").on(
      table.userId,
      table.happenedOn,
      table.symptomKey
    )
  })
);

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }),
  body: text("body").notNull(),
  happenedOn: timestamp("happened_on", { mode: "date" }),
  ...timestamps
});

export const reminders = pgTable("reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 64 }).notNull(),
  cronExpression: varchar("cron_expression", { length: 64 }),
  hourOfDay: integer("hour_of_day"),
  minuteOfHour: integer("minute_of_hour"),
  enabled: boolean("enabled").default(true).notNull(),
  payload: jsonb("payload"),
  ...timestamps
});

export const notificationJobs = pgTable("notification_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  reminderId: uuid("reminder_id").references(() => reminders.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  payload: jsonb("payload"),
  ...timestamps
});

export const contraceptionLogs = pgTable("contraception_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  happenedOn: timestamp("happened_on", { mode: "date" }).notNull(),
  method: varchar("method", { length: 64 }).notNull(),
  notes: text("notes"),
  ...timestamps
});

export const schema = {
  users,
  userSettings,
  cycles,
  periodLogs,
  dailyCheckins,
  symptomLogs,
  notes,
  reminders,
  notificationJobs,
  contraceptionLogs
};
