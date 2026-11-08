# 0007 – Altersvorsorgedepot: pure projection module with cent-rounding at the boundary, hand-drawn SVG chart

- **Status:** accepted
- **Date:** 2026-11-07
- **Story:** apps/avd/docs/backlog/013-avd-saving-phase-zulagen.md

## Context

Story 013 starts the app `avd`: a calculator that projects the saving phase of an
Altersvorsorgedepot (monthly contributions, Zulagen credited a year later, net return after
costs) and shows the end value split into own contributions, Zulagen and returns, per year as
a table and a chart. Later stories (taxes, payout phase, comparison with an ETF depot) build on
the same calculation, so how money is represented, where it is rounded and how the chart is
drawn are costly to change later.

Two forces decide the money model:

- AC4 requires that the three parts sum exactly to the end value in cents, and pins the
  reference example to 22.256,44 EUR. Rounding the balance to the cent every month gives
  22.256,45 EUR (checked during design), so the convention of the story implies no
  intermediate rounding.
- Inputs are typed in German format (`9,99`, `0,5`). `parseFloat("9.99") * 100` is
  `998.9999…`, so parsing through floats makes range checks such as "at most 570,00" fragile.

## Options considered

1. **Integers at the boundary, float inside, round once per reported value** (chosen) –
   inputs are parsed from the string into integers (cents, basis points, whole years);
   contributions and Zulagen are exact integer cents (c in cents is 12 × the monthly cents,
   a multiple of 12, so 0,5 · c and 0,25 · c are whole cents); the balance is compounded as
   an unrounded float in cents and rounded with `Math.round` only where a value is reported
   (each year end, the end value); returns are derived as balance − contributions − Zulagen,
   so the sum identity holds by construction. Matches the reference example exactly.
2. **Bank-style rounding to the cent every month** – what a real depot statement would show,
   but it contradicts the settled convention and the AC4 oracle (22.256,45 EUR).
3. **Decimal library (decimal.js, big.js)** – exact decimal arithmetic, but a dependency for
   at most 52 × 12 multiplications whose result is rounded once; fractional powers
   `(1 + r)^(1/12)` are irrational anyway.

For the chart:

1. **Hand-drawn SVG from a pure geometry function** (chosen) – a stacked bar per saving year
   (at most 52) is a few `<rect>` elements; scale and tick values come from a small unit-tested
   function; colours from app tokens via CSS Modules (token test applies), no bundle cost.
2. **A chart library (Recharts, Chart.js, visx)** – axes and tooltips for free, but 50–150 kB,
   own colour and font handling outside the token rules (ADR 0004), canvas output (Chart.js)
   that forced colours can't restyle, and an ADR plus upgrade burden for one simple chart.

## Decision

- The calculation lives in pure modules under `apps/avd/src/features/saving/logic/` with no
  React import: field specs and parsing (`string` → integers), Zulage rules, the monthly
  projection, chart geometry. UI components only derive from them.
- Money crosses module boundaries as **integer cents** (`…Cents: number`), rates as
  **basis points** (1 % = 100). The balance is a float only inside `project()`; reported
  values are rounded with `Math.round` once; returns are always derived, never compounded
  separately.
- Formatting uses `Intl.NumberFormat('de-DE', …)` in one module; nothing else formats money.
- The chart is hand-written SVG; no chart dependency.

## Consequences

- Later stories add functions next to `project()` (e.g. taxes, payout) on the same integer
  types; they must not round the balance inside a loop unless their own convention says so.
- Results are model values, not depot statements: a provider's monthly cent rounding can
  differ by a few cents over decades. This is stated by the UI note (AC8), not corrected.
- The chart has no tooltips or interaction; the year table carries the exact data. A richer
  chart later (e.g. two scenarios for the ETF comparison) means extending the geometry
  function or revisiting this ADR.
- Values stay far inside `Number.MAX_SAFE_INTEGER` (worst valid case about 7,2 · 10^10
  cents: age 18 to 70, 570 EUR, 10 children, 20 % return).
- Amended by [ADR 0008](0008-avd-yearly-contribution-schedule-with-reinvested-refund.md)
  (story 015): yearly contributions, Zulagen and refunds come from an integer schedule
  computed before the balance loop; with a reinvested refund c is no longer a multiple of 12,
  so the Grundzulage is rounded once to the cent, and the result has a fourth part.
