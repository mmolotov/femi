---
id: TASK-7
title: Apply the base-plus-prod Docker Compose split to /Users/mama/dev/pina
status: To Do
assignee: []
created_date: "2026-04-13 06:24"
updated_date: "2026-04-13 06:30"
labels:
  - cross-project
dependencies: []
references:
  - /Users/mama/dev/pina
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Mirror the compose-layer refactor used in femi for the pina project so local container usage does not require shared ingress assumptions while production deployment still uses a dedicated override for the `edge` network and Caddy labels.

<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Moved out of femi backlog and recreated in `/Users/mama/dev/pina` as `TASK-048` so the work lives with the project that owns the compose layer.

<!-- SECTION:NOTES:END -->
