---
id: TASK-6.22
title: Harden dashboard cycle summary against invalid or corrupted stored dates
status: Done
assignee: []
created_date: "2026-04-13 07:20"
updated_date: "2026-04-13 07:22"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

The dashboard can still fail with `RangeError: Invalid time value` while loading `/api/cycle/summary` if stored cycle data contains an invalid JS Date value or legacy-corrupted record. Tighten the validation path so dashboard-triggered reads and writes cannot crash the app, and add regression coverage around malformed stored dates.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Dashboard summary requests do not throw a 500 when cycle rows or period rows contain invalid Date objects; malformed records are ignored or handled safely.
- [x] #2 Server-side date writes continue to reject invalid user-supplied ISO dates before persistence.
- [x] #3 Regression tests cover the malformed-date summary case and the relevant settings/date validation path.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Hardened cycle route date handling so malformed `Date` objects coming back from the database are filtered or normalized before summary, calendar, and history formatting paths call `formatIsoDate`.

Confirmed that impossible user-supplied ISO dates remain rejected on the write path by the existing request-schema validation and route tests in `apps/server/src/routes/me.test.ts` and `apps/server/src/routes/cycle.test.ts`.

Added a regression test that injects invalid stored cycle and period dates and verifies `/api/cycle/summary` still returns 200 instead of throwing `RangeError: Invalid time value`.

Validated with `pnpm vitest run apps/server/src/routes/cycle.test.ts apps/server/src/routes/me.test.ts`.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Hardened dashboard-related cycle data loading against malformed stored dates. Cycle, period, check-in, and symptom rows are now filtered or normalized before any summary/calendar/history formatting uses them, so corrupted legacy rows no longer crash `/api/cycle/summary` with `RangeError: Invalid time value`. The existing write-path validation for impossible ISO dates remains in place, and regression coverage now includes the malformed-date summary scenario plus the existing settings/date validation tests.

<!-- SECTION:FINAL_SUMMARY:END -->
