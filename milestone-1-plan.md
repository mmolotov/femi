# Milestone 1 Plan: Core Cycle Tracking MVP

## Status

Completed on the current branch.

Delivered outcome:

- onboarding flow is implemented
- M1 backend API is implemented
- cycle prediction and calendar utilities are implemented
- `Today`, `Calendar`, `History`, and `Settings` are data-backed
- M1 unit, integration, and Playwright happy-path coverage are in place
- `pnpm validate` passes

## Goal

Ship the smallest version of `femi` that already solves the main user problem:

- complete minimal onboarding
- log period activity
- record a fast daily check-in
- show a usable cycle overview
- show a simple next-period prediction

## In Scope

- onboarding flow for initial setup
- cycle length and period length setup
- dashboard data for current cycle
- period start logging
- period end logging
- flow intensity logging
- daily check-in entry and retrieval
- predefined symptom tags
- calendar screen with cycle markers
- history screen with recent entries
- prediction of next period date
- current cycle day calculation

## Out of Scope for M1

- reminders
- notes screen
- exports
- analytics-heavy reports
- fertility-focused features
- doctor summary views

## Starting Baseline

Before M1 implementation, `develop` already had:

- Telegram auth bootstrap
- app shell and navigation
- PostgreSQL schema for core entities
- user settings table with cycle defaults
- `cycles`, `period_logs`, `daily_checkins`, and `symptom_logs` tables
- health checks, logging, backups, CI, and CodeQL

## Delivery Strategy

Implement M1 in six work packages, in order.

## WP1: Shared Domain Contracts

### Goal

Define the API contracts and domain enums once, then reuse them across backend and frontend.

### Tasks

- add shared schemas and types for:
  - onboarding payload
  - user settings payload
  - cycle summary payload
  - calendar payload
  - daily check-in payload
  - period log payload
  - symptom tag payload
- define allowed values for:
  - flow intensity
  - discharge values
  - symptom keys
- add validation constraints for:
  - cycle length range
  - period length range
  - daily score ranges

### Definition of Done

- frontend and backend import the same schemas from `@femi/shared`
- all new API inputs and outputs are validated by `zod`

## WP2: Backend M1 Domain API

### Goal

Add the minimum API surface needed for M1 screens and actions.

### Tasks

- add authenticated user resolution helper based on Telegram auth context
- add routes for:
  - `GET /api/me`
  - `PATCH /api/me/settings`
  - `GET /api/cycle/summary`
  - `GET /api/calendar`
  - `GET /api/history`
  - `POST /api/period/start`
  - `POST /api/period/end`
  - `POST /api/period/log`
  - `PUT /api/checkins/:date`
  - `GET /api/checkins/:date`
- implement idempotency rules where practical:
  - one check-in per user per date
  - one period log per user per date
- add repository/service functions for:
  - reading latest cycle
  - updating settings
  - upserting check-ins
  - upserting period day logs
  - building recent history response

### Definition of Done

- the frontend can fully drive M1 through first-party API routes
- domain routes are covered with backend tests

## WP3: Cycle Computation and Prediction Logic

### Goal

Produce deterministic, understandable cycle data for the UI.

### Tasks

- add cycle utility module for:
  - current cycle day
  - average cycle length fallback
  - average period length fallback
  - next predicted period date
  - active period detection
- define simple prediction rule for M1:
  - prefer user settings if history is sparse
  - use actual completed cycles once enough data exists
- generate calendar markers for:
  - logged period days
  - predicted next period start
  - today
- define edge-case handling for:
  - no cycle data
  - one partial cycle
  - open period without end date

### Definition of Done

- prediction behavior is documented in code comments or tests
- utility tests cover normal and edge cases

## WP4: Frontend Onboarding and Data Layer

### Goal

Replace placeholder screens with data-backed flows.

### Tasks

- add API client helpers for M1 endpoints
- add app-level loading and error handling for authenticated screens
- implement minimal onboarding flow:
  - welcome
  - cycle length
  - period length
  - save settings
- gate main experience until onboarding is complete
- persist and reuse session user plus current settings

### Definition of Done

- a new authenticated user can complete setup in one short flow
- returning users bypass onboarding

## WP5: M1 Screens and Interaction Flow

### Goal

Implement the user-facing MVP experience.

### Tasks

- `Today` screen:
  - show current cycle day
  - show predicted next period date
  - show active period state if relevant
  - add quick daily check-in form
  - add symptom tag picker
- `Calendar` screen:
  - render month grid
  - show logged period days
  - show predicted next period date
  - allow logging period start/end from the screen
- `History` screen:
  - show recent period events
  - show recent daily check-ins
  - show symptom tags by day
- add clear empty states and save states
- keep daily entry flow under a few taps

### Definition of Done

- core M1 actions are usable without hidden navigation
- the app is understandable in both Telegram and browser preview mode

## WP6: Quality Gates for M1

### Goal

Close M1 with adequate confidence, not just visible functionality.

### Tasks

- add backend route tests for M1 endpoints
- add unit tests for cycle prediction utilities
- add frontend tests for:
  - onboarding gate
  - successful daily check-in submit
  - period start/end actions
  - prediction rendering
- add at least one Playwright happy-path scenario for M1
- update docs:
  - local run instructions if new setup is needed
  - roadmap progress

### Definition of Done

- `pnpm validate` passes
- M1 happy path is covered end to end

## Recommended Build Order

1. `WP1` shared contracts
2. `WP3` cycle utilities
3. `WP2` backend API
4. `WP4` onboarding and frontend data layer
5. `WP5` screens and interactions
6. `WP6` tests and docs hardening

## Acceptance Criteria

- a new user can finish setup in a few minutes
- a user can log today in under 10 seconds
- a user can clearly see:
  - current cycle day
  - active period state
  - predicted next period date
- period logs and check-ins persist correctly
- the calendar reflects both logged data and simple prediction

## Risks to Watch

- prediction logic becoming too clever too early
- overbuilding the calendar UI before the data model is stable
- mixing onboarding state with auth/session state
- adding too many symptoms or inputs and slowing down the daily flow
