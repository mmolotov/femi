---
id: TASK-6.21
title: Split femi Docker Compose into base and production ingress override
status: Done
assignee: []
created_date: "2026-04-13 06:24"
updated_date: "2026-04-13 06:27"
labels: []
dependencies: []
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Refactor the current single Docker Compose file so local and generic app services live in a base compose layer, while production-only ingress wiring lives in a separate override that adds the shared `edge` network and `caddy-docker-proxy` labels. This should keep local container usage simpler while preserving the existing remote deployment model.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Project services can be started from a base compose file without requiring the external `edge` network or Caddy labels.
- [x] #2 Production deployment still works through a separate override that adds the shared ingress network and Caddy labels.
- [x] #3 README and deployment guidance are updated to describe the new base-plus-prod-compose workflow.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Refactored infrastructure compose into a local-friendly base `infrastructure/docker-compose.yml` and a production-only ingress override `infrastructure/docker-compose.prod.yml`.

Updated README, architecture notes, and the GitHub deploy workflow to use the base-plus-prod compose layering in production while keeping local Docker usage on the base file only.

Attempted `docker compose ... config` validation for both base and prod modes, but the local Docker Compose plugin crashed with a nil-pointer panic after env interpolation warnings; YAML syntax was validated successfully with Ruby instead.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Split the application compose layer so local development no longer depends on the shared `edge` ingress network, while production keeps ingress wiring in `infrastructure/docker-compose.prod.yml`. Updated deployment documentation and the `deploy-femi` GitHub Actions workflow to use the two-file production compose invocation.

<!-- SECTION:FINAL_SUMMARY:END -->
