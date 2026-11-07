# Altersvorsorgedepot calculator (`avd`)

An app on the software factory's platform. It projects the saving phase of an
Altersvorsorgedepot with state subsidy (Zulagen). It shows the value at payout start and
how much of it comes from your own contributions, the Zulagen and the returns. Sign-in, app
shell and design tokens come from `@swfactory/platform`. See the
[root README](../../README.md) for the setup, Google sign-in and the factory workflows.

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

If a field is empty, not a number or out of range, its error names the field and the
allowed range. The page then shows no result, table or chart until every field is valid.

### Result

The result shows four figures:

- **Eigene Beiträge**: your own contributions until payout start.
- **Zulagen gesamt**: all state Zulagen credited until payout start.
- **Erträge**: the returns after costs. They can be negative.
- **Endwert**: the balance at payout start. It is the sum of the three figures above.

Below the figures, the app shows the Zulage per year. If you are under 25 at the start, it
also shows the one-time Berufseinsteigerbonus and the Zulage of the first year.

The **Jahrestabelle** has one row per saving year. It shows the age, the cumulative
contributions, Zulagen and returns, and the balance at the end of the year.

The **Verlauf des Kontostands** chart shows the same three parts as stacked bars, one bar
per year. The parts differ by pattern as well as by colour: contributions are solid, Zulagen
are striped, returns have an outline. Negative returns have a dashed outline. The chart has a
text alternative with the end value and the payout start. The table gives the same numbers as
text.

### Example

Age 57, payout start 65, 150 € per month, no children, return 5 %, costs 0,5 %. The result is:

- Eigene Beiträge: 14.400,00 €
- Zulagen gesamt: 4.320,00 €
- Erträge: 3.536,44 €
- Endwert: 22.256,44 €

### Rules and calculation

The app uses the rules for the state subsidy from the law as adopted by the Bundestag
(BT-Drs. 21/4996; products from 1 January 2027). The app applies these rules. It does not
check them against the law. Compare them with the law text before you rely on a figure.

- Contributions below 120 € per year get no Zulage at all.
- Own contributions count up to 6.840 € per year (570 € per month). Zulagen do not count
  towards this limit.
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

The figures are nominal, so they don't include inflation. They don't include taxes or
contract fees beyond the yearly cost percentage.

### Note on the figures

Next to the result, the app states that the figures are model calculations based on the
values you enter. They are not investment or tax advice. It also states that eligibility for
the state subsidy is assumed. The app makes no buy, sell or product recommendation.

### Not included yet

The app shows only the saving phase. Taxes, the payout phase, the comparison with an ETF
depot and the glidepath before payout are not included.

### Keyboard and screen readers

Tab moves through the six inputs and then into the table. Each error is read as the
description of its field. The end value is announced about 0,7 seconds after your last edit,
not after every key press.

## Code layout

```text
src/main.tsx                  renders the calculator inside the platform's sign-in and shell
src/tokens.css                the app's tokens: chart colours in light and dark
src/features/saving/          the calculator
  SavingCalculator.tsx        keeps the six input texts; derives the result, table and chart
  InputForm.tsx               the six labelled inputs with hints and errors
  ResultSummary.tsx           figures, Zulage details, note and the live text
  BalanceChart.tsx            stacked bar chart (SVG) with a text alternative
  YearTable.tsx               the yearly table
  fieldCopy.ts                labels, hints and error texts
  useSettledValue.ts          delays the live text by 700 ms
  logic/                      pure calculation, no React
    fields.ts                 field ranges and defaults
    parseInputs.ts            input text to integers, or to errors
    zulage.ts                 Zulage rules for one year
    project.ts                monthly projection to yearly rows
    chartGeometry.ts          bar segments and axis ticks
    format.ts                 euro formatting
e2e/avd.spec.ts              one test per acceptance criterion
docs/backlog/                 the stories of this app
docs/adr/                     the decisions of this app
```

## Notes for developers

- Money is stored as integer cents and rates as basis points. The balance is a float only
  inside `project()`. Each reported value is rounded once. Rounding every month would give
  22.256,45 € in the example above. Don't do it.
- Input text is parsed by string arithmetic, not with `parseFloat` or `Number`. `9,99` and
  `9.99` both give 9,99, and `1e2` is rejected.
- The chart is hand-drawn SVG. The app uses no chart library.
- The app has no dev-only code, so it has no `dist-check.json`.

## Backlog and decisions

- [013 – Altersvorsorgedepot saving phase with Zulagen](docs/backlog/013-avd-saving-phase-zulagen.md)
- [ADR 0007 – pure projection module with cent rounding at the boundary, hand-drawn SVG chart](docs/adr/0007-avd-projection-model-and-svg-chart.md)

The index of all stories, platform and apps, is
[`docs/backlog/README.md`](../../docs/backlog/README.md) in the repo root.
