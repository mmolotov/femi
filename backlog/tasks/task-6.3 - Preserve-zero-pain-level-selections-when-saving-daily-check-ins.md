---
id: TASK-6.3
title: Preserve zero pain-level selections when saving daily check-ins
status: Done
assignee:
  - codex
created_date: "2026-04-11 11:20"
updated_date: "2026-04-11 11:22"
labels:
  - bug
  - today
  - checkin
dependencies: []
parent_task_id: TASK-6
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

The daily check-in form allows a pain level of 0, but the save payload currently uses a truthy check (`formState.painLevel || undefined`). As a result, selecting 0 is dropped before the request is sent, so users cannot persist an explicit no-pain entry. Update the save path to preserve 0 while still omitting an unset value.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Selecting pain level 0 in the daily check-in form sends 0 in the save payload instead of omitting the field
- [x] #2 Leaving pain level unselected still omits the field from the payload
- [x] #3 Other check-in fields continue to save as before
- [x] #4 A targeted test covers the zero-pain save path
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Inspect the TodayRoute save payload and form-state shape to confirm why pain level 0 is dropped.
2. Replace the truthy check with an explicit empty-state check so 0 is preserved while an unselected value remains omitted.
3. Add a focused test that saves a check-in with pain level 0 and verifies the API receives that value.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Confirmed the daily check-in save payload used a truthy check for pain level, which dropped the valid value 0 before submission.

Changed the payload mapping to preserve 0 while still omitting the field when the select is left empty, and added a focused regression test.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Fixed daily check-in payload construction so a selected pain level of 0 is preserved instead of being converted to undefined. Added a regression test to verify zero-pain submissions reach the API correctly.

<!-- SECTION:FINAL_SUMMARY:END -->
