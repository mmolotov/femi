---
id: TASK-6.1
title: Fix onboarding cycle input deletion and invalid persistence path
status: Done
assignee:
  - codex
created_date: "2026-04-11 11:14"
updated_date: "2026-04-11 11:22"
labels:
  - bug
  - onboarding
  - forms
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

On the onboarding screen, the user cannot fully clear the prefilled cycle value before entering a new one. This can cause an invalid value to be saved, leave the form in a broken state, and produce a server-side 500 after the page is refreshed. Investigate the UI state handling, validation, and persistence path so the field can be edited safely and invalid intermediate input does not corrupt saved onboarding data.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 The cycle-related input can be fully cleared and replaced using normal keyboard editing on the onboarding screen
- [x] #2 Intermediate empty or partially edited values do not get persisted as invalid cycle data
- [x] #3 Submitting or autosaving onboarding data with invalid cycle values is blocked with user-safe handling instead of corrupting saved state
- [x] #4 Refreshing after an invalid edit attempt does not produce a 500 and the onboarding form remains usable
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Locate the onboarding screen, the cycle-related form field, and the persistence/API code involved in saving onboarding state.
2. Reproduce the bug and trace how controlled input state, parsing, and validation handle empty or partially edited values.
3. Update the UI and save path so users can clear and replace the value safely, while invalid intermediate input is not persisted.
4. Add or update targeted tests for form editing, validation, and refresh/persistence behavior, then run the relevant validation commands.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Reproduced the root cause in the onboarding numeric inputs: controlled number fields immediately coerced empty/partial edits to numbers, which prevented full clearing and allowed invalid intermediate values to drive preview logic.

Hardened onboarding by storing raw numeric input strings, only enabling submit when parsed values are within the shared cycle/period ranges, and falling back to the last valid values for preview rendering.

Added a shared forecast guard so non-positive lengths return an empty forecast instead of entering an infinite loop during preview rendering.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Updated onboarding cycle/period inputs to use raw editable text state with validated numeric submission only, preventing empty/partial edits from being persisted or freezing the preview. Also hardened shared forecast generation against invalid non-positive lengths and added targeted tests for clear-and-retype behavior plus invalid forecast inputs.

<!-- SECTION:FINAL_SUMMARY:END -->
