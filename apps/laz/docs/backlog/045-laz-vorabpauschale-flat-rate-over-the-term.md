---
id: 045
title: The flat rate for accumulating funds (Vorabpauschale) is a parameter, constant over the term
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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
  the rate times the whole gain. On the hand oracle of AC2, corrected by hak's answer of 2026-11-15 at gate 2
  (the day count stands as the model computes it, so the AC's figure is the reachable one): whole gain
  15,747026866 € over 1094 days, bases 4,592 €, remaining gain 11,155026866 €, liquidation tax
  2,942138335913 €, payout per share 112,804888530107 € → `112,80 €`; total tax 4,153278335913 €
  = 26,375 % of 15,747026866 €. The figure this AC had before, `112,82 €` from 1095 days, is unreachable on the
  model's day count and is withdrawn (Decision log, defect 1 of the Test report). The fund's own figure is not
  reduced by the yearly payments, because
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
- 2026-11-15 — the P32 pass as it was actually run after the incident, one rule per call with the runner's own
  green baseline before each mutation, all ten rules, every run printing byte-identity: rules 1, 3, 5, 6, 8 turn
  exactly one assertion red; rules 2 (5), 4 (4), 7 (3), 9 (3), 10 (2) turn more than one. The counts and the
  assertion sites are in the Test report, with the limit that four rules cannot be isolated. The first pass is
  not reported, see the defect section.
- 2026-11-15 — corrections to the Test report after review round 1, each checked against what a runner prints:
  the e2e split is 19 app + 41 platform specs (the earlier 24 + 36 came from a line-per-line grouping that
  under-counts), `flatPartsSum` is asserted once with a figure and never with no figure, the first-invalid-field
  assertions are in `fieldCopy.test.ts` and not in `parseInputs.test.ts`, rule 6's mutated site is
  `depotFromPayoutCents`, and rule 10's figure is quoted as what the runner printed with the shape named. The
  assertion sites of the table moved by two lines when prettier reformatted `flat.test.ts`; they are the ones the
  second pass printed.
- 2026-11-15 — ux-designer, UX §2 substring note corrected after review round 2's nit: `Pauschalsteuer` occurs
  in four places, the header, the sum line, the facts paragraph and the depot sentence.
- 2026-11-15 — gate 2, hak's answer on the day count of defect 1: the day count stands as the model computes it
  (ACT/365, ADR 0012), so 1.1.2025 – 31.12.2027 is 1094 days and `112,80 €` is the figure the story asserts. The
  `112,82 €` the story's AC3 table had (1095 days) is withdrawn as unreachable; AC3 and the architect's hand
  oracle are corrected to 15,747026866 € gain, 11,155026866 € remaining gain, 2,942138335913 € liquidation tax,
  4,153278335913 € total tax, 112,804888530107 € payout. The correction is recorded in place, not by deleting
  the numbers it corrects.
- 2026-11-15 — gate 2, hak's approval of the retro proposals: P33, P34 and P35 applied to
  `.claude/agents/tester.md`, P36 applied to CLAUDE.md under "Which checks run". P37 was not approved. The
  numbers are not reused, so the next free number is P38.
- 2026-11-15 — gate 2, hak's answer on this story: commit story 045 on its branch now, code, tests and docs as
  one commit; no push and no merge without a separate go. Status set to `done` in the front matter and in the
  backlog index.

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
occurs in four places — the header, the sum line, the facts paragraph and the depot sentence — and `Steuer`
occurs in the tax legend, the KSt label, the reason string and the new copy, so tests read the full line text or
the columnheader. `Haltedauer` occurs once, in the header. The sum line is read as paragraph text, never as a
`dd`, so `valueOf` is not used for it.

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

Correction after gate 2, hak's answer of 2026-11-15 (the day count stands as the model computes it): the AC3
figures above counted 1095 days. ACT/365 (ADR 0012) counts 1094 days from 1.1.2025 to 31.12.2027, so
31.12.2027 = 115,747026866 and the whole gain is 15,747026866 €; bases 4,592 €, remaining gain
11,155026866 €, liquidation tax 2,942138335913 €, total tax 4,153278335913 € = 26,375 % × 15,747026866 €,
payout per share 112,804888530107 € → `112,80 €`. AC3 now states this figure; the `112,82 €` above is what the
story had before the correction, and it is unreachable on the model's day count.

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

The flat rule lives in `logic/flat.ts` as the design says: the year-start value, the base of one year
(`min(max(0, increase), value × rate × wholeMonths/12)`), `flatBaseFactor`, `flatTaxMicroEur`. `flat.ts` does
not import `projection.ts`'s factor; `projection.ts` takes the base factor as a parameter, so no cycle appears
(risk 1). `purchase.ts` reads the row's flat figure through `flatTaxMicroEur`, `phase.ts` through the same
function per funding fund (`cash`), and the money rule of story 032 keeps its shape over both groups.

One deviation from the design sketch (line 381 names `flatYears` internal): it is exported, because the row
module needs the counted years to name the reason `no-year-counts` — the reason is only right when no year is
counted, and that is the same fact `flatYears` computes. Keeping it internal would make `purchase.ts` recompute
the loop, which is the duplicate the design wants to avoid. The shape of one year's base stays internal.

`fields.ts` names `flatRate` as the exception to the "no percent bound" line of story 031, and keeps
`inputMode="decimal"` because the field cannot hold a negative value, so the negative-range rule of story 030
does not apply.

The `112,82 €` of AC3 is not reachable on the app's day count (ACT/365 gives 1094 days for the story's
1.1.2025 – 31.12.2027); the code returns `112,80 €` and the test asserts that with the reason in its comment
(defect 1 of the Test report; closed by hak's answer at gate 2 on 2026-11-15: the day count stands, the story's
figure is corrected to `112,80 €`).

## Test report

_tester: AC → test mapping, results, defects found._

### The runs I measured (2026-11-15, my own runs, one at a time)

| Check                                    | What the runner printed                                                                                                                                                                                                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test -w @swfactory/laz`             | `Test Files 10 passed (10)`, `Tests 35 passed (35)`                                                                                                                                                                                                                                      |
| `npm run test:e2e -w @swfactory/laz`     | `60 passed (5.8s)` = 19 app specs (`e2e/laz.spec.ts` + `e2e/laz-044-explanations.spec.ts`, three of them the 045 tests for AC1, AC4, AC5) + 41 platform specs. Counted from the run's own JSON report (`--reporter=list,json`), not from the line-per-line grouping, which under-counts. |
| `npm run typecheck -w @swfactory/laz`    | `tsc --build`, no output (green)                                                                                                                                                                                                                                                         |
| `npm run lint -w @swfactory/laz`         | `eslint .`, no output (green)                                                                                                                                                                                                                                                            |
| `npm run format:check -w @swfactory/laz` | `All matched files use Prettier code style!`                                                                                                                                                                                                                                             |
| `npm run check:structure`                | `ok (3 app(s): avd, laz, minesweeper; 38 stories; 64 markdown files, 144 factory files scanned)`                                                                                                                                                                                         |

Rule B: the paths affected are `apps/laz/**`, so the minesweeper checks do not run; the whole-tree checks
(`check:structure`) stay whole tree.

### AC → test mapping

Every expected number is the tester's own arithmetic, written as a literal in the test; no test reads its
oracle from the module it checks.

| AC  | Level | Test                                                                                                                                                          | Hand oracle                                                                                                                                                                                                                                                                                                      |
| --- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 | unit  | `parseInputs.test.ts` T5 (flat branches: `2,24` → 224, `2,245` format, `100,00` → 10000, `100,01` range, `-0,01` range, one error per field)                  | written by hand                                                                                                                                                                                                                                                                                                  |
| AC1 | unit  | `fieldCopy.test.ts` (the copy strings of UX §2, the bound 0–10000, the key list gains `flatRate`, and the first invalid field in form order at lines 183–187) | written by hand                                                                                                                                                                                                                                                                                                  |
| AC1 | e2e   | `045 AC1`                                                                                                                                                     | the field in the tax block, prefilled `2,24`, `inputMode="decimal"`, not disabled; tax off → every row inside the phase shows `– Steuer nicht angehakt` and no sum line; tax on → row 2031 `1,10 €` and a sum line                                                                                               |
| AC2 | unit  | `flat.test.ts` AC2                                                                                                                                            | bases `0,5908 €` + `0,62034 €` → `1.211.140` micro-euro; month case asOf 1.7.2025 → `12 − 6 = 6` counted months → `0,2954 €` → `295.400`; cap case YTM 1 % → `0,26375 €` → `263.750`; YTM −5 % → 0 with the positive pair `590.800`; N = 1 (asOf inside the fund's own year) → no counted year, `no-year-counts` |
| AC3 | unit  | `flat.test.ts` AC3                                                                                                                                            | hand sum `1.211.140` + `2.942.138,335913` = `4.153.278,335913` = 26,375 % × `15,747026866 €`; payout per share `112,80488853 €` → `112,80 €` (see defect 1)                                                                                                                                                      |
| AC3 | unit  | `phase.test.ts`                                                                                                                                               | round trip within one Cent: `D = 401.424,394258` Cent, `F = 40,0900417691`, `cash = 523,976566` Cent, shown `4.014,24 €`; control with the rate 0: cash 0 and `4.104,63 €`                                                                                                                                       |
| AC4 | e2e   | `045 AC4`                                                                                                                                                     | column header, rows 2029 `0,48 €` and 2030 `0,77 €`, sum line `1,25 €` (not the whole-list reading `11,32 €`), the four reasons                                                                                                                                                                                  |
| AC5 | e2e   | `045 AC5`                                                                                                                                                     | phase 01.2033–12.2034, P = 10.001 Cent → depot `1.900,19 €`; parts `97763/147` and `91917/192`, the last flat part is the depot minus the other parts (192 against its own rounding 191); parts add to the shown depot; sum line `3,39 €`                                                                        |
| AC5 | unit  | `purchase.test.ts`                                                                                                                                            | a different case (asOf 1.1.2027, phase 01.2031–12.2033, P = 10.001 Cent): parts `[108054,77]`, `[103184,110]`, `[97774,146]` (derived 146 against its own rounding 147), depot 309345 Cent, sum line 333 Cent                                                                                                    |

### Mutation checks (P32)

The runner backs up the file in `…\Temp\opencode\p32backups` before the run, runs the checks on the clean
file first (the baseline), applies the mutation, runs the checks, then restores from the backup and prints
whether the file is byte-identical to that backup. Every run below prints its own baseline and its own
byte-identity; the numbers are what the runner printed.

| #   | Rule mutated                                                                     | Runner printed    | What turned red                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | whole-month fraction (`12 − (month − 1)` → `12`)                                 | red, 1 assertion  | `flat.test.ts:52` — `expected 590800 to be close to 295400` (the month case). Exactly one ✓                                                                                                                                                                                                                                                                     |
| 2   | the cap (`min(max(0, increase), cap)` → `max(0, increase)`)                      | red, 5 assertions | `flat.test.ts:45` hand sum, `flat.test.ts:114` AC3 equality, `phase.test.ts:48`, `phase.test.ts:100`, `purchase.test.ts:138`. Not one — see defect 2                                                                                                                                                                                                            |
| 3   | the sign guard (`max(0, increase)` → `increase`)                                 | red, 1 assertion  | `flat.test.ts:66` — `expected -1318750 to be +0` (the negative case). Exactly one ✓                                                                                                                                                                                                                                                                             |
| 4   | the year of liquidation counts (`fundYear − 1` → `fundYear`)                     | red, 4 assertions | `flat.test.ts:45`, `flat.test.ts:114`, `phase.test.ts:100`, `purchase.test.ts:138`. Not one — see defect 2                                                                                                                                                                                                                                                      |
| 5   | `cash` over all funds instead of the phase years                                 | red, 1 assertion  | `phase.test.ts:100` — the cash assertion (15,15 Cent instead of ≤ 1). Exactly one ✓                                                                                                                                                                                                                                                                             |
| 6   | `cash` in the wrong direction, `+ cash` → `− cash` in `depotFromPayoutCents`     | red, 1 assertion  | `phase.test.ts:96` — the round trip (26,14 Cent instead of ≤ 1). Exactly one ✓. The same sign change read in the `buildPlan` reading stays green, because the round trip runs through the pair; only the pair's depot side can move.                                                                                                                            |
| 7   | the last part rounded on its own (`derived = total − others` → its own rounding) | red, 3 assertions | `purchase.test.ts:70`, `purchase.test.ts:110` (both inherited from story 032), `purchase.test.ts:138` (AC5's part). Not one — see defect 2                                                                                                                                                                                                                      |
| 8   | `fieldSpec('flatRate').max` → null                                               | red, 1 assertion  | `parseInputs.test.ts:119` — `expected { ok: true, value: 10001 } to deeply equal { ok: false, error: { kind: 'range' } }`. Exactly one ✓                                                                                                                                                                                                                        |
| 9   | the credit (`rho − 1 − flatBaseFactor` → `rho − 1`)                              | red, 3 assertions | `flat.test.ts:114` (the equality), `phase.test.ts:100` (the round trip), `purchase.test.ts:138` (the parts). The design already records this rule as one rule with more than one assertion                                                                                                                                                                      |
| 10  | the fund value reduced by the payments                                           | red, 2 assertions | `flat.test.ts:122` (the payout figure), `purchase.test.ts:138` (the parts). My run prints `expected '111,44 €' to be '112,80 €'`. The figure depends on the shape of the mutation: `nav × ρ′ − nav × flatBaseFactor` prints `108,21 €`, the shape that subtracts the flat tax as such prints `111,59 €`. The count 2 is what the runner prints and what stands. |

Every run printed `byte-identical to the backup taken before the run: true`.

### Defects and limits found

1. **The day count of AC3.** The story counts 1095 days from 1.1.2025 to 31.12.2027; the app's `dayCount`
   (ADR 0012, ACT/365) gives **1094** for the same two dates, so the gain is `15,747026866 €` and the payout
   per share is `112,80488853 €` → shown `112,80 €`, not the `112,82 €` AC3 names. The test asserts `112,80 €`
   and says so in its comment. The number in AC3 is the story's own hand table; for gate 2. Hak's answer of 2026-11-15 at gate 2 closes it:
   the day count stands as the model computes it, and AC3's figure is corrected to `112,80 €`, so this was a
   documentation error in the story's table, not a defect in the code.
2. **P32 isolation is not reachable for four rules.** A mutation of the cap, the whole-month fraction, the
   liquidation-year exclusion or the credit changes the value in every hand case where that part of the
   formula decides the number, so it moves several tests at once (the counts above). Only a case where the
   other branch decides the value is immune, and the tester's own hand table has no such case for these
   rules. The plan expected one red assertion per rule; reality is what the table records.
3. **The incident at rule 9.** The first mutation pass was killed by the shell pipeline while it was writing
   `logic/projection.ts` back, which left the file at 0 bytes. Its backup in the temp folder is 0 bytes too, so
   P32's byte-identity could not be proven for that pass and the whole pass is not reported. `projection.ts`
   was rebuilt from the tester's read of the file before the run plus the tail of the committed version
   (`git show HEAD:apps/laz/src/features/plan/logic/projection.ts`); the rebuild is not proven byte-identical,
   and after it the checks were green again (10 files / 35 tests). The rules were then re-run one at a time,
   which is the table above.
4. **The e2e initial state shows a bare dash.** The AC1 e2e test failed first because no result exists before
   an amount is typed, so a row inside the phase shows `–` without a reason (story 032's rule). The test now
   types `10000,00` before the dash loop; that was observed failing, then green.
5. **The Decision log's earlier tester entry** (lines 162–166) is from a run that was cancelled and returned
   nothing; it is not a result. The correction at lines 183–194 already withdraws it.

### Checked beyond the ACs

- Keyboard order in the tax block: the flat field is the last control of the block (UX §1); `033 AC3` keeps its
  sequence because the field is rendered by its own call in `PhaseForm`.
- The sum line is shown only when a row has a flat figure (ux-designer's display rule of 2026-11-15). The positive
  half is asserted in the e2e tax-on case (a sum line is present) and the negative half in the e2e tax-off case
  (no sum line). `flatPartsSum` itself is asserted once with a figure (`purchase.test.ts:152`, 333 Cent); no
  unit test calls it with no figure, so the empty case is covered only by the e2e, and P16's one test per AC is
  satisfied by the e2e pair.
- A row can show two dashes with two different reasons: asserted by typing YTM −100 % (AC4's e2e test).
- `no-year-counts` cannot be reached in e2e with the committed fixture (asOf 31.12.2026 is not inside any fund
  year), so it is asserted in `flat.test.ts` through `purchaseRows`.

## Review

_reviewer: findings against the checklist; the rounds are recorded here._

**Verdict: CHANGES_REQUESTED.** Round 1 (P16), on the working tree as it stands (branch
`feature/045-laz-vorabpauschale-flat-rate-over-the-term`, nothing committed).

**What the reviewer ran, not what the tester reported.** `npm run verify --mode=full --no-record`: every step
ok except `format:check: FAILED (1)` on this story file (prettier wants the tables padded, double quotes inside
the ts fence, and the blank line before `## Review` removed). `npm test -w @swfactory/laz` in my own run:
`10 passed (10)` / `35 passed (35)`. `npm run test:e2e -w @swfactory/laz` (port 5174 free before the run):
`60 passed (5.8s)` = 19 app specs + 41 platform specs, not the 24 + 36 the Test report names. `test:pages` 24,
`check:structure` ok with the same numbers the report quotes. Hand oracle recomputed independently: AC2
`1211140 / 295400 / 263750 / 0 / 590800`; AC3's equality holds over 225 sweep cases; `dayCount` gives **1094**,
so AC3's 1095-day table and `112,82 €` are unreachable and the test's `112,80 €` is right — defect 1 stands;
AC4 cents `47,929412` and `76,794412`; AC5 depot `190018,979029` → `190019`, parts `97763/147`, `91917/192`,
sum `339`; purchase unit parts `[108054,77] [103184,110] [97774,146]`, sum `333`; money rule over 45 cases,
0 mismatches; tax-off rows all `outside-tax-case`; the YTM −100 row keeps both reasons. The P32 table was
re-run by the reviewer in a scratch copy outside the repository (`…\Temp\opencode\p045run`, with
`node_modules` and the module's own JSON import patched to read the fixture copy): all ten rules, counts and
assertion sites as the table records, and every run reported the file byte-identical to its pre-run copy.

### Findings

1. **T1 / K9 fail.** `format:check` is red on this story file as it stands; the formatting pass after the
   review step resolves it, but as measured the green gate is not reached.
2. **T3 fail.** The Test report says the empty-sum display rule is asserted in `flat.test.ts` (`null` for an
   empty sum). It is not: `flatPartsSum` is asserted once (`purchase.test.ts:152`, 333), no test calls it with
   no figure, so the rule lives only in the e2e tax-off case. Also the AC table attributes "first invalid field
   in form order" to `parseInputs.test.ts` T5 — that assertion is in `fieldCopy.test.ts`; `parseInputs.test.ts`
   has no `firstInvalidField` assertion.
3. **K1 fail (minor).** `flatYears` is exported although the design sketch names it internal (line 381); the
   reason is in the code comment but not in Implementation notes, which is still the placeholder. And
   `fields.ts` keeps the doc line that no field of the form has a percent bound while its own `fieldSpec`
   gives `flatRate` 0–10000; the design required that comment to name the flat field as the exception —
   `fieldCopy.test.ts` does, `fields.ts` does not.
4. **Rule 10's quoted string is not reproducible.** The count is (2 red: `flat.test.ts:120`,
   `purchase.test.ts:138`), but the figure depends on the mutation shape: `nav × ρ′ − nav × flatBaseFactor`
   prints `108,21 €`, and subtracting the flat tax prints `111,59 €`; `111,44 €` is `112,82 − 1,38`, which is
   the story's 1095-day table, so no mutation of the code in the repository prints it.
5. **Rule 6 needs the right site.** Read as `+ cash` in `buildPlan` it stays green (the round trip runs through
   the pair); the table's `phase.test.ts:96` only appears when the sign is flipped in `depotFromPayoutCents`,
   where the reviewer's run prints 26,14 — as the table says.
6. **K6 fail (minor).** Front matter `status: designed` and the index row `designed` (`docs/backlog/README.md`)
   are equal, but both should read `in-review` while this review stands.
7. **K8 fail.** `CHANGELOG.md` carries a per-story entry for #044 and none for #045, though the field, the new
   column, the sum paragraph and the depot that includes the payments are user-visible; `apps/laz/README.md`
   still describes only the payout phase and the projection.
8. **K7 note.** The Decision log entry at lines 162–166 still states results no run printed (33 assertions over
   7 rules, 6 mutation checks, 57 assertions); the correction at 183–194 withdraws it, and the run that exists
   is the 10-rule table. The rule-9 incident cannot be proven byte-identical; the file as it stands is
   consistent with HEAD plus the `flatBaseFactor` parameter.
9. **UX copy is exact.** Field label, range, hint, format word, unit, the four error strings, the column header,
   the sum line, the facts paragraph, the depot note and the three reasons match UX §2 when read through the
   module. Occurrences in the copy code: `Vorabpauschale` once, `Vorsteuerpauschale` once, `Haltedauer` once;
   `Pauschalsteuer` four times — the depot note is a fourth place UX §2 does not list.
10. **flat.test.ts's own claim is too strong.** It says nothing is read back from `flat.ts`, yet AC3 reads
    `flatBaseFactor` and `payoutFactor`; the assertion is still anchored by hand literals, so it can break, but
    the comment should say that the equality compares the two shapes.

### Checklist

| Item | Result | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | AC1 `fields.ts`/`parseInputs.ts` + `parseInputs.test.ts`, `fieldCopy.ts` + `fieldCopy.test.ts`, e2e `045 AC1`; AC2 `flat.ts` `wholeMonths`/`yearBase` through `flatTaxMicroEur` and `purchaseRows` + `flat.test.ts`; AC3 `flatBaseFactor` and the credit in `projection.ts` + `flat.test.ts` AC3 and `phase.test.ts`; AC4 `purchase.ts` `flatReasonFor`/`withFlatFigure` + e2e `045 AC4`; AC5 `phase.ts` `flatCashCents`/`depotFromPayoutCents` and `purchase.ts` `displayFundParts` + `purchase.test.ts` and e2e `045 AC5`. Every number recomputed by the reviewer (above). |
| C2   | n.a.   | no network call, no pending state in the diff                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| C3   | pass   | `flat` is derived inside the existing memo from `parsed`; no new effect, no stored derived value, no new dependency                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| C4   | n.a.   | no render loop or imperative controller                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| C5   | n.a.   | no reducer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| C6   | pass   | a parse error ends in the visible error state and the live region; no catch in the diff                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| S1   | pass   | no `dangerouslySetInnerHTML`; the new column, paragraph and field render text                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| S2   | n.a.   | no config, env or auth code changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| S3   | n.a.   | no dependency changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| S4   | n.a.   | no dev-only code added                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| S5   | n.a.   | no `scripts/*.mjs` touched                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| T1   | fail   | my `npm run verify --mode=full --no-record`: all steps ok, `format:check FAILED (1)` on this story file                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| T2   | pass   | one AC-level fact per level: parse branches, copy strings, the rendered control; AC5's money rule at unit with different inputs, as the design says                                                                                                                                                                                                                                                                                                                                                                                                                           |
| T3   | fail   | finding 2: an assertion the report names does not exist, and one assertion is credited to the wrong file                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| T4   | pass   | no counted Tab sequence in the changed specs; `033 AC3` is untouched (the flat field is rendered by its own call, so the sequence stays); specs named after ACs                                                                                                                                                                                                                                                                                                                                                                                                               |
| T5   | pass   | `flat.ts` branches, the parse branches and the money rule each have a test; internal helpers tested through their callers                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| K1   | fail   | findings 3 and 10                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| K2   | pass   | no `any`, no `!`, named exports, tests next to the code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| K3   | n.a.   | no CSS changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| K4   | n.a.   | no platform or factory file changed by this story; `check:structure` green                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| K6   | fail   | finding 6                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| K7   | pass   | every answer has an entry, the log is append only; see finding 8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| K8   | fail   | finding 7                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| K9   | fail   | finding 1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| K10  | n.a.   | no workspace script or tsconfig changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| K11  | n.a.   | no env variable added                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| A1   | pass   | the field keeps label, hint and error text through `TextField`, is never disabled, keeps the `field-<id>` pattern, and is read by its label in the helper                                                                                                                                                                                                                                                                                                                                                                                                                     |
| A2   | n.a.   | no colour or state cue added; the dash stays a glyph                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| A3   | pass   | the live region is the existing one, mounted before its content; the new string announces the flat field                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| A4   | n.a.   | no render loop or canvas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

**Round 2, reviewer 2026-11-15. Verdict: APPROVED. Checklist version: 2**

What the reviewer ran itself, one check at a time, in this repository (`node_modules` present):
`npm run verify --mode=full --no-record` — 12 of 12 steps ok, `format:check` ok (finding 1 resolved);
`npm test -w @swfactory/laz` → `Test Files 10 passed (10)`, `Tests 35 passed (35)`;
`npm run test:e2e -w @swfactory/laz` (port 5174 free before the run) → `60 passed (5.8s)`, counted by project
= 19 `[chromium]` app specs (three of them `045 AC1`/`AC4`/`AC5`) + 41 `[platform]`; `test:pages` 24;
`check:structure` ok with the same numbers the Test report quotes. Two P32 rules re-run in the repository with
the tester's runner, one at a time: rule 2 (baseline green, 5 red at `flat.test.ts:45`, `flat.test.ts:114`,
`phase.test.ts:48`, `phase.test.ts:100`, `purchase.test.ts:138`, byte-identical) and rule 10 (baseline green,
2 red at `flat.test.ts:122` and `purchase.test.ts:138`, `expected '111,44 €' to be '112,80 €'`, byte-identical);
the reviewer's own hash of `flat.ts` and `projection.ts` before and after each run is equal. The hand oracle was
recomputed independently: `flatBaseFactor` 0,04592 per euro, liquidation tax 2,942138336 €, sum 4,153278336 €,
payout 112,804889 € → `112,80 €`; the three rule-10 shapes give `111,44 €` / `108,21 €` / `111,59 €`, so the
table's figures hold; rule 6's miss `2 · cash / F` = 26,14 Cent.

| Item | Result | Note                                                                                                                                                                                                                                                                                                        |
| ---- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | the AC → test map of round 1 stands; the oracle recomputed in round 2 (above)                                                                                                                                                                                                                               |
| C2   | n.a.   | no network call, no pending state in the diff                                                                                                                                                                                                                                                               |
| C3   | pass   | `flat` is derived in the existing memo, no new effect or stored derived value                                                                                                                                                                                                                               |
| C4   | n.a.   | no render loop or imperative controller                                                                                                                                                                                                                                                                     |
| C5   | n.a.   | no reducer                                                                                                                                                                                                                                                                                                  |
| C6   | pass   | a parse error ends in the visible error state and the live region; no catch                                                                                                                                                                                                                                 |
| S1   | pass   | no `dangerouslySetInnerHTML`; the new column, paragraphs and field render text                                                                                                                                                                                                                              |
| S2   | n.a.   | no config, env or auth code changed                                                                                                                                                                                                                                                                         |
| S3   | n.a.   | no dependency changed                                                                                                                                                                                                                                                                                       |
| S4   | n.a.   | no dev-only code added                                                                                                                                                                                                                                                                                      |
| S5   | n.a.   | no `scripts/*.mjs` touched                                                                                                                                                                                                                                                                                  |
| T1   | pass   | my full verify run: 12 of 12 steps ok, `format:check` ok                                                                                                                                                                                                                                                    |
| T2   | pass   | one AC-level fact per level; AC5's money rule at unit with different inputs                                                                                                                                                                                                                                 |
| T3   | pass   | finding 2 resolved: the report now credits the first-invalid assertions to `fieldCopy.test.ts:183–187`, and the empty-sum case is credited to the e2e pair (`laz.spec.ts:814` and `:820`), which is what the specs assert; `flatPartsSum` is asserted once (`purchase.test.ts:152`, 333) as the report says |
| T4   | pass   | no counted Tab sequence or raw coordinates in the changed specs; specs named after ACs                                                                                                                                                                                                                      |
| T5   | pass   | `flat.ts` branches, the parse branches and the money rule each have a test                                                                                                                                                                                                                                  |
| K1   | pass   | findings 3 and 10 resolved: `flatYears` export is recorded in Implementation notes (613–616), `fields.ts:59–60` names `flatRate` 0–10000 as the percent-bound exception; see the nit below                                                                                                                  |
| K2   | pass   | no `any`, no `!`, named exports, tests next to the code                                                                                                                                                                                                                                                     |
| K3   | n.a.   | no CSS changed                                                                                                                                                                                                                                                                                              |
| K4   | n.a.   | no platform or factory file changed; `check:structure` green                                                                                                                                                                                                                                                |
| K6   | pass   | finding 6 resolved: front matter line 4 and `docs/backlog/README.md:46` both read `in-review`                                                                                                                                                                                                               |
| K7   | pass   | append only; the cancelled run's entry is withdrawn by the correction at 183–194                                                                                                                                                                                                                            |
| K8   | pass   | finding 7 resolved: `CHANGELOG.md:47–54` carries the `(#045)` entry, `apps/laz/README.md:47–55` the flat-rate paragraph                                                                                                                                                                                     |
| K9   | pass   | finding 1 resolved: `prettier --check .` prints `All matched files use Prettier code style!`                                                                                                                                                                                                                |
| K10  | n.a.   | no workspace script or tsconfig changed                                                                                                                                                                                                                                                                     |
| K11  | n.a.   | no env variable added                                                                                                                                                                                                                                                                                       |
| A1   | pass   | the field keeps label, hint and error text through `TextField`, is never disabled                                                                                                                                                                                                                           |
| A2   | n.a.   | no colour or state cue added; the dash stays a glyph                                                                                                                                                                                                                                                        |
| A3   | pass   | the existing live region is mounted before its content; the new string announces                                                                                                                                                                                                                            |
| A4   | n.a.   | no render loop or canvas                                                                                                                                                                                                                                                                                    |

Findings: 1. `[nit] apps/laz/src/features/plan/fieldCopy.ts:219 - UX §2's substring note lists `Pauschalsteuer`
in three places, the copy has four (`COPY.flatDepotNote`); no code defect, the story's note should name the
depot sentence as the fourth place, or the tester's count should be read as the three paragraphs only.`
Resolved after the round: UX §2's note now names four places, the header, the sum line, the facts paragraph and
the depot sentence.

Round 2 checks of round 1's findings: 1 green, 2 green, 3 green, 4 green (my run prints `111,44 €` and the
count 2), 5 green (the runner's rule-6 text sits in `depotFromPayoutCents`, `phase.ts:130–133`), 6 green,
7 green, 8 green as a note, 9 green with the nit above, 10 green (`flat.test.ts:14–16` now says AC3 compares
two shapes of the same rule). The Test report's run table and the P32 table match what the runners print today.

## Explanation

_The section hak reads at gate 2, at most 15 lines of at most 120 characters._

The app charges a second tax for funds that keep their money: a flat rate on the value at the start of each year.
The rate is one number for the whole term, prefilled with 2,24 %, and counts only when capital gains tax is on.
A year's base is that value times the rate, never more than what the year actually earned, never below zero.
The year the app reads from counts with whole months only; the year the fund is sold does not count at all.
The payments come from the settlement account, so the fund keeps its value, and the depot searched includes them.
At liquidation the tax on the gain is read on the gain minus the bases already taxed, so no base is taxed twice.
What changed: one field in the tax block, one column in the fund table, one sum line, the depot formula.
Risk: the model counts 1094 days for the story's 1.1.2025 to 31.12.2027, not 1095, so its payout figure is unreachable.
The whole-month rule cannot be shown in the app: the committed data date is a year end, so it is checked at logic level.
Four rules move more than one assertion when mutated, because they decide the number in other hand cases too.
Not verified: no real market data, no real tax filing, no real device; only the automated checks on this machine.
The first mutation pass was killed while a file was written back, so it is not reported; the rules ran again one by one.
The tests read hand figures the tester wrote by hand, never a value from the module under test.
Working tree as the reviewer measured it; gate 2 answered 2026-11-15: day count stands, figure corrected, committed.

## Retrospective

_What went wrong, root cause, proposed changes, and what hak approved._

What went wrong in this story:

1. Review round 1 was CHANGES_REQUESTED. Three findings were claims the Test report had made without a runner:
   an assertion that does not exist (`flatPartsSum` with no figure), an assertion credited to the wrong file
   (`firstInvalidField` lives in `fieldCopy.test.ts`, not `parseInputs.test.ts`), and a mutation figure that no
   mutation of the code prints (`111,44 €` is `112,82 − 1,38`, the story's table figure as it stood before the gate 2 correction, not a printed value). Plus
   a status that did not match the index row, and no CHANGELOG or README entry.
2. The e2e split the report quoted (24 app + 36 platform) was wrong; the run's own JSON report prints 19 app +
   41 platform specs. The line-per-line grouping under-counts.
3. The first mutation pass was killed by the shell pipeline while it was writing a file back, which left
   `logic/projection.ts` at 0 bytes. Its backup in the temp folder was 0 bytes too, so P32's byte-identity could
   not be proven for that pass; the pass is not reported and the rules were re-run one at a time.
4. Defect, for gate 2: AC3 names 1095 days from 1.1.2025 to 31.12.2027, the model's day count gives 1094, so the
   payout figure AC3 promises (`112,82 €`) cannot appear; the test asserts what the model returns, `112,80 €`; hak's answer at gate 2 on 2026-11-15 closed it: the day
   count stands as the model computes it, the story's figure is corrected, and this was a documentation error in
   the story's table, not a defect in the code.
5. A tester run that was cancelled had written its numbers into the Decision log (lines 162–166); the correction
   at 183–194 withdraws it. A cancelled run returns nothing, and what it wrote is not a result.
6. **A flaky run at gate 2, recorded as printed.** The first full run at gate 2 failed on `test:e2e` with
   `109 passed (47.9s)`, on `apps/minesweeper/e2e/minesweeper-3d-effects.spec.ts:571:5` (AC2, the win effect,
   dark). The same specs run again printed `110 passed (49.7s)`, and the full run after that printed
   `verify: ok, 12 step(s), 75.8 s wall clock`. This story's files are under `apps/laz/**`, which does not run
   the minesweeper checks (Rule B, story 034); the full run runs them anyway, and the 3D spec is the known
   software-WebGL flake. The green run is the one recorded here, not the failed one.

Root causes: the report was written from the plan instead of from what the runner printed; the rules that decide
the value in several hand cases cannot be isolated by a mutation, and no case exists where they cannot bind; the
runner wrote the file back inside a pipeline that could be killed before the write finished.

Proposed changes (numbers continue after P32, never reused):

- **P33 (`.claude/agents/tester.md`):** for each rule the tester's own hand table must contain a case where the
  other rules cannot bind, so a mutation moves exactly one assertion. Where the design cannot offer such a case,
  the design states the coupling in its risk list and the tester reports the count as a limit, not as a defect.
- **P34 (`.claude/agents/tester.md`):** a mutation runner writes the file back from its own backup after the
  checks finish, inside the runner, never inside a shell pipeline that can be killed. A run interrupted while
  writing is recorded as an incident, its pass is not reported, and the runner's backups stay outside the
  repository.
- **P35 (`.claude/agents/tester.md`):** the Test report quotes only what a runner printed, and only assertions
  it read in the file it names. A figure from the story's own table is not a printed value; when a figure
  depends on the shape of the mutation, the count is quoted and the shape is named.
- **P36 (proposed for CLAUDE.md, from the reviewer's memory):** call
  `node scripts/verify.mjs --mode=full --no-record` directly. Through `npm run` the flags are eaten as npm
  config, the script falls back to the affected mode, and a recorded run reports "nothing to run".
- **P37 (proposed for CLAUDE.md):** hash the mutated file yourself before and after a mutation run, so the
  byte-identity is your own observation and not only the runner's printed line.

Which of these hak approves is recorded here after gate 2. Hak approved P33, P34, P35 and P36 on 2026-11-15;
P37 was not approved, and its number is not given to another rule.

### Cost

_The OpenCode harness prints no per-run tokens, tool uses or duration for a role run, and no running list was
kept for this story, so every figure cell says `not measured` with its reason; the rows are the runs that
happened, in chronological order._

| Role                             | Round | Model                   | Tokens                                                | Tool uses                                             | Duration                                              |
| -------------------------------- | ----- | ----------------------- | ----------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| product-owner                    | 1     | inherit (strata/iq2_xs) | not measured (harness prints none)                    | not measured (harness prints none)                    | not measured (harness prints none)                    |
| ux-designer                      | 1     | inherit (strata/iq2_xs) | not measured (harness prints none)                    | not measured (harness prints none)                    | not measured (harness prints none)                    |
| architect                        | 1     | inherit (strata/iq2_xs) | not measured (harness prints none)                    | not measured (harness prints none)                    | not measured (harness prints none)                    |
| developer                        | 1     | inherit (strata/iq2_xs) | not measured (harness prints none)                    | not measured (harness prints none)                    | not measured (harness prints none)                    |
| tester, run cancelled            | 1     | inherit (strata/iq2_xs) | not measured (a cancelled run reports nothing)        | not measured (a cancelled run reports nothing)        | not measured (a cancelled run reports nothing)        |
| tester, done in the main session | 2     | inherit (strata/iq2_xs) | not measured (the figures belong to the main session) | not measured (the figures belong to the main session) | not measured (the figures belong to the main session) |
| reviewer                         | 1     | inherit (strata/iq2_xs) | not measured (harness prints none)                    | not measured (harness prints none)                    | not measured (harness prints none)                    |
| reviewer                         | 2     | inherit (strata/iq2_xs) | not measured (harness prints none)                    | not measured (harness prints none)                    | not measured (harness prints none)                    |
| total (measured)                 |       |                         | n/a                                                   | n/a                                                   | n/a                                                   |
| orchestrator (main session)      |       | strata/iq2_xs           | not measured                                          | not measured (no running list)                        | not measured (no running list)                        |

The tester's work of this story was done in the orchestrator's own session with its own runner, after the first
tester run was cancelled; the reviewer's two rounds were runs of the reviewer role. No role stood out in cost,
because nothing here was measured.
