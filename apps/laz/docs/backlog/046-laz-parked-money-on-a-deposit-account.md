---
id: 046
title: The payout falls monthly, and money that is not yet needed can be parked on a deposit account for a rate that is a parameter
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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
`6,5 × 100 × 0,025 = 16,25 €`; tax case at `26,375 %` (no church tax): `4,2909375 €`, net `11,9590625 €`;
money needed at the start of that year `1188,0409375 €`. A partial phase year of three months:
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

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

To be written after gate 1.

### Copy (exact strings)

To be written after gate 1.

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

To be written after gate 1.

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
