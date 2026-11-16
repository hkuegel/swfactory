# 0016 – laz: the parked balance enters the phase factor as a term, not as a new fund

- **Status:** proposed
- **Date:** 2026-11-15
- **Story:** apps/laz/docs/backlog/046-laz-parked-money-on-a-deposit-account.md

## Context

The payout of a phase year falls month by month, on the last day of each phase month (story 046). The
money for a month is the monthly target `P`, so the balance that waits at the start of month `k` is
`P · (m − k + 1)`, and with one simple accrual on that waiting balance (hak's answer to Q2, no interest on
interest inside the year) the phase year earns `P · rate · m(m + 1) / 24`. In the tax case the tax on that
interest is deducted at the Zufluss with the rates story 031 already models, so the net interest is what the
plan keeps (hak's answer to Q4). The plan then needs less money at the start of the phase year:
`P·m − netInterest` instead of `P·m`.

That changes the closed form ADR 0012 fixed for both directions, so it needs a decision. What must stay
true: the option off gives exactly today's figures, the round trip stays one inverse pair, no field is
added to `data/fund-list.json` (the rate is a UI parameter), the deposit account cannot go below zero, and
the interest is never negative.

## Options considered

1. **Show the interest as an extra figure, leave the closed form alone** – the fund table and the year table
   would show a number, but the depot and the monthly payout would not change, so AC3 and AC5 would be
   false. It also leaves the two directions inconsistent.
2. **Put the interest inside the fund's projection (`payoutFactor`)** – rejected: the projection is the
   fund's (ADR 0012), a deposit account is not a fund, its tax base is a capital earning (§ 20 Abs. 1 Nr. 7
   EStG) and not the fund's gain, and the money that is parked is not the money that is invested.
   `payoutFactor` would stop being the figure story 024 AC4 and ADR 0012 define, and story 045's credit rule
   (ADR 0015) would have to read a second base for the same fund.
3. **Add the parking as a term to the phase factor** – `F` stays exactly the factor ADR 0012 gives, and the
   new term `K = Σ k_y / ρ′_y` with `k_y = rate · m_y(m_y + 1) / 24 · (1 − tax rate)` is subtracted from it:
   `D = P · (F − K) + cash` and `P = (D − cash) / (F − K)`. `K` is 0 when the option is off or the rate is
   0, so the off state is bit-identical to today, and the round trip stays one inverse pair. Chosen.
4. **Simulate the phase month by month, with compounding** – rejected: the story excludes interest on
   interest and the credit cycle (Q2), and a loop would replace the closed form, so the two directions would
   no longer be an inverse pair and the round-trip test of story 024 AC3 would have no oracle.

## Decision

The parked balance enters the model as one term `K` on the phase factor, computed only for the phase years —
the same set of funds the `cash` line of story 045 uses — because a fund outside the phase is never bought
and its money is never parked. The term applies only where there is money to park: the deposit account
cannot go below zero, so a negative monthly target earns nothing, and the branch is decided by the sign of
the money, not by the rate. Both directions stay inverse in both branches on the unrounded values, and the
negative branch is exactly today's model.

Unit: the interest is stored as an unrounded number in micro-euro, like `flatTaxMicroEur` and
`payoutPerShareMicroEur`, because a phase year's interest is not a whole cent: `m = 1` at `P = 100 €` and
`2,50 %` gives `0,2083333 €`, and even a full year's net is `11,9640625 €`. The single rounding stays at
display; because nothing inside the closed form is rounded, the round trip stays inverse on the unrounded
values and can only be measured at logic level, never by feeding a displayed figure back through the model.

The rate is a parameter of the form, not a field of the data file: whole hundredths of a percent (2,50 % is
`250`, the unit of the flat field of story 045), prefilled with `2,50 %` (hak's answer to Q1), constant over the
whole term, and non-negative — a deposit account cannot go below zero and a negative rate is out of scope. No
field is added to `data/fund-list.json`, so the file and its writer stay untouched.

Convention: the interest is earned during the phase year, but the model nets it at the _start_ of that year and
discounts it with the year's `ρ′` (the `K` term). It is one simple accrual on the waiting balance (hak's answer
to Q2), not a month-by-month simulation and not interest on interest; a per-month table is out of scope.

The tax on the interest is the rate story 031 gives (Kapitalertragsteuer 25 % plus 5,5 % Solzzuschlag on
that, plus church tax on the Kapitalertragsteuer when both apply), it is deducted at the Zufluss, and the
Sparer-Pauschbetrag stays out of the model as story 045 decided.

## Consequences

- Easier: the option-off state is exact by construction (`K = 0` is an addition of 0), so every existing
  hand value of stories 024, 032 and 045 survives, and the prefilled rate does not move any figure while
  the option is off. The fund's own projection, the flat path and their tests are untouched.
- Harder: the phase factor now has two sums that must be read over the same set of funds, so a mutation of
  the month sum `m(m + 1) / 24` moves the year table's figure and the depot at the same time; the design
  names this coupling for the tester.
- To watch: the money rule has one derived part per breakdown. The parking effect is already inside the
  money invested in the fund, so the fund table's parts do not gain a group; the new columns are single
  roundings, and the year section's sum line is the sum of the shown figures.
- To watch: `K` cannot see the sign of `P` (it is a factor), so the negative branch must be decided where
  the closed form is evaluated, not inside `deposit.ts`; a later story that allows a negative rate or a
  per-year rate must re-check this branch.
