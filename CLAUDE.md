<!-- BACKLOG.MD MCP GUIDELINES START -->

<CRITICAL_INSTRUCTION>

## BACKLOG WORKFLOW INSTRUCTIONS

This project uses Backlog.md MCP for all task and project management activities.

**CRITICAL GUIDANCE**

- If your client supports MCP resources, read `backlog://workflow/overview` to understand when and how to use Backlog for this project.
- If your client only supports tools or the above request fails, call `backlog.get_backlog_instructions()` to load the tool-oriented overview. Use the `instruction` selector when you need `task-creation`, `task-execution`, or `task-finalization`.

- **First time working here?** Read the overview resource IMMEDIATELY to learn the workflow
- **Already familiar?** You should have the overview cached ("## Backlog.md Overview (MCP)")
- **When to read it**: BEFORE creating tasks, or when you're unsure whether to track work

These guides cover:

- Decision framework for when to create tasks
- Search-first workflow to avoid duplicates
- Links to detailed guides for task creation, execution, and finalization
- MCP tools reference

You MUST read the overview resource to understand the complete workflow. The information is NOT summarized here.

</CRITICAL_INSTRUCTION>

<!-- BACKLOG.MD MCP GUIDELINES END -->

## Pre-commit checks

Run these locally **before every commit** so problems are caught here, not in the CI `Quality` workflow. The list mirrors exactly what CI runs.

Quick path — one command runs the full suite:

```bash
pnpm validate
```

Or run steps individually (same order as CI):

1. `pnpm format:check` — Prettier formatting (auto-fix: `pnpm format`)
2. `pnpm lint` — ESLint (auto-fix: `pnpm lint:fix`)
3. `pnpm lint:styles` — Stylelint for CSS (auto-fix: `pnpm lint:styles:fix`)
4. `pnpm typecheck` — TypeScript across all workspaces
5. `pnpm test:coverage` — Vitest unit tests with coverage
6. `pnpm analyze` — Knip (unused exports / dependencies)
7. `pnpm build` — Full workspace build

If any step fails, fix it before creating the commit. Do not push and rely on CI to surface issues.
