---
id: 004
title: Sign in as guest (for testing)
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
branch: feature/004-guest-login
supersedes: []
changes: [001/AC1] # the login screen gets a second option next to "Sign in with Google"
superseded-by:
---

# 004 – Sign in as guest (for testing)

## Original request

> for testing also enable a button "sign is as guest"

## User story

As a person testing the app, I want a "Sign in as guest" button on the login screen, so that I can get into the signed-in state without a Google account that is registered for testing.

## Context

Requested by hak on 2026-11-01, right after testing story 001 locally with a real Google client ID. Google sign-in works, but only for Google accounts that are registered as test users in Google Cloud. A guest sign-in makes testing easier because anyone can get into the signed-in state without such an account.

Assumption: "sign is as guest" in the request is a typo for "sign in as guest". The exact button label is an open question (see Open questions 2).

What exists today (story [001](001-login.md)): a login screen with "Sign in with Google"; after a successful sign-in a header "Signed in as {name}" with "Sign out", and the counter visible only when signed in. Nothing is protected, nothing is stored, and every page reload shows the login screen. This story adds a second way to reach the signed-in state; it does not change how Google sign-in works.

Team convention (CLAUDE.md): test fakes are enabled only for local development and test runs and must never reach production builds. A guest login is a similar kind of thing.

Constraints confirmed by hak at gate 1 ("Passt"). They are constraints unless an AC says otherwise:

- **Dev-only:** the guest option exists only in local development and automated test runs. It is never part of a deployed/production app (see AC12). Using it in a deployed app is a later decision, together with route protection and [003](003-stay-signed-in.md).
- The guest is signed in only in memory, like any user in 001: nothing is stored and a reload shows the login screen.
- A guest sees the same signed-in content as a Google user and signs out the same way.
- The login screen intro text stays as it is; the guest option is an additional, visually secondary button.

Relation to other stories:

- Changes 001/AC1: the login screen no longer offers only "Sign in with Google".
- 001/AC9 and AC10 (sign-out shows the login screen; a reload after sign-out still shows the login screen) are expected to hold for guests as well; see AC4 and AC5.
- [003 – Stay signed in](003-stay-signed-in.md) and any later route protection would have to take guest sign-in into account; see Open questions 1.

## Acceptance criteria

- **AC1:** Given I am not signed in and the guest sign-in is available in this environment (local development or a test run), when I open the app, then the login screen shows both a "Sign in with Google" option and a "Sign in as guest" option, and no signed-in state.
- **AC2:** Given I am on the login screen, when I choose "Sign in as guest", then I am signed in immediately, without any Google popup or Google request being needed, I see the signed-in state (a "Signed in as …" line and a "Sign out" option), and the login screen is no longer shown.
- **AC3:** Given Google sign-in cannot work (for example no Google client ID is configured or the Google script cannot be loaded), when I choose "Sign in as guest", then I am signed in as in AC2 and no Google error message is shown.
- **AC4:** Given I am signed in as a guest, when I choose "Sign out", then I see the login screen with both sign-in options and no signed-in state.
- **AC5:** Given I have signed out after a guest sign-in, when I reload the page, then I still see the login screen and no signed-in state.
- **AC6:** Given the login screen shows a Google cancelled or error message from a previous attempt, when I choose "Sign in as guest", then I am signed in and no cancelled or error message is shown anymore.
- **AC7:** Given I am signed in as a guest, when I look at the page, then I see the same signed-in content as a Google user (the counter is visible) and no "Sign in with Google" option.
- **AC8:** Given I choose "Sign in as guest", when I am signed in, then the signed-in line reads "Signed in as Guest".
- **AC9:** Given I have chosen "Sign in with Google" and the sign-in is in progress, when I look at the login screen, then "Sign in as guest" is disabled until the Google attempt ends, and it is enabled again after the attempt is cancelled or has failed.
- **AC10:** Given I am signed in as a guest, when I reload the page, then I see the login screen and no signed-in state.
- **AC11:** Given the login screen shows the guest option, when I read the login screen, then the intro text "Use your Google account to sign in." is still shown unchanged.
- **AC12:** Given the app is built for production (as for a deployment), when I open the login screen of that build, then there is no guest option, "Sign in as guest" is not shown, and the text "Sign in as guest" does not appear anywhere in the built files.

## Out of scope

- Any change to how Google sign-in works (001) or to Microsoft sign-in ([002](002-login-microsoft.md)).
- Keeping a guest signed in across reloads ([003](003-stay-signed-in.md)); guest sessions are not kept (AC10).
- Guest sign-in in a deployed/production app. To be revisited together with route protection and [003](003-stay-signed-in.md).
- Protecting parts of the app or routes (later story); a guest would have to be handled there.
- Guest accounts with their own data, roles, permissions or persisted anything.
- Any backend or server-side check of a guest.

## Open questions

None. All nine questions were answered at gate 1 (see Decision log).

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-01 — Story created from hak's request. "sign is as guest" read as a typo for "sign in as guest" (assumption, label still open). Key open question recorded without a decision: guest button only in development/test builds or also in a deployed app. Eight further open questions recorded with proposed defaults, none confirmed. ACs written only for behaviour that holds regardless of the answers. Marks change to 001/AC1. Status draft. (product-owner)
- 2026-11-01 — Q1: Where does the guest button exist (dev/test builds only, or also in a deployed app)? Proposed: dev-only. — A: "Passt" (hak, gate 1) = dev-only. Consequence: constraint in Context; AC12 (no guest option in a production build); guest in deployed apps moved to Out of scope, to be revisited with route protection and 003.
- 2026-11-01 — Q2: Button label? Proposed: "Sign in as guest" (request read as typo of "sign is as guest"). — A: "Passt" (hak, gate 1). Consequence: label used in AC1, AC2, AC3, AC6, AC12.
- 2026-11-01 — Q3: Name shown for the guest? Proposed: "Guest". — A: "Passt" (hak, gate 1). Consequence: AC8.
- 2026-11-01 — Q4: Does a guest sign out the same way? Proposed: same "Sign out", back to the login screen. — A: "Passt" (hak, gate 1). Consequence: AC4 stands as written.
- 2026-11-01 — Q5: Does a guest session survive a reload? Proposed: not kept, like 001. — A: "Passt" (hak, gate 1). Consequence: AC10; recorded as a constraint.
- 2026-11-01 — Q6: Do guest and Google look different in the header? Proposed: identical layout, header shows "Signed in as Guest". — A: "Passt" (hak, gate 1). Consequence: AC8; no separate guest marker.
- 2026-11-01 — Q7: May the guest option be used while a Google attempt is in progress? Proposed: disabled during the attempt. — A: "Passt" (hak, gate 1). Consequence: AC9.
- 2026-11-01 — Q8: Should the login intro text change? Proposed: unchanged; guest is an additional, visually secondary button. — A: "Passt" (hak, gate 1). Consequence: AC11; recorded as a constraint.
- 2026-11-01 — Q9: Should a guest see anything different from a Google user? Proposed: exactly the same content. — A: "Passt" (hak, gate 1). Consequence: AC7 stands as written; recorded as a constraint. Open questions now empty; AC8 to AC12 added (12 ACs in total, exceeding the ~7 guideline; flagged in the reply); status set to ready. (product-owner)

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
