---
id: TASK-6.15
title: Handle demo preview bootstrap failures in AppDataProvider
status: Done
assignee: []
created_date: "2026-04-11 17:35"
updated_date: "2026-04-11 17:36"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

`AppDataProvider` wraps authenticated bootstrap in `try/catch`, but the preview/demo bootstrap branch (`demoMode && api`) awaits `getMe()` and `getCycleSummary()` without any error handling. If the demo client throws, the provider can stay stuck in loading state with an unhandled rejection instead of surfacing an error state.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 If demo preview bootstrap fails AppDataProvider transitions to an error state instead of hanging in loading.
- [x] #2 The error message uses the thrown error when available and otherwise falls back to localized load-error copy.
- [x] #3 A provider test covers the failed demo bootstrap path.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

AppDataProvider now handles demo preview bootstrap failures the same way it handles authenticated bootstrap failures. If `getMe()` or `getCycleSummary()` throws while bootstrapping preview/demo mode, the provider transitions to `error` with the thrown message when available and otherwise falls back to localized load-error copy. Added a provider test that covers the failed demo bootstrap path.

<!-- SECTION:FINAL_SUMMARY:END -->
