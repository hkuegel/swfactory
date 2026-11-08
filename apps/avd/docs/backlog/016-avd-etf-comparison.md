---
id: 016
title: Altersvorsorgedepot comparison with a normal ETF depot
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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
- **Result per depot, "Ertrag nach Steuer"** = sum of the net payouts (after tax) minus the saver's own contributions, plus tax refunds that stay with the saver. Shown per depot: depot value at payout start, taxes paid on the payouts (and, for the ETF, during the saving phase), net payouts in total, own contributions, yield after tax, monthly net payout; and the difference AVD minus ETF. Refunds that stay with the saver (all refunds while the reinvest checkbox of 015 is off; while it is on, all refunds minus the reinvested ones, i.e. the last year's refund plus any part above the 6.840 EUR cap that ADR 0008 does not reinvest) count nominally, without returns, to the AVD's yield, because otherwise the AVD side would be disadvantaged; reinvested refunds are already inside the depot. Zulagen are not own contributions. The ETF side has no refund. A yield may be negative.
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
- 2026-11-08 — Context corrected after the architect's design: refunds that stay with the saver while the reinvest checkbox is on are all refunds minus the reinvested ones (also the part above the cap), not only the last year's refund. No AC changes (AC5 at 150 EUR is unaffected).

<!-- Sections below are filled in by later roles. Don't delete headings. -->

- 2026-11-08 — Gate 2: hak approved all retro proposals ("Alle, dann committen"). P4 renames the row label "Ausgezahlt nach Steuern" to "Ausgezahlt nach allen Steuern" in both blocks; UX §1/§2 copy and the app README updated to match (orchestrator). Manual checks (real iPhone, VoiceOver, real tax assessment, health insurance on AVD payouts) not answered by hak: recorded as not run, open.

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

Base: the UX designs of [013](013-avd-saving-phase-zulagen.md), [014](014-avd-tax-refund.md) and [015](015-avd-reinvest-tax-refund.md). Everything not named here stays as there (German neutral copy without "Sie", hints always visible, errors as description without `role`, focus never moved by the app, `Eingaben` only as the form name, colours from tokens, 600 px breakpoint, dark mode only in the token files). The chart and the year table are **not touched** (hak's striped-bar request is a separate story). **No new token** is needed: every colour below is an existing platform token (§8).

**Superseded parts of 013 / 014 / 015:**

- 013 §1 / 014 §1 / 015 §1: the form has eight text fields and two checkboxes, not seven and one; row 4 stays (Grenzsteuersatz, reinvest box), a sub-heading and row 5 are added (§1).
- 013 §1: the page gets a third block between `Ergebnis` and the chart: the comparison region (§1).
- 013 §4 / 014 §2 / 015 §2: the live text gets one more sentence at its end (§2); unchecked, checked and invalid strings otherwise unchanged.
- The notes of 013 AC8, 014 AC8 and 015 AC6 stay exactly as they are inside `Ergebnis`; the comparison has its own note (AC11, §2).

### 1. Layout / component tree

```text
SavingCalculator
  section.inputs   <form aria-labelledby=h2 "Eingaben">
    InputForm
      seven Field blocks (unchanged, FIELD_IDS order)
      CheckboxOption "Steuererstattung wieder anlegen"            (015, unchanged)
      h3 "Für den ETF-Vergleich"                                  <- NEW, spans both columns
      Field "Steuersatz im Ruhestand"                             <- NEW (TextField, same markup as the others)
        label, input (type text, inputmode decimal), suffix "%", hint p, error p (only when invalid)
      CheckboxOption "Sparerpauschbetrag (1.000 €/Jahr) für dieses Depot nutzen"   <- NEW, last in DOM
        input checkbox (checked by default) + label, hint p (aria-describedby)
  section.result   h2 "Ergebnis"                                  (unchanged, live region first, mounted empty)
  section.comparison  aria-labelledby=h2                          <- NEW, only while the result is valid
    h2 "Vergleich mit einem ETF-Depot"
    p.payout   "Beide Depots werden mit demselben Monatsbeitrag gefüllt und von 65 bis 85 in 240 monatlichen Auszahlungen ganz aufgebraucht."
    p.lead     (muted) what "Ertrag" means in words (no label repeated)
    div.blocks
      div role=group aria-labelledby=h3   "Altersvorsorgedepot (AVD)"
        h3
        dl: Depotwert bei Auszahlungsbeginn | Steuern gesamt | Ausgezahlt nach allen Steuern |
            Netto-Auszahlung pro Monat (Durchschnitt) | Eigene Beiträge |
            Steuererstattung außerhalb des Depots | Ertrag nach Steuer (emphasised, last)
        p.assumption  "Annahme, noch nicht durch BMF geklärt: …"   (Variante A, AC4)
      div role=group aria-labelledby=h3   "ETF-Depot"
        h3
        dl: Depotwert bei Auszahlungsbeginn | Steuern gesamt | Davon in der Ansparphase (sub-row) |
            Ausgezahlt nach allen Steuern | Netto-Auszahlung pro Monat (Durchschnitt) | Eigene Beiträge |
            Ertrag nach Steuer (emphasised, last)
    div.difference
      dl: Unterschied (AVD minus ETF) | signed amount
      p.verdict  one of three wordings
    p.note  "Hinweis zum Vergleich: …"  (AC11, two variants)
  section.chart    (unchanged)
  section.table    (unchanged)
```

- **Placement of the comparison:** directly after `Ergebnis`, before the chart. It is the answer to hak's question and depends on the same inputs; chart and year table are saving-phase detail and stay below. It has no focusable element, so the Tab order is unchanged: seven fields, reinvest box, retirement field, Pauschbetrag box, table wrapper.
- **Placement of the new controls:** the h3 "Für den ETF-Vergleich" (`--text-base`, 600, `margin: 0`, spans both grid columns, 1 px `--color-border` line above with `padding-top: var(--space-4)`) opens a second group. Row 5: "Steuersatz im Ruhestand" in the left cell, the Pauschbetrag box in the right cell, aligned to the input row exactly as the reinvest box (`padding-top` = label line + gap from 600 px; top alignment is acceptable if it is hard in CSS). Below 600 px: heading, field, box in one column. The pair mirrors row 4 (tax rate + its checkbox), so the form reads "rates, option / rate, option". The heading is a plain `h3` (no `fieldset`: the form already is the named group, and a legend would be read before every control).
- **No row without an AC reason (kept lean):**
  - `Steuererstattung außerhalb des Depots` (AVD only): without it the AVD yield does not add up on screen (R0: 14.976,00 − 14.400,00 = 576,00, but the yield is 1.872,00). It is the architect's `keptRefundsCents`, needed for AC2, AC5, AC6.
  - `Davon in der Ansparphase` (ETF only): the ETF depot value is not reduced by the Vorabpauschale taxes of the saving phase, so `Steuern gesamt` would otherwise look like payout taxes only. It carries AC12 (the Pauschbetrag acts in both phases). Shown always (also `0,00 €`), so both blocks have a stable structure.
  - **Not shown:** gross payouts, unsubsidised contributions (the AVD note names the 1.800 € threshold in words), per-year payouts. Drop either optional row above if hak wants it shorter; no AC depends on them.
- Block look: bordered box like the refund group (`TaxRefundGroup`): 1 px `--color-edge` border, `--color-surface-subtle` background, `--radius-control`, padding `--space-3` `--space-4`, `--space-2` gap; h3 `--text-base`, 600. The two blocks are visually equal (no winner highlighting, no colour coding).
- Rows: label left (`--color-text-muted`, `--text-sm`, may wrap), value right (`--color-text`, tabular numbers, `--text-base`); same flex row as `TaxRefundGroup` at **every** width (label left, value right; not the inline "label then value" of 600 px there, because two columns of 450 px would otherwise get cramped). The sub-row `Davon in der Ansparphase` is indented by `--space-4`, muted value. The `Ertrag nach Steuer` row: top border 1 px `--color-edge` plus `--space-2` padding, label `--color-text` 700, value `--text-lg` 700. The `Netto-Auszahlung pro Monat (Durchschnitt)` row has no extra emphasis.
- Difference box: 2 px `--color-edge` border, `--color-surface`, `--radius-control`, padding `--space-3` `--space-4`; label (`--text-sm`, muted, left), value `--text-h2` 700 (right on phones, left under the label from 600 px as the figure cards); the verdict `p` under it in `--text-lg`, 600, `--color-text`.
- The AVD assumption note: plain `p`, `--text-sm`, `--color-text`, inside the AVD block under the `dl`, with a 1 px `--color-border` line above and `--space-2` padding; no icon (not an error).
- The comparison note: the same look as `.note` of `ResultSummary` (`--color-surface-subtle`, `--text-sm`, `--radius-control`, padding `--space-3`, margin-top `--space-5`).
- Reuse: the row markup and CSS of `TaxRefundGroup.module.css` (rows, border, muted) is the model; the developer may copy the rules into `DepotComparison.module.css` (CSS modules, no sharing across modules) or extract nothing new. `TextField` and `CheckboxOption` come from the architect's design.

### 2. Copy (exact texts)

Form:

| Where                                                     | Text (exact)                                                                                                                                                                                                                                         |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sub-heading (`h3`)                                        | `Für den ETF-Vergleich`                                                                                                                                                                                                                              |
| Field label                                               | `Steuersatz im Ruhestand` (the AC text; one element only)                                                                                                                                                                                            |
| Suffix (aria-hidden)                                      | `%`                                                                                                                                                                                                                                                  |
| Hint (always visible, muted)                              | `Für die Auszahlungen aus dem Altersvorsorgedepot. Ein kombinierter Satz einschließlich Soli und Kirchensteuer, 0 bis 50 %, höchstens 2 Nachkommastellen.`                                                                                           |
| Range in error texts                                      | `0,00 bis 50,00 % (höchstens 2 Nachkommastellen)`                                                                                                                                                                                                    |
| Errors (generated by `errorMessage`, as the other fields) | `Steuersatz im Ruhestand: Wert fehlt. Erlaubt: 0,00 bis 50,00 % (höchstens 2 Nachkommastellen).` / `…: keine gültige Zahl. Erlaubt: …` / `…: Wert außerhalb des erlaubten Bereichs. Erlaubt: …`                                                      |
| Checkbox label (the AC text)                              | `Sparerpauschbetrag (1.000 €/Jahr) für dieses Depot nutzen` (one element only: the `label`)                                                                                                                                                          |
| Checkbox hint (always visible, muted)                     | `Angehakt: Dem ETF-Depot steht jedes Jahr der volle Freibetrag von 1.000 € auf Kapitalerträge zu, auch in der Sparzeit. Nicht angehakt: kein Freibetrag, etwa weil andere Kapitalerträge ihn schon brauchen. Das Altersvorsorgedepot nutzt ihn nie.` |

The default value of the field is `20` (suffix `%`); the box is checked on load. The hint of the field does not contain `Grenzsteuersatz`; the hint of the box does not contain the label or the word `Sparerpauschbetrag` (it says `Freibetrag`); neither contains `Eingaben`, `Ergebnis` or `Steuererstattung`.

Comparison region (valid result only):

| Where                                            | Text (exact)                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Region heading (`h2`)                            | `Vergleich mit einem ETF-Depot` (does not contain "Ergebnis")                                                                                                                                                                                                                                                                                |
| Payout sentence (`p`)                            | `Beide Depots werden mit demselben Monatsbeitrag gefüllt und von {payoutAge} bis 85 in {months} monatlichen Auszahlungen ganz aufgebraucht.` e.g. `… von 65 bis 85 in 240 monatlichen Auszahlungen …`, with 70: `… von 70 bis 85 in 180 …`                                                                                                   |
| Lead-in (`p`, muted)                             | `Verglichen wird, was nach allen Steuern über die eigenen Einzahlungen hinaus ausgezahlt wird. Beim Altersvorsorgedepot zählt die Erstattung des Finanzamts dazu, soweit sie nicht ins Depot floss.`                                                                                                                                         |
| Block headings (`h3`)                            | `Altersvorsorgedepot (AVD)` and `ETF-Depot`                                                                                                                                                                                                                                                                                                  |
| Row labels (`dt`, both blocks unless noted)      | `Depotwert bei Auszahlungsbeginn` / `Steuern gesamt` / `Davon in der Ansparphase` (ETF only, sub-row after `Steuern gesamt`) / `Ausgezahlt nach allen Steuern` / `Netto-Auszahlung pro Monat (Durchschnitt)` / `Eigene Beiträge` / `Steuererstattung außerhalb des Depots` (AVD only, after `Eigene Beiträge`) / `Ertrag nach Steuer` (last) |
| Row values (`dd`)                                | `formatEuro` (e.g. `18.720,00 €`, negative `-3.744,00 €` with a leading minus); no sub-lines                                                                                                                                                                                                                                                 |
| AVD assumption (`p` in the AVD block)            | `Annahme, noch nicht durch BMF geklärt: Was über 1.800 € Beitrag pro Jahr hinaus eingezahlt wurde, wird nur auf seinen Gewinn besteuert, der übrige Teil der Auszahlungen voll mit dem Satz für den Ruhestand.` Always shown (also when nothing exceeds 1.800 €), starts with the AC words                                                   |
| Difference label (`dt`)                          | `Unterschied (AVD minus ETF)`                                                                                                                                                                                                                                                                                                                |
| Difference value (`dd`)                          | signed `formatEuro` of `differenceCents`: `1.872,00 €`, `-3.744,00 €`, `0,00 €`                                                                                                                                                                                                                                                              |
| Verdict (`p`), AVD ahead (`differenceCents > 0`) | `Das Altersvorsorgedepot liegt vorn.`                                                                                                                                                                                                                                                                                                        |
| Verdict, ETF ahead (`< 0`)                       | `Das ETF-Depot liegt vorn.`                                                                                                                                                                                                                                                                                                                  |
| Verdict, equal (`= 0`)                           | `Beide Depots liegen gleichauf.`                                                                                                                                                                                                                                                                                                             |

Comparison note (`p`; one element, one paragraph). Common parts, in this order, with the Pauschbetrag sentence at the marked place:

`Hinweis zum Vergleich: Dies ist eine Modellrechnung, keine Anlage- oder Steuerberatung und keine Empfehlung für ein Produkt. Beide Depots bekommen denselben Monatsbeitrag, dieselbe Rendite und dieselben Kosten und werden bis zum Alter von 85 in gleich hohen Monatsraten ganz ausgezahlt; verglichen wird der Ertrag nach Steuer. Das ETF-Depot erhält keine Zulage und keine Steuererstattung und wird mit 26,375 % besteuert (25 % Abgeltungsteuer plus 5,5 % Soli, ohne Kirchensteuer), mit 30 % Teilfreistellung und der Vorabpauschale bei einem Basiszins von 3,20 %. {PAUSCH} Die Auszahlungen des Altersvorsorgedepots werden mit dem eingegebenen Satz für den Ruhestand besteuert, der nicht geförderte Teil nur auf seinen Gewinn (Annahme, noch nicht durch BMF geklärt). Steuererstattungen, die bei der steuerpflichtigen Person bleiben, zählen nominal zum Ertrag des Altersvorsorgedepots. Nicht berücksichtigt sind Inflation, Kirchensteuer beim ETF-Depot, Zusammenveranlagung, die 30-%-Einmalauszahlung, eine lebenslange Rente, die Günstigerprüfung der Abgeltungsteuer sowie Kranken- und Pflegeversicherungsbeiträge auf Auszahlungen aus dem Altersvorsorgedepot.`

| State         | `{PAUSCH}` (exact)                                                                    |
| ------------- | ------------------------------------------------------------------------------------- |
| Box checked   | `Der Sparer-Pauschbetrag von 1.000 € pro Jahr ist für das ETF-Depot angesetzt.`       |
| Box unchecked | `Der Sparer-Pauschbetrag von 1.000 € pro Jahr ist für das ETF-Depot nicht angesetzt.` |

The note starts with `Hinweis zum Vergleich:`, never with `Hinweis: Die Zahlen sind Modellrechnungen`, and contains neither `Modellrechnungen` (plural; `Modellrechnung` singular is used) nor `Ergebnis` nor `Eingaben`. The checked sentence is not a substring of the unchecked one. The figures 26,375 %, 5,5 %, 30 %, 3,20 % and 1.000 € come from the constants of the logic (the architect decides literal or formatted); 1.800 € from the contribution-limit constant of the Zulage logic.

Live text (the one existing region): the valid string gets this sentence appended after the existing ones (after `Davon wieder angelegt: …` while 015's box is checked):

- AVD ahead: ` Vergleich mit dem ETF-Depot, Ertrag nach Steuer: Das Altersvorsorgedepot liegt um {abs difference} vorn.` e.g. `… Das Altersvorsorgedepot liegt um 14.303,07 € vorn.`
- ETF ahead: ` Vergleich mit dem ETF-Depot, Ertrag nach Steuer: Das ETF-Depot liegt um {abs difference} vorn.`
- Equal: ` Vergleich mit dem ETF-Depot, Ertrag nach Steuer: Beide Depots liegen gleichauf.`

The amount is spoken as an absolute value (no minus sign to be misread); the direction is in the words. Invalid: unchanged (`Kein Ergebnis: {Feldname} ist ungültig.`; `Steuersatz im Ruhestand` is named when it is the first invalid field in form order, last in the form).

**Text collisions checked** (no label or text is a substring of another that a test looks up; the AC strings sit on one element each):

- `Steuersatz im Ruhestand`: the label only (field label and the name inside error and live texts are different strings in other elements; error text starts with it, so tests look up the label by `getByLabel(..., { exact: true })` as for the other fields). The comparison texts say `Satz für den Ruhestand` instead.
- `Sparerpauschbetrag (1.000 €/Jahr) für dieses Depot nutzen`: the label only. The note uses `Sparer-Pauschbetrag` (with hyphen).
- `Annahme, noch nicht durch BMF geklärt` appears **twice by design** (AC4 at the AVD block, AC11 in the note). The AVD note starts with it (`^Annahme`), the comparison note contains it in the middle: tests scope by block (`compareFigure` scope) or by start (`/^Hinweis zum Vergleich:/`, `/^Annahme, noch nicht/`).
- `Eigene Beiträge` is the label in `Ergebnis` and in both blocks (`figure()` is scoped to `Ergebnis`, the architect's design). `Ertrag nach Steuer` is a label in both blocks and a phrase in the note and the live text (exact `dt` lookups in a block are unique).
- `Ausgezahlt nach allen Steuern` is not `Ausgezahlt statt angelegt` (015). `Steuern gesamt` is not a substring of `Steuererstattung gesamt` and vice versa. `Depotwert bei Auszahlungsbeginn` is not `Endwert`.
- `Reinvestierte Steuererstattung` and `Zulage im 1. Jahr` appear nowhere in the comparison. No `table`, `columnheader` or `region` besides the comparison's own region (`Vergleich mit einem ETF-Depot`, no "ergebnis" in it).
- Headings: `ETF-Depot` is also contained in the region heading `Vergleich mit einem ETF-Depot`, so tests look up the block groups with `exact: true` (`getByRole('group', { name: 'ETF-Depot', exact: true })`, `'Altersvorsorgedepot (AVD)'`). The sub-heading `Für den ETF-Vergleich` contains neither.
- `Eingaben` appears in none of the new texts.

### 3. States

| View                            | State                                                                                  | What the user sees / can do                                                                                                                                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field `Steuersatz im Ruhestand` | Default                                                                                | `20`, hint visible, no error.                                                                                                                                                                                                                             |
| Field                           | Invalid (empty, not a number, negative, more than 2 decimals, outside 0,00 to 50,00 %) | 2 px `--color-danger` border, error `p` with icon under the hint (as every field), `aria-invalid="true"`, `aria-describedby` = hint + error. Appears immediately while typing, as for the other fields.                                                   |
| Field                           | Focused                                                                                | the shared 2 px focus outline of the inputs. Never disabled.                                                                                                                                                                                              |
| Checkbox `Sparerpauschbetrag …` | Checked (default) / unchecked                                                          | native box with check glyph, hint always visible. Never disabled, never invalid; keeps its state while a field is invalid and while the result is replaced by the hint.                                                                                   |
| Checkbox                        | Focused                                                                                | 2 px `--color-focus` outline around box and label, offset 2 px (as the reinvest box).                                                                                                                                                                     |
| Whole page                      | Loading                                                                                | None (synchronous). The comparison is there from the first render with the defaults; the live region stays empty until the first edit or toggle.                                                                                                          |
| Comparison                      | Valid, AVD ahead / ETF ahead / equal                                                   | Two blocks, difference with its signed value and one of the three verdicts. No colour coding; the words and the sign carry the direction.                                                                                                                 |
| Comparison                      | Negative yield or difference                                                           | Value with leading `-`; no red; the row keeps its place. (ETF net payouts and depot values are never negative.)                                                                                                                                           |
| Comparison                      | Any field invalid (including the retirement rate)                                      | Region **not rendered** (no heading, no empty box); `Ergebnis` shows the existing danger callout (013). The checkbox and the field stay in the form and operable; on fixing the input the comparison returns. Layout shift below the callout is expected. |
| Comparison                      | Toggle of the box                                                                      | Figures, `Davon in der Ansparphase`, the `{PAUSCH}` sentence update immediately; AVD block unchanged; focus stays on the checkbox.                                                                                                                        |
| Comparison                      | Reinvest box toggled                                                                   | AVD figures change (015/AC5), the ETF block does not; nothing else.                                                                                                                                                                                       |
| Empty                           | None                                                                                   | A valid input always gives a comparison; zero values show `0,00 €`.                                                                                                                                                                                       |
| Error (system)                  | None                                                                                   | No network, no async step.                                                                                                                                                                                                                                |
| Disabled                        | None                                                                                   | Nothing is disabled.                                                                                                                                                                                                                                      |

### 4. Interactions

- Typing in `Steuersatz im Ruhestand`: validation as for the other fields on every keystroke; every valid value updates the comparison at once; the live sentence follows after the debounce of 700 ms (`useSettledValue`, as 013). Any invalid value replaces the whole result and comparison (AC9).
- Space toggles the focused Pauschbetrag box; a click on the box or on the label text toggles it (native `label for`, whole 44 px row). Enter does nothing (no submit). The change sets `edited` like the reinvest box; the recompute is synchronous.
- Focus never moves: after typing or toggling it stays on the control (stable `<input>`, never replaced). Nothing is focus-managed when the comparison appears or disappears.
- Tab order: ... costs, Grenzsteuersatz, reinvest box, **Steuersatz im Ruhestand**, **Pauschbetrag box**, then the table wrapper (while a result exists). The h3, blocks, difference and note are not focusable.
- No tooltip, popover, confirmation or "reset to default" control.

### 5. Chart

Not touched. Neither the legend, the `aria-label`, the series nor the table change (013/AC1 identity; AC1 of 016).

### 6. Accessibility

- Semantics: field = `label for` + `input` (same `TextField` markup, `aria-invalid`, `aria-describedby` hint [+ error], error without `role`); checkbox = native `input type="checkbox"` + `label for`, `aria-describedby` hint, no `aria-checked`, no `role=switch`; both inside the form named `Eingaben`. The h3 `Für den ETF-Vergleich` sits between the reinvest box and the new field (heading order h2, h3 fine).
- Comparison: `section aria-labelledby` (region named `Vergleich mit einem ETF-Depot`, h2). Each block is `role="group"` named by its h3 (`aria-labelledby`), not a landmark, so there are not three regions. Figures are `dl` with `div` row wrappers (dt then dd); the difference is a one-row `dl`; the verdict and notes are plain `p`. No `table`, no `role=status`, no `role=alert`.
- Reading order: h2, payout sentence, lead-in, AVD group (h3, figures, assumption), ETF group, difference with verdict, note.
- Live announcements: **no new region**. The one existing polite region (mounted empty at the first render, filled only after the first edit or toggle, debounced 700 ms) carries the new sentence. The checkbox announces its own state natively; no second announcement for it. A toggle that changes no figure (R0, no gain) leaves the string unchanged, so nothing is announced: intended. The comparison appearing or disappearing is covered by the existing live strings (`Kein Ergebnis: … ist ungültig.` / the valid sentence), no region is mounted with its content.
- Keyboard: every new interactive element is a native control reached by Tab and operable by Space/typing; no trap; Shift+Tab reverses.
- Target size: checkbox row at least 44 px high, whole row clickable, box 24 px (WCAG 2.2 AA 2.5.8, also enhanced).
- Focus visibility: the input uses the shared focus style; the checkbox row `:has(.box:focus-visible)` outline 2 px `--color-focus`, offset 2 px (`CheckboxOption` keeps the 015 rule).
- Colour is never the only cue: direction of the difference = words + minus sign; yield row = bold + top border; sub-row = indentation + label `Davon …`; invalid field = border width + icon + text (013); checkbox = glyph.
- Forced colours: block, difference box, assumption line and yield-row borders explicitly `CanvasText` in a `@media (forced-colors: active)` block (as `TaxRefundGroup`); the sub-heading line is decorative (border may follow the system); the native checkbox is drawn by the browser (`ButtonText`/`Highlight`; `accent-color` ignored); the checkbox outline uses `Highlight` (015 rule). Variant selectors, if any, in `:where()`. The comparison note, like the existing note, relies on its background only for the box edge: it carries no state cue.
- Zoom / reflow: 320 px and 400 %: single column, labels wrap, values wrap only at the thousands separators if they must (`overflow-wrap: anywhere`, no `nowrap`), no sideways page scroll; only the year table scrolls (014).
- Language and tone: German, neutral ("steuerpflichtige Person"), no "Sie", no recommendation wording ("besser", "empfohlen"); the verdict states who is ahead in this model only.

### 7. Responsive behaviour

| Aspect            | 900 px and wider                                                     | 600 to 899 px       | Below 600 px                                                                           |
| ----------------- | -------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------- |
| Form              | two columns: row 5 = field + box (box aligned to the input row)      | same                | one column: h3, field, box                                                             |
| Sub-heading       | spans both columns                                                   | same                | full width                                                                             |
| Comparison blocks | side by side, two equal columns, gap `--space-4`                     | stacked, full width | stacked, padding `--space-3` `--space-3` (16 px panel padding stays)                   |
| Rows              | label left, value right                                              | same                | same; long labels wrap to two or three lines, the value stays on the first line, right |
| Difference box    | full width under both blocks; label left, value right, verdict below | same                | label left (wraps), value right, verdict below, full width                             |
| Note              | full width under the difference                                      | same                | same                                                                                   |

Rationale for 900 px: two blocks of about 450 px fit label and value on one line; at 600 to 899 px two blocks would give about 230 px of text width and three-line labels. Tested widths: 320 px (no sideways page scroll), 375 px (primary), 1280 px; sample long values `-1.234.567,89 €` must not overflow at 320 px.

### 8. Dark mode and tokens

**No new token.** Every element uses an existing platform token, so the token test needs no new pair; the pairs below are already tested by 013 to 015 (or by the platform). Values computed by hand (sRGB linearisation, no shell); the tester re-checks with a tool; none is tight (smallest margin 1.2 above the 3:1 UI minimum).

| Element                                       | Light                                                                                           | Dark                               | Contrast (light / dark)                                                                                  | Rule       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------- |
| Labels, values, verdict, headings, error text | `--color-text` `#1b1f24` on `--color-surface` `#ffffff` / on `--color-surface-subtle` `#eef1f5` | `#e8eaed` on `#1b1f26` / `#252a33` | above 15 / above 13                                                                                      | text 4.5:1 |
| Muted labels, hints, sub-row value, lead-in   | `--color-text-muted` `#4a5360` on surface / on subtle                                           | `#a9b1bd` on surface / on subtle   | about 7.8 / 6.9 and 8.5 / 7.3                                                                            | text 4.5:1 |
| Block, difference, yield-row borders          | `--color-edge` `#737c8b` on surface / on subtle                                                 | `#8b94a3` on surface / on subtle   | about 4.2 / 3.7 and 5.4 / 4.7                                                                            | UI 3:1     |
| Sub-heading line, assumption line             | `--color-border` `#d5d9e0`                                                                      | `#2b313b`                          | decorative, no contrast requirement                                                                      | none       |
| Invalid field: border, icon                   | `--color-danger` `#b3261e`                                                                      | `#f2b8b5`                          | as 013 (about 6.5 / 10)                                                                                  | UI 3:1     |
| Checkbox fill (checked)                       | `accent-color` `--color-focus` `#1d4ed8`                                                        | `#a8c7fa`                          | about 6.7 / 8.9                                                                                          | UI 3:1     |
| Unchecked border                              | drawn by the browser                                                                            | drawn by the browser               | tester verifies on both schemes; if too weak, the developer draws a border in `--color-edge` (as 015 §8) | UI 3:1     |
| Focus outline                                 | `--color-focus` `#1d4ed8`                                                                       | `#a8c7fa`                          | about 6.7 / 8.9                                                                                          | UI 3:1     |
| Live region                                   | visually hidden, no colour                                                                      | same                               | n/a                                                                                                      | none       |

Nothing animates; a `transition` on the field border uses `var(--duration)` as the other inputs; reduced motion needs no extra rule.

### 9. Points for the architect

- **No contradiction** with the Technical design. Used as offered: `keptRefundsCents` (AVD row) and `etf.savingPhaseTaxCents` (ETF sub-row) are shown; `unsubsidisedCents` and the gross payouts are not.
- **Markup the tests can rely on:** block groups `role="group"` named `Altersvorsorgedepot (AVD)` and `ETF-Depot` (look up with `exact: true`, because `Vergleich mit einem ETF-Depot` contains `ETF-Depot`); `compareFigure(page, 'AVD' | 'ETF', label)` = `dt` with exact text inside the group, then its `dd`. The difference `dt` is `Unterschied (AVD minus ETF)` and sits outside both blocks. The comparison region is `getByRole('region', { name: 'Vergleich mit einem ETF-Depot' })`.
- **Minus sign:** `formatEuro` writes a hyphen-minus (`-3.744,00 €`); the story prose uses `−`. Tests should match `-` (or `[-−]`), not copy `−` from the prose.
- **Live sentence:** `formatEuro(Math.abs(differenceCents))` in the sentence; the wording for the three cases is in §2. At the 15 existing end-anchored asserts the sentence is appended, as the design says.
- **Duplicate AC phrase:** `Annahme, noch nicht durch BMF geklärt` is on two elements (AVD assumption and comparison note); see §2 for the scoping.
- **Form:** `InputForm` renders the h3 as a grid item with `grid-column: 1 / -1` between the reinvest box and the new field; the h3 is not inside `TextField` or `CheckboxOption`. The retirement field is last in `FIELD_IDS` and last-but-one in the DOM, so the first invalid field in form order stays the one named in `Kein Ergebnis: … ist ungültig.`
- **Copy constants:** the percentage values and `1.000 €` in the note should be formatted from the logic constants (so a changed constant cannot leave a stale note); `1.800 €` from the contribution-limit constant. If the architect prefers literals, the strings above are the exact oracle.
- **Optional rows:** `Davon in der Ansparphase` and `Steuererstattung außerhalb des Depots` can be dropped by a copy-level edit if the architect or hak finds them superfluous; no AC value depends on them.
- **Markdown:** this story file has wide tables; please run `npx prettier --write` on it (I have no shell).

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

**ADR:** new [ADR 0009](../adr/0009-avd-payout-phase-and-etf-tax-model.md) (payout phase to 85, AVD tax
with Variante A, ETF tax model, where taxes are paid from, rounding). It reads from
[ADR 0007](../adr/0007-avd-projection-model-and-svg-chart.md) and
[ADR 0008](../adr/0008-avd-yearly-contribution-schedule-with-reinvested-refund.md) without changing them. No
new dependency, no platform change, no dev-only code, no new token required by the logic.

### Overview

The saving phase stays exactly as it is: `project()` and `taxRefund()` are not changed (only the net-rate
expression of `project()` is exported). Three new pure modules compute the payout phase on top of their
results: `payout.ts` (annuity math shared by both depots), `etfDepot.ts` (the ETF depot from the same monthly
rate, with monthly lots, Vorabpauschale, FIFO and yearly tax) and `compare.ts` (the AVD side, both results,
the difference). **Taxes never feed back into a depot:** the AVD tax is computed on the payouts, the ETF's
Vorabpauschale tax is paid from outside the depot and the sale tax is withheld from the payout. So every
013–015 figure is unchanged by construction (AC1), the ETF depot is the same in both checkbox states (AC12)
and both payout plans are closed forms of the depot value at payout start. One new text field (retirement
rate, validated like the others) and one new checkbox (Pauschbetrag, a boolean like the reinvest box) feed
`compareDepots()`; a new component shows the result in its own region.

### Decisions on the handed-over questions

- **(a) Vorabpauschale tax is paid from outside the depot** (the Verrechnungskonto, as banks do). It counts as
  a tax of the ETF in the year of inflow. Consistency with the yield: **net payouts = gross payouts − all taxes
  of the depot** (for the ETF: sale taxes plus every Vorabpauschale tax, saving and payout phase); **yield = net
  payouts − own contributions + kept refunds**. That equals the story's "net payouts − own contributions +
  refunds − tax paid from outside", with the outside tax already inside "net". Consequence: the ETF depot value
  at payout start never depends on the checkbox (AC12's open point is closed: it stays identical).
- **(b) Netting rule, Variante A:** the unsubsidised contributions B_U are netted against the payouts in equal
  shares over the whole plan: each of the n payouts is taxed at the retirement rate on max(0, P − B_U / n). With
  equal gross payouts P that gives **AVD tax = round(t · max(0, gross_unrounded − B_U))** and the same net payout
  every month. This equals "subsidised part fully taxed, unsubsidised part on its gain" for any split of the
  depot as long as the unsubsidised part has no loss; with a loss, the loss reduces the taxable subsidised
  payouts (one income type, § 22 Nr. 5 EStG) and a negative total is not taxed. Stated as an assumption in
  ADR 0009 and in the UI note ("Annahme, noch nicht durch BMF geklärt").
- **(c) Reinvested refunds (AC5) — confirmed, with one addition.** c(n) = own + reinvested (ADR 0008); the
  unsubsidised part of year n is u(n) = c(n) − min(c(n), 1.800 EUR), whichever money it came from. At 150 EUR per
  month the reinvested refund lies entirely above 1.800 EUR (AC5: 7 · 162,00 = 1.134,00 unsubsidised); below
  150 EUR it first fills the subsidised 1.800 EUR. **Addition:** a year with c(n) < 120 EUR gets neither Zulage
  nor deduction (013/014), so the whole c(n) is unsubsidised. No AC value changes.
- **Kept refunds, clarification of the Context:** refunds that stay with the saver = Σ R(n) − Σ reinvested(n)
  (`refund.totalCents − projection.total.reinvestedCents`). That is "all refunds" while 015's box is off and
  "the last year's refund" at 150 EUR while it is on, as the Context says, but also includes the part above
  the 6.840 EUR cap that 015 leaves with the saver (e.g. 545 EUR per month). AC5 and AC6 are unaffected.

### Model (ADR 0009; recomputed in the scratchpad with two independent implementations)

Notation: N saving years, n = 12 · (85 − payoutAge) payouts, net rate q = (1 + r)(1 − costs) − 1 as in
`project()`, g = (1 + q)^(1/12), t = retirement rate.

- **Payout plan (both depots):** payouts at the end of each month from the month after payout start; the
  balance keeps earning q. Payout multiple M(q, n) = n · expm1(λ) / −expm1(−n·λ) with λ = log1p(q) / 12;
  **M = 1 when q === 0** (λ = 0 would give 0/0). Gross payouts = `Math.round(depotCents · M)`, from the reported
  (rounded) depot value of each depot. Negative q works unchanged (g < 1, both numerator and denominator
  negative); the plan never has a negative balance before the last payout. `log1p`/`expm1` keep M exact for
  tiny |q| (returns 0,01 % and costs 0,01 % give q = −1e−8; the naive formula loses about 7 digits there).
- **AVD:** depot D = `projection.total.balanceCents`. B_U = Σ u(n) over `projection.schedule` (c < 12.000 cents
  → c; else c − min(c, 180.000)). gross = round(D · M); tax = round(t · max(0, D · M − B_U)) with D · M
  unrounded; net = gross − tax; own = `projection.total.contributionsCents` (reinvested refunds are not own
  contributions, Zulagen neither); kept = `refund.totalCents − projection.total.reinvestedCents`;
  yield = net − own + kept; monthly = round(net / n) (equal every month for the AVD).
- **ETF, saving phase:** one lot per monthly contribution m, bought at the end of month t (t = 1 … 12N) at price
  p(t) = g^t, units m / p(t), cost m. Calendar year = saving year. At the end of each year y, every lot still
  held gets the Vorabpauschale per unit v(y) = max(0, min(p(start) · 0,032 · 0,7, p(end) − p(start))) with
  p(start) = g^(12(y−1)), p(end) = g^(12y); a lot bought in month j of y gets v(y) · (13 − j) / 12. The lot keeps
  its accumulated Vorabpauschale per unit. VAP(y) = Σ units · per-unit amount; it is **income of year y + 1**.
  Depot at payout start E = Σ units · p(12N) (float inside the module), reported as round(E).
- **ETF, payout phase:** gross = round(round(E) · M), as for the AVD. For the tax, payout k (r = n − k + 1
  remaining) sells the fraction φ = expm1(λ) / (expm1(λ) − expm1((1 − r)·λ)) of the remaining units (q === 0: 1 / r;
  r = 1: everything), oldest lot first, at p(12N + k); gain = units · (p − purchase price − accumulated
  Vorabpauschale per unit), negative allowed. At the end of each payout year the units still held get v(y)
  (no 1/12 factor, nothing is bought); the last year ends with no units.
- **ETF, tax per calendar year y = 1 … N + n/12:** income(y) = VAP(y − 1) + Σ gains(y); tax(y) =
  0,26375 · max(0, 0,7 · income(y) − A) with A = 100.000 cents while the Pauschbetrag box is checked, else 0.
  A negative year is lost (no carry-forward, AC7). Tax = round(Σ tax(y)); saving-phase tax = round(Σ_{y ≤ N}
  tax(y)); payout-phase tax = tax − saving-phase tax (derived). net = gross − tax; own = 12 · m · N (same as the
  AVD's); yield = net − own; monthly = round(net / n) (**average**: the ETF net varies per month).
- **Difference** = AVD yield − ETF yield (cents); its sign gives the wording (AVD ahead / ETF ahead / equal).
- **Running totals:** keep the number of remaining units as a running sum (do not re-add all lots per payout)
  and a head index into the lot array for FIFO; at most 624 lots and 240 payouts, well under a millisecond.

Checks in the scratchpad (model A: units and prices with Σ-of-sales; model B: lot values, no prices; model C:
the spec above): A and B agree to 0,003 cents over 8.736 input sets; C's taxes equal A's to 0,001 cents; no
NaN, Infinity or negative amount anywhere (ages 18–69, payout 65–70, monthly 0 … 570, return −10 … 20 %, costs
0 … 1 %, both boxes). Every oracle value below is at least 0,03 cents away from a rounding boundary; the AVD monthly net of AC5 is
exactly 6.712,5 cents and rounds half up (`Math.round`) to 67,13.

### Reference values (oracle for the tester)

Inputs not listed: 0 children, marginal rate 30 %, reinvest off, Pauschbetrag checked, retirement rate 20 %.
"A" = AVD, "E" = ETF. Depot = at payout start; net = net payouts in total; monthly = monthly net payout.

| Case (inputs)                                    | Depot A    | Tax A      | Net A      | Yield A    | Depot E    | Tax E (saving phase)  | Net E      | Yield E    | Difference  |
| ------------------------------------------------ | ---------- | ---------- | ---------- | ---------- | ---------- | --------------------- | ---------- | ---------- | ----------- |
| R0 (AC2)                                         | 18.720,00  | 3.744,00   | 14.976,00  | 1.872,00   | 14.400,00  | 0,00                  | 14.400,00  | 0,00       | 1.872,00    |
| R0, retirement 0 % (AC3)                         | 18.720,00  | 0,00       | 18.720,00  | 5.616,00   | 14.400,00  | 0,00                  | 14.400,00  | 0,00       | 5.616,00    |
| R0, retirement 50 % (AC3)                        | 18.720,00  | 9.360,00   | 9.360,00   | −3.744,00  | 14.400,00  | 0,00                  | 14.400,00  | 0,00       | −3.744,00   |
| R0, 570 EUR (AC4), B_U 40.320,00                 | 59.040,00  | 3.744,00   | 55.296,00  | 1.872,00   | 54.720,00  | 0,00                  | 54.720,00  | 0,00       | 1.872,00    |
| R0, reinvest on (AC5), B_U 1.134,00, kept 162,00 | 19.854,00  | 3.744,00   | 16.110,00  | 1.872,00   | 14.400,00  | 0,00                  | 14.400,00  | 0,00       | 1.872,00    |
| Age 69, payout 70, R0, box off or on (AC6)       | 2.340,00   | 468,00     | 1.872,00   | 234,00     | 1.800,00   | 0,00                  | 1.800,00   | 0,00       | 234,00      |
| Reference 5 % / 0,5 %, retirement 0 % (AC7)      | 22.256,44  | 0,00       | 33.464,75  | 20.360,75  | 17.212,22  | 0,00                  | 25.880,26  | 11.480,26  | 8.880,49    |
| Reference, return −10 %, retirement 0 % (AC7)    | 12.661,61  | 0,00       | 3.437,94   | −9.666,06  | 9.608,12   | 0,00                  | 2.608,84   | −11.791,16 | 2.125,10    |
| Age 40, 570 EUR, 5 % / 0,5 %, retirement 20 %    | 333.868,97 | 75.200,96  | 426.803,86 | 259.853,86 | 309.970,97 | 43.977,43 (6.458,49)  | 422.094,40 | 251.094,40 | 8.759,46    |
| … retirement 0 % (AC8)                           | 333.868,97 | 0,00       | 502.004,82 | 335.054,82 | 309.970,97 | 43.977,43 (6.458,49)  | 422.094,40 | 251.094,40 | 83.960,42   |
| … retirement 50 % (AC8)                          | 333.868,97 | 188.002,41 | 314.002,41 | 147.052,41 | 309.970,97 | 43.977,43 (6.458,49)  | 422.094,40 | 251.094,40 | −104.041,99 |
| … retirement 20 %, Pauschbetrag off (AC12)       | 333.868,97 | 75.200,96  | 426.803,86 | 259.853,86 | 309.970,97 | 54.477,64 (11.683,70) | 411.594,19 | 240.594,19 | 19.259,67   |
| Defaults (AC1: age 40, 150 EUR, 5 %, 0,5 %)      | 105.469,31 | 31.716,70  | 126.866,78 | 85.916,78  | 81.571,31  | 6.036,77 (50,20)      | 116.613,71 | 71.613,71  | 14.303,07   |
| Defaults, Pauschbetrag off                       | 105.469,31 | 31.716,70  | 126.866,78 | 85.916,78  | 81.571,31  | 14.336,22 (3.074,66)  | 108.314,26 | 63.314,26  | 22.602,52   |

More values: own contributions 14.400,00 (R0, reference), 54.720,00 (AC4), 1.800,00 (AC6), 171.000,00 (age 40,
570 EUR), 45.000,00 (defaults). Monthly net A / E: R0 62,40 / 60,00; AC4 230,40 / 228,00; AC5 67,13 / 60,00; AC6
10,40 / 10,00; reference 5 % retirement 0 % 139,44 / 107,83; −10 % 14,32 / 10,87; age 40 570 EUR retirement 20 %
1.778,35 / 1.758,73 (Pauschbetrag off: ETF 1.714,98); defaults 528,61 / 485,89. Gross payouts (net + tax):
reference 5 % A 33.464,75, E 25.880,26; age 40 570 EUR A 502.004,82, E 466.071,83; defaults A 158.583,48, E
122.650,48. B_U of the age-40-570-EUR case: 126.000,00.

- **R0 oracles of AC2–AC6 re-checked:** all match the story (table rows 1–6).
- **AC7:** 33.464,75 > 22.256,44 and 25.880,26 + 0,00 > 17.212,22 (the ETF has no tax here: its yearly gains stay
  under the Pauschbetrag); at −10 % the ETF tax is 0,00 and its yield −11.791,16 (negative, finite).
- **AC8:** ETF tax 43.977,43 > 0 and identical for 0 / 20 / 50 %; AVD yield 335.054,82 / 259.853,86 /
  147.052,41.
- **AC12:** unchecking raises the ETF tax 43.977,43 → 54.477,64 and lowers its yield 251.094,40 → 240.594,19;
  AVD figures and both depot values identical.
- **What the oracle tells apart** (same AC8 case, ETF tax): without the 1/12 rule 43.876,93; Vorabpauschale taxed
  in its own year 43.713,68. Average cost instead of FIFO gives the same value here but differs elsewhere (unit
  test 3b).

### Files

| Path (below `apps/avd/`)                                                       | Change                                                                                                                                                                            |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/saving/logic/fields.ts`                                          | `FieldId` + `'retirementRatePct'` (last in `FIELD_IDS`); spec `{ min: 0, max: 5000, decimals: 2, defaultValue: '20' }`; `DEFAULT_INPUTS` entry                                    |
| `src/features/saving/logic/parseInputs.ts` (+ test)                            | `Inputs.retirementRateBp`; destructure/undefined check for the new field; no new rule (same generic decimal parsing and range check)                                              |
| `src/features/saving/logic/project.ts`                                         | export `netAnnualRate(inputs)` (the existing expression, used by `project()` itself, so the float operations stay identical); nothing else                                        |
| `src/features/saving/logic/payout.ts` (+ test, new)                            | `PAYOUT_END_AGE`, `payoutMonths()`, `payoutMultiple()`, `soldFraction()`: the annuity math of ADR 0009                                                                            |
| `src/features/saving/logic/etfDepot.ts` (+ test, new)                          | the ETF depot: lots, Vorabpauschale, FIFO sales, yearly tax; owns the ETF tax constants                                                                                           |
| `src/features/saving/logic/compare.ts` (+ test, new)                           | `unsubsidisedCents()`, the AVD side, `compareDepots()` assembling both sides and the difference                                                                                   |
| `src/features/saving/fieldCopy.ts`                                             | `FIELD_COPY.retirementRatePct` (label "Steuersatz im Ruhestand", suffix "%", hint and range from UX); `ALLOWANCE_COPY` (checkbox label of the story, hint from UX)                |
| `src/features/saving/TextField.tsx` (new)                                      | the labelled input with suffix, hint and error, moved unchanged out of the `InputForm` map (same markup and classes), so it can render outside the map                            |
| `src/features/saving/ReinvestOption.tsx` → `CheckboxOption.tsx`                | `git mv` (+ css module); props `label`, `hint` instead of the hard-wired `REINVEST_COPY`; used for both checkboxes                                                                |
| `src/features/saving/InputForm.tsx` (+ css)                                    | renders the seven fields, the reinvest box, then the retirement field and the Pauschbetrag box (DOM order, see Risks 4); props `allowance`, `onAllowanceChange`; grouping from UX |
| `src/features/saving/SavingCalculator.tsx`                                     | `const [allowance, setAllowance] = useState(true)`; `comparison = compareDepots(…)` when valid; renders `DepotComparison`; live text gets the difference sentence                 |
| `src/features/saving/DepotComparison.tsx` (+ css, new)                         | own region: payout period, one figure list per depot, Variante-A note at the AVD block, difference with wording, comparison note (AC11); copy and layout from UX                  |
| `src/features/saving/logic/{project,schedule,taxRefund,chartGeometry}.test.ts` | `Inputs` literals get `retirementRateBp: 2000` (typecheck only; no assertion changes)                                                                                             |
| `e2e/avd.helpers.ts`                                                           | `retirementInput`, `allowanceBox`, `comparison(page)`, `compareFigure(page, depot, label)`; `figure()` scoped to the "Ergebnis" region (Risks 4)                                  |
| `e2e/avd-tax-refund.spec.ts`, `e2e/avd-reinvest.spec.ts`                       | the three `$`-anchored live-region asserts lose the end anchor (the live text gains a sentence, Risks 4); nothing else                                                            |
| `e2e/avd-compare.spec.ts` (new)                                                | one test per AC of 016 (rebuild oracle)                                                                                                                                           |

### Key types

```ts
// logic/project.ts
/** (1 + r)(1 − costs) − 1, the expression project() uses (ADR 0007). */
export function netAnnualRate(inputs: Pick<Inputs, 'returnBp' | 'costsBp'>): number;

// logic/parseInputs.ts
export interface Inputs {
  // … the seven 013/014 fields …
  /** Combined retirement tax rate (story 016), 0..5000, 1 % = 100. Read only by compare.ts. */
  readonly retirementRateBp: number;
}

// logic/payout.ts
export const PAYOUT_END_AGE = 85;
/** 12 · (85 − payoutAge): 240 at 65, 180 at 70. */
export function payoutMonths(payoutAge: number): number;
/** Σ of n equal end-of-month payouts that empty a depot of 1 at net rate q; 1 when q === 0. */
export function payoutMultiple(netRate: number, months: number): number;
/** Share of the current depot paid out with this payout when `remaining` payouts are left (1 for the last). */
export function soldFraction(netRate: number, remaining: number): number;

// logic/etfDepot.ts
export const CAPITAL_GAINS_TAX_RATE = 0.26375; // 25 % + 5,5 % Soli
export const PARTIAL_EXEMPTION = 0.3; // Teilfreistellung, equity fund
export const BASE_RATE_BP = 320; // Basiszins 2026, fixed
export const ALLOWANCE_CENTS = 100_000; // Sparer-Pauschbetrag, single
export interface EtfDepot {
  readonly depotCents: number; // round(E)
  readonly grossPayoutsCents: number; // round(depotCents · M)
  readonly taxCents: number; // all years, rounded once
  readonly savingPhaseTaxCents: number; // calendar years 1 … N, rounded once
}
export function etfDepot(inputs: Inputs, useAllowance: boolean): EtfDepot;

// logic/compare.ts
export interface DepotOutcome {
  readonly depotCents: number;
  readonly grossPayoutsCents: number;
  readonly taxCents: number;
  readonly netPayoutsCents: number; // gross − tax
  readonly ownContributionsCents: number;
  readonly keptRefundsCents: number; // ETF: 0
  readonly yieldCents: number; // net − own + kept
  readonly monthlyNetCents: number; // round(net / months), an average
}
export interface Comparison {
  readonly payoutMonths: number;
  readonly avd: DepotOutcome & { readonly unsubsidisedCents: number }; // B_U
  readonly etf: DepotOutcome & { readonly savingPhaseTaxCents: number };
  /** avd.yieldCents − etf.yieldCents. */
  readonly differenceCents: number;
}
export interface CompareOptions {
  /** The Pauschbetrag checkbox; never read for the AVD. */
  readonly useAllowance: boolean;
}
/** Sum of u(n) over the schedule: c < 120 EUR → c, else c − min(c, 1.800 EUR). */
export function unsubsidisedCents(schedule: readonly ScheduleYear[]): number;
export function compareDepots(
  inputs: Inputs,
  projection: Projection,
  refund: TaxRefund,
  options: CompareOptions,
): Comparison;

// components (new or changed props only)
interface InputFormProps {
  /* … */ readonly allowance: boolean;
  readonly onAllowanceChange: (checked: boolean) => void;
}
interface CheckboxOptionProps {
  readonly label: string;
  readonly hint: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}
interface DepotComparisonProps {
  readonly comparison: Comparison;
  readonly payoutAge: number;
  /** The note names the Pauschbetrag state (AC11, AC12). */
  readonly allowance: boolean;
}
```

`compareDepots()` takes the existing `projection` and `refund` instead of recomputing them, so AVD depot, Zulagen
and refunds have one source (as in 015). The AVD fields `unsubsidisedCents` and ETF `savingPhaseTaxCents` are
offered to UX (a "davon nicht gefördert" or "davon in der Ansparphase" line); showing them is optional.

### Data flow and state

- State in `SavingCalculator`: the eight raw texts (the retirement rate is a normal text field), `edited`,
  `reinvest` (015) and the new `allowance` boolean (default `true`, AC12). The checkbox is outside the text-field
  machinery, never disabled, and keeps its state while a field is invalid.
- Derived per render: `parsed` → `projection` → `refund` → `comparison = compareDepots(parsed.inputs, projection,
refund, { useAllowance: allowance })`; all `null` when parsing fails, so the no-result hint of 013/AC6 shows
  and the comparison region is not rendered (AC9). Any invalid field, the retirement rate included, empties the
  whole result, because `parseInputs` fails as a whole.
- The retirement rate is read only by `compare.ts`; the Pauschbetrag flag only by `etfDepot.ts`. Neither reaches
  `project()`/`taxRefund()`, so the 013–015 figures, table and chart can't change (AC1, AC3) and the AVD can't
  depend on the checkbox (AC12, Decision log).
- Toggling the box calls `setAllowance` and `setEdited(true)`; the live text (debounced as today) gets one more
  sentence with the difference and its direction (copy from UX), appended after the existing sentences
  (AC10).
- `firstInvalidField` follows `FIELD_IDS`; the retirement field is last there and last in the DOM, so the
  "Kein Ergebnis: Steuersatz im Ruhestand ist ungültig." text names the first invalid field in visual order.

### Minimal test set

e2e, new file `e2e/avd-compare.spec.ts`, one test per AC; values from the reference table above, only here.
Comparison figures via a helper scoped to the comparison region and the depot block (`compareFigure(page,
'AVD' | 'ETF', label)`), never by position. Raw texts in `[…]` below.

| AC   | e2e test                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1  | retirement field value `20`, description contains Soli, Kirchensteuer and 0 bis 50; Pauschbetrag box checked; comparison region visible at the defaults with AVD yield 85.916,78, ETF yield 71.613,71, difference 14.303,07; snapshot of the "Ergebnis" figures, table text and chart before and after setting the retirement rate to 35 and unchecking the box: equal (chart via `differingPixels` = 0) |
| AC2  | R0: payout period text contains 65, 85 and 240; all six AVD and six ETF figures; difference 1.872,00 and the wording names the AVD as ahead                                                                                                                                                                                                                                                              |
| AC3  | R0 at 0 / 20 / 50 %: AVD yield and difference 5.616,00 / 1.872,00 / −3.744,00 (minus sign), wording at 50 % names the ETF; ETF block text identical in the three cases; "Ergebnis" snapshot identical to the one at 20 %                                                                                                                                                                                 |
| AC4  | R0 with 570 EUR: AVD depot 59.040,00, tax 3.744,00, net 55.296,00, yield 1.872,00; ETF depot 54.720,00, yield 0,00; the AVD block contains "Annahme, noch nicht durch BMF geklärt"                                                                                                                                                                                                                       |
| AC5  | R0, reinvest checked: AVD 19.854,00 / 3.744,00 / 16.110,00 / own 14.400,00 / yield 1.872,00; ETF block text equal to the unchecked one; unchecked again: AC2 figures                                                                                                                                                                                                                                     |
| AC6  | age 69, payout 70, R0, reinvest off then on: period 70 to 85 and 180 in both; AVD 2.340,00 / 468,00 / 1.872,00 / 10,40 / 234,00, ETF 1.800,00 / 0,00 / 10,00 / 0,00, difference 234,00 in both states                                                                                                                                                                                                    |
| AC7  | reference, retirement 0: AVD net 33.464,75 parsed > 22.256,44; ETF net + ETF tax (parsed) > ETF depot 17.212,22; return −10: ETF tax 0,00, ETF yield −11.791,16 (< 0); page text without `NaN`/`Infinity`, no negative depot or net amount in either block; R0: no `NaN`                                                                                                                                 |
| AC8  | age 40, 570 EUR, 5 %, 0,5 %: ETF tax 43.977,43; ETF block text identical at 0 / 20 / 50 %; AVD yield 335.054,82 / 259.853,86 / 147.052,41 (all different)                                                                                                                                                                                                                                                |
| AC9  | retirement `[]`, `[abc]`, `[-1]`, `[20,001]`, `[50,01]`: error text names "Steuersatz im Ruhestand" and the range, `aria-invalid`, no-result hint, comparison region count 0, page without `NaN`/`Infinity`; then a valid rate and an invalid age: comparison region count 0; fixing restores it                                                                                                         |
| AC10 | under `page.clock`: from the reinvest box, Tab until the retirement field has focus (no counted Tabs), accessible name and description (hint; error after `[51]`); Tab until the Pauschbetrag box has focus, Space toggles it; after 800 ms the live region contains the difference sentence; not before 700 ms                                                                                          |
| AC11 | the comparison note contains: same monthly rate, return and costs; until 85 and Ertrag nach Steuer; no Zulage and no refund for the ETF; 26,375 %; 30 % Teilfreistellung; 1.000 €; 3,20 %; "Annahme, noch nicht durch BMF geklärt"; nominal refunds; each "not modelled" item; the Pauschbetrag state (checked wording; unchecked wording after toggling)                                                |
| AC12 | AC8 setup: ETF tax 43.977,43, yield 251.094,40 → uncheck → 54.477,64, 240.594,19 (strictly higher / lower); AVD block text and both depot values identical; note names the unchecked state; check again → earlier figures; R0: comparison text identical in both states                                                                                                                                  |

The 013–015 specs run unchanged apart from the helper and live-region edits listed under Files, and stay the
oracle for "unchanged" (AC1).

Unit (branching logic only, inputs other than the AC values; values from the scratchpad models):

1. `payout.test.ts`: (a) `payoutMultiple(0, 240)` is exactly 1; (b) for q in {−0,109; −1e−8; 0,045; 0,194} and
   n in {180, 240}: a plain recursion B ← B · g − D · M / n from D = 1e8 stays ≥ −1e−6 and ends within 1e−6 · D
   of 0, M is finite and > 0; (c) `soldFraction(q, 1)` = 1 and applying `soldFraction` for r = n … 1 to a depot
   reproduces D · M within 1e−6 · D.
2. `etfDepot.test.ts`: (a) **closed form, Pauschbetrag off:** for ages 18/40/69 → 65/70, 10/150/570 EUR, returns
   3/5/20 %, costs 0/1 %, |tax − 0,184625 · (gross − own)| < 1 cent (holds when every year's income is ≥ 0; it
   proves the gain is reduced by the Vorabpauschalen, i.e. no double taxation, and the 0,7 · 26,375 % rate);
   (b) **FIFO:** age 30 → 65, 50 EUR, 5 %, 1 %, box checked: tax 774,87 EUR (average cost would give 521,75);
   (c) **N = 1** (age 69 → 70, 150 EUR, 5 %, 0,5 %, box off): depot 1.836,63, gross 2.509,76, tax 131,04 and
   saving-phase tax 0,00 (the Vorabpauschale of the only saving year is income of the first payout year; taxed in
   its own year it would be 3,96); box on: tax 0,00; (d) sweep (ages 18/57/69, payout 65/70, monthly 0/9,99/570,
   returns −10/0/0,01/5/20 %, costs 0/1 %, both box states): every value a finite safe integer, tax ≥ 0, gross ≥
   tax, checked tax ≤ unchecked tax, return ≤ 0 → tax 0.
3. `compare.test.ts`: (a) `unsubsidisedCents` on hand-made schedule rows with c = 11.988 / 12.000 / 180.000 /
   196.200 / 684.000 cents → 11.988 / 0 / 0 / 16.200 / 504.000; (b) **gain on the unsubsidised part:** age 69 →
   70, 570 EUR, 5 %, 0,5 %, retirement 20 %: depot 7.519,18, gross 10.274,97, B_U 5.040,00, tax 1.046,99;
   (c) **floor:** age 57 → 65, 570 EUR, return −10 %, costs 1 %, retirement 25 %: gross 9.868,71 < B_U
   40.320,00 → tax 0,00 and net = gross; (d) **kept refunds above the cap:** age 57 → 65, 545 EUR, 0 children,
   marginal 42 %, reinvest on, 5 %, 0,5 %: kept 1.442,40 (= 3.542,40 − 7 · 300,00, more than the last year's
   442,80), B_U 40.020,00, AVD yield 41.440,31.
4. `parseInputs.test.ts`: the defaults test gains `retirementRateBp: 2000`. No further cases: the field uses the
   generic rules already tested; AC9 shows it in e2e.

No component tests (e2e shows every rendered figure). `project`, `schedule`, `taxRefund`, `chartGeometry` and
`zulage` tests stay unchanged apart from the `Inputs` literals.

### Implementation plan

1. `fields.ts`, `parseInputs.ts` (+ test literal), `Inputs` literals in the four test files, `fieldCopy.ts` entry
   with provisional copy; export `netAnnualRate` from `project.ts`. All existing tests green.
2. `payout.ts` + test.
3. `etfDepot.ts` + test (2a–2d); compare its results with the reference table rows before wiring the UI.
4. `compare.ts` + test (3a–3d).
5. Components: `TextField` extraction (markup unchanged), `ReinvestOption` → `CheckboxOption` (`git mv`),
   `InputForm` order, `SavingCalculator` state and live text, `DepotComparison` with the UX copy.
6. e2e: helper changes and the three live-region anchors first (013–015 specs green), then
   `avd-compare.spec.ts`. `npm run verify -w apps/avd` and `npm run test:e2e -w apps/avd` green; check 320/375/1280 px.

### Existing e2e specs (what the new markup must not break)

- No avd spec walks `parentElement` / `locator('..')` (the platform's `auth.spec.ts` does, on the login card,
  which is untouched).
- `figure(page, label)` matches any `dt` on the page by exact text. The comparison will show "Eigene Beiträge"
  (and maybe "Steuern", "Endwert"-like labels) again, so `figure()` is scoped to
  `getByRole('region', { name: 'Ergebnis', exact: true })`; every current call reads a figure inside that region.
- `getByRole('region', { name: 'Ergebnis' })` (avd.spec.ts, avd-tax-refund.spec.ts, avd-reinvest.spec.ts) is a
  case-insensitive substring match: the comparison region's name must not contain "ergebnis".
- `page.getByText(/^Hinweis: Die Zahlen sind Modellrechnungen/)` (avd.spec.ts 013/AC8) is page-wide: the
  comparison note must not start with that text.
- `page.getByRole('table')`, `page.getByRole('columnheader')` (avd.spec.ts 013/AC5 exact header list and AC6;
  avd-reinvest.spec.ts AC1/AC4; avd-tax-refund.spec.ts; helpers `tableRows`, `cellByHeader`) are page-wide: the
  comparison uses figure lists (`dl`), no table role. If UX wants a table, all of these must first be scoped to
  the year table.
- `page.getByText('Reinvestierte Steuererstattung', { exact: true })` is counted (0 / 2) and
  `getByText('Zulage im 1. Jahr', { exact: true })` (0): no element of the comparison may have exactly these
  texts.
- Live region, end-anchored: avd-tax-refund.spec.ts AC7 (`…11\.070,00\s€\.$`), avd-reinvest.spec.ts AC1
  (`…3\.099,60\s€\.$` and `^…3\.542,40\s€\.$`). The new sentence is appended, so these drop `$` (their ACs stay
  true). avd.spec.ts AC7 is not end-anchored.
- Tab order: 014/AC7 (costs → one Tab → rate) and 015/AC1 (rate → one Tab → reinvest box) need the new field
  and box **after** the reinvest box in the DOM.

### Risks

1. **Rounding drift against the oracle** — gross from the rounded depot value, ETF tax from the unrounded lots,
   each reported total rounded once, net/yield derived. A different place of rounding (e.g. the ETF gross as the
   sum of the sold values, or monthly rounding) moves values by 1–2 cents. Mitigation: the reference table; the
   developer compares `etfDepot()` with it before the UI step.
2. **Tiny net rates** — the naive annuity formula loses precision near q = 0 and gives 0/0 at q = 0. Mitigation:
   `log1p`/`expm1` and the explicit `q === 0` branch; unit test 1.
3. **Vorabpauschale timing and the 1/12 rule** — taxing it in its own year or without the 1/12 factor gives
   plausible but different numbers. Mitigation: AC8/AC12 exact values (they tell both apart) and unit test 2c.
4. **Breaking 013–015 specs by markup or text collisions** — see "Existing e2e specs"; the helper scoping and DOM
   order are part of this story, not an afterthought.
5. **Float residue in FIFO** — `sell -= units` can leave 1e−17 units in a lot. Mitigation: the last payout sells
   every remaining unit; a lot is consumed when the requested units are ≥ its units; nothing reads residues.
6. **AVD/ETF figures depending on the wrong input** — the AVD must never read `useAllowance`, the ETF never the
   retirement or marginal rate or the reinvest box. Mitigation: `etfDepot()` takes only `inputs` + the flag and
   reads only age, payout age, monthly, return and costs; AC8, AC12 and AC5 check it end to end.
7. **Copy that becomes ambiguous** — "monthly net payout" is an average for the ETF; the label must say so (UX).
   The existing 013/014 notes say nothing about a payout phase and stay as they are.
8. **Legal assumptions** — Variante A, the netting rule, loss offset inside § 22 Nr. 5 and the 120 EUR rule are
   inferred (ADR 0009). They are stated in the UI note; health insurance stays "prüfungsbedürftig".

### Alignment with UX

The UX section was empty when this was written. Open points for the ux-designer:

- Placement and grouping of the retirement field and the Pauschbetrag box (DOM after the reinvest box; a
  sub-heading such as "Vergleich mit einem ETF-Depot" fits row 5 of the grid), their hint copy.
- The comparison region: heading (without "Ergebnis"), payout-period sentence, one `dl` per depot (AVD, ETF), the
  difference line with its three wordings (AVD ahead / ETF ahead / equal) and sign, placement relative to the
  chart and table. Optional rows offered by the data: gross payouts (makes "gross − tax = net" visible), kept
  refunds (makes "net − own + kept = yield" visible for the AVD), unsubsidised contributions, ETF tax in the
  saving phase.
- Label of the monthly figure: it is an average for the ETF (e.g. "Netto-Auszahlung pro Monat (Durchschnitt)").
- The Variante-A note at the AVD block (AC4) and the comparison note (AC11, two Pauschbetrag variants, not starting
  with "Hinweis: Die Zahlen sind Modellrechnungen").
- The live-region sentence for the difference (AC10).
- Narrow screens: two figure lists side by side or stacked; no horizontal scroll at 375 px.

## Implementation notes

_developer: what was built, deviations from the design and why._

**Built (all below `apps/avd/`), following the Technical design and ADR 0009:**

- Logic: `fields.ts` / `parseInputs.ts` gain `retirementRatePct` → `Inputs.retirementRateBp` (last in
  `FIELD_IDS`, default `20`, 0 to 50,00 %); `project.ts` exports `netAnnualRate()` and uses it itself (same
  float expression); new `payout.ts` (`PAYOUT_END_AGE`, `payoutMonths`, `payoutMultiple`, `soldFraction` with
  `log1p`/`expm1` and the `q === 0` branches), `etfDepot.ts` (monthly lots, Vorabpauschale with the 1/12 rule
  as income of the next year, FIFO sales, yearly tax with Teilfreistellung and Pauschbetrag; owns the ETF
  constants) and `compare.ts` (`unsubsidisedCents`, AVD side, `compareDepots`). Before wiring the UI,
  `etfDepot()` and `compareDepots()` were run against every row of the reference table and the "More values"
  (monthly nets, gross payouts, B_U, unit cases 2b/2c/3b–3d): all equal to the cent.
- UI: `TextField.tsx` (+ `TextField.module.css`, the field rules moved out of `InputForm.module.css`),
  `ReinvestOption` → `CheckboxOption` (`git mv`, props `label`/`hint`), `InputForm` renders the seven fields,
  the reinvest box, the h3 "Für den ETF-Vergleich", the retirement field and the Pauschbetrag box;
  `SavingCalculator` holds `allowance` (default `true`), computes `comparison` and appends the difference
  sentence to the live text; new `DepotComparison.tsx` (+ css) and `comparisonCopy.ts` (assumption, note with
  both Pauschbetrag variants, payout sentence, verdict, live sentence). Rates and amounts in the copy are
  formatted from the logic constants (`formatPercent` added to `format.ts`); `1.800 €` from
  `DEDUCTIBLE_LIMIT_CENTS`, now exported from `taxRefund.ts` (value unchanged).
- Tests: `payout.test.ts` (1a–1c), `etfDepot.test.ts` (2a–2d), `compare.test.ts` (3a–3d), the defaults case of
  `parseInputs.test.ts`; `Inputs` literals in four test files. e2e: helpers `retirementInput`, `allowanceBox`,
  `comparison`, `depotBlock`, `compareFigure`, `compareDifference`; `figure()` scoped to "Ergebnis"; the three
  end-anchored live asserts lost their `$`; new `e2e/avd-compare.spec.ts`, one test per AC with the reference
  values.

**Deviations / choices (small):**

- Unit test 1b: the design says the recursion "stays ≥ −1e−6"; the last payout leaves float noise of up to
  −2e−5 on a depot of 1e8, so the bound is checked for every balance before the last payout and the end
  balance within 1e−6 · D, as the design's "never a negative balance before the last payout" says.
- Difference box: UX §1 says the value moves under the label from 600 px, §7 says "label left, value right"
  at every width. I followed §7 (one flex row), and the row wraps the value under the label (right-aligned)
  only when both do not fit (at 320 px with a seven-digit amount the label was otherwise overlapped).
- Rows `dt { flex: 1 1 0 }` so long labels wrap and values stay right on the first line; values use
  `overflow-wrap: anywhere`, no `nowrap` (UX §6).
- The comparison note keeps the UX text; its top distance is 24 px in total
  (`calc(var(--space-5) - var(--space-3))` on top of the region's grid gap).

**Checked by hand (not kept as tests):** 320 / 375 / 700 / 1280 px, light and dark, with age 18, 570 EUR,
20 % (seven-digit amounts): no sideways page scroll, nothing outside the viewport; form row 5 and the
sub-heading as in UX §1. The unchecked native checkbox border was not re-measured (same component as 015).

**Follow-ups:** none.

**Fixed after review (minors/nits):**

- e2e: `result` and `savingSnapshot` (was `snapshot` in 015 and `savingSnapshot` in 016) now live once in `e2e/avd.helpers.ts` and are imported by `avd-reinvest.spec.ts` and `avd-compare.spec.ts`; `result` uses `exact: true`.
- `monthlyLog()` is exported from `logic/payout.ts` and used by `logic/etfDepot.ts` (same expression `Math.log1p(netRate) / MONTHS`).
- `CheckboxOption.module.css` header comment made generic (reinvest and allowance option).

P4 (retro, approved by hak 2026-11-08): row label renamed to 'Ausgezahlt nach allen Steuern' in both blocks.

## Test report

_tester: AC → test mapping, results, defects found._

| AC   | Test(s)                                                                                                                                                                                                                                                | Result |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| AC1  | `apps/avd/e2e/avd-compare.spec.ts` › AC1: the retirement rate and the Pauschbetrag box are there with their defaults, the comparison shows at once and 013–015 stay unchanged (chart via differingPixels = 0; comparison moves, saving figures do not) | PASS   |
| AC2  | `apps/avd/e2e/avd-compare.spec.ts` › AC2: R0 pays out from 65 to 85 in 240 payouts; AVD yield 1.872,00, ETF 0,00                                                                                                                                       | PASS   |
| AC3  | `apps/avd/e2e/avd-compare.spec.ts` › AC3: the retirement rate moves only the AVD side: 0 / 20 / 50 %                                                                                                                                                   | PASS   |
| AC4  | `apps/avd/e2e/avd-compare.spec.ts` › AC4: at 570 EUR only the subsidised 18.720,00 is taxed and the AVD block states the assumption                                                                                                                    | PASS   |
| AC5  | `apps/avd/e2e/avd-compare.spec.ts` › AC5: reinvested refunds are unsubsidised and untaxed; the last refund still counts                                                                                                                                | PASS   |
| AC6  | `apps/avd/e2e/avd-compare.spec.ts` › AC6: one saving year from 69 to 70 pays out 180 times, with the reinvest box off and on                                                                                                                           | PASS   |
| AC7  | `apps/avd/e2e/avd-compare.spec.ts` › AC7: the balance earns during payout; losses give no tax, negative yields and no NaN                                                                                                                              | PASS   |
| AC8  | `apps/avd/e2e/avd-compare.spec.ts` › AC8: the ETF is taxed with the capital gains tax, not the retirement rate                                                                                                                                         | PASS   |
| AC9  | `apps/avd/e2e/avd-compare.spec.ts` › AC9: an invalid retirement rate (or any invalid field) replaces result and comparison by the hint                                                                                                                 | PASS   |
| AC10 | `apps/avd/e2e/avd-compare.spec.ts` › AC10: keyboard reaches the rate and the box, they are labelled and described, and the difference is announced after a pause                                                                                       | PASS   |
| AC11 | `apps/avd/e2e/avd-compare.spec.ts` › AC11: the comparison note states the model, the ETF taxes, the assumption and what is not modelled                                                                                                                | PASS   |
| AC12 | `apps/avd/e2e/avd-compare.spec.ts` › AC12: without the Pauschbetrag the ETF pays more tax; the AVD and both depot values stay; no gain, no change                                                                                                      | PASS   |

**Round 1, verdict PASS. Tests added by the tester: 0** (the developer's one-test-per-AC spec and unit tests assert each AC's intent; nothing was missing).

**Runs (as printed).** `npm run verify`: green. Vitest: template 5 passed (2 files), `@swfactory/platform` 154 passed (15 files), `@swfactory/avd` 100 passed (11 files), `@swfactory/minesweeper` 95 passed (12 files). `npm run test:e2e -w apps/avd`: 76 passed (Playwright project `chromium` 35 tests, project `platform` 41 tests). `check:dist` ok.

**013 to 015 specs.** The three edits in `avd-reinvest.spec.ts` and `avd-tax-refund.spec.ts` only drop the end anchor `$` of live-region regexes (the live text gained a sentence); the asserted intent is unchanged and all pass. `figure()` is now scoped to "Ergebnis", also intent-preserving.

**Mutation checks (temporary, src restored, `diff -r` against backup clean).** Each mutant was killed:

| Mutant                                      | Killed by                        |
| ------------------------------------------- | -------------------------------- |
| no 1/12 rule for the Vorabpauschale         | 1 e2e (AC8/AC12 values) + 1 unit |
| Pauschbetrag 1.000 -> 900 EUR               | 1 e2e + unit                     |
| Variante A off (tax the whole payout)       | 3 e2e + unit                     |
| Teilfreistellung 30 -> 20 %                 | 3 e2e + unit                     |
| Vorabpauschale taxed in its own year        | 2 e2e + unit                     |
| kept refunds = 0                            | 1 e2e + unit                     |
| Basiszins 3,20 -> 3,00 %                    | 1 e2e + unit                     |
| gain not reduced by earlier Vorabpauschalen | 3 e2e + unit                     |
| 120 EUR rule removed in `unsubsidisedCents` | unit only (3a), as designed      |
| Pauschbetrag always applied                 | 2 e2e + unit                     |

Cases move the result strictly (AC1 changes rate and box and asserts the comparison moved; AC3/AC8/AC12 use distinct values at 0/20/50 %).

**Open points of the developer.**

- Unchecked checkbox border (browser-drawn): the darkest border pixel against the background gives 8,2:1 in light and 7,3:1 in dark (needs 3:1). OK, no custom border needed.
- Forced colours (`forcedColors: 'active'`): both depot blocks and the yield rows have a 1 px CanvasText border, the difference box 2 px CanvasText; the checked and unchecked checkbox are drawn and visible, focus outline visible. OK.
- 320 px and 375 px with age 18, payout 70, 570 EUR, 20 %, retirement 50 % (seven-digit amounts): `scrollWidth` equals viewport, no element outside the viewport (the year table scroller excluded). OK.
- Keyboard order: reinvest box, Tab, Steuersatz im Ruhestand, Tab, Sparerpauschbetrag box, Tab, year table wrapper. OK.

**Checked, OK (not kept as tests):** dark colour scheme of the unchecked box (above); screenshots of the forced-colours page and the checkbox in `screenshots/016/` (gitignored).

**Not run, open (no agent can run them):** real iPhone (numeric keypad, 320 px), VoiceOver reading of the comparison and the live sentence, a real tax assessment or BMF clarification of Variante A and the netting rule, health and care insurance on AVD payouts.

**Defects:** none.

Regression after review fixes (2026-11-08): verify green (platform vitest 154/154 in 15 files, avd vitest 100/100 in 11 files, minesweeper vitest 95/95 in 12 files, check:dist ok), e2e 76 passed (chromium 35, platform 41).

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

**Round 1, reviewer 2026-11-08. Verdict: APPROVED. Checklist version: 2**

| Item | Result | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | AC1 `fields.ts` default `20` + `ALLOWANCE_COPY`/`useState(true)` → `InputForm`, `compareDepots()` reads only the projection/refund (no feedback); AC2 `payoutMonths`/`payoutMultiple` (q = 0 → 1), `compare.ts` AVD side, `etfDepot()`, `verdict()`; AC3 `retirementRateBp` read only in `compare.ts`; AC4 `unsubsidisedCents()` + `max(0, D·M − B_U)`, `ASSUMPTION` in the AVD group; AC5 c(n) incl. reinvested, kept = total − reinvested; AC6 N = 1 (1/12 rule and inflow year); AC7 log1p/expm1 annuity, yearly `max(0, …)`; AC8 ETF reads no retirement rate; AC9 `parseInputs` fails as a whole → no `DepotComparison`; AC10 `TextField`/`CheckboxOption` + `liveSentence()`; AC11 `comparisonNote()`; AC12 `useAllowance` read only in `etfDepot()`. Each traced to its test in `e2e/avd-compare.spec.ts`; all 12 green in my run. Independent oracle (lots by value, FIFO by value, naive annuity) equals every reference row to the cent and the app's raw tax within 0,5 cent over 6.272 ETF cases; AVD sweep 31.680 cases: tax, B_U, kept, yield equal, no negative or unsafe value, yield monotone in the retirement rate |
| C2   | n.a.   | no network call, no pending state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| C3   | pass   | one new `useState(true)`, no effect; `comparison` derived per render after `projection`/`refund`; toggle sets `edited` like the reinvest box; `TextField` keeps a stable `key`, so focus stays                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| C4   | n.a.   | no render loop or imperative controller                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| C5   | n.a.   | no reducer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| C6   | n.a.   | no error handling or I/O added                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| S1   | pass   | all text via React children, no `dangerouslySetInnerHTML`, no URL sink; user input reaches only `parseInputs`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| S2   | n.a.   | no config, env or auth change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| S3   | n.a.   | no `package.json` change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| S4   | n.a.   | no dev-only code; `check:dist` ok                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| S5   | n.a.   | no script, skeleton or generated code touched                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| T1   | pass   | `npm run verify` exit 0: vitest skeleton 5 (2 files), platform 154 (15), avd 100 (11), minesweeper 95 (12); `check:dist` ok. `npm run test:e2e -w apps/avd` 76 passed = `chromium` 35 (016: 12) + `platform` 41. The Test report's numbers are right                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| T2   | fail   | finding 3 (nit); otherwise one e2e per AC, units only for branches the e2e cannot see (FIFO vs average cost, N = 1 timing, B_U below 120 EUR, the floor, kept refunds above the cap, the closed form)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| T3   | pass   | exact oracles; AC1/AC3/AC8/AC12 move the result strictly before asserting "unchanged"; `differingPixels` = 0 is the "equals" direction; tester's 10 mutants all killed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| T4   | pass   | Tab until focused (bounded), figures by exact `dt` inside the named group, no positions; tests named after ACs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| T5   | pass   | `payout.test.ts`, `etfDepot.test.ts`, `compare.test.ts`; `verdict`/`liveSentence` equal branch is trivial copy (checked by my copy probe)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| K1   | fail   | findings 1, 2, 4; code otherwise matches the design and ADR 0009 (rounding places, FIFO, 1/12 rule, inflow year, Variante A, kept refunds); both deviations are recorded                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| K2   | pass   | no `any`, no `!`; named exports; one component per file (`figureList` is a plain render helper); tests next to the code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| K3   | pass   | tokens only (token test `bypassProblems` green), `.note` margin is `calc()` over tokens, forced-colours block present, no variant selectors                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| K4   | n.a.   | no platform or factory file changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| K6   | pass   | story `in-review`, index row `in-review`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| K7   | pass   | hak's Q1 to Q4, Variante A, the gate-1 answers (incl. the Pauschbetrag checkbox and the AVD clarification) are logged, append only                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| K8   | fail   | finding 5 (tech-writer step, follows this review)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| K9   | pass   | prettier check inside `verify` green                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| K10  | n.a.   | no workspace script or tsconfig changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| K11  | n.a.   | no env variable                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| A1   | pass   | native `label for` input and checkbox, hint/error in `aria-describedby`, error without role; Tab order reinvest → retirement → Pauschbetrag (e2e AC10); focus never moved                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| A2   | pass   | my probe under `forcedColors: 'active'`: groups, yield rows and assumption 1 px, difference 2 px, all CanvasText; painted pairs (muted/text on surface-subtle, edge on surface/subtle) are in the platform pairs; 320 px with 13-digit amounts: no sideways scroll, nothing outside the viewport                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| A3   | pass   | no new region; the one polite region stays mounted empty and gets one appended sentence; nothing animates                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| A4   | n.a.   | no canvas or render loop; `etfDepot()` worst case (age 18 → 70, 570 EUR) about 0,05 ms per render                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

Findings:

1. `[minor] apps/avd/e2e/avd-compare.spec.ts:45,71-77` - `savingSnapshot()` is a word-for-word copy of `snapshot()` in `apps/avd/e2e/avd-reinvest.spec.ts:40-46`, and `result` is copied too (lines 37 there). CLAUDE.md "Shared e2e helpers": never copy them; the two copies will drift when "Ergebnis" gains a figure. Fix: move `result` (with `exact: true`) and one `savingSnapshot` into `e2e/avd.helpers.ts` and import it in both specs.
2. `[nit] apps/avd/src/features/saving/logic/etfDepot.ts:46` - repeats `Math.log1p(netRate) / MONTHS`, the private `monthlyLog()` of `payout.ts:15-17`, so the ETF prices and the annuity could use different λ after a later edit. Fix: export `monthlyLog` from `payout.ts` and use it here.
3. `[nit] apps/avd/e2e/avd-compare.spec.ts:151,163` - AC3 repeats AC1's "013–015 unchanged when the retirement rate changes" check, incl. a chart screenshot and pixel diff, three times; it is the same code path (the rate never reaches `project()`). The AC text asks for it, so this is input for the PO/architect, not a developer fault: one snapshot comparison (AC1) would do.
4. `[nit] apps/avd/src/features/saving/CheckboxOption.module.css:1` - header still says "The reinvest checkbox (story 015 …)"; the module now styles both boxes. Fix: name it generically, as the `.tsx` doc comment already does.
5. `[nit] apps/avd/README.md` / `CHANGELOG.md` - not yet updated (new input, new checkbox, comparison region, ADR 0009 missing from the README's ADR list). This is the tech-writer's step after this review.
6. `[nit] apps/avd/src/features/saving/DepotComparison.tsx:70` - for the ETF, "Ausgezahlt nach Steuern" (and the average monthly figure) also subtracts the saving-phase Vorabpauschale tax that ADR 0009 pays from outside the depot, so it is less than what actually arrives from the payouts (AC12 setup, box off: 411.594,19 shown vs 423.277,89 received). The yield is right and the "Davon in der Ansparphase" row makes it traceable; a reader may still take the row as the money received. No change needed for this story; input for the ux-designer/hak (e.g. "Ausgezahlt nach allen Steuern").

Checked, OK (not findings): Vorabpauschale = min(start · 3,20 % · 0,7, end − start) per unit, (13 − j)/12 in the purchase year, income of y + 1; the last payout year credits none; gain reduced by the lot's accumulated Vorabpauschalen; losses netted within a year, none carried forward; Pauschbetrag per calendar year in both phases; AVD tax `round(t · max(0, D·M − B_U))` with D·M unrounded, gross from the rounded depot, net/yield/difference derived; 120 EUR rule; negative and zero net rates (no NaN, M = 1 at q = 0); all UX copy equal to §2 (note in both states, assumption, box hint, live sentences); 013–015 specs unchanged apart from the dropped `$` anchors.

## Explanation

A comparison block now sits under the result: the Altersvorsorgedepot against a normal ETF depot.
Both get the same monthly rate, return and costs, and both are paid out in equal monthly amounts until age 85.
New inputs: the tax rate in retirement (default 20 %) and a box for the 1,000 EUR saver's allowance (ETF only).
AVD payouts are taxed at the retirement rate; the part above 1,800 EUR a year is taxed only on its gain.
That last rule is our reading of the law ("Variante A") and is shown on the page as an unconfirmed assumption.
The ETF pays 26.375 % on gains after the 30 % equity exemption, plus a yearly advance tax with a 3.20 % base rate.
Taxes never flow back into a depot, so every figure of stories 013 to 015 stays exactly the same.
Each depot shows value at payout start, taxes, net payouts, average monthly payout and yield after tax.
The difference says in words which depot is ahead; refunds kept by the saver count to the AVD.
With the defaults the AVD is 14,303.07 EUR ahead; four agents recomputed the figures independently.
After review: a duplicated test helper was moved to the shared file, plus two small clean-ups.
Risks: the unsubsidised-part rule and its netting are not confirmed by the tax office yet.
The ETF line "net payouts" also subtracts the advance tax paid from outside, so the label is a bit loose.
Not verified: a real tax assessment, health insurance on AVD payouts, a real iPhone and a screen reader.

## Retrospective

**What went wrong**

- **Story wording ahead of the design (gate 1).** AC12 first required the ETF depot value to stay equal when the
  allowance box is toggled; that holds only if the advance tax is paid from outside, which was still open for the
  architect. The orchestrator relaxed AC12 before the commit. Root cause: an AC asserted a value that depends on a
  question handed to the architect.
- **Context sentence on kept refunds (design).** The PO wrote "only the last year's refund" stays with the saver
  while reinvesting; the architect found the part above the 6,840 EUR cap also stays. One extra PO run (haiku).
  Root cause: the PO derived the sentence from the 150 EUR oracle only, not from the cap case.
- **Review round 1: APPROVED** with one minor and five nits. The minor was a copied e2e helper (`savingSnapshot`),
  the same mistake as in 014, although CLAUDE.md has the rule. Root cause: the developer does not check for copies
  before reporting. Fixed by a short developer run; regression green.
- **Loose label (review nit 6).** "Ausgezahlt nach Steuern" for the ETF also subtracts the saving-phase advance tax
  paid from outside the depot. The yield is right; the label is open for hak.
- Nothing else: tester PASS in round 1, ten mutations all caught, no gate-2 defects.

**Proposed changes**

- **P1 (CLAUDE.md, Independent tests; architect's suggestion):** add "e2e helpers that find values by label
  (`dt` text, region name) are scoped to their region; `getByRole` matches `name` as a case-insensitive substring
  unless `exact: true` is set, and later stories add blocks with the same labels."
- **P2 (`.claude/agents/developer.md`):** before reporting done, grep the app's e2e specs for local helpers whose
  body equals one in another spec or in `e2e/<app>.helpers.ts`, and move them to the helpers file.
- **P3 (`.claude/agents/product-owner.md`):** an AC never asserts a value whose behaviour depends on a question
  handed to the architect; state it as a property or leave it to the design. Context sentences that describe a rule
  are checked at its cap or boundary, not only at the oracle example.
- **P4 (story 016 copy, needs hak):** rename the ETF line "Ausgezahlt nach Steuern" to "Ausgezahlt nach allen
  Steuern" (AVD block the same, for symmetry); copy edit by the developer, regression by the tester.

**Outcome (gate 2, 2026-11-08):** hak approved all proposals. P1 applied to CLAUDE.md, P2 to `.claude/agents/developer.md` (new step 6), P3 to `.claude/agents/product-owner.md` (devops). P4 applied by the developer (label in both blocks, e2e constant); verify and e2e 76 passed afterwards. Manual checks stay not run, open.

Agent memory diffs of this story were checked; all lessons are role-specific and look right.

### Cost

| Role                           | Round | Model  | Tokens       | Tool uses | Duration |
| ------------------------------ | ----- | ------ | ------------ | --------- | -------- |
| general-purpose (tax research) | 1     | sonnet | 101529       | 25        | 2:19     |
| product-owner                  | 1     | sonnet | 79855        | 18        | 3:17     |
| product-owner                  | 2     | sonnet | n/a          | 18        | 0:42     |
| architect                      | 1     | opus   | 199844       | 36        | 16:47    |
| ux-designer                    | 1     | sonnet | 123728       | 30        | 4:35     |
| product-owner                  | 3     | haiku  | 45296        | 4         | 0:09     |
| developer                      | 1     | opus   | 197707       | 71        | 12:04    |
| tester                         | 1     | sonnet | 102543       | 17        | 5:05     |
| reviewer                       | 1     | opus   | 176632       | 42        | 7:13     |
| developer                      | 2     | sonnet | 37164        | 9         | 1:28     |
| tech-writer                    | 1     | haiku  | 110089       | 29        | 1:34     |
| tester                         | 2     | haiku  | 38918        | 6         | 0:52     |
| developer                      | 3     | sonnet | 29840        | 8         | 1:13     |
| devops                         | 1     | haiku  | 32173        | 10        | 0:23     |
| total (measured)               |       |        | 1275318      | 323       | 57:41    |
| orchestrator (main session)    |       | opus   | not measured | n/a       | n/a      |

The architect stands out (two independent model implementations for the oracle); the reviewer built a third one.
