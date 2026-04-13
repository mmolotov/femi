---
id: TASK-6.4
title: Reject invalid and future dates across cycle write APIs
status: Done
assignee:
  - Codex
created_date: "2026-04-11 11:49"
updated_date: "2026-04-11 11:54"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Prevent server-side date corruption in cycle and onboarding flows. The API currently accepts any string matching YYYY-MM-DD and later normalizes impossible dates via Date.UTC, which can silently write records to the wrong calendar day. Write endpoints should reject impossible dates and future dates with 400 responses instead of coercing them.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Shared or server date validation rejects impossible calendar dates such as 2026-02-31 and 2026-13-40 before any database write occurs.
- [x] #2 Cycle and onboarding write endpoints reject future dates for latest period start period log period start period end and daily check-in mutations.
- [x] #3 Regression tests cover invalid-date and future-date requests for the affected routes.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Add strict ISO date validation that rejects impossible calendar dates instead of relying on regex-only parsing.
2. Apply future-date guards to onboarding settings updates and cycle write endpoints before any database writes.
3. Extend route tests to cover impossible dates and future-date payloads for affected mutations.
4. Run targeted route and shared tests, then update task notes and acceptance criteria.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Implemented strict shared date validation for real ISO dates and real year-month values.

Added future-date guards for onboarding settings and cycle write endpoints before auth or database work.

Verified with targeted vitest suite for shared and server routes plus workspace typecheck.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Strengthened date validation so impossible calendar dates no longer pass shared schemas or cycle route params, and write endpoints now reject future dates before auth or persistence. Added regression coverage in shared and server route tests and verified with targeted vitest plus pnpm typecheck.

<!-- SECTION:FINAL_SUMMARY:END -->
