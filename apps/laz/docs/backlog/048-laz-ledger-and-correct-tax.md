---
id: 048
title: A yearly account statement as the main table, and the tax computed right
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<app name>/docs/backlog)
size:
  L # S | M | L (story 026). L, the reason: hak asked for one story (2026-11-16) - two tax defects and the
  # new tables move together, because the account statement is what proves the defects are gone.
branch: feature/048-laz-ledger-and-correct-tax
supersedes: [] # stories this one fully replaces
changes:
  [031/AC1, 031/AC2, 031/AC3, 045/AC4, 045/AC5, 046/AC3, 046/AC4, 047/AC2, 047/AC3, 047/AC4] # the tax rate
  # with Kirchensteuer (031), the flat-rate tax as money of the whole holding (045), the tax on the interest
  # (046), and the year table of 047, which the account statement replaces
superseded-by:
---

# 048 – A yearly account statement as the main table, and the tax computed right

## Original request

> check bitte die aktuelle laz Berechnung, insbesondere die Steuer ist denke ich falsch. Auch die dargestellen
> Spalten sind nicht sher aussagekräftig. Mach bitte Vorschläge für ein Refactoring. Ich möchte aus den
> dargestellten Zahlen die Rechnung einfach nachvollziehen können, insbesondere sollen alle wichtige Teilbeträge
> dargestellt werden

> Mach alles als eine Story, ich habe nur wenig Token zur Verfügung, und eine story reduziert denke ich vor allem
> die Testaufwände. Du hast von mir das ok "abzukürzen", also dich nicht immer an den Prozess zu halten, wenn du
> damit token sparst und das Ergebnis ok ist.

## User story

As the depot owner, I want one table that reads like an account statement, year by year, with every amount
that goes in or out, and taxes computed by the statutory formula, so that I can follow the whole calculation
with a pocket calculator and trust the monthly payout.

## Context

The orchestrator checked the app on 2026-11-16 (depot 300.000 €, phase 01.2028–03.2034, KapESt + KiSt Bayern,
flat rate 2,24 %, parking 2,50 %) and found two defects and a readability problem:

1. **Kirchensteuer rate too high.** The app adds KiSt on top of 25 % KapESt (28,375 % in Bayern). By
   § 32d Abs. 1 Satz 3–4 EStG the Kirchensteuer lowers the Kapitalertragsteuer: KapESt = 25 % / (1 + 0,25 · k),
   k = 8 % or 9 %. Effective rates: 26,375 % without KiSt, 27,8186 % with 8 %, 27,9951 % with 9 %. The defect
   is in all three taxed amounts (liquidation, Vorabpauschale, interest).
2. **Vorabpauschale tax counted per share, not for the holding.** The tax at liquidation is lowered by the
   flat bases of the whole holding, but the depot reserves the flat-rate tax of one share only (cents). Flat
   rate 2,24 % gives 4.570,50 €/month, flat rate 0 % gives 4.500,02 €/month: the Vorabpauschale raises the
   payout, although it only pays the same tax earlier.
3. **The year table of 047 cannot be followed:** the columns are not in the order of the calculation,
   "Betrag für das Jahr" is the net proceeds, the flat-rate columns "do not count", purchase price, gain and
   taxable gain are missing, and 15 sum and note lines follow the table.

## Acceptance criteria

- **AC1 (the tax rate by § 32d EStG):** Given the tax case, when a taxable amount is taxed, then KapESt =
  amount · 25 % / (1 + 0,25 · k), Soli = 5,5 % of KapESt, KiSt = k · KapESt, with k = 0 without the
  Kirchensteuer checkbox. Hand oracle for a gain of 1.000,00 €: without KiSt 250,00 / 13,75 / 0,00 € (263,75 €);
  KiSt 8 % 245,10 / 13,48 / 19,61 € (278,19 €); KiSt 9 % 244,50 / 13,45 / 22,00 € (279,95 €). The same rule
  taxes the proceeds at liquidation, the Vorabpauschale and the interest, and the tax block shows the
  effective rate (e.g. "27,82 % auf den Gewinn").
- **AC2 (the Vorabpauschale is money of the whole holding):** Given the tax case, the flat-rate tax of a fund
  and year is shares held × the flat base per share × the rate of AC1, and the depot contains it. With the
  parking option off, the monthly payout with flat rate 2,24 % is not higher than with 0 % and at most 0,5 %
  lower (the tax paid earlier comes from cash that no longer grows in the fund), and flat-rate tax paid +
  liquidation tax = rate of AC1 × the whole gain of the holding.
- **AC3 (the account statement):** Given a result, the year table is replaced by an account statement with
  one row per calendar year from the year of the data file's date to the last phase year, columns in this
  order: Jahr, Kontostand am Anfang, Kauf der Fonds, Vorabpauschale (Steuer), Erlös aus Auflösung (brutto),
  Kapitalertragsteuer, Solidaritätszuschlag, Kirchensteuer, Zinsen Tagesgeld, Steuer auf Zinsen,
  Auszahlungen, Kontostand am Ende. Outflows are shown negative. In every row start + all flows = end, the
  end of a row is the start of the next, the first start is the depot and the last end is 0,00 €. The
  Vorabpauschale of year Y is in row Y+1 (paid on the first working day), a fund's liquidation and its tax in
  its maturity year, the purchase in the first row. A column without any amount in the whole plan (e.g. the
  tax columns in the tax-free case) is not shown.
- **AC4 (the fund table shows the way to the gain):** Given a fund that funds a phase year, its row shows
  Anteile, Kurs heute, Einstand (Anteile × Kurs), Hochrechnung je Anteil, Erlös brutto (Anteile ×
  Hochrechnung), Gewinn (Erlös − Einstand), Summe der Vorabpauschalen-Basen and steuerpflichtiger Gewinn
  (Gewinn − Basen, not below 0). No tax amount is shown there (047/AC1 holds). The Einstand and Erlös of a fund
  are the same figures as in the statement.
- **AC5 (the result explains itself):** Given a result, the result block shows the monthly payout, the depot
  as Einstand of all funds + cash reserve (Kontostand after the purchase), and one check line: Depot − Kauf +
  Erlöse − alle Steuern + Zinsen − Auszahlungen = 0,00 €, each sum equal to the column sum of the statement.
  Shown sums add up exactly (the last part is derived, CLAUDE.md money rule).
- **AC6 (nothing else moves):** Given the tax checkboxes and the parking option are off, the monthly payout
  and the depot are the values of the app before this story, in both directions: on the fixture fund list the tests read,
  depot 300.000 € → 4.481,10 €/month and 4.000 €/month → depot 267.791,58 € (old and new logic agree).

## Out of scope

- TER of the funds, Sparer-Pauschbetrag, loss offsetting, a Basiszins per year, interest on the reserve before
  the phase (the parked money of 046 keeps its rule).

## Open questions

- None.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-16 — hak: one story for both tax defects and the refactoring of the tables; the orchestrator may
  shorten the process where it saves tokens and the result stays right.
- 2026-11-16 — orchestrator: TER and the Sparer-Pauschbetrag stay out (not asked for, change the model); the
  reserve before the phase earns no interest (keeps 046 unchanged).
- 2026-11-16 — orchestrator, shortened process (hak's ok): the orchestrator writes the story and the technical
  design itself; one developer run, one tester run, the orchestrator reviews the diff; no separate UX run (the
  columns are fixed in AC3/AC4).
- 2026-11-16 — orchestrator, after the developer run: AC2 said "equal within 1 cent"; that is wrong, because
  the Vorabpauschale is paid from cash that no longer grows in the fund, so the payout is slightly lower (about
  8 €/month, 0,19 %, on the fixture). AC2 now asks for "not higher, at most 0,5 % lower" plus the tax identity.
  AC6 pins are the fixture values (the e2e mode reads the fixture, not the real data file).

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_Fixed by AC3 and AC4: the column order and names are the AC's. The statement scrolls horizontally like the
year table of 047; the Jahr column stays a row header._

## Technical design

Written by the developer (shortened process, hak's ok); no new dependency, no ADR.

- `logic/tax.ts`: `taxParts(amount, state) -> { kapESt, soli, kist }` by § 32d (KapESt = amount 25 % / (1 + 0,25 k)),
  unrounded; `effectiveRate` and `taxFromState` derive from it, so liquidation, Vorabpauschale and interest read one rule.
- `logic/ledger.ts` (new): `buildPlan`, `payoutFromDepotCents`, `depotFromPayoutCents` and `buildStatement`. Shares come
  from `purchaseRows` (unchanged: year amount minus net interest, over net proceeds per share after the tax on gain
  minus Vorabpauschale bases). Depot = sum of purchases + reserve (shares x flat tax per share). The model is linear in
  P, so the depot direction divides by the depot of 1 EUR.
- `buildStatement`: one row per calendar year from asOf's year to the last phase year; Vorabpauschale of year Z in row
  Z+1; liquidation and its tax parts in the maturity year; purchase in the first row; interest, tax on it and payout in
  the phase year. Each cell is rounded once (sign kept); the first Kauf is the sum of the rounded Einstand figures of the
  fund table; the rounding residue goes into the last payout, so the last end is exactly 0,00 EUR.
- `fundFigures` (in the statement): Anteile, Einstand, Erlös brutto, Gewinn (Erlös - Einstand), Summe der Basen,
  steuerpflichtiger Gewinn (not below 0), all from the same rounded cells as the statement.
- UI: `StatementTable` replaces `YearTable`; `FundTable` columns per AC4; `ResultSummary` shows payout/depot, the depot
  split and the check line; tax hint shows the effective rate. `cashflow.ts` and `phase.ts` factor code removed.
- Tests: `tax` (AC1 oracle), `ledger` (hand statement N = 1, closing at 0, columns hidden, AC6, AC2 identity).

## Implementation notes

**What changed.** New `logic/ledger.ts`, `StatementTable.tsx` (git mv from `YearTable`). `tax.ts` rewritten (§ 32d).
`phase.ts` keeps only the phase helpers; `cashflow.ts`, `phaseFactor`, `parkedFactor`, `flatCashCents`, `yearRows` and
`displayYearCents` are removed with their tests (`cashflow.test.ts`, `phase.test.ts`). `purchase.ts` loses
`displayFundParts`. `fieldCopy.ts` loses the 047 reason maps and sum/notes lines (15 lines under the table are now one
note). New `formatPercent` in `format.ts`. Unit tests updated: tax, deposit, flat, purchase, fieldCopy; new ledger tests.

**Live text defect (found by the orchestrator).** `liveText` read `plan.monthlyCents` in both directions, so with the
payout given it announced the typed 4.000 EUR as the needed depot. Fixed: the figure is the monthly payout in the depot
direction and `plan.depotCents` in the payout direction. The live text no longer names the sum of the funded years (AC5
removes that figure).

**Deviations and open points.**

1. AC2 equality is not reachable with a cash reserve. Paying the Vorabpauschale from idle cash costs the growth the
   fund would have given that money: depot(flat) / depot(0) - 1 = r B (rho' - 1) / (rho' + r B) per fund (rho' of the
   flat-0 case). On the fixture (KiSt Bayern, phase 01.2028-03.2034, depot 300.000 EUR) flat 2,24 % gives about 8 EUR a
   month less than 0 % (0,19 %), where the old defect gave 70 EUR more. The unit test asserts the correct direction
   (lower, within 0,5 %) and the identity "flat tax paid + liquidation tax = rate x whole gain". If hak wants exact
   equality the reserve would have to be held in the funds (not specified); needs a decision.
2. AC6 pins: the vitest and `mode e2e` builds read the fixture fund list (asOf 2026-12-31), the published build the real
   file. The old logic from `HEAD` and the new one give the same figures on the fixture (4.481,10 EUR a month for
   300.000 EUR; 267.791,58 EUR for 4.000 EUR a month; unit test pins 14.936,989225972 Cent for 1.000.000 Cent, from the
   hand F of the fixture). The orchestrator's 4.631,43 / 259.099,43 EUR come from the real data file and were not
   reproducible here; the tester should re-pin them in the real-data build (`test:pages`).
3. The year without a funding fund has no payout in the statement (as before: no amount). Zero amounts show a dash.
4. Fund table order: Kurs heute, YTM (inputs keep their tab order), Hochrechnung, then the AC4 columns; the table minimum
   width is 1500 px inside its scroller.
5. Result block: first figure unchanged (label by direction), second row "Aufteilung des Depots" with Einstand + Reserve = Depot,
   then the check line as a paragraph.

**e2e.** `npm run test:e2e -w apps/laz`: 47 pass, 19 fail; all 19 are specs of earlier stories in `e2e/laz.spec.ts` that
assert removed things (region "Jahresuebersicht" renamed "Kontoauszug", the 13 year-table columns and sum lines, "Summe der
finanzierten Jahre", the "Kurs" header, old 28,375 % figures). Not edited (tester's files): lines 49, 210, 298, 359, 446,
539, 584, 635, 703, 736, 811, 877, 936, 993, 1069, 1178, 1254, 1354, 1445. `verify -w apps/laz` is green.

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s)                                                                                                                                                                                                                                                     | Result |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | `e2e/laz.spec.ts` "048 AC1: the rates by section 32d …" (hand cells KapESt/Soli/KiSt for 8 % and 9 %, label 26,38 / 27,82 / 28,00 %); unit `tax.test.ts`                                                                                                    | PASS   |
| AC2 | `e2e/laz.spec.ts` "048 AC2: …" (hand payout 4.352,96 EUR at flat 0, flat 2,24 strictly lower, at most 0,5 %, tax identity from cells); unit `ledger.test.ts`                                                                                                | PASS   |
| AC3 | `e2e/laz.spec.ts` "048 AC3: …" (12 headers in order, rows 2026-2034, start + flows = end per row, last end 0, hidden empty columns, hand interest 16,25 / -4,29); "024 AC2: …" (hand tax-free rows); unit `ledger.test.ts` "AC3: the derived last payout …" | PASS   |
| AC4 | `e2e/laz.spec.ts` "048 AC4: …" (12 headers, hand 9,33 / 373,36 / 1.496,29 / 1.122,93, same figures in the statement); "036 AC1, AC2, AC3"                                                                                                                   | PASS   |
| AC5 | `e2e/laz.spec.ts` "048 AC5: …" (hand depot split and check line tax-free; full case: every figure equals a column sum read from the cells)                                                                                                                  | PASS   |
| AC6 | `e2e/laz.spec.ts` "048 AC6: …" (4.481,10 EUR a month for 300.000 EUR; 267.791,58 EUR for 4.000 EUR a month, hand from the fixture)                                                                                                                          | PASS   |

**Tests.** Added 7 e2e specs (048 AC1 to AC6 and the rewritten 024 AC2 with the statement) and 1 unit test. The 19 failing
specs: 11 rewritten in place (024 AC2, AC6 live text, 030 AC1, 033 AC1/AC2, 032 AC1, 032 AC3, 035 AC1, 036, 045 AC1, 046 AC1,
and 031 as 048 AC1), 8 replaced by the 048 tests (032 AC2, 045 AC4, 045 AC5, 046 AC4, 047 AC1/AC6, 047 AC2, 047 AC3, 047
AC4). Helpers `statementRegion`, `statementTable`, `readStatement`, `toCents`, `toCentsAll`, `givenPayout`, `kstBox`,
`kistBox` are in `e2e/laz.helpers.ts`; `yearRegion` and `yearTable` are gone.

**Results.** `npm run verify -w apps/laz` green (laz vitest `Tests 44 passed (44)`, platform `Tests 154 passed (154)`).
`npm run test:e2e -w apps/laz`: `63 passed` (chromium project 22, platform project 41), no flaky, no retry.

**Mutations (runner outside the repo, restore byte-identical checked by the runner each time).** Old KiSt-on-top rate in
`taxParts`: 048 AC1 and AC2 fail. Swap of two statement columns: 048 AC3. Last payout +1 Cent: 048 AC3, 048 AC5, 024 AC2.
Reserve without the share count: 048 AC2 (also the unit test of the orchestrator, which fails in 3 vitest tests). Start cell
+1 Cent: 048 AC3. Gain +1 Cent: 048 AC4. Payout scaled by 1,001: 048 AC2, AC3, AC5, AC6 and 024 AC2. Check-line payout +1:
048 AC5.

**Residue (orchestrator request).** New unit test "AC3: the derived last payout equals months x the monthly payout …" in
`logic/ledger.test.ts`, full case (KiSt 8 %, flat 2,24 %, parking 2,50 %): measured residue 1 Cent (depot given) and 4 Cent
(payout 4.000 EUR given); bound 5. Mutation `row.shares *` dropped in `depotCentsAt`: the test failed (plus two others),
file restored byte-identical.

**Checked, OK.** Tax-free case: Reserve shows 0,01 EUR and the first row ends at 0,01 EUR (depot 10.000,00 minus the sum of
the seven rounded Einstand figures 9.999,99); this follows from the derived-part rule and is pinned in 048 AC5, not a
defect. Phase outside the list: no statement, callout only. Hidden columns in the tax-free case and at flat 0 / rate 0.

**Open point (not a defect, story deviation 2).** The AC6 figures hold on the fixture (e2e mode); the real data file in the
published build was not re-pinned (`test:pages` not run, the orchestrator's 4.631,43 / 259.099,43 were not reproduced).

**Defects.** None found.

Gate 2 full run (orchestrator, 2026-11-16, `verify --mode=full`, local): 11 of 12 steps ok, e2e 124,9 s; `format:check` failed only on the uncommitted local `.claude/launch.json` (not part of the story), formatted, re-check green. Real data in the dev server: tax off 4.631,43 €/month for 300.000 € (unchanged), KapESt + KiSt Bayern 4.450,30 €/month, reserve 5.233,18 € = sum of the Vorabpauschale column. CI run of the branch: 43919930908 (workflow_dispatch, verify success, deploy skipped off main).

## Review

Round 1, by the orchestrator (shortened process, hak's ok of 2026-11-16), checklist version 3. Verdict: **APPROVED**.

| Item | Result | Note                                                                                                                                                     |
| ---- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | AC1 `taxParts` + tax.test/048 AC1; AC2/AC3/AC5 `ledger.ts` + ledger.test/048 AC2, AC3, AC5; AC4 `FundTable` + 048 AC4; AC6 pins in ledger.test + 048 AC6 |
| C2   | n.a.   | no async flow changed                                                                                                                                    |
| C3   | pass   | everything derived in the existing `useMemo`; live text now reads the depot in the payout direction                                                      |
| C4   | n.a.   | no render loop                                                                                                                                           |
| C5   | n.a.   | no reducer                                                                                                                                               |
| C6   | pass   | no result possible keeps its visible message; no catch added                                                                                             |
| S1   | pass   | no new sink; figures are formatted text                                                                                                                  |
| S2   | n.a.   | no config or env change                                                                                                                                  |
| S3   | n.a.   | no dependency                                                                                                                                            |
| S4   | n.a.   | no dev-only code                                                                                                                                         |
| S5   | n.a.   | no generated code                                                                                                                                        |
| T1   | pass   | full verify run at gate 2 (run recorded in the Test report)                                                                                              |
| T2   | pass   | unit tests for the tax formula and the ledger, one e2e per AC                                                                                            |
| T3   | pass   | hand oracles by the tester; the forced 0,00 € end is backed by a residue bound (1 and 4 cents, bound 5), mutation-checked                                |
| T4   | pass   | statement cells read by column header                                                                                                                    |
| T5   | pass   | `ledger.ts` and `taxParts` have unit tests                                                                                                               |
| K1   | pass   | factor code, `cashflow.ts` and their tests removed; deviations in Implementation notes                                                                   |
| K2   | pass   | typecheck and lint green                                                                                                                                 |
| K3   | pass   | no colour literal; token tests green                                                                                                                     |
| K4   | n.a.   | no platform or factory file                                                                                                                              |
| K6   | pass   | status and index row equal (check:structure)                                                                                                             |
| K7   | pass   | Decision log appended (AC2 and AC6 rewording)                                                                                                            |
| K8   | pass   | laz README paragraph and CHANGELOG Fixed/Changed entries                                                                                                 |
| K9   | pass   | prettier green                                                                                                                                           |
| K10  | n.a.   | no workspace tooling change                                                                                                                              |
| K11  | n.a.   | no env variable                                                                                                                                          |
| A1   | pass   | no new control; tables keep row and column headers                                                                                                       |
| A2   | n.a.   | no new state cue                                                                                                                                         |
| A3   | pass   | live region unchanged in mount order; its text is fixed                                                                                                  |
| A4   | n.a.   | no rendering loop                                                                                                                                        |

Observation: the tester's memory file has 105 lines, above its limit of 100; to prune in the next tester run.

## Explanation

The app now shows an account statement: one row per year, from today to the end of the payout phase.
Each row shows what comes in and goes out: purchase, Vorabpauschale tax, fund proceeds, the three taxes,
interest, payouts. Every row adds up, and the last row ends at 0,00 €, so the plan can be checked by hand.
The fund table shows the way to the gain: shares, purchase price, proceeds, gain, taxed bases, taxable gain.
The result splits the depot into the funds and a cash reserve and adds a check line that ends at 0,00 €.
Two tax errors are fixed. The church tax now lowers the capital gains tax as the law says (27,82 % instead
of 28,375 % in Bayern). The Vorabpauschale tax was counted for one share only; now for the whole holding.
Because of that error the Vorabpauschale had raised the payout; now it lowers it slightly, as it should,
because the tax is paid earlier from cash that does not grow.
Without taxes the figures are unchanged (4.631,43 € per month for 300.000 € with the real data).
Risk: the model still ignores fund costs (TER) and the saver's allowance; both are out of scope.
Not verified: the figures against a real bank statement.

## Retrospective

Shortened process (hak's ok of 2026-11-16): the orchestrator wrote the story, the review and the docs; one
developer run and one tester run, both on Sonnet.

What went wrong:

- **AC2 was wrong as written** ("equal within 1 cent"). The orchestrator assumed the Vorabpauschale only moves
  the tax in time, but the tax paid earlier comes from cash that no longer grows in the fund, so the payout is
  slightly lower. The developer found it; AC2 was reworded (Decision log). Root cause: an AC with a numeric
  claim was written without a hand calculation.
- **AC6 pins were taken on the real data file**, but unit and e2e tests read the fixture fund list. The
  developer re-pinned on the fixture; the orchestrator checked the real-data value (4.631,43 €) in the dev
  server. Root cause: the story did not name which data the pins belong to.
- **The forced 0,00 € end of the statement was vacuous** until the orchestrator asked for a residue bound;
  the tester added it and mutation-checked it.
- The defects themselves (Kirchensteuer on top, Vorabpauschale per share) passed stories 031, 045 and 047,
  because their hand oracles used the same per-share or on-top reading as the code.

Proposed changes:

- **P49** (product-owner, orchestrator writing a story): a numeric claim in an AC (equal, within x, a pin) is
  backed by a hand calculation in the story, and a pin names the data it is read from (fixture or data file).
- **P50** (tester): a closing check that the code forces (a derived last part) is backed by a bound on the
  derived part, measured and mutation-checked.

Outcome at gate 2 (hak, 2026-11-16): P49 and P50 not approved, nothing applied.

### Cost

| Role                        | Round | Model  | Tokens       | Tool uses | Duration |
| --------------------------- | ----- | ------ | ------------ | --------- | -------- |
| developer                   | 1     | sonnet | 219893       | 70        | 11:50    |
| tester                      | 1     | sonnet | 157489       | 45        | 11:53    |
| total (measured)            |       |        | 377382       | 115       | 23:43    |
| orchestrator (main session) |       | opus   | not measured | n/a       | n/a      |

The orchestrator also did the roles of product-owner, architect, reviewer and tech-writer in this story.
