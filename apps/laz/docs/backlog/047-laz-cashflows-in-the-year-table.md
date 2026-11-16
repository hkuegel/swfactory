---
id: 047
title: The cashflows of a phase year, one figure each, in the year table
status: designed # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<app name>/docs/backlog)
size:
  M # S | M | L (story 026). M, the reason: the same figures move across two tables, the sum lines
  # and the money rule move with them, and the control figures of 024, 032, 035, 045 and 046 must not
  # move. Three ACs cannot cover a table change, a sum rule and a regression at once.
branch: feature/047-laz-cashflows-in-the-year-table
supersedes: [] # stories this one fully replaces
changes:
  [024/AC4, 032/AC2, 036/AC1, 045/AC4, 045/AC5, 046/AC4] # 024/AC4 the fund row per-share figure
  # becomes the pre-tax proceeds (hak at gate 1); 032/AC2 the parts that add up to the depot read
  # across two tables; 036/AC1 the pinned column list of the fund table changes; 045/AC4 its tax
  # column goes and its figures read in the year table; 045/AC5 the same for the fund section sum
  # line; 046/AC4 the year table gains the other cashflows and its sum line changes.
superseded-by: # set on the OLD story when a newer one replaces it
---

id: 047
title: The cashflows of a phase year, one figure each, in the year table
status: designed # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<app name>/docs/backlog)
size:
M # S | M | L (story 026). M needs a reason: this story moves the same figures across two tables - the tax

# figures leave the fund table, the year table gains one figure per cashflow, the sum lines and the money

# rule move with them, and the control figures of 024, 032, 035, 045 and 046 must not move. Three ACs

# cannot cover a table change, a sum rule and a regression at once.

branch: feature/047-laz-cashflows-in-the-year-table
supersedes: [] # stories this one fully replaces
changes:
[024/AC4, 032/AC2, 036/AC1, 045/AC4, 045/AC5, 046/AC4] # 024/AC4: the fund row's per-share figure becomes

# the pre-tax proceeds (hak at gate 1), so its taxed figure is read in the year table; 032/AC2: the parts

# that add up to the depot are read across two tables; 036/AC1: the pinned column list of the fund table

# changes; 045/AC4: the fund table's tax column goes and its figures read in the year table; 045/AC5: the

# same for the fund section's sum line; 046/AC4: the year table gains the other cashflows and its sum line

# changes.

superseded-by: # set on the OLD story when a newer one replaces it
---

# 047 – The cashflows of a phase year, one figure each, in the year table

## Original request

> ok, noch eine Story für eine Änderung. Die Anzeige der Steuer verstehe ich nicht. Deshalb bitte:
>
> - Steuer aus der Fondsstaffel rausnehmen
> - In der Jahresübersicht hätte ich gerne alle Cashflows, also: Erlös aus ETF Auflösung (aus Vorjahr), die
>   darauf anfallenden Steuern (getrennt nach nach Kap, Kirchensteuer, - schon gezahlte Vorabpauschale), die
>   Vorabpauschale auf die restlichen gehaltenen ETFS, die monatliche Auszahlung, der Zins aus dem Tagesgeldkonto
>   (abzüglich Steuern falls Steuern angehakt sind). Das macht die Rechnung viel transparenter

## User story

As the depot owner, I want the year table to show each cashflow of a phase year as its own figure — the proceeds
of the fund liquidated in the year before, the tax on them split into its parts, the flat rate already paid, the
flat rate for the funds that are still held, the monthly payout, and the deposit interest with its tax — so that I
can read the calculation row by row instead of getting one figure that mixes the cashflows together.

## Context

What the two tables show today, read from the code:

- The fund table's only figure that is a tax is the flat column story 045 AC4 added (`Pauschalsteuer über die
Haltedauer in Euro`), plus the sum line the fund section states for it. The tax on the fund's gain is not its
  own figure: it is inside the per-share projection, which is the taxed payout when the tax case is on (024 AC4),
  so the fund row shows a value that already contains the tax.
- The year table shows the phase year's amount, the parked interest and the tax on that interest (046 AC4). It
  shows no proceeds, no tax on the gain, no flat rate, and no monthly payout: the monthly payout is the result
  block's figure, not a row of the year table. A reader who wants to follow the money of one year cannot.
- This story is the table story 045 put out of scope: "AC4 shows one figure per fund, not one per calendar year.
  A table that names each year's payment and the year it is due in is a story of its own." That table is what hak
  now asks for, for the phase years.
- No rule of the model is new here: the rates of 031, the flat rule of 045 AC2 and AC3, the parking rule of 046
  AC2 and AC3, the funding rule of 024 AC2 as 035 extended it, and the money rule of 032 AC2 stay as they are.
  What moves is where a figure is read, and one combined figure becomes its parts.
- Two facts the code shows, which no AC can decide on its own and which the Decision log answers: the flat figure of
  045 is a figure per share while every cashflow of the year table is the money of the whole year, so the flat
  figure of a fund reads as that fund's whole money on the row of its sale year; and the counted flat years begin
  at the data file's asOf year, which is before the phase, so a phase-year table has no row for a fund that is not
  sold inside the phase.
- The app speaks German with German number formats (024 Context, the app's README), and every cell is read by its
  header text, never by position (CLAUDE.md), so this story updates the pinned column lists of the tests instead
  of leaving them behind.

## Acceptance criteria

- **AC1 (the fund table shows no tax at all):** Given the tax case is on and a fund row inside the phase is shown,
  when the fund table is read, then no cell of the fund table is a tax figure: the flat column of 045 AC4 is gone
  (hak at gate 1), and the fund row keeps the year, the name, the ISIN, the course, the YTM, its per-share figure,
  the shares and the purchase price of 032. Its per-share figure is the pre-tax proceeds, not the taxed payout of
  024 AC4 (hak at gate 1), so the tax of that fund is read in the year table. The fund section states no tax sum
  line any more. The pinned column list 036 AC1 states is updated to the columns the table actually has, not
  deleted (AC7).
- **AC2 (the year table shows one figure per cashflow):** Given a phase year with a funding fund and a result,
  when the year table is read, then it shows one column per cashflow, in the order the UX design names: the
  proceeds of the fund liquidated in the year before; the tax on those proceeds as three columns, Kapitalsteuer,
  Solzzuschlag, Kirchensteuer; the flat rate already paid for that fund, read on the row of the year of its sale
  (hak at gate 1, so the counted years before the phase read on that row); the flat rate of the funds still held in
  this phase year; the monthly payout as the gross monthly amount times the months this year has (hak at gate 1);
  the money parked on the deposit account as its own column; the interest of the deposit account, and the tax on it
  as one figure while the tax checkboxes are on (hak at gate 1, not split). Each figure is one the model already
  computes, and no figure is invented for a cashflow that does not exist (AC4).
- **AC3 (the arithmetic reads from the table):** Given a row where several cashflows exist, when the figures of
  that row are added by hand, then they add up to the total the year section states for them, and every sum the
  year section states is exactly the sum of the figures shown in its own column — one rounding per figure, and the
  last part derived from the total instead of rounded on its own (the money rule, as 032 AC2, 045 AC5 and 046 AC4
  already apply it). Each column keeps its own sum line, and the year section states the year's tax total and the
  year's cash total once (hak at gate 1). A test picks a case where the derived part differs from its own rounding,
  so the rule can actually move. The flat figures stay a part of the depot as 045 AC5 says, and the flat figure of a
  fund is read as the whole money of that fund on the row of its sale year, never as a figure per share; a fund
  whose sale is not a phase year has no row for it, so the year section states that money once with its reason.
- **AC4 (a dash names its reason):** Given a cashflow that does not exist for a phase year, when its cell is
  read, then the cell shows the dash with the reason for it and never a 0, in the pattern the app already has
  (032 AC3, 045 AC4, 046 AC4): the tax checkboxes off, the parking option off, the rate 0, a year without a
  funding fund, a year with no phase months, a fund with no year that pays. A tax that exists as a rate but does not
  apply — the church tax while its checkbox is off, the Solzzuschlag while the Kapitalsteuer is off — is a dash with
  its reason, not a 0 (hak at gate 1), and the same answer reads in every tax column. A dash is read as the full line
  text of its cell, and each column reads its own reason, because one row can show a figure in one column and a dash
  with another reason in another.
- **AC5 (the split follows the tax model already there):** Given a tax figure is split into its parts, when those
  parts are added, then they equal the rate story 031's model applies to the same base: 25 % Kapitalsteuer, 5,5 %
  Solzzuschlag of that Kapitalsteuer, and the church tax as a whole hundredths rate on the Kapitalsteuer — 8 % for
  Bayern and Baden-Württemberg, 9 % for every other Bundesland, counted only while the Kapitalsteuer is on. No
  figure of 031 moves. The tax on the deposit interest keeps the one figure 046 AC3 shows (hak at gate 1): the three
  parts are the parts of the tax on the sale proceeds. The labels are German and name what each figure is, one label
  per element, and the numbers read in the German format the app uses (`1.188,04 €`); the strings are the copy the
  copy test reads.
- **AC6 (nothing moves while the options are off):** Given the tax checkboxes are off, and given the parking
  option is off or its rate is 0, when the same inputs as before this story are read, then no figure moves: the
  hand values the tests of 024, 032, 033, 035, 045 and 046 already pin stay — read in the table this story moved
  them to (AC7) — and those tests are re-run as the control case (045 AC1's control and 046 AC1's control). With
  the tax off the fund table's per-share figure and the year table's proceeds are the same number, because no tax
  is subtracted. While the tax is off no tax figure appears anywhere, and while the parking option is off no
  interest figure appears anywhere; every such cell shows its dash with its reason (AC4), and no sum line is
  invented for an empty sum.
- **AC7 (the tests that assert the removed column are replaced, not dropped):** Given a test that reads the fund
  table's tax column or its sum line, when this story moves that figure to the year table, then that test asserts
  the same figure in its new place, and no AC of 045, 046, 032 or 036 is left without a test: each figure is
  asserted once where its rule lives and once as what the cell shows. Cells are still read by their header text,
  never by position, and the expected figures are hand values, not values read from the module under test.

## Out of scope

- No new input, no new field, no storage write and no network request (024 AC6): the form stays as 031, 045 and
  046 built it, and the rate fields keep their values and their copy.
- No change to the tax rates, the flat rule, the parking rule or the projection convention: 031, ADR 0012,
  ADR 0015 and ADR 0016 are read as they are. The Sparer-Pauschbetrag, Teilfreistellung and Günstigerprüfung stay
  out of the model.
- A per-month table (046's out of scope), the year the flat payment is actually due, and any calendar table that
  reaches outside the phase years: this story shows the phase years only.
- The live region gains no sum; the sums stay paragraph text in the year section (045, 046), and no state cue is
  added, so nothing new needs a non-colour indicator.
- The fund table's input cells and their shared rule (036, 044) stay; the fund table's override marker stays.

## Open questions

_All twelve were asked in one message at gate 1 and answered by hak on 2026-11-16; the answers are the_
_Decision-log entries below. Nothing here is open any more._

1. The tax column is gone from the fund table, the flat column of 045 AC4 included, and the fund section states
   no tax sum line.
2. One column per cashflow; the tax of the sale is three columns, Kapitalsteuer, Solzzuschlag, Kirchensteuer.
   The order is what the UX design names.
3. A tax that exists as a rate but does not apply reads as a dash with its reason, not as a 0, in every tax
   column.
4. The flat rate already paid for a fund reads on the row of the year of its sale.
5. Not open against the code: the counted year of a fund is the year before the phase year it funds
   (fund year + 1), as 032, 035 and 045 write it, and the fund table keeps its shares and purchase price.
6. The gross monthly payout times the months of that year; the money parked on the deposit account is its own
   cashflow column.
7. Each column keeps its own sum line, and the year section states the year tax total and the year cash total
   once.
8. The hand example starts from the control figures of 046; the tester pins them as its oracle.
9. The fund table per-share figure becomes the pre-tax proceeds.
10. In the year table every figure is the money of one year, so the flat figure is that fund whole money, not a
    figure per share.
11. The tax on the deposit interest keeps the single figure of 046 AC3.
12. A fund sold in a phase year reads its whole flat figure on that row; a fund whose sale is not a phase year
    has no row, and the year section states that money once with its reason.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be rebuilt without the chat.
Append only._

- 2026-11-16 — hak's request (verbatim above): the tax leaves the fund table, and the year table shows each
  cashflow of a phase year as its own figure.
- 2026-11-16 — Decision (product owner): the story states no numbers. The hand example of open question 8 is the
  oracle the tester pins, and the only figures quoted are the control figures already recorded in story 046.
- 2026-11-16 — Decision (product owner): the `changes:` entries for 031 AC1, AC2 and 024 AC4 are conditional on
  the answers to open questions 1 and 9; they are listed because this story moves where those figures are read,
  not because their rules are wrong. The "(changed by 047)" annotations on the done stories are appended after
  gate 1, once the answers say which reading holds.
- 2026-11-16 — The two facts recorded in Context (the flat figure is per share, and the counted flat years start
  before the phase) were read from the code on 2026-11-16 and are asked as open questions 10 and 12, not decided
  here.

- 2026-11-16 — Decision (orchestrator, made before gate 1 because the code already fixes it): question 5 is not
  open. The counted year of a fund is the year before the phase year it funds, fund year + 1 as 032, 035 and
  045 write it, so the proceeds of the fund read on the phase year after the counted year, and the fund table
  keeps its shares and its purchase price for that row.
- 2026-11-16 — Decision (orchestrator, from the money rule): in the year table every figure is money of one
  year, so a per-share figure cannot add up with it (question 10). The flat figure of a fund is the whole money
  of that fund on the row of its sale year, and a fund whose sale is not a phase year has no row for it, so the
  year section states that money once with its reason (question 12).
- 2026-11-16 — gate 1, hak answers in one message: the tax column is gone from the fund table, the flat column
  of 045 AC4 included (1); one column per cashflow, and the tax of the sale split into Kapitalsteuer,
  Solzzuschlag, Kirchensteuer (2); a tax that exists as a rate but does not apply is a dash with its reason,
  not a 0, and the same answer in every tax column (3); the flat rate already paid for a fund reads on the row
  of the year of its sale (4); the monthly payout is the gross payout times the months of the year and the
  parked money is its own cashflow column (6); each column keeps its own sum line and the year section states
  the tax total and the year cash total once (7); the fund table per-share figure becomes the pre-tax proceeds
  (9), which is why 024 AC4 is in `changes:`; the tax on the deposit interest keeps the one figure of 046 AC3
  (11); the hand example starts from the control figures of 046 (8).
- 2026-11-16 — Status set to `ready`; the story is committed at gate 1 on the story branch, which was the tip
  of main at that moment.

- 2026-11-16 — Decision (orchestrator, on the ux-designer's four flags): the first tax column reads
  `Kapitalsteuer in Euro`, AC2's word, not `Kapitalertragsteuer`. The two flat columns read
  `Pauschalsteuer für die Jahre vor der Phase in Euro` and `Pauschalsteuer für das Phase-Jahr in Euro`,
  because 045 AC1 keeps the word `Vorabpauschale` on exactly one element, the field label, so the
  columns use the shorthand. `Betrag für das Jahr` keeps its label and its plain dash, with its reason in
  the existing missing-year line as 024 AC4 has it, so the reads of 024 AC2 stay; the new columns read the
  dash with its reason in the cell, as 045 AC4 and 046 AC4 do.
- 2026-11-16 — Decision (orchestrator): the flat facts paragraph stays in the fund section, where 045 put it;
  the year section's flat note is the sentence a reader of the year table reads. Nothing is moved, so the
  reads of 045 stay and no `changes:` entry is added for the facts paragraph.
- 2026-11-16 — Recorded for gate 2, not decided: the two copy statements the design marks for hak's
  confirmation are the ux-designer's strings. The first says the flat columns are depot parts from
  other years and are not added to the year's money; the second says `Betrag für das Jahr` is the money
  that was there at the start of the year, not a flow. These are wordings, and the arithmetic does not
  depend on them. The reader line, the payout check and the net note are not pending, because they state
  what the row adds up to.
- 2026-11-16 — The ux-designer's two suggestions for CLAUDE.md are open as P43 and P44 for gate 2: sums of a
  table wider than the viewport live as paragraphs outside the scrolling wrapper, and a table with more than
  about ten columns needs one line below it that names the columns the reader adds. P43 to P44 are open, so
  no other rule takes these numbers.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

The tree of 044, 045 and 046 stays. The fund table loses one column and its sum paragraph, the year
table gains the cashflow columns, and the year section gains one sum line per money column, the two
totals, one line that names the figures a reader adds, and two notes. No new field, no new control,
no new component, no new colour, no new live region and no new tab stop.

```text
PlanCalculator
  intro paragraph                      unchanged (044)
  section.inputs                       unchanged (031, 045, 046)
  section.result                       unchanged, the one debounced live region keeps its wording
  section.years                        <section aria-labelledby=h2 "Jahresübersicht">
    scroller region                    unchanged role and name, thirteen columns wide
      caption                          unchanged, names the phase period
      year table                       `th scope="col"` per column, the year stays `th scope="row"`
    reader line <p>                    new, names the columns whose figures add to the year
    one sum line <p> per money column  new, in the column order
    tax total <p>                      new, stated once
    cash total <p>                     new, stated once
    flat note <p>                      new, the statement marked for hak's confirmation
    parked note <p>                    new, the statement marked for hak's confirmation
    facts <p> and footnote <p>         unchanged (046, 024), still the last paragraphs
  section.funds
    projection label <p>               unchanged, still the description of the row's figures
    FundTable                          eight columns, the flat column is gone
    flat facts <p>, depot note <p>, footnote <p>    unchanged, no sum line any more
```

The new paragraphs are paragraph text below the table and outside the scroller, so they stay on
screen while the table scrolls sideways: the reader line, then the sum lines in the column order,
then the two totals, then the two notes, then the existing facts and footnote. The caption is not
used for the reader line, because a caption inside the scroller scrolls away with the table.

### The fund table

The fund table keeps the columns 036 AC1 pins, without the flat one: `Jahr`, `Fondsname`, `ISIN`,
`Kurs`, `YTM in Prozent`, `Hochrechnung je Anteil in Euro`, `Anteile jetzt kaufen`, `Kaufpreis heute
in Euro`. Its projection cell now shows the pre-tax proceeds per share and keeps the projection
label as its accessible description (024 AC5), because the figure is still a projection from YTM and
NAV; the input cells, their hidden labels, the marker and the shared rule stay.

After the column leaves, the fund section states once: the projection label, the three flat facts,
the depot note and the rule of the input cells. It states no sum line and shows no tax figure. The
flat facts stay in the fund section as the design says, while the flat figures are read in the year
table; the year section's flat note is the sentence a reader of the year table reads, and moving the
facts paragraph with the figures is the orchestrator's call.

### The year table, the columns in the order the design names

One row stays one phase year. Every cell is read by its header text, never by position (CLAUDE.md),
so the order is a reading order, not a test order:

1. `Jahr` (row header), `Monate`, `Finanzierung durch Fonds` — unchanged
2. `Erlös aus der Fondsauflösung in Euro`
3. `Kapitalsteuer in Euro`
4. `Solzzuschlag in Euro`
5. `Kirchensteuer in Euro`
6. `Pauschalsteuer für die Jahre vor der Phase in Euro`
7. `Pauschalsteuer für das Phase-Jahr in Euro`
8. `Auszahlung in Euro`
9. `Betrag für das Jahr` (`COPY.amountColumn`, line `200`, unchanged)
10. `Zinsen über das Phase-Jahr in Euro`
11. `Steuer auf die Zinsen in Euro`

The four tax columns stay together, the two flat columns sit between the tax columns and the money
of the year, and `Betrag für das Jahr` keeps its label so the reads of 024 AC2, 033 AC1, 035 AC1 and
046 AC5 do not move. The column group is not a heading: see the width section.

### Copy (exact strings)

`COPY.columnSumLine` — one base string, `{label}` is the column's header text as the copy names it
and `{wert}` is `formatEuro` of the figures shown in that column, so a reader adding a column gets
the figure the section states. The sum lines exist for the ten money columns only, `Monate` and
`Finanzierung durch Fonds` have none, and a line is shown only when that column has a figure:

`Summe {label}: {wert}.`

`COPY.taxTotalLine` (one paragraph, stated once, over the tax columns):

`Summe der Steuer über die Phase-Jahre: {wert}.`

`COPY.cashTotalLine` (one paragraph, stated once, over the columns that are money of the year):

`Summe des Gelds der Phase-Jahre: {wert}.`

`COPY.readerLine` (the line below the table that names which figures a reader adds, no number
invented):

`Das Geld eines Jahres: die Steuer-Spalten der Auflösung, Betrag für das Jahr und die Zinsen.`

The reader line names three groups: the three tax columns of the sale, the amount column and the
interest column. The interest's own tax column is not named there, because its figure is an addend of
the tax total while the cash total counts the gross interest.

`COPY.payoutCheck` (the same money, so the payout column is not added twice):

`Dasselbe Geld: die Auszahlung plus die Steuer. Die Auszahlung wird nicht noch einmal addiert.`

`COPY.flatNote` — **the first of the two statements the design marks for hak's confirmation**:

`Die Pauschalsteuer-Spalten sind Depotteile aus anderen Jahren und zählen nicht zum Geld des Jahres.`

`COPY.parkedNote` — **the second of the two statements the design marks for hak's confirmation**:

`Der Betrag für das Jahr ist das Geld, das am Anfang des Jahres da war, kein Zufluss.`

`COPY.netNote` (the net as the difference of the two interest columns):

`Das Netto der Zinsen ist die Differenz aus der Zinsenspalte und ihrer Steuerspalte.`

`COPY.flatNoRowLine(fundYear, wert)` (the year section's line for a fund whose sale year is not a
phase year, stated once with its reason):

`Fonds {jahr}: {wert} (Auflösung in einem Jahr, das kein Phase-Jahr ist).`

The reason strings, each written once and read as the full line text of its cell:

- stay from 032, 045 and 046: `Steuer nicht angehakt`, `kein Jahr zählt (nur das Auflösungsjahr)`,
  `kein Jahr zahlt Steuer`, `kein Fonds für dieses Jahr`, `Geld wird nicht geparkt (Option aus)`,
  `kein Geld zum Parken (Wert nicht positiv)`, `kein Zinssatz`, `Auflösung nach Phasenende`,
  `Auflösung vor Phasenbeginn`, `keine Hochrechnung je Anteil`
- new here: `Kirchensteuer nicht angehakt`, `kein Gewinn, darauf keine Steuer`,
  `Auflösung in einem Jahr, das kein Phase-Jahr ist`

Per column, first match wins, because one row can show a figure in one column and a dash with
another reason in another:

- `Erlös aus der Fondsauflösung in Euro`: `kein Fonds für dieses Jahr`, then the three strings of 032. No tax reason, because the proceeds exist outside the tax case.
- `Kapitalsteuer in Euro`, `Solzzuschlag in Euro`: `Steuer nicht angehakt`, then
  `kein Gewinn, darauf keine Steuer`, then the strings of 032. The Solzzuschlag has no reason of its
  own, its base is the Kapitalsteuer, so while that is off it reads `Steuer nicht angehakt`.
- `Kirchensteuer in Euro`: `Steuer nicht angehakt`, then `Kirchensteuer nicht angehakt`, then
  `kein Gewinn, darauf keine Steuer`, then the strings of 032.
- the two flat columns: `Steuer nicht angehakt`, `kein Jahr zählt (nur das Auflösungsjahr)`,
  `kein Jahr zahlt Steuer`, then the strings of 032. `Auflösung in einem Jahr, das kein Phase-Jahr
ist` never reads in a cell, it reads in `flatNoRowLine`.
- `Auszahlung in Euro`: `kein Fonds für dieses Jahr`, no other reason: `P · m` does not depend on
  the tax or on the option.
- `Betrag für das Jahr`: `kein Fonds für dieses Jahr`, then `kein Geld zum Parken (Wert nicht
positiv)`, and never `Geld wird nicht geparkt (Option aus)` or `kein Zinssatz`, because its figure
  stays while the option is off (046 AC5).
- `Zinsen über das Phase-Jahr in Euro` and `Steuer auf die Zinsen in Euro`: the orders 046 gives
  them, unchanged.

### States

- Loading: none, the app has no request and no storage write (024 AC6).
- Empty, first render: nothing typed, the result area shows the empty string and the year table is
  not rendered; the fund table shows its dash alone, with no flat column.
- Success: the money columns show their figures, a cashflow that does not exist shows its dash with
  its reason, a column with at least one figure shows its sum line, and the year section states the
  tax total and the cash total once. Nothing is invented for an empty column or an empty sum, no
  `0,00 €` (the display rule 045 records), because no percent figure is printed in the table.
- Error: the field errors of the existing rules (030, 033, 045 AC1, 046 AC1, and the override cells
  of 036 and 044); nothing here is a new error. While a field is invalid the year table is not
  rendered, so no sum line, no total, no reader line and no note is shown; the fund table stays with
  its dash alone. A negative figure reads as `formatEuro` prints it (045), no clamp and no new
  wording.
- Tax off: every tax cell shows its dash, the tax total is not stated while the cash total is, and the
  fund table's per-share figure and the proceeds column are the same number (AC6). Parking off or
  rate `0`: the interest cells show their dash, so the cash total is the tax columns plus the amount
  column, and `Betrag für das Jahr` keeps its figure, which is then `P · m` (046 AC5). A column with
  no figure shows no sum line, and the reader line still names its three groups, because it names the
  columns and not a number.

### Interactions

Nothing new is operated: no control, no validation, no focus movement. The figures recompute on
every keystroke, focus stays in the field being edited, the checkboxes announce their own state
change (046), no control is ever disabled (024 AC3), and the new paragraphs add no tab stop. The
scroller keeps its `tabIndex="0"`, its name `Jahresübersicht, horizontal scrollbar` and its inset
focus ring. No new state change is announced, so the live region gains nothing: the sums, the totals
and the notes stay paragraph text, which the design and the out-of-scope list both confirm.

### Accessibility

- One label per element: the thirteen column headers name what each figure is, the year stays the row
  header, and the caption names the phase period. No header is a substring of another header except
  the single word `Jahr`, which is inside `Betrag für das Jahr` and the two `Phase-Jahr` headers, so
  tests read it as the `columnheader` role or with `exact: true`.
- Dash cells are plain text with no control, so they need no label of their own; they stay reachable
  through table navigation and read as `–` plus their reason together with the column header and the
  year. The fund table's input cells keep their visually hidden labels (044).
- The projection label stays the accessible description of the fund table's figures only; the year
  table's cells have no description (046), and the field hints and errors keep their
  `aria-describedby` with `aria-invalid`, no `role="alert"`.
- Sum lines, totals, the reader line and the notes are paragraph text, never a `dd` and never part of
  the live region, so `valueOf` is not used for them.
- Number formats stay `formatEuro` (`1.188,04 €`, no-break space before `€`) with `tabular-nums`;
  percent is named as whole hundredths in the field copy (`0,00 bis 100,00 %`), and no percent figure
  is printed in either table; shares keep `55,06`.
- Contrast, hand computed, the tester re-checks with a tool: no new colour, so the values 045 and 046
  record hold in both schemes — headers `--color-text` on `--color-surface-subtle` 14,62 light /
  11,96 dark, figures `--color-text` on `--color-surface` 17,16 / 14,10, the reason cells, the sum
  lines, the totals, the reader line and the notes `--color-text-muted` on `--color-surface`
  7,78 / 7,64. Nothing new carries a state by colour; forced colours keep the 1 px CanvasText border
  of the invalid field and of the scroller, and focus stays `outline`.

### Below 600 px

- Only the year section's own wrapper scrolls sideways, the page never does; the `Jahr` column stays
  sticky at the left, so a row can still be identified while its figures are off screen.
- No column group heading. The pinned header lists of 036 AC1 and 046 AC4 are read as one flat list
  of `columnheader` elements, so a group row would add elements to a list the tests pin, and a group
  heading cannot name a cell. The grouping is one line of text below the table instead, the reader
  line.
- `min-width` has to grow with the thirteen columns, and the widest cells are the reason cells, which
  already wrap (`white-space: normal`, `overflow-wrap: anywhere`) while the money cells stay
  `nowrap`. The developer measures the value; starting value 1.200 px, and the tester reports what the
  table needs. At 320 px the reader sees the sticky year column plus about two money columns.
- What a reader can still compare on one screen: the reader line, the sum lines, the two totals and
  the two notes never scroll away, so a reader compares one column against its own sum line and the
  year's money against the cash total, and reads the row's arithmetic through the reader line rather
  than through a row that fits. This is the answer to hak's "Die Anzeige der Steuer verstehe ich
  nicht": the row is not readable as a whole at 320 px, so the section says what the reader adds and
  states each total once.
- The paragraphs stack below the table like the footnote, as in 045 and 046.

### Substring notes for the tester

`Kapitalsteuer` occurs once, in its header, and it is not a substring of `Kapitalertragsteuer`, which
reads in the KSt label and in the KSt hint. `Vorabpauschale` stays on the flat field's label
(045 AC1), and `Pauschalsteuer` reads in the two headers, the flat note, the facts paragraph and the
depot sentence. `Solzzuschlag` reads in the hint and in its header, `Kirchensteuer` in the checkbox
label, the Bundesland label and its header. `Zinsen` reads in the control label, the control hint,
the net note, its header, the cash total and the reader line; `Steuer` in the tax legend, the tax
headers, the reason strings, the tax total, the reader line, the net note and the payout check.
`Betrag für das Jahr` reads in its header and in the reader line, and `Jahr` in the row header, the
reader line, the cash total, the flat header and 046's facts. All of these are read as the full line
text of their own element or as the `columnheader`, never as a bare word. Every sum line repeats its
column's header text, so a sum line is read as its own full line text, and `Summe` is the word that
tells it apart from the header. `Erlös` and `Netto` occur
once each, `Zufluss` twice (046's facts paragraph and this story's parked note), and `Haltedauer`
occurs no more, because its header leaves with the column.

### For the orchestrator to resolve

1. The design names the first tax column `Kapitalertragsteuer in Euro`, AC2 names it `Kapitalsteuer`;
   I read AC2's word as the header, because AC7 reads cells by header text, so the copy and the
   pinned list need one of the two. The other two tax names agree with the design.
2. The design names the two flat columns with the word `Vorabpauschale`; 045 AC1 keeps that word on
   the field label as exactly one element, so my strings use the shorthand `Pauschalsteuer` that 045
   established for the column that shows this money. This supersedes 045's note that the word occurs
   once; the field is still read by its label, so nothing existing breaks.
3. AC4 names "a year without a funding fund" as a dash with its reason, while `laz.spec.ts` `126` and
   `392` read the `Betrag für das Jahr` cell as `–` alone and the design says those tests are not
   rewritten. I read the parked cell as the plain dash, because its rule is the year table's footnote
   and the row already names the reason in the funding cell. If AC4 is read as every cashflow column
   including the parked one, the parked cell gains `kein Fonds für dieses Jahr` and those two
   assertions move; that is the orchestrator's call, not mine.
4. The two statements marked in the copy section (`flatNote` and `parkedNote`) are the two the design
   takes to gate 2; the arithmetic does not depend on either.

## Technical design

The design follows hak's gate-1 answers of 2026-11-16: no tax figure anywhere in the fund table, one column
per cashflow in the year table, a rate that exists but does not apply is a dash with its reason, every column
keeps its own sum line, the year section states the year's tax total and cash total once, and the control
figures of 024, 032, 033, 035, 045 and 046 stay. [ADR 0017](../adr/0017-laz-a-funds-tax-figures-read-in-the-year-table.md)
records the decision that a fund's tax figures read in the year table while the fund table keeps the pre-tax
proceeds.

### Files, in dependency order

| File                                             | Responsibility the design gives it                                                                                                                                                                                                                                                 |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/laz/src/features/plan/logic/fields.ts`     | unchanged: no new input (AC out of scope)                                                                                                                                                                                                                                          |
| `apps/laz/src/features/plan/logic/fund.ts`       | unchanged                                                                                                                                                                                                                                                                          |
| `apps/laz/src/features/plan/logic/format.ts`     | unchanged; `roundEuroCents` is the single rounding every money cell of this story uses                                                                                                                                                                                             |
| `apps/laz/src/features/plan/logic/projection.ts` | gains `preTaxPerShareMicroEur(fund, asOf)` = `navMicroEur · ρ`, the figure the fund table shows now (AC1). `payoutFactor` and `payoutPerShareMicroEur` keep the tax, because the closed form and `purchase.ts`'s `shares` read them                                                |
| `apps/laz/src/features/plan/logic/flat.ts`       | gains `flatYearMicroEur(fund, year, flat, tax, asOf)`, the base of one counted year times the rate: the split of a fund's figure into the year-table cells. `flatYears`, `flatBaseFactor`, `flatTaxMicroEur` unchanged. Still no phase knowledge and no reason string              |
| `apps/laz/src/features/plan/logic/deposit.ts`    | unchanged: `monthSum`, `parkInterestMicroEur`, `parkTaxMicroEur` (one figure, not split — hak's answer 11), `parkNetMicroEur`, `parkTerm`                                                                                                                                          |
| `apps/laz/src/features/plan/logic/tax.ts`        | unchanged; `cashflow.ts` reads `KST_MILLIONTHS`, `SOLZ_ON_KST_MILLIONTHS`, `churchTaxMillionths`, `taxFromState`                                                                                                                                                                   |
| `apps/laz/src/features/plan/logic/phase.ts`      | `YearRow`, `yearRows`, `fundingFund`, `monthsInYear`, `phaseYears`, `displayYearCents`, `ParkReason`, `ParkTaxReason` stay; the flat part of the money rule and the per-column sums move out of it and out of `purchase.ts` into `cashflow.ts`                                     |
| `apps/laz/src/features/plan/logic/purchase.ts`   | keeps `PurchaseRow`, `fundPhaseYear`, `PurchaseReason`, `displayFundParts` (the purchase parts only: the flat parts are no longer in the fund table); `flatMicroEur`, `flatReason`, `flatPartsSum` and `flatReasonFor` move to `cashflow.ts`                                       |
| `apps/laz/src/features/plan/logic/cashflow.ts`   | **new**: the per-year cashflow record, the per-column reason union, the money rule over both tables, the column sums                                                                                                                                                               |
| `apps/laz/src/features/plan/fieldCopy.ts`        | the column labels, one label per element, the per-column sum lines, the year section's tax and cash totals, the new reason strings, the wording that the parked money is a balance; `COPY.amountColumn` (`Betrag für das Jahr`, line `200`) stays and is the parked column's label |
| `apps/laz/src/features/plan/YearTable.tsx`       | the columns AC2 names, in that order; the year section's totals paragraph                                                                                                                                                                                                          |
| `apps/laz/src/features/plan/FundTable.tsx`       | the flat column is gone (AC1); the projection cell reads `preTaxPerShareMicroEur`; the fund section keeps no tax sum line                                                                                                                                                          |
| `apps/laz/src/features/plan/PlanCalculator.tsx`  | passes the `TaxState` (the two checkboxes plus the Bundesland), not only the single `Tax` rate, because the parts need them separately; calls `cashflowRows`                                                                                                                       |

### The per-year record

```ts
// apps/laz/src/features/plan/logic/cashflow.ts
/** One column of the year table, in the order AC2 names. `parked` is the year table's existing amount column
 *  (`Betrag für das Jahr`), the money at the start of the year; whether the copy calls it a balance or a cashflow
 *  needs hak's confirmation. */
export type CashflowColumn =
  | 'proceeds'
  | 'kst'
  | 'solz'
  | 'kist'
  | 'flatBeforePhase'
  | 'flatForYear'
  | 'payout'
  | 'parked'
  | 'interest'
  | 'interestTax';

/** One reason union for the whole table: a row can show a figure in one column and a dash with another
 *  reason in another (AC4), so each column reads its own reason, as 045 and 046 already do. */
export type CashflowReason =
  | 'outside-tax-case' // 045's and 046's existing string, read in every tax column (AC4)
  | 'kist-off' // the church tax is a rate that does not apply (AC4)
  | 'no-positive-gain' // max(0, ρ − 1 − flatBaseFactor) is not positive
  | 'no-year-counts'
  | 'no-year-pays' // 045's existing flat reasons
  | 'sale-year-not-a-phase-year' // AC3: no row for that fund, so the year section states its money once
  | 'not-bought-in-the-phase' // 032's PurchaseReason strings, read through purchaseReasonText
  | 'no-funding-fund' // 024's COPY.missingYear
  | 'option-off'
  | 'no-rate'
  | 'no-money-to-park'; // 046's existing reasons

export interface YearCashflow {
  readonly year: number; // the phase year
  readonly fundingFund: Fund | null; // fund with year === phaseYear − 1 (fund year + 1, as 032/035/045 write it)
  readonly saleFund: Fund | null; // the fund sold in this phase year (fund with year === phaseYear)
  readonly proceedsCents: number | null; // shares · navMicroEur · ρ, in Cent: the pre-tax whole money
  readonly taxBaseFactor: number | null; // max(0, ρ − 1 − flatBaseFactor), the base payoutFactor already uses
  readonly kstCents: number | null; // KST_MILLIONTHS on the base
  readonly solzCents: number | null; // SOLZ_ON_KST_MILLIONTHS on the base (its base is the KSt, so it never
  // has a reason of its own: while the KSt is off the base does not exist)
  readonly kistCents: number | null; // churchTaxMillionths on the base; the derived part while its checkbox
  // is on, else a dash — then the derived part is the Solzzuschlag, the
  // last part with a figure (see the money rule below)
  readonly taxTotalCents: number | null; // the single rounding of the row's tax: the three parts plus
  // interestTaxCents, stated once (AC3); its last part is derived
  readonly flatBeforePhaseCents: number | null; // the fund sold in this year, its counted years before the phase
  readonly flatForYearCents: number | null; // the funds still held in this phase year (funds bought in the
  // phase with year > phaseYear), the figure of this year
  readonly payoutCents: number | null; // P · m: the gross monthly amount times the months (answer 6)
  readonly parkedCents: number | null; // shares · payoutPerShareMicroEur = P·m − net: the money at the START
  // of the year, the figure `displayYearCents` shows today (024 AC2,
  // 046 AC5), shown in the year table as the column it is today
  readonly interestCents: number | null; // the GROSS interest of the year, one rounding
  readonly interestTaxCents: number | null; // taxFromState on the interest: one figure, not split (answer 11)
  readonly cashTotalCents: number | null; // the tax parts plus parkedCents plus interestCents, stated once;
  // equal to taxTotalCents + payoutCents (see the row identity)
  readonly reasons: Readonly<Partial<Record<CashflowColumn, CashflowReason>>>;
}
```

Per fund the flat figures are `flat.ts`'s values (a per-share-based figure that 045 treats as the fund's whole
money, `navMicroEur · yearBase · rate / RATE_UNIT`), read as whole money by AC3 and not divided by shares.
The pieces of one fund add to that fund's figure because they are the same expression, so the split cannot be
falsified by the money rule; the base rule needs its own hand value (AC5).

### The row that adds up

Per row, with `shares` the fund table's shares (the same `deposit.ts` expression `purchase.ts` uses), every
figure unrounded until display:

```text
proceeds cell (the fund's contribution) = shares · navMicroEur · ρ      = the fund's money for the year, pre-tax
tax parts (three cells)                 = shares · navMicroEur · rate · max(0, ρ − 1 − flatBaseFactor)
parked cell (the year amount, 024 AC2 and 046 AC5)
                                        = shares · payoutPerShareMicroEur = P·m − net
                                        = the money that must be at the START of the year
payout cell (AC2, answer 6)             = P · m                          = the gross monthly amount times the months
interest cell                           = the GROSS interest of the year (`deposit.ts`)
tax on the interest cell                = one figure, not split (answer 11); the net is its difference from the interest
tax total (stated once)                 = tax parts + taxOnInterest
cash total (stated once)                = tax parts + parked + grossInterest = tax total + P·m
```

**Which cell carries which figure.** AC2 names two figures that are different numbers while the parking option is
on, so the design names the cell for each: the **payout cell is `P · m`** (hak's answer 6, the money that leaves the
year), and the **fund's contribution is the proceeds cell** (`shares · nav · ρ`, the money the fund brings in the
year, pre-tax). The contribution is a cell, not only an identity, and its part after the tax is the parked cell:
`payoutPerShareMicroEur` is `nav · ρ − nav · rate · max(0, ρ − 1 − flatBaseFactor)`, so per row
`proceeds = tax parts + parked` holds by construction, and `parked` is the same figure `purchase.ts` divides by to
get `shares` (`phase.ts` line `233`, `purchase.ts` line `198`) — the fund table's amount cell and the year table's
parked cell cannot show two numbers for one year (046 AC4).

**The one line the tester pins**, for the parking-on case with the tax on:

```text
tax parts + parked (the money at the START of the year) + grossInterest = P·m + tax total = the cash total
```

The right side is the cash total, not the payout cell alone: `parked + netInterest = P·m`, so with the tax on the
line has the tax on its right side, and it reads as hak's line exactly when the tax is off (then the tax parts are
dashes, `net` is the interest and the cash total is the payout cell). This is stated here rather than assumed,
because the line as written is only true when the tax is off, and the tester must pin the version with the tax.

**The interest cell.** It shows the **gross** interest, and the tax on it is its own column (046 AC3, answer 11);
the net is the difference of the two cells, not a third number, and it is what the money at the start of the year is
computed from. The copy names the net as the difference between the interest cell and its tax column. With the tax
off the tax cells are dashes and `net` is the interest, so `payout = parked + interest`. With the parking option off
or the rate 0 the interest cells are dashes, `net` is 0 and `payout = parked`, which is exactly 024 AC2's rule.

**The derived part, named per identity** (the money rule allows exactly one):

- the tax identity: the last part **with a figure** in the reading order is derived from the row's tax total — the
  Kirchensteuer while its checkbox is on, and the Solzzuschlag when the church tax is a dash, because a dash has no
  figure to derive. The Solzzuschlag is never derived from its own base (its base is the KSt), and the tax on the
  interest is one figure, not a part (answer 11), so it is not a candidate;
- the depot identity: the last flat figure in the reading order is derived from the shown depot;
- `payout = parked + netInterest`: **no derived part**, because `P·m` is a whole number of Cent (no rounding can
  absorb a difference) and `parked` is the single rounding the fund table already uses. The tester reports a row
  where `parked + net` does not add to `P·m` as the rounding coupling, not as the rule.

The tester therefore pins the row where `tax parts + parked + grossInterest` equals the cash total and where the
derived flat part differs from its own rounding (`purchase.test.ts` `279`–`281`), and pins the same row's
`parked + net = P·m` from its own arithmetic (AC3).

One worked row, computed here with the design's own arithmetic (not a measurement, nothing was run): the monthly
money `P = 100,000,000 µ€` (`100,00 €`, the value `deposit.test.ts` uses), `12` phase months, the deposit at `2,50 %`
(`250` hundredths), tax on at `26,375 %` with the church tax off, a fund with `nav = 100,000,000 µ€`, `ρ = 1,4` and
no flat base. Then `monthSum(12) = 12·13/24 = 6,5`, so the gross interest is `100,000,000 × 0,025 × 6,5 =
16.250.000 µ€` (`1.625 Cent`, the committed pin ✓), the tax on it `16.250.000 × 0,26375 = 4.285.937,5 µ€`
(`428,59375 Cent` → shows `429 Cent`, the committed pin ✓), the net `11.964.062,5 µ€` (the committed pin ✓),
`P·m = 1.200.000.000 µ€` (`120.000 Cent`, the payout cell), and the parked cell is
`1.200.000.000 − 11.964.062,5 = 1.188.035.937,5 µ€` (`118.803,59375 Cent` → shows `118.804 Cent`), which is the
year amount column. The fund's per-share figures are `tax/share = 100,000,000 × 0,26375 × 0,4 = 10.550.000 µ€` and
`payoutPerShare = 140.000.000 − 10.550.000 = 129.450.000 µ€`, so `shares = 1.188.035.937,5 / 129.450.000`
(`9,177566...`) and the tax parts are `9.682,3322832 Cent`: the KSt part `9.177,5661 Cent` (`→ 9.178`), the
Solzzuschlag `504,7661 Cent` (`→ 505`), the Kirchensteuer a dash with its reason because its checkbox is off; the
proceeds are `128.485,9260332 Cent`. The row's cash total is
`9.682,3322832 + 118.803,59375 + 1.625 = 130.110,9260332 Cent` → shows `130.111 Cent`, and the same money as
`tax total + P·m` = `10.110,9260332 + 120.000 = 130.110,926 Cent` ✓. The payout cell alone is `120.000 Cent`,
which is `118.804 + (1.625 − 429) = 120.000` ✓ but is **not** `tax parts + parked + interest` — the difference is
exactly the year's tax, which is why the one line pins the cash total and not the payout cell.

This row also shows the derived part moving, which AC3 needs: the tax total's own rounding is `10.111 Cent`, while
the parts' own roundings would add to `9.178 + 505 + 429 = 10.112`, so the last part with a figure in the reading
order — the Solzzuschlag here, because the Kirchensteuer is a dash — is derived as `10.111 − 9.178 − 429 = 504 Cent`
against its own rounding `505`. The row's cash total does not change, because its addends are the shown tax parts
(`9.178 + 504 = 9.682`) plus `118.804 + 1.625` ✓. This is the shape `purchase.test.ts` `279`–`281` already pins for
the depot, read in the year table.

The flat columns are depot parts (045 AC5), not money of this year: the money for a counted year is paid on the
first business day of the next year, and the years before the phase were paid before the phase. So they are not
addends of the row's cash total; the copy says so, and each keeps its own sum line. The parked column is in the
cash total through the identity `parked + net = P·m`: it is the part of the year's money that was already there at
the start of the year, so the arithmetic does not depend on what the copy calls it. **Two copy statements still need
hak's confirmation:** (a) the flat columns are depot parts paid in other years, so the copy says they are not added
to the year's cash total; (b) the parked column is a balance at the start of the year and not a flow, so the copy
names it as a balance while its figure is an addend of the cash total. Both are copy, not arithmetic, and both are
taken to gate 2.

### The year amount column stays

The parked cell **is** the year table's amount column as it is today: `COPY.amountColumn` is
`Betrag für das Jahr` (`fieldCopy.ts` line `200`), and the column reads `yearAmountMicroEur` / `displayYearCents`
(`phase.ts` line `233`, `purchase.ts` line `198`), the same expression `purchase.ts` divides by to get `shares`. The
design keeps that column, its figure and its header text, so:

- 024 AC2's assertions stay where they are: `laz.spec.ts` `106`, `125` and `139` read that cell by its header text,
  `392` (033 AC1's test) reads it as the dash for a phase year outside the list, and `691` and `700` (035 AC1's
  test) read it for the boundary years; `phase.test.ts` `171` and `173` pin `displayYearCents` as the hand value
  `35914,378972` Cent for a three-month year, which is `P·m` with the parking option off. None of them moves.
- 046 AC5's assertions stay: with the option off or the rate 0 the net is 0, so the parked cell is `P·m` and the
  control figures of 024, 032, 033, 035 and 045 are the same numbers this story shows (AC6). The column is only a
  different number from the payout cell while the parking option is on with a rate above 0.
- `changes:` gains no entry for 024 AC2 or 046 AC5, because no rule and no figure of theirs moves; only 046 AC4's
  pinned header list changes (`laz.spec.ts` `1042`), which is already in `changes:`.
- The copy list names the column as the column it is today (`Betrag für das Jahr`), and the new payout column
  (`P · m`) is the column that gets a new label. If hak renames the parked column instead, the header-text reads
  above move with it and `changes:` must then list 024 AC2 and 046 AC5 — that is why the rename is not decided here.

### The flat columns do not count a year twice

- **Column A** (`flatBeforePhaseCents`) holds only the counted years of the fund resolved in this year that have
  **no row of their own**: the years before the phase (AC3's sentence, `flatYears` from `flat.ts`).
- The phase-year parts of that same fund read in the rows of those years, in **column B**, because those years
  have rows.
- **Column B** (`flatForYearCents`) counts only the funds still held in this phase year, and the fund resolved in
  this phase year is not "still held": its own liquidation year never counts (045 AC2), so a fund never
  contributes to column B of the row it is read in.

The identity the tester pins for one fund: **column A of its row plus the column B figures of the earlier rows =
that fund's `flatTaxMicroEur`**, so the depot's flat part adds up without counting a year twice. A fund whose
sale year is not a phase year has no row, so its figure is stated once in the year section with its reason
(answer 12), and that line is the last part of the reading order.

### The money rule across the two tables

The money rule has one derived part, and the reading order decides which figure it is:

1. **Depot parts** (045 AC5, read across two tables now): the fund table's purchase parts row by row, then the
   year table's flat figures row by row (column A before column B), then the year section's line for a fund
   whose sale year is not a phase year. The last part with a figure in that order is derived from the shown
   depot; within a fund whose figure is split across cells, the last piece is derived from that fund's part.
2. **Tax parts**: the row's tax total is rounded once (`taxFromState` on the same base), and the last part **with a
   figure** in the reading order of the split is derived from it — the Kirchensteuer while its checkbox is on, the
   Solzzuschlag when the church tax is a dash (its own base is the KSt, so it is never derived from a base), and the
   tax on the deposit interest is one figure, not a part.
3. **Every column's sum line is the sum of the figures shown in that column** (`parkSumsCents`'s rule, carried
   over). The year section's tax total is the sum of the shown figures of its tax columns; its cash total is the sum
   of the shown figures of the cash columns that are money of the year — the tax parts, the parked cell and the
   interest — because the flat columns are depot sums (their own lines), and `payout = parked + net` is shown as the
   same money. The `displayFundParts` order stays row by row, so a fund row with no flat figure is exactly 032 AC2's
   rule and its hand values stay.

### Hand values: what is on disk, and what this design could compute

**Facts on disk (the committed pins, read in this pass)** — these must not move (AC6):

| File                                                  | Pin                                                                                                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `flat.test.ts` `70`, `93`                             | `590800` µ€ (the base `2,24 €` at `224` bp, tax `26,375 %`)                                                                                                        |
| `flat.test.ts` `109`, `110`, `125`                    | `1211140` = `0,5908 €` + `0,62034 €`; `4153278.335913`; `112,80 €`                                                                                                 |
| `flat.test.ts` `24`, `51`                             | the base `1,12 €` → `295.400` µ€, the cap does not bind                                                                                                            |
| `purchase.test.ts` `141`–`155`                        | parts `108054` / `103184` / `97774` Cent plus the flat group `77` / `110` / `146` (the depot `309345`), `flatPartsSum` `333`                                       |
| `purchase.test.ts` `279`–`281`                        | `147,354370` Cent, its own rounding `147`, the rule's value `148`: the derived part differs from its own rounding here, so the rule can move                       |
| `projection.test.ts` `84`, `93`                       | `45,96 €` for the fixture row 2030 at `25 %`, on the test's own `FLAT_BASE`                                                                                        |
| `deposit.test.ts` `77`                                | `11,9640625 €`                                                                                                                                                     |
| `phase.test.ts` `211`–`219`, `224`–`236`, `241`–`252` | `F = 89,089035488581`, `K = 1,206414022241`, `878.826,214663 Cent`; `1.804,98 €`; `76,698488 + 109,693335 + 147,354370 = 333,842117 Cent`, `-1,095384` → `-0,01 €` |
| `tax.ts` `13`, `16`, `27`–`42`, `45`                  | `KST_MILLIONTHS 250000`, `SOLZ_ON_KST_MILLIONTHS 13750` (5,5 % of the KSt), `8` for Bayern and Baden-Württemberg, `9` elsewhere, `DEFAULT_BUNDESLAND 'bayern'`     |
| `fieldCopy.ts` `289`                                  | `Steuer nicht angehakt`                                                                                                                                            |

**What this design reproduces with its own arithmetic.** `flat.test.ts` `109` and `51` come out exact on the
test's own case (`fund(2027, 100000000, 500)`, `asOf` 2025-01-01, flat `224`, tax `26,375 %`): asOf's own year
has the cap `100 × 1 × 0,0224 = 2,24 €` and the year after it `100 × 1,03 × 0,0224 = 2,352 €`, both below that
year's actual increase (`5 €` and `5,25 €`), so `2,24 × 0,26375 = 0,5908 €` and `2,352 × 0,26375 = 0,62034 €`
add to `1211140` µ€ ✓, and the base `1,12 €` there is `295.400` µ€ ✓. For the fixture's fund 2030
(`42000000`, `300` bp) at the control case's `asOf` 2026-12-31 the same method gives the bases `0,94087618 €`,
`0,96910246 €` and `0,99827149 €` for 2027, 2028, 2029 (2026 has no month after asOf's day, so its base is 0),
`2,90825013 €`, and `× 0,26375 = 76,70107 Cent` against the committed `76,698488 Cent` at `phase.test.ts`
`241`. The difference of `0,00259 Cent` is inside the sign-safe cap, so this design does not call its number a
reproduction: the pin stays the oracle, and every new row figure is the tester's own arithmetic.

AC3's row where the derived part differs from its own rounding is the shape `purchase.test.ts` `279`–`281`
already pins for the depot (`147,354370` → `147` against the rule's value `148`). For the tax parts the base `B`
read in Cent gives `0,25 B`, `0,01375 B` and `0,02 B` against the total `0,28375 B`, so `B = 315,53634` gives
`78,884085` → `79`, `4,333125` → `4` and `6,310727` → `6`: their own roundings add to `89` against the total's
`89,528745` → `90`, so the Kirchensteuer is the derived part and reads `7` Cent. The Solzzuschlag cannot be the
derived part, because its base is the KSt, and the tax on the deposit interest is one figure, not a part
(answer 11). After this story the flat group `77` + `110` + `146` reads across the year table's two flat columns
and must still add to `333` Cent.

**What is not a measurement, and cannot be here:** no test was run, and the plan modules cannot be imported
from `node` because `fund.ts` imports `fund-list.json` without an import attribute, so no row of the new shape
could be observed. `flat.ts` reads the `Tax` built by `taxFromState`, so the parts of a row are the same
expression as the total: the split cannot falsify its own base rule, and the base rule needs its own hand value.
Where my arithmetic did not reproduce a committed pin (for example the `45,96 €` figure, whose inputs I cannot
name from the test file, or `76,698488 Cent` for fund 2030 at `asOf` 2026-12-31, where my arithmetic gives
`76,707648 Cent`), the pin stays the fact and my number is reported as unverified, not as a measurement. The
tester pins every new figure from its own arithmetic; earlier numbers in this design that were taken from a
cancelled run or from assumed inputs are not oracles.

### Shared expressions the tester must know (P32)

- `monthSum` in `deposit.ts` is shared by the interest column, by `parkNetMicroEur` (which `purchase.ts` uses
  for `shares`) and by `parkTerm` (the term `K`), so one mutation moves three assertions.
- `max(0, ρ − 1 − flatBaseFactor)` is shared by `payoutFactor` (the closed form), the three tax parts, the
  parked cell (through `payoutPerShareMicroEur`, which is how `purchase.ts` gets `shares`) and the row identity
  `proceeds = tax parts + parked`. The payout cell (`P·m`) does **not** read it, so the tester must not read a
  change to the base factor as a change to the payout cell. The identity holds by construction through the base
  factor, so AC3 cannot falsify it: AC5's unit test must pin the base factor itself from a hand value (the design
  cannot pin it here, because the modules cannot be imported), and the parts from the same hand value, not from the
  module under test.
- `monthsInYear` is shared by the payout cell (`P · m`), the parked cell (`P·m − net`, through
  `parkNetMicroEur`), `parkInterestMicroEur`'s term, `displayYearCents` and `phaseFactor`, so one mutation moves
  the payout cell, the year amount column and the closed form at once. `parkNetMicroEur` takes the MONTHLY money,
  not the year amount (046's risk 7), so the payout cell and the parked cell are computed from the same
  `monthSum` on different bases: that is the expression that makes them two numbers.
- `flat.ts`'s `yearBase` is shared by `flatBaseFactor` (which `payoutFactor` reads) and by the new
  `flatYearMicroEur`, so the pieces always add to the fund's figure; 045 AC2's pins stay its oracle.
- `tax.ts`'s rate is shared by the tax parts, `taxFromState`'s total, `deposit.ts`'s `parkTaxMicroEur` and
  `flat.ts`'s `flatTaxMicroEur`. For a fund with a positive gain the tax parts plus the fund's flat figure add
  to `rate × gain` (045 AC3); on the negative branch the `max(0, …)` makes the two forms differ, so the parts
  are computed on the sign-safe base, not on `gain`.
- `roundEuroCents` in `format.ts` is the single rounding used by the fund table, the year table's new cells and
  the derived parts.
- The string `Steuer nicht angehakt` (`fieldCopy.ts` line `289`, on disk today) is read by `flatReasonText`,
  `parkTaxReasonText` and the new `cashflowReasonText`: three rules share one expression, so a mutation of it
  moves three assertions. The tester names this in its report (P32).

### Copy in `fieldCopy.ts` (German, one label per element)

- Columns, in AC2's order: `Erlös aus der Fondsauflösung in Euro`, `Kapitalertragsteuer in Euro`,
  `Solzzuschlag in Euro`, `Kirchensteuer in Euro`, `Vorabpauschale vor der Phase in Euro`,
  `Vorabpauschale für das Phase-Jahr in Euro`, `Auszahlung in Euro` (new: the `P·m` column), `Betrag für das Jahr`
  (024's existing `COPY.amountColumn`, line `200`, unchanged: this is the parked cell, the money at the start of the
  year, and the tests read it by this text), `Zinsen über das Phase-Jahr in Euro` and `Steuer auf die Zinsen in Euro`
  (046's existing strings). The wording that the parked money is a balance goes in the facts paragraph, not in the
  header, so the header list of 046 AC4 keeps its strings and only gains the new ones.
- One sum line per column: `columnSumLine(label, wert)` replaces `COPY.parkSumLine`, so each column's line is
  the sum of the figures shown in that column.
- The year section's two totals, stated once: `taxTotalLine` and `cashTotalLine`, and the line for a fund whose
  sale year is not a phase year, `flatNoRowLine(fundYear, wert)` with its reason.
- New reason strings: `Kirchensteuer nicht angehakt`, `kein Gewinn, darauf keine Steuer`,
  `Auflösung in einem Jahr, das kein Phase-Jahr ist`. 032's, 045's and 046's reason strings stay and are read
  through `purchaseReasonText` / `flatReasonText` / `parkReasonText` unchanged.
- Two sentences that state what the reader must not read into the table: the flat columns are depot parts paid in
  other years (045's `flatDepotNote` and `flatFacts` stay), so they are not added to the year's cash total; and the
  parked column is the money that was already there at the start of the year, so its figure is the year's money only
  through `parked + net = P·m`. Both sentences are copy, and both need hak's confirmation (the design's arithmetic
  does not depend on the second).
- The number format stays `formatEuro` (`1.188,04 €`, no-break space before `€`), and cells are read by their
  header text (CLAUDE.md).

### Minimal test set (one test per AC at the cheapest level)

| AC  | Test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Level          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| AC1 | one `apps/laz/e2e/laz.spec.ts` spec: the fund table read by header text (no tax cell), the fund row's projection figure read as a hand value (the pre-tax figure, not the taxed payout of 024 AC4), the fund section without a tax sum line; the pinned column list is updated inside the same spec                                                                                                                                                                                                        | e2e            |
| AC2 | one `laz.spec.ts` spec: one row read column by column by header text, the nine cashflow columns in AC2's order                                                                                                                                                                                                                                                                                                                                                                                             | e2e            |
| AC3 | one `laz.spec.ts` spec: the row's cells added by hand equal the year section's tax total and cash total, each column sum line equals the figures shown in that column, and one row where the derived part differs from its own rounding (so the rule can move); plus the N = 1 row, where the first row is also the last; and the flat identity, column A of a fund's row plus column B of the earlier rows equals that fund's figure, which is only testable because `flat.ts` exports `flatYearMicroEur` | e2e            |
| AC4 | one `laz.spec.ts` spec: each dash read as the full line text of its cell, one row that shows a figure in one column and a dash with another reason in another                                                                                                                                                                                                                                                                                                                                              | e2e            |
| AC5 | one unit test `cashflow.test.ts` for the split on the same base (the base factor and the three parts from one hand oracle, not from the module under test); the copy strings and the reason map in `fieldCopy.test.ts`, which AC5 names as the copy test                                                                                                                                                                                                                                                   | unit           |
| AC6 | no new test: the existing tests of 024, 032, 033, 035, 045 and 046 re-run as the control case at their existing levels; the equality `proceeds = shares × the fund table's figure` is one added assertion inside AC1's spec                                                                                                                                                                                                                                                                                | e2e (existing) |
| AC7 | no test of its own; it is satisfied by the rewritten tests below, each figure asserted once where its rule lives and once as what the cell shows                                                                                                                                                                                                                                                                                                                                                           | —              |

AC4's case "a phase year without phase months" cannot be reached: `phaseYears` only yields years with at least
one phase month, so `monthsInYear` never returns 0 for a row. No reason string and no test are written for it;
the tester records it as checked, OK, and the AC is read as the cases the app can produce.

### Tests that must be rewritten, not deleted

| Place                                                                                                                            | What it asserts today                                                                                                                                                                                     | What it asserts after                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/laz.spec.ts` 716–728 (036 AC1)                                                                                              | the fund table's pinned column list, flat column included                                                                                                                                                 | the same list without the flat column                                                                                                                                                                                                                                                                                                               |
| `e2e/laz.spec.ts` 809, 821, 827 (045 AC1)                                                                                        | the flat field and that no flat figure appears outside the tax case                                                                                                                                       | the same field; the figure is read in the year table                                                                                                                                                                                                                                                                                                |
| `e2e/laz.spec.ts` 846, 851–857 (045 AC4)                                                                                         | the fund table's flat cell and the fund section's sum line                                                                                                                                                | the same figure in the year table's column A and its own sum line                                                                                                                                                                                                                                                                                   |
| `e2e/laz.spec.ts` 900, 910, 918, 921 (045 AC5)                                                                                   | `flatPartsSum` and the depot parts in one table                                                                                                                                                           | the parts read across two tables, the last part derived                                                                                                                                                                                                                                                                                             |
| `e2e/laz.spec.ts` 1038–1045, 1059–1064 (046 AC4)                                                                                 | the year table's header list and its sum line                                                                                                                                                             | the extended header list, per-column sum lines                                                                                                                                                                                                                                                                                                      |
| `fieldCopy.test.ts` 251–258, 265–268                                                                                             | the two parking labels, `parkSumLine`, the reason maps                                                                                                                                                    | the labels stay, `columnSumLine` replaces the one sum line, the reason map gains the new reasons                                                                                                                                                                                                                                                    |
| `purchase.test.ts` `141`–`155`                                                                                                   | `displayFundParts` with a flat group (`108054`/`103184`/`97774` Cent plus the flat group `77`/`110`/`146`, where `146` is the derived part and its own rounding would be `147`), and `flatPartsSum` `333` | `displayFundParts` without the flat group (purchase parts only, same three values); the flat group moves to `cashflow.ts` and keeps `77`/`110`/`146`, read as the pieces of the fund's figure across the two flat columns, with `146` still the derived part; `flatPartsSum` moves with the same value `333`                                        |
| `projection.test.ts` `84`/`93`                                                                                                   | the fund table's figure `45,96 €` for the fixture row 2030, tax on at 25 %, read through `payoutPerShareMicroEur` with the test's own `FLAT_BASE`                                                         | the fund table's cell now shows the pre-tax figure (`preTaxPerShareMicroEur`), so this test pins that value as its own hand value; the tax `1,32 €` it shows today is read in the year table's KSt column instead. The `FLAT_BASE` the test assumes is not the base `flat.ts` computes, so the two tests must not be read as oracles for each other |
| `flat.test.ts`, `deposit.test.ts`, `phase.test.ts`                                                                               | the per-year base, the interest and its tax, F and K                                                                                                                                                      | unchanged; `flat.ts`'s new export is read through `cashflow.test.ts`, not through a second oracle                                                                                                                                                                                                                                                   |
| `e2e/laz.spec.ts` `106`, `125`, `139`, `392`, `691`, `700` and `phase.test.ts` `171`, `173` (024 AC2, 033 AC1, 035 AC1, 046 AC5) | the year table's `Betrag für das Jahr` cell, read by header text, as the money at the start of the year                                                                                                   | **not rewritten**: the parked cell is that column, so the same header text and the same hand values are asserted; only `1042` (046 AC4's header list) gains the new columns                                                                                                                                                                         |

### Risks, and what cannot be verified

1. Nothing here is a measurement: no test was run, and the plan modules cannot be imported by `node` because
   `fund.ts` imports `fund-list.json` without an import attribute. All figures above are own arithmetic; the run
   that pins F, K, `cash` and the depot is the tester's, not the architect's.
2. The row identity holds by construction, so AC3 can only be falsified through the rounding rule. Each shared
   expression needs its own hand value (see P32), otherwise a mutation moves two assertions and the tester
   reports a defect that is really the coupling.
3. Two derivation levels (the depot part and the row's tax part) can claim the same figure. The design fixes the
   order; if the developer derives per column instead, the row totals stop matching, and the hand values above
   change. This must be decided before the code is written.
4. The parked money is a balance, not a flow, and it is already the year table's existing amount column
   (`Betrag für das Jahr`, `P·m − net`, 046 AC4 and AC5), so AC2's "its own column" is satisfied by naming that
   column, not by adding a duplicate. Its figure is an addend of the row's cash total through
   `parked + net = P·m`; its own sum line is the sum of the figures shown in that column, and the copy must not call
   it money of the years while the payout cell is. Needs hak's confirmation.
5. AC6's sentence that the fund table's per-share figure and the year table's proceeds are the same number is
   literally true only when shares = 1; the design reads it as `proceeds = shares × that figure`. Needs hak's
   confirmation.
6. The two figures AC2 names are two different numbers while the parking option is on. The tester must not pin
   hak's gate-1 line as `tax parts + parked + interest = P·m`: with the tax on that sum is the cash total, and the
   payout cell is reached only through `parked + net`. With the tax off the two readings are the same number, so a
   test written on the off state cannot move, which is why AC3's row must be a tax-on row.
7. The flat figures stay per-share-based values that 045 treats as whole money; that convention is what keeps
   045 AC5's hand values, and the split inherits it. If a later story divides them by shares, both tables move.
8. `flat.ts` must export the per-year base for the split to be testable through an exported caller (story 026 R3);
   a fix inside `yearBase` cannot be caught by the money rule.
9. The `changes:` entries (024 AC4, 032 AC2, 036 AC1, 045 AC4, 045 AC5, 046 AC4) need the "(changed by 047)"
   annotations on the done stories after gate 2; the pinned column lists are updated, not deleted. No entry is
   added for 024 AC2 or 046 AC5, because the year amount column stays as it is today.

### Implementation plan

1. `projection.ts`: `preTaxPerShareMicroEur`; `flat.ts`: `flatYearMicroEur` (the internal `yearBase` stays
   internal, the new caller is the exported one).
2. `cashflow.ts`: the record, the reason union, `cashflowRows`, `columnSumsCents`, `flatPartsSum` (moved from
   `purchase.ts`), the money rule with the derived part in the reading order.
3. `fieldCopy.ts`: the labels, the per-column sum lines, the two totals, the new reasons, `cashflowReasonText`.
4. `YearTable.tsx` the columns and the totals paragraph; `FundTable.tsx` loses the flat column and reads the
   pre-tax figure; `PlanCalculator.tsx` passes the `TaxState`.
5. Rewrite the tests named above; run the existing ones as AC6's control case.

### Alignment with UX

UX design is needed: the column order AC2 names is the UX design's, the dash-with-reason cells and the two
totals are read by header text, and the copy that says the flat columns are depot parts paid in other years and that
the parked column is the money already there at the start of the year is UX's wording. The architect's part is the
arithmetic and the derivation order; the two must agree on which cells are addends of the year's cash total and
which are depot parts, and on the wording of the parked column, which is the year table's `Betrag für das Jahr`
column today and keeps that label unless hak renames it.

## Implementation notes

_developer: what was built, deviations from the design and why._

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s) | Result |
| --- | ------- | ------ |

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

## Explanation

_orchestrator: plain-language explanation shown at gate 2, at most 15 lines of at most 120 characters. No code, no
file names._

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates), proposed changes to
agents/CLAUDE.md/templates, and which ones hak approved. Include a `### Cost` table (see the retro step of
`/feature`)._
