---
id: TASK-6.7
title: Fail closed when Telegram bootstrap is detected but init data is unavailable
status: Done
assignee:
  - Codex
created_date: "2026-04-11 12:39"
updated_date: "2026-04-11 12:40"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Prevent the web app from silently entering browser preview and demo mode when Telegram runtime is present but bootstrap or SDK initialization fails. Inside Telegram, missing init data or runtime setup errors should surface as an authentication or bootstrap error instead of showing fake preview data.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 When Telegram runtime is detected but bootstrap fails or init data is unavailable the session enters an error state rather than preview mode.
- [x] #2 App data bootstrap does not switch to demo API for Telegram bootstrap failures.
- [x] #3 Tests cover the Telegram bootstrap failure path and prevent regression.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Extend Telegram runtime bootstrap results so SessionProvider can distinguish true browser preview from detected Telegram bootstrap failure.
2. Change SessionProvider to fail closed with an error state when Telegram runtime is present but init data cannot be obtained.
3. Verify AppDataProvider no longer enters demo mode for that path and add focused provider tests for the bootstrap failure scenario.
4. Run targeted web tests, build, and typecheck, then finalize the task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Changed Telegram runtime bootstrap to keep telegram environment when runtime is detected, even if init data retrieval fails.

Updated SessionProvider to fail closed into error state instead of preview when Telegram bootstrap does not produce init data.

Fixed a related AppDataProvider branch-order bug where session error plus null API was still being downgraded to preview, and added focused provider tests for both cases.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Hardened Telegram bootstrap handling so detected Telegram runtime without init data now results in an error state instead of silent browser preview and demo mode. SessionProvider now fails closed on missing init data, AppDataProvider preserves session errors instead of downgrading them to preview when API is unavailable, and focused provider tests plus pnpm typecheck and pnpm build verify the regression path.

<!-- SECTION:FINAL_SUMMARY:END -->
