---
id: TASK-6.13
title: Normalize JSON API error responses into user-readable messages
status: Done
assignee: []
created_date: "2026-04-11 16:38"
updated_date: "2026-04-11 16:40"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

The web client currently turns non-2xx responses into raw response text, while the server commonly returns JSON objects like `{ "error": "..." }`. As a result users can see JSON blobs or generic status-based auth errors instead of the actual backend message. Add shared HTTP error parsing so API and auth bootstrap surfaces show readable messages.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Web API requests extract the `error` string from JSON error bodies instead of surfacing the raw JSON payload.
- [x] #2 Telegram auth bootstrap also surfaces the backend error message when `/api/auth/telegram` returns a structured error response.
- [x] #3 Tests cover both generic API error parsing and Telegram auth error parsing.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Added a shared HTTP error parser that extracts structured `error` and `message` fields from non-2xx JSON responses instead of surfacing raw JSON blobs. The web API client now uses it for request failures, and SessionProvider uses the same helper for `/api/auth/telegram` bootstrap failures so Telegram auth errors show the backend message when available. Added tests for both generic API error parsing and auth bootstrap error parsing.

<!-- SECTION:FINAL_SUMMARY:END -->
