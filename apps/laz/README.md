# App `laz`

An app on the software factory's platform, created from `templates/app` by `/new-app`. The name it
shows is **Bond ladder** (story 044): one fund per year, each fund liquidated in December, and the
money of a fund pays the phase year after it. The app id, the folder, the package name and the
published path stay `laz`, because the CI workflow, the landing page's app list and the published URL
read them.
It calculates the payout phase of a Lebensarbeitszeitkonto: the maximum monthly payout a
depot funds over a phase of the length you choose, or the depot a target monthly payout
would need. The payout per share is a projection from YTM and NAV, not a published market
value, and the app labels it as such. It speaks German and uses German number formats, for
example `181,41 €`. Sign-in, shell and design tokens come from `@swfactory/platform`.

```bash
npm run dev -w apps/laz          # dev server (port 5173)
npm run verify -w apps/laz       # platform checks + this app's typecheck, lint, tests, build
npm run test:e2e -w apps/laz     # the platform's sign-in specs plus this app's own e2e
```

App-specific design tokens go in `src/tokens.css`, stories in `docs/backlog/`, ADRs in `docs/adr/`.

The fund list in `src/features/plan/data/fund-list.json` is written by `scripts/write-fund-list.mjs`,
not fetched by the app. Its default mode reads stored responses, so a test run never reaches the
network; live mode is an explicit `--mode=live`, run from the command line or from the workflow's
Run workflow button, which commits the file. The run date is an argument of the writer, not a clock
read. The app's own tests read a fixture copy of the file, so a refresh cannot move an expected
value.

The writer needs a write mode. `--full` writes the whole table from all nine funds (story 035 extends it to
the funding years of the phase boundaries, 2027 through 2035), and `--frozen` writes nothing: it compares its
result with the committed file and names each difference. `--full` compares first and refuses to write when the
fund identity does not fit the committed file — a fund the file does not have yet is an addition and fits, a
committed fund the run did not read does not — so a run that cannot verify its result leaves the file as it is.
CI runs the live part as a `--frozen` step after the publish, and the checks step names its test mode
(`VITE_TEST_MODE=local`) and its fund data (`LAZ_FUND=fixture`), so a CI run reads stored data and never
the source.

The fund table names the fund each row is: `Fondsname` and `ISIN` as the data file stores them, and the column that
shows the net asset value per share is named `Kurs` (story 036, hak's word of 2026-11-14). The row header stays the
fund's year, and nothing is formatted for these two columns. The copy of the table's columns lives in
`src/features/plan/fieldCopy.ts`, which the UI and the tests read as the same strings. Story 044 states the rule the
input cells share once, as the footnote below the table (`COPY.fundFootnote`), instead of printing it in every cell:
a copy can have no `hint` of its own, and `TextField` renders no hint paragraph then. Each input still keeps its
visually hidden label of field and year, because a column header cannot name a control inside a cell, and the
override marker is still the description of its own input.

Story 045 adds the flat rate for accumulating funds (Vorabpauschale, § 18 InvStG) as a term-constant parameter
in the tax block, prefilled with `2,24` % (70 % × the Basiszins of 2026) and counted only when capital gains tax
is checked. The base of a calendar year is the value at the start of that year times the rate, capped by the
year's actual increase and floored at 0; asOf's own year counts with the whole months before its month; the year
of liquidation does not count. The fund table's column `Pauschalsteuer über die Haltedauer in Euro` shows each
fund's payment, the fund section states the sum once, and the searched depot includes the payments, because they
come from the settlement account and the fund's own value is not reduced. The tax at liquidation reads the gain
minus the bases already taxed, so no base is taxed twice (ADR 0015). Every dash in the new column names its
reason; the strings are in `src/features/plan/fieldCopy.ts` as the rest of the copy is.

Story 046 adds the option to park the monthly payout on a deposit account for the months of one phase year.
It is its own block in the form, not inside the tax block, with a checkbox and the rate as a field prefilled
with `2,50` %, and the rate stays the same over the whole term. A year's interest is the monthly target times
the rate times the average of the balances that wait at the start of each month, `m(m + 1) / 24` year units, so
a full year is 6,5 units. In the tax case that interest is taxed at the Zufluss with the existing tax
parameters, and the net interest is what the plan keeps and what reduces the money the plan needs.
The year table shows the interest in the column `Zinsen über das Phase-Jahr in Euro` and the tax on it in
`Steuer auf die Zinsen in Euro`, the year section states both sums once, and each dash names its reason.
The money that waits is the year table's existing amount column: the payout of the months of that year minus
the net interest, and the shares follow that money (ADR 0016). The parked money is not a part of the depot, so
story 032's money rule and its parts are unchanged. With the option off, or with the rate 0, nothing is
calculated anywhere and the figures of stories 024, 032 and 045 are the same as before.
