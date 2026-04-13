---
id: TASK-1
title: Prepare femi deployment for shared edge ingress on VPS
status: Done
assignee:
  - codex
created_date: "2026-04-11 07:36"
updated_date: "2026-04-11 07:39"
labels: []
dependencies: []
documentation:
  - /Users/mama/dev/femi/README.md
  - /Users/mama/dev/femi/infrastructure/docker-compose.yml
  - /Users/mama/dev/infra/README.md
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Update the femi deployment configuration so the application stack can be deployed into /opt/femi behind the shared /opt/infra ingress layer. The local deployment currently includes its own public Caddy service, but the server architecture uses a shared caddy-docker-proxy on the external edge network. This task should align femi with that server model without changing unrelated product behavior.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 The femi Compose stack no longer requires its own public reverse proxy for server deployment and can attach public services to the shared edge network.
- [x] #2 Deployment configuration exposes the web app root and forwards /api and /telegram paths to the server through caddy-docker-proxy labels.
- [x] #3 Environment examples and deployment documentation describe the shared ingress model and the production values required for WEB_APP_URL and TELEGRAM_WEBHOOK_URL.
- [x] #4 The resulting Compose file is valid when rendered with docker compose config.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Replace the current public Caddy service in infrastructure/docker-compose.yml with shared-ingress wiring suitable for /opt/femi behind the existing /opt/infra caddy-docker-proxy.
2. Attach the public femi services to an external edge network and add caddy labels so the web app serves / while /api/_ and /telegram/_ route to the server container.
3. Extend .env.example with production-oriented deployment variables needed by the shared-ingress model.
4. Update README container/deployment guidance to describe running femi as an app stack behind shared ingress rather than as a standalone public proxy.
5. Validate the resulting Compose file with docker compose -f infrastructure/docker-compose.yml config and capture any follow-up notes in the task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Removed the standalone public Caddy service from the femi app stack and switched the deployment model to shared ingress on the external edge network.

Added caddy-docker-proxy labels on the web service so / routes to the Vite preview container while /api and /telegram route to server:3001 across the shared network.

Updated local and server deployment docs to document the edge-network prerequisite and the production APP_DOMAIN / WEB_APP_URL / TELEGRAM_WEBHOOK_URL values.

Ran docker compose -f infrastructure/docker-compose.yml config. The stack rendered successfully, but the local Docker Compose plugin crashed with a nil-pointer panic after printing the rendered config.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Aligned femi with the VPS shared-ingress architecture used by /opt/infra. The app stack no longer includes its own public Caddy service; instead, the web service joins the external edge network and advertises caddy-docker-proxy labels so the shared ingress serves / and forwards /api/_ and /telegram/_ to the server container. Added APP_DOMAIN and EDGE_NETWORK_NAME to the environment example and updated README plus architecture documentation to describe deploying femi as /opt/femi behind the shared ingress layer.

Validation: ran `docker compose -f infrastructure/docker-compose.yml config`. The command rendered the final Compose configuration successfully, which confirms the file shape is valid; however, the local Docker Compose plugin then crashed during shutdown with a nil-pointer panic in the environment, so the command did not exit cleanly.

Follow-up risk: local Compose usage now assumes the shared edge network exists, so local users need the one-time `docker network create edge` setup unless they point EDGE_NETWORK_NAME at an existing network.

<!-- SECTION:FINAL_SUMMARY:END -->
