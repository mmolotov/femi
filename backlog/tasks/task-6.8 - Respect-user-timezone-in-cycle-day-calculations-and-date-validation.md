---
id: TASK-6.8
title: Respect user timezone in cycle day calculations and date validation
status: Done
assignee:
  - Codex
created_date: "2026-04-11 12:45"
updated_date: "2026-04-11 12:50"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Make date-sensitive cycle behavior use the user-configured timezone instead of raw UTC now. The application stores timezone in settings, but current today calculations, onboarding defaults, and future-date guards use formatIsoDate(new Date()) directly, which can shift day boundaries for users outside UTC and misclassify valid local dates as future or stale.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Server cycle summary and write-endpoint future-date validation derive today from the user's configured timezone instead of raw UTC.
- [x] #2 Web onboarding and other date defaults do not prefill or validate against a UTC-shifted day when the user timezone differs from UTC.
- [x] #3 Tests cover at least one non-UTC timezone boundary scenario that would previously have produced the wrong date or validation result.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Add a shared helper that derives an ISO calendar date for a specific IANA timezone from a JS Date.
2. Update server summary and future-date validation paths to use the authenticated or requested timezone instead of raw UTC now.
3. Update web onboarding and preview defaults to use the browser or configured timezone when deriving today-related dates.
4. Add regression tests for at least one non-UTC boundary case, then run targeted tests plus typecheck and build.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Added a shared helper that derives ISO calendar dates in a requested IANA timezone with UTC fallback for invalid stored values.

Updated cycle summary and future-date validation paths to use the authenticated or requested timezone rather than raw UTC now, and moved onboarding date validation to the timezone-aware auth path.

Updated onboarding and demo defaults to derive today from the browser timezone and verified the boundary behavior with shared and server tests plus typecheck and build.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Introduced timezone-aware calendar-date derivation and used it for cycle summary generation, future-date validation, onboarding defaults, TodayRoute fallback dates, and demo-mode date seeding. This removes the prior UTC day-boundary drift for non-UTC users, and targeted shared/server/onboarding tests plus pnpm typecheck and pnpm build verify the corrected behavior.

<!-- SECTION:FINAL_SUMMARY:END -->
