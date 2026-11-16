---
id: 049
title: The Vorabpauschale reserve earns interest on the deposit account
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<app name>/docs/backlog)
size: S # S | M | L (story 026)
branch: feature/049-laz-interest-on-the-reserve
supersedes: [] # stories this one fully replaces
changes: [046/AC2, 048/AC3] # the parked money now includes the reserve; the statement shows its interest
superseded-by:
---

# 049 – The Vorabpauschale reserve earns interest on the deposit account

## Original request

> mir ist es halt aufegfallen weil wir direkt am Anfang noch 13k Reserver für die Vorabpauschale rumliegen haben.
> Das müsste doch etwas mehr ausmachen !?

> /feature laz Zinsen auf den ganzen Kontostand - bitte schlank umsetzen

## User story

As the depot owner, I want the cash reserve for the Vorabpauschale to earn interest like the money that waits for
the payouts, so that the account statement has no cash lying idle and the payout is not understated.

## Context

Story 048 shows the account statement. With the parking option on, only the money of a phase year earns interest
(046, `m(m + 1) / 24` year units). The reserve for the Vorabpauschale tax (13.664 € on hak's depot of 640.000 €)
sits on the same account from the purchase until it is used up, and earns nothing (048 kept that out). The
orchestrator's estimate: about 850 € gross, 615 € net over the term, about 8 € more payout per month.

## Acceptance criteria

- **AC1 (the reserve earns interest):** Given the parking option is on and the plan has a reserve, then each
  calendar year the reserve earns rate × (sum of the reserve balance at the start of each month) / 12, counted
  from the month after the purchase month; the January balance is already lowered by the Vorabpauschale paid on
  the first working day. The interest is credited at the end of the year, taxed by 048 AC1, and the net interest
  stays in the reserve and earns from the next year on. It is shown in the statement's interest and interest-tax
  columns, also in the years before the phase. Hand oracle: reserve 1.000,00 €, rate 2,40 %, purchase in November,
  no tax: interest of that year 2,00 € (December only).
- **AC2 (the depot uses it):** Given the tax case with a reserve and parking on, the reserve the depot holds is
  the smallest one that pays every Vorabpauschale, so the statement still ends at 0,00 € (rounding residue at most
  5 cents), and the monthly payout is higher than with the reserve earning nothing, by less than 0,5 %.
- **AC3 (nothing else moves):** Given the parking option is off, or the plan has no reserve (tax off or flat rate
  0 %), every figure equals the one of story 048 (048 AC6 pins, the 046 interest figures).

## Out of scope

- Changing the 046 rule for the money of a phase year; a Basiszins per year; interest on interest inside a year.

## Open questions

- None.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-16 — hak: "Zinsen auf den ganzen Kontostand", lean as in story 048 (orchestrator writes story, review and
  docs; one developer and one tester run on Sonnet).
- 2026-11-16 — orchestrator, after the test run: the AC1 hand oracle (a reserve of exactly 1.000 €) cannot be
  set, because the reserve follows from the share count and its rule is internal; the hand value is instead the
  e2e pin of the pre-phase year (balance after the January payment × rate, by hand), mutation-checked.
- 2026-11-16 — orchestrator: the whole balance is the phase-year money (046 rule unchanged) plus the reserve; only
  the reserve is new, so 046 and 048 figures stay where there is no reserve (AC3).

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_No new control: the existing parking option and rate apply; the figures appear in existing statement columns._

## Technical design

_developer (lean process, no architect)._

- `reserveOf` in `ledger.ts` is the one place that knows the reserve; `depotCentsAt` (both directions) and
  `buildStatement` read it, so depot, payout and statement cannot drift apart.
- Year payments `p_Y` = Σ shares × `flatYearMicroEur` in row Y+1. Per year: balance −= payment (January), gross
  interest = rate × balance × months / 12 (months: 12 − purchase month in the first row, else 12), tax by
  `taxParts`, net stays.
- The recursion is linear in the starting reserve R: end(R) = a + b·R. a = run with R 0; b = growth of 1 EUR with
  no payments (the difference of two full runs loses digits). R = −a / b is the smallest reserve ending at 0.
- With parking off, rate 0 or no reserve it returns the 048 figure unchanged (AC3). The interest goes into the
  existing `interest` / `interestTax` columns, also before the phase.

## Implementation notes

- `apps/laz/src/features/plan/logic/ledger.ts`: `reserveOf` (see Technical design); `depotCentsAt` and the
  statement use it. Tests in `ledger.test.ts` (describe "story 049"): AC1 (December-only first year; January
  payment, net kept, 2030/2031 chain; reserve used up) and AC2 (gain of the payout > 0 and < 0,5 %).
- AC1 hand oracle: the reserve cannot be set to 1.000 EUR (it follows from the shares), so the test takes the
  shown reserve and payments as input and applies the story's rule; the interest of the purchase year is
  reserve × 2,40 % / 12 (same 1/12 as the 1.000 EUR to 2,00 EUR oracle). Tax-independent, so KapESt is on.
- AC2 is shown as (total Vorabpauschale - reserve held) / depot: the payout gain at equal depot against a reserve
  that earns nothing.
- Verify green (154 + 46 tests); `test:e2e -w apps/laz` 63 passed. No deviation from the story.

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s)                                                                                                                                                                                                                          | Result |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | `apps/laz/e2e/laz.spec.ts` "049 AC1" (hand 2027: 4.394,90 - 5,80 = 4.389,10 x 2,50 % = 109,73 EUR, tax 28,94 EUR; no columns with parking off); unit `ledger.test.ts` "story 049 AC1" (December only, January payment, net kept) | PASS   |
| AC2 | `laz.spec.ts` "049 AC2" (payout 4.397,36 against 4.394,41 of the 048 code of commit 35be095, gain 2,95 EUR = 0,067 %; last end 0,00); unit "story 049 AC2"                                                                       | PASS   |
| AC3 | `laz.spec.ts` "049 AC3" (4.351,65 on 048 code, parking off; 048 AC6 pins 4.481,10 and 267.791,58)                                                                                                                                | PASS   |

- Added: 3 e2e tests, 0 unit tests. `npm run verify -w apps/laz`: platform 154 passed, laz 46 passed. `npm run test:e2e -w apps/laz`: 66 passed, no flaky.
- Mutation (removing the January payment from the reserve run, backup byte-identical afterwards): AC1 failed at `laz.spec.ts:1076`, AC2 at `laz.spec.ts:1097`; AC3 stayed green as it should.
- Limit: `reserveOf` is not exported and the reserve follows from the shares, so the story's oracle (1.000 EUR, 2,40 %, November) cannot be set. The unit AC1 test still takes the shown reserve as input; the independent hand value is the e2e pin of 2027 (hand figures from displayed cells). Not changed.
- Checked, OK: purchase on 31.12. gives no interest in row 2026; no defects.

Gate 2 full run (orchestrator, 2026-11-16, `verify --mode=full`, local): 12 of 12 steps ok. Real data in the dev server (640.000 €, KapESt + KiSt Bayern, flat 2,24 %, parking 2,50 %): reserve 10.706,81 €, December 2026 interest 22,31 € (10.706,81 × 2,5 % / 12), 2027 interest 251,73 € ((10.722,91 − 653,56) × 2,5 %), statement ends at 0,00 €.

## Explanation

With the deposit option on, the cash reserve for the Vorabpauschale tax now earns interest too.
Each month the reserve balance earns the deposit rate, from the month after the purchase on.
The interest is credited and taxed at the end of the year and stays in the reserve.
Because the reserve grows, the depot needs a smaller one, and the monthly payout rises slightly.
Example with real data, 640.000 €: reserve 10.706,81 €, 22,31 € interest in December 2026, 251,73 € in 2027.
Without the deposit option or without a reserve, all figures are the same as before.
Not changed: the rule for the money of a payout year (story 046).
Not verified: the figures against a real bank statement.

## Retrospective

Lean process as in story 048. Nothing went wrong beyond one point: the AC1 hand oracle (a reserve of exactly
1.000 €) was not settable through the plan; the tester pinned a hand-computed pre-phase year instead (Decision
log). No proposals.

### Cost

| Role                        | Round | Model  | Tokens       | Tool uses | Duration |
| --------------------------- | ----- | ------ | ------------ | --------- | -------- |
| developer                   | 1     | sonnet | 65537        | 16        | 2:37     |
| tester                      | 1     | sonnet | 63330        | 17        | 2:16     |
| total (measured)            |       |        | 128867       | 33        | 4:53     |
| orchestrator (main session) |       | opus   | not measured | n/a       | n/a      |
