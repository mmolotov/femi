---
id: TASK-6.5
title: Allow daily check-in fields to be cleared after they were previously saved
status: Done
assignee:
  - Codex
created_date: "2026-04-11 11:49"
updated_date: "2026-04-11 11:59"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Restore expected edit behavior for daily check-ins. After a value is saved for mood energy sleep discharge or note, the user should be able to clear it back to an empty state. The current client/server contract treats omitted fields as keep-existing, so clearing inputs does not persist.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Submitting a daily check-in with previously filled scalar fields cleared removes those values from storage instead of keeping stale data.
- [x] #2 The request and persistence contract still preserves legitimate zero-valued painLevel selections.
- [x] #3 Web or route tests cover clearing previously saved check-in values and prevent regression.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Update the daily check-in request contract so clients can explicitly clear previously saved scalar fields without losing support for zero pain levels.
2. Change Today route payload construction to send nulls only for fields that were previously persisted and are now intentionally cleared.
3. Update server persistence to distinguish undefined keep-existing from null clear-this-field semantics.
4. Add regression tests on web and server layers, then run targeted tests and typecheck.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Extended daily check-in request semantics so explicit null means clear-this-field while undefined still means keep-existing.

Updated Today route payload building to compare against the loaded entry and send null only for intentionally cleared persisted values.

Changed server persistence to drop fully empty check-ins instead of leaving stale or all-null rows and verified with targeted vitest plus pnpm typecheck.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Adjusted the daily check-in contract so cleared persisted fields are sent as explicit nulls, while zero pain levels still round-trip correctly. Updated Today route payload generation, server-side field resolution, and demo persistence to remove fully empty entries, then added shared, route, and web regression tests and re-ran targeted vitest plus pnpm typecheck.

<!-- SECTION:FINAL_SUMMARY:END -->
