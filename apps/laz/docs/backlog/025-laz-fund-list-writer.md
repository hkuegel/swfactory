---
id: 025
title: Fund list data-file writer (devops), triggered from the UI, tested in fixture mode
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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

| Maturity year | ISIN (accumulating) | Note                                |
| ------------- | ------------------- | ----------------------------------- |
| 2028          | `IE0008UEVOE0`      | distributing variant `IE000264WWY0` |
| 2029          | `IE000SNLFDR7`      |                                     |
| 2030          | `IE000Y2BJVK9`      | distributing variant `IE000LX17BP9` |
| 2031          | `IE000D9WMGF0`      | distributing variant `IE000I2WYEU9` |
| 2032          | `IE000I660ZF8`      |                                     |
| 2033          | `IE000ZBGZQM8`      | distributing variant `IE000E0NL9T3` |
| 2034          | `IE000UY6XF65`      |                                     |

The accumulating/distributing choice must be confirmed against hak's actual depot (Open question 2).
No 2027 fund, which matches 024's assumption.

### Measured facts (2026-11-13, with their caveats)

- The iShares product page renders all five values in its HTML (NAV, Weighted Average YTM, Weighted Avg
  Maturity, Shares Outstanding, each with its own as-of date), so a Node script can parse them without a
  browser and without a key. Example for the 2028 fund as measured on 2026-11-13: NAV 5,1152 €; YTM
  3,76 %; Weighted Avg Maturity 1,62; Shares Outstanding 269.922.969.
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
2. `navCents` is defined as integer cents, but the source publishes NAV with four decimals (5,1152 € =
   511,52 cent). Storing cents would round inside the data file, which contradicts ADR 0012's rule that
   values are rounded once, at display.
3. `asOf` is one value for the whole file (ADR 0013), but the source stamps NAV and YTM with different
   dates (measured: NAV 12/Nov/2026, YTM 11/Nov/2026). The file cannot state both under the current shape.

## Acceptance criteria

- **AC1:** Given a stored sample response for one fund (fixture mode), when the writer produces the
  values for that fund, then each value is the value printed in that response and no value is invented:
  measured against hand-pinned numbers (not against the same file the test parses), for all four fields
  plus the as-of date of the response.
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
2. **Still open:** confirm the ISINs against hak's depot, including the accumulating or distributing share
   class per fund (the table in Context is the researched candidate list, not a confirmed one).
3. Price unit for NAV — answered 2026-11-13: the source's four decimals are stored as price basis points
   (5,1152 € = 51152), so the writer does not round inside the data file and ADR 0012's "round once at
   display" keeps holding (hak). ADR 0013 changes for this.
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

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: not applicable beyond the workflow run; no UI in the app changes in this story._

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

## Implementation notes

_developer: what was built, deviations from the design and why._

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s) | Result |
| --- | ------- | ------ |

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

## Explanation

_orchestrator: plain-language explanation shown at gate 2, at most 15 lines of at most 120 characters. No code, no file names._

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates),
proposed changes to agents/CLAUDE.md/templates, and which ones hak approved. Include a
`### Cost` table (see the retro step of `/feature`)._
