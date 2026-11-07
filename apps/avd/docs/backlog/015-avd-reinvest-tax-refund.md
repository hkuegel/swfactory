---
id: 015
title: Altersvorsorgedepot optional reinvestment of the tax refund
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: avd # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: feature/015-avd-reinvest-tax-refund
supersedes: []
changes: [013/AC1, 013/AC2, 013/AC3, 013/AC4, 013/AC5, 014/AC2, 014/AC3, 014/AC4, 014/AC5, 014/AC8]
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

- Builds on [014](014-avd-tax-refund.md) (tax rate, yearly refund, net own contributions; done) and [013](013-avd-saving-phase-zulagen.md) (saving phase, done). With the checkbox unchecked (default) the app behaves exactly as in 014.
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
- 2026-11-07 — changes: list completed after the architect's check; no change to ACs.
- 2026-11-07 — Orchestrator decision during build: the UX design's optional row 'Ausgezahlt statt angelegt' (UX §10, deviation 2) is not built, because no AC covers it; the refund group has at most three rows while checked.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

Base: the UX designs of [013](013-avd-saving-phase-zulagen.md) and [014](014-avd-tax-refund.md). Everything not named here stays as there (German neutral copy, hints always visible, errors as description without role, focus never moved by the app, `Eingaben` only as the form name, colours from tokens, 600 px breakpoint). With the checkbox **unchecked** every screen, text and token is exactly as in 014; this section describes only what is added or replaced **while checked**.

**Superseded parts of 013 / 014 (only while the box is checked):**

- 013 §1/§2: the depot figures are five, not four; the legend and the table gain one entry / one column.
- 013 §5: the chart has a fourth series; its text alternative gains one part.
- 014 §1/§2: the refund group heading, lead-in, per-year rows and table footnote have checked variants; the row "Eigene Beiträge nach Erstattung" is not shown (2f); the live sentence gains a part; the note gets a checked variant.
- 014 §7: minimum table width 640 px becomes 720 px while checked.
- 014 §10 "room for 015": the reinvested part is **not** a row in the refund group (it is a depot figure and has exactly one place, the result figures); the depot column sits between "Zulagen gutgeschrieben" and "Erträge" (stack order), still before "Kontostand am Jahresende".

### 1. Layout / component tree

```text
SavingCalculator
  section.inputs   <form aria-labelledby=h2 "Eingaben">
    InputForm: seven Field blocks (unchanged, same order as FIELD_IDS)
    ReinvestOption                                       <- NEW, last in DOM order, after "Grenzsteuersatz"
      <input type="checkbox" id=reinvest> + <label for>  "Steuererstattung wieder anlegen"
      p#reinvest-hint (muted)                             aria-describedby of the checkbox
  section.result   h2 "Ergebnis"
    live region (unchanged, mounted empty)
    valid:
      ResultSummary <dl> depot figures
        unchecked: Eigene Beiträge | Zulagen gesamt | Erträge | Endwert
        checked:   Eigene Beiträge | Zulagen gesamt | Reinvestierte Steuererstattung | Erträge | Endwert
      Zulage details <dl aria-label="Zulagen im Detail">  ("Zulage pro Jahr" may show a range, see §2)
      Refund group <section aria-labelledby=h3>
        h3 (checked variant), lead-in p (checked variant)
        dl  "Steuererstattung pro Sparjahr"  (single value or range)
            "Steuererstattung im 1. Sparjahr" (only if bonusCents > 0, as in 014)
            "Steuererstattung gesamt"
            "Ausgezahlt statt angelegt"       (checked only; replaces "Eigene Beiträge nach Erstattung", which is hidden)
        zero hint p (as 014, only if the total refund is 0)
      Note <p> (checked variant)
    invalid: danger callout (013); the checkbox stays in the form, unchanged
  section.chart    legend + SVG with a fourth series while checked
  section.table    h2 "Jahrestabelle": one more column "Wieder angelegt" while checked
```

- Placement: the checkbox block is the **right cell of row 4** of the two-column grid (next to "Grenzsteuersatz", which sits alone in the left cell; the empty cell is used, which also pairs the two tax-related controls). DOM order: after the rate field, so Tab goes rate, then checkbox. Below 600 px it is the next block in the single column. The block has no label above the control: the box (24 px) and its label are one line; the line is at least 44 px high and the whole line (box and label text) is clickable. From 600 px the block is aligned to the input row of its neighbour (top padding = height of the neighbour's label line plus its gap); if that is hard to keep in CSS, top alignment is acceptable.
- The checkbox is outside `FIELD_IDS`; it has no suffix, no error and is never invalid.
- Result figures grid with five cards: 600 to 899 px two columns, "Endwert" spans both columns in the last row (the emphasised card keeps its full-width role); from 900 px three columns: Eigene Beiträge | Zulagen gesamt | Reinvestierte Steuererstattung, then Erträge and "Endwert" spanning two columns. Unchecked layouts stay as in 013 (2 x 2, 4 in a row). Toggling therefore re-flows the figures; nothing else moves focus or scroll. Below 600 px five rows, as the four rows of 013.
- No new shared component. `ReinvestOption` is a feature component next to `InputForm`; the checkbox label/hint copy may live in `fieldCopy.ts` (not a `FieldId`).

### 2. Copy (exact texts)

Checkbox:

| Where                        | Text (exact)                                                                                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Label (the AC text)          | `Steuererstattung wieder anlegen`                                                                                                                                                                        |
| Hint (always visible, muted) | `Angehakt: Die Erstattung eines Sparjahres wird am 1. Januar des Folgejahres ins Depot eingezahlt, höchstens bis 6.840 € Beitrag pro Jahr. Nicht angehakt: Sie bleibt bei der steuerpflichtigen Person.` |

The label string `Steuererstattung wieder anlegen` is on exactly one element (the `label`). The hint does not contain it, nor "Eingaben", nor "Steuererstattung" at all.

Result figures (new or checked variants; unchecked texts as in 013/014):

| Where                                                               | Text (exact)                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fifth depot figure label (`dt`), between Zulagen gesamt and Erträge | `Reinvestierte Steuererstattung` (value e.g. `3.099,60 €`; no sub-line; `0,00 €` when nothing is reinvested)                                                                                                                                                                                                             |
| `Zulage pro Jahr` (value, `dd`)                                     | label unchanged. Value as 013 while unchecked. Checked: if the Zulagen of the years in the set S are not all equal, `{min} bis {max}` (e.g. `150,00 € bis 172,04 €`, `formatEuro` twice, the word "bis" between) plus a muted sub-line `je Jahr verschieden, wegen der Wiederanlage`; else the single value, no sub-line |
| `Steuererstattung pro Sparjahr` (value, `dd`)                       | label unchanged. Checked: same rule over the refunds of S (e.g. `39,00 € bis 44,07 €`) with the same sub-line; else the single value (the reference: `442,80 €`, no range, AC2)                                                                                                                                          |
| Set S                                                               | the saving years 2 … N, plus year 1 when `bonusCents` is 0; when S is empty (N = 1 with bonus) the 014 / 013 single value. Year 1 with the bonus keeps its rows `Zulage im 1. Jahr` and `Steuererstattung im 1. Sparjahr`, as in 014 (year 1 has no reinvestment, so these values equal the unchecked ones)              |
| Refund group heading (`h3`), checked                                | `Vom Finanzamt erstattet, teils wieder angelegt` (unchecked: `Vom Finanzamt erstattet, nicht im Depot`; neither is a substring of the other)                                                                                                                                                                             |
| Lead-in `p` (muted), checked                                        | `Das Finanzamt zahlt diese Beträge an die steuerpflichtige Person aus. Die Erstattung eines Sparjahres wird im Folgejahr ins Depot eingezahlt, soweit die Beitragsgrenze es zulässt; die Erstattung des letzten Sparjahres bleibt bei der steuerpflichtigen Person.`                                                     |
| Extra row (`dt`), checked only                                      | `Ausgezahlt statt angelegt` = refund total minus reinvested part (reference: `442,80 €`: the refund of the last saving year). Always shown while checked, also `0,00 €`                                                                                                                                                  |
| `Eigene Beiträge nach Erstattung`                                   | not rendered while checked (2f)                                                                                                                                                                                                                                                                                          |
| Zero hint                                                           | unchanged (`Keine zusätzliche Steuererstattung bei diesen Eingaben.`), only if the refund total is 0                                                                                                                                                                                                                     |

Note, checked variant (AC6; replaces the 014 note, which stays unchanged while unchecked):

`Hinweis: Die Zahlen sind Modellrechnungen auf Grundlage der eingegebenen Annahmen, keine Anlage- oder Steuerberatung. Es wird angenommen, dass der Anspruch auf die staatliche Zulage besteht. Beträge sind nominal, ohne Inflation. Die Steuererstattung ist vereinfacht mit einem über alle Sparjahre gleichbleibenden Grenzsteuersatz einschließlich Soli und Kirchensteuer berechnet. Das Finanzamt zahlt sie an die steuerpflichtige Person aus, etwa ein Jahr nach dem Beitrag. Angenommen wird, dass die Erstattung jedes Sparjahres am 1. Januar des Folgejahres ins Depot eingezahlt wird; sie zählt dann als Beitrag dieses Jahres, höchstens bis zur Beitragsgrenze von 6.840 € pro Jahr, den Rest behält die steuerpflichtige Person. Die Erstattung des letzten Sparjahres wird nicht wieder angelegt. Die Berechnung ist keine Steuerberatung.`

It still starts with "Hinweis: Die Zahlen sind Modellrechnungen", keeps "keine Anlage- oder Steuerberatung", the Zulage assumption, "Grenzsteuersatz", "Soli", "Kirchensteuer", "Finanzamt", "keine Steuerberatung", states the 1-January payment and the last-year exception, and does not contain "nicht im Depot gutgeschrieben".

Live text (replaces 014 only while checked; unchecked unchanged):

- valid, checked: `Endwert bei Auszahlungsbeginn mit {payoutAge}: {endValue}. Steuererstattung gesamt: {total}. Davon wieder angelegt: {reinvested}.` e.g. `Endwert bei Auszahlungsbeginn mit 65: 25.963,41 €. Steuererstattung gesamt: 3.542,40 €. Davon wieder angelegt: 3.099,60 €.`
- invalid and unchecked-valid: unchanged. Toggling the box sets `edited`; the string changes in both directions (the checked sentence has the extra part even when the reinvested part is 0,00 €), so the debounced region always announces the consequence once, 700 ms after the last toggle.

Chart:

| Where                       | Text (exact)                                                                                                                                                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Legend entry (checked), 3rd | `Reinvestierte Steuererstattung` (order: Eigene Beiträge, Zulagen, Reinvestierte Steuererstattung, Erträge, Verlust)                                                                                                                                                                        |
| `aria-label` (checked)      | `Gestapeltes Säulendiagramm: Kontostand pro Sparjahr bis zum Auszahlungsbeginn mit {payoutAge}, Endwert {endValue}. Davon eigene Beiträge {c}, Zulagen {z}, reinvestierte Steuererstattung {w}, Erträge {r}. Genaue Werte pro Jahr in der Jahrestabelle.` Unchecked: the 013 text unchanged |

Table (checked):

| Where              | Text (exact)                                                                                                                                                                                                                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header, new column | `Wieder angelegt` (between `Zulagen gutgeschrieben` and `Erträge`; cumulative, row 1 `0,00 €`, last row = the reinvested figure). Contains neither "Steuererstattung" nor "Reinvestiert", and no header or label is a substring of it                                                                                                                               |
| Caption            | unchanged (`Entwicklung pro Sparjahr, kumuliert; Steuererstattung je Jahr`, still true)                                                                                                                                                                                                                                                                             |
| Footnote, checked  | `Zulagen eines Jahres werden im Folgejahr gutgeschrieben. Die letzte Zulage ist im Endwert enthalten, ohne weitere Erträge. Die Steuererstattung eines Jahres wird am 1. Januar des Folgejahres eingezahlt und steht dann kumuliert in der Spalte zur Wiederanlage und im Kontostand; die Spalte Steuererstattung zeigt sie im Jahr des Beitrags, nicht kumuliert.` |

Copy rules:

- Exact-match lookups as in 014: `Steuererstattung wieder anlegen` (checkbox by role), `Reinvestierte Steuererstattung` (figure `dt` and legend item; same string twice by design, like "Eigene Beiträge"), `Steuererstattung gesamt` etc. Do not use non-exact `getByText('Steuererstattung')`.
- "nicht wieder angelegt" appears only in the note (lower case, as part of a sentence); no label contains it (hence the row `Ausgezahlt statt angelegt`).
- "Eingaben" appears in none of the new texts.

### 3. States

| View                            | State                         | What the user sees / can do                                                                                                                                                                             |
| ------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkbox                        | Unchecked (default) / checked | Native box with check glyph. Hint always visible. Never disabled, never invalid, no error. Keeps its state while any text field is invalid and when the result is replaced by the no-result hint (AC5). |
| Checkbox                        | Focused                       | 2 px `--color-focus` outline, offset 2 px, around box and label.                                                                                                                                        |
| Whole page                      | Loading                       | None (synchronous); initial render unchecked = 014. Live region empty until the first edit or toggle.                                                                                                   |
| Result                          | Checked, valid                | Five figures, refund group (checked variant), note (checked variant). Reinvested part may be `0,00 €` (rate 0, tiny contribution, one saving year, cap reached): shown, not hidden, not an error.       |
| Result                          | Checked, invalid              | Like 013: everything incl. refund group, chart, table removed; callout in `Ergebnis`; checkbox unchanged and operable; on fix the checked result returns.                                               |
| Refund group                    | Checked, refund total 0       | Rows `0,00 €`, `Ausgezahlt statt angelegt` `0,00 €`, plus the zero hint.                                                                                                                                |
| Zulage / refund per-year values | Checked, vary                 | Range `{min} bis {max}` with the muted sub-line; equal values: single value.                                                                                                                            |
| Chart                           | Checked                       | Fourth series and legend entry also when its height is 0 (AC5: shown as 0,00); the segment has zero height then and is invisible, the legend entry stays.                                               |
| Table                           | Checked                       | Column "Wieder angelegt" (cumulative); depot columns add up to the balance in every row.                                                                                                                |
| Toggle                          | Check, uncheck                | Figures, group, chart, table, note update immediately (no submit, no delay); layout of the figures and one table column change; focus stays on the checkbox.                                            |

### 4. Interactions

- Space toggles the focused box; a click on the box or on the label text toggles it (native `label for`). Enter does nothing (no submit; the form has no submit button). The change event updates state; recompute is synchronous.
- Focus never moves: after toggling, focus stays on the checkbox (the DOM node is never replaced; the component keeps one stable `<input>`).
- Tab order: seven fields, checkbox, then the table scroll wrapper (while a result exists).
- Announcement: the checkbox announces its own new state natively; the consequence is announced once by the existing live region (sentence in §2) after the debounce. No extra region, no `role=status/alert`, and no region is mounted by the toggle.
- No tooltip, no popover, no confirmation. Nothing else on the page is disabled by the checkbox.

### 5. Chart: fourth series

Order bottom to top: contributions, Zulagen, **reinvested**, returns (as the table columns and figures). Looks, in addition to 013 §5:

| Series                         | Fill style                                                                                                                                                                                                                          | Outline                                                                       | Tokens                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Reinvestierte Steuererstattung | heavy horizontal stripes: 75 % series colour / 25 % surface, period 8 units of the 100-unit plot height (Zulagen: 50 % / 50 %, period 4); `<pattern>` with `useId`-based id, `patternUnits="userSpaceOnUse"`, horizontal rules only | 2 px solid `--chart-reinvested`, `vector-effect: non-scaling-stroke` (framed) | stripes `--chart-reinvested` on `--color-surface`; new token |

- Shape cue (not colour): heavy, coarse stripes inside a drawn frame. It differs from solid (contributions: no stripes, no frame), from fine 50 % stripes without a frame (Zulagen), and from hollow (returns: pale fill, frame, no stripes) and dashed (loss). Horizontal rules only, because the plot has `preserveAspectRatio="none"` (013 §5); a dot or diagonal pattern would be sheared. Honest limit: Zulagen vs reinvested differ mainly by stripe pitch and weight plus the frame; the legend swatches (16 x 16 px, same patterns, 1 px `--color-edge` frame around the swatch) and the order help. The tester checks both at 375 px and in forced colours.
- Forced colours: stripes `CanvasText` on `Canvas`, 75 % / 25 %, outline `CanvasText` 2 px solid; Zulagen stripes stay as in 013 (no frame). The swatch follows the same rule.
- Segment of height 0 (reinvested 0,00 € while checked): not drawn; legend entry stays so the legend does not change with the value.
- Unchecked: no segment, no legend entry, SVG identical to 014 (pixel series for it 0).
- Text alternative: §2 `aria-label`; all inner content stays `aria-hidden`; the legend (real text) is read.

### 6. Accessibility

- Semantics: `<input type="checkbox" id="reinvest">` with `<label for="reinvest">Steuererstattung wieder anlegen</label>` (accessible name = exactly that); `aria-describedby="reinvest-hint"` (hint `<p id>`); no `aria-checked` (native); no `role=switch`. Checkbox inside the `form` named "Eingaben". Role `checkbox` with that name is unique on the page.
- Target size: the label row is at least 44 px high and clickable in full (WCAG 2.2 target size AA and enhanced); box 24 px.
- Keyboard: Tab and Shift+Tab reach it between "Grenzsteuersatz" and the table wrapper; Space toggles. Nothing traps; no counted tab sequences needed in tests (focus the rate field, one Tab).
- Live announcements: the single existing polite region, mounted empty; the toggle sets `edited`; clear-then-set is not needed because the checked/unchecked strings always differ. A toggle back within 700 ms of the previous string yields no announcement, which is intended (nothing changed).
- Hint and label are plain text outside any live region. The new refund-group texts, sub-lines and the note are plain text read in reading order.
- Colour is never the only cue: checkbox state is the check glyph; chart series per §5; sub-line text carries "verschieden" instead of an icon.
- Contrast: only existing text pairs; new chart colour in §8.
- Forced colours: native checkbox is drawn by the browser (`ButtonText`/`Highlight`); `accent-color` is ignored there, the glyph and border stay. Chart per §5. The refund group box border and row border stay real borders (014).
- Zoom / reflow: 320 px and 400 %: checkbox block full width; the label and hint wrap; page does not scroll sideways; only the table wrapper scrolls.

### 7. Responsive behaviour

| Aspect                | 600 px and wider                                                                                | Below 600 px                                                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkbox block        | right cell of row 4 next to "Grenzsteuersatz"; hint under the label, `--text-sm`, muted         | own block after "Grenzsteuersatz"; label and hint wrap; same 44 px row                                                                            |
| Figures (5 cards)     | 600 to 899 px: 2 columns, Endwert spans both; from 900 px: 3 columns, Endwert spans two columns | five rows, label left (may wrap to two lines, "Reinvestierte Steuererstattung"), value right, never wraps; Endwert row emphasised                 |
| Per-year range values | one line; sub-line below the value                                                              | label left, value right; value never wraps ("150,00 € bis 172,04 €" fits at 320 px), sub-line under the value, right-aligned or wrapping under it |
| Refund group          | as 014 plus one row                                                                             | as 014 plus one row                                                                                                                               |
| Chart legend          | wraps; four or five items                                                                       | wraps to two lines                                                                                                                                |
| Table (checked)       | fits when it can                                                                                | wrapper scrolls, min table width **720 px** (eight columns; 640 px unchecked), `Jahr` sticky as before; header `Wieder angelegt` may wrap         |

Tested widths: 375 px (primary), 320 px (no sideways page scroll with the box checked), 1280 px.

### 8. Dark mode and tokens

One new token in `apps/avd/src/tokens.css`, opaque hex with a dark value; `PAIRS` entry `['--chart-reinvested', '--color-surface', NON_TEXT]` (3:1). Contrast computed by hand (sRGB linearisation; no shell), against `--color-surface` (light `#ffffff`, dark `#1b1f26`); the tester re-checks with a tool. Margins over 3:1 are large (no value is tight).

| Token                | Light     | Dark      | Use                                          | Contrast vs surface (light / dark) | Rule |
| -------------------- | --------- | --------- | -------------------------------------------- | ---------------------------------- | ---- |
| `--chart-reinvested` | `#a21caf` | `#f0abfc` | stripes and 2 px frame of the series, swatch | about 6.3 / about 9.4              | 3:1  |

Hue choice: fuchsia sits between blue (contributions) and red (loss) without being near either; luminance differs from amber and green, and from the blue (`#1d4ed8`). The series is also told apart by shape (§5), so a colour-blind user is not left with hue only. Stripes: dark mode uses the light colour on the dark surface (stripe and gap both visible), as in 013.

Other new elements use existing tokens:

| Element                                                                   | Light                                                                                        | Dark                                                   | Contrast                                                                                                                                                                                     |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkbox label                                                            | `--color-text` `#1b1f24` on `--color-surface`                                                | `#e8eaed` on `#1b1f26`                                 | above 15 / above 13                                                                                                                                                                          |
| Checkbox hint, sub-lines under range values                               | `--color-text-muted` `#4a5360` on surface (sub-lines: on the figure's surface)               | `#a9b1bd`                                              | about 7.8 / 8.5 (as 013; on `--color-surface-subtle` about 6.9 / 7.3, pair already tested)                                                                                                   |
| Checkbox box and check                                                    | `accent-color: var(--color-focus)` `#1d4ed8` (checked fill); unchecked border by the browser | `#a8c7fa`; browser draws a light border in dark scheme | checked fill about 6.7 / 8.9; unchecked border must give UI 3:1, the tester verifies on both schemes (if the browser border is weaker, the developer draws its own border in `--color-edge`) |
| Focus outline                                                             | `--color-focus`                                                                              | `--color-focus`                                        | about 6.7 / 8.9                                                                                                                                                                              |
| Fifth figure card, extra refund row, legend text, table cells, new column | as the neighbouring figures / rows / cells                                                   | same                                                   | as 013 / 014                                                                                                                                                                                 |
| Live region                                                               | visually hidden, no colour                                                                   | same                                                   | n/a                                                                                                                                                                                          |

### 9. Table detail (addition to 013 §9 and 014 §9)

| Column          | Content                                              | Alignment | Notes                                                                                                                                                                                                  |
| --------------- | ---------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Wieder angelegt | cumulative reinvested refund credited up to the year | right     | only while checked; between `Zulagen gutgeschrieben` and `Erträge`; row 1 `0,00 €`; last row equals the figure `Reinvestierte Steuererstattung`; tabular numbers; no separator border (a depot column) |

Column order while checked: `Jahr`, `Alter`, `Eigene Beiträge`, `Zulagen gutgeschrieben`, `Wieder angelegt`, `Erträge`, `Kontostand am Jahresende`, `Steuererstattung` (non-depot, with its left border). The four depot columns before the balance add up to it; tests look cells up by header text, not by position.

### 10. Points for the architect

- **Alignment with the Technical design:** the figure label, legend and `aria-label` wording follow it ("Reinvestierte Steuererstattung", "reinvestierte Steuererstattung"); placement of the figure between Zulagen and Erträge; checkbox label from the AC.
- **Deviation 1, "per year" figures:** the technical design proposed labelling them "for saving year 1" plus a muted line. Instead the labels stay (`Zulage pro Jahr`, `Steuererstattung pro Sparjahr`, so AC2's per-year check and every 013/014 lookup work unchanged) and the value becomes `{min} bis {max}` over the set S of §2 when the years differ, with a muted sub-line. Needs `projection.schedule[i].zulageCents` and `.refundCents` (both in the design). A different wording is only a copy change.
- **Deviation 2, new row:** `Ausgezahlt statt angelegt` (refund total minus the reinvested total) while checked; not in the ACs, cheap, optional: drop it if you prefer, then the group has three rows. It replaces the hidden net row.
- **Deviation 3, table column position:** the depot column sits before `Erträge` (stack order), not directly before the balance; header lookups make this safe.
- **Deviation 4, figure grid:** five cards need 2/3-column layouts with a spanning Endwert card (§1).
- **New behaviour:** the live sentence gains `Davon wieder angelegt: {x}.` while checked (the unchecked 014 string and its `$`-anchored test are unchanged); the model note, group heading, lead-in and table footnote have checked variants (§2); heading `Vom Finanzamt erstattet, teils wieder angelegt`.
- **Token test:** add `['--chart-reinvested', '--color-surface', NON_TEXT]`; no other pair is new.
- **Chart:** pattern/outline and forced-colours rules of §5; `chartSeriesPixels().reinvested` must sample the stripe colour (75 % coverage, so more than 50 pixels is safe at the reference).
- **Tests:** checkbox by `getByRole('checkbox', { name: 'Steuererstattung wieder anlegen' })`; figures by anchored `dt`; table cells by header text; do not assert the hint, the sub-line or the lead-in beyond the AC statements (copy may be adjusted).
- **Open for the product owner:** none. The extra row and the range reading are interpretations of the settled decisions, not new scope.
- **Prettier:** the tables in this section were written without a shell; run `npx prettier --write` on this story file.

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

**ADR:** new [ADR 0008](../adr/0008-avd-yearly-contribution-schedule-with-reinvested-refund.md) (yearly
integer schedule computed before the balance loop; Grundzulage rounded once to the cent), which amends
[ADR 0007](../adr/0007-avd-projection-model-and-svg-chart.md). No new dependency, no platform change, no
dev-only code.

### Overview

The feedback loop of the story (R(n) → c(n+1) → Z(n+1) → R(n+1)) never involves the depot balance. So a new
pure function `savingSchedule()` first computes, per saving year, own contribution, reinvested refund, c, Z and R
in integer cents; `project()` then compounds the balance from that schedule instead of from one constant Zulage.
Unchecked, the schedule has reinvested = 0 and c = 12 · monthly, so `project()` does exactly the float operations
of 013/014 and every figure is identical by construction (AC1). `taxRefund()` reads its yearly refunds from the
schedule, so Zulage, refund and depot have one source. The checkbox is one boolean in `SavingCalculator`, outside
the text-field machinery (`FIELD_IDS`, `parseInputs`), so an invalid text field can't touch it (AC5). The result,
table and chart get a fourth depot part "reinvested refund" only while the box is checked.

### Model (story Context, settled; recomputed in the scratchpad)

Per saving year n = 1 … N, own = 12 · monthly cents, CAP = 684.000 cents, t = rate in basis points:

- reinvested(1) = 0; for n >= 2: reinvested(n) = checked ? min(R(n−1), CAP − own) : 0 (`CAP − own` >= 0, because
  monthly <= 570 EUR). R(N) is never reinvested (there is no year N+1).
- c(n) = own + reinvested(n) (<= CAP); Z(n) = `zulageOfYear(zulage(c(n), children, age), n)` (bonus in year 1
  only, and year 1 has no reinvestment); R(n) = `refundCents(c(n), Z(n), t)` (014, unchanged).
- Balance: at the start of year n, `balance += reinvested(n)` (1 January, before the first monthly contribution, so
  it earns 12 months); then the 013 month loop with Z(n−1) credited at the end of January and Z(N) at payout start.
- Rows: `reinvestedCents` cumulative (row 1 = 0, last row = Σ reinvested(2…N)); returns = balance − own − Zulagen −
  reinvested, so the four parts sum exactly to the rounded balance (ADR 0007/0008).
- **New rounding:** c(n) is not a multiple of 12 any more (300,00 + 44,07 EUR), so the Grundzulage can have half or
  quarter cents (c = 344,07 → 172,035 EUR). `zulage()` rounds the Grundzulage once with `Math.round` (half up,
  ADR 0008); for c = 12 · monthly it is a no-op. Kinderzulage (k · min(c, 300)) stays whole cents.

Recomputed with the real `zulage.ts`/`refundCents()` plus this schedule (throwaway script, not kept):

| Case                                 | Result                                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC2 reference, 42 %, checked         | own 14.400,00, Zulagen 4.320,00, reinvested 3.099,60 (7 × 442,80), returns 4.143,81, **end 25.963,41**; R(n) 442,80 each, total 3.542,40 — match |
| AC2 unchecked                        | 22.256,44, equal to the current `project()`                                                                                                      |
| AC3 age 40, 25 EUR, 42 %, checked    | year 1: c 300,00, Z 150,00, R 39,00; year 2: c 339,00, Z **169,50**, R **44,07**; table row 3 Zulagen 319,50 (= 150,00 + 169,50) — match         |
| AC3 570 EUR                          | reinvested 0,00 every year (CAP − own = 0), end 333.868,97 checked = unchecked — match                                                           |
| AC5 rate 0 / 9,99 EUR / age 69 to 70 | reinvested 0,00, end values identical to unchecked (22.256,44 / 1.146,33 / 2.376,63)                                                             |
| Defaults (30 %), checked             | reinvested 3.888,00, end 112.502,32 (unchecked 105.469,31)                                                                                       |
| Timing variant check                 | reinvesting at the end of January instead of 1 January gives 25.949,91, so the AC2 oracle tells the timing apart                                 |
| Sweep, 4.050 input sets, unchecked   | every row's balance and Zulagen identical to the current `project()`; checked: c <= CAP, no negative or non-integer part                         |

### Files

| Path (below `apps/avd/`)                              | Change                                                                                                                                                     |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/saving/logic/zulage.ts` (+ test)        | Grundzulage rounded once (`Math.round`); doc comment: c need not be a multiple of 12 any more                                                              |
| `src/features/saving/logic/schedule.ts` (+ test, new) | `savingSchedule(inputs, reinvestRefund)`: per saving year own, reinvested, c, Z, R in integer cents; owns the 6.840 EUR cap constant                       |
| `src/features/saving/logic/project.ts` (+ test)       | `project(inputs, options?)`: consumes the schedule; `YearRow.reinvestedCents`; `Projection.schedule`; returns now minus reinvested                         |
| `src/features/saving/logic/taxRefund.ts`              | `byYearCents`/`totalCents` from `projection.schedule[i].refundCents` instead of recomputing with a constant c; `perYearCents`/`firstYearCents` unchanged   |
| `src/features/saving/logic/chartGeometry.ts` (+ test) | `Series` + `'reinvested'`, stacked between Zulagen and returns; `paid` and the scale max include reinvested                                                |
| `src/tokens.css`, `src/tokens.test.ts`                | `--chart-reinvested` (light + dark, value from UX); pair `['--chart-reinvested', '--color-surface', NON_TEXT]`                                             |
| `src/features/saving/SavingCalculator.tsx`            | `const [reinvest, setReinvest] = useState(false)`; passes it to `project()`, form, result, chart, table; toggling sets `edited`                            |
| `src/features/saving/InputForm.tsx` (+ css)           | props `reinvest`, `onReinvestChange`; native `<input type="checkbox">` with `<label>` inside the form, after the seven fields (placement and copy from UX) |
| `src/features/saving/ResultSummary.tsx`               | prop `reinvest`; fifth depot figure "Reinvestierte Steuererstattung" (only while checked, between Zulagen and returns); note variant (AC6)                 |
| `src/features/saving/TaxRefundGroup.tsx`              | prop `reinvest`: net row hidden while checked (2f); heading/lead-in variant from UX (the 014 copy says "nicht im Depot")                                   |
| `src/features/saving/YearTable.tsx` (+ css)           | prop `reinvest`: cumulative column for the reinvested refund among the depot columns, before "Kontostand am Jahresende"; caption/footnote variant from UX  |
| `src/features/saving/BalanceChart.tsx` (+ css)        | prop `reinvest`: legend entry and `aria-label` part for the reinvested series while checked; series style (with a non-colour shape cue) from UX            |
| `e2e/avd.helpers.ts`                                  | add `reinvestBox`; move `cents()` and `chartSeriesPixels()` here from `avd.spec.ts` (series list extended by `reinvested`)                                 |
| `e2e/avd.spec.ts`                                     | import-only change for the two moved helpers; no assertion changes                                                                                         |
| `e2e/avd-reinvest.spec.ts` (new)                      | one test per AC of 015 (rebuild oracle)                                                                                                                    |

`fields.ts`, `parseInputs.ts`, `fieldCopy.ts`, `format.ts` stay unchanged (the checkbox is not a text field).

### Key types

```ts
// logic/schedule.ts
/** The flows of one saving year (story 015 Context), integer cents. */
export interface ScheduleYear {
  /** 1-based saving year. */
  readonly year: number;
  /** 12 · monthly contribution. */
  readonly ownCents: number;
  /** Refund of the previous year paid in on 1 January; 0 in year 1 and while unchecked. */
  readonly reinvestedCents: number;
  /** c(n) = own + reinvested, <= 684.000. */
  readonly contributionCents: number;
  /** Z(n) from c(n), incl. the bonus in year 1; credited in January of the next year (last: at payout). */
  readonly zulageCents: number;
  /** R(n) = refundCents(c(n), Z(n), t). */
  readonly refundCents: number;
}
export function savingSchedule(inputs: Inputs, reinvestRefund: boolean): readonly ScheduleYear[];

// logic/project.ts
export interface ProjectOptions {
  readonly reinvestRefund: boolean;
}
export interface YearRow {
  // … the 013 fields …
  /** Cumulative reinvested refund credited (row 1: 0). */
  readonly reinvestedCents: number;
  /** balance − contributions − Zulagen − reinvested (may be negative). */
  readonly returnsCents: number;
}
export interface Projection {
  /** Zulage of c = 12 · monthly (year 1, the Zulage details of 013). */
  readonly zulage: Zulage;
  /** One per saving year, index = year − 1. */
  readonly schedule: readonly ScheduleYear[];
  readonly years: readonly YearRow[];
  readonly total: YearRow;
}
/** Default `{ reinvestRefund: false }` keeps every 013/014 call and test unchanged. */
export function project(inputs: Inputs, options?: ProjectOptions): Projection;

// logic/chartGeometry.ts
export type Series = 'contributions' | 'zulagen' | 'reinvested' | 'returns';

// components (new props only)
interface InputFormProps {
  /* … */ readonly reinvest: boolean;
  readonly onReinvestChange: (checked: boolean) => void;
}
interface ResultSummaryProps {
  /* … */ readonly reinvest: boolean;
}
interface TaxRefundGroupProps {
  /* … */ readonly reinvest: boolean;
}
interface YearTableProps {
  /* … */ readonly reinvest: boolean;
}
interface BalanceChartProps {
  /* … */ readonly reinvest: boolean;
}
```

Explicit `reinvest` props instead of "reinvested > 0": while checked, column, series, legend entry and figure are
shown even when the reinvested part is 0,00 (AC5 "shown as 0,00 EUR"); unchecked, they are absent (AC1, AC4).

### Data flow and state

- State: `SavingCalculator` owns the seven raw texts, `edited` and the new `reinvest` boolean (default `false`,
  2d). The checkbox is never disabled and keeps its state while the text fields are invalid (AC5).
- Derived per render: `parsed` → `projection = project(parsed.inputs, { reinvestRefund: reinvest })` →
  `refund = taxRefund(parsed.inputs, projection)`; both `null` when parsing fails, so the no-result hint of 013
  shows and nothing with a NaN or negative amount can render (AC5).
- Toggling the box calls `setReinvest` and `setEdited(true)`: the end value changes, so the live region announces
  it after the 700 ms debounce (013/AC7 "after an edit"). The live sentence stays the 014 one unless UX adds a part
  for the checked state.
- AC2's "refund figures unchanged": `taxRefund().totalCents` is Σ R(n) over all years including R(N), regardless of
  how much was reinvested; with c capped at 1.800 EUR for the deduction and Z at its maximum, R stays 442,80.

### Result, table, chart, note (content; layout and exact copy from UX)

- **Result:** while checked, the depot `dl` shows five rows: own contributions, Zulagen, reinvested refund (label of
  2b, "Reinvestierte Steuererstattung", final from UX), returns, end value; the net row of the refund group is
  hidden (2f). Unchecked: as 014.
- **Table:** while checked, a cumulative column for the reinvested refund among the depot columns, before
  "Kontostand am Jahresende"; the 014 refund column stays last and per year. Depot columns then sum to the balance
  per row (AC4).
- **Chart:** fourth series stacked contributions → Zulagen → reinvested → returns; legend entry and `aria-label`
  part (e.g. "… Zulagen X, reinvestierte Steuererstattung Y, Erträge Z.") only while checked. Unchecked the
  segment has zero height and is omitted, so the SVG is identical to 014. The series needs a non-colour cue that
  differs from solid / stripes / hollow / dashed (013 UX §5), e.g. a dot or cross-hatch pattern like the Zulagen
  stripes (own `useId`-based pattern id); forced-colours rules as for the stripes.
- **Note (AC6):** checked: the refund of each saving year is paid into the depot on 1 January of the following
  year; the refund of the last saving year is not reinvested (and the part above 6.840 EUR stays with the saver);
  all other 014/AC8 statements stay; "nicht im Depot gutgeschrieben" only while unchecked.

### Minimal test set

e2e, new file `e2e/avd-reinvest.spec.ts`, one test per AC; AC-listed values only here; table cells only via
`cellByHeader`/`columnTexts`; the box via a `reinvestBox(page)` helper (`getByRole('checkbox', { name })`):

| AC  | e2e test                                                                                                                                                                                                                                                                                                                                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 | box visible, unchecked, accessible name; record the four depot figures, the net figure, all table texts and a chart screenshot; focus the rate field, one Tab → box focused, Space → checked and the end value changes, reinvested figure appears; Space → unchecked and figures, net row, every table text and the chart screenshot equal the recorded ones; no reinvested figure |
| AC2 | reference at 42 %: unchecked end 22.256,44; check → 14.400,00 / 4.320,00 / 3.099,60 / 4.143,81 / 25.963,41; the four parts parsed from the page sum to the end value; net figure count 0; per year 442,80 and total 3.542,40                                                                                                                                                       |
| AC3 | age 40, 42 %, checked, 25 EUR: refund column row 1 39,00 and row 2 44,07; Zulagen column row 3 minus row 2 = 169,50 (unchecked: 150,00); 570 EUR: reinvested 0,00 and the end value equals the one read after unchecking                                                                                                                                                           |
| AC4 | checked, reference: reinvested column exists, last row = reinvested figure, own + Zulagen + reinvested + returns = balance in every row (by header); legend item and chart name contain the series; `chartSeriesPixels().reinvested` > 50; one input change updates figure, last row and chart name; unchecked: header list as in 014, no legend item, pixels of the series 0      |
| AC5 | checked: rate 0, monthly 9,99, age 69 / payout 70 → reinvested 0,00 and end value equal to the unchecked one (toggle and compare); then an invalid field → no-result hint, box still checked, body without `NaN`/`Infinity`/negative amount; fixing it restores the result with the reinvested figure                                                                              |
| AC6 | checked: the note in "Ergebnis" contains the 1-January sentence, the last-year sentence and the 014/013 statements, and not "nicht im Depot gutgeschrieben"; unchecked: contains it again                                                                                                                                                                                          |

The 013 and 014 specs run unchanged with the box unchecked and remain the oracle for "unchecked equals 014" (AC1).

Unit (branching logic, inputs other than the AC values):

1. `zulage.test.ts`: Grundzulage rounding once, half up: c = 1.000,02 EUR → 340,01 EUR (exact 340,005), c = 1.000,01
   EUR → 340,00 (340,0025). The existing "every monthly contribution gives whole cents" test stays.
2. `schedule.test.ts` (new): partial cap — 545 EUR per month, 0 children, 42 %, age 57 to 65, checked:
   reinvested 300,00 EUR in years 2 to 8 (CAP − 6.540), c = 6.840,00, R stays 442,80, R(8) not reinvested; sweep
   (ages 18/24/40/69, monthly 0/9,99/10/25,01/150/545/570 EUR, children 0/1/10, rates 0/23,10/42/50 %): c(n) <=
   684.000, 0 <= reinvested(n) <= R(n−1), unchecked has reinvested 0 and c = own, every value a safe integer.
3. `project.test.ts`: the existing "rows add up" test includes `reinvestedCents` and runs every oracle case also
   with `{ reinvestRefund: true }` (row 1 reinvested 0; checked end value >= unchecked end value). The closed-form
   tests stay unchanged (unchecked default).
4. `chartGeometry.test.ts`: one case with `{ reinvestRefund: true }`: series order contributions, zulagen,
   reinvested, returns, last segment ends at the balance fraction.

No component tests (e2e shows every rendered figure); `taxRefund.test.ts` and `useSettledValue.test.ts` unchanged.

### Implementation plan

1. `zulage.ts`: `Math.round` on the Grundzulage + unit test. All tests green (no-op for current inputs).
2. `schedule.ts` + test; `project.ts` consumes it (`options` default unchecked), `YearRow.reinvestedCents`,
   `Projection.schedule`; `taxRefund.ts` reads the schedule. 013/014 unit tests must stay green unchanged
   (apart from the extended rows-add-up test).
3. `chartGeometry.ts` + test; token and `PAIRS` entry.
4. Components: `SavingCalculator` state and wiring, checkbox in `InputForm`, fifth figure and note in
   `ResultSummary`, `TaxRefundGroup` variant, `YearTable` column, `BalanceChart` series/legend/label (UX copy).
5. e2e: helper moves, `avd-reinvest.spec.ts`. `npm run verify -w apps/avd` and `npm run test:e2e -w apps/avd` green;
   check 320/375/1280 px with the box checked (one more column).

### Existing e2e specs

- No spec walks `parentElement` / `locator('..')`.
- Positional asserts that would break if they ran with the box checked, all in `avd.spec.ts` 013/AC5:
  `lastRow.locator('td').allInnerTexts()` + `cells.slice(1)` destructured as own/Zulagen/returns/balance, the exact
  `columnheader` list, and `tableRows(...).first().locator('td').nth(2)`. They run unchecked, so they stay valid;
  the new spec must not copy them (header lookups only).
- `avd-tax-refund.spec.ts` asserts the region name "Vom Finanzamt erstattet, nicht im Depot", `NET` and a
  `$`-anchored live sentence — all unchecked, unaffected.

### Risks

1. **Unchecked drift from 014** — the schedule must produce reinvested 0 and c = 12 · monthly when unchecked;
   adding 0 to the balance is exact. Mitigation: 013/014 unit and e2e tests unchanged and green (scratchpad sweep: 0
   differences over 4.050 input sets).
2. **Fractional Grundzulage** — without the `Math.round`, Z gets half cents and `base · t` stops being an integer.
   Mitigation: unit test 1; it changes no current result.
3. **Timing off by one** — reinvesting at the end of January (with the Zulage) or into row n instead of row n+1.
   The AC2 end value tells end of January apart (25.949,91); the table row semantics (row n+1 holds reinvested(n+1))
   follow from adding it at the start of the year.
4. **Cap** — reinvesting R(n) in full at 545 EUR would push c above 6.840 EUR. Unit test 2 (partial) and AC3 (570 EUR,
   full).
5. **Copy that becomes false when checked** — the refund group heading/lead-in ("nicht im Depot", "nicht im Endwert
   enthalten"), the table footnote ("nicht im Kontostand enthalten") and the note. Each needs a checked variant
   from UX; AC6 tests the note.
6. **"Per year" figures when checked** — with c < 1.800 EUR, Zulage and refund grow from year to year (AC3: 150,00 →
   169,50 → 172,04 …), but "Zulage pro Jahr" and "Steuererstattung pro Sparjahr" show one value (that of c = 12 ·
   monthly). UX decides how they are labelled while checked; see Alignment with UX.
7. **Fourth chart series in forced colours** — needs its own shape cue; pixel check in AC4.
8. **Label collisions** — new figure, column and checkbox texts contain "Steuererstattung"; tests use exact labels,
   `figure()` (anchored `dt`) and header lookups.

### Alignment with UX

The UX section was empty when this was written. Open points for the ux-designer:

- Checkbox label (story: "Steuererstattung wieder anlegen"), hint if any, and placement (after the rate field; the
  right cell of row 4 is free).
- Labels of the fifth figure and the table column (different strings, none a substring problem for `exact` lookups).
- Checked-state copy for the refund group heading and lead-in, the table caption/footnote and the note (AC6).
- How "Zulage pro Jahr" and "Steuererstattung pro Sparjahr" read while checked when later years differ. Proposal:
  label them for saving year 1 and add a muted line that later years are higher because the reinvested refund counts
  as a contribution, values per year in the table. The data offers `projection.schedule` (Z and R per year), so a
  range or another wording works as well.
- Chart series look (token, pattern, forced colours), legend text and `aria-label` wording; live-region sentence
  while checked (unchanged 014 sentence is enough for the ACs).
- Table minimum width with one more column.

## Implementation notes

_developer: what was built, deviations from the design and why._

**Built (all below `apps/avd/`):**

- `logic/zulage.ts`: the Grundzulage is rounded once with `Math.round` (ADR 0008); no change for c = 12 · monthly.
- `logic/schedule.ts` (new): `savingSchedule(inputs, reinvestRefund)` gives own, reinvested, c, Z and R per saving
  year in integer cents, with `CONTRIBUTION_CAP_CENTS` (6.840 EUR). Also `perYearRange()` for the "per year"
  ranges of UX §2 (set S: years 2 … N, plus year 1 without the bonus; `null` when S is empty).
- `logic/project.ts`: `project(inputs, options = { reinvestRefund: false })` takes Zulagen and reinvested
  amounts from the schedule and adds the reinvested refund on 1 January, before the first monthly contribution.
  New `YearRow.reinvestedCents` (cumulative) and `Projection.schedule`; returns = balance − own − Zulagen −
  reinvested.
- `logic/taxRefund.ts`: refunds per year from the schedule's c(n) and Z(n) (see deviation 1).
- `logic/chartGeometry.ts`: series `reinvested`, stacked between Zulagen and returns; `paid` and the scale
  maximum include it.
- Components: `ReinvestOption.tsx` (new; the checkbox, rendered by `InputForm` in the right cell of row 4;
  copy in `fieldCopy.ts` as `REINVEST_COPY`), `PerYearValue.tsx` (new; one amount, or `{min} bis {max}` with the
  sub-line). `SavingCalculator` owns `reinvest` (toggling sets `edited`) and adds "Davon wieder angelegt: …"
  to the live sentence while checked. `ResultSummary`: fifth figure, Zulage range, checked note.
  `TaxRefundGroup`: checked heading, lead-in and refund range; net row hidden while checked (2f).
  `YearTable`: column "Wieder angelegt" between "Zulagen gutgeschrieben" and "Erträge", checked footnote,
  min width 720 px. `BalanceChart`: heavy-stripe pattern (period 8, 75 %), 2 px frame, legend entry and
  `aria-label` part; the pattern and legend entry only render while checked, so the unchecked SVG is as in 014.
- Token `--chart-reinvested` (light `#a21caf`, dark `#f0abfc`) and its `PAIRS` entry.
- e2e: `reinvestBox`, `cents()` and `chartSeriesPixels()` (now also counts `reinvested`) moved into
  `e2e/avd.helpers.ts`; `avd.spec.ts` only changes its imports. The 015 spec is the tester's.
- Unit tests as named in the design: zulage rounding; `schedule.test.ts` (partial cap at 545 EUR, invariant
  sweep, `perYearRange`); `project.test.ts` runs "rows add up" for every oracle case unchecked and checked;
  `chartGeometry.test.ts` with the reinvested series. The 013/014 tests stay unchanged apart from the extended
  rows-add-up test and the `reinvestedCents: 0` field in one hand-built `YearRow` literal.

**Orchestrator decision on the UX deviations:** deviations 1, 3, 4 and the new behaviour (5: live sentence, checked
copy) are built as the UX design says. Deviation 2, the "Ausgezahlt statt angelegt" row, is **not** built (outside
the ACs). While checked the refund group has three rows at most: "Steuererstattung pro Sparjahr",
"Steuererstattung im 1. Sparjahr" (only with the bonus) and "Steuererstattung gesamt". The UX §3 line "Rows 0,00 €,
Ausgezahlt statt angelegt 0,00 €" therefore reads without that row.

**Deviations:**

1. `taxRefund()` does not copy `schedule[i].refundCents`. It computes `refundCents(schedule[i].contributionCents,
schedule[i].zulageCents, inputs.taxRateBp)`. For the projection of the same inputs this is the same number (same
   function, same arguments). The difference: the existing 014 test calls `taxRefund()` with other rates on one
   projection; with copied values that test would always get the projection's rate and pass without checking
   anything.
2. The 013 oracle cases in `project.test.ts` all have a refund of 0 (children, 30 %), so the checked runs would
   check nothing. I added the oracle case "42 %, no child". The checked run asserts end > unchecked when
   something is reinvested, else equal.
3. Narrow layout (below 600 px), found at 320 px: the figure label "Reinvestierte Steuererstattung" wraps and the
   value stays on the right (`.figure dt { flex: 1 1 0 }`). The range sub-line takes the value's width instead
   of widening it. In the refund group a row with a range may put its value under the label, aligned right
   (`.wraps`). Without these the value dropped to its own line, or the label ran into the range. Unchecked rows
   look as before.
4. The reinvested legend swatch uses the series' own look (heavy stripes, 2 px frame in `--chart-reinvested`). It
   does not use the 1 px `--color-edge` frame of the Zulagen swatch, because the frame is the series' shape cue
   (UX §5 "same patterns").
5. The checkbox row is the `<label>` itself with the input inside it (`label for` still set), so box and text are
   one 44 px target. The focus ring goes around the row (`:has(:focus-visible)`), as UX §3 asks.

**Checked by hand (throwaway scripts, not kept):** AC2 reference checked 14.400,00 / 4.320,00 / 3.099,60 /
4.143,81 / 25.963,41; AC3 Z(2) 169,50, R(2) 44,07, Z(3) 172,04; 570 EUR checked = unchecked 333.868,97; defaults
checked 112.502,32. I compared the text of the whole page before checking and after unchecking at 320/375/800
(dark)/1280 px: identical. No sideways page scroll at 320 px. Tab from "Grenzsteuersatz" reaches the box. Space
toggles it. The box keeps its state while a field is invalid. Age 69 to 70 shows 0,00 €. Screenshots of the chart
looked right in light, dark and forced colours. The unchecked box border measured about 4.5:1 against the
surface in both schemes (#767676 / #858585), so no custom border was needed.

**Follow-ups for the tester:** the new spec `e2e/avd-reinvest.spec.ts` (one test per AC). `chartSeriesPixels()`
now returns `reinvested`.

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s) (`apps/avd/e2e/avd-reinvest.spec.ts`)                                                                                                                                                                                                                           | Result |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | `AC1: unchecked by default and equal to 014; toggling updates and announces without a submit and unchecking restores it` (keyboard Tab/Space, 700 ms live region via `page.clock`, figures/table/chart pixel-equal after round trip); 013/014 specs unchanged and green | PASS   |
| AC2 | `AC2: the reference at 42 % reinvests 3.099,60 and reaches 25.963,41`                                                                                                                                                                                                   | PASS   |
| AC3 | `AC3: the reinvested refund counts as contribution of the next year; at the cap nothing is reinvested`                                                                                                                                                                  | PASS   |
| AC4 | `AC4: table column and chart series appear while checked, add up, update and vanish when unchecked` (pixel check of `--chart-reinvested`)                                                                                                                               | PASS   |
| AC5 | `AC5: zero refund and one saving year reinvest 0,00; an invalid field keeps the box and shows no bad amount`                                                                                                                                                            | PASS   |
| AC6 | `AC6: the checked note states the 1 January payment and the last-year exception, the unchecked one does not`                                                                                                                                                            | PASS   |

**Tests added:** 6 e2e (one per AC), no unit tests (developer's cover the branching logic). Helpers added to `e2e/avd.helpers.ts`: `differingPixels`.

**Results:** `npm run verify -w apps/avd` green: vitest `@swfactory/platform` 154 passed (15 files), `@swfactory/avd` 88 passed (8 files), build and check:dist ok. `npm run test:e2e -w apps/avd`: 64 passed (Playwright project `chromium` 23, project `platform` 41).

**Mutation checks (each killed, src restored and diffed identical):** reinvest at end of January instead of 1 January (AC2); no cap on reinvestment (AC3); last refund also reinvested (AC1, AC2, AC4, AC5); reinvested not counted as contribution for the Zulage (AC3); chart segment of the series omitted (AC4 pixel check, `Expected > 50, Received 0`). A mutant that only drops the stripe fill survives the pixel check because the 2 px frame still has the token colour; that is covered by the frame, not by a test.

**Probes, checked OK (not kept):** contrast `--chart-reinvested` vs surface 6.32 (light) / 9.39 (dark), tool-measured; unchecked checkbox border 4.54 (light, #767676) / 7.28 (dark) against the surface; no horizontal page scroll at 320, 375 and 1280 px with the box checked; forced colours at 375 px: reinvested (heavy stripes, frame, legend swatch) and Zulagen (fine stripes) distinguishable by shape, though close in look (observation, no defect); chart screenshot unchecked -> checked -> unchecked differs only by raster noise <= 8/255 (hence `differingPixels`, tolerance 8); the box keeps state with an invalid field. Screenshots: `screenshots/015/` (light/dark, 375, 320, 1280, forced colours; checked and unchecked).

**Notes:** "Ausgezahlt statt angelegt" row not built by decision, not tested. A first draft of AC4 used 200 EUR/month, which gives the same refund (deduction cap 1.800 EUR); 100 EUR is used.

**Defects:** none.

### Regression after review round 1

Test-only changes: nit 2 (the `textContent = ''` write into the live region removed from `avd-reinvest.spec.ts`), nit 3 (`differingPixels` default tolerance 8 -> 2 of 255, comment with the measured noise 1/255; tester memory corrected), nit 4 (one unit assertion in `taxRefund.test.ts`: for a checked projection `taxRefund().byYearCents` equals the schedule's `refundCents`; inputs 100 EUR, 37 %, not AC values). Nit 6 (non-breaking space via `formatWholeEuro`) is the developer's change, covered by the runs below.

- Mutation of the new unit assertion: `taxRefund` using `annualCents` instead of `year.contributionCents` fails it; the first draft with 545 EUR survived (deduction cap hides the difference) and was replaced by 100 EUR. Production file restored and diffed.
- `npm run verify`: exit 0. vitest platform 154 passed (15 files), avd 89 passed (8 files), minesweeper 95 passed (12 files), skeleton 5 passed (2 files); check:dist ok.
- `npm run test:e2e -w apps/avd`: 64 passed (project `chromium` 23, project `platform` 41); AC1 passes at tolerance 2 with 0 differing pixels.
- Tests added: 1 (unit). Defects: none. Verdict: PASS.

**Manual checks (gate 2, 2026-11-07)**

- A real provider's handling of the reinvested refund, a real iPhone and VoiceOver: not run; hak approved the commit
  without answering these checks, they stay open (as in 013 and 014).

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

**Round 1, reviewer 2026-11-07. Verdict: APPROVED. Checklist version: 2**

| Item | Result | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1   | pass   | AC1 `ReinvestOption` in `InputForm`, `reinvest` state in `SavingCalculator`, default `false` → `project()` unchanged path; AC2 `savingSchedule()` → `project()` 1 January add, `ResultSummary` fifth figure, net row hidden in `TaxRefundGroup`; AC3 `min(R(n−1), CAP − own)` + `zulage(c(n))`; AC4 `YearTable` column, `chartGeometry` `reinvested` series, `BalanceChart` legend + `aria-label`; AC5 `room`/zero refund → 0, `reinvest` state outside `parseInputs`; AC6 `NOTE_REINVEST`. Each traced to its test in `e2e/avd-reinvest.spec.ts`, all 6 green in my run |
| C2   | n.a.   | no network call or pending state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| C3   | pass   | one new `useState(false)`, no effect; projection, refund, ranges and live text derived per render; toggle sets `edited`                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| C4   | n.a.   | no render loop or imperative controller (static SVG)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| C5   | n.a.   | no reducer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| C6   | n.a.   | no I/O or error handling added                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| S1   | pass   | no `dangerouslySetInnerHTML`; the checkbox writes a boolean only; all new text is static copy or `formatEuro` output                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| S2   | n.a.   | no config, env or auth change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| S3   | n.a.   | no `package.json` change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| S4   | n.a.   | no dev-only code (no `import.meta.env` in `apps/avd/src`); `check:dist` ok for avd                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| S5   | n.a.   | no script, template or generated code touched                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| T1   | pass   | `npm run verify` exit 0: vitest platform 154 (15 files), avd 88 (8 files), minesweeper 95 (12 files), skeleton 5; check:dist ok. `npm run test:e2e -w apps/avd` 64 passed = project `chromium` 23 (013: 9, 014: 8, 015: 6) + project `platform` 41. The Test report's numbers are right                                                                                                                                                                                                                                                                                  |
| T2   | pass   | one e2e per AC; unit tests only for branching logic not in the ACs (partial cap at 545 EUR, half-up rounding, invariant sweep, stack order); the checked "rows add up" runs are a cheap sweep over cases the e2e can't reach (negative returns, 52 years)                                                                                                                                                                                                                                                                                                                |
| T3   | fail   | findings 2 and 3 (nits); otherwise sound: AC2/AC3 exact oracles, AC4 sums every row by header, `differingPixels` is the "equals" direction and returns Infinity on a size mismatch, `chartSeriesPixels().reinvested` > 50 vs 0                                                                                                                                                                                                                                                                                                                                           |
| T4   | pass   | AC1 focuses the rate field and presses Tab once (allowed by UX §6), no coordinates, `animations: 'disabled'` screenshots, fake clock for the debounce, all tests named after ACs                                                                                                                                                                                                                                                                                                                                                                                         |
| T5   | pass   | `savingSchedule` (cap, year 1, R(N)), `perYearRange` (bonus, empty), Grundzulage rounding and the new stack segment are unit-tested                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| K1   | fail   | finding 4 (nit); design followed (schedule before the loop, `ProjectOptions` default, explicit `reinvest` props); deviations 1 to 5 and the orchestrator's drop of "Ausgezahlt statt angelegt" are in Implementation notes; `cents`/`chartSeriesPixels` moved, not copied (`avd.spec.ts` only changes imports)                                                                                                                                                                                                                                                           |
| K2   | pass   | no `any`, no `!`; `?.`/`??` for indexed access; named exports; `ReinvestOption` and `PerYearValue` one component per file; `schedule.test.ts` next to `schedule.ts`                                                                                                                                                                                                                                                                                                                                                                                                      |
| K3   | pass   | new colour only via `--chart-reinvested` (light + dark in `tokens.css`, pair in `PAIRS`); `CanvasText`/`Highlight` only in forced-colours blocks; padding derived with `calc()` over tokens; variant selectors `:where(.five)`, `:where(.reinvest)`, `:where(.wraps)`; no transition added                                                                                                                                                                                                                                                                               |
| K4   | n.a.   | no platform or factory file changed (agent memory only)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| K6   | pass   | story `in-review`, index row `in-review`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| K7   | fail   | finding 5 (nit); hak's gate-1 answers (2a to 2f, reference numbers) are logged                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| K8   | fail   | finding 1 (tech-writer step, follows this review)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| K9   | pass   | prettier check green in verify; story re-checked after this section                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| K10  | n.a.   | no workspace script or tsconfig changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| K11  | n.a.   | no env variable added                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| A1   | pass   | native checkbox, accessible name exactly the label, description = hint (probed), Tab from "Grenzsteuersatz" reaches it, Space toggles, focus stays; row 44 px high, 2 px `--color-focus` ring around the row via `:has(:focus-visible)` (probed), `Highlight` in forced colours                                                                                                                                                                                                                                                                                          |
| A2   | pass   | series cue is shape (heavy stripes + 2 px frame) plus legend order; forced colours probed: stripes and frame `CanvasText`, 8 segments drawn; contrast 6.3 / 9.4 in `PAIRS`; native box border about 4.5:1 per Implementation notes. Very short segments merge into a solid band in forced colours, as the 013 Zulagen did; the table and the text alternative carry the values                                                                                                                                                                                           |
| A3   | pass   | same polite region, mounted empty; the checked sentence adds "Davon wieder angelegt", so the string differs both ways; no animation added                                                                                                                                                                                                                                                                                                                                                                                                                                |
| A4   | n.a.   | no render loop or canvas; one extra `<pattern>` only while checked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

Findings:

1. `[minor] apps/avd/README.md:198-200`, `CHANGELOG.md` - the README still says that reinvesting the refund is not included and points to story 015 as future work, and the CHANGELOG has no 015 entry. Fix: the tech-writer step that follows this review.
2. `[nit] apps/avd/e2e/avd-reinvest.spec.ts:74` - the test writes `textContent = ''` into the live region, which React owns. That isn't needed: line 82 waits for the checked sentence (anchored on "Davon wieder angelegt: 3.099,60 €."), which differs from the earlier unchecked text anyway, and line 92 comes after that proven change. It only works because React writes a single text child through `textContent`. Fix: drop line 74.
3. `[nit] apps/avd/e2e/avd.helpers.ts:120` - `differingPixels` defaults to a tolerance of 8/255. In my probe of the same round trip, 984 pixels differ, but by at most 1/255 per channel. With the box checked, 43.333 pixels differ, so the helper isn't vacuous. Fix: lower the default to 2 and correct the tester memory line ("<= 8/255").
4. `[nit] apps/avd/src/features/saving/logic/taxRefund.ts:41-50` (deviation 1) - in the app the two paths can't diverge. There is one call site, `taxRefund(parsed.inputs, project(parsed.inputs, …))`, with the same function and the same arguments, and my sweep found 0 differences between `byYearCents` and `schedule[i].refundCents` over 90.720 checked and unchecked cases. But `taxRefund(otherRate, checkedProjection)` would mix c(n), built from rate A's refunds, with refunds at rate B. Only the unchecked 014 sweep varies the rate, and there the schedule doesn't depend on the rate. No test pins the equality for a checked projection (e2e AC2/AC3 show it only indirectly). Fix: one assertion in `schedule.test.ts` or `project.test.ts` (`taxRefund(i, project(i, { reinvestRefund: true })).byYearCents` equals the schedule's `refundCents`), or state in the doc comment that the rate may differ only on an unchecked projection.
5. `[nit] apps/avd/docs/backlog/015-avd-reinvest-tax-refund.md` (Decision log) - the orchestrator's scope decision not to build the UX row "Ausgezahlt statt angelegt" is only in the Implementation notes. The log is meant for "every scope decision". Fix: the orchestrator appends one line.
6. `[nit] apps/avd/src/features/saving/fieldCopy.ts:63`, `ResultSummary.tsx:38` - "6.840 €" in the hint and the checked note has a normal space, while `formatEuro` uses U+00A0 everywhere else, so "€" can wrap onto its own line. Fix: `6.840 €` (or `formatEuro(CONTRIBUTION_CAP_CENTS)`).

Checked, OK:

- I wrote an independent oracle with an integer BigInt schedule (quarter-cent Grundzulage, half-up refund) and my own monthly compounding. It reproduces AC2 (14.400,00 / 4.320,00 / 3.099,60 / 4.143,81 / 25.963,41; unchecked 22.256,44), AC3 (R(1) 39,00, Z(2) 169,50, R(2) 44,07, Z(3) 172,04; at 570 EUR reinvested 0,00 and 333.868,97 both ways). It matches the app's schedule, end value, four-part sum and reinvested total in 90.720 cases (ages 18 to 69, N = 1 to 52, monthly 0 to 570 incl. 54.501 and 56.999 cents, children 0 to 10, rates 0 to 50 % incl. 0,01 / 44,33 %, returns −10 to 20 %). R(N) is never reinvested, and c ≤ 6.840 EUR.
- Unchecked is bit-identical to 014: `project()`, `zulage`, `taxRefund()` and `chartGeometry()` of this branch and of `main` give equal JSON (without the new `reinvestedCents: 0`) in 112.752 cases, with no `reinvested` segment.
- The Grundzulage `Math.round` is a no-op for c = 12 · m. 0,5 · c and 0,25 · x are exact in floats, the value is never negative, and `Math.round` rounds .5 up.
- Bonus case checked (age 24, 25 EUR, 42 %): "Zulage im 1. Jahr" 350,00 and "Steuererstattung im 1. Sparjahr" 0,00 stay as unchecked, and the ranges cover years 2 … N. The `perYearRange` null branch can't be reached from the UI (payout ≥ 65), which is harmless.
- No sideways page scroll at 320 px with the box checked.
- Review round 1, nit 6: the cap "6.840 €" in `fieldCopy.ts` and `ResultSummary.tsx` now comes from `formatWholeEuro(CONTRIBUTION_CAP_CENTS)`, so it uses the same no-break space as all other amounts.
- The agent-memory diffs are one-line rules, role-specific, and every file stays under 100 lines. The ux-designer merged two old lines instead of duplicating them.

## Explanation

A new checkbox "reinvest the tax refund" sits next to the tax rate; it is off by default.
Off, everything is exactly as before: the refund goes to the saver and own contributions after the refund are shown.
On, each year's refund is paid into the depot on 1 January of the next year and grows with it.
It counts as an own contribution of that year, so it can raise that year's Zulage and refund, up to the 6,840 EUR cap.
The refund of the last saving year arrives after payout start and is not reinvested.
The result gets a fifth part "reinvested refund"; the table a column, the chart a fourth striped, framed series.
Per-year Zulage and refund show a range while ticked, because they can grow from year to year.
The calculator first plans every year's payments in whole cents, then grows the depot, so the parts always add up.
Reference at 42 %: 25,963.41 EUR with reinvestment, 22,256.44 EUR without; checked by four agents independently.
After review: tests no longer write into the page, tighter pixel tolerance, one more unit test, no break before "€".
Risks: whether reinvested refunds count as contributions is our reading of the law; real providers may differ.
Not verified: a real provider's handling of the refund, a real iPhone and a real screen reader.

## Retrospective

### What went wrong

1. **The story was written before 014 was designed.** Its `changes:` list named 5 of about 10 affected earlier ACs,
   and four 014 texts ("nicht im Depot", "nicht im Endwert") became false while checked. The architect found it; the
   product owner completed the list, the UX designer wrote checked-state copy. Root cause: no rule for options that
   change earlier behaviour only while enabled.
2. **A scope decision was logged late.** The orchestrator dropped the UX design's optional row "Ausgezahlt statt
   angelegt" (no AC) but recorded it only in Implementation notes; the reviewer asked for a Decision log entry
   (nit 5). Root cause: the Decision log rule names only hak's answers.
3. **Review round 1: APPROVED with 1 minor and 5 nits.** README/CHANGELOG pending (docs step), a test that wrote into
   the live region React owns, a pixel tolerance of 8/255 where the measured noise was 1/255, no test pinning that the
   refund path and the schedule agree, and "6.840 €" with a breaking space. All fixed after approval; regression PASS
   (root verify green, avd 89 unit, e2e 64 = 23 chromium + 41 platform, counted by the orchestrator).
4. **Vacuous checks, caught twice.** The developer noticed that rerunning the 013 oracle cases with the box ticked
   tested nothing (all had refund 0); the tester's first mutation check sat at the 1.800 € cap and could not fail.
   Both fixed. Root cause: no rule that a rerun or mutation case must actually move the result.
5. **Tester run hung for about ten minutes**: `vitest run -w` means watch mode, not workspace. The tester also tried to
   kill an unrelated dev server (port 5197, 4 days old), which was denied; it is left for hak.

### Proposed changes

- **P1** `CLAUDE.md`, Traceability → Links: "When a story adds an option that changes earlier behaviour only while
  enabled, `changes:` lists every earlier AC that is false in the enabled state, and those ACs are annotated 'holds
  while <option> is off'." (architect)
- **P2** `CLAUDE.md`, Traceability → Decision log: "… every answer and correction from hak, and every scope decision
  of the orchestrator (e.g. dropping a designed element), appended at once." (tech-writer, reviewer)
- **P3** `CLAUDE.md`, Test proportionality: "A pixel-diff tolerance is backed by the measured maximum noise (stated in
  a comment). Tests never write into DOM the app renders (e.g. live regions); they reset state through the UI or the
  clock." (reviewer)
- **P4** `CLAUDE.md`, Test proportionality: "When existing cases are rerun for a new option, or a rule is
  mutation-checked, at least one case must actually move the result (a strict difference); inputs at a cap hide
  changes." (developer, tester)
- **P5** `.claude/agents/tester.md`: "Run unit tests only through the npm scripts (`npm test -w apps/<name>`); never
  pass `-w` to vitest itself (it means watch mode)."

**Outcome (gate 2, 2026-11-07):** hak: "Alle, dann committen". P1–P5 applied by `devops` (one run); diff reviewed by
the orchestrator.

Agent-memory diffs checked (architect, developer, reviewer, tester, tech-writer, ux-designer, product-owner): correct
and role-specific; the tester corrected its own pixel-tolerance line.

### Cost

| Role                        | Round | Model  | Tokens       | Tool uses | Duration |
| --------------------------- | ----- | ------ | ------------ | --------- | -------- |
| architect                   | 1     | opus   | 152059       | 29        | 8:00     |
| product-owner               | 1     | haiku  | 90737        | 18        | 0:44     |
| ux-designer                 | 1     | sonnet | 103569       | 8         | 3:44     |
| developer                   | 1     | opus   | 172245       | 71        | 10:46    |
| tester                      | 1     | sonnet | 91634        | 29        | 5:06     |
| reviewer                    | 1     | opus   | 160060       | 42        | 6:09     |
| developer                   | 2     | sonnet | 30101        | 5         | 0:35     |
| tech-writer                 | 1     | haiku  | 103642       | 25        | 1:50     |
| product-owner               | 2     | haiku  | 46615        | 4         | 0:10     |
| tester                      | 2     | sonnet | 50946        | 17        | 16:20    |
| devops                      | 1     | sonnet | 27632        | 6         | 0:26     |
| total (measured)            |       |        | 1029240      | 254       | 53:50    |
| orchestrator (main session) |       | opus   | not measured | n/a       | n/a      |

The story's own gate-1 work (research and product-owner rounds) is in story 014's cost table, where it ran. The
second tester run stands out in duration: about ten minutes of it was the hung watch-mode run (item 5).
