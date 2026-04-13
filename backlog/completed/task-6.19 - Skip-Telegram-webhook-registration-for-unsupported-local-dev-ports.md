---
id: TASK-6.19
title: Skip Telegram webhook registration for unsupported local dev ports
status: Done
assignee: []
created_date: "2026-04-11 18:29"
updated_date: "2026-04-11 18:29"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Local development can still crash on startup when `TELEGRAM_WEBHOOK_URL` uses HTTPS but points to an unsupported Telegram webhook port like `5173`. Telegram only accepts webhook ports `80`, `88`, `443`, or `8443`, but local Mini App testing on Vite does not need webhook registration at all. Extend local-dev webhook validation so unsupported ports are skipped instead of crashing the server.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 In development mode the server does not crash if `TELEGRAM_WEBHOOK_URL` uses an unsupported Telegram webhook port such as `5173`.
- [x] #2 Valid HTTPS webhook URLs on Telegram-supported ports still pass through unchanged.
- [x] #3 A focused unit test covers the unsupported-port skip path and the non-development validation path.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Extended local-dev Telegram webhook validation to also skip HTTPS webhook URLs that use unsupported Telegram ports such as `5173`. Valid HTTPS webhook URLs on Telegram-supported ports still pass through unchanged, while unsupported ports still fail outside development. Added focused unit tests for both the development skip path and the non-development validation path.

<!-- SECTION:FINAL_SUMMARY:END -->
