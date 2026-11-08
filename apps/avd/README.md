# Altersvorsorgedepot calculator (`avd`)

An app on the software factory's platform. It projects the saving phase of an
Altersvorsorgedepot with state subsidy (Zulagen). It shows the value at payout start and
how much of it comes from your own contributions, the Zulagen and the returns. It also shows
the tax refund from the Günstigerprüfung. The refund stays apart from the depot, unless you
choose to reinvest it. It also compares the result with a normal ETF depot with the same monthly
rate, both paid out until age 85. Sign-in, app shell and design tokens come from `@swfactory/platform`.
See the [root README](../../README.md) for the setup, Google sign-in and the factory workflows.

The app speaks German and uses German number formats, for example `22.256,44 €`.

## Running the app

Run these commands in the repo root. Set up the project first, as described in
[Getting started](../../README.md#getting-started).

```bash
npm run dev -w apps/avd
```

This starts the dev server on http://localhost:5173. Run one dev server at a time: every
app uses port 5173, which is the port the Google OAuth origins expect.

Sign in first. The calculator appears after sign-in. To sign in without a Google account,
use **Sign in as guest** on the login screen. The button appears only in the dev server and
in the e2e tests.

```bash
npm run test:e2e -w apps/avd
```

This runs the e2e tests of this app and the platform's sign-in specs against the app. It uses
the fake sign-in, so you need no Google client ID.

```bash
npm test -w apps/avd
```

This runs the unit tests of this app.

```bash
npm run verify -w apps/avd
```

This runs the platform's checks, then this app's typecheck, lint, format check, unit tests,
build and dist check.

## What the app does

Enter your values in the form. The result, the yearly table and the chart update as you
type. You don't submit anything. Nothing is saved: a reload starts again with the default
values.

### Inputs

The default value is in brackets.

- **Alter heute** (40): whole years, 18 to 69.
- **Auszahlungsbeginn (Lebensjahr)** (65): whole years, 65 to 70. It must be later than
  your age.
- **Monatlicher Beitrag** (150 €): 0 to 570,00 € per month, at most two decimals.
- **Kinder mit Kindergeld** (0): whole number, 0 to 10. The number applies to the whole
  saving period.
- **Erwartete Rendite pro Jahr** (5 %): -10,00 to 20,00 % per year, before costs. Type the
  minus sign as a hyphen.
- **Kosten pro Jahr** (0,5 %): 0,00 to 1,00 % per year. 1,00 % is the cap for the
  Standarddepot.
- **Grenzsteuersatz** (30 %): your marginal income tax rate, 0,00 to 50,00 %, at most two
  decimals. Enter one combined rate that includes the Solidaritätszuschlag and the
  Kirchensteuer, for example `42` for 42 %. Without the checkbox below, the rate changes only
  the tax refund, not the depot figures. With the checkbox ticked, it also changes the
  reinvested refund and so the depot figures.
- **Steuersatz im Ruhestand** (20 %): your income tax rate in retirement, 0,00 to 50,00 %, at
  most two decimals. It changes only the comparison with the ETF depot. Enter one combined rate
  that includes the Solidaritätszuschlag and the Kirchensteuer, as for the Grenzsteuersatz.

Below the inputs is the checkbox **Steuererstattung wieder anlegen**. It is not ticked by
default. Ticked, the tax refund of each saving year is paid into the depot on 1 January of
the following year, up to the yearly limit. The rules are described under
[Reinvested tax refund](#reinvested-tax-refund). The checkbox is not a text field. It never
shows an error.

Below the tax rate in retirement is the checkbox **Sparerpauschbetrag (1.000 €/Jahr) für dieses
Depot nutzen**. It is ticked by default. Ticked, the ETF depot may use the yearly allowance of
1.000 € on its capital income, in the saving and the payout phase. Unticked, the ETF depot uses
no allowance, for example because other capital income already uses it. The Altersvorsorgedepot
never uses it, because its payouts are not capital income. The checkbox changes only the ETF
figures in the comparison.

If a field is empty, not a number or out of range, its error names the field and the
allowed range. The page then shows no result, comparison, table or chart until every field is valid.
The checkbox keeps its state while a field is invalid.

### Result

The result shows four depot figures, or five while the tax refund is reinvested:

- **Eigene Beiträge**: your own contributions until payout start.
- **Zulagen gesamt**: all state Zulagen credited until payout start.
- **Reinvestierte Steuererstattung**: the tax refund that is paid into the depot. It is shown
  only while the checkbox is ticked. It is not part of your own contributions.
- **Erträge**: the returns after costs. They can be negative.
- **Endwert**: the balance at payout start. It is the sum of the figures above.

Below the figures, the app shows the Zulage per year. If you are under 25 at the start, it
also shows the one-time Berufseinsteigerbonus and the Zulage of the first year. While the
checkbox is ticked, the Zulage per year can differ between the saving years. Then the figure
shows the lowest and the highest value as `{min} bis {max}`, with the note
`je Jahr verschieden, wegen der Wiederanlage`.

The **Jahrestabelle** has one row per saving year. It shows the age, the cumulative
contributions, Zulagen and returns, and the balance at the end of the year. While the
checkbox is ticked, it also has the column **Wieder angelegt**. It shows the reinvested refund
added up to that year. It sits between **Zulagen gutgeschrieben** and **Erträge**. The column
**Steuererstattung** shows the tax refund of each saving year. It is not cumulative. It is not
part of the balance, even when the refund is reinvested.

The **Verlauf des Kontostands** chart shows the same parts as stacked bars, one bar per year.
The parts differ by pattern as well as by colour: contributions are solid, Zulagen are
striped, returns have an outline. Negative returns have a dashed outline. While the checkbox
is ticked, the reinvested refund is a fourth part with heavy stripes inside a frame. It is
listed as **Reinvestierte Steuererstattung** in the legend. The chart has a text alternative
with the end value and the payout start. The table gives the same numbers as text. Without the
checkbox, the chart does not show the tax refund.

### Tax refund

Below the Zulage details, the app shows the tax refund in a group. Without the checkbox, the
group is headed **Vom Finanzamt erstattet, nicht im Depot**. With the checkbox ticked, it is
headed **Vom Finanzamt erstattet, teils wieder angelegt**. Without the checkbox, the group is
not part of the depot and not part of the end value. With the checkbox ticked, the reinvested
part is part of the depot and the end value, and the rest of the group is not. The group shows:

- **Steuererstattung pro Sparjahr**: the refund of one saving year without the bonus. While
  the checkbox is ticked, the years can differ. Then the value is a range `{min} bis {max}`,
  with the note `je Jahr verschieden, wegen der Wiederanlage`.
- **Steuererstattung im 1. Sparjahr**: the refund of the first saving year. It appears only
  with the Berufseinsteigerbonus.
- **Steuererstattung gesamt**: the sum of the refunds of all saving years.
- **Eigene Beiträge nach Erstattung**: your own contributions minus the total refund. This is
  what your saving costs you after the tax refund. It is shown only while the checkbox is not
  ticked.

If the total refund is 0 €, for example at a low rate or with contributions below 120 € per
year, the figures show `0,00 €` and the app says that there is no additional refund. The rule
is described under [Tax refund rule](#tax-refund-rule).

### Reinvested tax refund

With the checkbox **Steuererstattung wieder anlegen** ticked, the tax refund of a saving year
goes back into the depot. The rules are:

- The refund of saving year n is paid into the depot on 1 January of year n + 1, before that
  year's first monthly contribution. From then on it earns the same net return as your other
  money.
- The reinvested refund counts as your own contribution of year n + 1. It raises that year's
  contributions for the Zulage and for the deduction of the tax refund. The app assumes that
  any payment into the depot counts as a contribution. This is a model assumption and is not
  checked against the law text.
- The yearly limit of 6.840 € applies to your own contributions plus the reinvested refund. If
  the limit would be exceeded, only the part up to the limit is reinvested. The rest stays
  with you.
- The refund of the last saving year is not reinvested. It is paid out after payout start,
  when no payment into the depot is possible. It stays with you.
- The refund of each year is calculated with the rule under [Tax refund rule](#tax-refund-rule),
  using the contributions of that year, including the reinvested refund.

The app does not model a different payment date, a share of the refund or a side depot.

### Comparison with an ETF depot

Below the result, the app compares your Altersvorsorgedepot with a normal ETF depot. Both
depots get the same monthly contribution, the same return and the same costs. The ETF depot
gets no Zulage and no tax refund.

Both depots are paid out in equal monthly payouts from payout start until age 85. That is 240
payouts from age 65, or 180 from age 70. The balance that is left keeps earning the same net
return. The comparison uses the yield after tax: the net payouts, minus your own contributions,
plus the tax refunds that stay with you. The yield can be negative.

For each depot, the comparison shows:

- **Depotwert bei Auszahlungsbeginn**: the value at payout start.
- **Steuern gesamt**: all taxes. For the ETF depot, **Davon in der Ansparphase** shows the part
  paid during the saving phase.
- **Ausgezahlt nach allen Steuern** and **Netto-Auszahlung pro Monat (Durchschnitt)**. The ETF payouts
  differ from month to month, so the monthly figure is an average.
- **Eigene Beiträge**: your own contributions.
- **Steuererstattung außerhalb des Depots** (AVD only): the tax refunds that stay with you.
- **Ertrag nach Steuer**: the yield after tax.

The difference **Unterschied (AVD minus ETF)** shows which depot is ahead in this model. A minus
sign means that the ETF depot is ahead. The comparison is a summary only. It has no yearly table
and no chart.

The comparison rests on these assumptions. They are model assumptions, not checked against the
law text. The app does not give tax advice.

- **Altersvorsorgedepot:** the payouts are taxed at the tax rate in retirement that you enter.
  Contributions above 1.800 € per year are not subsidised. Their payouts are taxed only on the
  gain. **Annahme, noch nicht durch BMF geklärt**: the BMF has not yet confirmed this rule. The
  app shows this note next to the AVD figures. The rules are described in
  [ADR 0009](docs/adr/0009-avd-payout-phase-and-etf-tax-model.md).
- **ETF depot:** taxed with 26,375 % (25 % Abgeltungsteuer plus 5,5 % Soli, no Kirchensteuer).
  30 % of the gains are exempt (Teilfreistellung). A Vorabpauschale is taxed as income each year,
  with a Basiszins of 3,20 % in all years. The tax on it is paid from outside the depot, so it
  reduces your yield. Losses are not carried forward. Sold units are the oldest units first.
  The Sparerpauschbetrag applies while its checkbox is ticked.
- **Both depots:** the same monthly contribution, return and costs. Tax refunds that stay with
  you count without a return to the AVD yield.
- **Not modelled:** inflation, church tax for the ETF depot, joint assessment, the 30 % lump sum
  at payout start, a life-long pension, the Günstigerprüfung of the Abgeltungsteuer, and health
  and care insurance contributions on AVD payouts.

### Example

Age 57, payout start 65, 150 € per month, no children, return 5 %, costs 0,5 %. The result is:

- Eigene Beiträge: 14.400,00 €
- Zulagen gesamt: 4.320,00 €
- Erträge: 3.536,44 €
- Endwert: 22.256,44 €

With a tax rate of 42 %, the tax refund is:

- Steuererstattung pro Sparjahr: 442,80 €
- Steuererstattung gesamt: 3.542,40 €
- Eigene Beiträge nach Erstattung: 10.857,60 €

The same inputs with the checkbox **Steuererstattung wieder anlegen** ticked, and a tax rate of
42 %, give:

- Eigene Beiträge: 14.400,00 €
- Zulagen gesamt: 4.320,00 €
- Reinvestierte Steuererstattung: 3.099,60 €
- Erträge: 4.143,81 €
- Endwert: 25.963,41 €

The refund is 442,80 € in each saving year, 3.542,40 € in total. The refunds of years 1 to 7
are reinvested, 3.099,60 € in total. The refund of the last saving year, 442,80 €, is not
reinvested. The four parts add up to the end value. The end value is higher than without the
checkbox, 22.256,44 €. The line **Eigene Beiträge nach Erstattung** is not shown while the
checkbox is ticked.

### Rules and calculation

The app uses the rules for the state subsidy from the law as adopted by the Bundestag
(BT-Drs. 21/4996; products from 1 January 2027). The app applies these rules. It does not
check them against the law. Compare them with the law text before you rely on a figure.

- Contributions below 120 € per year get no Zulage at all.
- Own contributions count up to 6.840 € per year (570 € per month). Zulagen do not count
  towards this limit. The reinvested tax refund counts towards it, see
  [Reinvested tax refund](#reinvested-tax-refund).
- Grundzulage: 50 % of the first 360 € of contributions per year, plus 25 % of the
  contributions between 360 € and 1.800 € per year. At most 540 € per year.
- Kinderzulage: 300 € per child per year. If your contributions are below 300 € per year,
  each child gets the amount of your contributions instead.
- Berufseinsteigerbonus: 200 € once, if you are under 25 at the start of the first year and
  contribute at least 120 € per year.
- The Zulage of a year is credited at the end of January of the following year. The app
  assumes this date. The law does not fix it. The Zulage of the last year is added to the end
  value without further returns.
- Contributions are paid in at the end of each month. The net return is
  `(1 + return) × (1 − costs) − 1` per year, and it is applied monthly.

The figures are nominal, so they don't include inflation. The depot figures don't include
taxes or contract fees beyond the yearly cost percentage. The tax refund is calculated apart
from them, under the [tax refund rule](#tax-refund-rule). The reinvested refund is the only
part of the refund that enters the depot.

### Tax refund rule

The tax refund follows the Günstigerprüfung in § 10a EStG, as amended by BT-Drs. 21/4996.
Your own contributions are deductible from income tax up to 1.800 € per year, plus the Zulage.
The Finanzamt checks whether this deduction saves you more tax than the Zulage. If it does, the
difference is refunded to you. The Zulage itself always goes into the depot.

The app applies this rule. It does not check it against the law text. Compare it with the law
text before you rely on a figure.

For each saving year, with c as your own contributions in that year, Z as the Zulage of that
year and t as your tax rate:

```text
refund = max(0, (min(c, 1.800 €) + Z) × t − Z)
```

- There is no refund if your own contributions are below 120 € per year. Contributions above
  1.800 € per year add no refund.
- Z is the Grundzulage and the Kinderzulage of the year, plus the Berufseinsteigerbonus in the
  first saving year.
- The app uses one tax rate for all saving years. It assumes that this rate applies in every
  year and that nothing else changes your tax.
- The app counts the Kinderzulage and the Berufseinsteigerbonus as Zulage in the comparison.
  This is a model assumption. The app does not check it against the law text.
- The Finanzamt pays the refund to you, about a year after the contribution. It is not paid
  into the depot, unless you tick the checkbox under
  [Reinvested tax refund](#reinvested-tax-refund). The app shows the refund in the year of the
  contribution and does not model the payment date.
- The app does not calculate your income tax. The refund is a model calculation, not tax
  advice.

### Note on the figures

Next to the result, the app states that the figures are model calculations based on the
values you enter. They are not investment or tax advice. It also states that eligibility for
the state subsidy is assumed. The app makes no buy, sell or product recommendation. For the
tax refund, it states that the model uses one constant marginal tax rate, that the Finanzamt
pays the refund to you and does not credit it to the depot, and that it is not tax advice.
With the checkbox ticked, the note says instead that the refund of each saving year is paid
into the depot on 1 January of the following year, up to the yearly limit, and that the refund
of the last saving year is not reinvested.

The comparison has its own note, next to it. It repeats the model statements and names the
assumptions of [Comparison with an ETF depot](#comparison-with-an-etf-depot).

### Not included yet

The app shows the saving phase and the comparison with a normal ETF depot. The glidepath before
payout, a yearly table or a chart of the comparison, a life-long pension and a 30 % lump sum at
payout start are not included. Reinvesting the tax refund into a side depot, choosing a share of
the refund and another date than 1 January are not included either.

### Keyboard and screen readers

Tab moves through the eight inputs and the two checkboxes, in form order, then into the table.
Each error is read as the description of its field. The end value and the total tax refund are announced
about 0,7 seconds after your last edit, not after every key press. While the checkbox is
ticked, the announcement also gives the reinvested part. Ticking or unticking the checkbox
announces its new state. While a result is valid, the announcement also gives the difference
between the two depots.

## Code layout

```text
src/main.tsx                  renders the calculator inside the platform's sign-in and shell
src/tokens.css                the app's tokens: chart colours in light and dark
src/features/saving/          the calculator
  SavingCalculator.tsx        keeps the eight input texts and the two checkboxes; derives the result, comparison, table and chart
  InputForm.tsx               the eight labelled inputs with hints and errors, and the two checkboxes
  TextField.tsx               a labelled text input with its hint and error
  CheckboxOption.tsx          a checkbox with its hint: the reinvest box and the Pauschbetrag box
  ResultSummary.tsx           figures, Zulage details, note and the live text
  PerYearValue.tsx            a per-year value: one amount, or a range with a sub-line
  TaxRefundGroup.tsx          tax refund and own contributions after it, outside the depot
  DepotComparison.tsx         the comparison with the ETF depot: two blocks and the difference
  BalanceChart.tsx            stacked bar chart (SVG) with a text alternative
  YearTable.tsx               the yearly table, with the tax refund of each year
  fieldCopy.ts                labels, hints and error texts, and the checkbox copy
  comparisonCopy.ts           texts of the comparison: assumptions, note, verdict
  useSettledValue.ts          delays the live text by 700 ms
  logic/                      pure calculation, no React
    fields.ts                 field ranges and defaults
    parseInputs.ts            input text to integers, or to errors
    schedule.ts               yearly schedule: contributions, reinvested refund, Zulage, refund
    zulage.ts                 Zulage rules for one year
    project.ts                monthly projection to yearly rows
    taxRefund.ts              tax refund per saving year and own contributions after it
    payout.ts                 payout phase: equal monthly payouts until age 85
    etfDepot.ts               ETF depot: lots, Vorabpauschale, sales and taxes
    compare.ts                AVD side, both results and the difference
    chartGeometry.ts          bar segments and axis ticks
    format.ts                 euro formatting
e2e/avd.spec.ts               one test per acceptance criterion of story 013
e2e/avd-tax-refund.spec.ts    one test per acceptance criterion of story 014
e2e/avd-reinvest.spec.ts      one test per acceptance criterion of story 015
e2e/avd-compare.spec.ts       one test per acceptance criterion of story 016
e2e/avd.helpers.ts            e2e helpers: input locators, figures, table cells
docs/backlog/                 the stories of this app
docs/adr/                     the decisions of this app
```

## Notes for developers

- Money is stored as integer cents and rates as basis points. The balance is a float only
  inside `project()`. Each reported value is rounded once. Rounding every month would give
  22.256,45 € in the example above. Don't do it.
- The yearly schedule in `logic/schedule.ts` gives the contribution, the reinvested refund, the
  Zulage and the refund of each saving year. `project()` and the tax refund both read it, so
  they can't disagree. Unchecked, the schedule has no reinvested refund, and every figure is
  the same as without the checkbox (ADR 0008).
- The tax refund is computed in `logic/taxRefund.ts` from that schedule. Unchecked, a change of
  the tax rate can't change a depot figure. Ticked, it can, because the reinvested refund is
  part of the depot.
- The refund is rounded once per saving year, half up, to the cent. The total is the sum of
  the rounded yearly amounts, not the rounded exact total.
- The Grundzulage is rounded once, half up, to the cent (ADR 0008). With the reinvested refund,
  the contribution of a year is no longer a multiple of 12 cents, so the exact value can have
  fractions of a cent.
- The reinvested refund is capped at 6.840 € minus the own contributions of the year. The
  constant is `CONTRIBUTION_CAP_CENTS` in `logic/schedule.ts`.
- Input text is parsed by string arithmetic, not with `parseFloat` or `Number`. `9,99` and
  `9.99` both give 9,99, and `1e2` is rejected.
- The chart is hand-drawn SVG. The app uses no chart library.
- The payout phase and the ETF tax model are in `logic/payout.ts`, `logic/etfDepot.ts` and
  `logic/compare.ts`. Taxes never feed back into a depot. The reasons for the rules are in
  [ADR 0009](docs/adr/0009-avd-payout-phase-and-etf-tax-model.md).
- The app has no dev-only code, so it has no `dist-check.json`.

## Backlog and decisions

- [013 – Altersvorsorgedepot saving phase with Zulagen](docs/backlog/013-avd-saving-phase-zulagen.md)
- [014 – Altersvorsorgedepot tax refund from the Günstigerprüfung (marginal tax rate)](docs/backlog/014-avd-tax-refund.md)
- [015 – Altersvorsorgedepot optional reinvestment of the tax refund](docs/backlog/015-avd-reinvest-tax-refund.md)
- [016 – Altersvorsorgedepot comparison with a normal ETF depot](docs/backlog/016-avd-etf-comparison.md)
- [ADR 0007 – pure projection module with cent rounding at the boundary, hand-drawn SVG chart](docs/adr/0007-avd-projection-model-and-svg-chart.md)
- [ADR 0008 – yearly contribution schedule before the balance loop, with the reinvested refund](docs/adr/0008-avd-yearly-contribution-schedule-with-reinvested-refund.md)
- [ADR 0009 – payout phase to 85 and the tax model of the ETF comparison](docs/adr/0009-avd-payout-phase-and-etf-tax-model.md)

The index of all stories, platform and apps, is
[`docs/backlog/README.md`](../../docs/backlog/README.md) in the repo root.
