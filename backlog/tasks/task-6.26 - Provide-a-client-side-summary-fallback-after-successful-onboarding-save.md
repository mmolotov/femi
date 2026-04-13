---
id: TASK-6.26
title: Provide a client-side summary fallback after successful onboarding save
status: Done
assignee: []
created_date: "2026-04-13 08:13"
updated_date: "2026-04-13 08:14"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

After successful onboarding persistence, the first follow-up summary refresh can still fail transiently, leaving the user with no summary-driven calendar state even though onboarding completed. Build a client-side fallback summary from the saved onboarding input and returned settings so the dashboard calendar still renders meaningful state until the next successful refresh.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 After a successful onboarding save, the app can render a non-empty summary/calendar fallback even if the immediate summary refresh fails.
- [x] #2 The fallback summary uses the saved onboarding start date and settings to populate current period and forecast fields consistently.
- [x] #3 Regression tests cover the successful-onboarding plus failed-summary-refresh scenario and verify that summary-backed UI data remains available.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Added a client-side `buildOnboardingSummaryFallback` helper in `AppDataProvider` that synthesizes summary state from the just-saved onboarding input using the same shared forecast and phase helpers as the rest of the app.

After a successful onboarding PATCH, if the immediate `getMe/getCycleSummary` refresh still fails, the provider now sets `summary` from the onboarding-derived fallback instead of leaving the app with a ready state but no useful summary-backed calendar data.

Expanded the onboarding fallback regression test to assert that a usable `latestPeriodStart` is present in provider state after the failed refresh path.

Validated with `pnpm vitest run apps/web/src/data/AppDataProvider.test.tsx apps/web/src/components/OnboardingGate.test.tsx`.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Added a proper client-side summary fallback for the successful-onboarding-but-refresh-failed path. The app now derives a usable summary from the saved onboarding input, including current period, forecast, phase, and latest period start, so the calendar can render immediately instead of appearing empty until a later successful refresh.

<!-- SECTION:FINAL_SUMMARY:END -->
