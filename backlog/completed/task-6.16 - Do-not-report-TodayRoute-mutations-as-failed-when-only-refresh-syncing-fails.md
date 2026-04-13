---
id: TASK-6.16
title: Do not report TodayRoute mutations as failed when only refresh syncing fails
status: Done
assignee: []
created_date: "2026-04-11 17:37"
updated_date: "2026-04-11 17:38"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

TodayRoute currently treats post-mutation `refresh()` failures as if the underlying save/remove/log action failed, because each successful mutation awaits `Promise.all([refresh(), loadCalendar(month)])` inside the success path. If the server accepted the mutation but the follow-up summary refresh fails, the UI shows a false save error instead of preserving the successful local result and surfacing sync failure separately.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 After a successful check-in save, a failing follow-up refresh does not show the check-in save error or discard the successful local result.
- [x] #2 After a successful period mutation, a failing follow-up refresh does not show the period save/remove error as if the mutation itself failed.
- [x] #3 A route test covers at least one successful mutation followed by a refresh failure and verifies the UI still reports success for the mutation.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

TodayRoute no longer treats background summary refresh failures as if the underlying mutation failed. After a successful check-in or period mutation the route now keeps the confirmed local result, refreshes the calendar, and ignores a failing follow-up `refresh()` so the UI does not show a false save/remove error. Added a route regression test for a successful check-in save followed by a refresh failure.

<!-- SECTION:FINAL_SUMMARY:END -->
