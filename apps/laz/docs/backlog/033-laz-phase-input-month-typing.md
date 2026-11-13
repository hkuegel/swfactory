---
id: 033
title: Phase months without an invented range, typed as a month
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
size: S # S | M | L (story 026). S = at most three ACs: needs only the Explanation, no Review section and no Cost table.
branch: feature/033-laz-phase-input-month-typing
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [] # the phase range and the typing rule are design values of 024, not acceptance criteria; the missing-year rule of AC2 is reused, not modified
superseded-by: # set on the OLD story when a newer one replaces it
---

# 033 – Phase months without an invented range, typed as a month

## Original request

> "Beginn / Ende Phase : Warum wird das begrenzt ? Ausserdem bitte bessere Eingabemäglichkeit"
> (hak, 2026-11-13)

## User story

As the depot owner, I want to type a phase month in a short form and be free in which months I
choose, so that the form does not refuse a phase only because of a range the design picked.

## Context

- Answer to hak's question, for the record: the range 1.1.2027 – 31.12.2034 was not a business rule.
  The fund list has funds for 2028 – 2034, so a phase year outside the list cannot be funded; the
  lower bound was set only so that a phase before the list stays expressible and reports missing
  years (024). A phase year without a funding fund is already shown as `kein Fonds für dieses Jahr`
  with no amount (024 AC2, open question 3), so a range is not needed to keep the model sound.
- The typing rule of 024 (`TT.MM.JJJJ`) requires a day the model never uses: a phase month is a
  whole month, and the display of a month label deliberately shows no day (024 review round 1,
  finding 3). Typing `MM.JJJJ` is the shorter form of the same value.
- `type="month"` was considered and rejected for the same reason 024 rejected `type="date"`: the
  displayed format is browser-locale dependent and the value is empty for a partial entry, which
  makes an error wording unreachable.

## Acceptance criteria

- **AC1:** Given any month in any year, when the phase is shown, then no value is refused because of
  a range; a phase entirely before the fund list and a phase entirely after it show every phase year
  as `kein Fonds für dieses Jahr` with no amount, a total of 0,00 €, and no year is dropped from the
  table.
- **AC2:** Given a phase field, when the input is incomplete (only a month, or only a year, or a
  month with a trailing separator), then nothing is marked as an error; the error appears only for a
  complete input that is invalid, and `MM.JJJJ` is accepted as a whole month. A day may still be
  typed and must be a real day of that month, and a month label never shows a day.
- **AC3:** Given the form is opened, then the phase fields start with hak's example phase (Beginn
  01.2028, Ende 03.2034) as their default, both fields keep the German format, are reached by the
  keyboard in the order 024 fixed, and none of them is ever disabled.

## Out of scope

- The amount-field rules (030) and the tax controls (031).
- A month picker or a calendar widget; the field stays a text input.
- Changing the funding rule or the projection convention (024, ADR 0012).

## Open questions

- None. The defaults are hak's own example values from 2026-11-13; if he wants other defaults, that
  is a copy decision, cheap to change.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be rebuilt without
the chat. Append only._

- 2026-11-13 — hak's request (verbatim above): the phase range has no reason, and the input needs to
  be easier to use.
- 2026-11-13 — Decision (orchestrator): the range is dropped; the fund list's coverage is reported
  per year instead of enforced as an input bound. `MM.JJJJ` becomes the accepted form, a day stays
  accepted but is not required, and an error is shown only for a complete input.
- 2026-11-13 — Decision (orchestrator): defaults are hak's example phase, so the app shows a plan on
  first opening without inventing a phase the user did not ask for.

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

## Explanation

_orchestrator: plain-language explanation shown at gate 2, at most 15 lines of at most 120 characters. No code, no file names._

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates), proposed changes
to agents/CLAUDE.md/templates, and which ones hak approved. Include a `### Cost` table (see the retro
step of `/feature`)._
