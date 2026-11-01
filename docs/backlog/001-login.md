---
id: 001
title: Login with Google
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
branch: feature/001-login
supersedes: []
changes: []
superseded-by:
---

# 001 – Login with Google

## Original request

> login - the user should be able to login, using google or exchange

## User story

As a visitor of the app, I want to sign in with my Google account and sign out again, so that the app knows who I am and I stay in control of whether I am signed in.

## Context

First real story; the backlog was empty. The app is currently a fresh scaffold with a placeholder counter, no backend, no routing and no authentication.

hak's original request named two providers, Google and "exchange". At gate 1 hak narrowed the scope to Google only ("lets start with only google authentication"). The Microsoft / "exchange" sign-in was split off into [002 – Login with Microsoft](002-login-microsoft.md).

Constraints confirmed by hak at gate 1 ("Yes, confirm all"). They are constraints, not ACs:

- Any Google account (personal or organisation) may sign in; there is no restriction by domain or account.
- Frontend-only: there is no backend in this story and no server-side verification of the sign-in.
- Nothing in the app is protected yet. "Signed in" means only that the user's name (or email, see AC11) is shown.
- Staying signed in after a reload relies on Google's own session. The app stores no user data of its own; user information is kept in memory only.

Interplay of AC7 to AC10: a reload keeps the user signed in while Google's session is valid, but after an explicit logout a reload must not sign the user in again, even if Google's session is still valid.

In automated tests the identity provider will be simulated. The ACs below describe only what the user can observe.

## Acceptance criteria

- **AC1:** Given I am not signed in, when I open the app, then I see a login screen with a "Sign in with Google" option and no signed-in state.
- **AC2:** Given I am on the login screen, when I choose "Sign in with Google" and complete the Google sign-in successfully, then I see that I am signed in, with my name displayed, and the login screen is no longer shown.
- **AC3:** Given I have chosen "Sign in with Google" and the sign-in is in progress, when I look at the login screen, then a progress indication is visible and the "Sign in with Google" option is disabled until the attempt ends.
- **AC4:** Given I have chosen "Sign in with Google", when I cancel or close the Google sign-in without completing it, then I stay on the login screen, I see a message that the sign-in was cancelled, and the option is enabled again.
- **AC5:** Given I have chosen "Sign in with Google", when Google reports an error (for example unavailable or access denied), then I stay on the login screen, I see an error message that the Google sign-in failed, and the option is enabled again.
- **AC6:** Given a sign-in attempt has failed or was cancelled and an error or cancel message is shown, when I retry and the sign-in succeeds, then I see the signed-in state and no error or cancel message is shown anymore.
- **AC7:** Given I am signed in and my Google session is still valid, when I reload the page, then I am still signed in with my name displayed, without having to choose "Sign in with Google" again.
- **AC8:** Given I was signed in but my Google session is no longer valid, when I reload the page, then I see the login screen and no signed-in state.
- **AC9:** Given I am signed in, when I choose to sign out, then I see the login screen with the "Sign in with Google" option and no signed-in state.
- **AC10:** Given I have signed out and my Google session is still valid, when I reload the page, then I still see the login screen and no signed-in state (I am not signed in again silently).
- **AC11:** Given Google provides no name for my account, when I sign in successfully, then my email address is displayed in place of the name.

## Out of scope

- Sign-in with a Microsoft work account ("exchange"): see [002 – Login with Microsoft](002-login-microsoft.md).
- Server-side verification of the sign-in and any backend (later story).
- Protecting parts of the app or routes so that only signed-in users can access them (later story).
- Restricting which Google accounts may sign in, for example to a domain (later story).
- Linking or merging accounts across providers (only relevant once more than one provider exists, see 002).
- User profiles, roles or any persisted user data of our own.
- Any other sign-in method (username/password, other providers).

## Open questions

None.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-01 — Story created from hak's request. Interpretation of "exchange" as a Microsoft work account recorded as an assumption in Open questions; not decided. Scope limited to sign-in and the signed-in state; logout and route protection named as likely separate stories. (product-owner)
- 2026-11-01 — Q: Scope, which providers should the first story cover (Google and "exchange" as requested, or fewer)? — A: "lets start with only google authentication" (hak, gate 1). Consequence: story rescoped to Google only (title, user story, ACs; the Microsoft option and its AC removed, ACs renumbered AC1 to AC6); Microsoft / "exchange" split off into story 002; open questions that only apply with several providers or to Microsoft moved to 002 or dropped; proposed defaults added to the remaining open questions, not yet confirmed. (product-owner)
- 2026-11-01 — Q: Allowed accounts: are all Google accounts allowed, or only certain ones? — A: Any Google account for now; no restriction (confirmed by hak: "Yes, confirm all"). Recorded as a constraint; restriction by domain or account is a later story.
- 2026-11-01 — Q: Backend: is there or should there be a backend as part of this story? — A: Frontend-only for now; server-side token verification is a later story (confirmed by hak: "Yes, confirm all").
- 2026-11-01 — Q: What changes after login / what is protected? — A: Nothing is protected yet; "signed in" means only that the user's name is shown (confirmed by hak: "Yes, confirm all"). Route protection is a later story.
- 2026-11-01 — Q: Stay signed in after reload? — A: Yes, through Google's own session, with no storage of our own (confirmed by hak: "Yes, confirm all"). Added as AC7 and AC8.
- 2026-11-01 — Q: Logout in this story or a follow-up? — A: Part of this story (confirmed by hak: "Yes, confirm all"). Added as AC9 and AC10; user story updated.
- 2026-11-01 — Q: What is shown if Google does not deliver a name? — A: Show the email address (confirmed by hak: "Yes, confirm all"). Added as AC11.
- 2026-11-01 — Q: Is any data about the user stored? — A: None; kept in memory only (confirmed by hak: "Yes, confirm all"). Recorded as a constraint. Status set to ready.
- 2026-11-01 — Q: 11 ACs exceed the ~7 guideline; split session/logout (AC7–AC10) into a separate story? — A: "Go, keep 11 ACs" (hak, gate 1). Story approved as is. (orchestrator)

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
