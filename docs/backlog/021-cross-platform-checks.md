---
id: 021
title: Factory checks pass on Windows
status: in-review
type: bug
app: platform
branch: fix/021-cross-platform-checks
supersedes: []
changes: [011]
superseded-by:
---

# 021 – Factory checks pass on Windows

## Original request

> ich will das swfactory von meinem github (hkuegel) auschecken und bearbeiten

The first `npm run verify` on hak's Windows machine failed (Prettier on all files,
then `check:structure` with a TypeError). hak approved fixing the Windows incompatibility
of the factory scripts and continuing the checks (see Decision log).

## User story

As a developer on Windows, I want `npm run verify` to run the same checks as on the
Ubuntu CI runner, so that local results match CI and real defects are not masked by
path-format crashes.

## Context

The factory was built and verified on Linux. Linux paths use `/`; Windows paths use `\`.
Four places assume `/` or a bare executable name, which breaks on Windows:

1. `scripts/check-structure.mjs` — story paths built with `join()` are split on `/`
   (lines 157 and 346), so the story-id regex sees the whole path and crashes.
2. `scripts/check-template.mjs` and `scripts/build-pages.mjs` — spawn the
   `node_modules/.bin` shims directly; on Windows the shims are `.cmd` files, and
   Node >= 23 refuses to spawn `.cmd` without a shell (`spawnSync` → `EINVAL`), so
   every spawn of these scripts fails on hak's machine (Node 24).
3. `packages/platform/src/test/tokenRules.ts` — `readCss()` keys CSS files by the raw
   `readdirSync` result; on Windows the keys contain `\`, so exact key lookups in
   `tokens.test.ts` return empty strings.
4. `packages/platform/config/vite.ts` — Vitest serves the shared setup file through a
   `/@fs/C:/…` URL when the project root is `templates/app`; the default
   `server.fs.allow` does not cover the repo root there, so both template suites fail
   with "Cannot find module". (The apps are npm workspaces, so their default allow
   already covers the repo root; only the skeleton is affected.)

## Acceptance criteria

- **AC1:** Given a Windows checkout, when `npm run check:structure` runs on a clean
  repo, then it prints the same ok summary as on Linux instead of crashing, and it
  still detects a planted violation (non-vacuous check).
- **AC2:** Given Windows, when `npm run check:template` runs on the passing skeleton,
  then it runs the skeleton's vitest and tsc and prints ok.
- **AC3:** Given Windows, when `npm test` runs, then the token tests pass with the
  same key semantics as on Linux (`src/…` keys, no path separators in them).
- **AC4:** Given Windows, when `npm run verify` runs, then every step is green; CI on
  Linux remains green (no behaviour change there).

## Out of scope

- Making CRLF line endings acceptable to Prettier — the repo stores LF and the local
  checkout is normalized to LF (`core.autocrlf=input`), which is the intended setup.
- e2e differences between Windows (SwiftShader/fonts) and the Ubuntu runner; local
  Windows e2e results are reported but do not redefine CI expectations.

## Open questions

- How to treat the two Windows-only pixel assertions (see Test report): accept them as an
  environment difference and keep CI the oracle, or loosen the harness tolerances so the same
  tests are green on both platforms. Needs hak's decision — an oracle may not be changed without it.
  _(answered: loosen the tolerances to the measured floor, see Decision log.)_
- None open. (Earlier: which git identity to use on this machine — answered, see Decision log.)

## Decision log

- 2026-11-12 — Q: May `check-structure.mjs` be fixed for Windows (story path split) —
  A: Yes, fix it and continue verifying (hak).
- 2026-11-12 — Q: Fix on `main` or a branch — A: Fix branch, by convention
  `fix/021-cross-platform-checks` (hak).
- 2026-11-12 — Q: May `check-template.mjs` also be made Windows-compatible —
  A: Yes, if the running verify fails there, as expected (hak).
- 2026-11-12 — Q: Story file for this fix — A: Yes, story 021 in the platform backlog
  (hak).
- 2026-11-12 — Q: Local e2e on Windows or CI only — A: Local on Windows is fine;
  differences to the Ubuntu runner are accepted (hak).
- 2026-11-12 — Finding during implementation: `check:template` still failed on
  Windows after the `.cmd` fix; `spawnSync` throws `EINVAL` for `.cmd` files without
  `shell: true` on Node >= 23. Scope extended to `build-pages.mjs`, which uses the
  same direct-spawn pattern. (orchestrator, in the story's design)
- 2026-11-12 — Tester: full verify green on Windows; local e2e green except two avd
  pixel assertions, measured and recorded in the Test report. Decision pending (hak).
- 2026-11-12 — Q: the two Windows-only pixel assertions — A: loosen the harness tolerances
  to the measured noise floor of both platforms (documented, non-vacuity kept); the oracle
  is not dropped (hak).
- 2026-11-12 — Q: gate 1 — A: story committed on `main`, the code stays on the fix branch (hak).
- 2026-11-12 — Q: reviewer pass now — A: yes, the full reviewer checklist (hak).
- 2026-11-12 — Q: git has no identity on this machine, which one to use — A: hak's identity,
  `haraldkuegel <harald.kuegel@firstwaters.com>` (the one in the existing history); set with
  `git config --local`, not globally (hak).
- 2026-11-12 — Tester after the harness change: full verify green and e2e 80/80 (avd) and
  110/110 (minesweeper) on Windows in one run.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_n.a. — no UI._

## Technical design

_architect: four small cross-platform fixes in test/factory code only; no product
behaviour changes:_

- `check-structure.mjs`: replace `story.split('/').pop()` with `basename(story)` in
  both rules (the paths come from `join()`, so they are platform-native).
- `check-template.mjs` and `build-pages.mjs`: run the `.cmd` shims through
  `shell: true` on `win32` (Node >= 23 rejects spawning `.cmd` without a shell).
  Argument lists contain no shell metacharacters or spaces, so quoting is safe.
- `tokenRules.ts` `readCss()`: normalize the readdir result to `/` keys so tests see
  the same keys on both platforms; reading with `join()` is already fine.
- `config/vite.ts`: add `server.fs.allow: [repoRoot]` — on Linux this is already the
  effective default, so CI behaviour is unchanged; on Windows it makes the setup file
  servable for `templates/app`.
- Minimal test set: no new test files. The checks themselves are the oracle (AC1, AC2);
  AC3 is covered by the existing token tests; AC4 by a full green `npm run verify`.
  AC1 is proven non-vacuous by planting a dead link once on Windows.

## Implementation notes

_developer: applied exactly the four fixes from the design, in one change
(cross-cutting, cannot be split into green steps per file). Local Prettier was run
once to normalize the working tree to LF, which produced no content diff in git._

_Follow-up on hak's decision (see Decision log): the two avd harness bounds were
loosened to the measured noise floor of both platforms — `RASTER_NOISE_FLOOR = 4` in
`e2e/avd.helpers.ts` (used by `expectSavingUnchanged`) and the end-blend filter in
`avd-chart-colours.spec.ts` AC4. Both are documented with their measurements, and both
stay non-vacuous (Test report)._

## Test report

_tester:_

| AC  | Test(s)                                                                                                                        | Result                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| AC1 | `npm run check:structure` on Windows; non-vacuity: planted dead link in `docs/`                                                | ok — ok summary (21 stories); the planted link was reported, then removed |
| AC2 | `npm run check:template` on Windows (skeleton vitest + tsc)                                                                    | ok — `check-template: ok templates/app`                                   |
| AC3 | `npm test` on Windows: platform 154, avd 100, minesweeper 103 tests                                                            | ok — 358 passed, 0 failed                                                 |
| AC4 | full `npm run verify` on Windows (typecheck → lint → format → structure → template → tests → build → dist check → build:pages) | green                                                                     |

### e2e on Windows (local, beyond the ACs)

- After the harness bounds were loosened (see below): `apps/avd` 80 of 80, `apps/minesweeper`
  110 of 110, platform sign-in specs green; `npm run verify` green in the same run.
- Before that change the two avd tests failed only on Windows, both deterministic (reproduced twice):
  - `avd-reinvest.spec.ts` AC1 — `differingPixels` expects 0, got 2.
  - `avd-chart-colours.spec.ts` AC4 — the last run of the last bar is `other` instead of `canvas`.
- Measurements (throw-away probe, removed): the same chart captured four times in a row differs in
  **0** pixels at tolerance 0 — the raster is deterministic. After the reinvest toggle the chart is
  re-rendered: 2 pixels differ beyond tolerance 2 (max 3/255; 2480 pixels differ at tolerance 0),
  while its HTML is identical. In forced colours the last bar's centre column ends with a 3 px
  blend run `other` at rgb(45,45,45), which becomes the "last run" the assertion reads.
- Reading: no product defect — the DOM is identical, only the repaint's subpixel raster differs.
  Both tolerances (noise ≤ 1/255, anti-aliased runs < 3 px) were measured on the Ubuntu runner,
  where CI is green; Windows produces noise up to 3/255 and a 3 px edge blend.

### Non-vacuity of the loosened bounds (measured on Windows, throw-away probe, removed)

- `differingPixels`: recolouring one segment (the top segment of the last bar, 12 px, outside the
  palette) gives **1749** differing pixels at tolerance 2 — 435× the new floor of 4.
- `barRuns`: the same recoloured segment shows as `other:20` in the last bar, i.e. above the
  filter's 4 px limit, so the assertion still reads it; only genuine end blends are ignored.
- The two avd specs are green on Windows with the loosened bounds; on Linux the values stay
  0 and no end blend exists, so CI keeps the same oracles with more headroom.

## Review

_reviewer: verdict pending._

## Explanation

_To be written at gate 2._

## Retrospective

_To be written at gate 2._
