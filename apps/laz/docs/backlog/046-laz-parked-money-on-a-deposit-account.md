---
id: 046
title: The payout falls monthly, and money that is not yet needed can be parked on a deposit account for a rate that is a parameter
status: designed # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<app name>/docs/backlog)
size: M # S | M | L (story 026). S = at most three ACs: needs only the Explanation, no Review section and no Cost table.
branch: feature/046-laz-parked-money-on-a-deposit-account
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [024/AC3, 032/AC1, 032/AC2, 045/AC5] # the round trip, the shares per fund, the parts that add up to the depot: all four are false while the parking option is on
superseded-by: # set on the OLD story when a newer one replaces it
---

# 046 – The payout falls monthly, and money that is not yet needed can be parked on a deposit account for a rate that is a parameter

## Original request

> "nächste story : das Geld in Jahr X wird ja nicht jährlich ausgezahlt, sondern monatlich (Annahme: jeweils
> zum letzten des Monats). Füge eine Option dazu, dass nicht benötigte Geld auf einem Tagesgeldkonto bis zur
> jeweiligen Auszahlung zu parken (Zinssatz : Parameter). Falls Steuern angeklickt sind, müssen die anfallenden
> Zinsen versteuert werden (mit den schon existierenden Steuer Paramtern)" (hak, 2026-11-15)

## User story

As the depot owner, I want the plan to stop treating a phase year's money as one amount that is paid at the
end of the year, and to show what the money that is not yet needed earns while it waits for its monthly
payout — and in the tax case, what tax that interest costs — so that I can see the effect of parking the
money at a rate I choose.

## Context — the research (2026-11-15)

- The payout assumption hak names: the money of a phase year is paid out month by month, on the last day of
  each month. The app already has the phase as whole calendar months (story 033), so the month is the unit;
  the amount for a month is the monthly target `P`, and the money that waits at the start of a month is the
  amount for that month and the months after it in the same phase year.
- Interest on a deposit account (Tagesgeld) is a capital earning: § 20 Abs. 1 Nr. 7 EStG, taxed with the
  Abgeltungsteuer 25 % plus 5,5 % Solzzuschlag on that (26,375 %), plus church tax on the Kapitalertragsteuer
  (8 % in Bayern and Baden-Württemberg, 9 % elsewhere) — exactly the rates story 031 already models. Nothing
  new is needed for the tax of the interest, and the Sparer-Pauschbetrag stays out of the model as story 045
  decided (the tax case in this app means: tax on, no deduction).
- The tax year follows the Zufluss: the year the interest is credited is the year it is taxed (Zuflussprinzip,
  § 11 Abs. 1 EStG); a credit for December that lands between 1.1. and 10.1. still counts for the previous
  year for regularly recurring earnings (§ 11 Abs. 1 S. 2 EStG). For one phase year the model keeps the
  interest and its tax in that calendar year.
- What the market pays now (2026-11-15): best action rates 4,00–4,25 % for a few months, best permanent rate
  3,00 % (Finanzfacts barometer), the average of the ten best permanent rates 2,41 %, the average over all
  45 providers 1,52 %, the EZB deposit rate 2,50 %. Interest is credited monthly, quarterly or yearly
  depending on the bank; monthly credit adds the effect of interest on interest (3,00 % yearly → 3,042 %
  effective with monthly credit, Stiftung Warentest). The parameter is one constant rate over the term, as
  story 045 agreed for the flat rate; which value it is prefilled with is an open question (Q1).

## How the model reads this (before the design)

For a phase year with `m` phase months and a monthly target `P`:

- balance at the start of month `k` = `P · (m − k + 1)`;
- the interest of the year (no interest on interest within the year) =
  `P · rate · (1 + 2 + … + m) / 12 = P · rate · m(m + 1) / 24`;
- in the tax case the tax on that interest = `interest × the rate story 031 gives`, and the net interest is
  what reduces the money the plan needs at the start of the phase year;
- so the money that must be there at the start of the phase year is `P·m − netInterest`, and the phase factor
  becomes `F = Σ (m_y − k_y) / ρ′_y` with `k_y = rate · m_y(m_y + 1) / 24 × (1 − tax rate)`, `k_y = 0` when
  the option is off. The two directions stay one inverse pair: `D = P·(F − K) + cash` and
  `P = (D − cash) / (F − K)`, where `cash` is story 045's flat part. With the option off this is exactly the
  model that exists today.

Hand example for the interest, `P = 100 €`, rate `2,50 %`, one full phase year:
`6,5 × 100 × 0,025 = 16,25 €`; tax case at `26,375 %` (no church tax): `4,2859375 €`, net `11,9640625 €`;
money needed at the start of that year `1188,0359375 €`. A partial phase year of three months:
`100 × 0,025 × 12/24 = 1,25 €`, tax `0,3296875 €`, net `0,9203125 €`. These are the oracles the tester uses.

## Acceptance criteria

- **AC1 (the option and the parameter):** Given the parking option, then there is a control that turns it on
  or off and a field for the rate with the copy of UX §2, prefilled with `2,50 %` (Q1), read as whole
  hundredths of a percent, constant over the whole term (Q1), with the rule of a percent field, and the option
  lives in its own block of the form (Q5). Given the option
  is off, no interest is calculated anywhere and the app's figures are the ones it shows today (the existing
  hand values); given the option is on but the rate is 0, the same holds.
- **AC2 (monthly payout, the parked balance):** The payout falls on the last day of each phase month; the
  balance that waits at the start of a month is the money for that month and for the later months of the same
  phase year, and the interest of a phase year is `P × rate × m(m+1)/24` — `6,5 × P × rate` for a full year,
  `0,5 × P × rate` for three months. No interest is invented for a phase year without phase months, and the
  interest is never negative. Hand values: `16,25 €` and `1,25 €` at `P = 100 €` and `2,50 %`.
- **AC3 (the tax on the interest):** In the tax case the interest of a phase year is taxed with the rates the
  existing tax controls give (Kapitalertragsteuer plus Solzzuschlag, plus church tax when both apply), and the
  tax on the interest is shown as its own figure; in the tax case the net interest, not the gross one, is what
  reduces the money the plan needs. Outside the tax case the gross interest is what reduces it. Story 045's
  rule that the fund's own value is not reduced by money that leaves the plan stays unchanged.
- **AC4 (what the UI shows):** The year table shows, per phase year, the interest the parked money earns and
  the tax on it, as its own columns, and the fund section or the year section states the sum over the phase
  years once. The copy says once that the payout falls on the last day of each month, and once that the rate
  is an assumption that is constant over the term. A phase year without phase months, or the option off, shows
  the dash with its reason.
- **AC5 (the parts still add up):** With the option on the shares per fund and the money invested in the fund
  follow the money that must be there at the start of the phase year, so `shares = (P·m_y − netInterest_y) /
payout per share` (story 032 AC1 holds while the option is off), and the shown parts add up to the shown
  depot: the purchase parts plus the flat parts of story 045 minus the net interest parts, with the last part
  derived from the total. The round trip stays inverse in both directions on the unrounded values
  (story 024 AC3 holds while the option is off or the rate is 0).

## Out of scope

- A per-month table: the interest is shown per phase year, not per month. A table that names each month's
  balance, its interest and the day it is paid is a story of its own.
- Interest on the interest within a year, and the effect of a credit that is quarterly or yearly: the model
  takes one accrual per phase year on the balance that waits (Q2).
- The Sparer-Pauschbetrag and a Freistellungsauftrag: out of the model since story 045.
- Changing which rate a real bank pays, a per-year rate, negative rates, and any borrowing (a deposit account
  cannot go below zero in this model).
- The flat rate of story 045 stays what it is: its payments are a cash line that leaves the plan at the first
  business day of the next year and are not parked (Q3).
- The fund data file and its writer: no new field, the rate is a UI parameter.
- The fund projection convention of ADR 0012 (annual effective compounding, ACT/365): AC2 gives the parked
  balance its own unit (the phase month), it does not change the fund's factor.

## Open questions

_None open: every question asked at gate 1 on 2026-11-15 is answered in the Decision log._

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be rebuilt without the chat.
Append only._

- 2026-11-15 — hak's request (verbatim above): monthly payout on the last day of the month, an option to park
  the money that is not yet needed on a deposit account until its payout, the rate a parameter, and in the tax
  case the interest is taxed with the existing tax parameters.
- 2026-11-15 — Q1 to Q5 above are open at gate 1.
- 2026-11-15 — hak's answer (Q1, the prefill and the term): `2,50 %`, the EZB deposit rate, and the rate is
  constant over the whole term, like the flat rate of story 045. Not a per-calendar-year rate.
- 2026-11-15 — hak's answer (Q2, within a phase year): one simple accrual on the balance that waits, no
  interest on interest inside the year.
- 2026-11-15 — hak's answer (Q3, story 045's flat payments): they stay a separate cash line that leaves the
  plan; they are not taken from the parked balance.
- 2026-11-15 — hak's answer (Q4, the tax time): the tax on the interest is deducted at the Zufluss, so the net
  interest is what the plan keeps and what reduces the money the plan needs.
- 2026-11-15 — hak's answer (Q5, where the option lives): its own block in the form, not inside the tax block,
  because the option also works outside the tax case.
- 2026-11-15 — orchestrator's decision, which the developer found had been written in story 045's Decision log
  before this story existed as a file, and which belongs here: the interest applies only to the phase years,
  that is to the same set of funds the `cash` line uses, because a fund outside the phase is never bought and
  its money is never parked. Hand values on the committed fixture for the phase 1.1.2033 – 31.12.2034: the sum
  over the phase years `3,3803 €` against the sum over the whole fund list `11,3229 €`; the difference
  `7,94 €`, fund 2034 alone `2,4075 €`. The test that measures this is an assertion of AC5, and it is what the
  design intends.
- 2026-11-15 — correction: the two entries of story 045's Decision log that named `park.ts`,
  `parkedInterestFactor` and `depotParts`, and the hand values `70,95 €` against `63,18 €`, are this story's.
  None of those three names exists in the repository or in its git history, and no test asserts the depot for a
  fund inside the fund list but outside the phase, so those values cannot come from story 045's flat path; they
  are parking-interest values of this story. The tester run recorded in story 045's log is withdrawn as a
  record of a run: story 045 has no code for it, its developer run is red (`typecheck` 18 errors, 12 failed
  tests, all `flat` undefined at the call site), it has no spec in `e2e/laz.spec.ts`, and this story has no
  design, code or tests yet. The mutation check the tester described is not reportable until an assertion of
  AC5 exists.
- 2026-11-15 — the architect's ratio argument (`whole list / phase = 9/2 = 4,5`) is withdrawn for the four
  values above: it holds only for the parking term, whose base is the constant monthly target. The four values
  are story 045's flat cash, whose base is the fund's value at the start of each year capped by that year's
  increase, and recomputing them on the committed fixture with story 045's rules reproduces all four exactly
  (fund 2032 `1,4735 €` + fund 2033 `1,9067 €` = `3,3803 €` for the phase years 2033 and 2034, whose funds are
  the funds of the year before; whole list `11,3229 €`; difference `7,9426 €`; fund 2034 `2,4075 €`, the fund
  inside the list but outside the phase). They are not measurements of a run, they are hand arithmetic that
  holds; the run that first recorded them stays withdrawn.
- 2026-11-15 — correction of the hand example in the model section, found by the architect when it recomputed
  the values with a script: the tax of the full phase year is `4,2859375 €`, not `4,2909375 €`; the net is
  `11,9640625 €`, and the money needed at the start of the year `1188,0359375 €`. The three displayed figures
  (`4,29 €`, `11,96 €`, `1.188,04 €`) do not move, so no acceptance criterion changes. The paragraph in the
  model section is corrected because the story is the source of truth for the tester's oracles; the numbers of
  the earlier run are not treated as measurements.
- 2026-11-15 — the ux-designer's run wrote its UX section in the session's checkout (`swfactory`), not in the
  story worktree (`swfactory-046`), because that role has no shell and its permission denies writing outside its
  own working directory; the orchestrator copied the section into the story file here and reverted the copy it
  left in the other checkout. The text is the ux-designer's, unchanged.
- 2026-11-15 — orchestrator's resolutions on the ux-designer's two open points, applied to its section before it
  was copied: (1) the new columns are in the year table, as AC4 says, so AC4's sum line lives in the year section;
  the ux-designer's first version had put them in the fund table because the money rule lives there, and it named
  that conflict for the orchestrator to resolve. (2) The balance column is dropped: AC4 names only the interest and
  the tax on it, `displayParkCents` produces only `{ interestCents, taxCents }`, and the money that waits at the
  start of the phase year is already the year table's existing amount column (`yearAmountMicroEur`, AC5's
  `1.188,04 €`). A column showing a figure the logic does not produce cannot be asserted. No negative parts: the
  parked money is not a part of the depot, so story 032 AC2's money rule, `displayFundParts` and `flatPartsSum`
  are unchanged.
- 2026-11-15 — the ux-designer's other decisions stand as written: the native `CheckboxOption` is kept and
  `role="switch"` is rejected (the platform has no switch component and a switch would need a new component and a
  new role in the tests for no accessibility gain), the legend and the control label are two different strings, the
  tax is its own column with its own reason function, and the sum line keeps one base string with the tax sentence
  added only in the tax case.
- 2026-11-15 — the ux-designer's fourth pass completed the reason map to the machine reasons the design names, in
  its first-match-wins order, and renamed the copy object to `DEPOSIT_COPY` (the name the design gives and the
  code implements): `option-off` → `Geld wird nicht geparkt (Option aus)` (new), `no-funding-fund` →
  `kein Fonds für dieses Jahr` (story 024's existing `COPY.missingYear`, reused), `no-money-to-park` →
  `kein Geld zum Parken (Wert nicht positiv)` (new), `no-rate` → `kein Zinssatz` (new), and the tax column reads
  `Steuer nicht angehakt` (story 045's existing string) before the interest column's reason, because there is no
  tax without interest. The phase-side reasons stay story 032's strings. Before this pass the section gave a text
  for only two of the four reasons, so the map could not be asserted for the others. The design's sentence that
  `option-off` "reuses copy the app already has" is not true: `fieldCopy.ts` has no string for the parking option
  off, only `Steuer nicht angehakt` for the tax case and `COPY.missingYear` for the funding reason. The
  ux-designer's new string is the copy of record; the design line is not rewritten here, because the design
  section is the architect's work.
- 2026-11-15 — orchestrator's naming resolutions, applied to the UX section before it was copied: the field id is
  `depositRate` as the design names it (the UX had `parkRate`), so `FIELD_IDS`, `fieldSpec`, `FIELD_COPY` and the
  `<label for>` read one name, and `depositRate` stays last in `FIELD_IDS`, which keeps the first-invalid-field
  wording of 033 and 045 unchanged. `DEPOSIT_COPY` is the block's copy object, the shape `TAX_COPY` has (legend,
  control label, hint); the two headers, the sum line and the facts stay in the app's single `COPY` object, as
  story 045's strings do, because the tests read `COPY.flatColumn` there. The control is a checkbox, so the
  design's word "switch label" reads as the block's control label; the accessible name is the label string, not
  the legend.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

The tree of 044 and 045 stays. The form gains one fieldset of its own, the year table gains two last columns,
and the year section gains two paragraphs. The fund table gains nothing: no column, no paragraph, no new string.
Nothing else moves: no new component, no new live region, no new colour token.

```text
PlanCalculator
  intro paragraph                      unchanged (044)
  section.inputs                       <form aria-labelledby=h2 "Eingaben">
    fieldset + legend                  "Was ist gegeben und was wird gesucht?", two native radios
    Field "Erster Monat der Auszahlungsphase"
    Field "Letzter Monat der Auszahlungsphase"
    Field amount (label follows the direction, unchanged)
    fieldset + legend "Steuer auf den Gewinn" (031, unchanged)
    fieldset + legend "Geld auf dem Tagesgeldkonto parken"    new block (Q5), the last fieldset of the form
      CheckboxOption                                        the one control, a native checkbox
      Field "Zinssatz in Prozent"                           new, the last control of the block
  section.result                       unchanged; a negative figure reads as the model returns it
  section.years                        <section aria-labelledby=h2 "Jahresübersicht">
    year table                         table, caption "Auszahlungsphase …", two new last columns
    sum line <p>                       new, the year section states the sums once
    facts paragraph <p>                new, the rules AC4 names, stated once here
    footnote <p>                       unchanged, the year table's own rule, still the last paragraph
  section.funds                        unchanged, no new column and no new paragraph
```

The two new paragraphs go below the table, before the existing footnote, in the section named by the year
heading, because the figures the sum is over are the year table's rows; the fund section states nothing for the
parked path. Every new cell is read by its header text, as every column of this app is (CLAUDE.md).

The block is rendered after the tax block, and its field is the last control of the block, so the Tab order and
the form order of `FIELD_IDS` stay one order: radios, phase fields, amount, the two tax checkboxes, the
select, the flat field, then the parking checkbox, then the rate field, then the result section. `depositRate` is
last in `FIELD_IDS`, which is what keeps the first-invalid-field wording of 033 and 045 unchanged. The new
columns add no tab stop; the sum line and the facts paragraph are read when the year section is entered.

The control is a native checkbox through `CheckboxOption`, not `role="switch"`. Reason: story 031's tax block
is the model of a block with a legend, one control and the rule under the control as its description, the app
has no switch component (`packages/platform/src/components/` holds only `Button`), and the existing specs read
this shape as `getByRole('checkbox')` and `check()`. A switch would need a new component, a second block shape
and a new role in the tests for no accessibility gain: the state change happens on a focused native control,
which announces itself, so no live region is needed for it either.

The legend names the block; the label names what the control does, and it is not a substring of the legend, so
the group name and the control name stay two different strings. The rate field is never disabled, even while
the option is off — a control that is off changes what the app calculates, not what the user can type (024 AC3),
and the condition is in its hint, because the hint is the field's description and the paragraph below the table
cannot be it.

The columns are the two AC4 names: the interest the parked money earns and the tax on it. The money that waits
at the start of the phase year is shown by the year table's existing amount column, not by a new one: that
column reads `yearAmountMicroEur`, the money that must be at the start of the phase year, which in AC5's hand
example is `1188,0409375 €` and reads `1.188,04 €` — so the tester reads it as the existing column, and no figure
is asserted for a balance the logic does not produce. Each new figure is rounded once at display (`roundEuroCents`,
ADR 0012): `displayParkCents(plan)` gives `{ interestCents, taxCents }` for a year, `parkSumsCents(shown)` the
sums the sum line states, so a reader adding either column gets the figure the section states. The parked money
is not a part of the depot, so story 032 AC2's money rule is unchanged: `displayFundParts` and `flatPartsSum`
still read the purchase parts and the flat parts and add up to the shown depot with the last part derived from
the total, and `displayYearCents` keeps its rule that the last year line is the total minus the other lines. The
shares in the fund table follow the amount the model computes for the year, so story 032 AC1 holds while the
option is off (AC5).

### States

- First render: the option is off and the rate is prefilled `2,50`, no error before the first edit (024 §3).
  Nothing is usable yet, so the result area shows the empty string and the year table is not rendered at all.
  Once a phase and an amount give a plan, the interest cell reads `– Geld wird nicht geparkt (Option aus)` and
  the tax cell reads `– Steuer nicht angehakt` while the Kapitalertragsteuer is off, or `– Geld wird nicht
geparkt (Option aus)` when the tax is on and the option off; no sum line is shown, and the figures of 024 and
  045 do not move: with the option off nothing is calculated anywhere, the amount column reads the year's amount
  unchanged (`1.200,00 €` for a full year at `P = 100 €`), and the fund table stays as story 032 renders it.
- Success, option on, tax off: the interest cell shows the gross interest — `16,25 €` for the hand example,
  `1,25 €` for a three-month year — the tax cell reads `– Steuer nicht angehakt` (the existing string of 032,
  named once here), the existing amount column shows `1.183,75 €` for that full year, and the year section states
  its interest sum once below the table; the tax sum is stated only when a row has a tax figure.
- Success, option on, tax on: the interest cell `16,25 €`, the tax cell `4,29 €` at `26,375 %`, the existing
  amount column `1.188,04 €`, and the sum line names both sums, so a reader adding either column gets the figure
  the section states.
- Error, a rate outside `0,00 bis 100,00 %` or not a whole number: the error names the field and the rule it
  broke, in the existing pattern, below the hint, with `aria-invalid`, and only after the first edit of this
  field. The result area shows the no-result callout and the year table, with its two new columns, is removed
  while a field is invalid (024 §3), so no parked figure is shown anywhere. A `2,505` is a format error (3
  Nachkommastellen), `100,01` is a range error, an empty field is `Wert fehlt`.
- Empty: no figure anywhere (option off, or the rate is 0, or no fund inside the phase) — no sum line, nothing
  invented for an empty sum (the display rule 045 records); the facts paragraph stays while a result is possible
  and the section is mounted, because it states the rule and not a figure. With the option on and the rate `0`
  both new cells read `– kein Zinssatz` and the amount column shows the year's amount as the control case. A
  phase year without phase months keeps the reason 032 already gives it, because AC2 invents no interest for it.
- Loading: none, the app has no request and no storage write (024 AC6).

### Interactions

- Typing stores the raw text unchanged, `inputMode="decimal"` (the field cannot hold a negative value, so the
  negative-range rule of CLAUDE.md does not apply), and the figures recompute on every keystroke. Focus stays in
  the field being edited; the checkbox never moves focus, and no control becomes disabled, so no focus target
  has to be named.
- The checkbox is one click and one `change`; the whole row is the label, like every row of 031, so box and text
  are one 44 px target. Its state change announces through the control itself; no new live region is mounted.
- The existing debounced live region names the rate through the existing wording when it is the first invalid
  field (`Kein Ergebnis: Zinssatz in Prozent ist ungültig.`), which is a new string for the region, so it
  announces. The parked sum is not added to the live text (045's risk 9).

### Accessibility

- The fieldset's legend is the accessible name of the group, and the checkbox is a control with its own
  accessible name (its label) with the hint as its accessible description through `aria-describedby`. The rate
  field keeps a real `<label for="field-depositRate">` and its hint as its description; the error is added to the
  same description with `aria-invalid`. No `role="alert"`.
- A column header cannot name a control inside a cell, so the fund table's input cells keep their visually
  hidden labels of field and year (`Kurs in Euro für Jahr 2028`, `YTM in Prozent für Jahr 2028`) and no hint of
  their own; the shared rule stays the fund section's footnote (044). The new year columns hold no input, so
  they add no label.
- The year table is a real table with `th scope="col"` for its four existing headers and the two new headers, its
  caption
  `Auszahlungsphase …` (the phase period, `COPY.captionPrefix`) stays unchanged, and the row header stays the
  phase year; the fund table keeps its caption, its columns and its `th scope="row"` headers unchanged, and tests
  read a new cell by its header text, never by position (CLAUDE.md).
- The new cells are plain text: the projection label is the accessible description of the fund section's
  figures (024 AC5), not of the year table's, so the year table's figures keep no description and a dash reads
  as `– kein Zinssatz` with its reason, not as a figure.
- The sum line and the facts paragraph are paragraph text in the year section, never a `dt` and never part of
  the live region, so `valueOf` is not used for them; the existing debounced live region stays mounted empty
  from the first render and keeps its wording.
- Contrast (hand computed, the tester re-checks with a tool): the new headers `--color-text` on
  `--color-surface-subtle` 14.62 light / 11.96 dark, the new figures `--color-text` on `--color-surface` 17.16 /
  14.10, the dashes with their reasons, the sum line and the facts paragraph `--color-text-muted` on
  `--color-surface` 7.78 / 7.64; the legend and the control label `--color-text` on `--color-surface`, the hints
  `--color-text-muted` on `--color-surface`. The one new element that carries a state is the checkbox box, whose
  edge is `--color-edge` on `--color-surface`, 4.21 light / 5.86 dark, above the 3:1 bound. Focus and the invalid
  field keep the existing indicators. Forced colours: nothing new carries a state by colour, the box keeps its
  1 px CanvasText border and the invalid field its 1 px CanvasText border with the icon.
- Dark mode: no new colour, every new element reuses the existing rules, so the values above hold in both
  schemes. Below 600 px: only the year section's own wrapper scrolls (`role="region"`, name
  `Jahresübersicht, horizontal scrollbar`), so the two new columns make the year table wider without ever
  scrolling the page sideways; the new headers wrap as the other headers do and a figure wraps inside its cell;
  the two new paragraphs stack below the table like the footnote, and the new block stacks in the form with the
  fieldset rules of 031.

### Copy (exact strings)

`DEPOSIT_COPY` (the block's copy, the name the design gives it, the shape `TAX_COPY` has; the columns, the sum
line and the facts live in the app's single `COPY` object, as 045's do; each string lives on one element):

- legend: `Geld auf dem Tagesgeldkonto parken`
- control label: `Zinsen auf das Geld, das noch nicht gebraucht wird`
- control hint: `Die Auszahlung fällt am letzten Tag jedes Phase-Monats, das Geld wartet bis dahin, und das
Depot, das die App sucht, wird um die Zinsen kleiner, die das wartende Geld bringt.`

`FIELD_COPY.depositRate` (the field id is `depositRate`, as the design names it, so `FIELD_IDS` and
`fieldSpec` read one name):

- label: `Zinssatz in Prozent`
- range: `0,00 bis 100,00 %`
- hint: `Prozentsatz, höchstens 2 Nachkommastellen. Er gilt für das Geld, das zu Beginn eines Monats noch für
die späteren Monate desselben Jahres braucht; er bleibt über die Laufzeit gleich und zählt nur, wenn die
Option an ist.`
- formatWord: `keine gültige Zahl`
- unit: `Hundertstel Prozent`

The errors the pattern gives for these strings:

- `Zinssatz in Prozent: keine gültige Zahl. Erlaubt: 0,00 bis 100,00 %.`
- `Zinssatz in Prozent: Wert außerhalb des erlaubten Bereichs. Erlaubt: 0,00 bis 100,00 %.`
- `Zinssatz in Prozent: Wert ist keine ganze Anzahl Hundertstel Prozent. Erlaubt: 0,00 bis 100,00 %.`
- `Zinssatz in Prozent: Wert fehlt. Erlaubt: 0,00 bis 100,00 %.`

`COPY.parkColumn` (the interest of the phase year): `Zinsen über das Phase-Jahr in Euro`

`COPY.parkTaxColumn` (the tax on that interest, the tax case only): `Steuer auf die Zinsen in Euro`

`COPY.parkSumLine` (the year section's paragraph, never a `dd`; `{zinsen}` and `{steuer}` are
`formatEuro` of the shown cents, so the reader adding either column gets the figure the section states; the
second sentence is part of the string only when a row has a tax figure, and nothing is invented for an empty
sum): `Summe der Zinsen über die Phase-Jahre: {zinsen}.` plus, in the tax case,
`Steuer auf die Zinsen: {steuer}.`

`COPY.parkFacts` (the rules AC4 names, stated once, in the year section below the table, not in the
fund section; a copy has no `hint` of its own, so this is paragraph text): `Die Zinsen werden einfach gerechnet,
auf dem Geld, das bis zur Auszahlung wartet; innerhalb eines Jahres werden die Zinsen nicht verzinst. Die Steuer
auf die Zinsen wird am Zufluss gerechnet, und das Jahr des Zuflusses ist das Phase-Jahr.`

The reason texts, read in the year table's cells, in the first-match-wins order the design gives, each text
written once and read as the full line text of the cell:

`parkReasonText` (the interest column):

- `option-off` → `Geld wird nicht geparkt (Option aus)` (new)
- `no-funding-fund` → `kein Fonds für dieses Jahr` (the existing string, `COPY.missingYear`, reused; the same
  text the year table's funding cell already reads for a phase year without a fund)
- `no-money-to-park` → `kein Geld zum Parken (Wert nicht positiv)` (new; the money for the year is not
  positive, so the account would go below null and no negative interest is invented)
- `no-rate` → `kein Zinssatz` (new, a string of this story)
- a phase-side reason keeps the strings of story 032 unchanged: `Auflösung nach Phasenende`,
  `Auflösung vor Phasenbeginn`, `keine Hochrechnung je Anteil`.

`parkTaxReasonText` (the tax column): `outside-tax-case` → `Steuer nicht angehakt` (the existing string of
story 045, named once here), then the interest column's reasons in the same order, because there is no tax
without interest. A row can show two dashes with two different reasons, so each column reads its own one, and
the tester reads a dash by its full line text.

Substring notes for the tester: `Tagesgeldkonto` occurs once, in the legend. `parken` occurs once as the exact
string, in the legend; in the reasons it appears as `geparkt` (`Geld wird nicht geparkt (Option aus)`) and as
`Parken` (`kein Geld zum Parken (Wert nicht positiv)`), so a case-insensitive query for `parken` finds three
places and the legend is read as its own full line text. `Fonds` occurs in the reason `kein Fonds für dieses
Jahr`, which is read twice: as the year table's funding cell and as the interest cell's reason for
`no-funding-fund`, so the tester reads a dash by its full line text, never by position. `Zinssatz` occurs twice,
in the field label and in the reason `kein Zinssatz`, so the field is read by its label and the dash by its full
line text. `Zinsen` occurs in six strings — the control label, the control hint, the interest header, the tax
header, the sum line and the facts paragraph — and `Steuer` in the tax legend, the KSt label, the Kirchensteuer
label, 045's header (`Pauschalsteuer`), 045's reason, 045's facts, this story's tax header, the tax reason, the
sum line and the facts paragraph, so all of these are read as full line texts or as the columnheader.
`Phase-Monat` occurs once, in the control hint; `Phase-Jahr` in the interest header, the sum line and the facts
paragraph. `Euro` occurs in three headers of the fund table, the two new headers of the year table, the hidden
labels of the input cells and the amount label, so tests read the whole header; the year table's existing amount
header (`Betrag für das Jahr`) is the column that shows the money that waits, so tests read it by that header
text. `Jahresübersicht` stays in the year heading and the scroller label, and `Eingaben` still occurs once, in
the form heading that names the form for the sign-in probe. Both sum lines are paragraph text, never a `dd`:
045's in the fund section, this story's in the year section.

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

ADR 0016 – the parked balance enters the phase factor as a term, not as a new fund:
[0016-laz-parked-balance-enters-the-phase-factor-as-a-term.md](../adr/0016-laz-parked-balance-enters-the-phase-factor-as-a-term.md).

The closed form, in the shape the code uses:

- `F = Σ m_y / ρ′_y` — unchanged, exactly the factor ADR 0012 gives; `m_y = monthsInYear(phase, year)` and
  `ρ′_y` is `payoutFactor` with the same `flatBaseFactor` the flat path uses;
- `K = Σ k_y / ρ′_y` with `k_y = (hundredths / 10000) · m_y(m_y + 1) / 24 · (1 − τ)`, where
  `τ = tax.rateMillionths / RATE_UNIT` (`0` outside the tax case) and `hundredths` is the rate in whole
  hundredths of a percent (2,50 % is 250). `K` is summed over `phaseYears` + `fundingFund`, the same loop
  `flatCashCents` uses (the gate-1 decision of 2026-11-15): a fund outside the phase is never bought, so its
  money is never parked;
- `D = P · (F − K) + cash` and `P = (D − cash) / (F − K)` — one inverse pair, `cash` is story 045's line.
  The story's `F = Σ (m_y − k_y) / ρ′_y` is this `F − K`; the code subtracts the two sums, so the option-off
  path is `F − 0`, which is exact;
- the term applies only where there is money to park: the account cannot go below zero, so `P ≤ 0` means
  `K` is not applied at all (AC2). With the money known, `D = P · (positive ? F − K : F) + cash`; with the
  depot known, `net = D − cash` and `P = net / (net > 0 ? F − K : F)`. `F − K > 0` over the field's whole
  range (`k_y < m_y` for every `m_y ≤ 12` at a rate ≤ 100 %), so `net > 0 ⇔ P > 0`: the branch is the sign of
  the money, not of the rate. With the option off, the rate 0 or a negative monthly target, both directions
  are exactly today's expressions.

Convention worth naming so it is not "fixed" later: the interest is earned during the phase year, but the
model nets it at the _start_ of that year and discounts it with the year's `ρ′` — the closed form hak's
answer of 2026-11-15 fixed. It is one simple accrual on the waiting balance (Q2), not a month-by-month
simulation and not interest on interest; a per-month table is out of scope.

### Affected files

- **new** `apps/laz/src/features/plan/logic/deposit.ts` — the deposit account's arithmetic (option, interest,
  tax, net, term); no phase knowledge, no reasons.
- **new** `apps/laz/src/features/plan/logic/deposit.test.ts` — the AC2/AC3 hand oracles.
- `logic/fields.ts` — `FieldId`, `FIELD_IDS`, `fieldSpec('depositRate')`, the stale percent-bound comment.
- `logic/parseInputs.ts` (+ `parseInputs.test.ts`) — the fifth field and its error.
- `logic/phase.ts` (+ `phase.test.ts`) — `K`, the sign branch, the row figures and reasons, the display pair;
  `phaseFactor`, `flatCashCents` and `displayYearCents` unchanged.
- `logic/purchase.ts` (+ `purchase.test.ts`) — the net year amount into `shares`.
- `logic/format.ts` — `roundEuroCents` moves here from `purchase.ts`: one money rounding for both paths.
- `fieldCopy.ts` (+ `fieldCopy.test.ts`) — the field, the block, the two columns, the sum line, the facts,
  the reason strings.
- `PhaseForm.tsx` — the option's own fieldset (the last block) and its props.
- `YearTable.tsx` — the two columns, the sum paragraph, the facts paragraph.
- `PlanCalculator.tsx` — the switch state, the prefill, the derived `DepositOption`.
- `e2e/laz.helpers.ts` — `depositSwitch`, `depositInput`, `yearRegion`.
- `e2e/laz.spec.ts` — 046 AC1/AC4/AC5 and 033 AC3's control list.
- **unchanged**: `logic/projection.ts`, `logic/flat.ts`, `logic/fund.ts`, `FundTable.tsx`,
  `ResultSummary.tsx`, `TextField.tsx`, `CheckboxOption.tsx`, `data/fund-list.json` and its writer.

### Dependency order

`fields.ts` → `parseInputs.ts` → `deposit.ts` (new) → `phase.ts` → `purchase.ts` → `fieldCopy.ts`, with
`format.ts` read by `phase.ts` and `purchase.ts` and no cycle in either direction.
`deposit.ts` imports `projection.ts` (`Tax`, `RATE_UNIT`) and nothing else, and it holds no phase knowledge
and no reason strings, the way `flat.ts` does (story 045): it knows a month count, the rate and the tax.
The phase sum is read over the phase years in `phase.ts`, and the reasons stay in the module that owns the
row (the pattern story 045 recorded), so `fieldCopy.ts` imports `phase.ts`, not `deposit.ts`. `projection.ts`
is not touched: the parked money is not invested in a fund, so `payoutFactor` and the flat credit rule keep
their meaning (ADR 0016).

Story 045's branch is not in this worktree: there is no `flat.ts` here, `FieldId` has no `flatRate`, and
`phase.ts` has no `cash`. AC5 reads `cash`, so the developer works from story 045's merged code, not from
the commit this branch was cut at.

### New module

`apps/laz/src/features/plan/logic/deposit.ts` — the deposit account's own path: the month sum of one phase
year, the interest it earns, the tax on it at the Zufluss, the net interest and the term `k_y`. Only the
names a caller reads are exported; the month sum is internal, so a fix is tested through its callers
(CLAUDE.md, story 026 R3).

```ts
import { RATE_UNIT, type Tax } from './projection.ts';

/** The option as the form reads it: the switch of AC1 and the rate in whole hundredths of a percent
 * (2,50 % is 250, the unit the flat field of story 045 uses), constant over the whole term (hak's Q1). */
export interface DepositOption {
  /** the switch; off means no interest is calculated anywhere (AC1) */
  readonly on: boolean;
  /** whole hundredths of a percent; 0 is the rate that pays nothing */
  readonly hundredths: number;
}

/** The state the app starts with: off, so the first render and every existing hand value stay (AC1). */
export const DEPOSIT_OFF: DepositOption = { on: false, hundredths: 0 };

/** (1 + 2 + … + m) / 12 = m(m + 1) / 24 year units, 0 for m = 0 (AC2). Internal: it is the body of the
 * interest, the net and the term below, and the one expression AC2's figure and AC5's term share (risk 4). */
// monthSum(months) — internal

/** The interest of one phase year, micro-euro, unrounded, in the sign-safe shape the code uses:
 * `max(0, monthlyMicroEur) × (hundredths / 10000) × monthSum(months)`. It takes the MONTHLY money, because
 * the story's formula is `P × rate × m(m+1)/24`; a year amount (`P·m`) would need `(m+1)/24` and hides an
 * `m` (risk 7). It is 0 when the option is off, the rate is 0 or there is no month, and it is never
 * negative (AC2), because a deposit account cannot go below zero. */
export function parkInterestMicroEur(
  monthlyMicroEur: number,
  deposit: DepositOption,
  months: number,
): number;

/** The tax on that interest at the Zufluss (hak's Q4), micro-euro, unrounded, with the rate story 031
 * gives; 0 outside the tax case, where the gross interest is what reduces the money the plan needs (AC3). */
export function parkTaxMicroEur(interestMicroEur: number, tax: Tax): number;

/** The net interest of one phase year (AC3, AC5): `parkInterestMicroEur − parkTaxMicroEur`, in one call, so
 * the year table's two figures and the fund row's shares cannot drift apart. */
export function parkNetMicroEur(
  monthlyMicroEur: number,
  deposit: DepositOption,
  months: number,
  tax: Tax,
): number;

/** One phase year's term `k_y = (hundredths / 10000) · monthSum(months) · (1 − τ)`, the shape `phase.ts`
 * sums for `K`; 0 when the option is off or there is no month. It is a factor: it cannot see the sign of
 * `P`, so it carries no sign guard (risk 8). */
export function parkTerm(months: number, deposit: DepositOption, tax: Tax): number;
```

Bodies: the interest multiplies `Math.max(0, monthlyMicroEur)`; the tax is
`tax.on ? interestMicroEur * (tax.rateMillionths / RATE_UNIT) : 0`; the term multiplies
`(1 - tax.rateMillionths / RATE_UNIT)`, which is 1 outside the tax case because `rateMillionths` is 0 there.

### Types for the field and the option

```ts
// fields.ts
export type FieldId = 'phaseStart' | 'phaseEnd' | 'amount' | 'flatRate' | 'depositRate';
/** Form order; also the order in which the first invalid field is named. `depositRate` is last: its block
 * renders after the tax block, so the form order and the Tab order agree (Q5). If UX puts the block before
 * the tax block, this order changes with it and 033 AC3's control list moves. */
export const FIELD_IDS: readonly FieldId[] = [
  'phaseStart',
  'phaseEnd',
  'amount',
  'flatRate',
  'depositRate',
];

// fieldSpec('depositRate') → { min: 0, max: 10000, decimals: 2, date: false }
// The bound belongs to what the value means: a percent, 0 to 100 % (story 030). The field cannot hold a
// negative value (a deposit rate, and the account cannot go below zero), so `TextField` keeps
// `inputMode="decimal"` and CLAUDE.md's negative-range rule does not apply.
// fields.ts's comment ("no field of the form has a percent bound of its own any more") is already stale
// for the flat field of 045 and would be stale for two fields after this story: the flat field and the
// deposit field are the exceptions that keep a percent's bound.

// parseInputs.ts
export interface ParsedInputs {
  readonly phaseStart: string;
  readonly phaseEnd: string;
  readonly amountCents: number;
  readonly flatRateHundredths: number;
  /** whole hundredths of a percent, 2,50 % is 250 */
  readonly depositRateHundredths: number;
}
// `parseInputs`'s required-field check gains the field; "the four fields" becomes five in its comment.

// PlanCalculator.tsx — the switch is a boolean, like the direction and the two tax checkboxes: a control
// that cannot hold a value outside its own options names no error, so it needs no type of its own.
const [parkOn, setParkOn] = useState(false);
const DEFAULT_INPUTS: RawInputs = {
  phaseStart: '01.2028',
  phaseEnd: '03.2034',
  amount: '',
  flatRate: '2,24',
  depositRate: '2,50', // Q1, the EZB deposit rate of 2026-11-15; the switch is off, so it moves nothing
};
```

### Which existing functions change

- `phase.ts` — `phaseFactor` (it stays ADR 0012's `F`), `flatCashCents` and `displayYearCents` are unchanged.
  New internal `parkedFactor(funds, phase, tax, flat, deposit, asOf)` is the `K` loop over `phaseYears` and
  `fundingFund` on the same `ρ′` as `F` — the same set of funds `flatCashCents` uses (the decision of
  2026-11-15): a fund outside the phase is never bought, so its money is never parked.
  `payoutFromDepotCents`, `depotFromPayoutCents` and `buildPlan` gain `deposit` after `flat` and use the net
  factor on the positive branch only (the closed form above); for a negative monthly target `K` is not
  applied, so that branch is exactly today's model. `yearRows` gains `deposit` and `tax` and fills the new
  row fields:

  ```ts
  export type ParkReason = 'option-off' | 'no-rate' | 'no-funding-fund' | 'no-money-to-park';
  export type ParkTaxReason = 'outside-tax-case' | ParkReason;

  readonly parkInterestMicroEur: number | null;
  readonly parkTaxMicroEur: number | null;
  readonly parkReason: ParkReason | null;
  readonly parkTaxReason: ParkTaxReason | null;
  ```

  A figure is non-null exactly when its reason is null (the `flatMicroEur`/`flatReason` pattern of 045), and
  each column reads its own reason, because the interest column can show a figure while the tax column shows
  a dash. `Plan` gains nothing: the sum the year section states is the sum of the shown figures, so it is a
  display value, not a field. `displayYearCents` is unchanged (the amount column still shows `P·m`).

- `phase.ts` also exports the display pair `YearTable` reads: `displayParkCents(plan)` → per row
  `{ interestCents: number | null; taxCents: number | null }` (one rounding, `roundEuroCents`) and
  `parkSumsCents(shown)` → `{ interestCents: number; taxCents: number | null } | null`, the sum of the SHOWN
  cents, `null` when no row has an interest figure (the rule story 045 recorded for its sum line).
  `taxCents` is `null` when no row shows a tax figure, so nothing is invented for an empty tax column.
- `purchase.ts` — `purchaseRows` gains `deposit` after `flat`. `yearAmountMicroEur` becomes the money that
  must be there at the start of the phase year (AC5):
  `monthlyCents * months * 10000 - parkNetMicroEur(monthlyCents * 10000, deposit, months, tax)`, and
  `shares` follows it. No new field on `PurchaseRow`: the year row already carries the two figures the
  identity reads, and the net comes from the same `deposit.ts` call, so the fund table and the year table
  show one number by construction. `displayFundParts` and `flatPartsSum` are unchanged; `purchase.ts`'s local
  `roundEuroCents` moves to `format.ts` with no change of body.
- `format.ts` — exports `roundEuroCents(microEur)` (the one money rounding, moved from `purchase.ts`), read
  by `displayFundParts` and `displayParkCents`, so both paths round with one expression. No behaviour
  change: 032's and 045's hand values are the control.
- `fieldCopy.ts` — `FIELD_COPY.depositRate` (label, range, hint, `formatWord`, `unit`), `DEPOSIT_COPY`
  (legend, switch label, optional hint), `COPY.parkColumn`, `COPY.parkTaxColumn`,
  `COPY.parkSumLine(interest, tax)`, `COPY.parkFacts` (the facts AC4 names), `parkReasonText` and
  `parkTaxReasonText`; `firstInvalidField` is unchanged (it reads `FIELD_IDS`).
- `PhaseForm.tsx` — props gain `parkOn` and `onPark`; the option's own `fieldset` is the last block of the
  form, with the legend and `CheckboxOption` + `TextField`; the field map that renders the other fields
  excludes `depositRate` too (as it excludes `flatRate`). `TextField.tsx` and `CheckboxOption.tsx` are
  unchanged.
- `YearTable.tsx` — the two columns, the dash with its reason per column, the sum paragraph and the facts
  paragraph; reads `displayParkCents` and `parkSumsCents`.
- `PlanCalculator.tsx` — the `parkOn` state, the `depositRate` default, the derived `DepositOption` in the
  same `useMemo`, `handlePark` (sets `edited`, like `handleTax`), and the option passed to `buildPlan` and
  `purchaseRows`.

Every existing call site of the changed functions passes `DEPOSIT_OFF` in its tests: that is the control
case, and it is the only new argument those tests need.

### Data flow

`raw.depositRate` + the switch → `parseInputs` (whole hundredths, one error per field, form order for the
first invalid field) → `DepositOption` → `parkTerm` per phase year → `K` → `F − K` → the depot and the
monthly payout → `parkInterestMicroEur` / `parkTaxMicroEur` per phase year → the year table's columns and the
sum line; the same figures feed `purchaseRows` (the money that must be at the start of the year → `shares` →
the purchase part) → the fund table. Nothing is stored: the field text and the switch are state, everything
else is derived in the same `useMemo` (C3). Money stays unrounded micro-euro until `formatEuro`; the single
rounding is at display (ADR 0012).

The interest figures are the model's own assumption, not a value from the data file, so they must not be
described by the projection label (ADR 0012, 024 AC5): UX gives them their own wording, and the fund
section's label keeps describing only the fund figures.

### Display rule (the money rule)

The parts that add up to the depot are the fund table's parts, unchanged from story 045: the purchase part
plus the flat part, the last part with a figure derived from the shown depot. The parking effect is already
inside the purchase part (the money invested is the money needed at the start of the year, and the interest
reduced it), so the parts do not gain a group and story 032's and story 045's hand values stay. AC5's
"minus the net interest parts" is the order of the arithmetic, not a third part group: the purchase part is
`shares × payout per share` with `shares` computed from `P·m − net interest`, so the money rule holds by
construction, without a correction term.

The identity `P·m − (interest − tax) = shares × payout per share` is asserted on the unrounded values at
logic level: its three terms are three separate roundings at display, so a one-cent difference between shown
figures is not a defect and no test asserts the identity in rounded cents. For the pinned oracle
(`m = 12`, `P = 100 €`, `2,50 %`, tax on) the shown figures happen to close exactly: `1200,00 − (16,25 −
4,29) = 1188,04 €`, which is also the displayed money at the start.

The interest and tax columns are single roundings, so the year section's sum line is the sum of the shown
figures exactly (the rule story 045 recorded for its sum line); nothing is invented for an empty sum, so no
sum line is shown when no phase year has a figure. Where a part is derived from the total, the tester picks a
case in which its own rounding would differ and reports the distance to the .5 cent boundary.

### Reasons a row shows a dash

A column shows a figure exactly when its reason is null. The interest column reads its reason first match
wins: `option-off` (the switch is off) → `no-funding-fund` (no funding fund for that year, so nothing is
bought and nothing waits; the string is story 024's `kein Fonds für dieses Jahr`, `COPY.missingYear`) →
`no-money-to-park` (the money for the year is not positive, so the account would go below zero and no negative
interest is invented) → `no-rate` (the rate is 0; AC1 makes this the same state as off). The tax column reads
`outside-tax-case` first (story 045's string `Steuer nicht angehakt`), then the interest column's reason:
there is no tax without interest. So the interest column can show a figure while the tax column shows a dash.

`m = 0` (a phase year with no phase month) is a guard in `deposit.ts` (interest 0, term 0), not a row state:
`phaseYears` lists only years the phase covers, so no row can carry zero months (risk 3). The two strings that
are not reused (`no-money-to-park`, `no-rate`) are UX's; `option-off`, `no-funding-fund` and
`outside-tax-case` reuse copy the app already has.

### Hand oracle, recomputed by the architect (2026-11-15)

`P = 100 €`, rate `2,50 %`, tax `26,375 %` (no church tax):

- full phase year (`m = 12`, `m(m+1)/24 = 6,5`, the average balance `650 €` at `2,50 %`): interest
  `16,25 €`, tax `4,2859375 €` (`16,25 × 0,26375`), net `11,9640625 €`, money needed at the start
  `1188,0359375 €` → shown `16,25 €`, `4,29 €`, `11,96 €`, `1.188,04 €`. The story's pre-design hand example
  states `4,2909375 €`, `11,9590625 €` and `1188,0409375 €`: its tax is `0,005 €` too high, and because the
  three displayed figures are the same either way no acceptance criterion moves. The oracles below and in the
  test set are the recomputed ones.
- three-month phase year (`m = 3`, `m(m+1)/24 = 12/24 = 0,5`): interest `1,25 €`, tax `0,3296875 €`, net
  `0,9203125 €`, money needed `299,0796875 €`.
- church tax case (Bayern, `25 %` + `1,375 %` + `2 %` = `28,375 %`): tax `4,6109375 €` → `4,61 €`, net
  `11,6390625 €` → `11,64 €`, money needed `1188,3609375 €` → `1.188,36 €`.
- `m = 1` case: `100 × 0,025 × 2/24 = 0,2083333 €` (not a whole cent), tax `0,0549479 €`, net
  `0,1533854 €`. This is the case that shows why the interest cannot be stored as whole cents.
- clean round trip, one phase year with `ρ′ = 1` (`m = 12`), `P = 100 €`, `cash = 0`, rate `2,50 %`:
  `F = 12/1 = 12`; `k_y = 0,025 × 6,5 × (1 − 0,26375) = 0,119640625`, so `K = 0,119640625` and
  `F − K = 11,880359375`; `D = 100 × 11,880359375 = 1188,0359375 €` and
  `P = 1188,0359375 / 11,880359375 = 100 €`. Tax off: `k_y = 0,1625`, so `F − K = 11,8375` and
  `D = 1183,75 €`. These are the round-trip oracles: both directions on unrounded values, one inverse pair.
- phase restriction on the committed fixture (`data/fund-list.fixture.json`, asOf `2026-12-31`), phase
  `1.1.2033 – 31.12.2034` in the payout direction, tax off, `P = 100 €`: the phase years are 2033 (fund 2032)
  and 2034 (fund 2033), each a full phase month year, so the sum over the phase years is `2 × 16,25 = 32,50 €`;
  the sum over the whole fund list (the wrong reading, nine funds 2027–2035) is `146,25 €`, the difference
  `113,75 €`, fund 2034 alone `16,25 €` (its row shows a dash: its phase year 2035 is outside the phase).
  **The values recorded in the Decision log (`3,3803 €`, `11,3229 €`, `7,94 €`, `2,4075 €`) cannot be derived
  from the closed form on this fixture**: the phase sum and the whole-list sum are the same per-year interest
  at one constant monthly target, multiplied by 2 and by 9 (nine fund years against two phase years, each a
  full year), so their ratio must be `9/2 = 4,5`; the recorded pair gives `11,3229/3,3803 ≈ 3,35`, and
  `3,3803 × 4,5 = 15,2114`, not `11,3229`. The difference `11,3229 − 3,3803 = 7,9426 ≈ 7,94 €` is
  arithmetically consistent, but the two sums it comes from are not. They come from the withdrawn run
  against code that does not exist. The tester recomputes the pair with its own arithmetic before reporting
  it; the assertion that matters is the difference between the phase-years sum and the whole-list sum, which
  the design keeps. Correction of that argument, 2026-11-15, recomputed on the committed fixture: the four
  values are story 045's flat cash, whose base is the fund's value at the start of each year capped by that
  year's increase, so the `9/2` ratio does not apply to them — it is a property of the parking term, whose
  base is the constant monthly target. With story 045's rules they hold exactly: the phase years 2033 and 2034
  are funded by the funds of the year before, so the phase sum is fund 2032 `1.473.543,697439 µ€`
  (`1,4735 €`) plus fund 2033 `1.906.719,343214 µ€` (`1,9067 €`) = `3,3803 €`; the whole list of nine funds,
  each with its own YTM, is `11,3229 €`, the difference `7,9426 €` (`7,94 €`), fund 2034 alone `2,4075 €`. All
  four are confirmed by the arithmetic, so the tester may assert them as hand values; the withdrawn run stays
  withdrawn as a record of a run, and the assertion that matters stays the difference between the two sums.
  The tax numbers of the model section (`4,2859375 €`, net `11,9640625 €`, needed `1188,0359375 €`) were
  corrected in the story file by the orchestrator; the displayed cents do not move.

### Risks and how to mitigate them

1. **Option off must be bit-identical.** `K` is 0 and the net interest is 0, so the closed form adds 0
   exactly (story 015's rule). Mitigation: the tester keeps the control case — the app's figures with the
   option off are the existing hand values of 024, 032 and 045, and the option defaults off so no existing
   e2e test has to type anything.
2. **Rate 0.** Same as off: `parkTerm` is 0, no figure is invented, no sum line is shown (the display rule
   story 045 recorded). AC1 pairs this with a positive assertion (turn the option on at `2,50 %` and the
   figure moves), and the negative is triggered by text that differs from what is shown (typing `0` in a
   field that shows `2,50`).
3. **A phase year with no phase month cannot be produced through the UI.** `phaseYears` lists only years the
   phase covers, and every listed year has at least one phase month, so `m = 0` is reachable only in the pure
   logic and never becomes a row. It is asserted in `deposit.test.ts` (`m = 0 → interest 0, term 0`), and the
   e2e asserts the dash through the states the UI can produce (option off, rate 0, a depot smaller than
   `cash`). The tester must not read `m = 0` as a UI oracle.
4. **The shared expression.** `monthSum` is one expression that the year table's figure (AC2/AC4) and the
   term `K` (the depot, AC5) both read; the tax rate on the interest is one expression that the tax column
   (AC3) and the net part (AC3/AC5) both read; `F − K` is shared by the round trip and the parts. A mutation
   of any of these moves more than one assertion. The design names the couplings for the tester up front;
   each rule that can be isolated gets its own mutation, and the shared ones are recorded as one rule with
   two assertions (story 045's pattern).
5. **Display rounding.** Only one part per breakdown is derived (the fund table's last part with a figure);
   the interest and tax columns are plain single roundings. The tester picks a case where the derived part
   would round differently on its own and reports the distance to the .5 cent boundary for each hand value.
6. **The round trip.** The interest is not a whole cent, so the round trip can only be asserted on the
   unrounded values at logic level (story 024 AC3's pattern), never by re-entering a displayed figure: a
   cent-rounded interest fed back through `F − K` amplifies the rounding by `1/(F − K)`. Both directions are
   asserted with the option on, and the negative branch is asserted separately (the parking term is not
   applied there, so the round trip closes through `F` alone).
7. **Units.** `parkInterestMicroEur` takes the monthly money `P`, not the year amount `P·m`: the story's
   formula is `P × rate × m(m+1)/24`, and a year amount would need `(m+1)/24` and would hide an `m` — the
   factor-`m` error the first draft of this design had (it passed the year amount and was wrong by `m`).
   Mitigation: the signature names `monthlyMicroEur`, every oracle is written from `P` (AC2's `16,25 €` is
   `100 × 0,025 × 6,5`), and `purchase.ts` passes `monthlyCents * 10000`, not the year amount.
8. **Sign-safe shape.** Write the interest as `max(0, money) × rate × monthSum(m)`, not as `rate × …`
   with a possibly negative money: the two differ exactly on the negative branch, which is AC2's "never
   negative" case (CLAUDE.md, story 024 round 2). The sign decision cannot live in `deposit.ts`, because the
   term `k_y` is a factor and cannot see `P`; it lives where the closed form is evaluated (`phase.ts`).
9. **The branch of the negative case.** With tax on, `P = (D − cash) / (F − K)` can be negative when the
   depot is smaller than `cash`; the app then shows the figure as the model returns it (story 045), and the
   interest columns show the dash with `no-money-to-park`. No clamp is added in the logic.
10. **The dependency on story 045.** `cash`, the flat field and the flat hand values are not on this branch;
    the developer starts from story 045's merged code (see "Dependency order"). Until then AC5's tests cannot
    run, and the flat rate must stay what it is: its payments are a cash line that is not parked (hak's Q3).

### Minimal test set

One test per behaviour at the cheapest level that shows it; where an AC has a logic rule and a display rule,
each is tested once at its own level (checklist T2), and no behaviour is tested twice. Every expected number
is written by hand and no test reads its oracle from the module it checks.

- **AC1** — `parseInputs.test.ts` (existing, gains the field): `2,50` → 250, `2,505` is a format error,
  `100,00` → 10000 accepted, `100,01` → `range`, `-0,01` → `range`, one error per field, the first invalid
  field named in form order. `fieldCopy.test.ts`: the hand copy strings of UX §2, the bound `0` to `10000`,
  the key list gains `depositRate` last. e2e `046 AC1`: the option's own block with its legend, the switch
  and the field, prefilled `2,50`, `inputMode="decimal"`, never disabled; option off → no interest figure
  anywhere and the app's figures are today's hand values (control), and the paired positive assertion at the
  same phase with the option on shows the hand interest; option on with the rate typed `0` → the same as off.
- **AC2** — `deposit.test.ts` (new), asserted through its exported callers, not through the internal month
  sum: `16,25 €` (m = 12), `1,25 €` (m = 3), the `m = 1` case (`0,2083333 €`, which shows the unit is not
  whole cents), `m = 0` → 0 (no phase month), negative money → 0 (never negative), option off → 0. No e2e
  test repeats these values.
- **AC3** — `deposit.test.ts`: the corrected tax values (`4,2859375 €`, net `11,9640625 €`, money needed
  `1.188,0359375 €`), the church tax case through `taxFromState` (Bayern, `28,375 %` → `4,6109375 €`), the
  tax-off case (the gross interest is what reduces the money needed), and the assertion that the fund's own
  value is not reduced by the interest (story 045's rule, unchanged: `payoutPerShareMicroEur` is called with
  the same `flatBaseFactor`, so this is asserted at the row level, not inside the fund's factor).
  `phase.test.ts` gains the round trip with the option on, both directions, on unrounded values, plus the
  negative-branch case; the option-off round trip is the existing test.
- **AC4** — e2e only: the two new columns read by header text, the hand figures recomputed by the tester
  from the fixture with its own arithmetic (phase `1.1.2033 – 31.12.2034` read in the payout direction,
  `P = 100 €`, `2,50 %`: the phase-year rows 2033 and 2034 each show `16,25 €`, and the tax column shows
  `– Steuer nicht angehakt` outside the tax case; tax on → `16,25 €` and `4,29 €`), the sum over the phase
  years stated once as a paragraph and equal to the sum of the shown figures, and the dash with each reason
  (option off, and `no-money-to-park` for a depot smaller than `cash`).
- **AC5** — `phase.test.ts`/`purchase.test.ts`: the identity `P·m − (interest − tax) = shares × payout per
share` on the unrounded values, and `shares` follows the net money (the same phase with the option on and
  off). e2e `046 AC5`: for the pinned oracle the fund row behind the 2033 payout shows the money at the start
  (`1188,04 €`, the year row's `1200,00 €` minus `16,25 €` plus `4,29 €`), and the fund table's shown parts
  still add up to the shown depot with the last part derived from the total (pick values where its own
  rounding would differ, report the distance to the .5 cent boundary); the phase restriction with the
  tester's recomputed values (`32,50 €` against `146,25 €`, difference `113,75 €`, fund 2034 alone shows the
  dash because its phase year is outside the phase); with the option off, the parts and the shares are
  exactly story 032's and story 045's.
- **Mutation checks** (rule P32; each run reports the mutated file byte-identical to its pre-run backup taken
  outside the repository, and exactly the named assertions turn red):
  - the option guard (`on` ignored, interest computed while off) → many assertions: AC1's control and every
    option-off hand value of 024, 032 and 045, so it is recorded once as the off-path rule with those
    assertions;
  - `monthSum` `m(m+1)/24` → `m(m+1)/12` → **four ACs** (AC2's figure, AC3's tax which follows the
    interest, AC4's columns and sum line, AC5's money at the start and the shares through `K`), recorded as
    one shared rule with those assertions (risk 4);
  - the tax not deducted (`parkNetMicroEur` returns the gross interest) → **two** assertions (AC3's net
    interest and AC5's money at the start through `K`);
  - `max(0, monthlyMicroEur)` removed → **two** assertions (AC2's negative case and AC5's negative-branch
    money at the start, which would otherwise subtract a negative interest);
  - the `no-rate` reason removed (a rate of 0 shows a figure instead of the dash) → only AC1's zero-rate
    pairing;
  - the phase sum read over the whole fund list instead of `phaseYears`/`fundingFund` → only AC5's phase
    restriction;
  - the sign of the term flipped (`F + K` for `F − K`) → only the round trip;
  - the sum line computed over the unrounded figures and rounded once instead of summing the shown cents →
    only AC4's sum-line assertion;
  - `fieldSpec`'s `max` set to null → only AC1's range assertion.

  `effectiveRateMillionths` is shared with story 031's hand values, so the tester mutates the interest's own
  expression, not the tax module, and records the coupling.

Which checks the story's runs cover (rule B, story 034): for a change in `apps/laz/**` the app's vitest
tests, the platform checks the app uses, `test:e2e -w @swfactory/laz` (the app's specs plus the platform's
sign-in specs), `test:pages` after `build:pages`, `check:structure`, `check:dist`, plus lint, typecheck and
format. The minesweeper checks do not run. Whole-tree checks stay whole tree. e2e runs on port 5174 through
Playwright's own `webServer`; port 5173 is hak's dev server and is never used by a run.

### e2e specs the developer updates

`e2e/laz.spec.ts` 033 AC3 (the control list gains the switch and the field; the Tab assertion stops at the KSt
checkbox and stays as long as UX places the block after the tax block), `fieldCopy.test.ts`'s key list and its
comment about percent bounds (the flat field and the deposit field are the exceptions that keep the bound of a
percent), and the tax cases of 031 and 032, which need no change because the option defaults off. 036 AC1's
exact `columnheader` list is the fund table's and does not move unless UX adds a column there; the year table
is read by header text through `cellByHeader`, so two new columns do not move it. No spec walks
`parentElement` or `locator('..')` from the new markup except `rowByHeader` (`xpath=parent::tr`) and `valueOf`
(`following-sibling::dd`), and adding columns to a row or a fieldset to the form does not move them. A new
paragraph in the year section is read as paragraph text inside the year section only (page-wide `getByText`
regexes are scoped to their region, story 045's rule). The new helpers are `depositSwitch`, `depositInput` and
`yearRegion`, so AC1, AC4 and AC5 do not repeat the selectors.

### Implementation plan

1. `deposit.ts` (option, month sum, interest, tax, term) with its unit tests at the hand values, including
   `m = 0` and the negative branch.
2. `fields.ts` + `parseInputs.ts` (`FieldId`, `FIELD_IDS`, `fieldSpec`, `ParsedInputs`) and the copy keys;
   the parse branches and the copy test.
3. `phase.ts`: the phase sum `K`, the closed form on `F − K` with the positive branch, the year row's
   figures and its reason; the round trip test with the option on; the existing tests keep the option-off
   case.
4. `purchase.ts`: the money that must be at the start of the year, `shares` from it, `parkNetMicroEur` on the
   row; `displayFundParts` and `flatPartsSum` unchanged.
5. `PlanCalculator.tsx` (the switch state, the default input, the derived `DepositOption`),
   `PhaseForm.tsx` (the option's own fieldset), `YearTable.tsx` (the two columns, the sum line, the dash with
   its reason).
6. The e2e tests for AC1, AC4, AC5, the spec updates listed above, and the mutation runs.

### Alignment with UX

UX must supply the block's legend, the switch label, the field's label, range and hint (the hint states once
that the rate is an assumption constant over the term), the two column headers, the sum line, the sentence that
the payout falls on the last day of each month, the two new reason strings (`no-money-to-park`, `no-rate`), and
the state the year section shows for an empty sum. The design assumes the block is the last control of the
form, after the tax block, so `FIELD_IDS` order and the Tab order agree; the interest figures must not carry
the projection label as their accessible description (they are not a data-file projection), so UX must give
them their own wording or state that they have none. If UX wants the switch to read `role="switch"` rather
than a checkbox, that is a change to `CheckboxOption.tsx` (out of this story's file list) and it decides the
copy of the control's name.

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
