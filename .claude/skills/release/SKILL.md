---
name: release
description: Open the release PR from develop to main. Merging that PR auto-deploys production, so this skill only prepares and opens the PR — it never merges.
disable-model-invocation: true
---

# Release develop → main

Prepare and open the release PR. Do NOT merge it — merging deploys production.

## Steps

1. **Preflight**
   - `git fetch origin develop main`
   - Require a clean working tree.
   - Verify the Quality workflow is green for `origin/develop`: `gh run list --branch develop --workflow Quality --limit 1`. If it is red or still running, stop and report instead of opening the PR.

2. **Review scope**
   - `git log --oneline origin/main..origin/develop`
   - `git diff --stat origin/main...origin/develop`
   - Note any new migrations under `packages/db/migrations` — they run automatically on deploy via the compose `migrate` service.

3. **Open the PR**
   - `gh pr create --base main --head develop --title "Release develop to main" --body "..."`
   - Body: changelog grouped as Features / Fixes / Dependencies, plus a "Migrations" section when the release contains any.

4. **Hand off**
   - Post the PR URL and remind the user: **merging this PR triggers the production deploy** (`deploy-femi.yml`: pre-deploy DB backup → compose build/up → public health check). The user merges it, not you.
