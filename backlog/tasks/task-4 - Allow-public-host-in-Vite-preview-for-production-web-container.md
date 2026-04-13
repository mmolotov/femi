---
id: TASK-4
title: Allow public host in Vite preview for production web container
status: Done
assignee:
  - codex
created_date: "2026-04-11 09:14"
updated_date: "2026-04-11 09:40"
labels: []
dependencies: []
documentation:
  - /Users/mama/dev/femi/apps/web/vite.config.ts
  - /Users/mama/dev/femi/apps/web/package.json
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

The deployed femi web container serves the app with `vite preview`, and the public domain currently returns `Blocked request. This host is not allowed.` because the preview server does not allow the production host header. Update the Vite configuration so the production preview server accepts the public deployment host while preserving local development behavior.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 The Vite preview configuration allows the deployed public host used by the femi app.
- [x] #2 The change is limited to the web preview/hosting configuration and does not alter backend routing.
- [x] #3 The web project still builds successfully after the Vite configuration change.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Update apps/web/vite.config.ts to configure Vite preview with an allowed host list derived from the deployment environment while keeping development proxy behavior unchanged.
2. Keep the change limited to the web preview server path used by the production container.
3. Validate the change with a targeted web build command and then push the fix for server-side redeploy.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Added preview.allowedHosts in apps/web/vite.config.ts and confirmed pnpm --filter @femi/web build passes locally.

While diagnosing the live 403, found that the web container was not receiving WEB_APP_URL at runtime. Updated infrastructure/docker-compose.yml so the web service now loads ../.env and passes WEB_APP_URL into the container process used by vite preview.

Continuing with a narrow diagnostic follow-up in the same area: add a safe Telegram runtime diagnostic payload to the session bootstrap and surface it in the UI when the app falls back to preview or auth error states, without exposing raw initData.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Fixed the public-domain 403 from the production web container. The web app already had a Vite preview allowlist based on WEB_APP_URL, but the web service was not receiving WEB_APP_URL at runtime, so Vite still treated the public host as blocked. Updated the Vite config to allow the deployment host and updated the web service in infrastructure/docker-compose.yml to load ../.env and pass WEB_APP_URL into the container environment.

Validation performed locally: `pnpm --filter @femi/web build` passed after the Vite config change. Final live validation requires redeploying the updated web service on the server and confirming that `https://femi.iganwave.cc/` returns 200 instead of 403.

<!-- SECTION:FINAL_SUMMARY:END -->
