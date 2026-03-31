# ATTRACT Shun

Local-first front-end prototype for a dating platform built around intentional matching, strict intent pools, and a one-active-match rule.

## Current Scope

- Multi-page static website
- Local browser storage only
- No Firebase wiring yet
- No payment system yet
- Branded `ATTRACT Shun` logo and visual system

## Included Screens

- Landing
- Admin
- Onboarding
- Dashboard
- Browse
- Match and chat
- Reports and moderation
- Success stories
- Settings

## Core Product Rules In Prototype

- Users can only hold one active match at a time
- Users can only hold one active conversation at a time
- Casual and long-term pools are separated
- Right swipes require an interest score from 1 to 10
- Matches move through intro, date-planning, and decision checkpoints
- Shun counts and moderation actions are tracked locally

## Local Usage

Open [index.html](./index.html) in a browser, or serve the directory with a simple static server.

Recommended flow:

1. Open `admin.html`
2. Seed demo users or create users manually
3. Choose the active user
4. Complete onboarding if needed
5. Browse, match, chat, report, and publish success stories

## Project Files

- `index.html` and page-specific `.html` files define the screens
- `styles.css` contains the shared visual system
- `data.js` contains the local data model and business logic
- `shared.js` contains shared UI helpers
- page-specific `.js` files handle each screen's behavior

## Next Build Steps

- Move to a framework app structure
- Add real media upload handling
- Replace local state with Firebase Auth, Firestore, and Storage
- Add server-side moderation and deadline automation
- Add mobile app packaging path for App Store and Play Store deployment
