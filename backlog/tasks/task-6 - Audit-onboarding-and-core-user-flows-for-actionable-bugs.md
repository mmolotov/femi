---
id: TASK-6
title: Audit onboarding and core user flows for actionable bugs
status: Done
assignee:
  - codex
created_date: "2026-04-11 11:14"
updated_date: "2026-04-11 11:22"
labels:
  - bug
  - audit
  - onboarding
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

The user requested a general review of the project with actionable findings tracked in Backlog tasks and fixes started immediately. Begin with the reported onboarding issue where the cycle input cannot be fully cleared, may save an invalid value, and can leave the user with a stuck form followed by a 500 error after refresh. Use this parent task to coordinate the audit, capture confirmed bugs as child tasks, and fix the highest-priority issues discovered during review.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Reproduce and understand the reported onboarding cycle-input failure and any related persistence/server error path
- [x] #2 Inspect the onboarding and adjacent core flows for additional discrete, actionable bugs in logic or data handling
- [x] #3 Create or update child tasks for each confirmed finding with enough context for independent follow-up
- [x] #4 Implement and validate fixes for the highest-priority confirmed issues within agreed scope
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Audit the onboarding implementation and related persistence paths to reproduce the reported cycle-input bug and identify adjacent logic risks.
2. Create child tasks for each confirmed, discrete bug found during the audit with clear reproduction details and acceptance criteria.
3. Implement and validate fixes for the highest-priority confirmed issues, starting with the onboarding cycle input and server error path.
4. Record progress, outcomes, and remaining follow-ups in the task notes/final summary.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Created child tasks TASK-6.1, TASK-6.2, and TASK-6.3 for the confirmed bugs found during the onboarding/core-flow audit.

Validated the implemented fixes with targeted Vitest suites plus full `pnpm typecheck`, `pnpm lint`, and `pnpm build`.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Completed an initial audit focused on onboarding and adjacent core data-entry flows. Fixed the reported onboarding numeric-input bug, mirrored the safeguard in settings, hardened shared forecast generation against invalid lengths, and fixed a separate daily check-in bug where pain level 0 could not be saved.

<!-- SECTION:FINAL_SUMMARY:END -->
