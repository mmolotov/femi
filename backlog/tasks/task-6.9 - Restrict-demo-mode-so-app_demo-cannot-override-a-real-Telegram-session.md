---
id: TASK-6.9
title: Restrict demo mode so app_demo cannot override a real Telegram session
status: Done
assignee:
  - Codex
created_date: "2026-04-11 12:45"
updated_date: "2026-04-11 12:51"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Prevent the demo API from hijacking a real authenticated Telegram session. The current app data bootstrap enables demo mode whenever the app_demo query flag is present, regardless of whether the user is inside Telegram with valid init data. That can replace live data with preview data in a real session and the flag persists across navigation because search params are carried through the tab links.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 A real Telegram authenticated session ignores the app_demo query flag and continues using the live API.
- [x] #2 Browser preview and explicit local demo workflows still work as intended for development and layout review.
- [x] #3 Tests cover the precedence rules between preview mode authenticated Telegram mode and the app_demo query flag.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Change AppDataProvider demo-mode precedence so authenticated Telegram sessions always use the live API even if app_demo is present.
2. Preserve current browser preview behavior, including reset-vs-preview demo state selection inside the demo client.
3. Add focused provider tests for authenticated Telegram plus app_demo and browser preview plus app_demo paths.
4. Run targeted web tests, typecheck, and build, then finalize the task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Removed the app_demo query flag from AppDataProvider demo-mode precedence so only browser preview sessions enter the demo client.

Kept browser preview behavior intact because the demo client still reads app_demo internally to choose reset versus preview seed state.

Added provider tests for authenticated Telegram sessions with app_demo and browser preview with app_demo, then re-verified with targeted vitest plus pnpm typecheck and pnpm build.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Restricted demo-mode activation so a real authenticated Telegram session always uses the live API even when the app_demo query flag is present. Browser preview still uses the demo client, and the existing query flag continues to influence demo seed state only within that preview path; provider tests plus pnpm typecheck and pnpm build verify the precedence rules.

<!-- SECTION:FINAL_SUMMARY:END -->
