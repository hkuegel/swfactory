---
id: 045
title: The flat rate for accumulating funds (Vorabpauschale) is a parameter, constant over the term
status: designed # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<app name>/docs/backlog)
size: M # S | M | L (story 026). S = at most three ACs: needs only the Explanation, no Review section and no Cost table.
branch: feature/045-laz-vorabpauschale-flat-rate-over-the-term
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [024/AC3, 024/AC4, 031/AC3, 032/AC2] # the tax case gains a second tax base: the round trip and the tax at liquidation, the four tax states, and the parts that add up to the depot
superseded-by: # set on the OLD story when a newer one replaces it
---

# 045 – The flat rate for accumulating funds (Vorabpauschale) is a parameter, constant over the term

## Original request

> "nächste story für laz/bond ladder
>
> bei thesaurierenden Fonds muss (im Steuerfall) ein Vorsteuerpauschale gezahlt werden. Recherchiere das und
> baue das entsprechend ein. Die Vorsteuerpauschale nehmen wir über die Laufzeit als konstant an (Parameter,
> Vorbelegung der aktuelle Wert)" (hak, 2026-11-15)

Hak's word is `Vorsteuerpauschale`. The term the law uses for what he means is **Vorabpauschale**
(§ 18 InvStG); `Vorsteuerpauschale` is the colloquial name the depot statements use (UStG § 24's
Vorsteuerpauschale is the agricultural flat rate and has nothing to do with funds). Hak chose the legal term
for the UI, so the UI says `Vorabpauschale` and the explanatory text names the colloquial word once.

`size: M` because the story moves one behaviour in five places that only work together: the field, the yearly
base, the credit at liquidation, the depot, and the fund table's column. A one-AC story could not add the
flat rate without changing the tax rule of story 024, which is exactly what this story does.

## User story

As the depot owner, I want the plan to show what the accumulating funds cost me in tax every year — not only
the tax at the end — so that I know which money leaves the plan during the term, and so that the same base is
not taxed twice.

## Context — the research (2026-11-15)

- The flat rate is the **Vorabpauschale** of § 18 InvStG, introduced with the 2018 investment tax reform. It
  is a fictitious minimum annual earning for (partially) accumulating public funds, taxed every year even
  when nothing is paid out. It applies to accumulating and partially distributing funds, not to a fund that
  distributes more than the flat rate.
- The base per calendar year: **value of the share at the start of the year × 70 % × Basiszins** (the 70 % is
  the Bewertungsabschlag that covers the fund's internal costs). Distributions of that year reduce it to
  zero. It cannot be negative, and it is capped at the year's actual value increase.
- The Basiszins is published by the BMF for each year (the Bundesbank derives it from public bond yields on
  the first trading day of the year): 2023 = 2,55 % → 1,785 %; 2024 = 2,29 % → 1,603 %; 2025 = 2,53 % →
  1,771 %; **2026 = 3,20 % → 2,24 %** (BMF letter of 13.1.2026). Hak wants one constant rate over the term,
  prefilled with the current value: **2,24 %**.
- The tax on the flat base is the normal capital gain tax: 25 % plus 5,5 % of that as Solzzuschlag
  (26,375 %), plus church tax on the capital gain tax where it applies — the rates story 031 already models.
- The payment for a year is due on the first business day of the following year (for 2026: 4.1.2027), and the
  bank debits it from the settlement account (Verrechnungskonto), not from the fund. A flat rate already paid
  is credited when the share is sold: the sale gain is reduced by the flat bases of the earlier years, so the
  same base is never taxed twice.
- For the ladder this matters every year: the projection of story 024 (ADR 0012) compounds the YTM with no
  distribution, so every fund row is an accumulating fund, and the flat rate applies in every calendar year
  the fund is held — except the year it is dissolved, which hak excluded on 2026-11-15.
- The fund is bought "now", so the months before the purchase count for the first partial year: § 18 InvStG
  reduces the base by 1/12 for every whole calendar month before the month of acquisition. The app's asOf
  month is the month of acquisition (story 032 buys at the data file's NAV).
- Teilfreistellung: an accumulating bond fund is a "sonstiger Fonds" (below 25 % equity), so **0 %** — hak's
  answer of 2026-11-15. The Sparer-Pauschbetrag stays out of the model (his answer), which means the tax case
  in this app means: tax on, no deduction.

## Acceptance criteria

- **AC1 (the parameter):** Given the tax case is on, then the tax block has a field for the flat rate with the
  copy of UX §2, prefilled with `2,24`, and its hint says the rate is constant over the whole term; the value
  is read as whole hundredths of a percent (2,24 % is 224), with the rule of a percent field. Given the
  Kapitalertragsteuer checkbox is off, the field is still shown and its copy says it counts only in the tax
  case, and no flat-rate tax is calculated anywhere.
- **AC2 (the base of a year):** For one fund, the flat base of a calendar year is the fund's value at the
  start of that year — the data file's value grown at YTM, on the projection's day-count path (ADR 0012) —
  times the flat rate, and the first partial year is reduced by 1/12 for every whole calendar month before the
  month of acquisition. The base cannot be larger than that year's actual increase, and a year whose increase
  is not positive pays nothing. The year of liquidation does not count. Hand oracle, fund NAV 100 €, YTM 5 %,
  asOf 1.1.2025, fund year 2027, rate 2,24 %, tax 26,375 %: 2025 base 2,24 € → 0,5908 €; 2026 base 2,352 € →
  0,62034 €; sum 1,21114 €. Month case, asOf 1.7.2025 (six whole months before the acquisition month): base
  1,12 € → 0,2954 €. Cap case, YTM 1 %: base 2,24 € capped to the year's increase of 1,00 € → 0,26375 €.
  Negative YTM: pays nothing.
- **AC3 (no base is taxed twice):** In the tax case the tax at liquidation is computed on the gain **minus**
  the flat bases already taxed in the earlier years, so the flat-rate payments plus the liquidation tax equal
  the rate times the whole gain. On the hand oracle of AC2: whole gain 15,7625 €, bases 4,592 €, remaining
  gain 11,170,5 €, liquidation tax 2,946219375 €, payout per share 112,816280625 € → `112,82 €`; total tax
  4,157359375 € = 26,375 % of 15,7625 €. The fund's own figure is not reduced by the yearly payments, because
  the money for them comes from the settlement account (hak's answer of 2026-11-15). Story 024 AC4 (taxed
  payout = NAV + (1 − r) × gain) holds while the flat rate is 0.
- **AC4 (what the UI shows):** The fund table shows, per fund, the flat-rate tax over the years that fund is
  held, as its own column, and the fund section states the sum over the funds once. A fund outside the tax
  case, or a fund with no year that pays, shows the dash with its reason; a fund outside the phase keeps the
  reason strings of story 032. The copy says once that the payment for a year falls on the first business day
  of the next year, that the year of liquidation does not count, and that the money comes from the
  Verrechnungskonto.
- **AC5 (the depot):** The yearly payments belong to the depot the plan searches for (hak's answer of
  2026-11-15), so `D = P · F + cash` and `P = (D − cash) / F`, where `cash` is the flat tax of the funds that
  fund a phase year, undiscounted. The round trip of story 024 AC3 holds while the flat rate is 0, and in the
  tax case the parts shown in the fund table — the purchase parts and the flat parts — add up to the shown
  depot (story 032 AC2, extended: the last part is derived from the total).

## Out of scope

- A per-year table of the payments: AC4 shows one figure per fund, not one per calendar year. A table that
  names each year's payment and the year it is due in is a story of its own.
- Interest on the yearly payments before they fall due: they are shown undiscounted, because they are money
  that leaves the plan, not money that is invested.
- Negative Basiszins, a per-year Basiszins, the Sparer-Pauschbetrag, Teilfreistellung above 0 %,
  distributing funds, and the 1/12 rule for a fund bought after the start of a year other than through the
  asOf month: the model takes one constant rate as hak asked.
- The fund data file and its writer: no new field in `data/fund-list.json`, the rate is a UI parameter.
- Changing the projection convention of ADR 0012 (annual effective compounding, ACT/365). AC3 changes only
  which part of the gain the tax at liquidation reads.

## Open questions

_None open: every question asked at gate 1 on 2026-11-15 is answered in the Decision log._

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be rebuilt without the chat.
Append only._

- 2026-11-15 — hak's request (verbatim above): the accumulating funds pay a flat-rate tax in the tax case, the
  rate is assumed constant over the term as a parameter, prefilled with the current value.
- 2026-11-15 — hak's answer (UI word): `Vorabpauschale`, the legal term of § 18 InvStG. The colloquial
  `Vorsteuerpauschale` is named once in the explanatory text.
- 2026-11-15 — hak's answer (where the money comes from): the settlement account. The fund's own value is not
  reduced by the payment, so the fund's figure at liquidation stays the fund's figure.
- 2026-11-15 — hak's answer (the parameter): the flat rate as a percent of the value at the start of the year,
  prefilled with `2,24` % (70 % × the Basiszins of 2026), constant over the term.
- 2026-11-15 — hak's answer (deductions): no Sparer-Pauschbetrag, no Teilfreistellung; an accumulating bond
  fund has 0 % Teilfreistellung.
- 2026-11-15 — hak's answer (Q1, the depot): the yearly payments are folded into the depot the plan searches
  for, so AC5 exists; the shown depot includes the payments.
- 2026-11-15 — hak's answer (Q2, the first partial year): whole months, as § 18 InvStG counts them
  (1/12 for every whole calendar month before the acquisition month), not the ACT/365 day fraction.
- 2026-11-15 — hak's answer (Q3, where it is shown): a column in the fund table plus the sum over all funds
  in the fund section, not a table per calendar year.
- 2026-11-15 — hak's answer (Q4, the liquidation year): the year of liquidation does not count; the fund is
  gone on 31.12. and no flat rate is computed for that year.
- 2026-11-15 — hak's answer (Q5, double taxation): the flat bases already taxed are credited against the tax
  at liquidation, so no base is taxed twice; this moves the rule story 024 AC4 gave, which is why AC4 is
  listed in `changes:`.
- 2026-11-15 — orchestrator's decision (recorded at gate 1, hak did not object to it as a question): the
  percent value is stored in whole hundredths of a percent (2,24 % = 224), the unit the percent field of
  story 033 reads, and the field keeps the rule of a percent field (0 to 100 %), because a rate that belongs
  to what the value means has a bound of its own (story 030). The tax rates stay in millionths of a percent.
- 2026-11-15 — orchestrator's decision: the flat base path uses the projection's day count for the value at
  the start of a year, so the bases of the counted years stay a part of the gain the tax at liquidation reads
  (AC3's equality cannot break). Only the fraction of the first partial year follows the whole-month rule.
- 2026-11-15 — orchestrator's decision: `cash` is the flat tax of the funds that fund a phase year only,
  because a fund outside the phase is not bought and its money is not part of the depot. A fund outside the
  phase shows no flat figure, for the same reason story 032 AC3 gives.
- 2026-11-15 — orchestrator's decision on the defect the tester found in the e2e run (phase 1.1.2033 –
  31.12.2034, the 2034 fund is in the fund list but funds no phase year): the interest applies only to the
  phase years, that is to the same set of funds the `cash` line uses (the decision of 2026-11-15 above),
  because a fund outside the phase is never bought and its money is never parked. AC5's assertion is what the
  design intends; `parkedInterestFactor` must read the phase years, not the fund list. The tester's
  hand-oracle test is not changed.
- 2026-11-15 — the tester's run of 2026-11-15: 33 assertions over the 7 rules, 6 mutation checks (rule P32,
  every run reported the file byte-identical to its backup taken outside the repository), 57 assertions over
  the 5 ACs green, `test:pages` 24, `check:structure` ok. One defect (above). The 150/14 and 116/11 figures of
  the full run are the app's and the platform's counts, not new tests. The AC table and the mutation results
  are written in the Test report after the fix is re-run.
- 2026-11-15 — ux-designer and architect, resolved by the orchestrator before the build (the word AC1 quotes
  must stay on one element): `Vorabpauschale` is the label of the field and appears once; the fund table's
  column names its money with the shorthand `Pauschalsteuer über die Haltedauer in Euro`, and the colloquial
  `Vorsteuerpauschale` is named once inside the hint. AC1 still holds, because it names the field's label.
- 2026-11-15 — ux-designer, recorded as a display rule the Technical design did not state: the fund section's
  sum line is shown only when at least one fund has a flat figure; nothing is invented for an empty sum, as
  story 032 AC3 does for a cell. The result block gets no new wording; the sentence that names what the
  searched depot includes lives in the fund section, and a negative monthly payout is shown as the model
  returns it.
- 2026-11-15 — ux-designer: the flat field is rendered inside the tax fieldset through its own call in
  `PhaseForm`, not through the loop of the three fields at the top, which is what makes the form order of
  `FIELD_IDS` (flat last) and the Tab order agree.
- 2026-11-15 — architect's risk 3 recorded as a testing fact: with the committed fixture asOf on 31.12.2026,
  the first partial year's base is capped by the one-day increase for every fund, so the whole-month rule can
  only be falsified in the unit test with asOf on a year start; an e2e hand value that reads the fixture must
  not be taken as a check of the month rule.
- 2026-11-15 — correction by the orchestrator: the two entries above that named `park.ts`,
  `parkedInterestFactor` and `depotParts`, the hand values `70,95 €` against `63,18 €`, and the tester run of
  2026-11-15 belong to story 046, not to this story, and are withdrawn as records of this story. `park.ts` is
  not in the repository or in its git history, and no test in this story asserts the depot for a fund inside
  the fund list but outside the phase, so those values cannot come from the flat path. In the code that does
  exist the phase restriction already holds: `flatCashCents` in `phase.ts` sums over `phaseYears` and
  `fundingFund`, and `flat.ts` carries no phase knowledge. The state of this story as the developer measured it
  on 2026-11-15: `typecheck` red with 18 errors (existing test call sites with the old signatures plus
  `PlanCalculator.tsx` missing `flatRate`), `npm test -w apps/laz` 5 failed and 4 passed files, 12 failed and
  18 passed tests, every failure `flat` being undefined at the call site, `lint` and prettier clean, no e2e run
  because port 5174 is held by Playwright's `webServer`, and no spec for AC5 in `e2e/laz.spec.ts`. The tester's
  run and its mutation checks are recorded in the Test report after the call sites and the UI tests exist.
- 2026-11-15 — the entry I deleted on 2026-11-15 while writing the correction above (the Decision log is
  append-only, so it is restored here): "orchestrator's decision: the flat field is prefilled with `2,24`, so
  the existing hand values of the tax case in the e2e specs and the unit tests are kept by typing `0` in the
  flat field in those cases; the new hand values are the ones of AC2 and AC3."

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

The tree of 044 stays. The tax block gains one field as its last control, and the fund section gains one
column, one sum paragraph and one paragraph of facts. Nothing else moves.

```text
PlanCalculator
  intro paragraph                      unchanged (044)
  section.inputs                       <form aria-labelledby=h2 "Eingaben">
    fieldset + legend                  "Was ist gegeben und was wird gesucht?", two native radios
    Field "Erster Monat der Auszahlungsphase"
    Field "Letzter Monat der Auszahlungsphase"
    Field amount (label follows the direction, unchanged)
    fieldset + legend "Steuer auf den Gewinn" (031)
      CheckboxOption kst
      CheckboxOption kist
      select "Bundesland für die Kirchensteuer"
      Field "Vorabpauschale"           new, the last control of the block
  section.result                       unchanged; a negative figure reads as the model returns it
  section.years                        unchanged
  section.funds                        <section aria-labelledby=h2 "Fondsstaffel">
    projection label <p>               unchanged, still the description of the figures (024 AC5)
    FundTable                          table, one new last column
    sum line <p>                       new, the fund section states the sum once
    flat facts <p>                     new, the three facts AC4 names
    footnote <p>                       unchanged, the shared rule of the input cells (044)
```

The field is rendered inside the tax fieldset, not with the three fields at the top, so the form order of
`FIELD_IDS` (flat last) and the Tab order agree: radios, phase fields, amount, the two checkboxes, the
select, then the flat field, then the fund section (024 §4, 033 AC3 unchanged). The new column adds no tab
stop; the sum line and the facts paragraph are read when the section is entered.

### States

- First render: the flat field is prefilled `2,24`, no error is shown before the first edit (024 §3). The
  amount field is still empty, so the result area shows the empty string and the fund table shows its dash
  alone, also in the new column.
- Success, tax on: one figure per fund in the new column, and the fund section states the sum once in its
  sum paragraph. The result block shows the figures it showed before; the depot figure is the one that
  includes the payments.
- Tax checkbox off: the field stays visible, editable and enabled — it is never disabled, like every other
  control of the form (024 AC3), and its copy says the rate counts only in the tax case. Every flat cell
  shows `– Steuer nicht angehakt`, and the fund section shows no sum (nothing is invented). No flat figure
  appears anywhere, and the tax-off figures stay as they are.
- Invalid flat value: the error names the field and the rule it broke, in the existing pattern, below the
  hint, with `aria-invalid`; the result area shows the no-result callout, the year table is removed, and the
  flat column shows the dash alone because nothing is calculated while a field is invalid.
- No figure anywhere (rate `0`, tax off, or no fund inside the phase): no sum line, no invented `0,00 €`.
  A row inside the phase keeps its purchase figures and its own reason.
- Negative monthly payout (risk 7): the result block shows the figure as the model returns it, for example
  `-12,34 €`; no clamp, no error, no new wording. It reads as `formatEuro` prints it, and the live region
  announces the same sentence it announces today.

### Interactions

- Typing stores the raw text unchanged, `inputMode="decimal"` (the field cannot hold a negative value), and
  the figures recompute on every keystroke. An error appears only for a complete value that is invalid, and
  only after the first edit of this field. Focus stays in the field being edited.
- The checkbox does not disable the field: turning it off changes what the app calculates, not what the user
  can type, so no focus movement is needed.
- When the flat field is the only invalid field, the live region names it through the existing wording
  (`Kein Ergebnis: Vorabpauschale ist ungültig.`), which is a new string for the region, so it announces.
  The flat sum is not added to the live text (risk 9).

### Accessibility

- The field keeps its label/hint association: a real `<label for="field-flatRate">` and the hint paragraph as
  its accessible description through `aria-describedby`; the error is added to the same description with
  `aria-invalid`. No `role="alert"`.
- The new column's figures keep the projection label as their accessible description (024 AC5): the cell text
  is referenced by `aria-describedby`, as the other projection figures are. A dash keeps its reason as text in
  the same cell (032 AC3), so it is read as `– Steuer nicht angehakt`, not as a figure.
- The sum line is a paragraph in the fund section, not a `dt` and not part of the live region.
- The table is a real table with `th scope="col"` for the new header and the year as the row header; tests read
  the new cell by its header text, never by position (CLAUDE.md).
- Contrast (hand computed, tester re-checks with a tool): new column header `--color-text` on
  `--color-surface-subtle` 14.62 light / 11.96 dark; its figures `--color-text` on `--color-surface`
  17.16 / 14.10; the dash with its reason, the sum line and the facts paragraph `--color-text-muted` on
  `--color-surface` 7.78 / 7.64. Focus and the invalid field keep the existing indicators (7.00 / 9.75, the
  2 px `--color-danger` border).
- Dark mode: no new colour, every new element reuses the existing rules, so the values above hold in both
  schemes. Forced colours: nothing new carries a state by colour — the reason is text, the invalid field keeps
  its 1 px CanvasText border and icon.
- Below 600 px: only the fund section's own wrapper scrolls, so the new column makes the table wider without
  ever scrolling the page sideways; the header wraps as the other headers do and a figure wraps inside its
  cell. The new paragraphs stack below the table like the footnote.

### Copy (exact strings)

The word `Vorabpauschale` stays on exactly one element, the field label, because AC1 quotes it; no other
copy repeats it, so the column names what it shows with the shorthand `Pauschalsteuer`, and the colloquial
word named once is the hint's, not a second occurrence of the label.

`FIELD_COPY.flatRate`:

- label: `Vorabpauschale`
- range: `0,00 bis 100,00 %`
- hint: `Prozentsatz, höchstens 2 Nachkommastellen. Er bleibt über die ganze Laufzeit gleich und zählt nur, wenn die Kapitalertragsteuer angehakt ist; der Depot-Auszug nennt das Vorsteuerpauschale.`
- formatWord: `keine gültige Zahl`
- unit: `Hundertstel Prozent`

The errors the pattern gives for these strings (the field and the rule it broke):

- `Vorabpauschale: keine gültige Zahl. Erlaubt: 0,00 bis 100,00 %.`
- `Vorabpauschale: Wert außerhalb des erlaubten Bereichs. Erlaubt: 0,00 bis 100,00 %.`
- `Vorabpauschale: Wert ist keine ganze Anzahl Hundertstel Prozent. Erlaubt: 0,00 bis 100,00 %.`
- `Vorabpauschale: Wert fehlt. Erlaubt: 0,00 bis 100,00 %.`

`COPY.flatColumn` (the header names what it shows): `Pauschalsteuer über die Haltedauer in Euro`

`COPY.flatSumLine` (a paragraph, `{wert}` is `formatEuro` of the shown parts):
`Summe der Pauschalsteuer über alle Fonds: {wert}.`

`COPY.flatFacts` (the three facts, in the fund section's paragraph below the table): `Die Pauschalsteuer für ein Jahr wird am ersten Werktag des nächsten Jahres gezahlt (für 2026: 4.1.2027). Das Jahr der Auflösung zählt nicht. Das Geld kommt vom Verrechnungskonto, der Wert des Fonds wird dadurch nicht kleiner.`

`COPY.flatDepotNote` (the one sentence that names what the searched depot includes; it states the rule the result figure follows, so it is read in the fund section, not in the result block): `Das Depot, das die App sucht, enthält die jährlichen Pauschalsteuer-Zahlungen; eine negative monatliche Auszahlung wird als negative Zahl gezeigt.`

`flatReasonText` (the three new reasons; the phase-side reasons stay the strings of 032):

- `outside-tax-case` → `Steuer nicht angehakt`
- `no-year-counts` → `kein Jahr zählt (nur das Auflösungsjahr)`
- `no-year-pays` → `kein Jahr zahlt Steuer`

Substring notes for the tester: `Vorabpauschale` and `Vorsteuerpauschale` each occur once; `Pauschalsteuer`
occurs in the header, the sum line and the facts paragraph, and `Steuer` occurs in the tax legend, the KSt
label, the reason string and the new copy, so tests read the full line text or the columnheader. `Haltedauer`
occurs once, in the header. The sum line is read as paragraph text, never as a `dd`, so `valueOf` is not used
for it.

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

ADR 0015 – the second tax base, the credit at liquidation, and the depot that includes the payments:
[0015-laz-second-tax-base-credited-at-liquidation.md](../adr/0015-laz-second-tax-base-credited-at-liquidation.md).

The architect recomputed the hand oracle of AC2 and AC3 on 2026-11-15 with its own arithmetic; every number
in the story holds, so the story is unchanged (see the values under "Hand oracle" below).

### Dependency order

`fund.ts` → `projection.ts` → `flat.ts` (new) → `phase.ts` → `purchase.ts` → `fieldCopy.ts`. `flat.ts`
imports `fund.ts`, `fields.ts` and `projection.ts` (the day count, `Tax`, `RATE_UNIT`) and nothing else;
`projection.ts` reads the base factor as a parameter instead of importing `flat.ts`, so no cycle appears.
`flat.ts` holds no phase knowledge and no reason strings: the phase decides which funds are bought, the flat
path only knows a fund, its years, and the rate, and the reasons stay in the row module that shows them.

### New module

`apps/laz/src/features/plan/logic/flat.ts` — the flat rate's own path: which calendar years count, the base
of one year, the tax of one fund. Exports are the ones a caller or the copy actually reads; the year loop and
the year-start value are internal, so a fix is tested through its caller (CLAUDE.md, story 026 R3).

```ts
import { monthParts } from './fields.ts';
import type { Fund } from './fund.ts';
import { dayCount, RATE_UNIT, type Tax } from './projection.ts';

/** The flat rate as the form reads it: whole hundredths of a percent, 2,24 % is 224 (story 033's unit). */
export interface FlatRate {
  /** whole hundredths of a percent; 0 = no flat rate, the state the existing hand values of the tax case keep */
  readonly hundredths: number;
}

export const FLAT_OFF: FlatRate = { hundredths: 0 };

/** The value at the start of a calendar year, micro-euro, unrounded, on the projection's day count
 * (ACT/365, ADR 0012). Never earlier than `asOf`: the fund is bought now, so asOf's own year starts at the
 * NAV. Not exported: it is the body of the two functions below. */
// valueAtYearStartMicroEur(fund, year, asOf) = fund.navMicroEur * (1 + fund.ytmBp / 10000)^(max(0, days) / 365)

/** The flat base of one year, micro-euro, in the sign-safe shape the code uses:
 * min(max(0, the year's actual increase), value at the start of the year × rate × wholeMonths / 12). */
// flatBaseMicroEur(fund, year, flat, asOf) — internal

/** The counted years: asOf's year through `fundYear − 1`; the year of liquidation does not count (AC2). */
// flatYears(asOf, fundYear) — internal

/** Sum of the bases of the counted years, per euro invested — the shape `payoutFactor` reads. */
export function flatBaseFactor(fund: Fund, flat: FlatRate, asOf: string): number;

/** The flat tax of the counted years of one fund, micro-euro, unrounded; 0 outside the tax case (AC1). */
export function flatTaxMicroEur(fund: Fund, flat: FlatRate, tax: Tax, asOf: string): number;
```

The reasons live in `purchase.ts` with the row (the pattern story 032 already has), and `fieldCopy.ts` gains
`flatReasonText(reason)`: the three phase-side reasons return story 032's strings through
`purchaseReasonText`, the three new ones return the strings of UX §2.

### Types for the field

```ts
// fields.ts
export type FieldId = 'phaseStart' | 'phaseEnd' | 'amount' | 'flatRate';
/** Form order; also the order in which the first invalid field is named. `flatRate` is last: the tax block
 * renders after the amount field, so its only parsed field is last in the form order whatever UX puts first
 * inside the block. */
export const FIELD_IDS: readonly FieldId[] = ['phaseStart', 'phaseEnd', 'amount', 'flatRate'];

// fieldSpec('flatRate') → { min: 0, max: 10000, decimals: 2, date: false }
// The bound belongs to what the value means: a percent, 0 to 100 % (story 030). No negative value, so
// TextField keeps `inputMode="decimal"`; the negative-range rule does not apply to this field.

// parseInputs.ts
export interface ParsedInputs {
  readonly phaseStart: string;
  readonly phaseEnd: string;
  readonly amountCents: number;
  /** whole hundredths of a percent, 2,24 % is 224 */
  readonly flatRateHundredths: number;
}

// PlanCalculator.tsx
const DEFAULT_INPUTS: RawInputs = {
  phaseStart: '01.2028',
  phaseEnd: '03.2034',
  amount: '',
  flatRate: '2,24', // hak's prefill, the Basiszins of 2026 × 70 %
};
```

`fieldCopy.ts` gains `FIELD_COPY.flatRate` (label, range `0,00 bis 100,00 %`, hint, `formatWord`, and the
`unit` the exact-unit error quotes), `COPY.flatColumn`, `COPY.flatSumLine`, and the footnote facts AC4 names.

### Which existing functions change

- `projection.ts`: `payoutFactor(fund, tax, flatBaseFactor, asOf)` and `payoutPerShareMicroEur(fund, tax,
flatBaseFactor, asOf)`. The closed form stays sign-safe, in the shape the code already uses:
  `ρ′ = ρ − (rate / RATE_UNIT) · max(0, ρ − 1 − flatBaseFactor)`. With `flatBaseFactor = 0` this is exactly
  the value ADR 0012 gives, so the existing hand values of `tax.test.ts` and `projection.test.ts` hold;
  those tests pass `FLAT_OFF`.
- `phase.ts`: `phaseFactor`, `payoutFromDepotCents`, `depotFromPayoutCents`, `buildPlan` gain `flat` (and the
  asOf the flat path needs). `flatCashCents(funds, phase, tax, flat, asOf)` is the new part: the flat tax of
  the funds that fund a phase year, undiscounted, in cents (unrounded). The two directions stay one inverse
  pair: `P = (D − cash) / F`, `D = P · F + cash`. `cash` is a constant of the fund list and the rate, not a
  function of `P`, so the round trip is exact on the unrounded values and the one cent of story 024 AC3 still
  covers only the display rounding. `Plan` gains `flatCashCents`. `displayYearCents` is unchanged.
- `purchase.ts`: `PurchaseRow` gains `flatMicroEur` (null when the column shows a dash) and `flatReason`.
  `purchaseRows` fills both, using `flatTaxMicroEur` for the same funds `phase.ts` used for `cash`, so the
  figures in the table and the depot are the same numbers. `displayPurchaseCents(rows, totalCents)` becomes
  `displayFundParts(rows, totalCents) → { purchaseCents, flatCents }`. When no row has a flat figure the
  result is identical to story 032's, which is what keeps its hand values.
- `fieldCopy.ts`: `firstInvalidField` unchanged, it reads `FIELD_IDS`; `errorMessage` unchanged.
- `PlanCalculator.tsx`: the derived block gains `flat` from `parseInputs` and passes it to the projection,
  the plan, and the rows. `TextField.tsx` is unchanged.

### Data flow

`raw.flatRate` → `parseInputs` (whole hundredths, one error per field, form order for the first invalid
field) → `FlatRate` → `flatBaseFactor` per fund → `payoutFactor` (the tax case reads the credited bases) →
`flatTaxMicroEur` per fund → `cash` → the depot and the monthly payout → the rows (purchase part + flat
part) → `displayFundParts` → `FundTable`. Nothing is stored: the field text is state, everything else is
derived in the same `useMemo`. Money stays in micro-euro and stays unrounded until `formatEuro` /
`formatEuroMicroEur`; the single rounding is at display (ADR 0012).

While the Kapitalertragsteuer checkbox is off, `flat` produces no tax anywhere (AC1): `flatTaxMicroEur` is 0,
the column shows the dash with its reason, `cash` is 0, and the existing figures of the tax-off case are
bit-identical. While the flat rate is 0 the same holds in the tax case, so the existing hand values of the
tax case stay — that is the control case the tester runs.

### Display rule for the new column and the sum line

- The flat column shows money: `formatEuro` of the part, one rounding.
- The parts of the depot are read in the table's order, row by row: the purchase part of the row, then its
  flat part. Every part is rounded once, except the last part that has a figure, which is the shown depot
  minus the other shown parts (CLAUDE.md money rule, story 032 AC2 extended). If the flat column has no
  figure anywhere, that last part is the last purchase part, which is story 032's rule unchanged.
- The fund section states the flat sum once, and the stated sum is the sum of the shown flat parts, so a
  reader adding the column gets the figure the section names. If the derived part is a flat part, that holds
  by construction.
- The shares column is not money, so the money rule does not apply to it (story 032).
- The new column's figures carry the projection label as their accessible description, like the other
  projection figures (024 AC5).

### Reasons a row shows a dash

`outside-tax-case` (the rate counts only in the tax case), `no-year-counts` (the fund is held only in its
liquidation year), `no-year-pays` (no counted year has a positive increase, or the rate is 0), plus story
032's `after-phase-end` / `before-phase-start` / `no-payout-per-share`, unchanged. A row can show two dashes
with two different reasons: a typed YTM of −100 % keeps `keine Hochrechnung je Anteil` in the purchase
columns and names `no-year-pays` in the flat column.

### Hand oracle, recomputed by the architect (2026-11-15)

Fund NAV 100 €, YTM 5 %, asOf 1.1.2025, fund year 2027, rate 2,24 %, tax 26,375 %. The year-start values on
the day count are exact: 1.1.2025 = 100,00 (day count 0), 1.1.2026 = 105,00 (365 days), 1.1.2027 = 110,25
(730 days), 31.12.2027 = 115,7625 (1095 days), so the caps never bind in this case.
2025: base 2,24 € → 0,5908 €; 2026: base 2,352 € → 0,62034 €; sum 1,21114 €. Whole gain 15,7625 €, bases
4,592 €, remaining gain 11,170,5 €, liquidation tax 2,946219375 €, payout per share 112,816280625 € →
`112,82 €`; total tax 4,157359375 € = 26,375 % × 15,7625 €. Month case, asOf 1.7.2025 (six whole months
before the acquisition month): base 1,12 € → 0,2954 € (the cap does not bind: that year's increase is
2,476357 €). Cap case, YTM 1 %: increase 1,00 € → 0,26375 €. Every number in AC2 and AC3 is right.

### Risks and how to mitigate them

1. **The base path against the projection path.** The base must read the value at the start of the year on
   the projection's day count, not the fund's whole-term factor; otherwise the bases are not a part of the
   gain and AC3's equality breaks. Mitigation: one function computes the year-start value, and AC3's
   equality is asserted as an independent hand sum (the sum of the yearly taxes plus the liquidation tax),
   not as a value the code computes.
2. **The cap.** Write it as `min(max(0, increase), value × rate)`, not `min(cap, …)` with a possibly negative
   cap: the two differ exactly on the negative branch, which is AC2's "pays nothing" case. The tester keeps a
   case where no cap binds so a change is visible (a capped input hides a mutation).
3. **The day count of the first partial year.** The value is on the day count, the fraction is whole months
   (hak's answer); these must not both reduce the same year. With the committed fixture asOf on 31.12., the
   first partial year's base is always capped by the one-day increase, so the whole-month rule cannot be
   falsified through the UI: it is measured in the unit test with asOf on a year start and no leap year in
   the span. The tester must not read the fixture values as a check of the month rule.
4. **Rounding drift between the two groups of parts.** Only one part is derived, so the sum is exact only
   there; the tester picks a case where the derived flat part differs from its own rounding and reports the
   distance to the .5 cent boundary, and asserts that the stated sum line equals the sum of the shown parts.
5. **`cash` covering the wrong funds.** Only the funds that fund a phase year are in the depot; summing over
   the whole fund list would move the depot figure. The tester runs a phase where a fund in the list is
   outside the phase and asserts the dash and that the depot does not include its money.
6. **`cash` used in the wrong direction** (`P = D/F + cash`). The round trip is asserted on the unrounded
   values in both directions with a nonzero flat rate.
7. **A negative monthly payout.** With tax on and a positive rate, `P = (D − cash)/F` can go negative when
   the depot is smaller than the yearly payments. The model returns the value as it is; only the base is
   floored at 0 (ADR 0015). UX must say what the result block shows for it; no clamp is added in the logic.
8. **`inputMode`.** The field cannot hold a negative value, so `decimal` stays correct; no new logic and no
   mutation check for it. If a later story allows a negative Basiszins, the negative-range rule of CLAUDE.md
   flips this field to `text`, and the tester re-checks it then.
9. **The live region and the copy.** The flat sum is not added to the live text (out of scope); the wording
   AC4 names is stated once in the fund section's footnote, not in the column.

### Minimal test set

One test per AC at the cheapest level that shows it; every behaviour is tested once. Every expected number
is written by hand, and no test reads its oracle from the module it checks.

- **AC1** — `parseInputs.test.ts` (branches, existing T5 test gains the flat field): `2,24` → 224, `2,245` is
  a format error (3 decimals), `100,00` → 10000 accepted, `100,01` → `range`, `-0,01` → `range`, one error per
  field, and the first invalid field is named in form order. `fieldCopy.test.ts`: the hand copy strings of UX
  §2, the bound `0` to `10000`, the key list gains `flatRate`. e2e `045 AC1`: the field is in the tax block,
  prefilled `2,24`, `inputMode="decimal"`, not disabled; with the checkbox off no flat figure anywhere and the
  tax-off figures unchanged; typing `0` in the flat field in the tax case keeps the existing hand figures of
  031 (the control case).
- **AC2** — `flat.test.ts` (new), asserted through its callers `flatTaxMicroEur` / `purchaseRows`, not
  through an internal helper: the hand values above; the month case asOf 1.7.2025 → base 1,12 € → 0,2954 €;
  the cap case YTM 1 % → 1,00 € → 0,26375 €; negative YTM → nothing; the year of liquidation excluded; and
  the N = 1 case where the first and the last year are the same year (asOf inside the fund's own year → no
  counted year → no figure, dash with `no-year-counts`).
- **AC3** — `flat.test.ts`: the equality asserted as a hand sum (0,5908 + 0,62034 + 2,946219375 =
  4,157359375 = 26,375 % × 15,7625) with an independent second implementation (the factor form), and the
  payout per share 112,816280625 € → `112,82 €`. `phase.test.ts` gains the round trip with a nonzero flat
  rate: `D → P → D` within one cent, and the flat-0 case is the existing one.
- **AC4** — e2e only: the new column header, one fund row's hand figure recomputed by the tester from the
  fixture copy with its own arithmetic (row 2030, NAV 42,00, YTM 3,00 %, tax 26,375 %: the counted years
  2026–2029 give bases 0,003401 / 0,940876 / 0,969102 / 0,998256 €, tax 0,767944 € → `0,77 €`; the first
  partial year is capped by the one-day increase, so the tester keeps the hand table), the sum line stated
  once, and the dash with each reason.
- **AC5** — e2e `045 AC5`: the depot figure with a nonzero flat rate, the shown parts of both columns adding
  up to the shown depot, with the last part taken from the total (pick values where its own rounding would
  differ), and the sum line equal to the sum of the shown flat parts. The money rule's branch itself stays in
  `purchase.test.ts` with different inputs (no same values at two levels).
- **Mutation checks** (rule P32; each run reports the file byte-identical to its pre-run backup, and exactly
  one assertion turns red): the whole-month fraction → only the month case; the cap → only the cap case; the
  `max(0, …)` sign guard → only the negative case; the liquidation year counted → only the exclusion
  assertion; `cash` over all funds → only the depot figure; `cash` in the wrong direction → only the round
  trip; the derived last part rounded on its own → only AC5's part; `fieldSpec('flatRate').max` set to null →
  only the range assertion. The credit rule cannot be separated from the payout figure: the credit enters the
  same expression as `ρ′`, so its mutation moves the equality and the figure together — the tester records it
  as one rule with two assertions, and the rule "the fund's value is not reduced by the payments" gets its
  own mutation (subtract the payments from the fund's value), which moves only the payout figure.

Affected e2e specs the developer updates: `e2e/laz.spec.ts` 036 AC1 (the exact `columnheader` list gains the
new column), 033 AC3 (the field list and the Tab sequence gain the flat field only if UX puts it before the
tax checkboxes; the design places it at the end of the tax block so the existing sequence stays), and the tax
cases of 031 AC1/AC2 and 032 AC1/AC2, which type `0` in the flat field to keep their hand values. No spec
walks `parentElement` or `locator('..')` from the new markup except `rowByHeader` (`xpath=parent::tr`) and
`valueOf` (`following-sibling::dd`), and adding a column to a row or a line to the fund section does not move
them; `cellByHeader` reads cells by header text, so it is unaffected. `fieldCopy.test.ts`'s key-list
assertion and its comment about "no field of the form has a percent bound" must name the flat field as the
exception that keeps the bound of a percent.

Affected plan for paths `apps/laz/**`: the app's vitest tests, the platform checks,
`test:e2e -w @swfactory/laz`, `test:pages` (after `build:pages`), `check:structure`, plus lint, typecheck and
format. The minesweeper checks do not run for an `apps/laz` change.

### Implementation plan

1. `flat.ts` (years, year-start value, base, tax, reasons), with its unit tests at the hand values.
2. `fields.ts` + `parseInputs.ts` (FieldId, FIELD_IDS, fieldSpec, ParsedInputs) + the copy keys; the parse
   branches and the copy test.
3. `projection.ts` reads the base factor; `phase.ts` gains `flat` and `cash`; the round trip test with a
   nonzero rate; `tax.test.ts` and `projection.test.ts` pass `FLAT_OFF`.
4. `purchase.ts`: the flat part on the row, `displayFundParts`, the money rule over both groups; its test.
5. `PlanCalculator.tsx` (default input, derived flat), `PhaseForm.tsx` (the field in the tax block),
   `FundTable.tsx` (the column, the sum line, the dash with its reason).
6. The e2e tests for AC1, AC4, AC5, the updates to the specs listed above, and the mutation runs.

Alignment with UX: UX must supply the field's label (`Vorabpauschale`), its hint (constant over the term,
counts only in the tax case), its range string (`0,00 bis 100,00 %`), the column header, the sum line, the
three facts AC4 names (first business day of the next year, the liquidation year does not count, the money
comes from the Verrechnungskonto), and the three reason strings; and it must say what the result block shows
for a depot that is smaller than the yearly payments (risk 7). The design assumes the field is the last
control of the tax block, so the existing Tab order and the form order of `FIELD_IDS` agree.

## Implementation notes

_developer: what was built, deviations from the design and why._

To be written after gate 2 is granted.

## Test report

_tester: AC → test mapping, results, defects found._

To be written after gate 2 is granted.

## Review

_reviewer: findings against the checklist; the rounds are recorded here._

To be written after gate 2 is granted.

## Explanation

_The section hak reads at gate 2, at most 15 lines of at most 120 characters._

To be written after gate 2 is granted.

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates), proposed changes to
agents/CLAUDE.md/templates, and which ones hak approved. Include a `### Cost` table (see the retro step of
`/feature`)._

To be written at the end.
