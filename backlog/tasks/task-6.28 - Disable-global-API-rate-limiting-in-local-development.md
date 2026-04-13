---
id: TASK-6.28
title: Disable global API rate limiting in local development
status: Done
assignee: []
created_date: "2026-04-13 08:25"
updated_date: "2026-04-13 08:25"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

The current global Fastify rate limit can produce `429 Too Many Requests` during local Telegram Mini App testing because one user/browser IP rapidly triggers bootstrap, refresh, and save-related rereads. Those transient 429 responses make persisted data look like it disappeared after refresh. Disable the global API rate limit in development while preserving production behavior, and add coverage for the dev-vs-prod registration behavior.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Global API rate limiting is skipped in local development mode.
- [x] #2 Production behavior still registers the global API rate limiter.
- [x] #3 Regression tests cover the development skip and production registration behavior.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Updated `registerRateLimit` to accept the parsed app env and skip global Fastify rate limiting entirely when `NODE_ENV === development`.

Kept the existing global limiter configuration unchanged for non-development environments.

Added a targeted unit test covering both development skip behavior and production registration behavior.

Validated with `pnpm vitest run apps/server/src/lib/rate-limit.test.ts`.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Disabled the global API rate limiter in local development so Telegram Mini App bootstrap, refresh, and save-related rereads no longer intermittently fail with `429 Too Many Requests` during testing. Production behavior still registers the existing limiter unchanged, and the environment-specific behavior is now covered by targeted tests.

<!-- SECTION:FINAL_SUMMARY:END -->
