---
id: TASK-6.29
title: >-
  TASK-6.29 - Fix dashboard read-path after onboarding when persisted data does
  not render
status: Done
assignee: []
created_date: "2026-04-13 08:32"
updated_date: "2026-04-13 08:38"
labels:
  - bug
  - frontend
  - backend
  - telegram
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Investigate and fix the case where onboarding and daily data are written successfully to the database, but after reload the frontend still renders empty summary/calendar state for the authenticated Telegram user.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 After successful onboarding, a full page reload still shows the persisted cycle summary for the same Telegram user.
- [x] #2 Logged period/check-in data remains visible in calendar and selected day views after reload.
- [x] #3 Regression coverage proves the persisted read path uses the same authenticated user data that was just written.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Real local DB inspection for Telegram user `59163928` showed rows such as `started_on = 2026-03-31T22:00:00.000Z` and `happened_on = 2026-04-01T22:00:00.000Z` while the intended local dates were `2026-04-01` and `2026-04-02`. That confirmed the date-only drift was happening on read, not on write.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Fixed a timezone-sensitive read-path bug for Postgres date-only columns in `apps/server/src/routes/cycle.ts`. The server had been formatting DB `Date` values with `toISOString()`, which shifted stored local calendar dates back by one day on non-UTC hosts like local `Europe/Belgrade`, causing persisted onboarding and calendar data to disappear after reload. Added a dedicated formatter for DB-backed date-only values, switched cycle/calendar/history summary reads to use it, and added a regression test that simulates Postgres returning local-midnight dates on a non-UTC machine. Also tightened the telegram webhook helper types so `pnpm typecheck` is green again.

<!-- SECTION:FINAL_SUMMARY:END -->
