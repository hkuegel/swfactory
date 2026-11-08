---
id: 016
title: Altersvorsorgedepot comparison with a normal ETF depot
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: avd # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: feature/016-avd-etf-comparison
supersedes: []
changes: [013/AC1, 013/AC6, 013/AC7, 013/AC8]
superseded-by:
---

# 016 – Altersvorsorgedepot comparison with a normal ETF depot

## Original request

> Ausserdem : Bitte noch einen Vergleich mit der normalen Anlage (ohne Zuschuss, mit normaler Kapitalertragssteuer, und dann vergleichen mit dem AVD das nach persönlichen Steuersatz versteuert wird.)

> 1. gleiche Monatsrate
> 2. ja
> 3. ja, überlege dir das. ich denke wir sollten davon ausgehen, dass wir beide Depots bis 85 komplett auszahlen, und vergleichen dann den Ertrag nach Steuer
> 4. ich würde von gleichen Kosten ausgehen, das ist möglich

> /story ETF-Vergleich, Variante A

Notes: the first quote is the comparison part of hak's message of 2026-11-08 (the same message also asked for a chart change; that is a separate story). The second quote is hak's answers of 2026-11-08 to the orchestrator's open points; the questions were: (1) same monthly rate in both depots or same net cost? (2) a separate input "tax rate in retirement"? (3) how to compare, given the Altersvorsorgedepot (AVD) can't be paid out at once? (4) a separate cost field for the ETF depot? The third quote is the slash command; "Variante A" is the orchestrator's name for: the part of the AVD that was paid in without subsidy is taxed only on its gain (see Context).

## User story

As a person planning my retirement, I want to compare the Altersvorsorgedepot (with Zulagen and tax refund, payouts taxed at my personal tax rate in retirement) with a normal ETF depot (same monthly rate, no subsidy, normal capital gains tax), both paid out completely by age 85, so that I can see which of the two leaves me more money after tax and by how much.

## Context

- Builds on [013](013-avd-saving-phase-zulagen.md) (saving phase, Zulagen), [014](014-avd-tax-refund.md) (marginal tax rate, yearly refund) and [015](015-avd-reinvest-tax-refund.md) (optional reinvestment of the refund), all done. The depot figures, table and chart of 013 to 015 are **unchanged**; 016 adds one input, the payout phase of both depots and a comparison of their results. Terms of [ADR 0007](../adr/0007-avd-projection-model-and-svg-chart.md) and [ADR 0008](../adr/0008-avd-yearly-contribution-schedule-with-reinvested-refund.md) apply: results are nominal, money is in cents, results are model values, not depot statements.
- Decisions of hak (see Decision log): same monthly rate in both depots; a new input "Steuersatz im Ruhestand"; both depots are paid out completely by age 85 and compared by the yield after tax; same return and same costs for both depots; Variante A for the unsubsidised part.
- **Model, saving phase:** as today (same monthly rate, return, costs, payout start 65 to 70). The ETF depot gets no Zulage and no tax refund.
- **Model, payout phase (both depots):** from payout start until age 85 (a payout start of 65 gives 240 monthly payouts, 70 gives 180), equal monthly payouts that empty the depot exactly at 85; the remaining balance keeps earning the same net return as in the saving phase. Reason for age 85: the AVD may be paid out by a payout plan that ends at 85 at the earliest (AltZertG § 1 Abs. 1 S. 1 Nr. 2 and 4, as amended; law text). A payout plan with at least 80 % of the remaining capital per remaining months, recalculated every 3 years, is not modelled.
- **Result per depot, "Ertrag nach Steuer"** = sum of the net payouts (after tax) minus the saver's own contributions, plus tax refunds that stay with the saver. Shown per depot: depot value at payout start, taxes paid on the payouts (and, for the ETF, during the saving phase), net payouts in total, own contributions, yield after tax, monthly net payout; and the difference AVD minus ETF. Refunds that stay with the saver (all refunds while the reinvest checkbox of 015 is off, only the last year's refund while it is on) count nominally, without returns, to the AVD's yield, because otherwise the AVD side would be disadvantaged; reinvested refunds are already inside the depot. Zulagen are not own contributions. The ETF side has no refund. A yield may be negative.
- **AVD tax rules** (inferred, not yet clarified by the BMF):
  - Payouts from subsidised capital are taxed fully at the saver's personal rate (§ 22 Nr. 5 Satz 1 EStG; law text). Subsidised = own contributions up to 1.800 EUR per year plus Zulagen; a reinvested refund counts as an own contribution of its year (ADR 0008), so only the part up to the 1.800 EUR is subsidised.
  - Own contributions above 1.800 EUR per year are the unsubsidised part. Their payouts are taxed only on the gain (§ 22 Nr. 5 Satz 2 Buchst. c EStG: "Unterschiedsbetrag zwischen der Leistung und der Summe der auf sie entrichteten Beiträge"; inferred from the text; secondary sources that claim a half gain contradict the text). This is **Variante A**. The app shows a visible note "Annahme, noch nicht durch BMF geklärt". How contributions are netted against the payouts over the payout plan is not settled by the text; the architect proposes a rule and records it.
  - The 30 % lump sum at payout start (AltZertG) is not modelled; no Fünftelregelung is assumed (inferred).
  - Whether health and care insurance contributions are due on AVD payouts is not verified (likely none for compulsorily insured pensioners as with Riester, due for voluntarily insured persons; secondary sources only): not modelled, prüfungsbedürftig.
- **ETF tax rules:** Abgeltungsteuer 25 % plus Solidaritätszuschlag 5,5 % = 26,375 %, no church tax (§ 32d EStG, SolZG; law text); Teilfreistellung 30 % for equity funds (§ 20 Abs. 1 InvStG; law text; applies to gains and Vorabpauschale); Sparer-Pauschbetrag 1.000 EUR per year for a single person (§ 20 Abs. 9 EStG; law text; while the checkbox "Sparerpauschbetrag (1.000 €/Jahr) für dieses Depot nutzen" is checked (default), the whole amount is available to this depot every year, also in the saving phase; unchecked, no Pauschbetrag, e.g. because it is used by other capital income; AC12); Vorabpauschale every year (§ 18 InvStG: value at the start of the year times Basiszins times 0,7, at most the year's increase, reduced by 1/12 per full month before purchase in the year of purchase; law text) with the Basiszins 2026 of 3,20 % as one fixed assumption for all years (secondary source); at a sale the gain is reduced by all Vorabpauschalen already taxed (§ 19 Abs. 1 S. 3 InvStG; law text); partial sales first in, first out (§ 20 Abs. 4 S. 7 EStG; law text). Whether the Vorabpauschale tax is taken from the depot or paid from outside is for the architect, but it must be consistent with "Ertrag nach Steuer": every tax paid counts against the ETF's yield. The Sparer-Pauschbetrag never applies to the AVD: its payouts are other income under § 22 Nr. 5 EStG, not capital income under § 20 EStG (law text), so the 1.000 EUR is never used for both depots and the AVD figures never depend on the checkbox (Decision log).
- Sources and research notes (orchestrator, 2026-11-08): `/private/tmp/claude-501/-Users-haraldkuegel-swfactory/b6ad74d5-b7e6-4d4e-b781-9f99c3559d23/scratchpad/avd/compare-research.md`; https://www.gesetze-im-internet.de/estg/__22.html, /estg/__20.html, /invstg_2018/__18.html, __19.html, __20.html; BT-Drs. 21/4996 https://dserver.bundestag.de/btd/21/049/2104996.pdf; BMF FAQ on the reform of the private pension (snippet only). The Basiszins and the health-insurance statement are from secondary sources.
- The retirement tax rate is entered as one combined rate including Soli and Kirchensteuer, like the marginal rate of 014; its allowed range is 0,00 to 50,00 % (same as 014/AC1; default 20 % (lower than the 30 % default of 014, because retirement income is usually lower than working income; it is also the value of the oracle cases), see Decision log).
- **Hand-derived oracle (all AC numbers below)**: return 0 % and costs 0 % make the net return exactly 0, so no growth, no ETF tax and simple divisions. Reference case R0: age 57, payout start 65 (8 saving years, 240 payouts), 150 EUR per month (c = 1.800 EUR), 0 children, return 0 %, costs 0 %, marginal tax rate 30 %, reinvest checkbox off, retirement tax rate 20 %. AVD: own contributions 14.400,00, Zulagen 8 · 540 = 4.320,00, depot at payout start 18.720,00 (all subsidised, so fully taxed), tax 20 % = 3.744,00, net payouts 14.976,00 (62,40 per month), refunds 8 · 162,00 = 1.296,00 (014: (1.800 + 540) · 0,30 − 540 = 162,00 per year), yield after tax = 14.976,00 − 14.400,00 + 1.296,00 = **1.872,00**. ETF: depot 14.400,00 (no growth), tax 0,00, net payouts 14.400,00 (60,00 per month), yield **0,00**. Difference **1.872,00** in favour of the AVD. Oracles for non-zero returns are not hand-derivable safely and are left to the architect and tester (Open questions, handed to the architect). The R0 oracles hold in both states of the Pauschbetrag checkbox, because R0 has no gain.

## Acceptance criteria

- **AC1:** Given the app is opened, when the page has loaded, then there is a labelled input "Steuersatz im Ruhestand" (percent, 2 decimals) with a visible default of 20 % (Decision log), a checkbox "Sparerpauschbetrag (1.000 €/Jahr) für dieses Depot nutzen" that is checked (AC12), a hint stating that it is entered as one combined rate including Soli and Kirchensteuer and that 0 to 50 % is allowed, and a comparison of the Altersvorsorgedepot and the ETF depot for the defaults is already shown next to the existing result; the inputs and defaults of 013/AC1, 014/AC1 and 015/AC1 are unchanged, and for the same inputs every depot figure, the refund figures, the per-year table and the chart of 013 to 015 are identical to before. (changes 013/AC1)
- **AC2:** Given R0 (age 57, payout start 65, 150 EUR per month, 0 children, return 0 %, costs 0 %, marginal rate 30 %, checkbox off, retirement rate 20 %), when the comparison is shown, then it states the payout period from 65 to 85 (240 monthly payouts) and shows for the AVD: depot at payout start 18.720,00 EUR, taxes 3.744,00 EUR, net payouts in total 14.976,00 EUR, own contributions 14.400,00 EUR, monthly net payout 62,40 EUR, yield after tax 1.872,00 EUR; for the ETF depot: depot at payout start 14.400,00 EUR, taxes 0,00 EUR, net payouts in total 14.400,00 EUR, own contributions 14.400,00 EUR, monthly net payout 60,00 EUR, yield after tax 0,00 EUR; and a difference "AVD minus ETF" of 1.872,00 EUR that also says in words which depot is ahead.
- **AC3:** Given R0, when the retirement tax rate is 0, 20 and 50 %, then the AVD yield after tax is 5.616,00, 1.872,00 and −3.744,00 EUR and the difference is 5.616,00, 1.872,00 and −3.744,00 EUR (negative values with a minus sign, the wording of the difference changes to the ETF being ahead), while every ETF figure stays identical in the three cases and the depot figures, table and chart of 013 to 015 do not change; a higher retirement rate never raises the AVD yield (all else equal).
- **AC4:** Given R0 with 570 EUR per month (c = 6.840 EUR, 54.720,00 EUR own contributions), when the comparison is shown, then the AVD depot at payout start is 59.040,00 EUR, taxes are 3.744,00 EUR (only the subsidised 14.400,00 + 4.320,00 = 18.720,00 EUR is taxed fully; the unsubsidised 40.320,00 EUR has no gain and no tax: Variante A), net payouts are 55.296,00 EUR, the AVD yield after tax is 1.872,00 EUR and the ETF depot is 54.720,00 EUR with yield 0,00 EUR; and a note next to the AVD figures says that the unsubsidised part is taxed on its gain only, with the words "Annahme, noch nicht durch BMF geklärt".
- **AC5:** Given R0 and the reinvest checkbox of 015 is checked, when the comparison is shown, then the AVD depot at payout start is 19.854,00 EUR (14.400,00 + 4.320,00 + 7 · 162,00 reinvested), taxes 3.744,00 EUR (the reinvested 1.134,00 EUR is unsubsidised and has no gain), net payouts 16.110,00 EUR, own contributions 14.400,00 EUR, yield after tax 1.872,00 EUR (the last year's refund of 162,00 EUR stays with the saver and counts), and the ETF figures equal those of AC2; with the checkbox unchecked again the figures of AC2 return.
- **AC6:** Given age 69, payout start 70 (one saving year, so first and last year are the same), 150 EUR per month, 0 children, return 0 %, costs 0 %, marginal rate 30 %, retirement rate 20 %, when the comparison is shown with the checkbox unchecked and with it checked, then in both states it states the payout period 70 to 85 (180 payouts) and shows for the AVD: depot at payout start 2.340,00 EUR, taxes 468,00 EUR, net payouts in total 1.872,00 EUR, monthly net payout 10,40 EUR, yield after tax 234,00 EUR (own contributions 1.800,00 EUR, refund 162,00 EUR stays with the saver in both states), for the ETF: depot 1.800,00 EUR, taxes 0,00 EUR, monthly net payout 10,00 EUR, yield 0,00 EUR, and the difference 234,00 EUR.
- **AC7:** Given the reference example of 013 (age 57, payout start 65, 150 EUR per month, 0 children, return 5 %, costs 0,5 %) with retirement rate 0 %, when the comparison is shown, then the AVD net payouts in total exceed the AVD depot at payout start of 22.256,44 EUR and the ETF net payouts plus ETF taxes exceed the ETF depot at payout start (the remaining balance keeps earning the net return during the payout phase); and given the same inputs with return −10 %, then ETF taxes are 0,00 EUR (no tax on losses, no loss carried forward), the ETF yield after tax is negative, every figure is finite, no depot value or net payout is negative, and no NaN or Infinity appears anywhere; with return 0 % and costs 0 % (AC2) no figure is NaN either.
- **AC8:** Given age 40, payout start 65, 570 EUR per month, return 5 %, costs 0,5 %, when the comparison is shown, then the ETF taxes are greater than 0,00 EUR, the ETF figures do not change when only the retirement tax rate is changed (the ETF is taxed with the normal capital gains tax, not with the personal rate), and the AVD figures do change when the retirement tax rate changes from 0 to 50 %.
- **AC9:** Given any input, when the retirement tax rate is invalid (empty, not a number, negative, more than 2 decimals, outside 0,00 to 50,00 %), then that field shows an error naming the field and the allowed range, is marked invalid for assistive technology, the result including the comparison is replaced by the no-result hint of 013/AC6, and no NaN, Infinity or negative depot value appears anywhere; the validation of the other fields (013/AC6, 014/AC6) is unchanged, and when any other input is invalid the comparison is replaced by the same hint. (changes 013/AC6)
- **AC10:** Given the app is used with keyboard only, when the user tabs through the page, then the retirement-tax-rate input and the Pauschbetrag checkbox are reachable and have a programmatic label, the input's hint and error are associated with it, the checkbox is operable by keyboard, and after an edit the polite live region of 013/AC7 and 014/AC7 also announces the difference between the two depots (still debounced as there). (changes 013/AC7)
- **AC11:** Given a comparison is shown, when it is displayed, then a note next to it states, in addition to 013/AC8 (model calculation, no investment or tax advice, no recommendations), that both depots get the same monthly rate, return and costs; that both are paid out in equal monthly payouts until age 85 and the comparison is the yield after tax; that the ETF depot has no Zulage and no refund, is taxed with 26,375 % (25 % Abgeltungsteuer plus 5,5 % Soli, no church tax), 30 % Teilfreistellung, 1.000 EUR Sparer-Pauschbetrag per year (only while the Pauschbetrag checkbox is checked; the note says which state applies) and Vorabpauschale with a Basiszins of 3,20 %; that the AVD payouts are taxed at the entered retirement rate and the unsubsidised part only on its gain ("Annahme, noch nicht durch BMF geklärt"); that refunds that stay with the saver count nominally to the AVD; and that inflation, church tax for the ETF, joint assessment, the 30 % lump sum, a life-long pension, the Günstigerprüfung of the capital gains tax and health and care insurance contributions on AVD payouts are not modelled. (changes 013/AC8)
- **AC12:** Given age 40, payout start 65, 570 EUR per month, return 5 %, costs 0,5 % (the AC8 setup, where the ETF has taxable gains) and the checkbox "Sparerpauschbetrag (1.000 €/Jahr) für dieses Depot nutzen" is checked, when the user unchecks it, then the ETF taxes are strictly higher and the ETF yield after tax strictly lower than with it checked, the AVD figures and the AVD depot value at payout start are identical in both states (whether the ETF depot value at payout start may change depends on where the Vorabpauschale tax is paid from, see Open questions), the comparison updates without a submit and the note states the applicable state; checking it again restores the earlier figures; and at R0 (no gain) toggling it changes no figure.

## Out of scope

- Inflation, church tax, joint assessment (2.000 EUR Sparer-Pauschbetrag), a partial Pauschbetrag (only all or nothing), the 30 % lump sum at payout start, a life-long pension (Leibrente), the Günstigerprüfung of § 32d Abs. 6 EStG (personal rate below 25 %), health and care insurance contributions on AVD payouts, the 80 % rule and the 3-year recalculation of the AVD payout plan, a payout end other than 85, different returns or costs per depot, a different monthly rate per depot, changing the Basiszins.
- A per-year payout table and a chart of the comparison (decided: summary only, see Decision log). The chart change hak asked for in the same message (no striped bars) is a separate story.
- Product or provider recommendations of any kind.

## Open questions

None for hak. Handed to the architect (not questions for hak):

- Oracles for non-zero returns (ETF tax with Pauschbetrag, Vorabpauschale, Teilfreistellung, FIFO; AVD with a gain in the unsubsidised part) need hand or independent calculation; the PO has not derived them.
- The netting rule for the unsubsidised AVD part (Variante A): the law text does not settle how contributions are netted against the payouts over the plan; the architect proposes a rule and records it. The health-insurance question stays a stated assumption (prüfungsbedürftig).
- Whether the Vorabpauschale tax is taken from the depot or paid from outside (must be consistent with the yield, see Context).

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-08 — Q1 (same monthly rate or same net cost?) — A: "gleiche Monatsrate" (hak). Same monthly rate in both depots.
- 2026-11-08 — Q2 (separate input "tax rate in retirement"?) — A: "ja" (hak). New input "Steuersatz im Ruhestand".
- 2026-11-08 — Q3 (how to compare, given the AVD can't be paid out at once?) — A: "ja, überlege dir das. ich denke wir sollten davon ausgehen, dass wir beide Depots bis 85 komplett auszahlen, und vergleichen dann den Ertrag nach Steuer" (hak). Both depots paid out completely by age 85; compare the yield after tax.
- 2026-11-08 — Q4 (separate cost field for the ETF depot?) — A: "ich würde von gleichen Kosten ausgehen, das ist möglich" (hak). Same return and same costs for both depots, no separate field.
- 2026-11-08 — Variante A for the unsubsidised AVD part (taxed on its gain only, with a visible note that this is an assumption) — A: "/story ETF-Vergleich, Variante A" (hak).
- 2026-11-08 — Orchestrator scope proposal (the model in Context and the simplifications under Out of scope) accepted by hak via the command above.
- 2026-11-08 — Orchestrator: the chart change from the same message (no striped bars) is a separate story.
- 2026-11-08 — Story created as draft by the product-owner; Open questions 1 to 7 carried unconfirmed proposals.
- 2026-11-08 — Gate 1, all answers: "5. den optional (checkbox) mit reinnehmen. sonst passt alles. auch die annahmen" (hak). Reading, per question below.
- 2026-11-08 — Open Q1 (default and range of "Steuersatz im Ruhestand") — decided as proposed: default 20 %, range 0,00 to 50,00 % combined rate incl. Soli and Kirchensteuer ("sonst passt alles", hak).
- 2026-11-08 — Open Q2 (presentation) — decided as proposed: summary only (one block per depot plus the difference), no per-payout-year table, no chart ("sonst passt alles", hak).
- 2026-11-08 — Open Q3 (church tax: included in the retirement rate, none for the ETF) — accepted as stated assumption ("sonst passt alles", hak).
- 2026-11-08 — Open Q4 (refunds that stay with the saver count nominally to the AVD yield) — accepted as proposed ("sonst passt alles", hak).
- 2026-11-08 — Open Q5 (Sparer-Pauschbetrag) — changed by hak: "den optional (checkbox) mit reinnehmen". A checkbox "Sparerpauschbetrag (1.000 €/Jahr) für dieses Depot nutzen": checked = the full 1.000 € per year is available to the ETF depot (saving and payout phase), unchecked = no Pauschbetrag. Default checked is the PO's proposal (the comparison hak has already seen), accepted under "sonst passt alles"; added as AC12 and to AC1, AC10, AC11.
- 2026-11-08 — Open Q6 (oracles for non-zero returns) and Q7 (netting rule, health insurance) — hak accepted the proposals ("sonst passt alles", "auch die annahmen"); handed to the architect, no longer open for hak. All assumptions listed in AC11 accepted ("auch die annahmen").
- 2026-11-08 — Orchestrator: AC12 no longer requires the ETF depot value at payout start to stay identical when the checkbox is toggled, because that holds only if the Vorabpauschale tax is paid from outside the depot, which is open for the architect.
- 2026-11-08 — Clarification by hak at gate 1: "der Freibetrag sollte natürlich sowohl für AVD als normales depot niht genutzt werden. ich denke das hast du auch so gemeint, nur zur Klarstellung". Reading (orchestrator): the Sparer-Pauschbetrag is never counted for the AVD (§ 22 Nr. 5 payouts are not capital income), only for the ETF depot while the checkbox is checked; no AC changes (AC12 already keeps the AVD figures identical in both states). Context states it.
- 2026-11-08 — Status set to ready.

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
