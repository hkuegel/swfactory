---
id: 002
title: Login with Microsoft work account
status: draft # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
branch: feature/002-login-microsoft
supersedes: []
changes: []
superseded-by:
---

# 002 – Login with Microsoft work account

## Original request

> login - the user should be able to login, using google or exchange

Note: this story was split off from [001 – Login with Google](001-login.md) at hak's request ("lets start with only google authentication"). 001 covers Google; this story covers the "exchange" part of the original request.

## User story

As a visitor of the app, I want to sign in with my Microsoft work account ("exchange"), so that the app knows who I am.

## Context

hak wrote "exchange". This is most likely meant as a Microsoft work account (Exchange Online / Microsoft 365 / Entra ID), but that is an assumption and not confirmed. Until it is confirmed, this story uses the neutral wording "Microsoft account".

This story depends on 001: it adds a second sign-in option next to "Sign in with Google" and reuses the same signed-in state and error handling. When it is made ready, it will modify 001/AC1 (the login screen offers two options instead of one); the `changes` link is set then.

No ACs are written yet, because the meaning of "exchange" and the allowed accounts are unclear. Once they are answered, the ACs are expected to mirror those of 001 (login screen option, successful sign-in with name, in-progress state, cancel, error, retry) for the Microsoft provider, plus the behaviour decided in the questions below.

## Acceptance criteria

_To be written once the open questions are answered._

## Out of scope

- Sign-in with Google: see [001 – Login with Google](001-login.md).
- Logout, protecting parts of the app, session handling and stored user data: they follow the decisions made for 001.
- Any other sign-in method.

## Open questions

1. **What does "exchange" mean?** Assumed: a Microsoft work or school account (Microsoft 365 / Entra ID / Exchange Online). Is that right? Or something else, such as an on-premises Exchange login?
2. **Which Microsoft accounts are allowed?** Personal Microsoft accounts, or only organisation accounts (for example the firstwaters tenant)? What should a not-allowed account see?
3. **Same person via both providers:** What should happen if someone signs in with Google one day and Microsoft the next, with the same email address? Same user or two users? (Only relevant once both providers exist.)
4. **Open questions of 001 that carry over:** The answers on backend, what is protected, staying signed in, logout, missing name and stored data (see 001) should apply to Microsoft as well unless hak says otherwise.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-01 — Story created by splitting the Microsoft / "exchange" part off 001 at hak's request. hak's words at gate 1 for 001: "lets start with only google authentication". Microsoft-specific open questions carried over from 001; no ACs yet. (product-owner)

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
