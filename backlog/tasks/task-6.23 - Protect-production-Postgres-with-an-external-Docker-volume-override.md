---
id: TASK-6.23
title: Protect production Postgres with an external Docker volume override
status: Done
assignee: []
created_date: "2026-04-13 07:42"
updated_date: "2026-04-13 07:43"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Adjust the production compose override so the production Postgres data volume is external and therefore not deleted by accidental `docker compose down -v` on the application stack. Update deployment documentation to describe the one-time volume creation and the production safety model.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Production compose uses an external Postgres data volume instead of a stack-owned volume.
- [x] #2 Deployment documentation explains the one-time creation or provisioning requirement for the external Postgres volume.
- [x] #3 Production guidance clearly distinguishes safe app-stack lifecycle commands from destructive local-reset commands.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Updated `infrastructure/docker-compose.prod.yml` so the production override marks `postgres_data` as an external volume and maps it to `${POSTGRES_VOLUME_NAME:-femi-postgres-data}`.

Added `POSTGRES_VOLUME_NAME` to `.env.example` and documented the one-time `docker volume create` step in the production README flow.

Clarified in the deployment guide that `docker compose ... down -v` must remain a local-only reset command and should not be used for the production application stack.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Protected the production Postgres volume from accidental removal by moving volume ownership out of the application stack. The production compose override now treats `postgres_data` as an external Docker volume, configurable via `POSTGRES_VOLUME_NAME`, and the deployment documentation now includes the one-time volume creation step plus explicit guidance to avoid destructive `down -v` usage in production.

<!-- SECTION:FINAL_SUMMARY:END -->
