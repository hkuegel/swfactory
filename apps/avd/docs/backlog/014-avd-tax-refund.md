---
id: 014
title: Altersvorsorgedepot tax refund from the Günstigerprüfung (marginal tax rate)
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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

Base: the UX design of [013](013-avd-saving-phase-zulagen.md). Everything not named here stays as in 013 (German neutral copy, hints always visible, errors as description without role, no focus movement, `Eingaben` only as form name, all colours from tokens, 600 px breakpoint). This section only adds or replaces what is listed.

**Superseded parts of 013's UX design:**

- 013 §1: the form has seven fields, not six; the result gets a refund group; the table gets a seventh column.
- 013 §2: model note, live-region sentence, table caption and table footnote are replaced by the texts in section 2 below; the field table gains a row.
- 013 §3, §4, §9: the validity rules, the `edited` flag and the debounce are unchanged and apply to the seventh field; the table detail gains one column.
- 013 §7: minimum table width 560 px becomes 640 px.
- 013 §8: no new token; the figures and the table text use the same pairs.

### 1. Layout / component tree

```text
SavingCalculator
  section.inputs   <form aria-labelledby=h2 "Eingaben">
    InputForm: seven Field blocks, same order as FIELD_IDS
      ... six fields of 013 unchanged ...
      Field "Grenzsteuersatz"             [input] suffix "%"      <- seventh, after "Kosten pro Jahr"
  section.result   h2 "Ergebnis"
    live region (unchanged, mounted empty)
    valid:
      ResultSummary <dl> four depot figures (unchanged)
      Zulage details <dl aria-label="Zulagen im Detail"> (unchanged)
      Refund group  <section aria-labelledby=h3>              <- NEW, between Zulage details and note
        h3  "Vom Finanzamt erstattet, nicht im Depot"
        p   lead-in (muted)
        dl  "Steuererstattung pro Sparjahr"
            "Steuererstattung im 1. Sparjahr"   (only if bonusCents > 0)
            "Steuererstattung gesamt"
            "Eigene Beiträge nach Erstattung"   (emphasised row)
        p   zero hint (only if the total refund is 0)
      Note <p> (extended)
    invalid: danger callout (013), refund group removed with everything else
  section.chart    unchanged, no refund
  section.table    h2 "Jahrestabelle": YearTable with one more column "Steuererstattung" (last)
```

- Seventh field in the grid: two-column grid from 600 px, so the field sits alone in the left cell of row 4, the right cell stays empty (no span, no filler element). Reason: the rate is a tax input, not a depot input; a lone field marks that and keeps the DOM order equal to the reading order. Below 600 px one column as before.
- No new shared component. The refund group reuses the style of the Zulage details `dl` (label/value line) in a bordered box; the developer may extract the `dl` row styles within the module CSS.

### 2. Copy (exact texts)

New field (row for the 013 table):

| Field id     | Label (exact)   | Suffix | Hint (exact)                                                                                           | Range text `{R}` in errors                      | Default |
| ------------ | --------------- | ------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | ------- |
| `taxRatePct` | Grenzsteuersatz | %      | Ein kombinierter Satz einschließlich Soli und Kirchensteuer, 0 bis 50 %, höchstens 2 Nachkommastellen. | 0,00 bis 50,00 % (höchstens 2 Nachkommastellen) | 30      |

Errors use the 013 patterns, e.g. `Grenzsteuersatz: Wert außerhalb des erlaubten Bereichs. Erlaubt: 0,00 bis 50,00 % (höchstens 2 Nachkommastellen).` The hint says "0 bis 50 %" (the words of AC1) while the error range text uses the two-decimal form, like the costs field. The label is not a substring of any other label and no other label contains "Steuersatz".

Result area (new or replaced):

| Where                              | Text (exact)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Refund group heading (`h3`)        | `Vom Finanzamt erstattet, nicht im Depot`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Lead-in `p` (muted)                | `Diese Beträge gehören nicht zum Depot und sind nicht im Endwert enthalten.`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Refund labels (`dt`)               | `Steuererstattung pro Sparjahr`, `Steuererstattung im 1. Sparjahr` (only if `zulage.bonusCents > 0`), `Steuererstattung gesamt`, `Eigene Beiträge nach Erstattung`                                                                                                                                                                                                                                                                                                                                                                                                       |
| Refund values (`dd`)               | `formatEuro`: `442,80 €`, `3.542,40 €`, `10.857,60 €` for the reference at 42 %; year-1 row e.g. `326,80 €` (age 24)                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Zero hint (`p`, muted)             | `Keine zusätzliche Steuererstattung bei diesen Eingaben.` Shown only if the total refund is 0 (rate below break-even, contribution below 120 € per year or 0). The figures stay visible as `0,00 €`                                                                                                                                                                                                                                                                                                                                                                      |
| Model note (replaces 013 AC8 text) | `Hinweis: Die Zahlen sind Modellrechnungen auf Grundlage der eingegebenen Annahmen, keine Anlage- oder Steuerberatung. Es wird angenommen, dass der Anspruch auf die staatliche Zulage besteht. Beträge sind nominal, ohne Inflation. Die Steuererstattung ist vereinfacht mit einem über alle Sparjahre gleichbleibenden Grenzsteuersatz einschließlich Soli und Kirchensteuer berechnet. Das Finanzamt zahlt sie an die steuerpflichtige Person aus, etwa ein Jahr nach dem Beitrag; sie wird nicht im Depot gutgeschrieben. Die Berechnung ist keine Steuerberatung.` |
| Live text, valid (replaces 013)    | `Endwert bei Auszahlungsbeginn mit {payoutAge}: {endValue}. Steuererstattung gesamt: {total}.` e.g. `Endwert bei Auszahlungsbeginn mit 65: 22.256,44 €. Steuererstattung gesamt: 3.542,40 €.`                                                                                                                                                                                                                                                                                                                                                                            |
| Live text, invalid                 | unchanged; names the first invalid field in `FIELD_IDS` order, so the rate comes last: `Kein Ergebnis: Grenzsteuersatz ist ungültig.`                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Table caption (replaces 013)       | `Entwicklung pro Sparjahr, kumuliert; Steuererstattung je Jahr`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Table header, new column           | `Steuererstattung` (last column, after `Kontostand am Jahresende`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Table footnote (replaces 013)      | `Zulagen eines Jahres werden im Folgejahr gutgeschrieben. Die letzte Zulage ist im Endwert enthalten, ohne weitere Erträge. Die Steuererstattung steht im Jahr des Beitrags, ist nicht kumuliert und nicht im Kontostand enthalten.`                                                                                                                                                                                                                                                                                                                                     |

Copy rules:

- The four refund labels differ from the column header: `Steuererstattung` appears alone only as the `th` text. `Steuererstattung pro Sparjahr`, `… im 1. Sparjahr`, `… gesamt` contain it as a substring, so tests use `exact: true` or the full label; none of the three is a substring of another. `Eigene Beiträge nach Erstattung` contains `Eigene Beiträge` (as the table header and legend do): look it up by the full label or `exact: true`. "Eingaben" appears in none of the new texts.
- The heading avoids the word "Steuererstattung" so the only text equal to the AC5 column name is the header.
- The word "Grenzsteuersatz" also occurs in the note; `getByLabel('Grenzsteuersatz', { exact: true })` still finds only the input (note is not a label). Use the label query, not `getByText`.
- The refund is never named "Förderung" or "Gewinn" (story: no Förderquote).

### 3. States

| View           | State                          | What the user sees / can do                                                                                                                                    |
| -------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rate field     | Valid / invalid / focused      | As 013 §3. Never disabled. Invalid: icon + 2 px `--color-danger` border + error `p` under the hint, `aria-invalid`, description = hint + error.                |
| Whole page     | Loading                        | None (synchronous). Initial result already contains the refund group for 30 % (162,00 € pro Sparjahr at the defaults). Live region empty until the first edit. |
| Refund group   | Valid, refund > 0              | Heading, lead-in, 3 or 4 rows. Year-1 row only with the bonus (age 18 to 24 with a contribution of at least 120 €/year, as the "Zulage im 1. Jahr" row).       |
| Refund group   | Valid, total refund 0          | Rows with `0,00 €`, `Eigene Beiträge nach Erstattung` equals `Eigene Beiträge`, plus the zero hint. Not an error, not announced separately.                    |
| Refund group   | Invalid (any field incl. rate) | Removed with the whole result; the 013 danger callout stands in `Ergebnis`. No refund figure, no NaN, Infinity or negative amount anywhere.                    |
| Table          | Valid                          | One more column, one amount per saving year, `0,00 €` where there is none; amounts per year, not cumulative.                                                   |
| Chart          | Any                            | Unchanged. Its `aria-label` does not mention the refund.                                                                                                       |
| Rate-only edit | Valid                          | Refund group, column and live text change; the four depot figures, depot columns and chart stay as they were.                                                  |

### 4. Interactions

- Typing in the rate field: as 013 §4 (raw text kept, immediate recompute, `30,` valid, lone `-` shows the `format` error, errors without role/live). `inputMode` is `decimal` (negatives are not allowed, see the Technical design); `autocomplete="off"`, `spellcheck="false"`, 16 px font.
- Focus: never moves automatically. Tab order: the seven fields in DOM order, then the table scroll wrapper (while a result exists). The refund group has no tab stops.
- Live announcement: still one polite region, mounted empty, filled only after the first edit, driven by `useSettledValue(text, 700)`; visible UI is not delayed. Clear-then-set is not needed: a changed end value or refund changes the string; an unchanged string is intentionally not repeated.
- Rate change alone changes the live string (only the refund part), so a screen-reader user hears the consequence of editing the rate.
- No button, no tooltip, no help popup for the rate: the hint carries the explanation.

### 5. Chart

Unchanged (AC5: the refund is not drawn). The table footnote and the group heading state that the refund is not part of the depot.

### 6. Accessibility

- Rate input: `<label for>` "Grenzsteuersatz" + `<input type="text">`; `aria-describedby="taxRatePct-hint"` (plus `-error` while invalid); `aria-invalid="true"` only while invalid. The unit suffix `%` is `aria-hidden`; the hint states the unit.
- Refund group: `<section aria-labelledby>` named by the `h3`, so it is a region of its own in the Ergebnis section; inside a `<dl>` with `dt`/`dd` as the other figures. Heading order stays h1, h2, h3. The lead-in is plain text, so it is read in reading order; the zero hint likewise (no `role`, no live).
- Emphasis of `Eigene Beiträge nach Erstattung` is weight 700 plus a 1 px `--color-edge` top border, not colour alone.
- Table: header `th scope="col"` `Steuererstattung`; the cells are `td`. The column is separated by a 1 px `--color-edge` left border (header and body), so the boundary between depot columns and the non-depot column is visible without colour; the caption and footnote say it in words. The scroll wrapper keeps its name `Jahrestabelle, horizontal scrollbar`, `tabindex=0`.
- Live regions: the existing single region only; no new region, no `role=alert/status`. The new sentence part needs no extra announcement for the appearance of the group (the figures are not an async change of focus; the live sentence names the total).
- Contrast and focus: only existing token pairs (section 4). Focus ring as 013 (2 px `--color-focus`).
- Forced colours: the refund group box and the column separator are real borders; row emphasis is the border and weight, so cues survive.
- Zoom / reflow: 320 px and 400 %: field and group stack in one column; only the table wrapper scrolls.

### 7. Responsive behaviour

| Aspect       | 600 px and wider                                                                                            | Below 600 px                                                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rate field   | left cell of row 4 in the two-column grid, right cell empty                                                 | one column, after "Kosten pro Jahr"                                                                                                                           |
| Refund group | bordered box, full width, rows as label (muted `--text-sm`) then value in one line, like the Zulage details | same box edge to edge inside the panel padding; rows as label left and value right (tabular), same as figures; label may wrap to two lines, value never wraps |
| Zero hint    | below the rows, `--text-sm`, muted                                                                          | same                                                                                                                                                          |
| Table        | fits when it can                                                                                            | wrapper scrolls horizontally, min table width 640 px (was 560), `Jahr` column sticky as in 013; header `Steuererstattung` may wrap                            |

Tested widths as 013: 375 px (primary), 320 px (the page must not scroll sideways), 1280 px.

### 8. Dark mode and tokens

No new token and no new colour. Every new element uses a pair that 013 already documents (contrast computed there by hand against the surfaces; the tester re-checks with a tool).

| Element                                   | Light                                                                  | Dark           | Contrast                                                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| Refund group box: background              | `--color-surface-subtle` `#eef1f5`                                     | `#252a33`      | n/a (surface)                                                                                          |
| Refund group box: border 1 px             | `--color-edge` `#737c8b`                                               | `#8b94a3`      | UI 3:1 (about 4.0 / 5.4 on surface)                                                                    |
| Heading, labels (`dt`), values (`dd`)     | `--color-text` `#1b1f24`                                               | `#e8eaed`      | above 13 / above 11 on subtle                                                                          |
| Lead-in, zero hint (muted)                | `--color-text-muted` `#4a5360`                                         | `#a9b1bd`      | about 6.9 / about 7.3 on subtle (text 4.5:1, computed by hand: tight margin none, but tester re-check) |
| Net row top border 1 px                   | `--color-edge`                                                         | `--color-edge` | UI 3:1                                                                                                 |
| Table `Steuererstattung` header and cells | as the other columns (`--color-surface-subtle` header, `--color-text`) | same           | as 013                                                                                                 |
| Table column separator 1 px               | `--color-edge`                                                         | `--color-edge` | UI 3:1                                                                                                 |
| Rate field chrome, error, focus           | as 013 (`--color-edge`, `--color-danger`, `--color-focus`)             | as 013         | as 013                                                                                                 |

The muted-on-subtle values are my own estimate from the documented ratios on `--color-surface` (7.8 / 8.5), lowered for the darker subtle background; the platform token test must contain the pair `--color-text-muted` on `--color-surface-subtle` (the developer adds it to `PAIRS` if it is not already there, otherwise the box background may be `--color-surface` and the box is only bordered). The box is always bordered, so it also works if the background is the same as the panel.

### 9. Table detail (addition to 013 §9)

| Column           | Content                                  | Alignment | Notes                                                                                                                                                                         |
| ---------------- | ---------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Steuererstattung | refund of that saving year, `formatEuro` | right     | last column; non-cumulative; `0,00 €` where none; left border 1 px `--color-edge`; tabular numbers; last row is bold like the others in that row; not part of the balance sum |

### 10. Points for the architect

- **Alignment with the Technical design:** no deviation. Position last, labels as proposed ("Steuererstattung pro Sparjahr", "… gesamt", year-1 row only with the bonus, "Eigene Beiträge nach Erstattung"), seventh field at the end of `FIELD_IDS`.
- **New behaviour not in the design:** the zero hint (`Keine zusätzliche Steuererstattung bei diesen Eingaben.`) when `refund.totalCents === 0`; the group heading is an `h3` with its own section; the table caption and footnote texts change (no test matches them today); table min width 640 px.
- **Tests:** the 014 AC1 hint check should match `/Soli/`, `/Kirchensteuer/` and `/0 bis 50 %/` (the hint text uses "0 bis 50 %"); the error range uses "0,00 bis 50,00 %". Figures by the full `dt` label (`exact`), table cells by header index.
- **Token test:** if the box background is `--color-surface-subtle`, `PAIRS` needs `--color-text-muted` on it; check whether the platform pair list already has it.
- **Story 015:** leave room for the checkbox in the form (after the rate field, still DOM order) and for a reinvested row in the refund group before `Eigene Beiträge nach Erstattung`; the table column order (refund column last) is expected to receive a cumulative depot column before `Kontostand am Jahresende`. Not designed here.

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

**ADR:** none new. The refund follows [ADR 0007](../adr/0007-avd-projection-model-and-svg-chart.md) (pure `logic/` module next to `project()`, integer cents and basis points at the boundary, `formatEuro` as the only money formatting). No new dependency, no platform change, no dev-only code, no chart change.

### Overview

One new pure module `logic/taxRefund.ts` computes the refund of every saving year from the parsed inputs and the Zulage that `project()` already returns. `project()`, `YearRow` and `chartGeometry()` stay untouched, so a change of the tax rate cannot change a depot figure, depot column or chart bar by construction (AC2, AC5). The new field joins the existing single-source field machinery (`FIELD_IDS`, `FIELD_SPECS`, `parseInputs`, `FIELD_COPY`); the form, its validation, error texts and `inputMode` follow automatically. `SavingCalculator` derives the refund next to the projection and hands it to `ResultSummary` (figures, note, live text) and `YearTable` (new column). No new state, effect or timer.

### Model (story Context, settled)

Per saving year n, with c = 12 · monthly cents (constant in 014), t = rate in basis points, Z(n) = `perYearCents` + (n = 1 ? `bonusCents` : 0):

- c < 12.000 cents → R(n) = 0 (no Zulage and no tax benefit; must be an explicit branch, because Z = 0 there would otherwise give c · t).
- else base = min(c, 180.000) + Z(n); R(n) = max(0, `Math.round`(base · t / 10.000) − Z(n)).
- `base · t` is an exact integer (at most about 5,6 · 10^5 · 5.000 ≈ 2,8 · 10^9), so the only rounding is the one `Math.round` per year (half up, ADR 0007); the total is Σ R(n) of the rounded yearly amounts; net own contributions = `total.contributionsCents` − total refund (exact integer subtraction, never rounded separately — CLAUDE.md "Money").
- Net own contributions are never negative: R ≤ min(c, 1.800)/2 + 0,5 cent ≤ c for c ≥ 120 EUR. All AC oracle values were recomputed in the scratchpad with this formula and match (AC2 442,80 / 3.542,40 / 10.857,60; AC3 0,00 / 0,00 / 0,54 / 442,80 / 630,00; AC4 0,00 / 0,00 / 15,60 / 39,00 / 442,80, 94,80, 326,80; default 162,00).

### Files

| Path (below `apps/avd/`)                                             | Change                                                                                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/saving/logic/fields.ts`                                | `FieldId` + `'taxRatePct'`, appended to `FIELD_IDS` after `costsPct`; `FIELD_SPECS.taxRatePct`; `DEFAULT_INPUTS`                |
| `src/features/saving/logic/parseInputs.ts` (+ test)                  | `Inputs.taxRateBp`; destructure and `undefined` check of the seventh value                                                      |
| `src/features/saving/logic/zulage.ts`                                | new `zulageOfYear(z, year)` (the per-year Z incl. bonus in year 1), so `project()` and the refund share one definition          |
| `src/features/saving/logic/project.ts`                               | only replaces its inline `zulageOf` with `zulageOfYear`; behaviour, types and tests unchanged                                   |
| `src/features/saving/logic/taxRefund.ts` (+ test, new)               | `refundCents()` for one year, `taxRefund()` for all saving years, total and net own contributions                               |
| `src/features/saving/fieldCopy.ts`                                   | `FIELD_COPY.taxRatePct` (label "Grenzsteuersatz", suffix `%`, hint, range — exact texts from UX)                                |
| `src/features/saving/SavingCalculator.tsx`                           | derives `refund`, passes it on, live text with the total refund                                                                 |
| `src/features/saving/ResultSummary.tsx` (+ css)                      | refund group (per year, year 1 if bonus, total, net own contributions) outside the depot `dl`, extended note (AC8)              |
| `src/features/saving/YearTable.tsx` (+ css)                          | column "Steuererstattung", one amount per saving year; caption/footnote per UX                                                  |
| `src/features/saving/InputForm.tsx` / `.module.css`                  | no logic change (iterates `FIELD_IDS`); comment "six" → "seven"; grid only if UX wants the odd seventh field placed differently |
| `src/features/saving/logic/project.test.ts`, `chartGeometry.test.ts` | type-only: add `taxRateBp` to their `Inputs` literals                                                                           |
| `e2e/avd-tax-refund.spec.ts` (new)                                   | one test per AC of 014 (rebuild oracle)                                                                                         |
| `e2e/avd.helpers.ts` (new, optional)                                 | shared helpers moved out of `avd.spec.ts` (`open`, input locators, `figure`, `euro`, `cents`, `tableRows`, `chart`, `noResult`) |
| `e2e/avd.spec.ts`                                                    | the 013 tests whose ACs 014 changes (see "Updates to the 013 spec")                                                             |

`BalanceChart.tsx`, `chartGeometry.ts`, `format.ts`, `tokens.css` stay unchanged (the refund is not drawn, AC5). A new token is only needed if UX styles the refund group with a colour of its own; then the token test gets the pair in the same change.

### Key types

```ts
// logic/fields.ts
export type FieldId =
  'age' | 'payoutAge' | 'monthly' | 'children' | 'returnPct' | 'costsPct' | 'taxRatePct';
// FIELD_SPECS.taxRatePct = { min: 0, max: 5000, decimals: 2, defaultValue: '30' }  (basis points)

// logic/parseInputs.ts
export interface Inputs {
  // … the six fields of 013 unchanged …
  readonly taxRateBp: number; // 0..5000, 1 % = 100
}

// logic/zulage.ts
/** Zulage credited for saving year `year` (1-based): perYearCents, plus bonusCents in year 1. */
export function zulageOfYear(z: Zulage, year: number): number;

// logic/taxRefund.ts
/**
 * Extra refund of one saving year from the Günstigerprüfung (story 014 Context):
 * 0 below c = 120 EUR; else max(0, round((min(c, 1.800 EUR) + Z) · t) − Z), rounded once.
 * Kept per year with explicit c and Z so story 015 can call it with a varying c(n).
 */
export function refundCents(annualCents: number, zulageCents: number, taxRateBp: number): number;

export interface TaxRefund {
  /** Refund of a year without bonus (years 2 … N; year 1 too when there is no bonus). */
  readonly perYearCents: number;
  /** Refund of saving year 1 (differs from perYearCents only with the bonus). */
  readonly firstYearCents: number;
  /** One per saving year, aligned with Projection.years (index = year − 1). */
  readonly byYearCents: readonly number[];
  /** Σ byYearCents (sum of the rounded yearly amounts). */
  readonly totalCents: number;
  /** projection.total.contributionsCents − totalCents (>= 0). */
  readonly netContributionsCents: number;
}
/** Uses projection.zulage and projection.years.length, so Zulage and saving years have one source. */
export function taxRefund(inputs: Inputs, projection: Projection): TaxRefund;

// ResultSummary
export interface ResultSummaryProps {
  readonly projection: Projection | null;
  readonly refund: TaxRefund | null; // null together with projection (no-result hint)
  readonly payoutAge: number | null;
  readonly liveText: string;
}

// YearTable
export interface YearTableProps {
  readonly rows: readonly YearRow[];
  readonly refundsCents: readonly number[]; // = refund.byYearCents, same length as rows
}
```

### Data flow and state

- State stays as in 013: `SavingCalculator` owns the seven raw texts (`RawInputs` grows by one key, `DEFAULT_INPUTS` with `'30'`) and `edited`.
- Derived per render: `parsed` → `projection = project(inputs)` → `refund = taxRefund(inputs, projection)`; both `null` when parsing fails, so an invalid rate (or any invalid field) shows the 013 no-result hint and no refund, table or chart (AC6). Because nothing is rendered from `refund` without a valid parse, no NaN/Infinity/negative amount can reach the DOM.
- Live text (AC7), only after the first edit, still through `useSettledValue` (700 ms): valid → end value sentence of 013 plus the total refund, e.g. `Endwert bei Auszahlungsbeginn mit 65: 22.256,44 €. Steuererstattung gesamt: 3.542,40 €.` (exact copy from UX); invalid → unchanged 013 sentence naming the first invalid field (`firstInvalidField` follows `FIELD_IDS`, so the rate is named last).
- Field wiring: `parseField` handles the new field without code changes (DECIMAL regex, `toUnits`, range from `FIELD_SPECS`): `''` → empty, `abc` / `30,001` → format, `-1` / `50,01` → range, `-0` → 0 (accepted like the costs field). `inputModeFor` gives `decimal` because `min` is 0 — this satisfies CLAUDE.md "Text inputs with negatives" (negative values are not allowed, they are only rejected; a typed or pasted minus still reaches the parser as a range error). `errorMessage()` already names label and `range`.

### Result, table, note (content; layout from UX)

- **Result:** a separate group after the depot figures and Zulage details, outside the depot `dl`, whose heading or labels say that the refund is not part of the depot (AC2). Figures: refund per saving year (`perYearCents`), refund of saving year 1 only when `zulage.bonusCents > 0` (same rule as the "Zulage im 1. Jahr" row of 013), refund total, own contributions after the refund (`netContributionsCents`). The four depot figures and their sum are unchanged.
- **Table:** new column "Steuererstattung", one non-cumulative amount per saving year (`0,00 €` where there is none). Proposed position: **last**, after "Kontostand am Jahresende", so the depot columns stay contiguous and still sum to the balance; 015 inserts its cumulative reinvested column among the depot columns. The caption "Entwicklung pro Sparjahr, kumuliert" must say that this column is per year (UX copy).
- **Note (AC8):** the 013 sentences stay; add: simplified model with one constant marginal tax rate (incl. Soli and Kirchensteuer), the refund is paid to the taxpayer by the Finanzamt (about a year later) and not credited to the depot, no tax advice (013 already says "keine Anlage- oder Steuerberatung"; keep it, and keep the note starting with "Hinweis: Die Zahlen sind Modellrechnungen", which the 013 AC8 test matches).

### Updates to the 013 spec (`e2e/avd.spec.ts`)

014 changes 013/AC1, AC5, AC6, AC7, AC8. The 013 oracle values stay; only these assertions must follow:

- **013 AC5:** the exact `columnheader` list gets the new header; `lastRow.locator('td').last()` (twice: reference balance and the payout-70 end value) no longer points at the balance if the column is last. Replace both with a lookup by the header index of "Kontostand am Jahresende" (so 015's extra column doesn't break it again). `cells.slice(1)` destructures only the first four, so the sum check survives.
- **013 AC7:** the live-region regex `^Endwert … €\.$` is anchored at the end; drop the `$` (the 014 AC7 test asserts the full new sentence). The Tab loop over the six inputs still works (it tabs until each target has focus).
- **013 AC1, AC6, AC8, narrow screen:** no change expected (six inputs still present; `defaultOf` only maps the six; the note keeps its first sentence). The 375 px test still holds because the table scrolls inside its own region — the developer checks it with the extra column.
- No spec walks `parentElement` / `locator('..')`; the `figure()` helper uses `dt` → following `dd` with an anchored label, so new labels such as "Eigene Beiträge nach Steuererstattung" don't collide with "Eigene Beiträge".

### Minimal test set

e2e, new file `e2e/avd-tax-refund.spec.ts`, in a `test.describe('014 tax refund', …)`, one test per AC; AC-listed values only here:

| AC  | e2e test (cheapest level that shows the AC)                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC1 | input "Grenzsteuersatz" has value `30`, its description names Soli, Kirchensteuer and 0 to 50 %; the refund per year `162,00 €` is shown on load                                                                                                                         |
| AC2 | reference at 42 %: 442,80 / 3.542,40 / 10.857,60 with their labels in the non-depot group; depot figures 14.400,00 / 4.320,00 / 3.536,44 / 22.256,44 and their sum unchanged                                                                                             |
| AC3 | reference, rate 0 / 23 / 23,10 / 42 / 50 → 0,00 / 0,00 / 0,54 / 442,80 / 630,00                                                                                                                                                                                          |
| AC4 | 42 %, age 40: monthly 0 / 9,99 / 10 / 25 / 570 → 0,00 / 0,00 / 15,60 / 39,00 / 442,80; 2 children → 94,80; age 24 → table row 1 326,80, row 2 442,80                                                                                                                     |
| AC5 | one input change updates refund figures, net and the column (9,99 → every refund cell `0,00 €`); a rate-only change leaves the four depot figures, every depot column text and the chart screenshot identical; the chart's accessible name does not mention the refund   |
| AC6 | rate `''`, `abc`, `-1`, `30,001`, `51` → error naming "Grenzsteuersatz" and the range, `aria-invalid`, description, no-result hint, body without `NaN`/`Infinity`/negative amount; fixing it restores the result                                                         |
| AC7 | Tab from the costs field lands on "Grenzsteuersatz" (the AC is the form order; one Tab from a focused field, not a counted sequence through the page); name + hint as description, error added to it; under `page.clock` the live region gets end value and total refund |
| AC8 | the note in the "Ergebnis" region contains the three new statements and still the 013 ones                                                                                                                                                                               |

Unit, `logic/taxRefund.test.ts` (branching logic; inputs other than the AC values):

1. `refundCents` table: below the 120 EUR floor with children and 50 % → 0 (floor branch); Z larger than base · t → 0 (clamp); c above 1.800 EUR gives the same refund as c = 1.800 EUR at another rate and child count (cap branch); half-cent case rounds up once: c = 12 · 123,45 = 1.481,40, Z = 460,35, 26 % → base 1.941,75 · 0,26 = 504,855 → **44,51 EUR**.
2. `taxRefund` with the half-cent inputs over 8 saving years: `byYearCents` all 4451 (44,51 EUR), total **356,08 EUR** (sum of rounded years; rounding the total once would give 356,04), net = contributions − total; and a bonus case (age 20, 150 EUR, 1 child, 45 %: year 1 238,00 EUR, later 348,00 EUR): only `byYearCents[0]` differs, `firstYearCents` equals it, `byYearCents.length` = saving years.
3. Sweep (property, like 013's cost sweep): rate 0 … 5.000 bp in steps of 25 over a few contributions (0, 9,98, 10, 100, 150, 570 EUR), children (0, 1, 10) and ages (20, 40): every refund is a safe integer >= 0, never falls when the rate rises, and net own contributions >= 0 (AC3 "never lowers", AC6 "no negative refund").

Unit, existing files: `parseInputs.test.ts` — the AC1 defaults expectation gains `taxRateBp: 3000`; the inside/outside table gains `['taxRatePct', '50,00', '50,01']` and `['taxRatePct', '0', '-0,01']` (bounds, not the e2e values). No component tests (the e2e tests show every rendered figure); no change to `useSettledValue.test.ts`.

### Implementation plan

1. `fields.ts` + `parseInputs.ts` (+ test updates): seventh field; fix the type-only `Inputs` literals in `project.test.ts` and `chartGeometry.test.ts`. `npm test` green.
2. `zulage.ts`: `zulageOfYear`; use it in `project.ts`. 013 unit tests stay green unchanged (proves no depot change).
3. `taxRefund.ts` + `taxRefund.test.ts`.
4. `fieldCopy.ts`: copy of the new field (UX texts).
5. `SavingCalculator.tsx`: derive `refund`, pass it, live text.
6. `ResultSummary.tsx` (+ css): refund group and note; `YearTable.tsx` (+ css): column, caption.
7. e2e: optional helper extraction, `avd-tax-refund.spec.ts`, the 013 spec updates above. `npm run verify -w apps/avd` and `npm run test:e2e -w apps/avd` green.

### Open for story 015 (not built now)

015 makes c(n) vary per year (c(n+1) = 12 · m + reinvested R(n), capped at 6.840 EUR), so Zulage and refund become per-year values inside the monthly loop. The pieces it reuses: `refundCents(annualCents, zulageCents, taxRateBp)` (already takes c and Z per year), `zulage(annualCents, …)` per year, `zulageOfYear`; `Inputs.taxRateBp` is already parsed. 015 will move the per-year refund into (or next to) `project()` and replace `TaxRefund.perYearCents` / `firstYearCents` by what its result needs. Nothing in 014 is shaped for the checkbox.

### Risks

1. **Depot drift through the refund** — mitigated structurally: `project()` does not read `taxRateBp`; step 2 keeps the 013 unit tests unchanged, and the AC5 e2e compares depot columns and the chart screenshot across a rate-only change.
2. **Missing 120 EUR branch** — Z = 0 below the floor would otherwise yield a refund of c · t; covered by unit test 1 and AC4 (9,99).
3. **Rounding twice** (per year and again on the total) — the total is a sum of integers; unit test 2 tells the variants apart (356,08 vs 356,04).
4. **013 spec positional assertions** — the new column breaks `td.last()` and the header list; see "Updates to the 013 spec". Use header-index lookups.
5. **Label collisions in e2e** — the `figure()` helper anchors labels; new labels must not equal an existing one ("Steuererstattung" as a figure label would equal the column header text; that is fine for `dt` lookups but `getByText(…, {exact:true})` would find both). Prefer distinct figure labels ("Steuererstattung pro Sparjahr", "… gesamt").
6. **Seventh field in the two-column grid** — an odd field count leaves one cell empty; UX decides, no logic impact.

### Alignment with UX

The UX section was empty when this was written. Points for the ux-designer: exact label/hint/range/error copy of the rate field; heading and labels of the refund group ("not part of the depot"); whether the year-1 refund appears as a figure (proposed: only with the bonus, like "Zulage im 1. Jahr") or only in the table; column header text, position (proposed: last) and caption wording for a per-year column in a cumulative table; live-region sentence; the added note sentences; placement of the seventh field in the grid. If UX decides differently on position or labels, the design follows UX and the 013-spec update list changes accordingly.

## Implementation notes

_developer: what was built, deviations from the design and why._

**What was built** (all below `apps/avd/src/features/saving/`, as in the Technical design):

- `logic/fields.ts`, `logic/parseInputs.ts`: seventh field `taxRatePct` (0..5000 bp, 2 decimals, default `30`) at the end of `FIELD_IDS`; `Inputs.taxRateBp`. `inputMode` is `decimal` automatically (min 0).
- `logic/zulage.ts`: `zulageOfYear(z, year)`; `MIN_CONTRIBUTION_CENTS` is now exported so the 120 EUR floor of the refund uses the same constant. `logic/project.ts` uses `zulageOfYear` (013 unit tests unchanged and green).
- `logic/taxRefund.ts` (new): `refundCents()` per year (explicit floor branch, cap 1.800 EUR, one `Math.round`, clamp at 0) and `taxRefund()` (per year, year 1, by year, total as sum of rounded years, net own contributions).
- `fieldCopy.ts`: label, suffix, hint, range of "Grenzsteuersatz" (UX §2).
- `SavingCalculator.tsx`: derives `refund` after `project()` (never fed back), passes it to `ResultSummary` and `YearTable`; live text adds `Steuererstattung gesamt: …`.
- `TaxRefundGroup.tsx` + `.module.css` (new): `section` named by the `h3` "Vom Finanzamt erstattet, nicht im Depot", lead-in, `dl` with per-year, year-1 (only with the bonus), total and the emphasised "Eigene Beiträge nach Erstattung" row (700 + 1 px `--color-edge` top border), zero hint when the total is 0. Box: 1 px `--color-edge` border on `--color-surface-subtle` (the pair `--color-text-muted` on `--color-surface-subtle` is already in the platform token test, so no `PAIRS` change).
- `ResultSummary.tsx`: renders the group between the Zulage details and the note; note extended with the UX text.
- `YearTable.tsx` / `.module.css`: last column "Steuererstattung" (non-cumulative, 1 px `--color-edge` left border, `CanvasText` in forced colours), new caption and footnote, min table width 640 px.
- `InputForm.tsx` / `.module.css`: comments only ("seven fields"); the seventh field falls into the left cell of row 4 by itself.
- Tests: `logic/taxRefund.test.ts` (new, 7 tests: floor, clamp, cap, half-cent rounding, sum of rounded years 356,08, bonus year 1 only, rate sweep); `parseInputs.test.ts` (defaults with `taxRateBp: 3000`, bounds `50,00`/`50,01` and `0`/`-0,01`); `project.test.ts` and `chartGeometry.test.ts` (type-only `taxRateBp` in literals).
- `e2e/avd.spec.ts` (013 spec, only the listed positional asserts): header list gains `Steuererstattung`; both `td.last()` balance checks use a new `balanceCell()` helper that looks up the "Kontostand am Jahresende" header index; the AC7 live-region regex lost its `$`.

**Deviations**

- The refund group is its own component `TaxRefundGroup.tsx` with its own CSS module instead of more markup in `ResultSummary.tsx` (one component per file, keeps `ResultSummary` small). Its row styles are a copy of the Zulage-details pattern adapted to UX §7 (label left / value right below 600 px, value never wraps).
- UX §7 says labels are muted `--text-sm` (like the Zulage details), UX §8 lists `--color-text` for `dt`; I followed §7 (muted labels, pair already tested) and gave the emphasised net row `--color-text` + 700 for label and value.
- The optional `e2e/avd.helpers.ts` extraction was not done (that belongs with the new 014 spec, tester's file).

**Checked by hand (throwaway script, not kept):** at 320/375/1280 px no page overflow; reference at 42 % shows 442,80 / 3.542,40 / 10.857,60 € and table row 8 `… 22.256,44 € 442,80 €`; age 24 shows the year-1 row 326,80 €; 20 % shows the zero hint; dark scheme screenshot looked right.

**Follow-ups:** none for 014. For 015, `refundCents()` already takes c and Z per year.

**Review round 1, nit 9:** the model note now ends "…sie wird nicht im Depot gutgeschrieben. Die Berechnung ist keine Steuerberatung." (`ResultSummary.tsx` and the UX copy table); the AC8 e2e assertion `keine Steuerberatung` still matches, no test changed.

## Test report

_tester: AC → test mapping, results, defects found._

Tests added: 8 e2e in `apps/avd/e2e/avd-tax-refund.spec.ts` (one per AC) plus the helper file `apps/avd/e2e/avd.helpers.ts`. The 013 spec imports the shared helpers from `avd.helpers.ts` (round 1: copies removed). Unit tests of the developer (`taxRefund.test.ts`, `parseInputs.test.ts`) were not duplicated.

| AC  | Test(s)                                                                                                                                                                                                                                         | Result |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | `avd-tax-refund.spec.ts` › AC1: rate input default 30, hint (Soli, Kirchensteuer, 0 bis 50 %), refund 162,00 on load                                                                                                                            | PASS   |
| AC2 | › AC2: reference at 42 % gives 442,80 / 3.542,40 / 10.857,60 in the non-depot region, depot figures 14.400,00 / 4.320,00 / 3.536,44 / 22.256,44 unchanged                                                                                       | PASS   |
| AC3 | › AC3: rates 0 / 23 / 23,10 / 42 / 50 give 0,00 / 0,00 / 0,54 / 442,80 / 630,00 (monotonicity: unit sweep in `taxRefund.test.ts`)                                                                                                               | PASS   |
| AC4 | › AC4: monthly 0 / 9,99 / 10 / 25 / 570, 2 children 94,80, age 24 year 1 326,80 (figure and table column by header) then 442,80, age 25 no year-1 row                                                                                           | PASS   |
| AC5 | › AC5: refund, net and column update (9,99 gives all-zero column, net 959,04); rate-only change 42 to 50 % leaves four depot figures, four depot columns (all rows), chart screenshot (animations settled) and chart name identical             | PASS   |
| AC6 | › AC6: rate `''`, `abc`, `-1`, `30,001`, `51` give error with field name and range, aria-invalid, description (hint + error), no-result hint, no refund/table/chart, no NaN/Infinity/negative amount; fix restores; other fields still validate | PASS   |
| AC7 | › AC7: one Tab from costs reaches Grenzsteuersatz, name and hint as description, error joins description, live region empty at 300 ms and filled at 800 ms with end value and total refund (11.070,00), invalid sentence names the rate         | PASS   |
| AC8 | › AC8: note in the Ergebnis region has the new statements (constant marginal rate, paid by Finanzamt, not credited to the depot, no tax advice) and the 013 ones                                                                                | PASS   |

**Runs:** `npm run verify -w apps/avd` green (avd vitest 79 tests, build, check-dist); `npm run test:e2e -w apps/avd` 58 passed (chromium/avd 17 + platform 41).

**Mutation checks** (each reverted, `diff -r src` against the backup clean): 120 EUR floor removed - AC4 and AC5 fail; 1.800 EUR cap removed - AC4 fails (570 EUR); clamp at 0 removed - AC3 fails (23 %); bonus in year 1 removed - AC4 fails (326,80). `Math.round` to `Math.floor` survives the e2e (all AC values are exact cents) and is covered only by the developer's half-cent unit test (44,51 / 356,08), which I did not re-mutate.

**Contrast, layout (throwaway probe, deleted):** refund group on `--color-surface-subtle`: muted text 6.87 light / 6.66 dark (design estimated 6.9 / 7.3; dark is lower than estimated but above 4.5), heading and values 14.62 / 11.95. 320 and 375 px: no horizontal page scroll, every value one line and inside the viewport. Forced colours: group box 1 px solid, net row top border 1 px solid, table column left border 1 px solid (all `CanvasText`-black). Screenshots: `/Users/haraldkuegel/swfactory/screenshots/014/` (light-1280, dark-1280, narrow-320, narrow-375, forced).

**Checked, OK (not kept):** contrast and forced colours as above; 320/375 px layout; rate `30,` / `-0` handled by developer unit tests; the 013 spec still passes with the new column; no `Steuererstattung` text leaks into chart name.

**Defects:** none.

**Regression after review round 1:** test-only changes (findings 1-3, nits 5-8): `avd.spec.ts` imports the shared helpers (no assertion changed), `--color-edge` on `--color-surface-subtle` (non-text) added to the platform `PAIRS` (a mutated pair fails the contrast test, restored), `taxRefund.test.ts` keeps the half-cent, sum-of-rounded-years and rate-sweep tests (floor, clamp, cap, bonus tests removed; e2e AC3/AC4 cover them), `avd-tax-refund.spec.ts` drops AC1's six 013 defaults, the `seen` check and the vacuous AC8 `.resolves.toBeTruthy()`. Developer's new note wording still matches AC8. Runs: `npm run verify` (root) exit 0 - vitest platform 154 (15 files), avd 75 (7 files), minesweeper 95 (12 files), skeleton 5; build and check-dist ok. `npm run test:e2e -w apps/avd`: 58 passed (chromium/avd 17 + platform 41). Unit tests: 4 removed from `taxRefund.test.ts` (79 to 75 in avd); e2e count unchanged (17 avd). The mutated-pair check showed the new pair is evaluated (a bogus pair surface/surface-subtle failed with 1.13:1 light, 1.15:1 dark).

**Manual checks (gate 2, 2026-11-07)**

- Comparing one refund with a real tax assessment or tax software: not run; hak approved the commit without
  answering this check, it stays open.
- iPhone and VoiceOver (open since story 013): still not run, open.

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

**Round 1, reviewer 2026-11-07. Verdict: APPROVED. Checklist version: 2**

| Item | Result | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | AC1 `fields.ts` (`taxRatePct`, default `30`) + `fieldCopy.ts` hint → `InputForm`; AC2 `taxRefund()` → `TaxRefundGroup` (own `section`, outside the depot `dl`); AC3/AC4 `refundCents()` (floor, cap, one `Math.round`, clamp) with `zulageOfYear` incl. bonus; AC5 derived per render, `YearTable` last column, `project()` never reads `taxRateBp`; AC6 `parseInputs` + `refund === null`; AC7 `FIELD_IDS` order + live text; AC8 note. Each traced to its test in `e2e/avd-tax-refund.spec.ts`, all 8 green in my run |
| C2   | n.a.   | no network call or pending state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| C3   | pass   | no new state or effect; `refund` derived in render after `project()`, never fed back; only `useId` added in `TaxRefundGroup`                                                                                                                                                                                                                                                                                                                                                                                            |
| C4   | n.a.   | no render loop or imperative controller                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| C5   | n.a.   | no reducer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| C6   | n.a.   | no I/O or error handling added                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| S1   | pass   | no `dangerouslySetInnerHTML`; the rate text is only echoed into its own `value`; hostile input probed (`1e1`, `0x10`, `Infinity`, `NaN`, `+5`, Arabic digits, `30%`, `3.000`) all `format`, `−0,5` `range`                                                                                                                                                                                                                                                                                                              |
| S2   | n.a.   | no config, env or auth change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| S3   | n.a.   | no `package.json` change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| S4   | n.a.   | no dev-only code; `check:dist` ok for avd                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| S5   | n.a.   | no script, template or generated code touched                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| T1   | pass   | `npm run verify` green (exit 0; unit tests platform 154, avd 79, minesweeper 95; check:dist ok); `npm run test:e2e -w apps/avd` 58 passed = 17 avd (9 of 013 + 8 of 014) + 41 platform, i.e. 013's 50 + 8. The Test report's numbers are mixed up: finding 1                                                                                                                                                                                                                                                            |
| T2   | fail   | findings 5 and 6 (nits)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| T3   | fail   | findings 7 and 8 (nits); otherwise sound: AC oracles exact, AC5 chart check is the "equals" direction on the same element, depot columns compared over all rows                                                                                                                                                                                                                                                                                                                                                         |
| T4   | pass   | AC7 focuses the costs field and presses Tab once (no counted sequence through the page), no coordinates, animations settled before the screenshot, all tests named after ACs                                                                                                                                                                                                                                                                                                                                            |
| T5   | pass   | `refundCents`/`taxRefund` branches (floor, clamp, cap, half-cent rounding, sum of rounded years, bonus) and the rate bounds in `parseInputs.test.ts` are unit-tested                                                                                                                                                                                                                                                                                                                                                    |
| K1   | fail   | finding 2 (duplicated e2e helpers); code matches the design (separate pure module, `zulageOfYear` shared with `project()`); the `TaxRefundGroup` component and the muted `dt` are recorded deviations                                                                                                                                                                                                                                                                                                                   |
| K2   | pass   | no `any`, no `!`; `refundsCents[i] ?? 0` for `noUncheckedIndexedAccess`; named exports; one component per file; test next to `taxRefund.ts`                                                                                                                                                                                                                                                                                                                                                                             |
| K3   | pass   | only existing tokens (all 15 `var(--…)` names resolve in the platform tokens), no colour literal, `CanvasText` only in forced-colours blocks, no transition added; one pair gap in finding 3                                                                                                                                                                                                                                                                                                                            |
| K4   | n.a.   | no platform or factory file changed (agent memory only)                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| K6   | pass   | story `in-review`, index row `in-review`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| K7   | pass   | gate-1 answers and the split are logged; no new decision by hak since                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| K8   | fail   | finding 4 (tech-writer step, follows this review)                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| K9   | pass   | prettier check green in verify                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| K10  | n.a.   | no workspace script or tsconfig changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| K11  | n.a.   | no env variable added                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| A1   | pass   | `<label for>` "Grenzsteuersatz", hint and error in `aria-describedby`, `aria-invalid` only while invalid, `inputMode="decimal"` is right because the range has no negatives (CLAUDE.md "Text inputs with negatives"); refund group is a named region with no tab stops; heading order h2 → h3                                                                                                                                                                                                                           |
| A2   | pass   | group box, net-row top border and column separator are real borders with `CanvasText` in forced colours; net row also weight 700; muted text on subtle is in platform `PAIRS`; edge on subtle passes (3.72 light / 4.71 dark, my computation) but is not pinned, finding 3                                                                                                                                                                                                                                              |
| A3   | pass   | same single polite region, mounted empty, debounce unchanged; no animation added                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| A4   | n.a.   | no render loop or canvas; the chart is unchanged                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

Findings:

1. `[minor] apps/avd/docs/backlog/014-avd-tax-refund.md` (Test report, "Runs") - the counts are mixed up: "154 unit tests" is the platform's vitest count (avd has 79), and "79 passed (avd 21 + platform 58)" is not the e2e result. The real e2e run is 58 = 17 avd + 41 platform, which matches 013's 50 plus the 8 new tests. The story record is the rebuild reference, so the numbers must be right. Fix: correct the line (tester).
2. `[minor] apps/avd/e2e/avd.helpers.ts:7-42` / `apps/avd/e2e/avd.spec.ts:9-45` - twelve helpers (`open`, the six input locators, `figure`, `euro`, `chart`, `tableRows`, `noResult`) now exist twice, word for word, and `balanceCell` duplicates `cellByHeader`. The copies will drift, and 015 has to touch both specs. The design meant the helpers to be moved, not copied. Fix: `avd.spec.ts` imports them from `avd.helpers.ts`; that is an import-only edit with no change to any assertion. Do it now or as the first step of 015. Also drop the unused `/// <reference lib="dom" />` in the helpers file.
3. `[minor] packages/platform/src/styles/tokens.test.ts:47` - the pair `--color-edge` on `--color-surface-subtle` (NON_TEXT) is missing from `PAIRS`. 014 paints it twice: the net-row border inside the box (`TaxRefundGroup.module.css:60`) and the separator of the "Steuererstattung" header cell, whose background is subtle (`YearTable.module.css:61`). That separator is the non-colour boundary cue of UX §6, and 013 already painted the pair (thead border). It passes today (3.72 / 4.71), but no test pins it. Fix: add the pair. It's a platform file, so it needs a one-line platform change in this story or a follow-up.
4. `[minor] apps/avd/README.md`, `CHANGELOG.md` - the README and CHANGELOG don't mention the tax rate input or the refund yet. This is the tech-writer step that follows the review.
5. `[nit] apps/avd/src/features/saving/logic/taxRefund.test.ts:23-37, 55-69` - the floor, clamp, cap and bonus-year tests take the same code paths that e2e AC3 (23 %) and AC4 (9,99 / 570 / age 24) already cover; the tester's mutation table shows the e2e tests catch each of them. The half-cent rounding test, the sum-of-rounded-years test and the sweep are the unique unit value. This is input for the architect: the design's test set listed both levels.
6. `[nit] apps/avd/e2e/avd-tax-refund.spec.ts:41-47` - AC1 checks the six 013 defaults again, which `avd.spec.ts` AC1 already does. Fix: drop the block.
7. `[nit] apps/avd/e2e/avd-tax-refund.spec.ts:86-92` - the `seen` check can't fail: the expected refunds are hard-coded in ascending order, so once every `toHaveText` passes, `seen` is sorted. "Never lowers" is shown by the unit sweep. Fix: drop it, or say in a comment that the unit sweep covers it.
8. `[nit] apps/avd/e2e/avd-tax-refund.spec.ts:260-262` - the last AC8 assertion has nothing to do with the note, and `.resolves.toBeTruthy()` on a Locator is always true (only the `expect` inside `cellByHeader` checks anything). Fix: drop it.
9. `[nit] apps/avd/src/features/saving/ResultSummary.tsx:89-90` - the UX copy "…; sie wird nicht im Depot gutgeschrieben und ist keine Steuerberatung" makes "sie" (the refund) the thing that is no tax advice. Proposed: "… gutgeschrieben. Die Berechnung ist keine Steuerberatung." The AC8 test still matches `keine Steuerberatung`. This is input for the ux-designer.

Checked, OK:

- I checked `taxRefund()` against an exact BigInt integer-cent oracle written independently. It covered 197.248 combinations (monthly 0 to 570 € in 0,37 € steps × children 0/1/3/10 × age 18/24/25/60 × rates 0 to 50 %, including 23,10 / 33,33 / 49,99 %). Year 1, later years, total = sum of rounded years and net all match, with net ≥ 0 and one entry per saving year.
- The AC oracles come out exactly: 442,80 / 3.542,40 / 10.857,60; 0 / 0 / 0,54 / 442,80 / 630,00; 0 / 0 / 15,60 / 39,00 / 442,80; 94,80; 326,80; default 162,00.
- `project()` gives a byte-identical result for rate 0 and rate 50 %.
- Rate parsing accepts `50` / `50,0` / `50,00` / `0,00` / `-0` / `30,` / `,5` / `30.5` (decimal point, as in 013) and rejects `50,001` and everything outside 0 to 50.
- The 013 spec diff only has the positional fixes: `balanceCell` twice, the header list, and the `$` dropped from the live-region regex.
- The agent-memory diffs are one-line rules and role-specific, and every file stays under 100 lines.

## Explanation

New seventh input: the marginal tax rate (default 30 %, one combined rate incl. Soli and church tax).
It shows how much extra income tax the saver gets back each year because contributions are deductible.
Rule (§ 10a EStG, as amended 2026): the tax office deducts own contributions up to 1,800 EUR plus the Zulage,
compares the saving with the Zulage, and refunds only the part above it; below 120 EUR a year there is nothing.
The refund is rounded once per year; the total is the sum of the yearly amounts.
It is shown in its own box "not in the depot", with per year, total and own contributions after the refund,
and as a new last column in the yearly table. The depot figures and the chart do not change with the tax rate.
Reference case at 42 %: 442.80 EUR a year, 3,542.40 EUR in total, own contributions after refund 10,857.60 EUR.
The note now says it is a simplified model with a constant rate, paid by the tax office, and no tax advice.
After review the tests were tidied: shared helpers in one file, fewer duplicate checks, one more contrast check.
Risks: the bonus and child Zulage in the comparison and the Soli/church-tax effect are not confirmed by the law text.
Not verified: a real tax assessment, a real iPhone and a real screen reader.

## Retrospective

### What went wrong

1. **Gate 1 took three rounds and ended in a split.** The draft showed the refund only; hak wanted an optional
   reinvestment into the depot. That touched the depot model, so the story was split into 014 (refund) and 015
   (reinvestment). Root cause: normal scoping at the gate, made cheap by the research done first (new P3 rule of
   story 013); no change proposed.
2. **Review round 1: APPROVED with 4 minor findings and 5 nits.**
   - The Test report mixed up unit and e2e counts (79 unit vs. 58 e2e). Root cause: counts read from a summary,
     not per workspace and Playwright project.
   - The tester created a shared e2e helper file but copied the helpers instead of moving them out of the 013 spec.
     Root cause: no convention for shared e2e helpers.
   - A painted non-text pair (`--color-edge` on `--color-surface-subtle`, used since 013) had no token-test pair.
   - Unit tests repeated what e2e already proves (T2), two e2e checks could never fail, one note sentence was
     grammatically off. All fixed after approval; tester regression PASS (root verify green, avd 75 unit, e2e 58 =
     17 avd + 41 platform).
3. **The new table column broke positional asserts in the 013 spec** (`td.last()`, exact header list, `$`-anchored
   live text). The architect predicted it and the developer fixed it; architect, developer and reviewer each
   suggested the same team rule.
4. **Tech-writer memory:** of seven new lines, one claims "hak asked for it there" (not traceable to a hak decision)
   and one is story-specific (rounding note); both should go.

### Proposed changes

- **P1** `CLAUDE.md`, Independent tests: "e2e specs look up table cells by their column header (header index or
  accessible name), never by position (`last()`, a fixed `nth`, `$`-anchored text), because later stories add
  columns." (architect, developer, reviewer)
- **P2** `CLAUDE.md`, Code layout or test conventions: "An app's shared e2e helpers live in one
  `e2e/<app>.helpers.ts` that every spec imports; never copy them." (reviewer)
- **P3** `.claude/agents/tester.md`: "Report test counts per workspace (vitest) and per Playwright project, exactly
  as printed." (reviewer, tech-writer)
- **P4** `.claude/agent-memory/tech-writer/MEMORY.md`: remove the line about linking follow-up stories "because hak
  asked for it there" and the story-specific rounding line.

**Outcome (gate 2, 2026-11-07):** hak: "Alle, dann committen". P1–P3 applied by `devops`, P4 by `tech-writer`
(haiku); diffs reviewed by the orchestrator.

Not proposed: the tech-writer's CHANGELOG "Added vs Changed" question (one case so far). Other agent-memory diffs
(architect, developer, reviewer, tester, ux-designer, product-owner) checked: correct and role-specific.

### Cost

| Role                        | Round | Model  | Tokens       | Tool uses | Duration |
| --------------------------- | ----- | ------ | ------------ | --------- | -------- |
| general-purpose             | 1     | sonnet | 113982       | 24        | 5:00     |
| product-owner               | 1     | sonnet | 66166        | 17        | 1:54     |
| product-owner               | 2     | sonnet | n/a          | 11        | 1:07     |
| product-owner               | 3     | sonnet | n/a          | 16        | 1:35     |
| architect                   | 1     | opus   | 101196       | 24        | 4:58     |
| ux-designer                 | 1     | sonnet | 62921        | 8         | 1:37     |
| developer                   | 1     | opus   | 117539       | 41        | 5:33     |
| tester                      | 1     | sonnet | 79953        | 14        | 3:48     |
| reviewer                    | 1     | opus   | 126015       | 33        | 4:40     |
| developer                   | 2     | sonnet | 29396        | 4         | 0:29     |
| tech-writer                 | 1     | haiku  | 91084        | 18        | 1:37     |
| tester                      | 2     | sonnet | 50887        | 13        | 1:48     |
| devops                      | 1     | sonnet | 24960        | 7         | 0:22     |
| tech-writer                 | 2     | haiku  | 25546        | 4         | 0:08     |
| total (measured)            |       |        | 889645       | 234       | 34:36    |
| orchestrator (main session) |       | opus   | not measured | n/a       | n/a      |

The general-purpose row is the tax research before the story (primary sources first, per the rule from 013). The
product-owner rounds 2 and 3 cover the gate-1 answer and the split into 014 and 015; part of that work belongs to 015.
