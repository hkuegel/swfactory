# App `laz`

An app on the software factory's platform, created from `templates/app` by `/new-app`.
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

The writer needs a write mode. `--full` writes the whole table from all seven funds, and `--frozen` writes
nothing: it compares its result with the committed file and names each difference. `--full` compares first
and refuses to write when the fund identity does not fit the committed file, so a run that cannot verify its
result leaves the file as it is. CI runs the live part as a `--frozen` step after the publish, and the
checks step names its test mode (`VITE_TEST_MODE=local`) and its fund data (`LAZ_FUND=fixture`), so a CI run
reads stored data and never the source.
