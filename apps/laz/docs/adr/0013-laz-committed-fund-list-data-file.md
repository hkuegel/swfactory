# 0013 – Lebensarbeitszeitkonto: the committed fund list is read as a build-time import, not fetched

- **Status:** accepted
- **Date:** 2026-11-13
- **Story:** apps/laz/docs/backlog/024-laz-ibonds-phase-plan.md

## Context

Story 024 reads market data (NAV, weighted average YTM, weighted average maturity, shares
outstanding, asOf) from a data file committed in the repo, not from a runtime network request, and
the app runs as a guest on GitHub Pages under a URL base (`/swfactory/laz/`). A refresh script is a
separate devops story that will write this file, so its location, shape and the way the app reads
it are a contract between two stories and are costly to change afterwards. BlackRock publishes no
public developer API, and the product-data endpoint probe carried no
`access-control-allow-origin`, so a browser app on GitHub Pages could not rely on a runtime fetch
even if AC6 allowed one.

## Options considered

1. **A committed JSON file imported as an ES module** (chosen) — plain data that a writer script
   can produce without parsing code, one shape for the writer and the app, no runtime request: the
   values are part of the bundle, so AC6's "no network request of its own" holds on the published
   build as well as on the dev server. Needs `resolveJsonModule` in the app's `tsconfig.app.json`.
2. **A static file in `public/` read with `fetch()` at runtime** — keeps the app bundle smaller and
   the file independently refreshable, but it is a runtime network request, which AC6 and the
   original request forbid, and the base path plus the missing CORS header make it fragile.
3. **The fund list as TypeScript constants inside `logic/`** — no tooling change and full type
   checking at compile time, but then the writer script would have to generate code, and the data
   contract would be a code contract, which is what the devops story should not own.

## Decision

The fund list lives at `apps/laz/src/features/plan/data/fund-list.json`: one object with a `funds`
array, one entry per maturity year 2028–2034, fields `year`, `isin`, `name`, `navMicroEur` (integer
micro-euro, 1 = 0,000001 EUR, so the source's own precision is stored without rounding),
`ytmBp` (integer basis points), `avgMaturityHundredths` (integer hundredths of a year, as the source
publishes it), `sharesOutstanding` (integer), `asOf` (ISO calendar date, **one value for the whole
file**, the run date given to the writer script, not one per fund, so the UI shows a single date for
every row). Dates are ISO `YYYY-MM-DD` calendar dates; money is integer cents for depot and phase
amounts and integer micro-euro for a per-share price, so no float parsing anywhere. The app
reads it through an import, never a fetch.

The units were amended by story 025 (2026-11-13, hak): the source publishes NAV with six decimals
(measured 2026-11-13: `5.113521`) and average maturity as a number of years, and integer cents in the
file would have rounded inside the data, which ADR 0012 reserves for the display. Micro-euro is the
smallest unit that stores the source's value as an integer. The first answer to this question was price
basis points, measured against the four-decimal copy of the fund summary; the unrounded value in the
page's data blob carries six decimals, so the unit was corrected to micro-euro before any code used the
old unit. `avgMaturityHundredths` and `sharesOutstanding` are display-only fields and no app element
reads them yet.

Values the tests compute against are read from a fixture copy
(`apps/laz/src/features/plan/data/fund-list.fixture.json`), not from the refreshed file, so a refresh
cannot move a hand oracle; in `--mode e2e` the app's Vite config aliases the data file to that copy.

There is no runtime validation of the file: it is committed repo data, not untrusted input, so a
malformed file is a build failure, and the writer script's own checks belong to the devops story.

## Consequences

- The schema is fixed for the writer script: micro-euro, basis points, hundredths of a year and ISO
  dates as integers and strings; a later field rename means recomputing the hand oracles in story 024
  (they read the fixture values directly).
- The e2e test of AC6 asserts that every request is same-origin, which is true only because the
  data is bundled; if a later story wants a runtime read of the file, that needs a new ADR and a
  change of AC6.
- The UI shows `asOf` from the file (AC5), so a refresh changes the shown date without any code
  change. Since story 025 the tests read the asOf from the fixture copy the app is built with in
  `--mode e2e`, and the hand value is pinned to that copy; a refresh of the real file cannot falsify
  the assertion. `asOf` is the writer's run date: the source can stamp NAV and YTM with different
  dates, and the file states only the run date, which is documented here rather than stored per field.
- The ISO form stays the file's storage format only: the UI types the phase dates in the German
  form (`TT.MM.JJJJ`) and renders dates through `formatDate` (`de-DE`), so the parser converts the
  German input to `YYYY-MM` months and the file never stores a German date. Changing this would
  break both the writer script and AC5's "the shown asOf equals the asOf in the data file".
- The values are fixture values, not hak's actual positions: the ISINs of his holdings are still
  open (Open question 1), so the tests must keep computing against the file, not against a live
  source.
