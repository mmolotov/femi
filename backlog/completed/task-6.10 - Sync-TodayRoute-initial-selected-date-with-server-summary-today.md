---
id: TASK-6.10
title: Sync TodayRoute initial selected date with server summary today
status: Done
assignee:
  - Codex
created_date: "2026-04-11 12:54"
updated_date: "2026-04-11 12:58"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Prevent TodayRoute from sticking to a locally derived browser date when the authoritative cycle summary arrives later from the server. The component currently initializes selectedDate and month before summary is available, then almost never realigns to summary.today because the state is already non-empty. This can show the wrong day details and month around timezone boundaries or slow initial loads.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 When summary data arrives after the initial render TodayRoute aligns its initial selected date and month to summary.today unless the user has already manually changed the selection.
- [x] #2 The fix does not overwrite a user-selected calendar date after the user interacts with the calendar.
- [x] #3 Tests cover the late-summary synchronization path and the do-not-clobber-user-selection path.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Track whether the calendar selection has been user-modified so TodayRoute can distinguish initial bootstrap from manual navigation.
2. Reconcile selectedDate and month with summary.today when summary becomes available for the first time and the user has not interacted yet.
3. Add focused route tests for late summary arrival and for preserving a manual user selection.
4. Run targeted web tests, typecheck, and build, then finalize the task.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

TodayRoute now tracks whether the selected day still comes from bootstrap state and realigns that initial selection to `summary.today` when authoritative summary data arrives later. Manual calendar selection switches the route into user-controlled mode so later summary refreshes do not clobber the chosen day. Added route tests that cover late summary bootstrap and preserving a user-selected date.

<!-- SECTION:FINAL_SUMMARY:END -->
