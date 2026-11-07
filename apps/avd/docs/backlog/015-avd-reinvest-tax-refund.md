---
id: 015
title: Altersvorsorgedepot optional reinvestment of the tax refund
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: avd # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: feature/015-avd-reinvest-tax-refund
supersedes: []
changes: [013/AC1, 013/AC5, 014/AC2, 014/AC5, 014/AC8]
superseded-by:
---

# 015 – Altersvorsorgedepot optional reinvestment of the tax refund

## Original request

> steuer ich kann meine Aufwände von der Steuer absetzen, das müssen wir auch noch berücksichtigen. Zu klären wie man das am besten abbildet. Steuersatz brauchen wir damit auch als PArameter

> wieder anlage optional (check box) dann wird es ganz normal ins Portfolio eingezahlt (zum 1.1. des Jahres) . Andernfalls von den Einzahlungen abziehen

Split note: the first quote is hak's original request of story [014](014-avd-tax-refund.md), the second his gate-1 answer to it. On hak's approval ("Ja, alle passen") the story was split: 014 keeps the tax rate, the refund and the net own contributions ("Andernfalls von den Einzahlungen abziehen"); this story 015 is the optional reinvestment ("wieder anlage optional (check box) …").

## User story

As a person planning my retirement, I want to choose that my yearly tax refund is paid back into the Altersvorsorgedepot, so that I can see how much higher the end value gets when I reinvest the refund instead of keeping it.

## Context

- Builds on [014](014-avd-tax-refund.md) (tax rate, yearly refund, net own contributions; ready) and [013](013-avd-saving-phase-zulagen.md) (saving phase, done). With the checkbox unchecked (default) the app behaves exactly as in 014.
- Interpretation of hak's answer (confirmed, "Ja, alle passen"): checked = the refund of saving year n is paid into the depot on 1 January of year n+1 (the year it arrives) and then grows with the depot's net return like any other money.
- Settled decisions (hak, "Ja, alle passen", formerly Open questions 2a to 2f of 014):
  - **2a:** the reinvested refund counts as an own contribution of year n+1 (legally any payment into the depot is a contribution): it raises that year's c for the Zulage and the deduction and counts against the 6.840 EUR cap per year. If the cap would be exceeded, only the part up to the cap is reinvested; the rest stays with the saver.
  - **2b:** the result shows a separate part "Reinvestierte Steuererstattung" (own contributions stay the saver's own money); own contributions, Zulagen, reinvested refund and returns sum exactly to the end value.
  - **2c:** the refund of the last saving year arrives after payout start and is not reinvested (no payments into the depot after payout start); it stays with the saver.
  - **2d:** the checkbox "Steuererstattung wieder anlegen" (label finalised by UX) is unchecked by default (legally the refund goes to the taxpayer; the default result equals 013/014).
  - **2e:** with the checkbox checked the per-year table gets its own column and the chart its own series and legend entry for the reinvested part (UX decides the look); unchecked, table and chart are as in 014.
  - **2f:** net own contributions (014) are shown only while the checkbox is unchecked.
- Convention (cents and rounding of 013/014 unchanged): R(n) = refund of saving year n as in 014. R(n) for n < N is added to the balance at the start of year n+1, before that year's first monthly contribution, so it earns the full 12 months of growth (monthly factor (1 + r_net)^(1/12), r_net = (1 + return) · (1 − costs) − 1); the Zulage convention of 013 is unchanged; R(N) is not reinvested. R(n+1) is computed from c(n+1) = 12 · monthly contribution + the reinvested R(n), capped so that c(n+1) <= 6.840 EUR; the 014 formulas (Zulage from c, deduction base min(c, 1.800) + Z) are applied to that c.
- Reference example (oracle for AC2, computed by the orchestrator and confirmed by hak): age 57, payout start 65 (N = 8), 150 EUR per month, 0 children, 5 % return, 0,5 % costs, tax rate 42 %, checkbox checked: R(n) = 442,80 EUR for n = 1 to 8; reinvested R(1) to R(7) = 3.099,60 EUR; own contributions 14.400,00 EUR, Zulagen 4.320,00 EUR, reinvested refund 3.099,60 EUR, returns 4.143,81 EUR, **end value 25.963,41 EUR**. It does not exercise decision 2a, because c = 1.800 EUR already reaches the maximum Grundzulage and the deduction cap, so c + R is only affected by the 6.840 EUR cap, which it stays below.

## Acceptance criteria

- **AC1:** Given the app is opened, when the page has loaded, then a checkbox "Steuererstattung wieder anlegen" is shown, unchecked, reachable and operable by keyboard with a programmatic label, and the result equals that of 014 for the same inputs (net own contributions shown, no reinvested part); when the user checks it and unchecks it again, then figures, table and chart update without a submit and are again identical to the 014 figures. (changes 013/AC1)
- **AC2:** Given the reference example (age 57, payout start 65, 150 EUR per month, 0 children, 5 % return, 0,5 % costs, 42 %), when the checkbox is checked, then the result shows own contributions 14.400,00 EUR, Zulagen 4.320,00 EUR, reinvested tax refund 3.099,60 EUR (R(1) to R(7); R(8) is not reinvested), returns 4.143,81 EUR and end value 25.963,41 EUR, the four parts sum exactly to the end value, the end value is higher than the unchecked 22.256,44 EUR, the net own contributions figure is not shown, and the refund figures of 014 (442,80 EUR per year, 3.542,40 EUR in total) are unchanged. (changes 014/AC2)
- **AC3:** Given age 40, payout start 65, 42 %, 0 children and the checkbox checked, when the monthly contribution is 25 EUR (c = 300), then the Zulage of saving year 2 is 169,50 EUR instead of 150,00 EUR and the refund of saving year 2 is 44,07 EUR, because the reinvested 39,00 EUR counts as own contribution of year 2; and when the monthly contribution is 570 EUR (c = 6.840), then the reinvested part is 0,00 EUR (the cap is reached, the refund stays with the saver) and the end value equals the unchecked one.
- **AC4:** Given the checkbox is checked and a result is shown, when the per-year table and the chart are shown, then the table has a column for the reinvested refund (cumulative, last row equal to the reinvested part of the result) and its depot columns sum to the balance of each year, the chart shows the reinvested part as its own series with a legend entry and the chart's text alternative names it, and both update without a submit when any input changes; unchecked, table and chart are as in 014. (changes 013/AC5, 014/AC5)
- **AC5:** Given the checkbox is checked, when the refund is zero (tax rate 0 %, or monthly contribution 9,99 EUR) or there is only one saving year (age 69, payout start 70), then the reinvested part is shown as 0,00 EUR and the end value equals the unchecked one; and when any other input is invalid, then the no-result hint of 013/AC6 is shown, the checkbox keeps its state, and no NaN, Infinity or negative amount appears anywhere.
- **AC6:** Given the checkbox is checked and a result is shown, when the note is displayed, then it states that the refund of each saving year is paid into the depot on 1 January of the following year, that the refund of the last saving year is not reinvested, and still states everything of 014/AC8 apart from "not credited to the depot", which applies to the unchecked state only. (changes 014/AC8)

## Out of scope

- Reinvestment into a side depot (outside the Altersvorsorgedepot); choosing a share of the refund to reinvest; a different reinvestment date than 1 January.
- Everything listed as out of scope in 014 (exact tax calculation from income and tariff, payout taxation, comparison with an ETF depot, Förderquote, other deductions).
- Showing the refund of the unchecked state in the chart (stays as in 014).

## Open questions

None. All questions are settled (see Context and Decision log 2026-11-07).

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-07 — hak's gate-1 answer on 014, Q2 (use of the refund): "wieder anlage optional (check box) dann wird es ganz normal ins Portfolio eingezahlt (zum 1.1. des Jahres) . Andernfalls von den Einzahlungen abziehen"
- 2026-11-07 — Split from 014: hak approved the proposed split (014 Q9, default split) with "Ja, alle passen". 014 keeps the refund and the net own contributions; this story takes the checkbox and the reinvestment (formerly 014/AC9 and AC10).
- 2026-11-07 — Questions 2a to 2f (reinvested refund counts as own contribution incl. cap; separate result part; last refund not reinvested; checkbox unchecked by default; own table column and chart series; net contributions only while unchecked) — hak: "Ja, alle passen". He also confirmed the reinvested reference numbers (own 14.400,00, Zulagen 4.320,00, reinvested 3.099,60, returns 4.143,81, end value 25.963,41 EUR at 42 %). Status ready.

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

_orchestrator: what went wrong (review rounds, defects, corrections at the gates),
proposed changes to agents/CLAUDE.md/templates, and which ones hak approved. Include a
`### Cost` table (see the retro step of `/feature`)._
