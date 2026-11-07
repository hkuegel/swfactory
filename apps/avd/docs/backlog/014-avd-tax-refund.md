---
id: 014
title: Altersvorsorgedepot tax refund from the Günstigerprüfung (marginal tax rate)
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: avd # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: feature/014-avd-tax-refund
supersedes: []
changes: [013/AC1, 013/AC5, 013/AC6, 013/AC7, 013/AC8]
superseded-by:
---

# 014 – Altersvorsorgedepot tax refund from the Günstigerprüfung (marginal tax rate)

## Original request

> steuer ich kann meine Aufwände von der Steuer absetzen, das müssen wir auch noch berücksichtigen. Zu klären wie man das am besten abbildet. Steuersatz brauchen wir damit auch als PArameter

Split note: hak's gate-1 answer on the use of the refund ("wieder anlage optional (check box) dann wird es ganz normal ins Portfolio eingezahlt (zum 1.1. des Jahres) . Andernfalls von den Einzahlungen abziehen") was split off on hak's approval into [015](015-avd-reinvest-tax-refund.md). This story is the "Andernfalls" part: the refund is paid to the saver and deducted from the own contributions. Optional reinvestment: story 015.

## User story

As a person planning my retirement, I want to enter my marginal tax rate and see how much extra income tax I get refunded each year, and in total, and what my own contributions cost me after that refund, because I can deduct my Altersvorsorgedepot contributions from tax, so that I can see what the tax deduction adds on top of the Zulagen and what my savings really cost me.

## Context

- Second step after [013](013-avd-saving-phase-zulagen.md) (saving phase with Zulagen, done). The depot figures of 013 (own contributions, Zulagen, returns, end value, table, chart) are **unchanged**; 014 adds one input, a separate tax-refund result and net own contributions. Payout taxation (§ 22 Nr. 5 EStG) is not part of this story; it belongs to the later payout-phase story.
- Research (orchestrator, 2026-11-07; notes: `/private/tmp/claude-501/-Users-haraldkuegel-swfactory/b6ad74d5-b7e6-4d4e-b781-9f99c3559d23/scratchpad/avd/tax-research.md`; sources: BT-Drs. 21/4996 https://dserver.bundestag.de/btd/21/049/2104996.pdf, § 10a EStG https://www.gesetze-im-internet.de/estg/__10a.html, Finanzfluss calculator documentation 07/2026, transparent-beraten.de 19.10.2026):
  - New § 10a Abs. 1 EStG: deductible "jährlich bis zu 1 800 Euro zuzüglich der dafür … zustehenden Zulage". Deduction base = min(c, 1.800) + Zulage; contributions above 1.800 EUR per year are not deductible (c = own contribution per year, as in 013).
  - Günstigerprüfung (§ 10a Abs. 2 EStG, unchanged): the Finanzamt checks ex officio whether the deduction is more favourable than the Zulage. The Zulage is always credited to the depot; only the **excess tax saving** is paid to the taxpayer via the tax assessment (about the following year), **not** into the depot.
  - Model of this story (simplified, one marginal tax rate t): extra refund per year = max(0, (min(c, 1.800) + Z) · t − Z), where Z = Zulage of that saving year (Grundzulage + Kinderzulage, in saving year 1 plus the Berufseinsteigerbonus). Break-even for c = 1.800, 0 children: t = 540 / 2.340 ≈ 23,1 %.
  - Reference example (oracle for AC2): age 57, payout start 65 (8 saving years), 150 EUR per month (c = 1.800, Z = 540), 0 children, t = 42 %: (1.800 + 540) · 0,42 − 540 = **442,80 EUR per year, 3.542,40 EUR in total** (age 57: no bonus). Cents: base and Z in cents, base · t rounded once to the cent per year; the total is the sum of the rounded yearly amounts.
  - Not verified in the law (accepted by hak as model defaults): whether Kinderzulage and the 200 EUR bonus count in the comparison, effect of Soli and Kirchensteuer, no BMF Anwendungsschreiben yet. An exact model would need income and tariff (Finanzfluss does that); it is not built here.
- Settled model decisions (hak, "Ja, alle passen", see Decision log):
  - The input is one marginal tax rate (no income and tariff).
  - The refund is always paid to the saver, shown separately from the depot and **not** reinvested here (optional reinvestment: story 015). Net own contributions = own contributions − total refunds (the effective cost of saving), shown next to the depot split. Reference at 42 %: 14.400,00 − 3.542,40 = **10.857,60 EUR**. All refunds, including the last saving year's, are deducted.
  - The rate is one combined rate including Soli and Kirchensteuer; allowed range 0,00 to 50,00 %; default 30 % (above the break-even of about 23 %, so the default shows a small refund of 162,00 EUR per year at 150 EUR per month, without suggesting the top rate).
  - Kinderzulage and the Berufseinsteigerbonus both count as Zulage Z in the comparison (bonus in saving year 1 only).
  - Below c = 120 EUR per year there is no tax benefit either.
  - The refund is assigned to the saving year of the contribution and labelled so; the payment about a year later is only mentioned in the note, not modelled.
  - No Förderquote indicator.
- Assumptions of the model (shown in the note, AC8): the rate is constant over all saving years; the person is taxable with the entered marginal rate in every year; no other effect on tax.
- Calculation convention of 013 (cents, rounding, saving years) stays; 013/AC4 (reference depot figures) still holds for every tax rate.

## Acceptance criteria

- **AC1:** Given the app is opened, when the page has loaded, then there is an additional labelled input "Grenzsteuersatz" (percent per year, 2 decimals) with a visible default of 30 %, a hint stating that the rate is entered as one combined rate including Soli and Kirchensteuer and that 0 to 50 % is allowed, and a result including the tax refund for the defaults is already shown; the six inputs and defaults of 013/AC1 are unchanged. (changes 013/AC1)
- **AC2:** Given the reference example (age 57, payout start 65, 150 EUR per month, 0 children, 5 % return, 0,5 % costs) and a tax rate of 42 %, when the result is shown, then it displays a tax refund of 442,80 EUR per saving year and 3.542,40 EUR in total and net own contributions of 10.857,60 EUR (14.400,00 − 3.542,40; labelled as own contributions after the refund), each as a figure separate from own contributions, Zulagen, returns and end value and labelled so that the refund is not part of the depot, while own contributions 14.400,00 EUR, Zulagen 4.320,00 EUR, returns 3.536,44 EUR and end value 22.256,44 EUR (013/AC4) are unchanged and the sum of the three depot parts still equals the end value without the refund. (changed by [015](015-avd-reinvest-tax-refund.md): holds while the reinvest checkbox is unchecked)
- **AC3:** Given the reference example, when the tax rate is 0, 23,00, 23,10, 42 and 50 %, then the refund per year is 0,00 (no negative refund), 0,00 (2.340 · 0,23 = 538,20 is below the Zulage 540), 0,54, 442,80 and 630,00 EUR respectively; a higher rate never lowers the refund (all else equal).
- **AC4:** Given a tax rate of 42 % and age 40, when the monthly contribution is 0, 9,99, 10, 25 and 570 EUR with 0 children, then the refund per year is 0,00, 0,00, 15,60, 39,00 and 442,80 EUR (below c = 120 no Zulage and no refund; Zulage 60 and base 180 at 10 EUR; Zulage 150 and base 450 at 25 EUR; contributions above 1.800 EUR per year are not deductible, so 570 EUR gives the same refund as 150 EUR); with 2 children and 150 EUR per month the refund is 94,80 EUR per year (Z = 540 + 600 = 1.140, base 2.940), and with age 24 instead of 40 the refund of saving year 1 is 326,80 EUR, years 2 and later 442,80 EUR (the bonus of 200 EUR counts as Zulage of year 1; 0 children, 150 EUR, 42 %).
- **AC5:** Given a result is shown, when the user changes any input to another valid value, then the refund figures, the net own contributions and a new column "Steuererstattung" in the per-year table (one amount per saving year, 0,00 where there is none) update without a separate submit, and changing only the tax rate changes no depot figure, table depot column or chart bar. The tax refund is not drawn in the chart. (changes 013/AC5) (changed by [015](015-avd-reinvest-tax-refund.md))
- **AC6:** Given any input, when the tax rate is invalid (empty, not a number, negative, more than 2 decimals, outside 0,00 to 50,00 %), then that field shows an error naming the field and the allowed range, is marked invalid for assistive technology, the result is replaced by the no-result hint of 013/AC6, and no NaN, Infinity or negative refund appears anywhere; the validation of the other six fields (013/AC6) is unchanged. (changes 013/AC6)
- **AC7:** Given the app is used with keyboard only, when the user tabs through the page, then the tax-rate input is reachable in the form order after the costs field, has a programmatic label, its hint and error are associated with it, and after an edit the polite live region announces both the end value and the total tax refund (still debounced as in 013). (changes 013/AC7)
- **AC8:** Given a result is shown, when it is displayed, then the note next to it additionally states that the tax refund is a simplified model calculation with one constant marginal tax rate, that the refund is paid to the taxpayer by the Finanzamt and not credited to the depot, and that it is no tax advice; the statements of 013/AC8 (model calculation, no investment advice, eligibility assumed, no recommendations) remain. (changes 013/AC8) (changed by [015](015-avd-reinvest-tax-refund.md))

## Out of scope

- Optional reinvestment of the refund into the depot (checkbox): story [015](015-avd-reinvest-tax-refund.md). Reinvestment into a side depot (outside the Altersvorsorgedepot).
- Exact tax calculation from taxable income and tariff, Solidaritätszuschlag and Kirchensteuer as separate inputs, married couples and joint assessment, a rate that changes over the years.
- Payout taxation (§ 22 Nr. 5 EStG), comparison with a normal ETF depot, glidepath, inflation, other deductions (Basisrente, Riester, etc.).
- A combined indicator (Förderquote).
- Showing the refund in the chart.

## Open questions

None. All earlier questions are settled (see Context and Decision log 2026-11-07).

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-07 — Story created as draft from hak's request (verbatim above) and the orchestrator's research; no answers from hak yet. All proposed defaults in the Open questions are unconfirmed. Number 014 checked as next free (index and all backlogs end at 013).
- 2026-11-07 — Q2 (use of the refund) — hak: "wieder anlage optional (check box) dann wird es ganz normal ins Portfolio eingezahlt (zum 1.1. des Jahres) . Andernfalls von den Einzahlungen abziehen"
- 2026-11-07 — The orchestrator's reading was written into the story and further open questions (2a to 2f, 9 split) were added, all with unconfirmed defaults. hak did not mention Questions 1, 3 to 8 at that point.
- 2026-11-07 — Q1 (marginal rate input), Q2 and 2a to 2f (refund use, reinvestment details), Q3 (combined rate, 0 to 50 %), Q4 (Kinderzulage and bonus count), Q5 (120 EUR minimum blocks the benefit), Q6 (default 30 %), Q7 (no Förderquote), Q8 (timing), Q9 (split) — hak: "Ja, alle passen". The orchestrator's reinvested reference numbers (own 14.400,00, Zulagen 4.320,00, reinvested 3.099,60, returns 4.143,81, end value 25.963,41 EUR at 42 %) were confirmed with it.
- 2026-11-07 — Split: AC9 (checkbox) and AC10 (reinvested reference) moved to story 015; 014 keeps AC1 to AC8 (refund always paid to the saver, net own contributions). All open questions settled, status set to ready.

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
