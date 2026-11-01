# Changelog

All notable changes to this project are documented here, following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Sign in with Google on the login screen. Once signed in, the header shows your name,
  or your email if Google provides no name (#001).
- Sign out from the header. After signing out, the login screen is shown again (#001).
- Sign-in is not kept across page reloads yet: after each reload you see the login
  screen again and sign in once more (#001).
- Software factory setup: role agents, `/feature`, `/story` and `/bug` workflows,
  story and ADR templates.
- React + TypeScript app scaffold with Vitest, Playwright, ESLint, Prettier and CI.
- Traceability: stories record the original request and a decision log, link
  superseded and changed stories, and are committed when approved.
- `/rebuild` workflow to regenerate the app from the backlog.
- Persistent per-agent memory and a retro step after each feature and bug fix.

### Changed

- The counter and the placeholder text are shown only when signed in (#001).
