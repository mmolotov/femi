---
id: TASK-6.27
title: Apply confirmed local calendar mutations after successful day save actions
status: Done
assignee: []
created_date: "2026-04-13 08:21"
updated_date: "2026-04-13 08:22"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Even when day-save APIs return 200, the UI can still look unchanged if the immediate calendar reread is stale or lags behind the write. Update TodayRoute so confirmed period-day and check-in saves patch the currently loaded month state locally after the save succeeds, keeping the visible calendar and selected day in sync with the acknowledged server write.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 After a successful period-day save, the current calendar month immediately reflects the logged day state without waiting for a second successful reread.
- [x] #2 After a successful check-in save, the current calendar month immediately reflects the saved symptom markers for that date.
- [x] #3 Regression tests cover at least the period-day optimistic patch behavior after a stale calendar reread.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Added local calendar patch helpers in `TodayRoute` so successful day-save actions update the currently loaded month state directly after the confirmed write, instead of relying solely on the immediate `/api/calendar` reread.

Successful period-day saves now mark the selected day as logged locally even if the follow-up calendar response is stale; successful check-in saves now locally patch symptom markers for that date.

Added a regression test that reproduces a stale calendar reread after `Mark period day` and verifies the UI still shows the date as logged.

Validated with `pnpm vitest run apps/web/src/routes/TodayRoute.test.tsx`.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Made the Today calendar resilient to stale follow-up reads after successful day-save actions. Period-day and check-in writes now patch the current month in local UI state after the server confirms the save, so the selected day immediately reflects the acknowledged mutation even if the next `/api/calendar` response still lags behind.

<!-- SECTION:FINAL_SUMMARY:END -->
