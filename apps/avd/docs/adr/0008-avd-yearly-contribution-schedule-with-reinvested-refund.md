# 0008 – Altersvorsorgedepot: yearly contribution schedule before the balance loop (reinvested tax refund)

- **Status:** accepted
- **Date:** 2026-11-07
- **Story:** apps/avd/docs/backlog/015-avd-reinvest-tax-refund.md

## Context

Story 015 lets the saver reinvest the yearly tax refund of story 014. The refund of saving year
n is paid into the depot on 1 January of year n + 1 and counts as an own contribution of that
year: it raises c(n + 1) for the Zulage and the deduction, and only the part up to the
6.840 EUR cap is reinvested. That is a feedback loop: c(n + 1) depends on R(n), and R(n + 1)
depends on Z(n + 1), which depends on c(n + 1). Story 014 kept the refund outside `project()`
("the rate cannot change a depot figure by construction", ADR 0007); with the checkbox checked
that no longer holds, while with the checkbox unchecked every figure must stay exactly as in 014.

Two facts shape the decision:

- The loop does not involve the balance: c, Z and R of a year depend only on the inputs and the
  previous year's R. The balance depends on the loop, not the other way round.
- c(n) is no longer a multiple of 12 cents (e.g. 300,00 + 44,07 EUR), so the Grundzulage
  0,5 · c and 0,25 · (c − 360 EUR) can have half or quarter cents. ADR 0007 relied on "c is a
  multiple of 12, so the Zulage is whole cents".

## Options considered

1. **Integer schedule first, balance loop second** (chosen) – a pure function computes, per saving
   year, own contribution, reinvested refund, c, Z and R in integer cents; `project()` then
   compounds the balance from that schedule. Unchecked, the schedule has reinvested = 0 and
   c = 12 · monthly, so `project()` performs the same float operations as before (adding 0 is
   exact) and every 013/014 figure is identical. The schedule is unit-testable without floats.
2. **Refund computed inside the monthly loop of `project()`** – one loop, but integer tax rules
   and float compounding mixed in one function; the schedule can't be tested on its own.
3. **Keep `project()` untouched and add the reinvestment as a separate projection on top**
   (superposition, as 014 did for the refund) – the extra money is the refund plus the extra
   Zulage it causes; both would be compounded and rounded separately, so the four parts would
   no longer sum exactly to one rounded end value without a correction term.

For the Zulage of a c that is not a multiple of 4 cents:

1. **Round the Grundzulage once per year to the cent, half up** (chosen) – `Math.round` of the
   exact quarter-cent value, as ADR 0007 rounds every reported value once. For every c of the
   form (12 · monthly) it is a no-op.
2. **Truncate to the cent** – what an agency might do, but no source says so; it would be a
   second rounding convention in the app.

## Decision

- `logic/schedule.ts` computes the yearly schedule (own, reinvested, c, Z, R per saving year)
  in integer cents. Reinvested(n) = min(R(n − 1), 6.840 EUR − 12 · monthly) for n >= 2 when
  the checkbox is checked, else 0; R of the last saving year is never reinvested.
- `project(inputs, { reinvestRefund })` takes the Zulage of each year from the schedule and adds
  the reinvested amount on 1 January (before the first monthly contribution, so it earns 12
  months). The balance stays an unrounded float; the reported parts are own contributions,
  Zulagen, reinvested refund and returns, where returns = balance − the other three, so the
  sum identity of ADR 0007 holds with four parts.
- `zulage()` rounds the Grundzulage once to the cent (half up).
- The tax refund of 014 is read from the schedule, so Zulage, refund and depot have one source.

## Consequences

- Unchecked, all results equal 013/014 by construction; the 013/014 unit and e2e tests stay the
  oracle for that and must pass unchanged.
- With the checkbox checked, Zulage and refund can differ from year to year (whenever
  c < 1.800 EUR or the Kinderzulage is not at its cap). Single "per year" figures in the UI then
  describe one year only; the table carries the per-year values.
- Later stories that add yearly flows (e.g. a changing contribution or tax rate) extend the
  schedule, not the balance loop.
- Amends [ADR 0007](0007-avd-projection-model-and-svg-chart.md): the "multiple of 12" argument
  for whole-cent Zulagen holds only for c = 12 · monthly; the result has four parts when the
  refund is reinvested.
