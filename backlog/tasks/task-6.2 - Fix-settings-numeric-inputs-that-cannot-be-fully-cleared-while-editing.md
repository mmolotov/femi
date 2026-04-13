---
id: TASK-6.2
title: Fix settings numeric inputs that cannot be fully cleared while editing
status: Done
assignee:
  - codex
created_date: "2026-04-11 11:16"
updated_date: "2026-04-11 11:22"
labels:
  - bug
  - settings
  - forms
dependencies: []
parent_task_id: TASK-6
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

The settings screen uses the same controlled numeric-input pattern as onboarding for cycle and period length. Because the field state is stored as numbers immediately via Number(event.target.value), users cannot fully clear the existing value during editing and invalid intermediate states can be sent or reflected back into the UI. Update the settings form to support safe text editing and only submit validated numeric values.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Cycle length and period length inputs in settings can be fully cleared and retyped during normal editing
- [x] #2 Invalid intermediate values are kept local to the form and are not submitted to the API
- [x] #3 Saving settings is blocked or handled safely when either numeric field is empty or outside the allowed range
- [x] #4 Existing valid settings still load and save correctly after the change
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Reuse the onboarding numeric-input hardening approach for the settings form so both screens support empty and partially edited values.
2. Keep raw input text in component state, derive parsed numbers only when valid, and prevent invalid submissions.
3. Add or update targeted tests for editable numeric fields and successful saves with valid values.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Applied the same numeric-input hardening pattern from onboarding to the settings form so cycle and period length fields can be cleared and retyped safely.

Save is now blocked unless both numeric fields parse into values within the allowed shared ranges, which keeps invalid intermediate input local to the form.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Refactored settings cycle/period length inputs to keep raw text while editing, derive validated numbers only on save, and disable saving while the fields are empty or out of range. Added a focused test covering clear-and-retype behavior without sending invalid settings to the API.

<!-- SECTION:FINAL_SUMMARY:END -->
