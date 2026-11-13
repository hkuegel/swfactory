# 0012 – Lebensarbeitszeitkonto: the iBonds projection convention and the round-trip closed form

- **Status:** accepted
- **Date:** 2026-11-13
- **Story:** apps/laz/docs/backlog/024-laz-ibonds-phase-plan.md

## Context

Story 024 projects a future payout per share from NAV and weighted average YTM (hak: it is a
projection, not a published market value, and the UI labels it as one), and it must answer both
directions — depot → maximum monthly payout and target monthly payout → required depot — checked
against each other within one cent. The story fixes only the boundaries that hold under any
convention (AC1, AC4) and the funding rule (a fund's money is spendable only from its liquidation
month, December of the maturity year; a phase year is funded by the December liquidation of the
year before, AC2). The compounding frequency, the day count, the rule for a partly covered phase
year and the rounding model are the architect's choices, and they fix the hand oracles of every
later `laz` story (the data-file refresh script, a per-year chart, a later comparison story), so
they are costly to change.

## Options considered

Projection horizon and compounding:

1. **Annual effective compounding over actual days, ACT/365** (chosen) – `payout per share =
NAV · (1 + ytm)^(d/365)`, `d` = actual calendar days from asOf to the fund's liquidation date
   (31 December of its maturity year). Both AC1 boundaries are exact by construction (`ytm = 0` and
   `d = 0` give the NAV), the projection is monotone in YTM, and a partly covered phase year is
   representable without a special rule.
2. **Monthly compounding at the nominal annual rate** – a bank-calculator habit, but it needs a
   rule for a part month, so AC1's `asOf = maturity` equality becomes a convention instead of an
   exact value; the day count still has to be chosen.
3. **Simple interest, no compounding** – simplest, and AC1 holds, but it understates the gain the
   YTM describes (the YTM is a yield to maturity, i.e. a compound measure).
4. **Whole years only** – no fractional exponent, but a partly covered year cannot be represented
   and the projection jumps on each anniversary, which contradicts AC1's monotone chain at any asOf.

Day count: **ACT/365 actual days** (chosen) over 30/360 (makes the oracles easy but reports a
projection that no longer equals the NAV on the actual anniversary) and ACT/ACT (undefined for a
projection across years, and a leap year changes the rate).

Round trip:

1. **One closed form, used in both directions** (chosen) – `F = Σ_funded years m_y / ρ′_y` with
   `ρ′ = 1 + (1 − r)·(ρ − 1)` the tax-adjusted payout factor per euro invested; the forward answer
   is `P = D / F`, the reverse answer is `D = P · F`. They are the same expression inverted, so the
   round trip agrees exactly on the unrounded values; the one cent of AC3 covers only the display
   rounding.
2. **A per-year simulation with a carryover balance** – closer to a real depot, but the minimum over
   prefix sums makes the two directions different functions, so a cent-exact round trip is not
   guaranteed and the app needs a loop where a formula suffices. The funding rule of AC2 already
   forbids moving money between phase years, so there is nothing to simulate.
3. **Equal split of the depot over the funds** – simple to write down, but its inverse is not the
   same formula: with unequal fund factors the round trip drifts by up to F/2 cents (about 27 cents
   for a 10.000,00 EUR depot on the fixture list), so AC3 would fail at the display level.

Tax: gain only, at liquidation, flat rate, base `max(0, gain)` (hak's answers: no
Teilfreistellung, no Vorabpauschale, no Sparerpauschbetrag). Applying it per share keeps AC4's
identity and keeps `ρ′` a constant per fund, which is what makes the closed form work.

## Decision

- Payout per share (pre-tax projection) = `navCents · (1 + ytm)^(d/365)`, `d` = actual calendar
  days from `asOf` to 31 December of the fund's maturity year, computed from `Date.UTC` calendar
  dates only (never a time of day). The fund's weighted average maturity is display data, not the
  horizon.
- Tax on the gain at liquidation: `payout = NAV + (1 − r)·(projection − NAV)`, base `max(0, gain)`;
  one on/off parameter plus one rate in basis points.
- Phase = whole calendar months, inclusive; a phase year counts only its phase months; no money
  moves between phase years, so each funding fund covers exactly the months of the year it funds.
  A phase year whose funding year is not in the fund list is reported as missing with no amount.
- Both directions from one closed form: `F = Σ_funded years m_y / ρ′_y`, `P = round(D / F)` and
  `D = round(P · F)`, unrounded inside, rounded once at the display boundary; the last line of the
  year breakdown is derived as total − the other lines. The round trip is asserted on the unrounded
  model values; a displayed value fed back is not the round trip (see Consequences).
- Fund list: fixed in the repo, maturity years 2028–2034, no fund before 2028, so the example
  phase's 2028 is genuinely a year with no funding fund (AC2).

## Consequences

- The hand oracles of this and later `laz` stories depend on these rules: the fixture day counts
  731, 1096, 1461, 1826, 2192, 2557, 2922 and `F = 55,125236` (tax off) / `F = 56,844419` (tax on,
  25 %) only hold under ACT/365 with the liquidation date as horizon; 30/360 or monthly
  compounding moves the AC4 figure from `45,96 EUR` to a different cent.
- Because `F` is a multiplier, the rounding at the display boundary amplifies: feeding the shown
  181,41 EUR back gives 10.000,27 EUR, so AC3's one-cent claim is measured on the unrounded
  values. If a later story wants a round trip through the UI text, that AC must state the level.
- The projection is monotone and needs no loop, so both directions are two one-line functions of
  `F`; no simulation, no carryover state, no clock.
- A negative projection gain (possible only through the user override path) is not taxed, which AC4
  does not contradict as long as the gain is positive; the `max(0, gain)` branch stays.
- If hak later wants the fund's actual weighted average maturity as the horizon, or a fund bought
  before asOf, or a carryover of money between phase years, this ADR is reopened and every oracle
  in story 024 must be recomputed.
