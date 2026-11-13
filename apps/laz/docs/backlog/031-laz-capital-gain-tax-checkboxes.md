---
id: 031
title: Kapitalertragsteuer and Kirchensteuer as checkboxes
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
size: S # S | M | L (story 026). S = at most three ACs: needs only the Explanation, no Review section and no Cost table.
branch: feature/031-laz-capital-gain-tax-checkboxes
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [024/AC4] # stories whose behaviour this one modifies, e.g. [004/AC2, 007]
superseded-by: # set on the OLD story when a newer one replaces it
---

# 031 – Kapitalertragsteuer and Kirchensteuer as checkboxes

## Original request

> "Steuer kein Steuersatz in Prozent. Checkbox für Kapitalertragsstuer (25%) + Kirchensteuer
> (unterschiedlich nach Bundesland)" (hak, 2026-11-13)

## User story

As the depot owner, I want to pick the taxes that actually apply to me by checkboxes instead of
typing a rate, so that the shown result uses the real rates of my situation.

## Context

- The tax is still the tax on the gain at liquidation of 024 (`max(0, gain)`), only the way the rate
  is chosen changes: a free-text rate is replaced by the statutory rates.
- Measured facts (2026-11-13, published explainers and the BZSt page on church tax on capital gain
  tax): Kapitalertragsteuer 25 % of the capital gain; Kirchensteuer is computed **on the
  Kapitalertragsteuer**, not on the gain — 8 % in Bayern and Baden-Württemberg, 9 % in every other
  Bundesland; Solidaritätszuschlag 5,5 % of the Kapitalertragsteuer. Effective rate on the gain with
  the SolZ counted (hak's answer, 2026-11-13): 26,375 % with the KSt checkbox alone, 28,375 % with
  church tax at 8 % (Bayern), 28,625 % with church tax at 9 %.
- Assumption, stated as a decision: these are bond ETFs, so the whole gain is taxable (the 30 %
  partial exemption that applies to equity funds does not apply here). The tax is the flat
  Abgeltungsteuer on the gain, not the individual income tax rate (the Günstigerprüfung of avd
  [014](../../../avd/docs/backlog/014-avd-tax-refund.md) is not part of this app).
- The rate sum must stay exact: 5,5 % of 25 % is not a whole basis point, so the unit must be
  chosen so that all three parts are integers (the money rule: no float percentages).

## Acceptance criteria

- **AC1:** Given the Kapitalertragsteuer checkbox is checked, when a result is computed, then the
  taxed payout equals `NAV + 0,26375 × max(0, pre-tax projection − NAV)` (25 % plus the SolZ as hak
  decided); when the checkbox is unchecked the result equals the pre-tax projection exactly, and the
  form has no field for a typed rate any more (the accessibility tree shows no such control).
- **AC2:** Given the Kirchensteuer checkbox is checked with a Bundesland chosen, when the result is
  computed, then the church tax adds 8 % of the Kapitalertragsteuer for Bayern and Baden-Württemberg
  and 9 % for every other Bundesland, measured as effective rates on the gain: 26,375 %, 28,375 % and
  28,625 % with hand-pinned amounts; the church tax is ignored while the Kapitalertragsteuer checkbox
  is unchecked, and the select lists the 16 Bundesländer with the rate each one uses, starting at
  Bayern.
- **AC3:** Given the same inputs in each of the four states (KSt off; KSt on; KSt + KiSt at 8 %; KSt
  - KiSt at 9 %), when the amount is fed back through the opposite direction, then the round trip of
    024 AC3 still holds within one cent for every state, and a fund whose pre-tax projection is below
    its NAV stays untaxed. The `r = 100 %` case of 024 AC4 is no longer reachable through the form, so
    it stays a model-level case with a hand rate, not a UI case.

## Out of scope

- Any Günstigerprüfung or individual income tax; the Sparerpauschbetrag (the model taxes the whole
  gain, as 024 does); the SolZ exemption thresholds of 2021 (hak's amounts are above them, and the
  story counts the full 5,5 % of the KSt); withholding mechanics of a broker.

## Open questions

- None. The SolZ was the last open point and hak answered it on 2026-11-13.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be rebuilt without
the chat. Append only._

- 2026-11-13 — hak's request (verbatim above): no typed rate, checkbox for the 25 % Kapitalertragsteuer,
  church tax by Bundesland.
- 2026-11-13 — Decision (orchestrator): the free-text rate field is removed; the rates are the
  statutory ones, and the Bundesland is a select because the rate differs by state. Church tax is
  applied only while the Kapitalertragsteuer checkbox is checked, since it is computed on that tax.
- 2026-11-13 — Decision (orchestrator): the whole gain is taxable for these bond ETFs (no 30 %
  partial exemption), so the tax base is the same base 024 already uses.
- 2026-11-13 — hak's answer at gate 1 — Q: is the SolZ part of the checkbox, and which Bundesland is
  the default? — A: "Bayern, 8 % KiSt, Soli dazu", so the KSt checkbox means 26,375 % on the gain and
  Bayern is the default of the Bundesland select.
- 2026-11-13 — Decision (orchestrator): the rate is stored in millionths of a percent (25 % = 250000,
  SolZ 5,5 % of it = 13750, KiSt 8 % = 20000, 9 % = 22500), because 1,375 % is not a whole basis point
  and the money rule forbids float percentages.

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
