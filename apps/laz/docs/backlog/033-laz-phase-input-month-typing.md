---
id: 033
title: Phase months without an invented range, typed as a month
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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
- 2026-11-14 — Gate 2: hak confirmed all open gates on 2026-11-13 and asked for the open `laz` stories to
  be finished without waiting for his approval, which covers this story's Explanation. Story set to done,
  index row in the same commit. The look in the browser after the merge stays hak's manual check.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

## Implementation notes

- The phase fields have no bound of their own: `FieldSpec.min` and `max` are nullable and a phase field
  carries `null` for both, so the copy and the parser read the same rules (030 made the money fields
  nullable first, this story did the same for a month).
- A new three-state month parser: partial (still typing), invalid (a complete entry that is not a real
  month), month (a whole month). The wrapper that returns a month name is kept for the callers, so the
  typing state can name no error. A result may carry `error: null`, and both the form and the fund-row
  override skip such a field instead of marking it.
- Defaults are hak's example phase, 01.2028 and 03.2034.
- The phase copy names the shape of the input and shows `MM.JJJJ` as the example; no copy line quotes a
  range any more.
- Deviation from the design: `type="month"` stays rejected (its displayed format is browser-locale
  dependent and its value is empty for a partial entry, which makes an error wording unreachable), so
  the field stays a text input.

## Test report

| AC  | Test(s)                                                                                                                                                                                                                                                                                                                                                                              | Result |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| AC1 | `parseInputs.test.ts` (hand month keys: 1.1.2026 → 24313 and 1.1.2035 → 24421, outside the range 024 had); `phase.test.ts` "033 AC1: a phase outside the fund list keeps every phase year and totals 0,00 €" (before the list: one year kept, all rows null, total 0,00 €; after the list: two years, 12 and 2 months); e2e "033 AC1, AC2"                                           | pass   |
| AC2 | `parseInputs.test.ts` (hand states: `1`, `2028`, `1.`, `1.2`, `1.2.`, `01.20`, `20` are partial and name no error; `31.13.2028`, `29.2.2027`, `13.2028`, `1.0.2028`, `abc.2028` are refused as a complete input); e2e "033 AC1, AC2": `13.` shows no `aria-invalid` and no error text, `13.2028` shows the hand error string, `01.2026` and `12.2026` are accepted in the short form | pass   |
| AC3 | e2e "033 AC3": the fields start with `01.2028` and `03.2034` as hand values in the field's own format, the keyboard reaches them in the form order, none is disabled; `fieldCopy.test.ts` "033 AC1, AC3": the phase copy quotes the shape, not a range                                                                                                                               | pass   |

Counts as printed: laz vitest 14 passed (6 files); laz Playwright 48 passed, including the two new tests.
Full run green, 12 steps.

Non-vacuity: a copy of the parser was changed so that `1.` counted as a complete invalid input; the AC2
assertion went red with that change, which shows it can fail. The copy was deleted afterwards, not
restored with git.

Checked, OK: a month that is still being typed (`20`) is not refused; a month label prints no day
(e2e asserts the caption against hand month names); the trailing separator case is the same state as
`1`. No defects found.

## Review

Size S, so no review round (story 026).

## Explanation

The phase fields no longer refuse a month because of a range. That range was the design's own
convenience, not a rule: a phase year the fund list cannot fund is already shown as a missing year
with no amount, so a phase before or after the fund list stays expressible and no year is dropped.
A month can be typed in the short form, month and year; a day may still be typed and must be a real
day of that month, and a month label never shows a day.
An entry that is not finished yet is a typing state, so nothing is marked as an error while typing;
an error appears only for a complete entry that is actually wrong.
The defaults are the example phase you gave, so the app shows a plan on first opening.
The field copy names the shape of the input instead of quoting a bound.
Checks this change can affect are green: 14 unit tests, 48 e2e tests, full run 12 steps.
Manual check: the look in the browser after the merge is yours; nothing else is open.

## Retrospective

What went wrong: nothing in this story's own work — no review round (size S), no defect in the code,
no correction at the gates, no hand value corrected.

One tooling defect was found while running this story's checks: the check runner stopped when no full
run had been recorded yet, because it read the recorded run as a list and the caller passed nothing.
It is fixed on branch `fix/verify-full-run-without-a-record` (2026-11-13), which is not merged and
awaits hak's go; until it is merged, a full run is called with an explicit base. The fix was proven
through its caller with a hand test, and a mutation on a copy made that test red as required.

Proposed changes: none beyond that fix — the rule it implements (an optional value from a caller must
be handled, and a fix is tested through its caller) is already in the tester's rules.

No Cost table: size S (story 026, R8).
