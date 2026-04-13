---
id: TASK-6.17
title: Do not block Telegram auth bootstrap on viewport mount
status: Done
assignee: []
created_date: "2026-04-11 18:21"
updated_date: "2026-04-11 18:23"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Local Telegram WebApp testing can stay forever on the loading banner because `initializeTelegramRuntime()` awaits `mountViewport()`. If Telegram never completes the viewport handshake for a local HTTPS Mini App, session bootstrap never reaches `retrieveRawInitData()` and the app stays stuck in `authenticating/loading` instead of proceeding with auth. Viewport mounting should not block the auth-critical path.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Telegram runtime initialization still returns init data and proceeds to auth when viewport mounting stalls or times out.
- [x] #2 Viewport-related CSS var binding and expansion continue to work when viewport mounting succeeds.
- [x] #3 A web test covers the stalled viewport path and verifies initialization resolves instead of hanging indefinitely.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Telegram runtime bootstrap no longer blocks auth on `mountViewport()`. The runtime now waits for viewport mount only up to a short timeout, then continues to read init data and proceed with Telegram auth so local Mini App testing does not stay forever in `authenticating/loading` when the viewport handshake stalls. Added a web test that covers the stalled viewport path and verifies initialization still resolves with init data.

<!-- SECTION:FINAL_SUMMARY:END -->
