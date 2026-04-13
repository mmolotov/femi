---
id: TASK-6.18
title: Skip non-HTTPS Telegram webhook registration in local development
status: Done
assignee: []
created_date: "2026-04-11 18:24"
updated_date: "2026-04-11 18:25"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Local development can crash on server startup when `TELEGRAM_WEBHOOK_URL` points to an HTTP local domain like `http://femi.local:5173/telegram/webhook`. Telegram rejects non-HTTPS webhook URLs, but local Mini App testing does not require webhook registration. Skip invalid/non-HTTPS webhook registration in development so local server startup stays usable.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 In development mode the server does not crash if `TELEGRAM_WEBHOOK_URL` is set to a non-HTTPS URL.
- [x] #2 Production startup behavior still requires a valid HTTPS webhook URL when webhook registration is configured.
- [x] #3 A focused unit test covers the development non-HTTPS skip path and the production validation path.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Server startup now skips Telegram webhook registration for non-HTTPS webhook URLs in development instead of crashing local dev. HTTPS webhook URLs still register normally, and non-HTTPS webhook URLs still fail outside development so production keeps the stricter contract. Added a focused helper and unit tests for the development skip path and the production validation path.

<!-- SECTION:FINAL_SUMMARY:END -->
