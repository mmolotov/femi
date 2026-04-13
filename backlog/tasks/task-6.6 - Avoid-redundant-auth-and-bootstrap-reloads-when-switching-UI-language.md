---
id: TASK-6.6
title: Avoid redundant auth and bootstrap reloads when switching UI language
status: Done
assignee:
  - Codex
created_date: "2026-04-11 11:49"
updated_date: "2026-04-11 12:00"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Reduce unnecessary network churn in the auth and session flow. Changing the in-app language currently retriggers Telegram auth and the initial me plus summary bootstrap because effects depend on translated message objects instead of stable state. Language switching should update copy only and not re-authenticate or reload session data unless the actual auth inputs changed.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Switching app language does not issue an extra /api/auth/telegram request when the Telegram session is already established.
- [x] #2 Switching app language does not force a redundant me plus cycle summary bootstrap unless session inputs actually changed.
- [x] #3 Tests cover the no-reauth language-switch path or otherwise lock the dependency behavior against regression.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Remove translated message objects from SessionProvider and AppDataProvider bootstrap effect dependencies while still keeping current fallback text available at runtime.
2. Preserve current auth and data-loading behavior so the only change is eliminating redundant reloads on language switches.
3. Add focused tests that switch language after initial load and assert auth plus bootstrap requests are not reissued.
4. Run the targeted web tests and workspace typecheck, then finalize the task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Removed translated message objects from auth and bootstrap effect dependencies by reading the latest fallback copy through refs instead of rerunning the effects.

Kept existing auth and data-loading control flow unchanged so language changes only rerender copy.

Added focused provider tests that switch language after initial load and assert auth plus bootstrap requests are not repeated, then verified with targeted vitest plus pnpm typecheck.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Stopped language switches from retriggering Telegram auth and initial app bootstrap by removing translated message objects from the effect dependency lists in SessionProvider and AppDataProvider. The providers now read current fallback copy from refs while keeping the original loading behavior intact, and targeted provider tests plus pnpm typecheck verify that changing language no longer reissues auth or me/summary requests.

<!-- SECTION:FINAL_SUMMARY:END -->
