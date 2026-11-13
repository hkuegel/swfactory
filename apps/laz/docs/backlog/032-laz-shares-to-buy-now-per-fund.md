---
id: 032
title: Shares of each fund to buy now
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
size: S # S | M | L (story 026). S = at most three ACs: needs only the Explanation, no Review section and no Cost table.
branch: feature/032-laz-shares-to-buy-now-per-fund
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [] # adds a column to the fund table; the funding rule and the projection label of 024 are used, not modified
superseded-by: # set on the OLD story when a newer one replaces it
---

# 032 – Shares of each fund to buy now

## Original request

> "ich will auch wissen wieviel ich von jedem ETF JETZT kaufen muss" (hak, 2026-11-13)

## User story

As the depot owner, I want to see for each fund how many shares I would have to buy today, so that
the plan shows the purchase side and not only the payout side.

## Context

- The fund table of story 024 shows NAV, YTM and the projected payout per
  share. Hak wants the other side of the same model: which purchase in each fund produces the amount
  that funds the phase year that fund finances (024 AC2: a phase year is funded by the fund
  liquidated in December of the year before).
- The rule, in one line: `shares = amount of the phase year / projected payout per share` and
  `purchase now = shares × NAV`. This is the same projection and the same tax state as the payout
  column, so both directions use the model already defined by 024 ADR 0012; nothing new is computed.
- "Jetzt" is the price in the data file, not a live price: the NAV and its asOf come from the
  committed data file (ADR 0013), and the existing projection label (024 AC5) names that date. No
  runtime fetch (024 AC6 still holds).
- In the round trip of 024 AC3 the depot is already the sum of the present values of the funded
  years, so the per-fund purchases are the parts of that sum; this story shows them instead of only
  the total.

## Acceptance criteria

- **AC1:** Given a fund whose liquidation falls inside the phase, when the fund row is shown, then
  it shows the number of shares that produces the phase-year amount under the current tax state, and
  the amount that purchase costs at the data-file NAV; measured against hand-pinned values for one
  example phase (hand oracle, not the values the display computes).
- **AC2:** Given the result of either direction, when the per-fund purchase amounts are added, then
  the sum equals the shown depot (direction 1) or the shown required depot (direction 2) within one
  cent, measured on the unrounded internal values, with the last part derived from the total instead
  of rounded separately (the money rule).
- **AC3:** Given a phase year with no funding fund, or a fund whose liquidation falls after the
  phase end, when the row is shown, then it shows no purchase: a dash in both new cells, no number
  invented, and the cell says why (for example `kein Fonds für dieses Jahr` and `Auflösung nach
Phaseende`), while the projection label with its asOf stays associated with the row (024 AC5).

## Out of scope

- Broker realities: order minimums, fees, partial shares from savings plans, and whether a share
  order can be placed in whole numbers only; the story shows the model's number.
- Any live price, any network request, any storage write (024 AC6).
- The tax model changes of 031 and the phase input changes of 033.

## Open questions

- None. Shares are shown with two decimals because the model's number is not a whole share; if hak
  wants whole shares only (rounded up, with the amount for the rounded number), that is a new
  decision and a new display rule, not part of these ACs.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be rebuilt without
the chat. Append only._

- 2026-11-13 — hak's request (verbatim above).
- 2026-11-13 — Decision (orchestrator): the shares are the model's exact number with two decimals,
  so the sum property of AC2 holds; whole-share rounding is not applied here.

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
