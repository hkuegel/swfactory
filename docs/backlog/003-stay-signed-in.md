---
id: 003
title: Stay signed in across reloads
status: draft # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
branch: feature/003-stay-signed-in
supersedes: []
changes: [] # set once ACs exist; will relate to 001/AC10 (logout must still hold after a reload)
superseded-by:
---

# 003 – Stay signed in across reloads

## Original request

> No verbatim request from hak. This story was split off from [001 – Login with Google](001-login.md) by hak's decision on 2026-11-01: "C: drop AC7/AC8". The dropped behaviour was "a signed-in user is still signed in after a page reload".

## User story

As a signed-in user, I want to stay signed in when I reload the page or come back later, so that I don't have to sign in with Google again every time.

## Context

Story 001 (Google login) was built frontend-only without any storage of its own. Under those constraints a reliable "stay signed in" was not possible, so hak dropped AC7 and AC8 from 001. After 001, every reload shows the login screen.

The expected way to get this behaviour is a server-side session: a backend that verifies Google's ID token on the server and remembers the signed-in user. This needs a backend, which does not exist yet. Which backend to use is decided in design, not in this story.

Relation to other stories:

- Depends on 001. After a logout (001/AC9, AC10) a reload must still show the login screen; that behaviour must not be broken by this story.
- Story 002 (Microsoft) may also need this; see Open questions.
- Guest sign-in ([004](004-guest-login.md)) exists only in development and test builds; guests are never persisted or sent to a backend, and any session created by this story applies to Google (and later Microsoft) users only.

No ACs are written yet; they depend on the answers below. Expected topics: signed in after a reload while the session is valid, login screen after a reload when the session has expired or ended, logout ends the session, and an error state when the session check fails.

## Acceptance criteria

_To be written once the open questions are answered._

## Out of scope

- Google sign-in itself, logout and the signed-in/login screens: see [001](001-login.md).
- Microsoft sign-in: see [002](002-login-microsoft.md).
- Protecting parts of the app or routes (separate story, not yet requested).
- Restricting which Google accounts may sign in.

## Open questions

1. **Backend technology and hosting:** Which backend should be used and where should it run? (Needed because server-side verification of Google's ID token and a server-side session require one.)
2. **Session duration:** How long should a user stay signed in (for example until the browser closes, a fixed number of days, or a sliding period)? Should there be a "stay signed in" choice for the user?
3. **Story 002:** Should staying signed in also cover the Microsoft sign-in from 002, or only Google?
4. **Stored data:** Which user data (if any) may the backend keep for the session, for example name, email or only a session identifier? (001 states that the app stores no user data of its own; this story changes that on the server side.)

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-01 — Story created. Split off from 001 after hak's decision "C: drop AC7/AC8" (AC7 "stay signed in after reload" is not reliably achievable frontend-only without own storage). Intended approach: server-side session with server-side Google ID-token verification. No ACs yet. (product-owner)
- 2026-11-01 — Constraint added to Context: guest sign-in (story 004) exists only in development and test builds; guests are never persisted or sent to a backend; sessions from this story apply to Google (and later Microsoft) users only. Source: architect, from the story 004 design; not a hak decision. (product-owner)

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

## Implementation notes

_developer: what was built, deviations from the design and why._

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s) | Result |
| --- | ------- | ------ |

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates),
proposed changes to agents/CLAUDE.md/templates, and which ones hak approved._
