---
id: TASK-6.14
title: Reject latestPeriodStart updates after onboarding is complete
status: Done
assignee: []
created_date: "2026-04-11 16:41"
updated_date: "2026-04-11 16:42"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

`/api/me/settings` still accepts `latestPeriodStart` even after onboarding has been completed, but that path seeds cycles and period logs directly instead of treating the change as a safe history edit. Because the UI only sends `latestPeriodStart` during onboarding, the safest server contract is to reject later updates and avoid accidental cycle-history corruption through repeated or out-of-band requests.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 PATCH `/api/me/settings` returns 400 when `latestPeriodStart` is provided after onboarding is already complete.
- [x] #2 Initial onboarding submissions that provide `latestPeriodStart` while onboarding is incomplete continue to work.
- [x] #3 A server route test covers the rejection path.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

`/api/me/settings` now treats `latestPeriodStart` as an onboarding-only field. The route returns 400 if a client tries to send it after onboarding is already complete, which avoids reseeding cycles and period logs through an unsafe post-onboarding settings path. Added a server route test for the rejection case while preserving the existing onboarding happy path.

<!-- SECTION:FINAL_SUMMARY:END -->
