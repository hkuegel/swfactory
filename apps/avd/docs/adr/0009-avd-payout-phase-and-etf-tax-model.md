# 0009 – Altersvorsorgedepot: payout phase to 85 and the tax model of the ETF comparison

- **Status:** accepted
- **Date:** 2026-11-08
- **Story:** apps/avd/docs/backlog/016-avd-etf-comparison.md

## Context

Story 016 compares the Altersvorsorgedepot (AVD) with a normal ETF depot: same monthly rate,
return and costs, both paid out in equal monthly payouts until age 85, compared by the yield after
tax ("Ertrag nach Steuer" = net payouts − own contributions + refunds that stay with the saver).
The story fixes the tax rules (§ 22 Nr. 5 EStG for the AVD with "Variante A" for the unsubsidised
part; Abgeltungsteuer, Teilfreistellung, Sparer-Pauschbetrag, Vorabpauschale and FIFO for the ETF)
and leaves four modelling choices to the architect:

- where the tax on the Vorabpauschale is paid from, consistently with the yield;
- how the unsubsidised AVD contributions are netted against the payouts (the law text does not say);
- how the payout amount is defined (equal gross or equal net payouts) and which monthly figure is shown;
- how far the ETF tax rules are simulated (lots, FIFO, the 1/12 rule, the year of inflow).

These choices fix the oracle numbers of every later story that touches the payout phase, so they
are costly to change.

## Options considered

Vorabpauschale tax:

1. **Paid from outside the depot (Verrechnungskonto), counted as a tax of the ETF** (chosen) – what
   German banks do; taxes never touch the depot, so the depot value, the payout plan and the sales
   are independent of every tax rule and of the Pauschbetrag checkbox.
2. **Taken from the depot by selling units** – no money from outside, but every forced sale realises
   a gain that is taxed again (a small fixed point), and the ETF depot at payout start would depend on
   the checkbox.

Unsubsidised AVD part (Variante A):

1. **Net the unsubsidised contributions over the whole plan in equal shares** (chosen) – each of the n
   payouts is taxed on max(0, payout − B_U / n), where B_U is the sum of the unsubsidised
   contributions. With one flat rate, the total tax is t · max(0, gross − B_U); the subsidised part
   is taxed fully and the unsubsidised part on its gain, whatever split of the depot is assumed. No
   second balance has to be tracked.
2. **Track a separate unsubsidised sub-balance and use a proportional cost basis per payout** –
   closer to how a provider might book it, but it needs a second compounding loop and a rule for
   which contribution of a year is the unsubsidised one; with a flat rate it gives the same total tax
   whenever the unsubsidised part has no loss.
3. **Net the contributions first (payouts tax-free until B_U is used up)** – same total, but the net
   monthly payout jumps once, which makes the shown monthly figure harder to explain.

Payout amount:

1. **Equal gross payouts (annuity on the depot value, end of month)** (chosen) – the depot empties
   exactly at 85 with the same net return; taxes are computed on top. For the AVD the net payout is
   then equal every month; for the ETF it varies (Pauschbetrag per year, FIFO gains), so the UI
   shows the average net payout per month (net total ÷ number of payouts).
2. **Equal net payouts** – needs the tax of every month inside the payout formula (a fixed point per
   month for the ETF), and the depot would no longer empty with a closed-form payout.

ETF tax rules:

1. **Lot per monthly contribution, FIFO by units, Vorabpauschale per lot with the 1/12 rule, inflow in
   the following year** (chosen) – the law as quoted in the story; at most 624 lots and 240 payouts,
   well below a millisecond per render. The yearly Pauschbetrag makes FIFO matter: for age 30 to 65,
   50 EUR, 5 %, 1 % costs the tax is 774,87 EUR with FIFO and 521,75 EUR with average cost.
2. **Average cost and Vorabpauschale without the 1/12 rule** – simpler, but contradicts the law text
   the story quotes and moves the AC8 tax by about 100 EUR.

## Decision

- **Payout phase (both depots):** n = 12 · (85 − payout start) payouts at the end of each month,
  starting with the month after payout start; the remaining balance earns the saving phase's net
  return. Payout multiple M = n · (g − 1) / (1 − g^−n) with g = (1 + net rate)^(1/12), computed with
  `log1p`/`expm1`; M = 1 when the net rate is exactly 0. Gross payouts = round(depot at payout start
  in cents · M) for both depots, where the depot value is the reported (rounded) one.
- **AVD tax:** B_U = Σ per saving year of the unsubsidised contribution u(n), where c(n) is the year's
  contribution including a reinvested refund (ADR 0008): u(n) = c(n) if c(n) < 120 EUR (no Zulage,
  no deduction, so nothing is subsidised), else c(n) − min(c(n), 1.800 EUR). A reinvested refund is
  therefore unsubsidised exactly as far as it lifts c(n) above 1.800 EUR. Tax = round(t_retirement ·
  max(0, depot · M − B_U)), unrounded inside. A loss of the unsubsidised part reduces the taxable
  amount of the subsidised part (one income type, § 22 Nr. 5 EStG); a negative total is not taxed
  and not set against other income. **Assumption, not clarified by the BMF.** The Sparer-Pauschbetrag
  never applies to the AVD.
- **ETF:** one lot per monthly contribution (bought at the end of its month, at price g^t). Calendar
  year = saving year (ADR 0008), payout year k starts on 1 January after payout start. Per year y and
  unit held at the end of y: Vorabpauschale = max(0, min(price(start of y) · 3,20 % · 0,7,
  price(end of y) − price(start of y))), times (13 − j) / 12 for a lot bought in month j of y; it
  counts as income of year y + 1 (§ 18 Abs. 3 InvStG). Payout k sells the fraction
  (g − 1) / (g − g^(1−r)) of the remaining units (r = remaining payouts, the last sells everything),
  oldest lot first; gain = units · (price − purchase price − Vorabpauschalen of these units). Income of
  a year = Vorabpauschale received + gains (losses netted within the year, never carried forward);
  tax = 26,375 % · max(0, 0,7 · income − Pauschbetrag), Pauschbetrag 1.000 EUR while the checkbox is
  checked, else 0. Taxes are paid from outside the depot (Vorabpauschale) or withheld from the
  payout (sales); neither changes the depot.
- **Result per depot:** net payouts = gross − all taxes of the depot (for the ETF including the tax on
  the Vorabpauschale paid from outside, in the saving and the payout phase); yield = net − own
  contributions + kept refunds; kept refunds (AVD only) = Σ refunds − Σ reinvested refunds (all
  refunds while 015's checkbox is off; the last year's refund plus any part above the 6.840 EUR cap
  while it is on). Monthly net payout = round(net ÷ n), an average. Difference = AVD yield − ETF yield.
- **Money:** integer cents at every module boundary; inside, floats; each reported total is rounded
  once (gross, tax, saving-phase tax, depot); net, yield, difference and the payout-phase tax are
  derived from rounded values, so every shown "a − b = c" holds exactly.

## Consequences

- Taxes never feed back into a depot: the 013–015 figures are untouched by construction, the ETF depot
  at payout start is the same in both checkbox states, and the payout plan of each depot is a closed
  form of its start value.
- The AVD tax is t times one non-negative amount, so it is monotone in the retirement rate and needs no
  per-month simulation; the netting rule only changes how the tax is spread over the months, not the
  total, as long as the rate is flat. A progressive retirement tax, a Grundfreibetrag or a 30 % lump sum
  would make the spread matter and need this ADR revisited.
- The ETF depot is inside the model the unrounded sum of its lots; its gross payouts start from the
  rounded value like the AVD's. The two can differ by up to M cents (about 2 cents at 20 %), which no
  figure shows; in return the AVD and ETF gross payouts are identical whenever the two depots are.
- The oracle numbers depend on the rules above: dropping the 1/12 rule or taxing the Vorabpauschale in
  its own year moves the ETF tax of the AC8 setup from 43.977,43 EUR to 43.876,93 or 43.713,68 EUR;
  average cost instead of FIFO leaves that case unchanged but moves others by up to 253 EUR.
- Not modelled (stated in the UI note): inflation, church tax and the Günstigerprüfung for the ETF, joint
  assessment, the 30 % lump sum, a life-long pension, the 80 % rule and 3-year recalculation of the
  payout plan, health and care insurance contributions on AVD payouts, loss carry-forward, the time
  value of taxes and refunds (all counted nominally).
- Amends [ADR 0007](0007-avd-projection-model-and-svg-chart.md) and
  [ADR 0008](0008-avd-yearly-contribution-schedule-with-reinvested-refund.md) only by reading from
  them: `project()` exports its net-rate expression and is otherwise unchanged; the schedule's c(n) is
  the base of the unsubsidised part.
