---
id: 047
title: The cashflows of a phase year, one figure each, in the year table
status: in-review # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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
status: in-test # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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

**The derived part, named per identity** (the money rule allows one derived part per base):

- the tax identity: the last part **with a figure** in the reading order is derived from the row's tax total — the
  Kirchensteuer while its checkbox is on, and the Solzzuschlag when the church tax is a dash, because a dash has no
  figure to derive. The Solzzuschlag is never derived from its own base (its base is the KSt), and the tax on the
  interest is one figure, not a part (answer 11), so it is not a candidate;
- the depot identity: the last flat figure in the reading order is derived from the shown depot;
- `payout = parked + netInterest`: **no derived part**, because `P·m` is a whole
  number of Cent (no rounding can absorb a difference) and `parked` is the single
  rounding the fund table already uses. The tester reports a row where `parked + net`
  does not add to `P·m` as the rounding coupling, not as the rule. The exception is the
  last funded year: `displayYearCents` derives that row's `parked` from `plan.totalCents`
  (`phase.ts` `287`–`292`), so there `parked` is a derived part and `taxTotal + payout`
  can differ from `cashTotalCents` by one Cent. The tester's row 2033 is that case
  (`118.837` against its own rounding `118.836`), and the reviewer's own run prints it as
  tax `116`, payout `3755`, parked `3754`, cash `3870`. Over `1000` random states the
  reviewer's run read `taxTotal + payout` not equal to `cashTotalCents` on `67` of the
  `470` rows that have a cash total, every difference exactly one Cent. So the identity
  holds on the unrounded values and not on the shown figures; the copy line `payoutCheck`
  (`fieldCopy.ts` `270`) cannot state it as an equality, only as which figures the reader
  adds. Whether the reader line promises the equality is hak's to say, and it is an open
  point for gate 2.

The tester therefore pins the row where the shown figures the reader adds equal the cash total, and
where the derived flat part differs from its own rounding (`purchase.test.ts` `211` and
`393`–`397`), and pins the same row's `parked + net = P·m` from its own arithmetic (AC3) on the
unrounded values, not as an equality of the two shown readings (the exception above).

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

The money rule runs **two** derivations, one per base, and the design names both bases:

1. **Depot parts** (045 AC5, read across two tables now): the fund table's purchase parts row by
   row, then the year table's flat figures row by row (column A before column B), then the year
   section's line for a fund whose sale year is not a phase year. Each base owns its own figure:
   the **shown depot** owns the last part with a figure in that whole order
   (`cashflow.ts` `476`–`482`), and a **fund's own part** (that fund's figure, rounded once) owns
   the last piece inside that fund when its figure is split across cells
   (`cashflow.ts` `462`–`475`). When a fund's last piece is not also the last part in the whole
   order, both derivations run on two different figures, and the money rule as 032 AC2 words it
   allows one derived part per total. Whether the rule may run both is hak's to say: this is an
   open point for gate 2, not a code change. On the reviewer's run of the real modules the two
   never disagreed: `2880` cases (one depot fund), `22000` cases (three depot funds, flat `1`–`500`
   hundredths, monthly `9000`–`15000` Cent), and `1000` random states where `341` rows had two or
   more pieces and all `341` added to the shown depot. So the risk is a rule question, not a
   reachable state. In `purchase.test.ts` the fund-level piece cannot move (its own rounding is
   also `115`), and the part that moves is fund 2030's line, `76` against `77`.
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

| File                                                  | Pin                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `flat.test.ts` `70`, `93`                             | `590800` µ€ (the base `2,24 €` at `224` bp, tax `26,375 %`)                                                                                                                                                                                                                                                                                 |
| `flat.test.ts` `109`, `110`, `125`                    | `1211140` = `0,5908 €` + `0,62034 €`; `4153278.335913`; `112,80 €`                                                                                                                                                                                                                                                                          |
| `flat.test.ts` `24`, `51`                             | the base `1,12 €` → `295.400` µ€, the cap does not bind                                                                                                                                                                                                                                                                                     |
| `purchase.test.ts` `162`–`219`                        | parts `108054` / `103184` / `97774` Cent stay. The flat group in the reading order is `110` + `32` + `115` + `76` = `333` (the depot `309345`), `flatPartsSum` `333` stays. The round-1 pins `77` / `110` / `146` are the reading _before_ this story: `146` never appears and `77` reads as `76`, so they are not oracles after the change |
| `purchase.test.ts` `211`, `393`–`397`                 | the parts the rule can move: fund 2030's line `76` against its own rounding `77`; at `asOf` 2026-12-31 the fund-level derived piece is `115` against its own rounding `116`                                                                                                                                                                 |
| `projection.test.ts` `84`, `93`                       | `45,96 €` for the fixture row 2030 at `25 %`, on the test's own `FLAT_BASE`                                                                                                                                                                                                                                                                 |
| `deposit.test.ts` `77`                                | `11,9640625 €`                                                                                                                                                                                                                                                                                                                              |
| `phase.test.ts` `211`–`219`, `224`–`236`, `241`–`252` | `F = 89,089035488581`, `K = 1,206414022241`, `878.826,214663 Cent`; `1.804,98 €`; `76,698488 + 109,693335 + 147,354370 = 333,842117 Cent`, `-1,095384` → `-0,01 €`                                                                                                                                                                          |
| `tax.ts` `13`, `16`, `27`–`42`, `45`                  | `KST_MILLIONTHS 250000`, `SOLZ_ON_KST_MILLIONTHS 13750` (5,5 % of the KSt), `8` for Bayern and Baden-Württemberg, `9` elsewhere, `DEFAULT_BUNDESLAND 'bayern'`                                                                                                                                                                              |
| `fieldCopy.ts` `289`                                  | `Steuer nicht angehakt`                                                                                                                                                                                                                                                                                                                     |

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

AC3's row where the derived part differs from its own rounding is the shape `purchase.test.ts` `211` already
pins for the depot: fund 2030's line is `76` against its own rounding `77`. At `asOf` 2026-12-31
(`purchase.test.ts` `393`–`397`) fund 2032's own figure rounds to `147` Cent, so its last piece (`115`, column A
of its own row) is derived from that fund's own part and differs from its own rounding `116`. For the tax parts
the base `B` read in Cent gives `0,25 B`, `0,01375 B` and `0,02 B` against the total `0,28375 B`, so
`B = 315,53634` gives `78,884085` → `79`, `4,333125` → `4` and `6,310727` → `6`: their own roundings add to `89`
against the total's `89,528745` → `90`, so the Kirchensteuer is the derived part and reads `7` Cent. The
Solzzuschlag cannot be the derived part, because its base is the KSt, and the tax on the deposit interest is one
figure, not a part (answer 11). After this story the flat figures read across the year table's two flat columns
and add to `333` Cent as `110 + 32 + 115 + 76`; the pre-change group `77 + 110 + 146` is not an oracle any more.

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
- The reader lines: `readerLine` names which figures the reader adds, and `payoutCheck`
  (`fieldCopy.ts` `270`) cannot state `payout + tax` as the same money as the cash total, because
  on the last funded year the two readings can differ by one Cent (the exception named above).
  `netNote` states the net as the difference of the interest cell and its tax column. Whether
  `payoutCheck` promises the equality is hak's to say.
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

| AC  | Test                                                                                                                                                                                                                                                                                                                     | Level          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| AC1 | one `apps/laz/e2e/laz.spec.ts` spec: the fund table read by header text (no tax cell), the fund row's projection figure read as a hand value (the pre-tax figure, not the taxed payout of 024 AC4), the fund section without a tax sum line; the pinned column list is updated inside the same spec                      | e2e            |
| AC2 | one `laz.spec.ts` spec: one row read column by column by header text, the nine cashflow columns in AC2's order                                                                                                                                                                                                           | e2e            |
| AC3 | unit: `cashflow.test.ts` `259`, `276`, `294` — the flat identity, column A of a fund's row plus column B of the earlier rows equals that fund's figure, read through `flatYearMicroEur` from a hand oracle. No e2e can read this, because `flatYearMicroEur` is not shown in the UI                                      | unit           |
| AC3 | e2e: `laz.spec.ts` `1354` — the row's cells added by hand equal the year section's tax total and cash total, each column sum line equals the figures shown in that column, one row where the derived part differs from its own rounding (so the rule can move), plus the N = 1 row, where the first row is also the last | e2e            |
| AC4 | one `laz.spec.ts` spec: each dash read as the full line text of its cell, one row that shows a figure in one column and a dash with another reason in another                                                                                                                                                            | e2e            |
| AC5 | one unit test `cashflow.test.ts` for the split on the same base (the base factor and the three parts from one hand oracle, not from the module under test); the copy strings and the reason map in `fieldCopy.test.ts`, which AC5 names as the copy test                                                                 | unit           |
| AC6 | unit: `cashflow.test.ts` `333`, `359` — `proceeds = shares × the fund table's figure`, and the tax parts plus the parked money, read from a hand oracle on unrounded values                                                                                                                                              | unit           |
| AC6 | e2e: the existing tests of 024, 032, 033, 035, 045 and 046 re-run as the control case at their existing levels, and the same equality read inside AC1's spec as what the cell shows                                                                                                                                      | e2e (existing) |
| AC7 | no test of its own; it is satisfied by the rewritten tests below, each figure asserted once where its rule lives and once as what the cell shows                                                                                                                                                                         | —              |

AC3 and AC6 are read at two levels, because one of their readings cannot be seen in the UI: the
flat identity is read at unit level through `flatYearMicroEur`, which the app never shows, while
the sum lines and the two totals are read in the browser. The tester's mapping already separates
the two readings (its round 2 records this), so no test change is asked for; the table only states
the level each reading lives at.

AC4's case "a phase year without phase months" cannot be reached: `phaseYears` only yields years with at least
one phase month, so `monthsInYear` never returns 0 for a row. No reason string and no test are written for it;
the tester records it as checked, OK, and the AC is read as the cases the app can produce.

### Tests that must be rewritten, not deleted

| Place                                                                                                                            | What it asserts today                                                                                                                                                                                     | What it asserts after                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/laz.spec.ts` 716–728 (036 AC1)                                                                                              | the fund table's pinned column list, flat column included                                                                                                                                                 | the same list without the flat column                                                                                                                                                                                                                                                                                                                                                                                                        |
| `e2e/laz.spec.ts` 809, 821, 827 (045 AC1)                                                                                        | the flat field and that no flat figure appears outside the tax case                                                                                                                                       | the same field; the figure is read in the year table                                                                                                                                                                                                                                                                                                                                                                                         |
| `e2e/laz.spec.ts` 846, 851–857 (045 AC4)                                                                                         | the fund table's flat cell and the fund section's sum line                                                                                                                                                | the same figure in the year table's column A and its own sum line                                                                                                                                                                                                                                                                                                                                                                            |
| `e2e/laz.spec.ts` 900, 910, 918, 921 (045 AC5)                                                                                   | `flatPartsSum` and the depot parts in one table                                                                                                                                                           | the parts read across two tables, the last part derived                                                                                                                                                                                                                                                                                                                                                                                      |
| `e2e/laz.spec.ts` 1038–1045, 1059–1064 (046 AC4)                                                                                 | the year table's header list and its sum line                                                                                                                                                             | the extended header list, per-column sum lines                                                                                                                                                                                                                                                                                                                                                                                               |
| `fieldCopy.test.ts` 251–258, 265–268                                                                                             | the two parking labels, `parkSumLine`, the reason maps                                                                                                                                                    | the labels stay, `columnSumLine` replaces the one sum line, the reason map gains the new reasons                                                                                                                                                                                                                                                                                                                                             |
| `purchase.test.ts` `162`–`219`                                                                                                   | `displayFundParts` with a flat group (`108054`/`103184`/`97774` Cent plus the flat group `77`/`110`/`146`, where `146` is the derived part and its own rounding would be `147`), and `flatPartsSum` `333` | `displayFundParts` without the flat group (purchase parts only, same three values); the flat figures move to `cashflow.ts` and read as `110` + `32` + `115` + `76` = `333` in the reading order, the last derived from the shown depot; `146` never appears and `77` reads as `76`; `flatPartsSum` moves with the same value `333`. Asserted at unit level, because `flatYearMicroEur` is not shown in the UI and no e2e can read the pieces |
| `projection.test.ts` `84`/`93`                                                                                                   | the fund table's figure `45,96 €` for the fixture row 2030, tax on at 25 %, read through `payoutPerShareMicroEur` with the test's own `FLAT_BASE`                                                         | the fund table's cell now shows the pre-tax figure (`preTaxPerShareMicroEur`), so this test pins that value as its own hand value; the tax `1,32 €` it shows today is read in the year table's KSt column instead. The `FLAT_BASE` the test assumes is not the base `flat.ts` computes, so the two tests must not be read as oracles for each other                                                                                          |
| `flat.test.ts`, `deposit.test.ts`, `phase.test.ts`                                                                               | the per-year base, the interest and its tax, F and K                                                                                                                                                      | unchanged; `flat.ts`'s new export is read through `cashflow.test.ts`, not through a second oracle                                                                                                                                                                                                                                                                                                                                            |
| `e2e/laz.spec.ts` `106`, `125`, `139`, `392`, `691`, `700` and `phase.test.ts` `171`, `173` (024 AC2, 033 AC1, 035 AC1, 046 AC5) | the year table's `Betrag für das Jahr` cell, read by header text, as the money at the start of the year                                                                                                   | **not rewritten**: the parked cell is that column, so the same header text and the same hand values are asserted; only `1042` (046 AC4's header list) gains the new columns                                                                                                                                                                                                                                                                  |

### Risks, and what cannot be verified

1. Nothing here is a measurement: no test was run, and the plan modules cannot be imported by `node` because
   `fund.ts` imports `fund-list.json` without an import attribute. All figures above are own arithmetic; the run
   that pins F, K, `cash` and the depot is the tester's, not the architect's.
2. The row identity holds by construction, so AC3 can only be falsified through the rounding rule. Each shared
   expression needs its own hand value (see P32), otherwise a mutation moves two assertions and the tester
   reports a defect that is really the coupling.
3. Two derivation levels can claim the same figure, and the code runs both (`cashflow.ts`
   `462`–`475` and `476`–`482`). The design names both bases: the fund's own part (its single
   rounding) owns the last piece inside that fund, and the shown depot owns the last part with a
   figure in the whole reading order. When a fund's last piece is not also the last part in the
   order, two figures are derived for one total, which is more than the money rule as 032 AC2
   words it. The reviewer's runs of the real modules found no case where the two disagreed:
   `2880` cases (one depot fund), `22000` cases (three depot funds, flat `1`–`500` hundredths,
   monthly `9000`–`15000` Cent), and `1000` random states where `341` rows had two or more
   pieces and all `341` added to the shown depot. So this is a rule question, not a reachable
   state, and it goes to hak as an open point.
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

**What the table needs, from the tester's run** (the tester's measurement, not the architect's
own): a throwaway probe at 320 px and 375 px, the same figures at both widths, non-vacuity held
there — the scroller scrolls sideways, the page does not, the year column stays sticky at the
scroller's left edge, and every paragraph including the sum lines stays on screen. Min-content
`1534 / 2119 / 2743` px and the widest one-line row `2554 / 2824 / 2999` px, with two columns
visible (the sticky year column `61` px plus one). The table therefore needs `1534` px or more,
and `2119` px or more whenever a reason string is present. So the design's starting `1.200 px`
never binds at those widths, and the CSS value is the developer's to set from this measurement,
not a starting value any more. The one-line widths are not a target, because the reason cells are
meant to wrap: the row is read through the scroller, which is what AC8 asks for.

## Implementation notes

_developer: what was built, deviations from the design and why._

Run of 2026-11-16 in the worktree, on the story branch, nothing committed. The gate was run there:
`npm run typecheck`, `npm test -w @swfactory/laz`, `npm run format:check` (prettier from the repo root
reads the root `.prettierignore`, which is what excludes `scripts/fixtures`; the `--ignore-path` form is
for a workspace cwd), `node scripts/verify.mjs --mode=full --no-record`,
`npm run test:e2e -w @swfactory/laz`. No dev server was started, so `min-width` was not measured; the
value is the design's starting 1.200 px. `verify` failed on build, test, test:e2e, typecheck and
check:dist; lint, format, structure, template and pages were green, so the code I changed passes those.
Every failed step is a tester-owned test file that reads a figure this story moved.

### What was built

- `projection.ts`: `rhoFactor` (one fund's ρ, exported) and `preTaxPerShareMicroEur` (AC1).
  `payoutFactor` and `payoutPerShareMicroEur` keep the tax, so no figure of 031 moves.
- `flat.ts`: `flatYearMicroEur` is the exported caller of the internal `yearBase` (AC5, risk 8), so the
  pieces of one fund are the same expression as that fund's whole figure. `flatTaxMicroEur` is unchanged.
- `cashflow.ts` (new): the column union, the per-column first-match reason order, `cashflowRows`,
  `columnSumsCents`, `flatPartsSum` (moved from `purchase.ts`), the two totals, and the money rule read
  across both tables, with the derived part named in the reading order the design gives.
- `purchase.ts`: `PurchaseRow` loses `flatMicroEur` and `flatReason`, `FundParts` loses `flatCents`, and
  `displayFundParts` is rounding-only with one argument, because the derived part is chosen in
  `cashflow.ts` (the reading order now runs across two tables).
- `phase.ts`: `displayParkCents`, `ParkCents`, `ParkSums` and `parkSumsCents` are gone; the rows are read
  through `cashflow.ts`, which does the single rounding and the derivation.
- `fieldCopy.ts`: the thirteen labels (AC2's word `Kapitalsteuer`, decision line 232), `columnSumLine`,
  `taxTotalLine`, `cashTotalLine`, `readerLine`, `payoutCheck`, `flatNote`, `parkedNote`, `netNote`,
  `flatNoRowLine`, `cashflowReasonText`, `columnLabel`. `COPY.flatColumn`, `COPY.flatSumLine` and
  `COPY.parkSumLine` are gone. `TAX_OFF_TEXT` is the one string the three reason maps read (P32).
- `YearTable.tsx` reads `CashflowTable` and renders the thirteen columns plus the paragraph block;
  `FundTable.tsx` loses the flat column and its sum paragraph and reads `parts`; `PlanCalculator.tsx`
  passes `TaxState` to `cashflowRows` and shows the pre-tax projection, once for both sections.
- Year section paragraph order: reader line, payout check, the ten sum lines in the column order, the tax
  total, the cash total, the `flatNoRowLine` lines, flat note, net note, parked note, then 046's facts
  and the footnote. No new live region, no new tab stop, no new colour.

### Deviations from the design

1. The flat reading order is read literally (interpretation B): column A of row Y shows the fund sold in
   year Y, for the counted years that have no row of their own; column B shows the pieces for year Y of a
   fund still held in that year; a depot fund whose own year is not a phase year has no row, so the year
   section states its money once with `Auflösung in einem Jahr, das kein Phase-Jahr ist`, and that line is
   the last part of the reading order. Consequence: the flat group `77` / `110` / `146` of
   `purchase.test.ts` 141-155 moves, and `flatPartsSum` 333 stays. On the tester's own case the run gives
   76 (year section line, the derived part) + 110 (column A of row 2031) + 32 (column B of row 2031) +
   115 (column A of row 2032) = 333, so the design's claim that `77` / `110` / `146` stay cannot hold
   under its own reading order. Recorded as a conflict, not fixed.
2. `rhoFactor` is exported from `projection.ts`, because `cashflow.ts` must read the base
   `max(0, ρ − 1 − flatBaseFactor)` per AC5; the design names no export for it.
3. `cashflowRows` takes `funds` (and `asOf`), because the flat column needs the fund's NAV and YTM, which
   `PurchaseRow` does not carry. The design's signature names `purchases` only.
4. `CashflowReason` reuses `PurchaseReason` and `ParkReason`; `park-year-not-a-phase-year` is not part of
   it, because the copy names no string for it and no cell can read it.
5. `FlatFigure` carries the `years` each piece covers, so the pieces of one fund are the same expression
   as that fund's whole figure (risk 8) and AC3's identity can be read. A fund with a dash has no part,
   because `flatPartsSum` sums the figures that are shown.
6. The parked column keeps its plain dash for a phase year without a funding fund (UX item 3 of "For the
   orchestrator to resolve"), because its reason is the funding cell's line as 024 AC4 has it: that keeps
   `laz.spec.ts` 126 and 392 green. AC4's per-column order lists `kein Fonds für dieses Jahr` for that
   column, so this is a conflict for hak, not a decision of mine. A flat cell that reads no fund names
   `kein Fonds für dieses Jahr`, because no flat reason can apply without a fund and AC4 says a dash must
   name its reason.
7. `flat.test.ts` 1211140 / 295400 / 263750 / 590800 and `4153278.335913` stay, because `flatTaxMicroEur`
   was not rewritten as a sum of `flatYearMicroEur`; the two are the same expression by construction.

### Red tests, for the tester

Unit: `Test Files 3 failed | 8 passed (11)`, `Tests 7 failed | 38 passed (45)`; every failure is in a
tester-owned file. `tsc` reports the same files, so `npm run build -w @swfactory/laz` and `check:dist` fail
on them too. E2e: 56 passed, 6 failed.

- `fieldCopy.test.ts` 253, 256: `COPY.parkSumLine` is gone, `columnSumLine` replaces it; 251-268 gains the
  new reasons.
- `flat.test.ts` 88, 92, 93: reads `PurchaseRow.flatReason` and `flatMicroEur`, which the row no longer
  carries; these call sites must read through `cashflow.ts` (`flatReasonFor`, `flatYearMicroEur`,
  `FlatFigure`, `flatPartsSum`). The hand values themselves did not move.
- `purchase.test.ts` 70, 107, 140, 183, 201, 276: `displayFundParts` takes one argument now; 141, 153, 283,
  295 read `part.flatCents` and `flatPartsSum(parts)`, which left `FundParts` and `purchase.ts`. The values
  move at 73 (`329,21` -> `329,20`), 113 (`11.142,56` -> `11.142,55`) and 283 (`148` -> `147`) when the
  parts are read from `purchase.ts` alone: the derived part lives in `cashflow.ts` now. I did not change a
  hand value (P16), only the call sites moved.
- `projection.test.ts` 84, 93: still green, because `payoutPerShareMicroEur` stayed; the fund table's cell
  now shows the pre-tax figure, so the tester pins `preTaxPerShareMicroEur` as its own hand value and reads
  the `1,32 €` in the year table's KSt column.
- e2e, the six failing specs: 446 (assertion at 484, the fund table's projection cell with the tax on),
  716 (036 AC1's pinned column list), 819, 851, 910 (045 AC1, AC4, AC5: the flat column and the fund
  section's sum line), 1038 (046 AC4's header list and the per-column sum lines). All six are the places the
  design's rewrite table names. 106, 125, 126, 139, 392, 691, 700 stayed green as controls, which is what
  deviation 6 protects.

### Follow-ups

- The two copy statements (`flatNote`, `parkedNote`) and the parked column's dash-with-reason are the three
  open points for gate 2; the arithmetic does not depend on any of them.
- `min-width` needs a measurement by the tester at 320 and 375 px (the value here is the starting one).
- AC3's row where the derived part differs from its own rounding needs one e2e case: on the tester's own
  flat case the derived part is the year section's line (76 against its own rounding 77), so the rule can
  move there.

### Fix for the tester's defects

Run of 2026-11-16 in the worktree, on the story branch, nothing committed. Only
`apps/laz/src/features/plan/logic/cashflow.ts` changed. No test file was touched and no hand value
was changed (P16), so the reading order stays as deviation 1 records it (flat group 76 + 110 + 32 +
115 = 333, and `purchase.test.ts` 73, 113 and 283 read `329,20`, `11.142,55` and `147`).

The scratch spec ran outside the workspace: raw literals, no fixture helper, no vitest, no network,
no dev server, no clock and no hand-written value, because each expectation is an expression AC2,
AC3, AC4, AC5 or AC6 states, read on the data file's own `asOf` 2026-11-14. It printed `16 checks, 0
failed` and was deleted after the run.

- Defect 1 (AC3, AC5): `taxSplit` builds the total from the rate 031 applies to the same base,
  rounded once, plus the one figure of the interest tax (`rateOnBase` at 354, the total at 355). It
  added the base itself before, and the base is untaxed money, so the parts cannot add up to the total
  the section states. The reading order and the derived last part are unchanged. - Defect 2 (AC2): the
  proceeds cell is `shares · navMicroEur · ρ` (565-568), the money of the fund for the year, pre-tax.
  `fundParts` keeps `shares · NAV`, the part 032 AC2 sums in the fund table. - Defect 3 (AC4, AC6):
  outside the tax case `taxSplit` reads no part and states no total (340), so nothing is shown there
  for the row or for the section; the tax case answer still reads in every tax column. - Defect 4
  (AC4): `FlatFund` gained `inDepot` (170), which a depot fund keeps even when its cell shows no
  figure, and `flatFundFor` (514-520) resolves the fund the column reads before the figure: column A
  the depot fund sold in this year, column B a depot fund with a counted year equal to the row year
  and a fund year greater than it, then the funding fund of the row. Only a row that reads no depot
  fund at all keeps `no-funding-fund`.

What the runner printed:

- `npm test -w @swfactory/laz`: `Test Files 12 passed (12)`, `Tests 56 passed (56)`; the same run
  before the fix had `7 failed | 49 passed (56)`. - `npm test` over the whole tree: platform `154
passed (154)`, avd `100 passed (100)`, laz `56 passed (56)`, minesweeper `103 passed (103)`, landing
  `18 passed (18)`. - `npm run test:e2e -w @swfactory/laz`, port 5174 free before the run and no dev
  server started: `Running 66 tests`, `2 failed`, `64 passed (8.7s)`. - `node scripts/verify.mjs
--mode=full --no-record`, called directly because npm eats the flags: build, build:pages,
  check:structure, check:template, format:check, lint, test, test:scripts, typecheck, check:dist and
  test:pages ok, `test:e2e` FAILED (1). Its projects: avd `80 passed (10.3s)`, laz `2 failed` with `64
passed (9.5s)`, minesweeper `110 passed (50.5s)`. - `npx prettier --check
apps/laz/src/features/plan/logic/cashflow.ts`: ok.

The two assertions that stay red, for the tester to re-run. They are tester-owned oracles, so I left
them as they are:

- `e2e/laz.spec.ts` 1252, failing at 1303: expected `Summe der Steuer über die Phase-Jahre: 105,47
€.`, received `133,13 €`, which is 105,47 plus 6 × 4,61. The hand value leaves the tax on the
  interest out, while AC3 and AC5 state the total as the rate on the base plus that one figure. The
  tester's own unit oracle `cashflow.test.ts` 189 reads the same rule and is green (`taxTotalCents`
  894 is the three parts plus the tax on the interest), so the two oracles cannot hold together and
  the hand value is the one that has to be re-derived. - `e2e/laz.spec.ts` 1322, failing at 1389:
  `getByText(/Kirchensteuer/)` expected 0 and got 4: the header `Kirchensteuer in Euro` and three
  cells that read `Kirchensteuer nicht angehakt`, which AC4 requires while the church checkbox is off.
  What was meant is that the church column shows no sum line; read as written the count covers the
  header and the cells, so it cannot be green while AC4 reads.

The correction after the follow-up run, on the two sum lines of `e2e/laz.spec.ts` 1252:

- Plainly: the reading that the code counts the tax on the interest twice is wrong, so nothing
  was changed there. `cashParts` at 586 sums the three shown parts, the parked money and the
  gross interest, and the derived part at 362 keeps those parts as the rates on the base, so
  their sum is the tax of the sale without the tax on the interest. The cash total is `T + p + i`
  - the three parts, the parked money and the gross interest - and the interest tax stays inside
    the tax total only, which is the reader line the design names and what the tester's own green
    oracle `cashflow.test.ts` 190 states (120.894 = 465 + 118.804 + 1.625). My earlier claim about
    the hand value stands; no hand value was moved and no production code changed, because there
    was nothing to change.
- Reproduced from the same modules with the tester's inputs and the fixture copy, no hand value:
  the six rows give 10.547 Cent of tax parts and 2.766 Cent of tax on the interest, so the tax
  line reads 133,13 €, the printed value, while the hand value 105,47 € leaves those six figures
  out - the same test's own row hand reads the row total with that figure (960 = 499 + 461), and
  its unit oracle at 189 does too.
- The two hand values of that test cannot both be green: 105,47 € plus the six payouts of
  1.200,00 € is 730.547 Cent, while the money line the tester wrote is 733.313 Cent, which is the
  tax total with the interest taxes plus the six payouts. As the code states that line it is
  7.333,14 €, one Cent above the hand value, because row 2033 sums its own rounded figures
  (3.969 + 118.837 + 1.625 Cent) instead of its tax total plus its payout.
- For the tester to re-derive: the tax line 133,13 € and the money line 7.333,14 €. The red at
  1322, failing at 1389, stays its own rewrite, as recorded above.
- Counts as the runner printed them: `npm test -w @swfactory/laz` gives `Tests 56 passed (56)`,
  and `npm run test:e2e -w @swfactory/laz` on port 5174 gives `2 failed` with `64 passed (8.8s)`,
  the same two assertions as before.

Measured width (round 3, from the tester's probe at 320 px and at 375 px):

- `YearTable.module.css` 22 carried the design's starting value 1200 px, which no run had measured.
  The probe's content minimum is 1534 px, and 2119 px or more when a reason cell is present, so a
  floor below the measured minimum never binds at a phone width: the table is never narrower than
  its content, the scroller scrolls sideways while the page does not, and the year column stays
  sticky. The honest option I chose is to drop the rule, because a floor below the minimum cannot
  bind and a floor equal to it only repeats what the columns already force. The width is then
  carried by the columns themselves: `width: 100%` and the figure columns that stay nowrap. The
  comment above the rule names the measured number and says that the rule is gone, not a value.
- No assertion moved: no unit test or e2e spec reads `min-width` or the computed style of this
  table, so the probe stays a throwaway and `check:dist` compares the built CSS without a value of
  its own. `npx prettier --check` on the touched file: ok.
- Counts as this round's runner printed them: `node scripts/verify.mjs --mode=full --no-record`,
  called directly, -> `verify: ok, 12 step(s), 79.7 s`: build, build:pages, check:structure,
  check:template, format:check, lint, test, test:e2e, test:scripts, typecheck, check:dist and
  test:pages all ok. `npm test -w @swfactory/laz` -> `Test Files 12 passed (12)`, `Tests 57 passed
(57)`. `npm run test:e2e` per project: platform `80 passed (6.9s)`, laz `66 passed (6.0s)`,
  minesweeper `109 passed (53.1s)` with `1 flaky`, a spec of an earlier story, not edited. Findings
  1, 2 and 3 are the tester's, 4, 5 and 7 the architect's; `payoutCheck`, the two notes and the
  parked dash stay pending for hak. Status stays `in-review`, nothing committed.

## Test report

_tester: AC -> test mapping, results, defects found._

Run of 2026-11-16 in the worktree, on the story branch, nothing committed. Every number below
is the tester's own arithmetic (the scratch oracle `oracle047.py`, run outside the workspace,
no test file left in the tree), read through the app's helpers `euro()`, `yearRegion`,
`cellByHeader` and `rowByHeader`. No expectation was taken from the module under test and no
assertion was weakened. The four defects of the previous report read green after the
developer's fix, so this run restates the mapping, re-derives the two hand values the tester
had wrong, and records what the runner printed.

- AC1: `e2e/laz.spec.ts:1178` - the fund table without a tax figure, the fund row's pre-tax
  figure, no fund-section tax line. PASS.
- AC2: `e2e/laz.spec.ts:1254` - one row read column by column in AC2's order, thirteen
  headers, plus `fieldCopy.test.ts:318`. PASS.
- AC3: `e2e/laz.spec.ts:1354`, `cashflow.test.ts:259`, `:276`, `:294`. PASS.
- AC4: `e2e/laz.spec.ts:1445`, `cashflow.test.ts:193`, `fieldCopy.test.ts:292`. The phase year
  without phase months: checked, OK, `phaseYears` never yields one, so no test. PASS.
- AC5: `cashflow.test.ts:113`, `:144`, `:167`, `purchase.test.ts:306`. PASS.
- AC6: `cashflow.test.ts:333`, `:359`; the controls that must not move read green in their new
  place: `flat.test.ts:49/103`, `purchase.test.ts:80/131/162/222/262/356/413`,
  `deposit.test.ts:36/68`, `phase.test.ts`, `tax.test.ts:58/73`, `projection.test.ts:29/59`,
  and the e2e specs `046 AC1` (`993`), `045 AC1/AC4/AC5` (`811/877/936`), `046 AC4` (`1069`),
  `032` (`539/584/635`), `024 AC2` (`49`), `033 AC1/AC3` (`359/407`), `035 AC1` (`703`), `031
AC1/AC2` (`446`). PASS.
- AC7: the rewritten tests assert the same figure in its new place, all read by header text:
  `036` (`736`), `045` (`877/936`), `046` (`1069`), `032` (`539/584/635`), `024` (`49`), `035`
  (`703`). PASS.

### The two sum lines of `e2e/laz.spec.ts:1254`, re-derived

Hand case: phase 01.2028-12.2033, monthly 100,00 € = 10.000 Cent, flat 224 hundredths, parking
on at 250 hundredths, KSt on, church on (Bayern, 8 % of the KSt). The tester's own oracle
reproduces every figure the app shows on these six rows: row 2028 has the base 1.758,78 Cent,
the parts 440 / 24 / 35, the gross interest 1.625 Cent and its tax 461 Cent.

- Tax line `133,13 €`: the figures shown add to 9.293 + 510 + 744 = 10.547 Cent, and the six
  interest taxes add to 2.766 Cent, so the line is 13.313 Cent. The earlier hand value `105,47
€` left the interest tax out, while AC5 states the row total as the rate on the base plus
  that one figure, and the same spec's own row hand (960 = 499 + 461) and the tester's green
  oracle `cashflow.test.ts:167` read it inside the total. The two could not both be green; the
  hand value was the one wrong, and the developer's counter-argument stands.
- Money line `7.333,14 €`: the addends are the shown tax parts, the shown year-amount figure
  and the gross interest. The last part of the reading order is derived from its total, and
  here that is the year-amount figure of row 2033: the column's unrounded total is
  713.016,5625 Cent, which rounds to 713.017, so the shown figures are 118.836 five times and
  118.837 once. The sum of the figures shown is 10.547 + 713.017 + 9.750 = 733.314 Cent =
  `7.333,14 €`. The earlier hand value `7.333,13 €` summed the own roundings, which is not
  what AC3 states; the identity `tax total + P x m` holds on five of the six rows, and on row
  2033 the derived part is one Cent above its own rounding. The tester's oracle now prints the
  same line from its own arithmetic: `parked shown ... 118837`, `row cash ... 124431`, `cash
733314`.

### The church column, read as its own line

AC3's case has the church checkbox off, so the column shows no figure and the section states no
line for it: the read is `Summe Kirchensteuer in Euro` with count 0. Counting the word cannot
be green while AC4 reads, because the header and the three cells that read `Kirchensteuer nicht
angehakt` are four elements and AC4 requires them, as its own spec reads cell by cell.

In AC2's case the church line reads `7,44 €` (744 Cent), and that line is not a falsifier on
its own: on these six rows the own roundings also add to 744, because the two shifts cancel.
What pins the derived part is the two cells now read as hand values inside
`e2e/laz.spec.ts:1254` - row 2030 shows 71 Cent against its own rounding 70, row 2031 shows 120
against 121 - plus `cashflow.test.ts:113` and the money line above.

### Counts as the runner printed them

`npm test -w @swfactory/laz`: `Test Files 12 passed (12)`, `Tests 56 passed (56)`. Over the
whole tree: platform `154 passed (154)`, avd `100 passed (100)`, laz `56 passed (56)`,
minesweeper `103 passed (103)`, landing `18 passed (18)`.

`npm run test:e2e -w @swfactory/laz`, port 5174 free before each run and no dev server started:
laz `66 passed (5.6s)`, and `25 passed (5.7s)` on `--project=chromium`. The full run printed
`108 passed (53.9s)` with `2 flaky`; those are in the other projects, the laz project read `66
passed` on every run, and the repeat printed `110 passed (49.7s)` with no `flaky` (story 034
rule B: outside this story). After the last edit of this step both were re-run and printed the
same: `Tests 56 passed (56)` and `25 passed (5.8s)`.

Gate state as printed by `node scripts/verify.mjs --mode=full --no-record` (12 steps, 1
failed): build, build:pages, check:structure, check:template, lint, test, test:e2e,
test:scripts, typecheck, check:dist and test:pages ok; `format:check` red on the two markdown
files this step writes (`047-laz-cashflows-in-the-year-table.md` and `docs/backlog/README.md`),
which prettier reformats after this step. `flat.ts` came out of the mutation runs with CRLF
endings and is LF again with no content change, so prettier reads it ok.

Typecheck is green on my own file after the church cells were typed as `Array<[string, string]>`,
because the pair of hand values is otherwise read as `string[]` and the cell names get lost.

### Mutation checks

Baseline for the laz workspace: `Tests 56 passed (56)`, 0 failed. Three runs per rule, the
count that repeats is recorded, and each file prints byte-identical to the backup taken before
the run (backups kept outside the repository). The first run crashed before it restored, so the
whole-month file was recovered from git and every count below was re-taken on the clean file.

- whole-month rule: `flat.ts:62` `12 - (parts.month - 1)` -> `12` -> **1 failed**, `flat.test.ts`.
  The crashed first run printed `56 passed (56)`, 0 failed, on the mutated file; that reading is
  not counted, the count above is the clean re-run.
- the cap: `flat.ts:76` the `Math.min(cap, ...)` taken away -> **15 failed**, `flat`,
  `cashflow`, `phase`, `purchase`.
- the sign guard: `flat.ts:76` `Math.max(0, increase)` -> `increase` -> **1 failed**,
  `flat.test.ts`.
- monthSum: `deposit.ts:31` `/ 24` -> `/ 26` -> **5 failed**, `deposit`, `phase`, `purchase`.
- one rounding per figure: `format.ts:20` `Math.round` -> `Math.trunc` -> **10 failed**,
  `cashflow`, `purchase`.
- derived part within a fund: `cashflow.ts:474` the derivation disabled -> **4 failed**,
  `cashflow`, `purchase`.
- derived last part in the reading order: `cashflow.ts:481` the derivation disabled -> **5
  failed**, `cashflow`, `purchase`.
- the rates of 031: `tax.ts:13` `250_000` -> `240_000` -> **12 failed**, `tax`, `deposit`,
  `cashflow`, `purchase`.
- the copy the cells read: `fieldCopy.ts:313` `TAX_OFF_TEXT` changed -> **2 failed**,
  `fieldCopy.test.ts`.
- monthsInYear: `phase.ts:77` `12 - start.month + 1` -> `12 - start.month` -> **12 failed**,
  `phase`, `purchase`.

### Limits, not defects

- `cashflow.ts:491`'s `max(0, ...)` prints 0 failed, the same as the baseline, when mutated
  by itself, because `flatBaseFactor` is at most `rho - 1` in every state the design can
  reach: the negative branch is dead code and its assertion cannot fail. The hand case that
  reads the guard is the zero-gain row of `cashflow.test.ts`, falsifiable through the gain,
  not through the guard.
- The church column's sum line in AC2's case cannot tell the derived reading from its own
  rounding, because the two shifts cancel on these six rows; the two row cells in the same
  spec are the falsifier (recorded above).
- `payout = parked + netInterest` has no derived part, so the payout cell and the year-
  amount cell are two numbers from the same `monthSum` on different bases: that is the
  coupling AC5 names, not a defect. Row 2033 shows it, one Cent, and AC3's money line reads it
  as the sum of the figures shown.
- The flat group reads as the design's interpretation B, so the pinned `77 / 110 / 146` of
  `purchase.test.ts` moved to `76 + 110 + 32 + 115 = 333` (the developer's deviation 1,
  recorded as a conflict for gate 2). The tester's own case confirms the identity from its own
  arithmetic: the pieces of fund 2032 add to 147 Cent and the shown parts add to the depot
  `309.345` Cent (corrected in round 2, review finding 3: `309.317` was not a figure the run
  printed; `purchase.test.ts:170` and the assertion at `:218` state `309.345`).

Verdict: PASS - no defect found in this run. The two hand values were the tester's own error
and are re-derived, the church assertion is rewritten as AC3 states it, and all seven ACs read
green. Status `in-review`, set in the same run as the index row.

### Round 2 (2026-11-16): the three findings the tester owns

Run in the worktree on the story branch, nothing committed, status stays `in-review`. Findings
4 and 5 are the architect's. The mapping above already separates the two readings: the flat
identity is read at unit level (`cashflow.test.ts`, the hand base through `flatYearMicroEur`)
and the sum lines at e2e level (`e2e/laz.spec.ts:1354`), which is what the design table must
say; no e2e can read `flatYearMicroEur` because it is not shown in the UI.

**Finding 1 (major), `purchase.test.ts:174`.** Corrected, and the runner agrees with the
reviewer. The comment now states 115 and names fund 2030's line as the part that moves. My own
oracle, run outside the workspace and not left in the tree, gives the own roundings 77 / 110 /
147 Cent for funds 2030, 2031 and 2032, and fund 2032's column A piece as 115,40532835 Cent ->
115, so there the derived value and its own rounding are the same number and that line cannot
move. The part that moves is fund 2030's line: 309.345 - 309.269 = 76 against its own rounding 77. The runner shows this: the within-fund mutant moves `cashflow.test.ts:269`, `:282`, `:301`
and `purchase.test.ts:393` (the case at asOf 2026-12-31, where the own rounding is 116) and
does not move the hand case here; the depot-level rule moves it, at `purchase.test.ts:207`.

**Finding 2 (major), the battery.** Re-run inside a `finally`, three runs per rule, the file
written back from the backup taken before the run, backups kept outside the repository
(`Temp/opencode/mut047/backups`), byte-identity asserted against that backup, and the failing
assertion's file and line printed. Baseline `Tests 57 passed (57)`. Every run below printed
byte-identical.

- whole-month rule `flat.ts:62` -> 1 failed, `flat.test.ts:60`.
- the cap `flat.ts:76` -> 16 failed, first lines `cashflow.test.ts:132/160/187/264`.
- the sign guard `flat.ts:76` -> 2 failed, `flat.test.ts:74` and the new case `flat.test.ts:112`.
- monthSum `deposit.ts:31` -> 5 failed, `deposit.test.ts:39/78`, `phase.test.ts:236`,
  `purchase.test.ts:324`.
- one rounding per figure `format.ts:20` -> 10 failed, `cashflow.test.ts:133/162/186/269`.
- derived part within a fund `cashflow.ts:474` -> 4 failed, `cashflow.test.ts:269/282/301`,
  `purchase.test.ts:393`.
- derived last part in the order `cashflow.ts:481` -> 5 failed, `cashflow.test.ts:282`,
  `purchase.test.ts:105/153/207`.
- the rates of 031 `tax.ts:13` -> 12 failed, `cashflow.test.ts:132/160/187/269`.
- the copy the cells read `fieldCopy.ts:313` -> 2 failed, `fieldCopy.test.ts:275/296`.
- monthsInYear `phase.ts:77` -> 12 failed, `phase.test.ts:51/106/149/168`.

Survivor list: none - every rule moved at least one assertion in every run, and nothing stayed
in the tree (`git status` shows only the two test files and this story).

Two things recorded as they happened:

1. The first shape of the within-fund mutant named `piece` outside its own scope, so that run
   crashed the file: `Test Files 2 failed | 10 passed (12)`, `Tests 2 failed | 46 passed (48)`.
   A crash is not a falsifier, so the count above is the corrected shape, written as
   `derived.cents = derived.cents` (the piece keeps its own rounding), re-run three times.
2. The guard is not a limit. The reviewer's premise holds for the data the tests read through
   the `vite.config.ts` alias: the fixture copy (asOf 2026-12-31) has 9 fund rows and the
   committed file (asOf 2026-11-14) has 9, every `ytmBp` positive, so no counted year has a
   negative increase and `Math.max(0, increase)` cannot bind on the data. It binds only in a
   case built inside the test, which is now written: `flat.test.ts:112` reads the guard through
   `flatYearMicroEur` with YTM -5 % on counted year 2025 at asOf 1.1.2025, hand value 0, plus a
   control on the same asOf (YTM 5 %, 590.800 micro-euro), so the month rule and the cap cannot
   reach it. With the guard removed the hand value becomes -131.875 micro-euro, so the guard is
   falsified. Round 1's count of 1 failed came from the hand case at `flat.test.ts:74`, not from
   a data row. A scratch copy of `logic/` is not the test environment: the unit tests read the
   fund list through the alias to `fund-list.fixture.json` (asOf 2026-12-31), and a plain
   scratch run reads the committed file (asOf 2026-11-14), which moves the hand values.

**Finding 3 (minor), story line 1253.** Corrected above to `309.345` Cent, the figure the run
prints, as `purchase.test.ts:170` and the assertion at `:218` state it.

**The measurement at 320 px and 375 px** - throwaway probe in `e2e/`, run once on port 5174 and
then deleted; nothing of it stays in the tree. Non-vacuity, checked in every state: the scroller
scrolls sideways (`scrollWidth` > `clientWidth`), the page itself never scrolls sideways, the
year column reads `position: sticky` and still sits at the scroller's left edge after the
scroller is moved 1500 px, and every paragraph of the section - the sum lines included - stays
inside the viewport (15 / 17 / 20 paragraphs, of which 7 / 9 / 12 are sum lines, all on screen).

Numbers as the probe printed them; the content width does not depend on the viewport:

- figures state (phase 01.2028-12.2033, KSt and church on, parking on at 2,50, flat 2,24, depot
  120.000,00 €): scroller client 286 px at 320 and 341 px at 375, table 1534 px, one-line row
  2554 px, two columns visible inside the scroller (the sticky year column, 61 px, plus one).
- widest reason cells (phase 01.2036-12.2038, no funding fund): client 286 / 341 px, table
  2743 px, one-line row 2999 px, two columns visible.
- one dash row (phase 01.2029-12.2029, tax on, church off, parking off): client 286 / 341 px,
  table 2119 px, one-line row 2824 px, two columns visible.

What the table actually needs: at least 1534 px, and 2119-2743 px whenever a reason string is
present. The value that would let one row be read left to right is 2554-2999 px, which is not
what UX wants, because the reason cells are meant to wrap. At 320 px and at 375 px the design's
1200 px never binds: the content already forces the table past it, so 1200 px is not the number
for these widths, and the developer has to set 1534 px or more. UX's line "about two money
columns" at 320 px reads as the year column plus one money column in these three states. The
number is reported here; the CSS stays the developer's.

Counts as the round-2 runner printed them: `npm test -w @swfactory/laz` ->
`Test Files 12 passed (12)`, `Tests 57 passed (57)`; `npm run test:e2e -w @swfactory/laz` ->
`66 passed (5.8s)`, 0 failed, no `flaky` line, port 5174 free before the run. Test files added:
none; one hand case added inside `flat.test.ts` and one comment corrected in
`purchase.test.ts`, so the count moved from 56 to 57.

Verdict for the three findings I own: PASS. The comment is corrected and agrees with the runner,
the battery re-ran inside a `finally` with its backups outside the repository and no survivor,
the guard now has a hand case that can be falsified, and the figure is corrected. Status stays
`in-review`.

### Round 3 (2026-11-16): the three nits the tester owns

Run in the worktree on the story branch, nothing committed, status stays `in-review`. Only comment
text in the two test files I own changed, no assertion was weakened and none moved. The figures
below are my own arithmetic, not a run of `flat.ts`.

**Nit 8 (settled), `flat.test.ts:109` and story 1392.** Base: fund NAV 100.000.000 micro-euro =
100 € = 10.000 Cent, asOf 1.1.2025 is the year start, so the year factor is 1 and the cap value is
0,0224 per euro = 2,24 € = 224 Cent. Hand value: YTM -5 % gives the increase 0,95 - 1 = -0,05 per
euro, the guard makes it 0, so the tax is 0. With the guard removed the base is -0,05 per euro =
-5,00 € = -500 Cent and the tax is 100.000.000 × -0,05 × 26,375 % = -1.318.750 micro-euro, which
is not 0. My round-2 figure -131,875 was the digit string of the Cent value: -131,875 Cent, and 1
Cent = 10.000 micro-euro. The slip is named: a Cent number was printed as micro-euro, so as
micro-euro the value is -1.318.750 and the digit string was ten times short. The conclusion does
not change. The control is exact in my arithmetic: 224 Cent × 26,375 % = 59,08 Cent = 590.800
micro-euro.

**Nit 9 (settled), `purchase.test.ts:173`.** My own arithmetic on fund 2032 (NAV 46.000.000
micro-euro = 4.600 Cent, YTM 4 %, asOf 1.1.2027, counted years 2027-2031, the cap binds every year
because the increase is above 2,24 %): the factor at the start of 2031 is 1,04^(1461/365) =
1,1699842727, so the base is 0,0262076477 per euro × 4.600 Cent = 120,5551795 Cent and the tax is
31,7964286 Cent -> 32. The pre-phase part is 0,0951261048 per euro × 4.600 Cent = 437,580082 Cent
= 115,4117466 Cent -> 115. The two hand figures add to 147,208175 Cent, the total the same comment
names at line 168, so the comment now adds to the total it names. Round 2's 120,542226 Cent does
not add to it, and its own product is 31,793, as the reviewer read. The reviewer's base 120,5574
Cent is not reproduced by my arithmetic, because that base gives 31,7970; its product 31,7964
matches mine, so the two readings differ only at the fourth decimal. Both round to 32, and
115,4117466 rounds to 115, so no assertion moves. The fourth decimal is the one figure here that
arithmetic cannot settle without running the module.

**Nit 10 (settled as wording, with a limit), `flat.test.ts:106`.** "The cap cannot bind either" is
true for the negative hand value only, because there the min takes the guard's 0 whatever the
positive cap is. The positive control inside the same test is a capped figure: its increase is
0,05 per euro = 5,00 €, above the cap 0,0224 per euro = 2,24 €. So the case is a falsifier of the
guard through the hand value and of the cap through its control, not of the guard alone, and the
test title now says so. The same fact made the file's header claim "YTM 5 % (the cap never binds)"
wrong, because the hand sum in that test is capped too; that comment is corrected as well. The cap
count 16 fits the reviewer's reading, 15 plus the control line, but the log prints only four refs
per run (the four it shows are `cashflow.test.ts:132/160/187/264`), so the composition of the count
is not readable there and stays the tester's word, as the reviewer recorded.

The cross-check the nits suggest does not give one number: `purchase.test.ts:173` reads fund 2032
(4.600 Cent, factor 1,1699842727 -> base 120,5551795 Cent), while the guard case reads fund 2026 at
10.000 Cent with factor 1 -> base 224 Cent. Both places use the same `yearBase` rule and its cap,
not the same base, so they cannot pin the same figure.

My comment grew, so the line numbers moved: in `purchase.test.ts` the flat figures assertion is now
213 and the money-rule sum 224 (round 2 named 207 and 218); in `flat.test.ts` the guard case is now
122 and its control 123 (round 2 named 112 and 113).

Counts as this round's runner printed them: `npm test -w @swfactory/laz` -> `Test Files 12 passed
(12)`, `Tests 57 passed (57)`, under the `> @swfactory/laz@0.1.0 test` header. `npm run test:e2e -w
@swfactory/laz` -> `Running 66 tests using 16 workers`, `66 passed (5.9s)`, no `flaky` line in the
log, port 5174 free before the run (0 connections). The per-project split `chromium` 25 and
`platform` 41 is my reading of the 66 `ok` lines, not a number the reporter printed. Nothing was
mutated in this round, so no mutation count is printed here. Prettier on the two files: unchanged.
Test files added: none, so the counts stayed 57 and 66.

Verdict for the three nits: PASS. Nits 8 and 9 are comment figures corrected by my own arithmetic
and no assertion moved; nit 10 is the wording, and the composition of its count stays a limit.
Status stays `in-review`.

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

**Round 1, reviewer 2026-11-16. Verdict: CHANGES_REQUESTED. Checklist version: 3**

| Item | Result  | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass    | AC1 `FundTable.tsx:25` + `PlanCalculator.tsx:143,155` (parts read through `cashflow.ts`, `preTaxPerShareMicroEur`) and the spec at 1178; AC2 `cashflow.ts:569-584` + `SUM_COLUMNS` + spec 1254; AC3 `taxSplit` 330-365, the two derivations 462-482, `cashTotalCents` 586-596, tests 113/144/167/193/259/276/294 + spec 1354; AC4 `cellFor` 523-559 + spec 1445; AC5 unit tests 113, 144, 167, 193 + `fieldCopy.test.ts`; AC6 `proceedsCents` 565-568 + tests 333, 359; AC7 by the rewritten tests. One exception, recorded: finding 7. |
| C2   | n.a.    | no network call or pending state in the diff                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| C3   | pass    | `YearTable.tsx` has one `useId`, no effect, no stored derived value                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| C4   | n.a.    | no render loop or imperative controller                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| C5   | n.a.    | no reducer; the logic modules read `asOf` as an argument                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| C6   | n.a.    | no error handling or I/O in the diff                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| S1   | n.a.    | no input or DOM sink touched; cells render copy strings                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| S2   | n.a.    | no config, env or auth code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| S3   | n.a.    | `package.json` dependencies unchanged                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| S4   | n.a.    | no dev-only code added                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| S5   | n.a.    | no root, template or app script touched                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| T1   | pass    | my own run: `node scripts/verify.mjs --mode=full --no-record`, 12 of 12 steps ok, 83,3 s                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| T2   | fail    | finding 5                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| T3   | pass    | hand oracles are the tester's own arithmetic, not read back from the module; no vacuous fixture. One comment states an oracle the module does not give: finding 1                                                                                                                                                                                                                                                                                                                                                                       |
| T4   | pass    | specs read cells and lines by header text, no Tab counts or coordinates, named after ACs                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| T5   | pass    | the branches (`firstMatch` per column, the two derivations, `flatFundFor`) have tests; the dead guard is recorded as a limit, not as a gap                                                                                                                                                                                                                                                                                                                                                                                              |
| K1   | fail    | findings 4 and 6; the seven deviations are recorded in Implementation notes                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| K2   | pass    | no `any`, no `!` without a comment, named exports, tests next to the code                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| K3   | pass    | tokens only; the only colour keyword is `CanvasText` in the forced-colours block                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| K4   | pass    | my own `check-structure`: ok, 3 apps, 39 stories, 67 md, 144 factory files                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| K5   | retired | retired in v2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| K6   | pass    | story `in-review`, `docs/backlog/README.md:48` `in-review`                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| K7   | pass    | the entry list is identical in all six commits that touched the story (`e638bca`, `a6fb7cd`, `92a07d0`, `069b3ec`, `c23d435`, `2e30c79`): append only and order intact                                                                                                                                                                                                                                                                                                                                                                  |
| K8   | n.a.    | nothing user-visible outside the app's own story and the index row                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| K9   | pass    | prettier green inside my own full run                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| K10  | n.a.    | no workspace script or tsconfig changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| K11  | n.a.    | no env variable                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| A1   | pass    | header cells `scope="col"`, row headers `scope="row"`, the scroller is a named focusable region                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| A2   | pass    | the reason cell is text, not colour; forced colours keep the border; the pair is the one in `tokens.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                            |
| A3   | n.a.    | no live region, no animation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| A4   | n.a.    | no canvas or render loop                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

Findings:

1. `[major] apps/laz/src/features/plan/logic/purchase.test.ts:174` - the comment says fund 2032's column A piece "own rounding would be `117`". Recomputed with the real `flat.ts` (`flatYearMicroEur` for 2027-2030, asOf 1.1.2027, tax 26,375 %, flat 224): `1.154.117,4662135893` µ€ -> `115` Cent, so the asserted `115` is its own rounding and is not a derived part. The comment claims AC3's "row where the derived part differs from its own rounding" here, and in this case the only part that moves is fund 2030's line (`76` against its own rounding `77`). Suggested fix: correct the comment to `115` and name the line as the moved part.
2. `[major] Test report, "Mutation checks", story lines 1211-1212` - the first run crashed before it restored `flat.ts` and the file was recovered from git, which P34 forbids; the counts below are re-taken on the clean file. I could not reproduce any of them: as a reviewer I may not mutate a tracked file, and a scratch copy of `logic/` is not the test environment, because the unit tests read the fund list through the `vite.config.ts` alias to `fund-list.fixture.json` (asOf 2026-12-31) and a plain scratch run reads the committed file (asOf 2026-11-14), which moves the hand values in `purchase.test.ts`. The mutation table therefore stands on the tester's word, not on my run. One count contradicts my own analysis: the sign guard at `flat.ts:76` is recorded as 1 failed, but on the data the tests read no counted year has a negative increase - 45 rows on the fixture copy and 45 on the committed file, every `ytmBp` positive - so `Math.max(0, increase)` cannot bind anywhere and that mutant prints the baseline, which is the same conclusion the story reaches for `cashflow.ts:491`. Suggested fix: re-run the battery inside a `finally` (P34), record the survivor list next to the counts, and add a hand case with a negative YTM so the guard can be falsified.
3. `[minor] story line 1253` - "the shown parts add to the depot `309.317` Cent". The parts add to `309.345` Cent, as line 170 and the assertion at `purchase.test.ts:216` state. `309.317` is not a figure the run prints. Suggested fix: correct the number.
4. `[minor] story line 880` - the design claims the flat group keeps `77`/`110`/`146`, with `146` derived. Under the design's own reading order the group is `110` + `32` + `115` + `76` = `333`, so `146` never appears and `77` becomes `76` (deviation 1 records the same conflict, and my own run of the real modules prints `110, 32, 115, 76`). The design's own line 738 says the money rule has one derived part, but lines 742-743 name two derivations, and the code runs both (`cashflow.ts:462-482`): the last piece of a fund from that fund's part, then the last part in the order from the shown depot. The design row must be corrected, and hak must say which base owns the derived part when a fund's last piece is not the last part in the order. I tested this with the real modules: 2880 cases (one depot fund) and 22000 cases (three depot funds, flat 1-500 hundredths, monthly 9000-15000 Cent) - no case where the two derivations disagree, so the risk is not reachable in the states I could build; the design's risk 3 stays a rule question, not a defect. A second run of 1000 random states on the real modules (one to three depot funds, flat 100-400 hundredths, monthly 8500-21500 Cent) left 341 cases with two or more pieces, and in 341 of them the parts added to the shown depot.
5. `[minor] T2` - AC3 is asserted at unit level (`cashflow.test.ts:259, 276, 294`) and at e2e level (`laz.spec.ts:1354`), and AC6 at unit level (333, 359) and inside AC1's spec. The design's own table names one level per AC, and its AC3 row asks for the flat identity, which no e2e can read because `flatYearMicroEur` is not shown in the UI. Suggested fix: keep the flat identity as the unit-level case, say so in the design table, and drop the duplicate level.
6. `[minor] apps/laz/src/features/plan/YearTable.module.css:22` - `min-width: 1200px` is the design's starting value and was never measured: the CSS comment says so, and the implementation notes ask for a measurement at 320 and 375 px. No run measured it, and the reviewer cannot measure it either without a dev server. This is the one checklist item that stays open at gate 2, not a defect.
7. `[nit] apps/laz/src/features/plan/fieldCopy.ts:270` - `payoutCheck` states `payout + tax` as the same money. That holds only while `parked` is its own rounding: `cashflow.ts:586-596` adds the tax parts plus `parked` plus the gross interest, and `phase.ts:287-292` derives the last funded year's `parked` from `plan.totalCents`, so on that row the two readings can differ by one Cent. The tester's own row 2033 (118.837 against its own rounding 118.836) is the case; my own run gives row 2033 as tax `116`, payout `3755`, parked `3754`, cash `3870`. The design's line 658 ("no derived part") needs the exception named, and hak must say whether the reader line promises the equality. Over the 1000 random states my own run of the real modules read, `taxTotal + payout` is not `cashTotalCents` on 67 of the 470 rows that have a cash total, and every difference is exactly one Cent, which is the case the copy line cannot state as an equality.

The dash rule (AC4) reads correct everywhere else: `cashflow.ts:523-559` returns no reason only for the parked cell of a phase year without a fund, which is deviation 6 and UX item 3, open for hak; a flat cell that reads no fund names `kein Fonds für dieses Jahr` (`cashflow.ts:534-536`), no number is invented for an empty sum (`YearTable.tsx:82-89`), and the thirteen labels are one per element (twelve in `fieldCopy.ts:237-243, 255-256` plus `columnLabel`), with `Vorabpauschale` on the field label only. The copy's `Kapitalsteuer in Euro` is the decision of 2026-11-16, `Pauschalsteuer` is the shorthand the decision allows, the two notes (`flatNote`, `parkedNote`) are pending hak's confirmation, and the German number format is `formatEuro` throughout.

My own counts: `npm test -w @swfactory/laz` -> `Test Files 12 passed (12)`, `Tests 56 passed (56)`.
`npm run test:e2e -w @swfactory/laz` -> `66 passed (6.3 s)`, 0 failed; port 5174 was busy before my run; no flaky line, so story 034 rule B was not needed (the known flakes did not occur in my run).

**Round 2, reviewer 2026-11-16. Verdict: APPROVED. Checklist version: 3**

Round 1's seven findings: 1, 2, 3, 4 and 5 closed; 6 closed as a measurement; 7 closed as
documentation, its wording still hak's. Three new nits (8, 9, 10) and one DoD item (11). Nothing
here asks for a code change.

| Item | Result  | Note                                                                          |
| ---- | ------- | ----------------------------------------------------------------------------- |
| C1   | pass    | round-1 mapping unchanged; the guard has a hand case at `flat.test.ts:112`    |
| C2   | n.a.    | no network call or pending state in the diff                                  |
| C3   | pass    | `YearTable.tsx`: one `useId`, no effect, no stored derived value              |
| C4   | n.a.    | no render loop or imperative controller                                       |
| C5   | n.a.    | no reducer; the logic modules read `asOf` as an argument                      |
| C6   | n.a.    | no error handling or I/O in the diff                                          |
| S1   | n.a.    | no input or DOM sink touched                                                  |
| S2   | n.a.    | no config, env or auth code                                                   |
| S3   | n.a.    | `package.json` dependencies unchanged                                         |
| S4   | n.a.    | no dev-only code added; the probe spec was deleted, nothing stays in the tree |
| S5   | n.a.    | no root, template or app script touched                                       |
| T1   | pass    | my own run, called directly: ok, 12 steps, 85.9 s, all green                  |
| T2   | pass    | finding 5 closed: one level named per reading, no code path twice             |
| T3   | pass    | own arithmetic, non-vacuous guard case; findings 8 and 9 are comment figures  |
| T4   | pass    | cells and lines read by header text, no Tab counts, named after ACs           |
| T5   | pass    | finding 2 closed: the guard has a falsifiable hand case                       |
| K1   | pass    | finding 4 closed: the flat row matches the reading order, deviations recorded |
| K2   | pass    | no `any`, no `!` without a comment, named exports, tests next to code         |
| K3   | pass    | tokens only; `CanvasText` is the only colour keyword                          |
| K4   | pass    | my own `check-structure`: ok, 3 apps, 39 stories, 67 md, 144 factory files    |
| K5   | retired | retired in v2                                                                 |
| K6   | pass    | story `in-review`, `docs/backlog/README.md:48` `in-review`                    |
| K7   | pass    | seven commits checked: the first eight in order, four appended, none inserted |
| K8   | fail    | finding 11: no `#047` in `CHANGELOG.md`, no 047 paragraph in the app README   |
| K9   | pass    | prettier green in my own full run; the round-1 markdown red is gone           |
| K10  | n.a.    | no workspace script or tsconfig changed                                       |
| K11  | n.a.    | no env variable                                                               |
| A1   | pass    | `scope="col"` headers, `scope="row"` row headers, named focusable scroller    |
| A2   | pass    | the reason cell is text, not colour; forced colours keep the border           |
| A3   | n.a.    | no live region, no animation                                                  |
| A4   | n.a.    | no render loop or canvas                                                      |

Findings:

1. Closed, and my own run of the real modules agrees: the comment at `purchase.test.ts:174`
   states `115` and names fund 2030's line as the part that moves. My run gives the whole funds
   as `76,698488` / `109,573624` / `147,208175` Cent with own roundings `77` / `110` / `147`,
   and fund 2032's pre-phase piece as `115,41174662135893` Cent -> `115`, so there the derived
   value is its own rounding and cannot move; the part that moves is fund 2030's line, `76`
   against `77`. In the order the two tables read, the own roundings are `110, 32, 115, 77` and
   the derived last part is `76`.
2. Closed as a record, with one limit. The `finally` cannot be read: the runner was a scratch
   script and nothing of it stays in the tree. From the log I read (`Temp/opencode/mut047/log.txt`,
   169 lines): ten mutants, `byte-identical=True` after every run against the backup outside the
   repository, a survivor header that reads `none`, and the guard case failing at `flat.test.ts:74`
   and `:112`. The counts I can read there match the story: 1, 16, 2, 5, 10, 4, 5, 12, 2, 12, and
   the crashed shape `Tests 2 failed | 46 passed (48)` is recorded as an incident, not as a count.
   The log prints four refs per run, so a count's composition is not readable there, and as a
   reviewer I may not mutate a tracked file: the battery stays the tester's word.
3. Closed. Story 1332 reads `309.345`, as `purchase.test.ts:170` and the assertion at `:218` state.
4. Closed as a documentation fix: the flat row (816) and deviation 1 (1035-1041) now agree with the
   design's own reading order as `110` + `32` + `115` + `76` = `333`, `146` no longer appears, `77`
   reads `76`, the old pins are named as no longer an oracle, and both derivations name their base
   (932-941). The counts 2880 / 22000 / 1000 stand as a rule question for hak at gate 2: which base
   owns the derived part when a fund's last piece is not the last part in the order.
5. Closed. The table splits AC3 into the unit reading (`flatYearMicroEur`, which the app never
   shows) and the e2e reading of the sum lines, and AC6 into unit plus the existing e2e controls, so
   each reading lives at the one level where it can be read.
6. Closed as a measurement, so the item is no longer open. The rule is gone, so no unmeasured
   number is in the CSS, and the comment names the values the probe printed (1534 px, and 2119 px or
   more with a reason cell). I could not reproduce the probe, because the desktop browser is not
   connected, so those numbers stay the tester's word. No unit test or e2e reads `min-width` or the
   computed style, so nothing asserts a value the code no longer carries, and `check:dist` compares
   the built CSS without a value of its own. Dropping the rule rather than retyping a number is
   defensible: a floor below the content minimum cannot bind. Still open for hak: UX's line "about
   two money columns" at 320 px, which the tester reads as the year column plus one money column in
   its three states.
7. Closed as documentation: the exception is named at 660-677, and ADR 0017 (58-63) states the
   equality holds on the unrounded values and not on the shown figures, which is what `payoutCheck`
   cannot promise. Still open for hak: whether the reader line promises the equality, and the two
   notes `flatNote` and `parkedNote`.
8. `[nit] flat.test.ts:109` and the same figure in the tester's round 2 at story 1392. My run of the
   real `flat.ts` with the guard removed gives `-1,318,750` micro-euro, not `-131.875`: the digits
   `131.875` are the Cent value, so as micro-euro the figure is ten times too small. The conclusion
   does not change - the value is not zero - and the control's `590.800` micro-euro is exact in my
   run.
9. `[nit] purchase.test.ts:173`: the hand base `120,542226` Cent does not reproduce under the real
   modules, which give `120,557,4` Cent -> `31,7964`, and the comment's own product is `31,793`, not
   `31,7926`. Its two hand figures also do not add to the total the same comment states: `31,7926` +
   `115,41174662135893` = `147,2043` against the `147,208175` Cent at line 168. Both readings round
   to `32`, so no assertion moves; a hand comment must still add to the total it names.
10. `[nit] flat.test.ts:106`, wording. "The cap cannot bind either" is true for the negative hand
    value, but the positive control inside the same test is a capped figure: the year's increase is
    `5,00 €`, above the `2,24 €` base, so this case is also a cap falsifier through its control.
    That is the only reading that fits the cap count moving from 15 to 16 between the rounds, the
    added one being the control line at `flat.test.ts:113`; the log shows four refs per run, so the
    composition stays the tester's word.
11. `[nit]` The Definition of Done: `CHANGELOG.md` has no `#047` entry and `apps/laz/README.md` has
    no paragraph for 047, while 044, 045 and 046 each have one, and the Test report carries no CI
    run id. Both are steps after the review - the docs step and the orchestrator's CI run of the
    story branch - so K8 is recorded as `fail` here as an open item, not as a defect. Status stays
    `in-review`, and the reviewer does not edit front matter.

My own counts for round 2: `node scripts/verify.mjs --mode=full --no-record` called directly ->
`verify: ok, 12 step(s), 85.9 s`, all twelve steps ok, `format:check` among them.
`node scripts/check-structure.mjs` -> ok, 3 apps (avd, laz, minesweeper), 39 stories, 67 markdown
files, 144 factory files. `npm test -w @swfactory/laz` -> `Test Files 12 passed (12)`,
`Tests 57 passed (57)`. `npm run test:e2e -w @swfactory/laz` on port 5174 -> `66 passed (6.2s)`,
0 failed, no `flaky` line, so story 034 rule B was not needed (the known flakes did not occur).
Port 5174 showed 132 connection entries before that run, left over from my own full run, and the
run was green. The tree was clean at `454746b` before this section, and I changed nothing but it.

## Explanation

_the section hak reads at gate 2, at most 15 lines of at most 120 characters. No code, no file
names._

A phase year's money reads as one figure per cashflow, each in its own column, so a row can be read by hand.
The tax figures leave the fund table; it keeps the pre-tax proceeds per share, and the tax reads in the year table.
The sale tax is three figures: the capital tax, the surcharge on it, and the church tax on the capital tax.
The flat rate has two columns, the years before the phase and the phase year; a fund's payment reads on its sale year.
The monthly payout is the gross amount, the parked money is its own column, the interest is gross, its tax one figure.
Each column keeps its own sum line, and the year section states the tax total and the cash total once.
A tax that exists as a rate but does not apply is a dash with its reason, not a zero, and each column names its own.
Hand example, the tester's own arithmetic: tax total 133,13 €, cash total 7.333,14 €, on the six rows of the fixture.
The row identity: the pre-tax proceeds minus the tax parts equal the shares times the figure in the fund table.
With the tax or the parking option off, the control figures of stories 024, 032, 035, 045 and 046 do not move.
The width floor is gone: the measured content minimum is 1534 px, so a floor below it never binds at a phone width.
Review round 2 approved; the three nits about hand figures were settled by the tester's own arithmetic, nothing moved.
Open for hak at gate 2: the copy statements, the derived part across two tables, the reader line, the parked dash.
The Definition of Done still needs the CI run of the branch, and the branch is not pushed without hak's decision.
Gate 2 is not granted yet.

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates), proposed
changes to agents/CLAUDE.md/templates, and which ones hak approved. Include a `### Cost` table
(see the retro step of `/feature`)._

The runs were one at a time, in the order product-owner, ux-designer, architect, developer,
tester, reviewer, tech writer. The model of every role run is `inherit (strata/iq2_xs)`. Gate 1
(the story as written and hak's answers at the gate) is recorded above and committed as `e638bca`.
Review round 1 is CHANGES_REQUESTED, round 2 APPROVED. Gate 2 is not granted yet, so nothing is
pushed or merged.

### What went wrong

1. The design claimed the flat group keeps `77`/`110`/`146`, while its own reading order gives
   `110` + `32` + `115` + `76` = `333`, so `146` never appears and `77` reads as `76`. The developer
   implemented the order and recorded the conflict rather than bending the order to keep a pin; the
   architect corrected the design row and named the old pins as no longer oracles (`721dea3`). Which
   base owns the derived part is a rule question for hak: no case disagreed in 2880, 22000 and 1000
   states, so it is not a reachable state.

2. The developer's first defect-fix run ended with an error before its reply, so nothing it
   printed after that is a result; the same work was done in a second run of the role.

3. The developer credited two red assertions to the tester's hand values. For the cash total that
   claim was wrong: the derived part already keeps the interest tax out of the cash total, so the
   identity holds and nothing was changed. For the tax sum line it was right, and the tester's own
   re-derivation settled both numbers in the code's favour (`133,13 €`, `7.333,14 €`); its first
   numbers (`105,47 €`, `7.333,13 €`) were its own error.

4. The tester's first mutation run crashed before restoring `flat.ts` and recovered the pre-run
   state from git, which P34 forbids. The battery was re-run inside a `finally`, with the backup
   outside the repository and the byte-identity asserted against the pre-run backup; the counts stand
   from that run and the crashed shape is recorded as an incident, not as a pass.

5. One shape of the within-fund mutant named a variable outside its scope and crashed the test
   file, which is not a falsifier; the count in the report is the corrected shape, re-run three
   times.

6. The reviewer could not reproduce the mutation battery or the width measurement: as a reviewer
   it may not mutate a tracked file, and no browser was connected to it. Both stand as the tester's
   word, recorded as limits. The log prints four refs per run, so the composition of a count cannot
   be read from it, and a `finally` in a scratch script left no code to read.

7. Three nits were the tester's own hand figures: a Cent digit string quoted as micro-euro, ten
   times short (`-131,875` against `-1.318.750`); a hand base that does not add to the total its own
   comment names; and a header that says a rule cannot bind on a number that rule caps. All three
   were settled by its own arithmetic in round 3 and no assertion moved (`238a1ed`). The guard case
   is a falsifier of the guard through its hand value and of the cap through its control, so it
   cannot be called a falsifier of one rule alone.

8. Prettier does not reflow markdown prose with this repo's config, so it only re-pads tables. The
   100-character habit is a writing convention and not a check: this story has 379 prose lines over
   100 characters, and stories 045 and 046 have more. It is reported, not fixed retroactively, and
   whether it becomes a rule is hak's to say.

9. Three commit messages of this story (`c23d435`, `460c4fe`, `2e30c79`) lost their paragraph
   breaks because an early rewrap script dropped blank lines. History was not rewritten; it stands as
   recorded.

10. The question tool is denied in this session, because hak does not answer questions during a
    run, so the gate 2 questions could not be asked in the run. They are recorded in the story as open
    items and put to hak in one message at the gate.

11. The tech writer has no shell tool, so it cannot run prettier; its two files were formatted by
    the orchestrator. One sentence it wrote said the fund table's per-share figure and the year
    table's proceeds are the same number, which is wrong, because the year table's cell is that figure
    times the shares; it is corrected in `81e296a`.

12. Review item K8 is open for the Definition of Done: `CHANGELOG.md` and the app README now have
    their 047 entries (`81e296a`), and the CI run of the story branch with its run id is still
    missing, because the branch is not pushed without hak's decision.

### Proposed rules, pending hak's approval

P32 to P42 are approved as of story 046; P37 was rejected and its number is not given to another
rule. P43 and P44 are open as the ux-designer's suggestions from this story, recorded at gate 1,
and no other rule takes these numbers.

- **P43 (for `CLAUDE.md`):** the sums of a table wider than the viewport live as paragraphs
  outside the scrolling wrapper, not inside it.
- **P44 (for `CLAUDE.md`):** a table with more than about ten columns needs one line below it that
  names the columns the reader adds.

The suggestions below are candidates after P43 and P44, and they are not numbered until hak
decides.

- Tester: a hand value for a sum line must sum the figures the app shows, because the last part of
  a reading order is derived from its total and can differ from its own rounding.
- Tester: the mutation runner restores in a `finally`, so an interrupted run cannot leave a
  mutation in the tree. P38 already covers the backup, so this may belong inside P38 rather than as
  a new number.
- Developer: a reading order that crosses two tables needs one module that owns the derived part.
- Question, not a rule: whether the 100-character habit for prose becomes a rule, given that
  prettier does not reflow it.

### Cost

_The OpenCode harness prints no per-run tokens, tool uses or duration for a role run, and no
running list was kept for this story, so every figure cell says `not measured` with its reason;
the rows are the runs that happened, in chronological order._

| Role                                        | Round | Model                   | Tokens                                      | Tool uses                                   | Duration                                    |
| ------------------------------------------- | ----- | ----------------------- | ------------------------------------------- | ------------------------------------------- | ------------------------------------------- |
| product-owner                               | 1     | inherit (strata/iq2_xs) | not measured (harness prints none)          | not measured (harness prints none)          | not measured (harness prints none)          |
| ux-designer                                 | 1     | inherit (strata/iq2_xs) | not measured (harness prints none)          | not measured (harness prints none)          | not measured (harness prints none)          |
| architect                                   | 1     | inherit (strata/iq2_xs) | not measured (harness prints none)          | not measured (harness prints none)          | not measured (harness prints none)          |
| developer                                   | 1     | inherit (strata/iq2_xs) | not measured (harness prints none)          | not measured (harness prints none)          | not measured (harness prints none)          |
| tester                                      | 1     | inherit (strata/iq2_xs) | not measured (harness prints none)          | not measured (harness prints none)          | not measured (harness prints none)          |
| developer, run ended with an error          | 2     | inherit (strata/iq2_xs) | not measured (a failed run reports nothing) | not measured (a failed run reports nothing) | not measured (a failed run reports nothing) |
| developer                                   | 2     | inherit (strata/iq2_xs) | not measured (harness prints none)          | not measured (harness prints none)          | not measured (harness prints none)          |
| tester                                      | 2     | inherit (strata/iq2_xs) | not measured (harness prints none)          | not measured (harness prints none)          | not measured (harness prints none)          |
| reviewer                                    | 1     | inherit (strata/iq2_xs) | not measured (harness prints none)          | not measured (harness prints none)          | not measured (harness prints none)          |
| tester, findings 1 to 3 and the measurement | 2     | inherit (strata/iq2_xs) | not measured (harness prints none)          | not measured (harness prints none)          | not measured (harness prints none)          |
| architect, findings 4, 5 and 7              | 2     | inherit (strata/iq2_xs) | not measured (harness prints none)          | not measured (harness prints none)          | not measured (harness prints none)          |
| developer, the measured width               | 3     | inherit (strata/iq2_xs) | not measured (harness prints none)          | not measured (harness prints none)          | not measured (harness prints none)          |
| reviewer                                    | 2     | inherit (strata/iq2_xs) | not measured (harness prints none)          | not measured (harness prints none)          | not measured (harness prints none)          |
| tester, the three nits                      | 3     | inherit (strata/iq2_xs) | not measured (harness prints none)          | not measured (harness prints none)          | not measured (harness prints none)          |
| tech writer                                 | 1     | inherit (strata/iq2_xs) | not measured (harness prints none)          | not measured (harness prints none)          | not measured (harness prints none)          |
| total (measured)                            |       |                         | n/a                                         | n/a                                         | n/a                                         |
| orchestrator (main session)                 |       | strata/iq2_xs           | not measured                                | not measured (no running list)              | not measured (no running list)              |

Nothing here was measured, so no role stands out in cost. What is measured, and is not a cost
figure, is the wall clock of the checks: the reviewer's own full gate printed 12 steps in 85,9 s,
the developer's printed 12 steps in 79,7 s, the tester's round-3 runs printed 57 unit tests and 66
e2e specs, and its mutation battery printed 30 runs of a single vitest file with the baseline on
the clean file.
