---
id: 048
title: A yearly account statement as the main table, and the tax computed right
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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
  parking option off, the monthly payout with flat rate 2,24 % equals the payout with 0 % within 1 cent
  (the same tax, paid earlier), while the statement shows flat-rate tax payments above 0 and a liquidation tax
  lower by the same total.
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
  and the depot are the values of the app before this story (pinned by hand from `main` before the change),
  in both directions.

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

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_Fixed by AC3 and AC4: the column order and names are the AC's. The statement scrolls horizontally like the
year table of 047; the Jahr column stays a row header._

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

_orchestrator: plain-language explanation shown at gate 2, at most 15 lines of at most 120 characters. No code, no file names._

## Retrospective

_orchestrator: what went wrong, proposed changes, and the Cost table._
