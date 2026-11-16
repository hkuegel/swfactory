# 0017 – laz: a fund's tax figures read in the year table, the fund table keeps the pre-tax proceeds

- **Status:** proposed
- **Date:** 2026-11-16
- **Story:** apps/laz/docs/backlog/047-laz-cashflows-in-the-year-table.md

## Context

Two tables read the same money. The fund table shows one fund: its course, its YTM, its per-share figure,
its shares, its purchase price (story 032), and since story 045 its flat figure as a part of the depot. The
year table shows one phase year: what leaves the year, what is parked in it, and the tax on that money
(stories 033, 035, 046). Hak's request for story 047 is that each cashflow of a phase year reads as its own
figure, and that no tax figure stays in the fund table (gate-1 answers 1 and 2).

That forces a decision, because today the fund table's per-share figure is the taxed payout (story 024 AC4)
and the tax figure is read on the fund's own row. If the tax moves to the year table while the fund table
keeps the taxed payout, the same base is shown twice: once as the fund's payout, once as the year's tax.

What must stay true: the money rule (one rounding per figure, the last part derived from the total, no double
rounding — stories 032 AC2, 045 AC5, 046 AC4), the depot parts of story 045 AC5, every dash with its reason
and never a `0`, the rates of story 031, the projection convention of ADR 0012, the credit rule of ADR 0015,
the parking term of ADR 0016, and the hand values of stories 024, 032, 033, 035, 045 and 046.

## Options considered

1. **The fund table keeps the taxed payout and keeps the tax figure** – what is there today. Rejected by
   hak at gate 1: the fund table then mixes a per-share figure with a year's money, and the year table cannot
   state the year's tax total without reading the fund table's figures.
2. **Show the tax in both tables** – the same base would be rounded in two places, so the two totals could
   disagree; the money rule would need two derived parts for one base, which is the double rounding the rule
   forbids.
3. **The fund table keeps the pre-tax proceeds, and every tax figure reads in the year table** – chosen. The
   fund table then shows only what belongs to a fund (course, YTM, per-share figure, shares, purchase price),
   and the year table shows only money of one year. The identity that keeps them consistent is
   `pre-tax proceeds − tax parts = shares × payoutPerShare`, the figure story 024 AC4 defines, so nothing is
   added to the model: the fund table reads the pre-tax side, the year table reads the tax side, and the same
   unrounded base is rounded once.
4. **Keep the flat column in the fund table** – rejected by hak's answer 1: the flat figure is a part of the
   depot, and story 045 AC5 reads the depot's parts across both tables, so its place is the year table with
   its own sum line. The rule that the parts add to the shown depot stays; only the reading order decides
   which part is derived.

## Decision

A fund's tax figures read in the year table, one column per cashflow, and the fund table's per-share figure
becomes the pre-tax proceeds. A tax that exists as a rate but does not apply is a dash with its reason, never
a `0` (answer 3), and the same answer reads in every tax column. Each column keeps its own sum line, and the
year section states the year's tax total and the year's cash total once (answer 7).

The year table shows one figure per cashflow, and the design names which cell carries which number, because the
gate-1 answer 6 (`P · m`, the gross payout times the months of the year) is a different number from the fund's
contribution while the parking option is on: the payout cell is `P · m`, and the parked cell is the money that must
be at the start of the year, which is `P·m − net` and is the year table's existing amount column (`Betrag für das
Jahr`) that stories 024 AC2 and 046 AC5 pin — it stays, so those tests do not move. With the parking option off or
the rate 0 the two cells are the same number, which is why the control figures stay. The interest cell shows the
gross interest and its tax is its own column; the net is the difference of the two cells, not a third number. The
row's cash total is the year's tax plus `P · m`, which is the same money as `tax parts + parked + grossInterest`.

The flat columns are depot parts paid in other years (story 045 AC5), so they are not addends of the row's cash
total; the copy says so, and that statement needs hak's confirmation, as does the wording that the parked column is
a balance rather than a flow. The flat figures also must not count a year twice: column A holds only the counted
years with no row of their own (the years before the phase), the phase-year parts read in column B of the rows of
those years, and column B counts only the funds still held in that phase year — the fund resolved in this year is
not still held, because its liquidation year never counts (045 AC2). The identity is: column A of a fund's row plus
column B of the earlier rows equals that fund's `flatTaxMicroEur`. The tax on the deposit interest stays one figure
(answer 11); its parts are only the parts of the tax on the sale proceeds.

The money rule has one derived part, and the reading order decides which one it is: the fund table's purchase
parts row by row, then the year table's flat figures row by row (the column of the counted years before the
phase before the column of this phase year), then the year section's line for a fund whose sale year is not a
phase year. Within a fund whose figure is split across cells, the last piece is derived from that fund's part.

## Consequences

- Easier: one table shows money of one year, so a hand sum can be formed in one place, and the fund table no
  longer mixes per-share figures with year money. The off states stay exact: with the tax off the fund table's
  figure and the year table's proceeds are the same number, because no tax is subtracted.
- Harder: the depot rule now spans two tables, so a mutation moves an assertion in both. The tester must know
  which expressions are shared: `monthSum` in `deposit.ts` (interest, `parkNetMicroEur`, `parkTerm`),
  `max(0, ρ − 1 − flatBaseFactor)` (`payoutFactor` and the tax parts), `flat.ts`'s per-year base (the flat
  figures and `flatBaseFactor`), `tax.ts`'s rate (the parts, `taxFromState`, `parkTaxMicroEur`, `flatTaxMicroEur`),
  `roundEuroCents` in `format.ts` (every money cell), and the single reason string `Steuer nicht angehakt`,
  which three reason maps read.
- Harder: `flat.ts` has to export the per-year base, which is internal today, so that the split can be tested
  through an exported caller (story 026 R3). A fix inside the internal shape cannot be caught by the money rule.
- To watch: the row identity holds by construction, so it cannot falsify its own base rule; each base needs its
  own hand value, and no expected figure may be read from the module under test. The design's own arithmetic
  could not be checked in this pass — the plan modules cannot be imported from `node`, because `fund.ts` imports
  `fund-list.json` without an import attribute — so every row figure is reported as unverified until the tester
  runs it.
