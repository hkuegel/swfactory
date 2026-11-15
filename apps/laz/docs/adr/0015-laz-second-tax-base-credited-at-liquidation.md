# 0015 – Vorabpauschale: the flat rate is a second tax base, credited at liquidation, and its payments belong to the depot

- **Status:** accepted
- **Date:** 2026-11-15
- **Story:** apps/laz/docs/backlog/045-laz-vorabpauschale-flat-rate-over-the-term.md

## Context

ADR 0012 taxes one base: the gain at liquidation, `payout = NAV + (1 − r)·max(0, gain)`. Story 045 adds the
Vorabpauschale (§ 18 InvStG), a fictitious yearly earning for an accumulating fund that is taxed every year
during the term. Three things must hold at once, and each rules out a variant that would be cheap to write:
no base is taxed twice, the projection's closed form stays invertible in both directions, and the money that
pays the yearly tax comes from the settlement account, so the fund's own value is not reduced (hak,
2026-11-15). The choice fixes the hand oracles of every later `laz` story, so it is costly to reverse.

## Options considered

1. **The yearly tax is withheld from the fund** – a depot statement habit, but then the fund's value at
   liquidation is no longer `NAV + gain`, the phase factor would have to carry a per-year balance, and the
   closed form of ADR 0012 stops being one formula. Rejected: hak's answer says the settlement account pays.
2. **The flat base is computed on its own path and the liquidation tax stays on the whole gain** – the two
   taxes would then read the same money twice, so AC3's equality breaks. Chosen instead: the liquidation
   base is `max(0, gain − credited)`, and the bases are computed on the projection's own day count
   (ACT/365, ADR 0012), which is what makes `flat + liquidation tax = r × gain` hold by construction.
3. **A per-year base factor folded into `ρ′`** (chosen) – `ρ′ = ρ − r·max(0, ρ − 1 − b)`, `b` = the sum of the
   bases per euro invested. One closed form, the same shape ADR 0012 uses for the negative branch, so tax at
   `r = 0 %` still returns the pre-tax projection and a fund with no positive year pays nothing.
4. **The depot excludes the yearly payments** – simplest, and story 032 AC2 would stay untouched, but then
   the plan would search for a depot that cannot pay its own tax. Rejected by hak's answer of 2026-11-15:
   `D = P·F + cash`, `P = (D − cash)/F`. This stays a round trip because `cash` is a constant of the fund
   list and the rate, not a function of `P`.

## Decision

- The flat rate is one parameter, whole hundredths of a percent, prefilled `2,24`, constant over the term,
  and it counts only in the tax case. The tax rates stay in millionths of a percent.
- The base of a year is the value at the start of that year on the projection's day count, times the rate;
  only the first partial year follows § 18's whole-month rule (1/12 per whole calendar month before the
  acquisition month, and the asOf month is the acquisition month). The base is capped at the year's actual
  increase and cannot be negative; the year of liquidation does not count.
- The flat bases already taxed are credited against the tax at liquidation, and the depot the plan searches
  for includes the payments of the funds that fund a phase year: `D = P·F + cash`.

## Consequences

- Story 024 AC4 (`payout = NAV + (1 − r)·max(0, gain)`) holds while the flat rate is 0, so the existing hand
  values of the tax case are kept by typing `0` in the flat field; the new hand values are story 045's.
- AC3's equality holds for the monotone path (every counted year's increase positive, as a constant YTM
  gives). With a year whose increase is not positive the base is 0, and the equality is not claimed: the
  liquidation base is still `max(0, gain − credited)`.
- The first partial year is the one place the model mixes two counts: the value on the day count, the
  fraction on whole months. This must not be read as two reductions of the same year.
- `cash` covers only funds that fund a phase year; a fund outside the phase is not bought, so its money is
  not part of the depot and its column keeps story 032's dash.
- `P = (D − cash)/F` can be negative when the depot is smaller than the yearly payments. The model returns
  the value as it is; only the base is floored at 0.
