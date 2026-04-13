---
id: TASK-6.25
title: Make Telegram webhook registration resilient to watch restarts and rate limits
status: Done
assignee: []
created_date: "2026-04-13 08:09"
updated_date: "2026-04-13 08:10"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Local and tunnel-based development can restart the server quickly enough that repeated `setWebhook` calls hit Telegram rate limits and crash the process. Harden webhook synchronization so identical registrations are skipped when already current and transient 429 responses no longer take down the dev server.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Server startup skips `setWebhook` when Telegram already reports the same webhook URL and secret token configuration is current enough for local/dev usage.
- [x] #2 A Telegram 429 during webhook sync does not crash the development server process.
- [x] #3 Regression tests cover the webhook skip and rate-limit handling logic.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Moved webhook synchronization behavior into `syncTelegramWebhookRegistration` so startup can compare the desired URL with Telegram's current webhook info before calling `setWebhook`.

Development startup now suppresses Telegram 429 rate-limit responses during webhook registration and logs a warning instead of crashing the process.

Added regression tests covering skip-when-already-configured behavior and dev-vs-production handling for Telegram 429 webhook registration errors.

Validated with `pnpm vitest run apps/server/src/lib/telegram-webhook.test.ts`.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Hardened Telegram webhook registration for local and tunnel-based development. Server startup now skips redundant `setWebhook` calls when Telegram already reports the same URL, and development mode no longer crashes on transient Telegram 429 rate limits during watch restarts. The logic is now centralized in the webhook helper and covered by targeted regression tests.

<!-- SECTION:FINAL_SUMMARY:END -->
