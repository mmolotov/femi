---
id: TASK-3
title: Fix web Docker image build for workspace shared package
status: Done
assignee:
  - codex
created_date: "2026-04-11 09:00"
updated_date: "2026-04-13 06:32"
labels: []
dependencies: []
documentation:
  - /Users/mama/dev/femi/apps/web/Dockerfile
  - /Users/mama/dev/femi/packages/shared/package.json
  - /Users/mama/dev/femi/apps/web/package.json
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

The first manual server deployment fails while building the web image because the web Dockerfile does not include the workspace package @femi/shared, yet the web app imports it during the Vite production build. Update the web image build so it includes and builds the shared workspace package needed by @femi/web.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 The web Dockerfile includes the workspace metadata and source required for @femi/shared during image build.
- [x] #2 The web image builds successfully without Rollup failing to resolve @femi/shared.
- [x] #3 The fix does not broaden the deployment scope beyond the web image build path.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Update apps/web/Dockerfile so pnpm install can resolve the @femi/shared workspace dependency and the container receives the shared source tree.
2. Build @femi/shared before running the @femi/web production build inside the image.
3. Validate the fix with a targeted docker compose web build or equivalent container build command and record the result.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Updated apps/web/Dockerfile so the image now copies packages/shared/package.json before install, copies the packages/shared source tree, and builds @femi/shared before @femi/web.

Could not execute a Docker build from this sandbox because access to the Docker daemon socket is denied here. The server-side rebuild of the web image is the remaining validation step for acceptance criterion 2.

The remaining Docker image validation was subsequently confirmed outside the sandbox, so the unresolved build verification blocker no longer applies.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Updated the web Docker image build path so the `@femi/shared` workspace package is available during the production build. The Dockerfile now includes the shared workspace metadata and source, builds `@femi/shared` before `@femi/web`, and keeps the scope limited to the web image build path. The previously blocked image-build verification was later confirmed outside the sandbox, so the task is complete.

<!-- SECTION:FINAL_SUMMARY:END -->
