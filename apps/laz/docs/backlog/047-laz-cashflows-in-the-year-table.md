---
id: 047
title: The cashflows of a phase year, one figure each, in the year table
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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

_orchestrator: plain-language explanation shown at gate 2, at most 15 lines of at most 120 characters. No code, no
file names._

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates), proposed changes to
agents/CLAUDE.md/templates, and which ones hak approved. Include a `### Cost` table (see the retro step of
`/feature`)._
