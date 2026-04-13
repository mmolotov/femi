---
id: TASK-6.12
title: Avoid refetching HistoryRoute data on language changes
status: Done
assignee: []
created_date: "2026-04-11 13:07"
updated_date: "2026-04-11 13:08"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

HistoryRoute currently includes `messages.history.loadError` in its fetch effect dependencies. Switching UI language therefore reruns `getHistory(6)` even though no query input changed. Preserve translated fallback copy without refetching cycle history on i18n-only updates.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 HistoryRoute does not call `getHistory(6)` again when only the UI language changes.
- [x] #2 Fallback load-error copy still remains localized for failed loads.
- [x] #3 A route test covers the language-switch path and verifies that only one history fetch happens.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

HistoryRoute now keeps its load-error fallback copy in a ref instead of binding the fetch effect to translated strings. Switching the UI language no longer triggers another `getHistory(6)` request, and failures that happen after a language change still use the latest localized fallback copy. Added route tests for both the no-refetch language-switch path and the localized fallback path.

<!-- SECTION:FINAL_SUMMARY:END -->
