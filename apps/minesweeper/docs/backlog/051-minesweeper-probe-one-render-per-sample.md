---
id: 051
title: The cinematic AC5 tests finish on CI (the test probe draws one frame per sample)
status: in-progress
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
