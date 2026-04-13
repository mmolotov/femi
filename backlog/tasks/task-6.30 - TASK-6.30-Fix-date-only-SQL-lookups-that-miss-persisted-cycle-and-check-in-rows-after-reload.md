---
id: TASK-6.30
title: >-
  TASK-6.30 - Fix date-only SQL lookups that miss persisted cycle and check-in
  rows after reload
status: Done
assignee: []
created_date: "2026-04-13 08:40"
updated_date: "2026-04-13 09:06"
labels:
  - bug
  - backend
  - postgres
  - telegram
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Investigate whether persisted date-only rows are being missed by server SQL equality/range lookups after reload, leaving summary, calendar, and selected-day reads empty despite successful writes.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Calendar month reads include persisted period rows after a full reload for the authenticated Telegram user.
- [x] #2 Daily selected-date reads return persisted check-in and symptom rows for the same stored date.
- [x] #3 Regression coverage proves the server SQL lookups hit the same stored date-only values that write routes persist.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

Fix Drizzle schema date columns to match the SQL `date` columns created by migrations.

Add a repair path that rebuilds missing non-predicted `cycles` rows from persisted `period_logs` before summary/history reads rely on them.

Cover the repair behavior with regression tests and verify live API payloads for the local Telegram test user.

<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Before the fix, live `app.inject` requests showed `/api/me` returning the correct user/settings, but `/api/cycle/summary` returned `latestPeriodStart = null` and `/api/calendar` was empty because Drizzle was parsing SQL `date` columns through the wrong column type. Existing local data was also partially corrupted because `syncCyclesFromPeriodLogs()` had previously seen no valid period rows and deleted `cycles` rows without recreating them; the new repair path restores those rows automatically from persisted `period_logs`.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Fixed the real root cause behind persisted data disappearing after reload: Drizzle schema columns in `packages/db/src/schema.ts` declared SQL `date` columns as `timestamp(..., { mode: "date" })`, while migrations had created them as `date`. That mismatch produced `Invalid Date` values on the server read-path, so persisted `cycles`, `period_logs`, `daily_checkins`, and `symptom_logs` were dropped during summary/calendar/check-in reads. Updated the schema to use `date(..., { mode: "date" })`, added `packages/db/src/schema.test.ts` to lock the SQL types, and added a self-heal path in `apps/server/src/routes/cycle.ts` that rebuilds missing `cycles` from persisted `period_logs` when old buggy reads had already deleted them. Verified live against the local DB for Telegram user `59163928`: `/api/cycle/summary` now returns `latestPeriodStart = 2026-04-01` and `currentCycleDay = 13`, `/api/calendar?month=2026-04` shows logged and predicted days, and a temporary inserted check-in was returned correctly by `/api/checkins/2026-04-05`.

<!-- SECTION:FINAL_SUMMARY:END -->
