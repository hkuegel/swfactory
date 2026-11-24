---
id: 051
title: The cinematic AC5 tests finish on CI (the test probe draws one frame per sample)
status: done
type: bug
app: minesweeper
size: S
branch: fix/051-minesweeper-probe-one-render-per-sample
supersedes: []
changes: [050] # no AC of 050 becomes false; the dev-only probe that its AC5 tests use draws less often
superseded-by:
---

# 051 – The cinematic AC5 tests finish on CI (the test probe draws one frame per sample)

## Original request

> hak, 2026-11-24: "/fix CI-Timeout der Cinematic-AC5-Tests: Probe rendert pro Sample 3-4 Frames,
> nur einen rendern (changes: 050). Schlanker Ablauf."

Before that, hak (2026-11-24, to the diagnosis): "ja, fix mit schlankem Ablauf starten".

## User story

As the sponsor, I want the minesweeper end-to-end tests to finish on the CI runner within their
time limit, so that `main` is green again and the site is deployed.

## Context

Observed by the orchestrator, 2026-11-24:

- CI run 45376327586 on `main` (push of 4ec6513, a fund-list fix) fails in `test:e2e` after
  3397 s. Six tests of [050](050-minesweeper-cinematic-view.md) time out at 120 s in all three
  attempts: the loss test of AC5 (light, dark) and the fireworks flash test of AC5 (light, dark,
  two layouts each). The six take about 37 of the 54 minutes of the minesweeper run; the deploy
  job is skipped, so the refreshed fund data is not published.
- The CI trace shows setup and the first picture done after 14.5 s, then the sampling step (60
  samples of the end effect, each advancing the scene clock and reading the picture's luminance)
  runs more than 105 s. Locally (12-core Mac) the same step takes 22 s, the whole test 36 to 40 s.
- Cause, measured locally: advancing the dev-only probe's clock queues one frame; every luminance
  read draws the frame again and forces the drawing. A sample of the loss test draws 3 frames
  (advance, whole canvas, area around the mine), one of the fireworks test 4 (advance, whole,
  WCAG window, 150 px window). A frame costs about 100 ms in software WebGL locally and several
  times that on the 4-vCPU runner. Reading the pixels back costs about 10 ms.
- The same tests passed on `main` on 2026-11-21 (run 44949624792, e2e 1107 s), so they sit at the
  limit. The branch CI of 050 (run 44946743984) ran no e2e step.
- Repro: `npx playwright test e2e/minesweeper-cinematic.spec.ts -g "AC5: a loss shows message"`
  in `apps/minesweeper` with `--trace=on`; the sampling evaluate dominates the test.

## Acceptance criteria

- **AC1:** Given the cinematic scene with the end effect running and the test probe's clock
  paused, when a test advances the scene clock and then reads the luminance of the whole canvas
  and of a part of it (or reads pixels) in the same synchronous step, then the probe draws that
  scene time once, not once per read.
- **AC2:** Given the same scene time, when the luminance is read right after advancing (the frame
  is reused) and again in a later step (the frame is drawn anew), then both values are identical;
  a changed sway hold, a pause or a later step draws anew.
- **AC3:** Given the full CI run of the fix branch on the Ubuntu runner, when the minesweeper e2e
  tests run, then the six AC5 tests of 050 pass without a retry and without any change to what
  they assert, and the run is green.

## Out of scope

- Making the frames themselves cheaper (canvas size, effects, shadows) or changing any AC of 050.
- Raising the test timeout.
- Why the branch CI of 050 ran no e2e step (retro item).

## Open questions

- none

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-24 — Q: fix the CI timeout through `/fix`, lean process? — A: "ja, fix mit schlankem
  Ablauf starten", then `/fix …` (hak). Lean: orchestrator writes story, design, review, docs,
  explanation and retro; developer and tester run on Sonnet.
- 2026-11-24 — Orchestrator: no timeout raise and no fewer samples; the fix is in the dev-only
  probe, so the assertions of 050/AC5 stay as they are.
- 2026-11-24 — Orchestrator: the story is committed as the first commit of the fix branch, not
  on `main`, because `main` is checked out in another worktree; it reaches `main` with the merge.

- 2026-11-24 — Gate 2: Q: which retro proposals (P53, P54, P55) are approved? — A: "Keinen freigeben"
  (hak). Nothing applied.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_No UI change._

## Technical design

_Orchestrator (lean process)._ Only the dev-only probe in `createBoardScene.ts` (`probeInternals`)
changes. The probe remembers the scene time of the frame it drew in the current synchronous task
(after `advance`, `luminance`, `pixels`); `luminance` and `pixels` draw only if there is no such
frame for the current scene time. A microtask clears the mark, so a later `page.evaluate` (a new
task, after which the drawing buffer may have been presented) always draws anew; `holdSway` and
`pause` clear it too. Everything lives inside the probe internals, which production drops with the
probe. Doc comments in `types.ts` say "draws a frame unless this scene time was drawn in this
step". Tests: one e2e test for AC1 (the probe's frame counter moves by one per sample, not 3) and
AC2 (same value reused and redrawn; non-vacuity: the value changes over the effect), in
`minesweeper-cinematic.spec.ts`. AC3 is the CI run.

## Implementation notes

_developer: what was built, deviations from the design and why._

Only `probeInternals` in `scene3d/createBoardScene.ts` changed: a mark `probeDrawnAt` (scene time of the
frame the probe drew in this task) with `probeDraw` (renderFrame, set mark, clear by `queueMicrotask`) and
`probeDrawUnlessDrawn`. `advance` (paused) uses `probeDraw`; `luminance` and `pixels` use
`probeDrawUnlessDrawn`; `pause` and `holdSway` clear the mark. `frames` still counts real renderFrame
calls. Doc comments in `scene3d/types.ts` updated. No deviation. `build` and `check:dist` pass.

## Test report

Step "Verify" after the fix. 2 tests added (describe "probe frames (051)" in
`apps/minesweeper/e2e/minesweeper-cinematic.spec.ts`; the `Probe` type in `e2e/minesweeper.helpers.ts`
gained `pixels` and `frames`). Run: `-g "051|AC5" --retries=0 --workers=1`, 13 passed (2.9m), no flaky.

| AC  | Test                                                                                                        | Result                                             |
| --- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| AC1 | `AC1 (051): advancing the scene clock and reading luminance … draws exactly one frame per sample` (8.6 s)   | PASS (frames per sample `[1,1,1,1,1]`, was 4 each) |
| AC2 | `AC2 (051): a read right after advancing equals a read in a later step …; a sway hold or a pause …` (9.5 s) | PASS                                               |
| AC3 | the six AC5 tests of 050 on the Ubuntu runner, no retry, green run                                          | PASS: CI run 45399431700 (see below)               |

AC5 tests of 050 locally, workers=1, whole test (before: loss test light 36-40 s, orchestrator baseline):
loss light 20.9 s, loss dark 17.1 s, loss picture light 8.3 s / dark 8.6 s, win light 15.8 s / dark 17.1 s,
flash light 14.9 s / 15.0 s (bottom-row mines), dark 14.6 s / 14.7 s, AC5 ended-in-2D 6.9 s. The 4-read
flash tests now run about 15 s; their assertions are unchanged.

Mutation checks (runner `mut051.py` in the scratchpad, backup outside the repo, restore in `finally`,
byte identity asserted: "byte-identical restore OK"; baseline on the clean file: 2 passed). Failing
assertion lines are in `minesweeper-cinematic.spec.ts`:

- (a) luminance/pixels always redraw: AC1 fails at line 876 (frames per sample), and AC2 fails at line 916
  (a second read in the same step must reuse). 2 failed.
- (b) no `queueMicrotask` clear: AC2 fails at line 915 (a later step must draw anew). 1 failed, AC1 passes.
- (c) `holdSway` does not clear the mark: AC2 fails at line 935. 1 failed.
- (d) `pause` does not clear the mark: AC2 fails at line 935. 1 failed.
  Limit: (c) and (d) land on the same `toEqual({hold, release, paused})`, so the assertion shows the
  mutant, but the line does not say which of the two was removed (the object diff does).

Regression risk (grep of `luminance(` and `pixels(` in `apps/minesweeper/e2e`): every other site reads in
its own `page.evaluate` (a new task, so the mark is cleared) or after `advance`, which is the intended
reuse. `minesweeper-3d-effects.spec.ts` and `minesweeper-3d-scene.spec.ts`: 35 passed (57.6 s), no flaky.
`npm run verify -w apps/minesweeper`: vitest 120 passed (17 files), build and check:dist ok.
`npm run check:structure`: ok.

Checked, OK (no new test): the real-loop sites (`effects.spec` line 726) read in separate tasks, so
every read draws; the production build contains no probe (check:dist ok).

Defects: none.

CI on GitHub (orchestrator, 2026-11-24): run 45399431700 of PR 11 at the fix commit, `success`, affected
mode, 8 of 12 steps with `test:e2e` (avd, laz, minesweeper; the backlog index is a root file). `test:e2e`
1397.3 s, against 3397 s of the failing `main` run 45376327586. "No retry" is inferred, not read: verify
prints the Playwright summary only on failure. The minesweeper part is about 20.5 min (total minus about
2.5 min for avd and laz); the 124 other tests took about 16.8 min in the failing run, which leaves about
3.7 min for the eight AC5 and 051 tests, about 28 s each; a timeout and retry would add 2 min per test.

## Review

Orchestrator (lean process), round 1, checklist version 3. Verdict: **APPROVED**.

- C1 pass: AC1 and AC2 by `probeDraw` / `probeDrawUnlessDrawn` in the probe internals, tests "AC1 (051)" and
  "AC2 (051)"; AC3 by the CI run (Test report).
- C2 n.a.: no network call or pending state. C3 n.a.: no hook or component logic. C5 n.a.: no reducer.
  C6 n.a.: no error handling or I/O.
- C4 pass: the mark is cleared by a microtask, `pause` and `holdSway`, so no read after a new task or a
  changed sway reuses an old frame; the render loop itself is unchanged.
- S1, S2, S3, S5 n.a.: no input, config, dependency or script changed.
- S4 pass: the new code is referenced only by the probe internals; `createBoardScene` and
  `createCinematicScene` chunks in `dist/` contain no `queueMicrotask` (grep), check:dist ok.
- T1 pass: `npm run verify -w apps/minesweeper` exit 0 (orchestrator run); full run on CI pending (AC3).
- T2 pass: one e2e test per AC, no unit test. T3 pass: hand values (1 frame per sample), non-vacuity
  (the effect runs, luminance changes), four mutants all killed. T4 pass: named after the ACs, clicks with
  the clock paused. T5 pass: the branches (reuse, redraw after task, hold, pause) are covered by AC2.
- K1 pass: as designed, no deviation. K2 pass: no `any`, no `!`. K3, K4, K10, K11 n.a.: no CSS, platform,
  workspace tooling or env change. K6 pass: `done` in story and index after gate 2.
- K7 pass: three entries, append only. K8 pass: CHANGELOG "Fixed" entry; no README change (not
  user-visible). K9 pass: prettier clean.
- A1, A2, A3 n.a.: no UI. A4 pass: the probe allocates nothing new per frame; it draws fewer frames.

Nit (not fixed): mutants (c) and (d) fail the same `toEqual`; the object diff names which one.

## Explanation

The minesweeper tests of the Cinematic end effects ran into their time limit on the CI computer.
They take 60 snapshots of an explosion or of fireworks and measure the brightness of each picture.
For every snapshot the test helper drew the same picture three or four times instead of once.
On the slow CI computer, without a graphics card, that took longer than the two minutes a test may take.
Main stayed red, so the site with the new fund data was not published.
Now the helper remembers that it has just drawn this moment and reuses that picture for every reading.
Locally the loss test now takes 21 s instead of 36 to 40 s; what the tests check is unchanged.
Two new tests check that one picture is drawn per snapshot and that the reused picture equals a new one.
Only the test helper changed; it is not part of the published app.
Risk: a reading that should see a changed scene could get an old picture; three cases are tested.
Not verified yet: the run on the CI computer itself; it needs a pull request.

## Retrospective

Lean process (hak, 2026-11-24): the orchestrator wrote story, design, review, docs, explanation and retro;
two tester runs and one developer run on Sonnet. No review round was needed, no defect was found.

Why the bug got through:

- **The branch CI of 050 ran no e2e step.** A `workflow_dispatch` run has no change to compare with (its base
  is its own commit), so the plan skips the workspace steps lint, test, test:e2e and typecheck (run
  44946743984: 8 of 12 steps). The Definition of Done ("a green CI run of the story branch") was met on paper
  only. The six tests ran on CI for the first time on `main` (2026-11-21, green at the margin), then failed.
- **Nobody looked at the duration.** Locally the loss test took 36 to 40 s of its 120 s timeout. The
  4-vCPU runner draws software WebGL several times slower (bug 019), so a third of the timeout locally was
  already too much. 050's Test report lists results, not durations.
- **The probe hid its cost.** "Renders a frame" was documented, but a sample of advance plus several reads
  drew the same picture 3 or 4 times; the redundant draws doubled the sampling time.

Proposed changes:

- **P53** (devops, CI): a `workflow_dispatch` run of a branch compares against `origin/main` (or runs in
  full mode), so the branch CI that the Definition of Done asks for runs the e2e tests of the change; the
  Test report names the plan's step count of that run.
- **P54** (CLAUDE.md, Runner environment; tester): an e2e test that takes more than a third of its timeout
  locally is a finding, because the runner is several times slower for software WebGL; the Test report
  lists the local duration of every test that draws WebGL frames.
- **P55** (devops, verify runner): `scripts/verify.mjs` prints the Playwright summary line (passed, flaky,
  retries) on success too, so a Test report can quote retries of a CI run instead of inferring them.

Outcome at gate 2 (hak, 2026-11-24): P53, P54 and P55 not approved, nothing applied.

### Cost

| Role                        | Round | Model  | Tokens       | Tool uses | Duration |
| --------------------------- | ----- | ------ | ------------ | --------- | -------- |
| tester (reproduce)          | 1     | sonnet | 57392        | 9         | 1:11     |
| developer                   | 1     | sonnet | 42190        | 6         | 3:19     |
| tester (verify)             | 2     | sonnet | 54547        | 8         | 7:15     |
| total (measured)            |       |        | 154129       | 23        | 11:45    |
| orchestrator (main session) |       | opus   | not measured | n/a       | n/a      |

The orchestrator also did the roles of product-owner, architect, reviewer and tech-writer in this story.
