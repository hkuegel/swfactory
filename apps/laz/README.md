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
