---
id: 032
title: Shares of each fund to buy now
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
size: S # S | M | L (story 026). S = at most three ACs: needs only the Explanation, no Review section and no Cost table.
branch: feature/032-laz-shares-to-buy-now-per-fund
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [] # adds a column to the fund table; the funding rule and the projection label of 024 are used, not modified
superseded-by: # set on the OLD story when a newer one replaces it
---

# 032 – Shares of each fund to buy now

## Original request

> "ich will auch wissen wieviel ich von jedem ETF JETZT kaufen muss" (hak, 2026-11-13)

## User story

As the depot owner, I want to see for each fund how many shares I would have to buy today, so that
the plan shows the purchase side and not only the payout side.

## Context

- The fund table of story 024 shows NAV, YTM and the projected payout per
  share. Hak wants the other side of the same model: which purchase in each fund produces the amount
  that funds the phase year that fund finances (024 AC2: a phase year is funded by the fund
  liquidated in December of the year before).
- The rule, in one line: `shares = amount of the phase year / projected payout per share` and
  `purchase now = shares × NAV`. This is the same projection and the same tax state as the payout
  column, so both directions use the model already defined by 024 ADR 0012; nothing new is computed.
- "Jetzt" is the price in the data file, not a live price: the NAV and its asOf come from the
  committed data file (ADR 0013), and the existing projection label (024 AC5) names that date. No
  runtime fetch (024 AC6 still holds).
- In the round trip of 024 AC3 the depot is already the sum of the present values of the funded
  years, so the per-fund purchases are the parts of that sum; this story shows them instead of only
  the total.

## Acceptance criteria

- **AC1:** Given a fund whose liquidation falls inside the phase, when the fund row is shown, then
  it shows the number of shares that produces the phase-year amount under the current tax state, and
  the amount that purchase costs at the data-file NAV; measured against hand-pinned values for one
  example phase (hand oracle, not the values the display computes).
- **AC2:** Given the result of either direction, when the per-fund purchase amounts are added, then
  the sum equals the shown depot (direction 1) or the shown required depot (direction 2) within one
  cent, measured on the unrounded internal values, with the last part derived from the total instead
  of rounded separately (the money rule).
- **AC3:** Given a phase year with no funding fund, or a fund whose liquidation falls after the
  phase end, when the row is shown, then it shows no purchase: a dash in both new cells, no number
  invented, and the cell says why (for example `kein Fonds für dieses Jahr` and `Auflösung nach
Phaseende`), while the projection label with its asOf stays associated with the row (024 AC5).

## Out of scope

- Broker realities: order minimums, fees, partial shares from savings plans, and whether a share
  order can be placed in whole numbers only; the story shows the model's number.
- Any live price, any network request, any storage write (024 AC6).
- The tax model changes of 031 and the phase input changes of 033.

## Open questions

- None. Shares are shown with two decimals because the model's number is not a whole share; if hak
  wants whole shares only (rounded up, with the amount for the rounded number), that is a new
  decision and a new display rule, not part of these ACs.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be rebuilt without
the chat. Append only._

- 2026-11-13 — hak's request (verbatim above).
- 2026-11-13 — Decision (orchestrator): the shares are the model's exact number with two decimals,
  so the sum property of AC2 holds; whole-share rounding is not applied here.
- 2026-11-14 — Decision (orchestrator): the row of the fund table is a fund, so the phase year it shows is
  the year after its liquidation year (024 AC2). The money rule of AC2 is applied to the shown parts of
  this table, because `Σ shares × NAV` is the depot of either direction.
- 2026-11-14 — Decision (orchestrator): `kein Fonds für dieses Jahr` stays the line of the year table for a
  phase year without a funding fund (024 AC2); the fund row names its own reason. AC3 gives one example
  string for the fund row (`Auflösung nach Phasenende`), so the two other reasons are decisions of this
  story: `Auflösung vor Phasenbeginn` for a fund that liquidates before the phase begins, and
  `keine Hochrechnung je Anteil` for a payout per share of 0, where the rule cannot divide. Both are
  pending hak's confirmation.
- 2026-11-14 — Decision (orchestrator): the reason reads in the same cell as the dash it explains, in both
  new cells, so the dash is never read alone. While no result is possible the dash stands without a reason.
- 2026-11-14 — Decision (orchestrator): the shares are not money, so the money rule of AC2 does not apply
  to the shares column; the rule is applied to the purchase column only.
- 2026-11-13 — hak confirms all open gates in advance and asks for the open laz stories to be finished
  without waiting for his approval, so this story is set to done at gate 2; the merge to main runs in the
  order 024 → 025 → 030 → 033 → 031 → 032.
- 2026-11-14 — Gate 2 (hak, 2026-11-14): the two reason strings of this story are confirmed as written,
  `Auflösung vor Phasenbeginn` and `keine Hochrechnung je Anteil`; `Auflösung nach Phasenende` stays hak's
  example from AC3. P29 and P30 approved with the same gate and applied to the tester rules.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

## Implementation notes

- A new logic module holds the purchase side of the model of ADR 0012: `shares = phase-year amount /
projected payout per share` and `purchase = shares × NAV`, on the same effective funds, the same phase and
  the same tax state the projection column already uses. Nothing is rounded inside the module; the single
  rounding happens at display (ADR 0012).
- The row of the fund table is a fund, so its phase year is `fund year + 1` (024 AC2). A fund whose
  liquidation falls outside the phase funds no phase year: the module returns no number for it, and the cell
  shows the dash with the reason, not a figure.
- The parts of the table are the parts of the depot, because `Σ shares × NAV = monthly × F`, so AC2's money
  rule is applied here: the last purchase part is the shown depot minus the other shown parts. The shares
  column is not money, so the rule does not apply to it.
- Two columns of the fund table (the table is the fund row), the copy strings for the headers and for the
  three reason texts, a shares formatter with two decimals, and the wiring in the calculator that passes the
  plan's monthly value and the shown depot. No new input, no new state, no fetch, no storage write (024 AC6).
- Deviation from the design: none. The dash reads together with the projection label, which stays the
  accessible description of the row (024 AC5); the reason line uses the muted style of the table's footnote.

## Test report

| AC  | Test(s)                                                                                                                                                                                                                                                                                                                                                                                                                   | Result |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | e2e "032 AC1": the fund rows 2028 and 2030 of the example phase show the hand shares 55,06 and 46,05 and the hand purchases 2.092,22 € and 1.933,96 € (tax off), and the same row 2028 shows 53,85 and 2.046,41 € with KSt at 26,375 %; `logic/purchase.test.ts` AC2 (the hand shares of all seven rows)                                                                                                                  | pass   |
| AC2 | `logic/purchase.test.ts` AC2: the unrounded parts sum to the depot within one cent, and the shown last part is the depot minus the other parts; e2e "032 AC2": the case where the rule changes the shown figure — parts 11.533,51 € and 11.142,56 € against the shown depot 22.676,07 €, where rounding the last part on its own would show 11.142,55 €; with the tax on, 11.653,02 € and 11.356,61 € against 23.009,63 € | pass   |
| AC3 | `logic/purchase.test.ts` AC3: the rows outside the phase and the payout-per-share-0 guard name a reason and hold no number; e2e "032 AC3": the dash with its reason in both new cells, the year table keeps its own missing-year line, the row inside the phase keeps its hand figures, and the projection label with its asOf stays the accessible description of the row                                                | pass   |

Counts as printed: laz vitest 23 passed (8 files); laz Playwright 52 passed, including the three new tests;
typecheck green, prettier green, eslint green. The affected run is green, 8 of 12 steps.

The hand values are computed by hand from the fixture copy (spans asOf 31.12.2026 → 31.12. of the fund
year) with the factors ρ = 1,0404516 · 1,0769573 · 1,1255649 · 1,1878281 · 1,2655355 · 1,3612328, and the
purchase of a row is its phase year's amount divided by the factor, because `shares × NAV` cancels the NAV.
No test reads its expected figure from the module it checks.

Non-vacuity, five mutations on a copy of the logic directory under `.tmp` and four on a copy of the app,
never on the working tree:

- the money rule dropped, so the last part is rounded on its own → AC2 red at logic level and at the cell;
- the phase-year guard dropped, so a fund outside the phase gets a phase year → AC2 and AC3 red;
- the payout-per-share-0 guard dropped, so the row divides by 0 → AC3 red;
- the shares shown as whole shares instead of two decimals → three cases red;
- the fund row read as its own phase year instead of the year it funds → all four cases red;
- the cell rounding each part on its own instead of using the rule → the e2e AC2 assertion red;
- the reason dropped from the cell, so only the dash is left → the e2e AC3 assertion red;
- the shares column not part of the table → the e2e AC1 assertion red;
- the tax state ignored on the purchase side → the e2e AC1 assertion red.

The copies were restored by copying the original files, not with git.

Defects found while testing: the e2e case first typed the amount with a thousands separator, which the
field's parser refuses, so it failed on the missing result instead of on the rule; and it asserted
`kein Fonds für dieses Jahr` in a fund row, where the implementation shows the row's own reason — that
string belongs to the year table (024 AC2). Both are fixed in the test, not in the app.

## Review

Size S, so no review round (story 026).

## Explanation

Der Fondsplan zeigt zwei neue Spalten: wie viele Anteile man heute kaufen müsste und was das kostet.
Die Anteile sind die Modellzahl: der Betrag eines Phase-Jahrs geteilt durch die Hochrechnung je Anteil.
Der Kaufpreis ist diese Zahl mal dem NAV aus der Datei; die Datei nennt ihr Datum als Stand der Daten.
Ein Fonds finanziert das Jahr nach seinem Auflösungsjahr, deshalb steht bei ihm das nächste Jahr.
Die neuen Zahlen stehen nur in der Fondstabelle, die Jahresübersicht bleibt, wie sie war.
Die Anteile haben zwei Nachkommastellen, weil die Modellzahl kein ganzer Anteil ist.
Die Kaufpreise addieren sich zum gezeigten Depot: der letzte Teil ist das Depot minus die anderen Teile.
Im Testfall zeigt das einen Unterschied, weil allein gerundet der letzte Teil einen Cent niedriger wäre.
Ein Fonds außerhalb der Phase zeigt keine Zahl: der Strich bleibt, und die Zelle nennt den Grund dafür.
Die Gründe sind Auflösung nach Phasenende, Auflösung vor Phasenbeginn, keine Hochrechnung je Anteil.
Die letzten beiden sind Entscheidungen dieses Storys und warten noch auf Haks Bestätigung.
Ohne Ergebnis steht der Strich für sich, und die Hochrechnungsbeschreibung bleibt an der Zeile.
Mit Kapitalertragsteuer werden die Anteile kleiner, weil dieselbe Steuer wie in der Hochrechnung zählt.
Prüfungen, die diese Änderung sehen können, sind grün: 23 Unit-Tests, 52 e2e-Tests, 8 von 12 Schritten.
Manuelle Prüfung: das Aussehen im Browser nach dem Merge ist yours.

## Retrospective

What went wrong: no review round (size S), no defect in the app code. Two defects in the test itself: the
expected figures of one e2e case had been invented in the draft instead of measured, and the case typed the
amount with a thousands separator, which the field's parser refuses, so it failed on the parse instead of on
the rule. Both were fixed in the test, not in the app.

Two things the run showed:

- A new e2e file was written under a name the runner does not pick up, so the case never ran until it was
  put into the app's spec file. Proposed change P29: a test is not reported as covering an AC until it has
  been observed running. Pending hak's approval; approved by hak on 2026-11-14 and applied to the tester rules.
- A test that types a number into a field must type it the way the field accepts it, not the way the display
  formats it; the expected figure and the typed text are two different oracles. Proposed change P30: an e2e
  input is written in the form the parser takes, and the display form only in the assertion. Pending; approved
  by hak on 2026-11-14 and applied to the tester rules.

Proposals applied for this story's roles: P22 (developer and tester), P23 (tester), P24 (developer),
P26 (tech-writer), P21 (tester). P27 (proposal numbers are never reused) and P28 (files written with the
editor tool) were pending here and are approved by hak on 2026-11-14, applied to `CLAUDE.md` and the role files.

No Cost table: size S (story 026, R8).
