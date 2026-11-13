---
id: 030
title: Amount fields without an invented cap
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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
- 2026-11-13 — Gate 2: accept the result, merge in the order 024 → 025 → 030, and continue with the
  next story on this branch's tip. P21 is not answered yet, so it stays a proposal. - A: "ja, mach"
  (hak, gate 2). Consequence: status done, merged on `main`. (orchestrator)
- 2026-11-13 - Gate 2 follow-up: hak confirmed all open gates, which approves P21. Applied to
  `.claude/agents/tester.md`. (orchestrator)

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

## Implementation notes

_developer: what was built, deviations from the design and why._

- The amount field and the NAV cell have no maximum; the phase fields and the percent fields keep the
  bound that belongs to what the value means, so `FieldSpec.max` is nullable. `fieldSpec` lost its
  `direction` parameter: the rule of a money field does not depend on the direction, only its label
  does, and the label stays in the copy.
- The magnitude of a number field is read as digits first, so the exact-integer bound is seen before
  the value becomes a Number that is no longer exact. A new error kind `exact` carries that reason, and
  the copy of a money field quotes the rule (sign, decimals, whole unit) instead of an amount.
- The bound the copy quotes is derived from the same constant the parser uses, so copy and parser
  cannot disagree — the defect pattern story 025 found on the NAV cell.

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s)                                                                                                                                                                                                                                                                                                          | Result |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | `parseInputs.test.ts`: the values above the cap 024 had are accepted and used, with hand values in cents (25.000.000 and 1.200.000); e2e `030 AC1`: the figures shown for those inputs, hand values 4.535,13 €, 285.713,06 €, 661.502,83 €, 756.000,00 €                                                         | pass   |
| AC2 | `parseInputs.test.ts`: the largest value that is exact in the unit is accepted, one unit above is refused with the reason `exact`; the digits check is tested on its own so it cannot be a float comparison; e2e `030 AC2, AC3`: the error shown in the UI names the unit, and the accepted value shows no error | pass   |
| AC3 | `fieldCopy.test.ts`: the copy of depot, monthly target and NAV cell states the decimal rule and the exact-integer rule and quotes no maximum amount, and the number it quotes equals the constant the parser uses; `phase.test.ts`: the round trip within one cent, now also at 1.000.000,00 €                   | pass   |

Defect found while testing: my first hand value was wrong, not the code. `9007199254740991` as typed
text is 900.719.925.474.099.100 Cent, which is far above the bound; the largest accepted text is
`90071992547409,91` (9007199254740991 Cent). The test was corrected to that, the code was not touched.

Mutation check, run on a copy under `.tmp` (never on the real file): the digit guard is made to always
pass, and the copied hand expectation for `90071992547409,92` goes red, so the test can fail. Copies
deleted afterwards; the real files are still green (12 unit tests).

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

Size S: no review round ran. Self-check before the commit: no bound left in a money field (the specs
say `max: null`), the copy has no number left that could read as a maximum, the error kind is the only
new kind and the copy for it names the unit, and the checks that this change can affect are the ones
listed in the Test report (typecheck, lint, format, unit tests, the app's e2e); the build and the
fixture check cannot be affected by a change that does not touch the data file or the bundle.

## Explanation

_The gate 2 explanation is given in German; this is the English text of the record._

The money fields no longer refuse a value because of a maximum the design had invented. What stays is
what the unit itself requires: the sign, the number of decimals the unit has, and that the value is an
exact whole unit. The last rule is a real limit, not a policy choice, and the error now names it.
Measured on values above the old cap: depot 250.000,00 € gives 4.535,13 € per month, a target of
12.000,00 € per month needs 661.502,83 €, and the round trip through the opposite direction stays
within one cent at 1.000.000,00 €. The copy quotes the rule of the unit instead of an amount, and the
bound it quotes is read from the same constant the parser uses, so the two cannot disagree.

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates), proposed changes
to agents/CLAUDE.md/templates, and which ones hak approved. Include a `### Cost` table (see the retro
step of `/feature`)._

What went wrong: one wrong hand value (the raw digit string read as the whole part), found by my own
test. No review round, no correction at the gates. Size S, so no Cost table (story 026, R8).

- **P21 (`.claude/agents/tester.md`, hand-oracle rule):** the rule keeps "never
  read from the same source", and adds that a hand value is written in the field's own format - the text
  a user would type, with its decimal separator - and that a test may check the digit string and the
  parsed value as two separate assertions. This is the form that caught my mistake here: my wrong value
  was not read from the code, it was the wrong format.
  **Outcome:** approved by hak on 2026-11-13 with the confirmation of all open gates, applied to
  `.claude/agents/tester.md`. The proposal number P21 continues the numbering of story 024 (P13-P20); the
  numbers used by story 025 were a duplicate of those and are recorded there as P22-P26.
