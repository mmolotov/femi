---
id: TASK-6.31
title: >-
  TASK-6.31 - Address post-review regressions in date formatting and webhook
  registration
status: Done
assignee: []
created_date: '2026-04-13 14:48'
updated_date: '2026-04-13 14:56'
labels:
  - bug
  - backend
  - review
  - telegram
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fix the follow-up review issues after the date-column/schema repair: avoid local-time drift when formatting SQL date values and ensure webhook registration remains safe when TELEGRAM_BOT_SECRET_TOKEN rotates.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Stored SQL date values are formatted consistently in both positive and negative UTC offsets.
- [x] #2 Telegram webhook startup does not skip re-registration solely because the URL matches when a webhook secret may have changed.
- [x] #3 Regression coverage exists for both cases and validation passes.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Validation completed with `pnpm validate` after the review fixes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Addressed the review follow-ups after the date-column repair. `formatStoredDate()` in `apps/server/src/routes/cycle.ts` now uses UTC accessors so SQL `date` values remain stable in both positive and negative UTC offsets. `apps/server/src/lib/telegram-webhook.ts` no longer treats a matching webhook URL as sufficient when a webhook secret token is configured, so secret rotation still re-registers the webhook. Added regression coverage in `apps/server/src/routes/cycle.test.ts` for west-of-UTC drift and in `apps/server/src/lib/telegram-webhook.test.ts` for secret-aware re-registration. Re-ran `pnpm validate` successfully before publishing.
<!-- SECTION:FINAL_SUMMARY:END -->
