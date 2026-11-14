---
id: 025
title: Fund list data-file writer (devops), triggered from the UI, tested in fixture mode
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: chore # feature | bug | chore
app: laz # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<app name>/docs/backlog)
branch: feature/025-laz-fund-list-writer
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [] # stories whose behaviour this one modifies, e.g. [004/AC2, 007]
superseded-by: # set on the OLD story when a newer one replaces it
---

# 025 – Fund list data-file writer (devops), triggered from the UI, tested in fixture mode

## Original request

> "ok, wie geht's weiter ? mit den fetch der ETF Daten ?"

> "such nach der besten frei verfügbaren Quelle. tagesaktuell/bzw. vom Vortag reicht. Sollte über die
> UI triggerbar sein"

> "ISINs sind bekannt. Recherchiere im Internet nach den entsprechenden ishares ibonds EUR ETFs"

## User story

As the owner of the `laz` app, I want the committed fund list to be refreshed from a source I can
trigger from the UI, so that the projection in story 024 uses the current market values of my funds
instead of the hand-picked fixture values, without the app itself ever making a network request.

## Context

- Story 024 established the contract this story writes to: `apps/laz/src/features/plan/data/fund-list.json`
  is a committed data file read as a build-time import, never fetched (ADR 0013). The writer is the
  other half of that contract and was named here as a separate devops story (024, Context item 5 and
  Open question 5).
- The app does not change in this story. It keeps its access profile (guest sign-in, no storage write,
  no runtime network request, 024 AC6) and its projection rule (ADR 0012). This story only produces
  the file the app reads.
- The writer runs where a process can make a request: a Node script on hak's machine, or a GitHub
  Actions job. It cannot run as a browser fetch, see "Measured facts" below.
- Devops owns `scripts/`, `package.json` scripts and `.github/workflows/` (CLAUDE.md, Roles). The writer
  script is `scripts/write-fund-list.mjs`; the parsing part is exercised by tests that run in fixture
  mode (stored responses), never against the live site.

### Business rules confirmed by hak (2026-11-13, see Decision log)

1. **Source**: the iShares (BlackRock) fund page for each ISIN, parsed by the Node script. It is the
   only free source found that carries all four values the app needs.
2. **Freshness**: current day or the previous trading day is enough.
3. **Trigger**: from the UI. Since a browser fetch to the source is not possible, the UI trigger is the
   GitHub Actions `workflow_dispatch` button for this story's own workflow — the pattern CI already
   uses (ADR 0010, `.github/workflows/ci.yml`).
4. **Data is not committed by the app**: the file is written by the writer and committed as a repo
   change (who commits exactly is Open question 1).
5. **Tests use stored responses**, not live data, and the app's hand oracles read a separate fixture
   copy so a refresh does not move them (024's oracle values were computed from the fixture).

### The fund list for this story (ISINs, EUR Corporate UCITS iBonds, as researched 2026-11-13)

| Maturity year | ISIN (accumulating) | Product page id |
| ------------- | ------------------- | --------------- |
| 2028          | `IE0008UEVOE0`      | 332876          |
| 2029          | `IE000SNLFDR7`      | 338575          |
| 2030          | `IE000Y2BJVK9`      | 338576          |
| 2031          | `IE000D9WMGF0`      | 339093          |
| 2032          | `IE000I660ZF8`      | 339174          |
| 2033          | `IE000ZBGZQM8`      | 339299          |
| 2034          | `IE000UY6XF65`      | 339290          |

Every fund is the accumulating share class (hak, 2026-11-13: "immer die thesaurierenden"), so the table
lists one ISIN per year and the product page id that page resolves to. The distributing variants exist but
are not used here. No 2027 fund, which matches 024's assumption.

### Measured facts (2026-11-13, with their caveats)

- The iShares product page renders all five values in its HTML (NAV, Weighted Average YTM, Weighted Avg
  Maturity, Shares Outstanding, each with its own as-of date), so a Node script can parse them without a
  browser and without a key. Example for the 2028 fund, measured on the accumulating page (id 332876) on
  2026-11-13: NAV 5,677761 €; YTM 3,76 %; Weighted Avg Maturity 1,62; Shares Outstanding 191.664.314.
- The seven accumulating pages were fetched once on 2026-11-13 and stored as the fixture responses, each
  carrying the ISIN the table names, so live mode can read all seven funds. The first stored response was
  the distributing variant of the 2028 fund (page 331717, ISIN `IE000264WWY0`); it was replaced when hak
  answered that the accumulating class is always the one in his depot.
- That page carried **no `access-control-allow-origin` header**, so a browser app on GitHub Pages cannot
  read it. The probe ran in a context not subject to page CORS, which does not prove the browser would be
  blocked; the absence of the header is the fact this story relies on.
- Every source that carries YTM and average maturity for UCITS funds (iShares, justETF API, funddata.pro)
  either has no CORS header or needs an API key. Every source with `access-control-allow-origin: *` that
  could be probed (Twelve Data, FinancialModelingPrep, AlphaVantage, EODHD) needs a key and does not
  provide YTM or average maturity. Public CORS proxies that were probed answered without a usable CORS
  header (522/520) or required a key (401). One host could not be resolved from the probe environment, so
  its CORS behaviour is not measured.
- A key cannot be used in the app: `VITE_*` values are inlined into the public bundle (CLAUDE.md,
  Config), so a guest build would expose it and every visitor would spend the quota.

### Two schema conflicts this story must resolve before it can be designed

ADR 0013 fixes the data-file shape, and the real source does not match it in two places. Both are
Open questions, and both would reopen ADR 0013.

1. `avgMaturity` is defined as an ISO calendar date, but the source publishes a weighted average maturity
   as a number of years (1,62). Since the field is display-only and not read by the calculation, the
   change is low risk, but it is still a contract change for the writer and the UI.
2. `navCents` is defined as integer cents, but the source publishes NAV with more decimals than cents
   allow. Measured on 2026-11-13 from the unrounded value in the page's data blob: `5.113521`, i.e. six
   decimals, so the fund summary's `5,1152 €` is a rounded display of it. Storing cents would round
   inside the data file, which contradicts ADR 0012's rule that values are rounded once, at display.
   Answered as Open question 3, with the unit corrected from price basis points to micro-euro.
3. `asOf` is one value for the whole file (ADR 0013), but the source stamps NAV and YTM with different
   dates (measured: NAV 12/Nov/2026, YTM 11/Nov/2026). The file cannot state both under the current shape.

## Acceptance criteria

- **AC1:** Given a stored sample response for one fund (fixture mode) and a run date given to the writer
  as an argument, when the writer produces the values for that fund, then each value is the value printed
  in that response and no value is invented, and the file-level asOf is the run date that was given (not a
  clock read): measured against hand-pinned numbers (not against the same file the test parses), for all
  four fields, and the asOf equals the run date passed in.
- **AC2:** Given a stored response in which a required value is missing, not a number, or out of the
  range the schema allows (zero shares, non-numeric YTM), when the writer runs, then it names the fund
  and the field it could not read, writes no file, and writes no partial value; measured on three
  fixture responses, and the fixture mode is the mode these tests run in.
- **AC3:** Given the writer runs in fixture mode, when its tests run, then no network request is made:
  measured as the request list of one fixture-mode run. Live mode is only reached by an explicit command
  of hak, and CI never runs live mode, so CI stays green without a live request (P17 names the mode).
- **AC4:** Given the writer output of fixture mode, when the app is built and run as a guest, then the
  app reads the file unchanged and shows its asOf (024 AC5 still holds), and the app's oracle tests read a
  separate fixture copy, so refreshing the real file does not change their expected values; measured as
  the writer output matching the app's `Fund` interface, plus one app test that reads the fixture copy.
- **AC5:** Given this story's workflow is started from the GitHub UI, when it runs on `main`, then the
  writer runs in live mode, reports which funds it read and which it could not, and produces the file as
  the agreed outcome (commit or artifact, Open question 1); measured as the workflow steps, a CI run of
  the workflow, and one live run reported by hak.

## Out of scope

- Any runtime network request by the app, and any change to the projection rule, the tax rule or the
  rounding rule (024 and ADR 0012 stay as they are).
- Storing anything the app writes at run time (no storage write, 024 AC6).
- Historical market data, time series, charts, price history, holdings per bond.
- Automatic scheduling (a cron that runs the writer without hak triggering it), unless hak decides
  otherwise.
- Investment or tax advice, and fund selection.
- Live requests in the CI verify job; the tests in CI run in fixture mode only.

## Open questions

1. Who commits the produced file — answered 2026-11-13: the runner commits it, with a write permission in
   this story's own workflow (hak). The commit must not come from the CI verify job, so the writer runs in
   its own workflow with `contents: write`, not in the existing read-only CI job.
2. ISINs and share class — answered 2026-11-13: "immer die thesauerierenden", so the accumulating variant is
   the fund for every maturity year, and the researched table is the fund list, not a candidate list. The
   product page ids were read from those pages and are in the table in Context.
3. Price unit for NAV — answered 2026-11-13: stored as an integer in the source's own precision,
   micro-euro (5,113521 € = 5113521), so the writer does not round inside the data file and ADR 0012's
   "round once at display" keeps holding (hak). The first answer, price basis points, was based on the
   rounded four-decimal display in the fund summary; the measured blob value has six decimals, so the
   unit is micro-euro. ADR 0013 changes for this.
4. `avgMaturity` unit — answered 2026-11-13: years as the source publishes them, as a number (hak). The
   field is display-only, so no oracle of 024 changes. ADR 0013 changes for this.
5. `asOf` — answered 2026-11-13: run date of the writer, one value for the whole file, plus a documented
   rule that the individual fields can carry an earlier as-of date (hak). ADR 0013 changes for this.
6. Where the writer's tests run — answered 2026-11-13: `scripts/` is not a workspace, so a `test:scripts`
   step (vitest, node environment) is added to `verify` (hak). The architect words this as the test-run
   decision, because it changes how tests are run for a non-workspace directory.
7. Reading the iShares pages by script is not documented as permitted by their terms (no public developer
   API). Hak accepted the script path on 2026-11-13; no AC asserts the source stays readable, and the
   fixture mode is what CI relies on.

## Decision log

_Append only._

- 2026-11-13 — Q: which source? — A: "such nach der besten frei verfügbaren Quelle", tagesaktuell or the
  previous day is enough, and it must be triggerbar über die UI (hak).
- 2026-11-13 — Q: who commits the new data? — A: "über die UI triggern" (hak); the exact commit path is
  Open question 1.
- 2026-11-13 — Q: are the ISINs known? — A: yes; the researched EUR Corporate UCITS iBonds list in
  Context is the candidate list, confirmation against the depot is Open question 2 (hak).
- 2026-11-13 — Measured: the iShares product page carries NAV, Weighted Average YTM, Weighted Avg
  Maturity, Shares Outstanding and its own as-of dates, and is server-rendered, so a Node script can read
  it without a key; the response carried no `access-control-allow-origin` header, so the app cannot fetch
  it from the browser (hak accepted the script path, not a browser fetch).
- 2026-11-13 — Measured: no free source that has YTM and average maturity is usable from a browser; the
  sources with `access-control-allow-origin: *` need a key and do not carry those fields; the public CORS
  proxies that could be probed were unusable (522/520 without CORS, or 401 with a key). One host could not
  be resolved from the probe environment.
- 2026-11-13 — Decision of the orchestrator: the UI trigger is `workflow_dispatch` of this story's own
  workflow, not a button in the app, because a browser fetch to the source is not possible and a key
  cannot be put in a guest bundle. The app and 024 AC6 stay unchanged; an in-app button would have needed
  an AC6 change and was not chosen.
- 2026-11-13 — Q: fixture or live file for the tests? — A: separate fixture copy for the app's oracle
  tests, writer tests run on stored responses (hak).
- 2026-11-13 — Q: who commits the refreshed file? — A: the runner, in this story's own workflow with a
  write permission; not in the read-only CI verify job (hak).
- 2026-11-13 — Q: NAV unit, cents or the source's four decimals? — A: price basis points, so no rounding
  happens in the data file and ADR 0012 stays intact (hak). ADR 0013 changes for this.
- 2026-11-13 — Q: avgMaturity unit? — A: years as the source publishes them, as a number (hak). Display
  only, so no oracle of 024 changes; ADR 0013 changes for this.
- 2026-11-13 — Q: asOf per file or per field? — A: run date of the writer, one value for the whole file,
  with a documented rule that a field can carry an earlier as-of date (hak). ADR 0013 changes for this.
- 2026-11-13 — Q: where do the writer tests run? — A: a `test:scripts` step (vitest, node environment) is
  added to `verify`, because `scripts/` is not a workspace (hak).
- 2026-11-13 — Gate 1: story approved by hak and committed on `feature/025-laz-fund-list-writer`, opened
  from the tip of `feature/024-laz-ibonds-phase-plan` because ADR 0013 and the data file live there and
  024 is not merged yet.
- 2026-11-13 — Refinement of AC1 (orchestrator, after the asOf answer): the run date is an argument of the
  writer, so the asOf assertion can be measured without a clock; the clause "plus the as-of date of the
  response" was replaced by "the asOf equals the run date passed in", because the asOf is one file-level
  value and the response's own as-of dates are not stored (ADR 0013 as amended).
- 2026-11-13 — Correction of the NAV unit, measured before any code used it: the unrounded blob value of the
  2028 fund is `5.113521` (six decimals), where the fund summary displays `5,1152 €`. Price basis points
  would round 5113521 inside the data file, so the unit is micro-euro (`navMicroEur`). The decision log is
  append-only and the earlier entry stands as the answer as it was given; ADR 0013 and the technical design
  below are written with micro-euro.
- 2026-11-13 — Q: accumulating or distributing per fund? — A: "immer die thesauerierenden" (hak), so the
  table in Context becomes the fund list and the product page ids of those seven accumulating pages are
  measured and stored. The fixture response of the distributing 2028 page was replaced, and the committed
  data file was rewritten by the writer in fixture mode from the seven stored responses.
- 2026-11-13 — Gate 2: hak confirmed all open gates, which approves this story's Explanation and its five
  proposals (renumbered P22–P26, see the Retrospective). Story set to done, index row in the same commit.
  The live run against the site and the fund identifiers against the depot stay hak's manual checks.
- 2026-11-14 — CI round (hak, confirmed twice): the `checks` step runs the fixture/local mode, so a test run
  reads stored data, and the live part runs as its own step after the publish. The writer must run with
  `--full`; `--frozen` when the result does not fit.
- 2026-11-14 — Hak's answer to the question about `--frozen`: it is a write mode of the writer — it compares
  and writes nothing. `--full` writes the whole table from all seven funds, and a `--full` run whose result
  does not fit behaves as `--frozen`, so CI can never commit a file its own checks would contradict.
  Guard tests for this rule are in `scripts/verify.test.mjs`, as hak named.
- 2026-11-14 — Decision (orchestrator): `fits` means the fund identity — the year, the ISIN and the name —
  matches the committed file, because those are the funds hak confirmed against his depot. A market value may
  move, since a move is what a refresh run is for, so a value difference is named but still fits. The
  file-level asOf is never compared: it is the run date, and every run date differs from the previous one. A
  fund the committed file does not have, and a committed fund this run did not read, are both named as
  identity differences, so a run that read six of the seven funds cannot write over the whole table.
- 2026-11-14 — Decision (orchestrator): the two names a run is given are `VITE_TEST_MODE`, the mode of a test
  run (`local`), and `LAZ_FUND`, the fund data it reads (`fixture` or `committed`). Both are read in the app's
  own config only, because a factory or platform file may not name an app. A test run cannot name `live`:
  that is the mode of the writer's run, and the resolver refuses it.
- 2026-11-14 — Decision (orchestrator): a change to a committed data file is answered as a full run, so the
  structure gate is planned for the writer's commit; the mapping reads this as data, not as an app name.
- 2026-11-14 — Status: set back to `in-review` for the CI round, because the round's rules — the definition
  of `fits`, the two names a run is given, and the write gate — are the orchestrator's decisions and need
  hak's gate 2. The index row is changed in the same commit.
- 2026-11-14 — Gate 2 (hak, 2026-11-14): approved, everything as reported — the definition of `fits`, the two
  names, the write gate, the data-file mapping rule, the observed runs and the mutation checks. The open
  choice from the CI finding is answered by stating reality: the comment in `ci.yml` now names what GitHub
  does, because a queued run in the same concurrency group is cancelled whatever `cancel-in-progress` says,
  so the promise that a main run is never cancelled holds only for a run that has started. With the gate, the
  four pending proposals were approved: P27 in `CLAUDE.md`, P28 in the developer rules, P29 and P30 in the
  tester rules. Story set to done, index row in the same commit.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: not applicable beyond the workflow run; no UI in the app changes in this story._

## Technical design

_architect (2026-11-13):_

### Data-file shape (ADR 0013 as amended by this story)

```ts
// apps/laz/src/features/plan/logic/fund.ts — the record the app reads and the writer produces.
// Units: micro-euro (1 = 0,000001 EUR), YTM basis points, maturity hundredths of a year.
export interface FundList {
  /** ISO calendar date: the run date given to the writer, one value for the whole file (AC1). */
  readonly asOf: string;
  readonly funds: readonly Fund[];
}

export interface Fund {
  readonly year: number;
  readonly isin: string;
  readonly name: string;
  /** 5.113521 EUR -> 5113521; no rounding happens in the file, so ADR 0012's single rounding stays at display. */
  readonly navMicroEur: number;
  readonly ytmBp: number;
  /** 1,62 -> 162; display only, not read by the calculation (024). */
  readonly avgMaturityHundredths: number;
  /** display only, not read by the calculation (024). */
  readonly sharesOutstanding: number;
}
```

`avgMaturityHundredths` and `sharesOutstanding` are stored but no app element reads them today, so no
formatter is named for them here; the writer fills them, and the UI does not show them until a later story
does. The calculation path uses `ytmBp` for the factor and `navMicroEur` only for the per-share projection.

Unit consequence for the app (this is why the app is touched at all):

- `logic/projection.ts`: `payoutPerShareCents` becomes `payoutPerShareMicroEur`; the factor and the
  round-trip functions are untouched, because they never use NAV.
- `logic/format.ts`: new `formatEuroMicroEur(microEur)` for the projection column (the only place a
  micro-euro value is rounded, i.e. the single rounding); `formatEuro(cents)` stays for the phase amounts;
  `formatDate` stays for the asOf.
- `logic/fields.ts` + `parseInputs.ts`: the NAV override cell accepts up to 6 decimals and produces
  micro-euro; the YTM cell keeps its 2-decimal rule.
- `fieldCopy.ts`: one copy line changes for the NAV cell (6 decimals); this is the only UX item, and the
  copy itself belongs to `ux-designer`.
- `logic/format.ts` `fundValueText`: the NAV cell shows the stored value with its own number of decimals,
  so a 6-decimal value round-trips through the same parser; the YTM cell keeps its rule.
- `FundTable.tsx`: calls `formatEuroMicroEur` for the projection cell.
- Tests read a fixture copy, not the live file: `apps/laz/src/features/plan/data/fund-list.fixture.json`
  with the hand values, and `phase.test.ts` imports that copy instead of `FUND_LIST`. The app's own import
  stays the real file; in `--mode e2e` the app's Vite config aliases the data file to the fixture copy, so
  the e2e hand values cannot be moved by a refresh.

### Files

| File                                                       | Responsibility                                                                                                                          |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/fundListParse.mjs` (_devops_)                     | pure: one stored response → one fund record; names the fund and the field it could not read; no fetch, no clock                         |
| `scripts/fundListWriter.mjs` (_devops_)                    | pure: records + run date → the file content as a string                                                                                 |
| `scripts/fundListSource.mjs` (_devops_)                    | live mode only: fetches one page with an `AbortController` and a named `FETCH_TIMEOUT_MS`; never imported by a test                     |
| `scripts/write-fund-list.mjs` (_devops_)                   | CLI with `--mode=fixture                                                                                                                | live`, `--run-date=YYYY-MM-DD`, `--out=…`; fixture mode reads `scripts/fixtures/laz-fund-list/`; writes only when every fund parsed, prints one line per fund |
| `scripts/fixtures/laz-fund-list/` (_tester_)               | one stored response per fund plus three malformed responses for AC2; added to `.prettierignore` so the stored bytes are not reformatted |
| `vitest.scripts.config.ts`, root `test:scripts` (_devops_) | runs `scripts/**/*.test.mjs` in the node environment; `test:scripts` is added to `verify` because `scripts/` is not a workspace         |
| `.github/workflows/fund-list-refresh.yml` (_devops_)       | `workflow_dispatch` only; runs the writer in live mode with `contents: write` on this workflow and commits the file                     |

### Data flow

`fixture mode` (tests, default): read the stored response → `parseFundResponse` → validate → record →
`buildFileJson(records, runDate)` → write. `live mode` (hak's explicit command, or the UI-triggered
workflow): `fetchFundPage` → the same parse → the same writer. The parse module never fetches and the
source module never parses, so AC3 can be measured on the parse module alone.

The run date is an argument, not a clock read, so AC1's asOf is measurable without controlling time; the
CLI takes the date from the caller. In fixture mode the caller passes a fixed date.

### Error handling

Per fund: `null` where the response does not carry the value, `NaN` where it is not a number, and a range
check where the schema allows only a positive integer. One failure means the run writes nothing at all (no
partial file, no invented value), and the message names the fund and the field (AC2). The writer's exit
code is non-zero, so the workflow job fails instead of committing a half file.

### New dependency

None. The response is read with targeted patterns over the stored text, not with an HTML parser library;
that is the fragile part of this design and the reason AC2 exists as a loud failure rather than a default.

### Minimal test set (one per AC, cheapest level)

1. **AC1** — `scripts/fundListParse.test.mjs`: one test, fixture mode, one fund; the expected record is
   hand-pinned from the response, not computed by the test from the same file (P16), and the asOf equals the
   run date passed in.
2. **AC2** — `scripts/fundListParse.test.mjs`: one test over three malformed stored responses (missing
   NAV, non-numeric YTM, zero shares) asserting the error names fund and field and that no file content is
   produced.
3. **AC3** — `scripts/fundListParse.test.mjs`: one test that the parse module never calls the request
   function, measured with a stub that throws when called, in fixture mode.
4. **AC4** — one script test that `buildFileJson` output equals a hand-written expected JSON, and one app
   test (`logic/fund.test.ts`) that the app reads the fixture copy; the e2e hand values stay pinned to that
   copy.
5. **AC5** — no committed test: a workflow cannot be tested without a runner. The workflow is checked with a
   planted-violation dry run in a scratchpad copy (rule for scripts in architect memory: a fixture response
   missing a field must make the job fail), and the real run is reported by hak after the push.

Five new tests in total, at the script and app-test level; no e2e test is added, because the app's behaviour
does not change.

### Risks and mitigations

- The source page's markup can change, which breaks the patterns. Mitigation: the patterns are narrow and
  anchored to the labels, a failure is a named error (AC2), and CI runs only against stored responses, so CI
  stays green when the source moves.
- Reading the pages by script is not documented as permitted (no public developer API); no AC asserts the
  source stays readable, and the accepted fixtures keep the tests independent of it.
- The runner commit needs `contents: write` in this workflow only, which is a permission the CI job does not
  have; it also starts a normal CI run on `main` (build plus Pages deploy), which is what makes the refreshed
  data visible.
- Prettier would reformat stored responses and change the bytes the tests read; the fixtures are listed in
  `.prettierignore`.
- The app's hand oracles must not read the live file; if a test reads the file it compares the page with its
  own source (P16), so the fixture copy and the e2e alias are part of the design, not an optional cleanup.

### Implementation plan (each step green on its own)

1. ADR 0013 amended for the three units; then the app side: `Fund` interface, `payoutPerShareMicroEur`,
   `formatEuroMicroEur`, the NAV cell's decimal rule, the one copy line, `FundTable.tsx`. Existing tests
   updated to the new unit, no new test except the fixture-copy test.
   updated to the new unit, no new test except the fixture-copy test.
2. Fixture copy `fund-list.fixture.json` + the e2e alias; `phase.test.ts` and the e2e hand values read it.
3. `scripts/fixtures/laz-fund-list/` with the stored responses and the three malformed ones;
   `.prettierignore` entry.
4. `vitest.scripts.config.ts` + `test:scripts` in `verify`; then `fundListParse.mjs` and
   `fundListWriter.mjs` with AC1, AC2, AC3 and the AC4 script test.
5. `fundListSource.mjs` (live fetch with the timeout) and `write-fund-list.mjs` (CLI), fixture mode first,
   live mode behind the mode argument.
6. `.github/workflows/fund-list-refresh.yml` with `workflow_dispatch` and `contents: write`.
7. Tester runs the AC mapping; planted-violation dry run for the workflow; `check:structure`, prettier.
8. Tech-writer: the app README section for the writer and the workflow, `CHANGELOG.md`.

UX design is needed for one copy line only (the NAV cell's decimal rule); no new UI structure, no states.

## Implementation notes

_developer (2026-11-13, run as the orchestrator in one pass): what was built, deviations from the design
and why._

Built as designed: the parse module, the write module, the request module, the command-line entry, four
malformed stored responses, two script test files, the vitest config and the `test:scripts` step for a
directory that is not a workspace, and the trigger workflow. The app side is the unit change: the record's
NAV field is micro-euro, the projection column formats in that unit, the NAV input cell accepts six
decimals, and the app's tests read a fixture copy through an alias that the production build does not use.

Deviations from the technical design:

1. The stored-response directory is named without the app, because a factory-adjacent path may not name
   an app (`check:structure` rule 1); the design's path named it.
2. The output path is a required argument, resolved against the repo root. The design left the default
   open; a default that pointed at the app's data file would let an accidental run overwrite it.
3. A fund with no stored response in fixture mode is reported as a line and the run exits 1, instead of
   crashing on the missing file. Only the 2028 fund has a stored response, so a fixture run must name the
   six funds it cannot read rather than stopping at the first.
4. Defect found in the parse and fixed: a value with more decimals than the field's unit was converted by
   string arithmetic into a wrong integer, because the extra digits were added as whole units
   (measured: `5.6777612` with a 6-decimal unit became 11777612). The parse now refuses it, and a fourth
   stored response proves the refusal through the run, not only through the parse.
5. Defect found in the app and fixed: after the unit change the NAV input cell's upper bound was still the
   cent bound, so the copy quoted 200.000,00 € while the field refused anything above 20,00 €. The bound
   is now derived in the field's own unit, and the test goes through the parse function, not the constant.
6. Defect found in the runner and fixed: `git status --porcelain` writes a wholly untracked directory as
   `path/`, and the snapshot read that line as a file, which crashed the run. Such a line is now expanded
   to the files inside it. The fixture directory of this story is what triggered it.
7. The run function is exported and takes the read and the request functions, so AC3 is measured with a
   stub that throws. The scan and the write run only when the script is executed directly, so importing the
   module touches neither disk nor network.

## Test report

_tester (2026-11-13): AC → test mapping, results, defects found._

| AC  | Test(s)                                                                                                                                                                                                                                                                                                                                  | Result           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| AC1 | `scripts/fundListParse.test.mjs`, test 1: the four values of the stored response (2028, accumulating page 332876) against hand-pinned numbers 5677761 / 376 / 162 / 191664314, and the file-level asOf equals the run date passed in                                                                                                     | PASS             |
| AC2 | same file, test 2: four stored responses (missing value, not a number, out of range, too many decimals), each names fund and field; the same failure through the run, which produces no content at all                                                                                                                                   | PASS             |
| AC3 | same file, test 3: fixture mode reads only, with a request stub that throws when called; the call count is 0                                                                                                                                                                                                                             | PASS             |
| AC4 | `scripts/fundListWriter.test.mjs`: the produced file equals the hand-written shape (key order, funds by year, refused run date, refused empty record list), plus `apps/laz/src/features/plan/logic/fund.test.ts`, which compares the app's import with hand values that are not the fixture copy's values; the app's e2e run stays green | PASS             |
| AC5 | not measurable without a runner: the planted-violation dry run below; the live run is reported by hak after the push                                                                                                                                                                                                                     | n.a. in this run |

Defects found by the tests: the decimal-length defect (AC2 case 4, found by probing a value with 7
decimals), the NAV bound that still used the cent unit, and the runner reading an untracked directory as a
file. All three are fixed and each is proven red by a mutation.

Proofs by mutation (copies, reverted from a backup copy, never `git checkout`/`restore`/`stash`):

| Mutation                                    | Red test                                    |
| ------------------------------------------- | ------------------------------------------- |
| parse: the range check dropped              | red (AC2, out of range)                     |
| parse: a missing value accepted             | red (AC2, value missing)                    |
| parse: the decimal-length guard dropped     | red (AC2, too many decimals)                |
| write: the funds are not ordered by year    | red (AC4)                                   |
| write: a partial run still produces content | red (AC2 through the run)                   |
| entry: fixture mode calls the request stub  | red (AC3)                                   |
| app: the alias to the fixture copy removed  | red (`fund.test.ts` names the fixture copy) |

Planted violation for the trigger path (AC5, no runner): a copy of the stored response with the NAV value
removed, run through the command line in fixture mode → exit code 1, names fund and field, and no output
file is created.

Measured durations (reported, not asserted, story 026 rule): `test:scripts` 50 tests green, 0.21 s inside
the suite and 1.1 s as a runner step; `test -w apps/laz` 9 tests green, 1.4 s; `test:e2e -w apps/laz` 44
tests green, 5.5 s; the full run 12 steps, 2 levels, 76.7 s wall clock. The app's own e2e run does not read
the network; the writer's live path is never executed by a test.

### CI round (2026-11-14), tests for the rules hak named

| Rule                                                                        | Test(s)                                                                                                                                                                                                 | Result |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC3, the mode of a test run is named by the run                             | `apps/laz/src/features/plan/logic/fundSource.test.ts`: the hand expectations are the defaults CI names, and `live` is refused                                                                           | PASS   |
| AC4, the fund data a test run reads                                         | the same file names `fixture` as the source CI gives; `fund.test.ts` still compares the app's import with hand values                                                                                   | PASS   |
| the write gate: only a full run may put a record into the file              | `scripts/verify.test.mjs`: `acceptsRecord('full')` true, `acceptsRecord('frozen')` false                                                                                                                | PASS   |
| a committed data file is answered as a full run, so the structure gate runs | the same file, with a hand record: mode full, every step, every workspace, the structure gate read as the whole tree                                                                                    | PASS   |
| a full run plans every step when nothing changed                            | the same file: an empty change list with mode full plans all twelve steps, the structure gate among them                                                                                                | PASS   |
| the frozen comparison names each difference                                 | `scripts/fundListCompare.test.mjs`: the committed text and the produced records are hand values; one moved value, one moved identity, a fund on each side, an unreadable file, and no difference at all | PASS   |

Mutation proofs for these rules (copies in a scratch directory, never `git checkout`/`restore`/`stash`):

| Mutation on the copy                        | What the copy answers, which the guard test catches                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| the data-file rule dropped from the mapping | a data-file change is answered as an affected run scoped to one workspace, and the structure gate is not planned |
| `fits` always true                          | an ISIN that moved from the accumulating to the distributing class would be written over the table hak confirmed |
| the write gate accepts `frozen`             | a frozen run would put a record into the file                                                                    |
| the resolver's `live` refusal dropped       | a test run would read the live source, so CI would depend on the site staying readable                           |

The committed data file was not written by this round: the comparison run is a comparison, and the write
belongs to the UI-triggered workflow, which is the only workflow with a write permission.

Observed through the caller, not only through the module:

| Run                                                                                                                        | Observed                                                         |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| the app's fixture-copy test with `VITE_TEST_MODE=local` and `LAZ_FUND=committed` (the name decides the data the run reads) | red: the hand values are not the committed values                |
| the same test with `LAZ_FUND=fixture`                                                                                      | green                                                            |
| `--frozen` against the committed file, in fixture mode, run date 2026-11-14                                                | exit 0, seven funds read, no difference, nothing written         |
| `--full` against a copy whose 2028 ISIN was planted as the distributing class                                              | exit 1, the fund and the field named, the copy's bytes unchanged |
| `--full` against a copy that matches the produced table                                                                    | exit 0, the whole table written with the run date                |
| no write mode; `--full` and `--frozen` together; `--frozen` with no committed file                                         | three refusals, each exit 1 with the rule named                  |

Measured durations of this round (reported, not asserted, story 026 rule): `test:scripts` 59 tests green,
0.23 s inside the suite and 1.2 s as a runner step; the green full runs 12 steps, 2 levels, 80.6 s (the
round's code), 84.2 s (the gate 2 commit) and 81.5 s (the merge publish, which is the run that published the
merged content). Seven full runs of the round were needed in all, four red; the red ones are named in Review
finding 1, and one of them was this round's own record before prettier had been run on it. The app's own e2e
run does not read the network; the writer's live path is never executed by a test.

## Review

_Round 1, 2026-11-13, verdict APPROVED, checklist Version 2._

| Item | Result | Note                                                                                                                                                                                             |
| ---- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1   | pass   | AC1 parse + asOf from the argument; AC2 the four malformed responses and the caller; AC3 the stub; AC4 the hand-written file shape plus the app's fixture-copy test; AC5 has no test and says so |
| C2   | pass   | the request path has an `AbortController` with `FETCH_TIMEOUT_MS` (ADR 0014) and ends in an error state; no pending UI state in the diff                                                         |
| C3   | n.a.   | no hook or component logic changed                                                                                                                                                               |
| C4   | n.a.   | no render loop or controller                                                                                                                                                                     |
| C5   | n.a.   | no reducer; the run date is an argument, which is the same rule applied to a script                                                                                                              |
| C6   | pass   | every failure names fund and field, the exit code is 1, and the run writes nothing; the fixture-missing case is reported, not swallowed                                                          |
| S1   | n.a.   | no input or rendering code changed                                                                                                                                                               |
| S2   | n.a.   | no config, env or auth code changed; the workflow stores no credential and uses the default token                                                                                                |
| S3   | n.a.   | no dependency added; the response is read with patterns, not a parser library                                                                                                                    |
| S4   | n.a.   | no dev-only code added; the alias is conditional on the mode, not a dev fake                                                                                                                     |
| S5   | pass   | the new scripts were run by hand: the planted violation, the fixture-mode run, and the refused run date                                                                                          |
| T1   | pass   | `npm run verify` green: 12 steps, 2 levels, 73.9 s wall clock                                                                                                                                    |
| T2   | pass   | one test per AC, at the script level for the writer and at the app-test level for the fixture copy; no AC is tested at two levels                                                                |
| T3   | pass   | the oracles are hand values, not computed from the file they check; the mutation set shows each assertion fails when the code is changed                                                         |
| T4   | n.a.   | no e2e spec changed beyond the fixture-copy helper                                                                                                                                               |
| T5   | pass   | the new parsing and mapping logic has tests (the pattern match, the unit conversion, the bounds, the key order, the path expansion)                                                              |
| K1   | pass   | matches the design; the seven deviations are in Implementation notes                                                                                                                             |
| K2   | pass   | no `any`, no `!`; named exports; the app test sits next to the code                                                                                                                              |
| K3   | n.a.   | no CSS changed                                                                                                                                                                                   |
| K4   | pass   | `check:structure` green; the fixture directory does not name the app                                                                                                                             |
| K6   | pass   | status `in-review`, index row equal to it                                                                                                                                                        |
| K7   | pass   | append-only, with the correction of the NAV unit recorded before any code used it                                                                                                                |
| K8   | pass   | the app README describes the writer and its modes; the CHANGELOG has the entry                                                                                                                   |
| K9   | pass   | prettier green from the repo root; the stored responses are in `.prettierignore` so their bytes are not reformatted                                                                              |
| K10  | n.a.   | no workspace script or tsconfig changed                                                                                                                                                          |
| K11  | n.a.   | no env variable                                                                                                                                                                                  |
| A1   | n.a.   | no control, label or focus changed; the copy line that changed is a text rule                                                                                                                    |
| A2   | n.a.   | no colour or state cue changed                                                                                                                                                                   |
| A3   | n.a.   | no live region or animation                                                                                                                                                                      |
| A4   | n.a.   | no render loop or canvas                                                                                                                                                                         |

Findings:

1. `[minor] apps/laz/e2e/laz.helpers.ts:84 — the e2e oracles read the fixture copy that the app also reads
in `--mode e2e`, so the displayed asOf is compared with its own source; the fixture content is anchored
   only by the hand values in the app's unit test. Fix: state the displayed date as a hand string in the
   spec, so the oracle and the app have different sources (R3). Not applied here because 024's design
   accepted this helper shape; recorded for a follow-up.
2. `[nit] scripts/write-fund-list.mjs:60 — an empty fund table reaches the writer with no record and
throws from the write module instead of reporting; the fund table is never empty today. Fix: report
`no fund record` in the run's own lines rather than letting the writer module throw.
3. `[minor] The round's own formatting: the story record needed prettier before `format:check` could be
   green, which is the same rule as story 026's, applied to a record that changed.

Round 2 (2026-11-14, the CI round), verdict APPROVED, checklist Version 2, self-check by the orchestrator,
pending hak's gate 2. Only the items this round can answer are listed.

| Item | Result | Note                                                                                                                                                  |
| ---- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | each rule hak named has a test: the write gate, the comparison, the data-file mapping rule, the resolver's refusal                                    |
| C6   | pass   | every refusal is named on the command line: no write mode, two write modes at once, a frozen run without a committed file, a result that does not fit |
| S2   | pass   | the two names are read in the app's own config only; no credential, no secret; the resolver refuses the live name                                     |
| S3   | n.a.   | no dependency added                                                                                                                                   |
| S5   | pass   | the command-line paths were run by hand: the green frozen comparison, the refused planted difference, the three refusals                              |
| T1   | pass   | the full run is green: 12 steps, 2 levels (the durations are in the Test report)                                                                      |
| T2   | pass   | the comparison oracle is hand text and hand records, not the file it checks (P16); the guard tests call the rule as a function                        |
| T3   | pass   | four mutation checks on copies show that each rule, not a convention, is what catches the planted violation                                           |
| T5   | pass   | the new modules have their own tests; the writer's write path is observed through its caller                                                          |
| K4   | pass   | `check:structure` green; the app names appear only in the app's own files, and `.github/workflows` is not read by rule 1                              |
| K6   | pass   | status `in-review`, index row equal to it, changed in the same commit                                                                                 |
| K7   | pass   | the Decision log is append-only; the Explanation was rewritten to stay within 15 lines                                                                |
| K8   | pass   | the app README and the CHANGELOG carry the write modes and the two names                                                                              |
| K9   | pass   | prettier green from the repo root, including this record                                                                                              |

Findings of round 2:

1. `[major] The minesweeper 3D e2e group is not stable on this machine, reported rather than smoothed over.
Full runs of this round failed on it four times, on a different test each time (the WebGL2 fallback, the
flash counter, the no-replay case, the state-across-switches case), and once the landing `Facts` test
   timed out. Run alone, the workspace passes: 108 passed, 2 flaky, where a flaky test is one that failed on
   its first attempt and passed on the retry. The failures are timeouts while waiting for the guest sign-in
   button or for an animation probe, under 16 parallel workers. What is not settled here is whether this is a
   defect of the 3D effects under parallel load or the machine under load; a full run that fails cannot
   publish, so the publish waits for a green run each time (the green runs of this round are in the Test
   report). CI on the runner is green on the same tests, so the difference is the local machine, not the code.
2. `[decision pending] `fits` counts only the fund identity as immovable. If hak wants a market value that
   moved to be refused as well, that is a change to this definition, not to the comparison's code.
   Resolved by hak on 2026-11-14: the definition stands as written.

## Explanation

The fund list the calculator reads is produced by a script, not typed by hand.
It reads one product page per fund and takes four values from it: net asset value,
average yield, average maturity, and the number of shares, in the source's own
precision, so nothing is rounded inside the file; rounding happens only at display.
The default mode reads stored copies, so a test run never contacts the site, and a
test proves this by failing if the network path is reached. CI names the mode of its
test run and the fund data it reads, so a run reads stored data by name, not default.
A run that cannot read a fund names fund and field and writes nothing at all, so a
half file can never appear, and the trigger fails instead of committing one.
A run needs a write mode: one writes the whole table, the other compares and writes
nothing; a result that does not fit the committed fund identity leaves the file as it
is, so CI can never publish a file its own checks would contradict. The trigger is
the workflow's run button, and its commit starts the build and the publish.
Not verified here: one live run against the site, and the fund identifiers against
the depot.

## Retrospective

_what went wrong, proposed changes, and which ones hak approved._

What went wrong:

1. The NAV unit was answered from the page's rounded display (`5,1152 €`) before the unrounded value in
   the page's own data was read (`5.113521` on the distributing page, `5.677761` on the accumulating one
   hak uses), so the answer had to be corrected at gate 1 and ADR 0013 changed for it. A unit choice must
   rest on the value the source carries, not on a figure it formats.
2. After the unit change the NAV input cell kept its old bound, so the copy and the constant disagreed:
   the copy quoted 200.000,00 €, the field refused anything above 20,00 €. No existing test covered it; it
   was found by reading the copy against the constant.
3. A number converted by string arithmetic was accepted with more digits than the unit's precision and
   became a wrong integer without an error. A parser test set is incomplete without a case with one digit
   too many.
4. The runner crashed on a path shape no test had: a wholly untracked directory appears in
   `git status --porcelain` as one line ending with a slash, and the snapshot hashed it as a file. This
   story's fixture directory was the first change with that shape.
5. The technical design named the app in a fixture path, which `check:structure` rule 1 forbids for a
   factory-adjacent directory, so the name had to be neutral.
6. AC5 cannot be measured in this environment; only its failure path was proved here, by a planted
   violation run through the command line. The live run is hak's after the push.
7. These proposals were numbered P13–P17, which story 024 had already used for approved proposals, so the
   same letters named two different rules. Renumbered to P22–P26 when recorded here. **P27 (proposed,
   pending hak):** proposal numbers continue across the backlog and are never reused, so an approved rule
   can be named unambiguously. Approved by hak on 2026-11-14 and applied to `CLAUDE.md`.

Proposed changes — hak confirmed all open gates on 2026-11-13, so all five are approved and applied:

- **P22** (developer, tester): a unit is chosen from the value the source carries in its own data, never
  from a figure the source formats for display; measure it before the decision is recorded.
- **P23** (tester): for a parser that converts text by string arithmetic, include the case where the input
  has more digits than the unit's precision — that is where a silent wrong value appears.
- **P24** (developer): when a unit changes, re-derive every bound a copy line quotes in that unit, and
  prove it through the function that reads the field, not by asserting the constant.
- **P25** (devops): a path taken from `git status --porcelain` may name a directory; expand it to the
  files inside before hashing.
- **P26** (tech-writer): a directory that holds fixtures for the factory's checks must not name an app, so
  prettier-ignored fixture folders get a neutral name.

Outcome (gate 2, 2026-11-13): applied — P22 in `developer.md` and `tester.md`, P23 in `tester.md`,
P24 in `developer.md`, P25 in `devops.md`, P26 in `tech-writer.md`. Story set to done, index row in the
same commit. Manual checks open: one live run against the site after the push, and the fund identifiers
against the depot (hak's).

### Cost

| Role                        | Round | Model | Tokens                                                  | Tool uses                                               | Duration                                                |
| --------------------------- | ----- | ----- | ------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| product-owner               | 1     | n/a   | not measured (story written by the orchestrator)        | not measured (story written by the orchestrator)        | not measured (story written by the orchestrator)        |
| architect                   | 1     | n/a   | not measured (design by the orchestrator)               | not measured (design by the orchestrator)               | not measured (design by the orchestrator)               |
| developer                   | 1     | n/a   | not measured (code written by the orchestrator)         | not measured (code written by the orchestrator)         | not measured (code written by the orchestrator)         |
| tester                      | 1     | n/a   | not measured (no per-run counters in this harness)      | not measured (no per-run counters in this harness)      | not measured (no per-run counters in this harness)      |
| tech-writer                 | 1     | n/a   | not measured (README and CHANGELOG by the orchestrator) | not measured (README and CHANGELOG by the orchestrator) | not measured (README and CHANGELOG by the orchestrator) |
| reviewer                    | 1     | n/a   | not measured (no per-run counters in this harness)      | not measured (no per-run counters in this harness)      | 1:17                                                    |
| total (measured)            | -     | -     | n/a                                                     | n/a                                                     | 1:17                                                    |
| orchestrator (main session) | 1     | n/a   | not measured                                            | n/a                                                     | n/a                                                     |

The measured duration is the verification run the reviewer executed (12 steps, 2 levels, 76.7 s wall
clock). The shorter figures in the Test report are measured check durations, not role durations, and no
role's thinking time is counted here.
