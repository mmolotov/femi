---
id: TASK-6.11
title: Handle TodayRoute check-in load failures without silent empty-state fallback
status: Done
assignee: []
created_date: "2026-04-11 13:04"
updated_date: "2026-04-11 13:06"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Prevent TodayRoute from silently resetting the check-in form to an empty state when loading the selected date fails. A failed `getCheckin(date)` request currently clears the UI as if no entry exists and does not surface any error, which can mislead the user into overwriting existing data after a transient server or network failure.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 When loading a selected date check-in fails TodayRoute shows an inline error instead of pretending the date has no saved data.
- [x] #2 The check-in form cannot be submitted while the selected date data is still unavailable because of a load failure.
- [x] #3 A route test covers the failed check-in load path and verifies that save remains blocked until data loads successfully.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

TodayRoute now distinguishes between save errors and load errors for the selected date check-in. If `getCheckin(date)` fails the route shows an inline error, keeps the form non-submittable, and only re-enables editing after a later successful load. Added a route test that covers the failed load path and verifies saving stays blocked until another date loads successfully.

<!-- SECTION:FINAL_SUMMARY:END -->
