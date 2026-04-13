---
id: TASK-6.24
title: Fix Telegram onboarding persistence flow and Today calendar month navigation
status: Done
assignee: []
created_date: "2026-04-13 07:57"
updated_date: "2026-04-13 07:59"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Users can currently complete onboarding in Telegram and still appear stuck because the post-save refresh path rolls the UI back if follow-up data loading fails. The Today calendar month navigation also resets back to the summary month because bootstrap syncing still owns the month state after the user starts navigating. Fix both flows and add regression coverage.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Successful onboarding submissions are not visually rolled back by a secondary refresh failure; the app preserves the persisted settings state and exits onboarding.
- [x] #2 Today calendar month navigation continues to the user-selected month instead of snapping back to the summary month.
- [x] #3 Regression tests cover the onboarding post-save fallback behavior and the Today month navigation behavior.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Adjusted `AppDataProvider.completeOnboarding` so a successful onboarding PATCH no longer visually rolls back if the follow-up `getMe/getCycleSummary` refresh fails. The provider now preserves the persisted settings state and returns to `ready` using the response payload as a fallback.

Separated bootstrap-controlled month syncing from user-controlled month navigation in `TodayRoute` by tracking a dedicated `monthSource`. Once the user navigates months manually, the summary sync no longer snaps the month back.

Added web regression coverage for the onboarding post-save refresh fallback and for Today calendar month navigation with a stable user-selected month.

Validated with `pnpm vitest run apps/web/src/data/AppDataProvider.test.tsx apps/web/src/components/OnboardingGate.test.tsx apps/web/src/routes/TodayRoute.test.tsx`.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Fixed two frontend regressions affecting Telegram usage. Onboarding completion no longer appears unsaved when the initial post-save data refresh fails, because the app now preserves the successful settings response and exits onboarding instead of reverting to the previous state. The Today calendar also no longer snaps back to the summary month after the user clicks previous/next month, because month navigation is now treated as user-owned state once the user interacts with it.

<!-- SECTION:FINAL_SUMMARY:END -->
