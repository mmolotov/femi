---
id: TASK-5
title: Load Telegram WebApp bridge script in web app shell
status: Done
assignee:
  - codex
created_date: "2026-04-11 09:52"
updated_date: "2026-04-11 09:53"
labels: []
dependencies: []
documentation:
  - /Users/mama/dev/femi/apps/web/index.html
  - /Users/mama/dev/femi/apps/web/src/lib/telegram.ts
  - "https://core.telegram.org/bots/webapps"
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Telegram Mini App launch diagnostics show that the deployed app never receives `window.Telegram.WebApp` or any init data, even when opened from the bot. The web shell currently does not include Telegram's required `telegram-web-app.js` bridge script in the document head. Add the bridge script in the correct place so Telegram can expose the Mini App runtime to the frontend.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 The web shell includes Telegram's `telegram-web-app.js` bridge script in the document head before the application bundle.
- [x] #2 The frontend build still succeeds after adding the bridge script.
- [x] #3 The change is limited to the web shell/bootstrap path for Telegram Mini App initialization.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Add Telegram's web app bridge script tag to apps/web/index.html in the document head before the main application module script.
2. Keep the change limited to the web shell/bootstrap layer so the existing frontend runtime can consume window.Telegram.WebApp without changing backend behavior.
3. Validate with a targeted web build and then push the fix for server-side redeploy.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Added <script src="https://telegram.org/js/telegram-web-app.js"></script> to apps/web/index.html in the document head before the application bundle.

Validated the change with pnpm --filter @femi/web build, which passed after the bridge script was added.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Loaded Telegram's Web App bridge script in the web shell so the frontend can receive `window.Telegram.WebApp` and Mini App init data during Telegram launch. The app previously opened from the bot but never saw any Telegram runtime objects because apps/web/index.html did not include `telegram-web-app.js`.

Validation: `pnpm --filter @femi/web build` passed after the script tag was added.

Next step: redeploy the web container on the server and reopen the app from Telegram. The existing diagnostics panel should then show whether Telegram is now providing `WebApp` context and init data.

<!-- SECTION:FINAL_SUMMARY:END -->
