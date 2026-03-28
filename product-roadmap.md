# Product Roadmap

## Purpose

This document defines the planned product functionality for the `femi` Telegram Mini App and splits delivery into milestones.

The product goal is to provide a simple, privacy-conscious, ad-free menstrual and symptom tracking experience without unnecessary subscription-driven features.

## Product Principles

- ad-free experience
- no paywall for core functionality
- fast daily usage, ideally under 10 seconds
- clear and calm UX, no feature overload
- privacy-first handling of sensitive health data
- useful baseline functionality before any advanced features

## Problem Statement

Many existing women's health apps have one or more of these problems:

- aggressive advertising
- core features locked behind subscription
- bloated feature sets with low real value

`femi` should solve the basic everyday need well:

- track the menstrual cycle
- log symptoms and wellbeing quickly
- receive useful reminders
- review history clearly
- export relevant data for a doctor if needed

## Target User Value

The app should help a user answer these questions with minimal effort:

- When is my next period likely to start?
- How regular is my cycle?
- What symptoms do I usually have and when?
- How am I feeling today compared to previous cycles?
- Do I need a reminder for medication, contraception, or a doctor visit?

## Core UX Shape

The MVP should revolve around three primary screens:

- `Today`
- `Calendar`
- `History`

Supporting screens:

- `Reminders`
- `Notes`
- `Settings`

Main interaction pattern:

- open Mini App
- tap a few quick inputs
- save daily check-in
- close app

## Functional Scope

### Core Features We Intend to Build

- cycle calendar with predicted upcoming period
- period start and end logging
- daily check-in with a small set of wellbeing inputs
- symptom logging with predefined tags
- cycle history and basic trends
- Telegram reminders
- notes for personal observations or doctor questions
- export of user data for doctor review

### Features Explicitly Out of Scope for Early Stages

- ads of any kind
- paid subscription gating the main experience
- community feeds or chats
- large content library or editorial section
- AI coach or AI diagnosis
- wellness bundle features unrelated to the main problem
- gamification
- horoscope or pseudo-medical content
- heavy fertility-first positioning by default

## Milestone Strategy

We will ship the product in small, coherent slices. Each milestone should result in something testable and usable.

## Milestone 0: Foundation

### Goal

Establish the technical and product foundation for a safe MVP release.

### Deliverables

- Telegram Mini App shell
- backend API and Telegram bot integration
- PostgreSQL schema for MVP entities
- user creation from validated Telegram `initData`
- basic app navigation
- basic settings page
- database migrations
- structured logging
- health checks
- backup pipeline

### Notes

This milestone is not feature-rich from a user perspective, but it creates the base needed for later milestones.

## Milestone 1: Core Cycle Tracking MVP

### Goal

Ship the smallest version that already solves the main user problem.

### User-Facing Features

- onboarding with a minimal initial setup
- cycle length and period length setup
- calendar view
- log period start
- log period end
- log flow intensity with a small scale
- show predicted next period date
- show current cycle day
- quick daily check-in

### Daily Check-In Scope

- mood
- energy
- pain level
- discharge
- sleep quality
- optional free-text note

### Symptom Logging Scope

Use predefined symptom tags for fast entry:

- cramps
- headache
- nausea
- acne
- bloating
- breast tenderness
- fatigue
- PMS

### Success Criteria

- a user can complete setup in a few minutes
- a user can add a daily entry in under 10 seconds
- cycle history is persisted correctly
- upcoming period prediction is visible and understandable

## Milestone 2: Useful Retention Features

### Goal

Increase repeat usage with practical functionality, not engagement tricks.

### User-Facing Features

- Telegram reminders for predicted period start
- daily check-in reminders
- medication reminders
- contraception reminders
- reminder management screen
- notes screen
- history list by day and cycle

### History and Insight Scope

- average cycle length
- average period length
- cycle regularity overview
- symptom frequency by cycle

### Success Criteria

- users can configure reminders without confusion
- reminders arrive reliably
- history is easy to scan and compare
- data remains simple, not analytics-heavy

## Milestone 3: Export and Better Review

### Goal

Make the app more useful during healthcare conversations and longer-term tracking.

### User-Facing Features

- export to `PDF`
- export to `CSV`
- doctor-friendly summary view
- filters for date range
- filters for symptoms and cycle periods
- clearer trend visuals

### Export Scope

Exports should include:

- cycle dates
- period logs
- symptom logs
- check-in summaries
- notes, where the user chooses to include them

### Success Criteria

- a user can generate an export without leaving Telegram
- exported data is readable and compact
- the summary is useful for a doctor appointment

## Milestone 4: Quality-of-Life Improvements

### Goal

Add a small set of high-value improvements without bloating the product.

### User-Facing Features

- stronger privacy options inside the app
- optional local app lock or PIN
- neutral notification text for privacy
- delayed period and irregular cycle warnings
- simple pattern detection such as repeated symptoms across cycles
- improved onboarding for users who want cycle tracking without fertility emphasis

### Product Guardrails

Warnings must stay conservative:

- no diagnosis
- no medical claims
- no fear-based messaging
- always framed as informational prompts

## Milestone 5: Post-Validation Extensions

### Goal

Only build these after real user validation shows demand.

### Candidate Features

- planning mode for pregnancy
- alternate contraception tracking modes
- richer symptom customization
- partner-safe data export sharing flow
- multilingual support

These are optional and must not delay earlier milestones.

## Functional Non-Goals

The following should not be prioritized unless direct user demand proves their value:

- social features
- full fertility suite
- article feed
- chat support layer
- wearable integrations
- calorie, fitness, or water tracking
- broad lifestyle dashboard
- generic AI summaries

## Recommended Delivery Order

1. Milestone 0
2. Milestone 1
3. Milestone 2
4. Milestone 3
5. Milestone 4 only after validation
6. Milestone 5 only after validation

## MVP Definition

The MVP is complete when:

- Milestone 0 is done
- Milestone 1 is done
- the reminder subset from Milestone 2 is done

This means the first real release should include:

- cycle setup
- period logging
- daily check-ins
- symptom tags
- calendar and history
- Telegram reminders

Exports and advanced review can come right after MVP.

## Release Priorities

If scope pressure appears, prioritize in this order:

1. cycle tracking
2. daily check-in
3. reminders
4. history
5. notes
6. exports
7. advanced insights

## Final Product Positioning

`femi` should be positioned as:

- a focused women’s health tracking app
- simple enough for everyday use
- respectful of user privacy
- useful without ads or subscription pressure

It should not try to become a giant all-in-one health platform in the early stages.
