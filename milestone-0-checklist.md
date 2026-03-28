# Milestone 0 Checklist

This checklist tracks the remaining implementation work required to close `Milestone 0: Foundation`.

## Milestone Goal

Establish the technical and product foundation for a safe MVP release.

## Delivery Checklist

- [x] Telegram Mini App shell
- [x] backend API foundation
- [x] PostgreSQL MVP schema
- [x] database migrations
- [x] basic app navigation
- [x] basic settings page
- [x] Telegram bot webhook baseline
- [x] backend health checks
- [x] backup pipeline scaffold

## Remaining Work Converted Into Tasks

- [x] initialize the Telegram Mini App SDK in the frontend
- [x] mount Telegram runtime components and bind Telegram CSS variables
- [x] authenticate the frontend against `/api/auth/telegram` using raw Telegram `initData`
- [x] expose frontend session state and current Telegram user details in the UI
- [x] make the local Vite development server proxy `/api` requests to the backend
- [x] unify worker logging around a structured logger helper
- [x] add a documented restore path for PostgreSQL backups
- [x] document the backup/restore operational flow in the repository

## Exit Criteria

`Milestone 0` is considered complete when:

- the Mini App boots both inside Telegram and in browser preview mode
- frontend auth creates or refreshes the Telegram user through the backend
- the runtime baseline is visible in the settings screen
- worker logs are structured and machine-readable
- backup and restore procedures are defined in repo code and docs
