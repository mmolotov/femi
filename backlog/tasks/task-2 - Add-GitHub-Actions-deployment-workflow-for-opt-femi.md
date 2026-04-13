---
id: TASK-2
title: Add GitHub Actions deployment workflow for /opt/femi
status: Done
assignee:
  - codex
created_date: "2026-04-11 07:51"
updated_date: "2026-04-11 07:52"
labels: []
dependencies: []
documentation:
  - /Users/mama/dev/femi/.github/workflows/quality.yml
  - /Users/mama/dev/femi/README.md
  - /Users/mama/dev/femi/infrastructure/docker-compose.yml
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Create a GitHub Actions workflow that can deploy the femi application stack to the VPS layout already prepared for /opt/femi behind the shared /opt/infra ingress layer. The workflow should validate the repository before deployment, then connect to the server via SSH and update only the femi application checkout and Compose stack.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 A GitHub Actions workflow exists for femi deployments to /opt/femi and runs repository validation before attempting deployment.
- [x] #2 The deployment job connects over SSH, updates the target checkout to the requested ref, runs the femi Compose stack from /opt/femi, and performs a post-deploy health check.
- [x] #3 The workflow is scoped to the femi application stack and does not attempt to manage /opt/infra.
- [x] #4 Repository documentation describes the required GitHub secrets/variables and the server-side prerequisites for using the deployment workflow.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

1. Add a dedicated GitHub Actions workflow for femi deployment with a validate job that mirrors the existing project validation command on GitHub-hosted runners.
2. Add a deploy job that uses SSH credentials from GitHub secrets, updates the /opt/femi checkout to the selected ref, runs docker compose -f infrastructure/docker-compose.yml up -d --build, and checks the deployed health endpoint.
3. Keep the workflow scoped strictly to /opt/femi so it does not modify the shared /opt/infra stack.
4. Update README deployment documentation with the required GitHub secrets/variables, expected server preparation, and how the workflow should be triggered.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Added a dedicated GitHub Actions workflow at .github/workflows/deploy-femi.yml with a validate job that runs pnpm validate on GitHub-hosted runners before deployment.

Implemented an SSH-based deploy job that targets only /opt/femi, refuses to deploy from a dirty checkout, fetches the requested ref, runs docker compose -f infrastructure/docker-compose.yml up -d --build, and checks https://$APP_DOMAIN/api/health.

Documented the required GitHub secrets, server-side prerequisites, and trigger modes in README so the workflow can be enabled without relying on infra knowledge outside this repository.

Ran pnpm exec prettier --check .github/workflows/deploy-femi.yml README.md successfully.

<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Added a dedicated GitHub Actions deployment workflow for the current VPS layout. The new workflow validates the repository with `pnpm validate`, then deploys only the femi application stack in `/opt/femi` over SSH without touching `/opt/infra`. The remote deploy script checks that the checkout is clean, fetches the requested ref, updates the checkout, runs `docker compose -f infrastructure/docker-compose.yml up -d --build`, and verifies the public `/api/health` endpoint using the configured `APP_DOMAIN`.

Updated the README with a GitHub Deploy Workflow section that documents the required GitHub secrets (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, optional `DEPLOY_SSH_PORT`), the required server-side preparation, and the available triggers (`push` to `main` and manual `workflow_dispatch`).

Validation: `pnpm exec prettier --check .github/workflows/deploy-femi.yml README.md` passed. I did not execute the workflow itself because it depends on repository secrets and server access that are not available from this environment.

<!-- SECTION:FINAL_SUMMARY:END -->
