---
id: TASK-6.20
title: Do not treat the Telegram bridge script alone as a real Telegram runtime
status: Done
assignee: []
created_date: "2026-04-11 18:36"
updated_date: "2026-04-11 18:37"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

The web app currently treats `window.Telegram.WebApp` as sufficient evidence of a Telegram runtime, but the bridge script is loaded on every page, including plain browser sessions. This causes regular browser visits such as `/?app_demo=1` to enter the Telegram auth path instead of browser preview mode. Runtime detection should require actual Telegram launch markers like `tgWebAppPlatform` or non-empty init data.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Opening the app in a plain browser with the Telegram bridge script loaded but without Telegram launch params falls back to browser preview mode.
- [x] #2 Real Telegram launches with actual launch params or init data still enter the Telegram auth path.
- [x] #3 A runtime test covers the browser-with-bridge-script case and verifies initialization returns `environment: "browser"`.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Telegram runtime detection no longer treats the presence of the bridge script alone as proof of a real Telegram launch. Browser sessions now require actual Telegram launch markers such as `tgWebAppPlatform`, non-empty init data, or an init-data user before entering the Telegram auth path, so plain browser visits like `/?app_demo=1` fall back to browser preview mode again. Added a runtime test for the browser-with-bridge-script case.

<!-- SECTION:FINAL_SUMMARY:END -->
