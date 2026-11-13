---
id: 030
title: Amount fields without an invented cap
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
size: S # S | M | L (story 026). S = at most three ACs: needs only the Explanation, no Review section and no Cost table.
branch: feature/030-laz-amount-fields-without-an-arbitrary-cap
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [024/AC3] # stories whose behaviour this one modifies, e.g. [004/AC2, 007]
superseded-by: # set on the OLD story when a newer one replaces it
---

# 030 – Amount fields without an invented cap

## Original request

> "wieso Begrenzung auf 200k ? dafür gibt es keinen Grund" (hak, 2026-11-13)

## User story

As the depot owner, I want to enter the amount I actually have, so that the app does not refuse a
depot because of a maximum the design invented.

## Context

- The caps (depot 200.000,00 €; monthly target 10.000,00 € per month; tax rate 0 – 50 %) come from
  story 024's design, not from hak: the ranges were recorded there as
  needed "for UX's error wording and for safe integers", and the 200.000,00 € was the largest value
  the AC3 round trip was measured on. Hak rejects the cap as arbitrary, so the error wording can no
  longer quote a made-up maximum.
- What a field can still legitimately require: a non-negative value, at most the number of decimals
  its unit has (2 for cents, 6 for micro-euro, 2 for a percent), and a value that is exactly an
  integer in that unit. Only the last is a real limit, and the error must name that reason.
- The tax rate field itself is removed by [031](031-laz-capital-gain-tax-checkboxes.md), so the
  0 – 50 % bound goes with it; a rate above 100 % is not a rate, and 024 AC4 measures r = 100 %.

## Acceptance criteria

- **AC1:** Given a money field (depot, monthly target, NAV override), when a value above the cap
  recorded in 024 is entered with at most the decimals of its unit, then the value is accepted and
  used for the result; measured on depot 250.000,00 € and monthly target 12.000,00 € per month,
  which follow the same rule as the values below the old cap.
- **AC2:** Given a value that is not exactly an integer in the field's unit, when it is entered,
  then the error states that reason (the unit and its exact-integer limit) instead of a maximum
  amount, and the largest value that is still exact is accepted while one unit above it is refused.
- **AC3:** Given the hint and error copy of a money field, then it states the decimal rule and the
  exact-integer rule and quotes no maximum amount; the round trip of 024 AC3 still holds within one
  cent, measured on the unrounded internal values at 200.000,00 € and at 1.000.000,00 €.

## Out of scope

- The tax model (031), the phase range and typing (033), the projection rule (024).
- Accepting more decimals than the field's unit (the guard of 025 stays).

## Open questions

- None. The exact-integer limit is a property of the unit, not a policy choice; if a unit must hold
  bigger values, that is a new unit decision, not a cap.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be rebuilt without
the chat. Append only._

- 2026-11-13 — hak's correction (verbatim above): the 200.000,00 € cap has no reason and is dropped.
- 2026-11-13 — Decision (orchestrator): no value cap remains in a money field; the only rejection
  reasons are the sign, the decimals of the unit, and the exact-integer limit of the unit (integer
  cents, micro-euro), which the error text names.
- 2026-11-13 — Decision (orchestrator): the copy that quoted a maximum is rewritten to state the
  rule, so `{R}` in the error pattern is a rule, not a number.

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
