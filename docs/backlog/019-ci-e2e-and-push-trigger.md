---
id: 019
title: CI - e2e green on the GitHub runner and push to main starts CI
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: bug # feature | bug | chore
app: platform # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: fix/019-ci-e2e-and-push-trigger
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [010/AC1] # stories whose behaviour this one modifies, e.g. [004/AC2, 007]; stays empty unless hak relaxes a timing AC (Open question 1)
superseded-by: # set on the OLD story when a newer one replaces it
---

# 019 – CI: e2e green on the GitHub runner and push to main starts CI

## Original request

> hak, 2026-11-08: "/fix CI: e2e auf GitHub-Runner rot (avd-reinvest AC1 Pixel, Minesweeper-3D-Timing) und Push auf main startet keinen CI-Lauf"

## User story

As the sponsor of the software factory, I want the CI workflow to start on every push to `main` and the e2e tests to be green on the GitHub runner, so that the checks of story 018 can pass and the apps are deployed to GitHub Pages automatically.

## Context

Facts gathered by the orchestrator on 2026-11-08:

- Repo `hkuegel/swfactory` is public, Actions are enabled (all actions allowed), the workflow "CI" (`.github/workflows/ci.yml`, triggers `push` to `main`, `pull_request`, `workflow_dispatch`) is active since 2026-11-01.
- **No push trigger:** the repo has had 0 runs from a push ever, although GitHub lists push events to `refs/heads/main` (e.g. 2026-11-02, 11-04, 11-07, 11-08). A manual run (`gh workflow run CI --ref main`, `workflow_dispatch`) starts normally. The cause is unknown.
- **First CI run ever:** run 42484677241 (`workflow_dispatch` on `main`, merge commit 1255873 of story 018). Jobs `verify` and `pages` green, `e2e` red, `deploy` skipped (as 018/AC5 requires). The log is saved at `/private/tmp/claude-501/-Users-haraldkuegel-swfactory/b6ad74d5-b7e6-4d4e-b781-9f99c3559d23/scratchpad/ci/run-42484677241-failed.log`.
- **e2e failures only on the runner** (all green locally on macOS; the runner is `ubuntu-latest`, no GPU so WebGL is software-rendered, and it has other fonts than macOS):
  - avd: 79 passed, 1 failed: `avd-reinvest.spec.ts:41` AC1, a pixel comparison expects 0 differing pixels and got 2920 (all 3 attempts).
  - minesweeper: 102 passed, 4 failed, 4 flaky: `minesweeper-3d-effects.spec.ts:364` (loss AC1, test timeout 30 s inside `page.evaluate`), `:740` and `:801` (real-loop AC1); `minesweeper-3d-scene.spec.ts:520` (cascade AC2 timing), `:672` (AC5 pixel parity 2D after 3D), `:773` (AC6 loading fallback); `redesign.spec.ts:154` (AC2 one font …) and `:349` (AC5 layout).
- **Consequence:** the Pages deploy of story 018 cannot happen (018/AC5: deploy only after green verify, e2e and dev-only check; 018/AC8 is still not checked), and pushes to `main` get no CI at all.
- Rules that bind the fix (CLAUDE.md "Test proportionality"): e2e specs assert an AC's intent, never design values; a pixel-diff tolerance is backed by the measured maximum noise, stated in a comment; logic that depends on real frame timing keeps one real-loop test that proves the effect plays; when a rule is rechecked, at least one case must actually move the result (no vacuous pass).
- This story states the rule; the design decides the means (fonts, GPU flags, a replacement assertion, a CI-only setting, and so on).

## Acceptance criteria

- **AC1:** Given a push to `main` after this fix is merged, when hak checks the Actions tab on GitHub, then the workflow "CI" has started for that push (event `push`). If the cause lies outside the repo (a GitHub setting), the story documents the cause and the workaround and hak decides (Open question 2). Manual check, listed as such in the Test report (agents cannot see the Actions tab of pushes).
- **AC2:** Given a clean CI run on the GitHub runner, when `npm run test:e2e` runs, then all e2e tests of every app pass, with no failed and no flaky test (a pass only on retry counts as flaky and fails this AC) in two consecutive runs.
- **AC3:** Given a test that was red on the runner, when the fix is applied, then the test still asserts the intent of its AC: a pixel tolerance is no larger than the measured runner noise (value and measurement stated in a comment), an AC's own timing limit stays as the AC says unless hak relaxes it (Open question 1), and differences of the environment (fonts, software GL) are handled explicitly, not by loosening an assertion. A check that cannot run on a GPU-less runner is skipped only with a documented reason plus a replacement assertion that still fails when the effect is broken.
- **AC4:** Given the fix, when `npm run verify` and `npm run test:e2e` run locally (macOS), then both stay green and every test that was green before is still green.
- **AC5:** Given a run on `main` after the fix with verify, e2e and the Pages checks green, when the run finishes, then the `deploy` job runs and the Pages site is published (018/AC5, AC8). Manual check by hak: both apps open under their URLs and guest sign-in works.
- **AC6:** Given a CI run in which e2e fails, when the run finishes, then `deploy` is still skipped and nothing is published (018/AC5 still holds).

## Out of scope

- New features, new ACs for the apps, and changes of the apps' behaviour; only tests, test configuration and the CI setup change (unless Open question 1 is answered with a relaxed AC).
- Running e2e on a GPU runner or any paid runner.
- The legal and Impressum questions of 018 (hak's decision there).
- Further CI jobs (lint matrix, caching tuning).

## Open questions

1. May a timing limit that is part of an earlier story's AC (e.g. the cascade timing, the loss effect duration) be relaxed on the CI runner because software WebGL is slower? [No: keep the AC as written; the test tells software rendering apart explicitly (e.g. a documented slower budget on the runner stated in the test with its measured basis) only if hak agrees. If hak agrees to relax an AC, the story gets `changes: [NNN/ACx]` and the old AC is annotated.]
2. If the missing push trigger turns out to be a GitHub-side cause (e.g. a repo or account setting, or a workflow disabled by GitHub), who changes it and is a workaround acceptable (e.g. a scheduled run, or a manual `workflow_dispatch` after each merge)? [hak decides; the story records the cause and the chosen workaround.]
3. Is a flaky e2e test allowed to pass on retry in CI at all? [No, per AC2 a retry-only pass counts as a failure for this story; CI keeps its retry setting only as a safety net for unrelated infrastructure noise, which the design decides.]

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-08 — Request (hak, via `/fix`): "CI: e2e auf GitHub-Runner rot (avd-reinvest AC1 Pixel, Minesweeper-3D-Timing) und Push auf main startet keinen CI-Lauf". Facts and failing tests collected by the orchestrator; Open questions 1 to 3 carry unconfirmed proposals. (product-owner)

<!-- Sections below are filled in by later roles. Don't delete headings. -->

- 2026-11-08 — Gate: hak accepted all three proposals ("Ja, alle passen"): (1) timing ACs of earlier stories stay as written, relaxed only with hak's consent and a measured basis; (2) a GitHub-side cause of the missing push trigger is decided by hak once known; (3) no flaky pass on retry in CI, retries stay only as a safety net. Status set to ready.
- 2026-11-08 — Question dialog (hak), Open question 1, real-loop test of [010](../../apps/minesweeper/docs/backlog/010-minesweeper-3d-end-effects.md) (`apps/minesweeper/e2e/minesweeper-3d-effects.spec.ts:740`, "real loop › AC1 … ends by itself", wall-clock bound 5 s; on the GitHub runner software WebGL frames stall up to 6.6 s). Proposal: on software WebGL the wall-clock bound becomes 2.5 s plus the measured longest frame gap on the runner (about 10 s), measurement stated in a comment; on hardware GL it stays 5 s; the 2.5 s limit itself stays checked by the fake-clock test. hak's answer: "Grenze nur bei Software-Grafik". Consequence: relaxes the real-loop check of 010/AC1 only on software WebGL, which Open question 1 allows only with hak's consent and a measured basis; `changes: [010/AC1]` set here, annotated in 010. Not yet implemented. (product-owner)
- 2026-11-08 — Question dialog (hak), CI setting: should CI fail on flaky tests (Playwright `failOnFlakyTests`)? hak's answer: "Nein, nur im Log". Consequence: flaky tests stay a note in the log and the job stays green; AC2 (two consecutive clean runs, no flaky) is checked by reading the log, not by the job result. Related to Open question 3. (product-owner)
- 2026-11-08 — Gate: hak approved all retro proposals and the commit ("Alle, dann committen"). Open manual checks: AC1 (a push to main starts CI) and AC5 (deploy on main), checked after the merge; diagnostic commits are to be squashed at the merge (orchestrator proposal, P3).

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

## Implementation notes

_developer: what was built, deviations from the design and why._

One agent across roles (CLAUDE.md, "Factory files"): the orchestrator gave the whole fix to the
developer, because it is small and spans platform config (devops), app CSS (developer) and e2e
specs (tester); there is no separate Technical design, the tester's proposals 1 to 5 in the
Reproduction section are the design. `ci.yml` is unchanged; the push trigger (AC1) is not part of
this change.

- **Load (proposal 1).** `createAppPlaywrightConfig` (`packages/platform/config/playwright.ts`) has
  a new option `ciWorkers`, applied only when `process.env.CI` is set; minesweeper sets
  `ciWorkers: 1` (comment with the runner measurements). avd and local runs keep Playwright's
  default (checked: the config resolves to `workers: 1` for minesweeper under `CI=1`, `undefined`
  for avd and locally). No test timeout and no AC timing changed; raising a 3D test's own timeout
  stays the fallback if a serial runner run still stalls.
- **redesign AC2 (proposal 2).** Before reading the Start, preset and Sign out styles the spec moves
  the mouse to (0, 0) and polls `document.getAnimations().length` to 0, so it reads the resting
  colours, not a hover transition. Assertions unchanged.
- **redesign AC5 (proposal 3).** `overflow-wrap: anywhere` on `h2` in the platform's `base.css`
  (h1 had it already), so every app's section heading breaks a word wider than its column instead
  of overflowing. Checked locally with a wide font forced in: Verdana at 160 px gave
  `scrollWidth` 179/160 without the rule (like DejaVu's 181 on the runner) and 160/160 with it.
  Side effect on macOS at 160 px: "Minesweeper" (H2) now breaks onto two lines; before, it stuck
  out a few pixels into the panel padding. At normal widths nothing changes (the rule only acts on
  a word that doesn't fit). The 0 px assertion is unchanged.
- **Shell title.** Measured in avd: the h1 "Altersvorsorgedepot" (265.6 px at 28 px bold) stays on
  one line from a 300 px viewport up and breaks mid-word only below that, where it does not fit,
  so the existing rule already "wraps only when it doesn't fit"; left unchanged. A nicer break
  ("Altersvorsorge-/depot") would need `hyphens: auto` plus the right page language: avd's
  `index.html` says `lang="en"` for German content, and Playwright's Chromium has no German
  hyphenation dictionary (with `lang="de"` it fell back to "Altersvorsorged/epot"). Open point for
  hak, not done here (app behaviour change, out of scope).
- **avd AC1 chart (proposal 4).** `savingSnapshot` (in `avd.helpers.ts`) now screenshots the chart
  with its HTML text hidden (Playwright `style`: the axis label columns, the axis title and the
  empty note get `visibility: hidden`; layout unchanged) and also returns the chart's `outerHTML`.
  Deviation: the labels are HTML `span`s next to the SVG, not SVG `text`, so `svg text {…}` would
  have hidden nothing. `expectSavingUnchanged` moved from `avd-compare.spec.ts` into the helpers
  (its body equalled the AC1 lines of `avd-reinvest.spec.ts`) and compares figures, table,
  `outerHTML` and the text-free chart at 0 differing pixels (channel tolerance 2 as before). Both
  the reinvest AC1 and the compare AC1/AC3 checks use it. Checked by a probe screenshot: with the
  style only the labels vanish, bars and grid lines stay (2038 px differ from the full chart).
- **AC6 `:773` (proposal 5).** `radio3d(page).click()` instead of `check()`; the following
  assertions (message, 2D checked, game unchanged) are unchanged.

- **Real-loop AC1 `effects:740` (hak: "Grenze nur bei Software-Grafik").** The final bound follows the
  measured frames at the end of the run: the first frame that saw `running === false` must be at
  `<= LOSS_LIMIT_MS (2500) + gap before it + gap before the frame before it + 100 ms` (the second gap because
  `fxState.running` can be one frame stale). Earlier gaps (e.g. the first, which includes the evaluate round trip)
  do not count, so an early stall cannot let a late end pass. One watch cap of 10 s (2.5 s + the 6.6 s runner gap,
  measured in the Reproduction section) and one test timeout of 90 s. Other assertions and `:801` unchanged.
  Note: the hardware/software split was dropped because headless Chromium renders on SwiftShader on every
  machine (also macOS), so the hardware branch never ran; the exact 2.5 s stays checked by the fake-clock test.
  Mutation `lossEndMs: 4200` fails the test (received 4217 ms against about 2685 ms); reverted.
  Fixed in round 1: review findings 1 to 4 (bound on the last frames, split dropped, `LOSS_LIMIT_MS` reused,
  measurement credited to Reproduction).

Local results (macOS, 2026-11-08): `npm run verify` green (unit tests 5 + 154 + 100 + 95 passed);
`npm run test:e2e` avd 80 passed, minesweeper 110 passed (6 workers locally; `ciWorkers` only acts
under `CI`). Not run on the runner; that, and the two consecutive clean runs of AC2, are the
tester's.

Follow-up for the tester: minesweeper has no `e2e/minesweeper.helpers.ts`; helpers such as
`signInAsGuest`, `openGame`, `choose3d`, `startFixed5x5`, `radio3d`, `cell` and `grid` are
copied in three to five specs. Not moved here, to keep this fix small before the runner
verification.

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s)                                                                                               | Result                           |
| --- | ----------------------------------------------------------------------------------------------------- | -------------------------------- |
| AC1 | Manual check by hak (Actions tab after merge); not changed by this fix, see "Push trigger" below      | open (manual)                    |
| AC2 | Two CI dispatches on the branch, 91c79e3 (run 42491468158, run 42492558540), see Verification round 2 | PASS (0 failed, 0 flaky in both) |
| AC3 | Review of the test changes plus a local mutation per change, see Verification and round 2             | PASS                             |
| AC4 | `npm run verify` and `npm run test:e2e` locally (macOS)                                               | PASS                             |
| AC5 | Needs a run on `main`; deploy not reachable from the branch                                           | open (after merge)               |
| AC6 | Both branch runs: `deploy` skipped (not main); e2e red => no deploy shown by run 42484677241          | PASS                             |

### Verification (tester, 2026-11-08, fix commit 8d55e78 on the runner)

CI dispatched twice on the branch, the second after the first had finished. Runner: ubuntu-latest,
`avd` with 2 workers (Playwright default), `minesweeper` with 1 worker (`ciWorkers`), retries 2.

| Run (workflow_dispatch) | verify  | pages   | e2e avd            | e2e minesweeper                   | minesweeper duration | deploy  |
| ----------------------- | ------- | ------- | ------------------ | --------------------------------- | -------------------- | ------- |
| 42488826497 (14:14 UTC) | success | success | 80 passed (30.9 s) | 109 passed, **1 flaky**, 0 failed | 8.0 m                | skipped |
| 42489694667 (14:26 UTC) | success | success | 80 passed (35.1 s) | 109 passed, **1 flaky**, 0 failed | 9.0 m                | skipped |

Both jobs `e2e` ended `success` (a pass on retry does not fail the job), so the job colour hides the
flake; the log's "1 flaky" line shows it. **AC2 fails**: neither run is clean.

Flaky test, identical in both runs: `minesweeper-3d-effects.spec.ts:740` "real loop > AC1: on the real
clock the explosion survives the slow first frames, is drawn, and ends by itself". First attempt
fails at line 783, `expect(last?.running, 'ends by itself').toBe(false)`, received `true`: the
last frame the test saw before its 5 s limit still had the effect running. The retry passes. It is
therefore not load from a second worker (one worker now) and not a race of the test with the
page: the first attempt of this test is slow in the same way in both runs (failure after ~3 m 46 s
and ~4 m 19 s into the serial run, the retry follows 3 to 5 s later). Candidate (not proven): frames of
software WebGL on the 375 x 800 canvas stall for seconds (reproduction: 15 frames in 3 s, max gap
6.6 s), so the effect's wall-clock time of 2.2 s has passed but the loop did not get a frame that
ends it before the test's 5 s break; the single luminance read in the loop (one extra rendered
frame) adds to it. The retry benefits from warm shader/GL caches. Everything else on the runner
passed in the first attempt in both runs: the other four load-dependent tests (loss :364, :801,
cascade :520, parity :672), redesign AC2 and AC5, avd AC1 and AC6 :773. Options for the developer:
raise the loop's own 5 s break by the measured stall (the AC says the effect ends by itself; the
5 s is the test's budget with the "slow frame" allowance, so this is Open question 1 territory
and needs hak), or let the loop break on frames rather than wall time. I did not change it.

AC3, per changed test (local mutation, reverted afterwards; `git status` clean of src changes):

- avd chart snapshot (`savingSnapshot`/`expectSavingUnchanged`, labels hidden by CSS, compared as
  `outerHTML`): mutant 1 appends "." to the y labels once a reinvest state was seen: `avd-reinvest`
  AC1 fails (markup differs). Mutant 2 shortens every bar by 1.5 units after the same condition:
  AC1 fails (pixels differ). So labels are guarded by the DOM, bars by pixels at 0 differing pixels.
  Hidden text is not compared by pixels, which the story allows when the replacement still fails
  (shown). The helper comment states the measured noise (2920 px, 85/255, glyphs only).
- redesign AC2 (mouse away + `getAnimations()` 0): assertions unchanged; mutant: primary button
  background set to the hover colour: `redesign.spec.ts:154` fails. The wait only reads the resting
  state, it does not hide a wrong colour.
- AC6 `:773` (`click()` instead of `check()`): mutant: failure text changed in `view3d.ts`:
  fails at `visibleText(page, FAILED)`. The fallback, message, announcement, 2D checked, enabled
  radio and unchanged game are still asserted.
- `ciWorkers`: `npx playwright test --list --reporter=json` resolves `workers` 1 for minesweeper
  under `CI=1`, 6 without CI and 6 for avd under `CI=1`; the runner logs show "2 workers" (avd) and
  "1 worker" (minesweeper). No assertion or AC timing changed by it.
- redesign AC5 (`overflow-wrap: anywhere` on `h2`): not mutable locally (macOS fonts fit); proven
  by the runner: it failed on the runner without the rule (181/160) and passed in both runs with it;
  the 0 px assertion is unchanged.

AC4: `npm run verify` green. Vitest by header: `@swfactory/platform` Tests 154 passed, `@swfactory/avd`
Tests 100 passed, `@swfactory/minesweeper` Tests 95 passed; the skeleton check (`check:template`) printed
Tests 5 passed. `npm run test:e2e` local: avd 80 passed (8.6 s),
minesweeper 110 passed (1.7 m).

AC6 / 018 AC5: both runs have `deploy` skipped (branch is not `main`); run 42484677241 showed the
"e2e red => deploy skipped" case.

Checked, OK: nothing beyond the above; no new test added (0 tests added in this round).

Verdict: **FAIL** on AC2 (one flaky test in each of two runs). Status stays `in-test`.

### Verification round 2 (tester, 2026-11-08, fix commit 91c79e3 on the runner)

Two dispatches on the branch, the second after the first had finished. `avd` 2 workers, `minesweeper`
1 worker, retries 2.

| Run (workflow_dispatch) | verify  | pages   | e2e avd            | e2e minesweeper                        | deploy  |
| ----------------------- | ------- | ------- | ------------------ | -------------------------------------- | ------- |
| 42491468158 (14:47 UTC) | success | success | 80 passed (38.4 s) | 110 passed (10.2 m), 0 failed, 0 flaky | skipped |
| 42492558540 (15:00 UTC) | success | success | 80 passed (39.2 s) | 110 passed (10.2 m), 0 failed, 0 flaky | skipped |

The e2e job logs have no "flaky" or "failed" line and no retry marker; the summary lines are
"80 passed" and "110 passed" only. **AC2 holds** for both runs.

Real-loop AC1 (`minesweeper-3d-effects.spec.ts:753`): passed on the first attempt in both runs (no
failure block, no flaky line). The bound it used (2.5 s + longest frame gap + 100 ms) is computed in the
test and not logged, so it is not visible in the logs; no console line was added (no test change by
me).

AC3 for the new bound, local mutation (macOS, reverted afterwards, `git status` clean of src):
`lossEndMs` 2200 -> 4200 in `effectParams.ts` (effect ends 2 s later). The real-loop test fails on all
three attempts at line 813, "and not later than the AC limit plus the longest frame gap": expected
<= 3196 ms, received 4205 ms. So the bound follows the measured gap yet still catches a late end.

Checked, OK: nothing beyond the above; 0 tests added in this round.

Verdict: **PASS**. Status set to `in-review`.

### Reproduction (tester, 2026-11-08, before any fix)

Method: CI dispatched on this branch (run 42486479774, head 7468531) plus throw-away diagnostic
specs/workflows run on the runner (commits `dd5cab7` to `78a8e82`, all removed again by `3e0634c`;
the tree equals 7468531). Runner: ubuntu-latest, 4 vCPU, 16 GB, **only DejaVu fonts installed**
(`fc-match system-ui|sans-serif|Segoe UI|Roboto` all give DejaVu Sans), 2 Playwright workers.

Result of the runs (workers 2, retries 2):

| Run                           | avd             | minesweeper                                           |
| ----------------------------- | --------------- | ----------------------------------------------------- |
| 42484677241 (main, first)     | 1 failed        | 4 failed, 4 flaky                                     |
| 42486479774 (this branch)     | 1 failed (same) | 3 failed, 2 flaky (loss AC1 :364 passed this time)    |
| diag, `--workers=1`, no retry | (not run)       | **109 passed, 1 failed** (only redesign AC5), 7.4 min |

Deterministic (fail in all attempts in both runs): avd AC1, redesign AC2, redesign AC5, real-loop AC1 :740.
Load dependent (pass or fail by run): loss AC1 :364, real-loop :801, cascade AC2 :520, parity AC5 :672, AC6 :773.
The serial run (one worker) is not slower than two workers (7.4 min against 7.9 to 11.3 min).

| Test                                        | Cause                                                                                                                                                                                                                                                                                                                                   | Evidence and measured values                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| avd `avd-reinvest.spec.ts:41` AC1 (2920 px) | Linux text rasterisation, not the app, not an animation, not timing. The chart's SVG text (axis labels, "Sparjahr") is drawn differently after the check/uncheck round trip than on first paint; bars are identical. DOM is identical (`outerHTML` equal), `getAnimations()` is 0 at every shot, clock is paused and settled.           | 2920 px differ, max channel difference 85/255, all in the text glyphs of the y labels (rows 8-17, 56-65, ... every 48 px), the x labels and the axis title (diff image: bars at 1/255 only). Repeated shots of the same state differ by 0. Independent of scroll position (same result at scrollY 2000 after the round trip), also after blur. The first shot against a later shot differs in every run (3 of 3 attempts, 2 runs). macOS: 0 px above tolerance 2, max 1/255 over 1948 px. Root cause of why Linux rasterises the text differently is not proven (candidate: LCD against greyscale glyph antialiasing per layer); the fact is reproducible. |
| redesign `:154` AC2                         | The test reads the computed background of **Start** right after the click that leaves the mouse on the button: the hover transition (`var(--duration)`) is still running on the slow runner. It is not fonts: the font set is one family (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`) on every screen, as the AC wants. | Failing assert `start.bg` equals `--color-accent` = `rgb(29, 78, 216)`, received `rgb(29, 72, 199)` (mid-transition). Diag series on the runner after a Start click: `rgb(29,72,199)` (anims=1), then `rgb(30,64,175)` (the hover colour, anims 1 then 0). Locally the colour stayed at the accent for 320 ms (mouse hover not applied the same way). With one worker the test passed (968 ms). Contention-dependent, but deterministic at 2 workers.                                                                                                                                                                                                      |
| redesign `:349` AC5 (160 px, 9 x 9)         | **Fonts.** DejaVu Sans (the runner's only font) is wider than San Francisco/Roboto: the unbreakable word of the heading "Minesweeper" (H2 in the 128 px content box, H1 160 px) overflows the page at 160 px.                                                                                                                           | `scrollWidth` 181 against `clientWidth` 160 (21 px, equal in every attempt of both runs and in the serial run); macOS 160/160. Hiding the H2 (and its wrappers) one element at a time brings `scrollWidth` back to 160. Buttons are 128 px wide in both. Fails also with one worker: not load related.                                                                                                                                                                                                                                                                                                                                                     |
| loss `effects:364` AC1 (30 s timeout)       | Software WebGL (SwiftShader) is 6 to 100 times slower on the runner and the test runs ~45 scene steps and several canvas reads in one `page.evaluate`. A test timeout of 30 s is hit when two workers share 4 vCPUs.                                                                                                                    | Frame cost (`advance(16)` + `toDataURL`), 10 frames: 352 x 309 canvas **median 270 ms, max 6.8 s** on the runner against 45 ms median, 371 ms max on macOS; 332 x 288: median 220 ms, max 1.0 s; 30 x 30 board 1106 x 959: macOS median 442 ms. Serial run: the test takes 13.1 s and passes (first run: failed 3 of 3, second run: passed).                                                                                                                                                                                                                                                                                                               |
| real loop `effects:740`, `:801` AC1         | Real-clock frames stall on software WebGL: a frame gap up to 6.6 s, so the explosion's frames are not drawn before the test's 5 s watch window ends (scene time is wall time, the effect itself lasts 2.2 s).                                                                                                                           | rAF over 3 s with the 3D scene running: runner **7 frames (max gap 2.56 s) at 1280 x 720, 15 frames (max gap 6.63 s) at 375 x 800, 10 frames (max gap 0.6 s) for 30 x 30**; macOS 56 to 59 frames, max gap 0.57 to 0.76 s. `:740` fails in all attempts (`ends by itself`, expected false, received true) at 2 workers, passes serial (12.2 s); `:801` flaky at 2 workers, passes serial (10.1 s).                                                                                                                                                                                                                                                         |
| cascade `scene:520` AC2                     | Collateral of the same load: `choose3d` in `beforeEach` waits 15 s for `aria-busy` to end and the 3D chunk plus WebGL context under contention takes longer; or the browser of the worker is broken by the timed-out test before it.                                                                                                    | `aria-busy="true"` still set after 15 s (5 polls), beforeEach timeout 30 s. Diag open time of the 3D view on the runner 0.5 to 2.0 s when the machine is idle. Serial run: passes in 27.4 s.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| parity `scene:672` AC5                      | Same load effect, seen as `browser.newContext: Protocol error (Browser.setDownloadBehavior): Failed to find browser context` (the worker's browser went away after a timed-out neighbouring test) and the `beforeEach` timeout.                                                                                                         | Flaky in both runs (passes on retry). Serial run: passes in 19.1 s.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| AC6 `scene:773` (failing load)              | Race in the test, made visible by a slower runner: the app falls back to 2D as soon as the aborted chunk fails, and `radio3d(page).check()` verifies the state after its click, so it sees "not checked" and throws.                                                                                                                    | `Error: locator.check: Clicking the checkbox did not change its state` after `click action done`; the page snapshot in `error-context.md` shows the 2D board and the failure state. Flaky (passed on retry); passes serial (1.0 s). Not measured further.                                                                                                                                                                                                                                                                                                                                                                                                  |

Proposals for the smallest correct fix per cause (for the developer and devops, no code written):

1. **Software WebGL contention (loss :364, real loop :740/:801, cascade :520, parity :672, redesign AC2 partly):**
   run the minesweeper project with `workers: 1` on CI (`process.env.CI`), in the config
   (`createAppPlaywrightConfig` or the app config). Measured: serial 109 of 110 pass, not slower in
   total. It changes no assertion and no AC timing (Open question 1 stays closed). Re-measure with
   the fix twice (AC2 needs two consecutive clean runs), because one serial run is a sample of one.
   If a test still stalls: raise `test.setTimeout` for the 3D tests with the measured basis (13 to 27 s
   serial), not the AC limits. For the real-loop tests keep "plays and ends"; the AC limit stays.
2. **redesign AC2:** before reading `start`/`presets`/`signOut` styles move the mouse away
   (`page.mouse.move(0, 0)`) and wait until `document.getAnimations().length` is 0 (this rule already
   exists in memory for cells), or read the Start style before clicking it. Not a design value change.
3. **redesign AC5 (160 px):** fonts. Preferred: the app lets the title wrap/shrink at 160 px
   (`overflow-wrap: anywhere` on the headings, or a token for the narrow size): the AC says "no sideways
   scroll" and the runner just shows a real overflow with a wider font. Alternative if hak calls 160 px
   a macOS-only promise: install a metric-compatible font on the runner (e.g. `fonts-liberation`
   plus a `system-ui` alias) so CI renders like a normal desktop; do not loosen the 0 px assertion.
4. **avd AC1 chart equality:** compare what the AC is about, the bars, and keep the labels by DOM:
   `chart.screenshot({ style: 'svg text { visibility: hidden }' })` for both shots (still 0 px
   tolerance on the bars) plus `expect(chartOuterHtml after).toBe(before)` for the labels. A
   tolerance of 2920 px would not be "measured noise" of the existing 2/255 rule (that noise is the
   rasteriser's text mode, 85/255).
5. **AC6 `:773`:** replace `radio3d(page).check()` by `click()` and assert the failure message (the
   fallback to 2D is the expected result; `check()` demands that the radio stays checked).
6. Nothing in `ci.yml` needs a retry change; AC2/Open question 3 (no flaky) is satisfied by 1 to 5
   only if two consecutive runs are clean, so verify with two dispatches on the branch.

### Push trigger (AC1) - what can be proven

- Pushing this branch (`fix/019-...`) started **no** `CI` run, as designed (`on.push.branches: [main]`).
- **Push triggers work in this repo.** A throw-away workflow with `on: push` branches `fix/019-**`
  started on every push (success). A temporary change of `ci.yml` to `branches: [main, 'fix/019-**']`
  made **`CI` itself start on a push** (run 42487999723, event `push`; it failed in `verify` only
  because of my diagnostic files). So the `ci.yml` content, the `permissions`/`concurrency` blocks
  and the actions setup are not what blocks pushes; neither is the repo's Actions permission
  (`enabled`, `allowed_actions: all`, no rulesets, no webhooks) nor my token (scopes `repo`, `workflow`).
- `ci.yml` was valid at the three versions ever pushed (`5b4b2b9`, `25ef9c6`, `81a308d`); no
  "workflow file issue" runs exist. No commit message contains `[skip ci]`/`skip-checks`.
- Facts about main: 14 push events to `refs/heads/main` (activity API, 2026-11-02 to 11-08, one ref
  per push), **0 `push` runs, 0 check suites for those heads** (`actions/runs?event=push` was 0 before
  my branch pushes). The only run on main is the manual dispatch. The repo, its branches `main`,
  `feature/001-login`, `feature/004-guest-login` and workflow "CI" (id 403859678, created
  2026-11-01 20:30:30 UTC) all appeared in one initial push at 20:30 UTC (repo created 20:30:09 UTC).
- Not provable from here: **why pushes to `main` in particular start nothing.** I cannot push to
  `main`, and a branch push works with the same file. Candidates, in order: (a) the first push (3 refs
  at once, workflow created in the same instant) left the workflow's `push` registration for `main`
  broken on GitHub's side; (b) something specific to pushes of the default branch from hak's
  machine. Cheapest next step for hak/orchestrator (needs a push to main, so not mine): after the
  fix merges, look at the Actions tab once; if still nothing, re-register the trigger by a small
  edit of `on:` in `ci.yml` pushed to `main` (new workflow revision) or disable and enable the
  workflow once (a repo setting, hak decides, Open question 2). Workaround that already works:
  `gh workflow run CI --ref main` after each merge (this is also what deploys to Pages).

Regression after review fixes (2026-11-08): runner runs 42494874101 (head 2686475) and 42495980433 (head 2686475), dispatched one after another, each with e2e success, 0 failed and 0 flaky per log: avd 80 passed, minesweeper 110 passed (1 worker) in both; local `npm run verify` green (platform 154, avd 100, minesweeper 95 vitest; template 5), local `npm run test:e2e` green (avd 80 passed, minesweeper 110 passed).

After the merge (2026-11-08): the squash merge ee65409 pushed to `main` started CI by itself (run 42498533834, event `push`): verify, pages, e2e (avd 80 passed, minesweeper 110 passed, no flaky) and deploy all green, so AC1 and AC5 hold. Both live URLs answer 200 and their bundles contain the guest sign-in and no Google sign-in URL (checked with curl; the browser pane blocks github.io by org policy). The cause of the earlier missing push runs stays unproven. hak's own check of guest sign-in on the live sites is still open.

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

**Round 1, reviewer 2026-11-08. Verdict: APPROVED. Checklist version: 2**

Scope: `git diff main...HEAD` (the 8 `chore(diag)` commits net to zero: `git diff 7468531 3e0634c` is
empty; the change is `8d55e78` and `91c79e3`) plus the uncommitted story, index, 010 and memory edits.
`.claude/launch.json` ignored; CHANGELOG follows in the tech-writer step.

| Item | Result | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | AC1 manual after merge, cause/workaround documented; facts re-checked by `gh api` (0 `push` runs on `main`, 13 merge pushes + branch creation with 0 check suites, `CI` ran on push 42487999723 when the branch was listed, `ci.yml` `on:` identical at every main head). AC2 both e2e logs read by me (see T1). AC3 per change below. AC4 verify + changed specs green locally. AC5 open (needs `main`). AC6 `deploy needs: [e2e, pages]` unchanged |
| C2   | n.a.   | no network call or pending state in app code; only tests, test config and one CSS rule                                                                                                                                                                                                                                                                                                                                                               |
| C3   | n.a.   | no hook or component logic changed                                                                                                                                                                                                                                                                                                                                                                                                                   |
| C4   | n.a.   | no render loop or imperative controller changed (the real-loop spec only reads the probe)                                                                                                                                                                                                                                                                                                                                                            |
| C5   | n.a.   | no reducer changed                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| C6   | n.a.   | no error handling or I/O in the diff                                                                                                                                                                                                                                                                                                                                                                                                                 |
| S1   | n.a.   | no input or rendering code changed (one `h2` CSS property)                                                                                                                                                                                                                                                                                                                                                                                           |
| S2   | pass   | Playwright config gains `ciWorkers` only; no secret, no env value besides the existing `CI`                                                                                                                                                                                                                                                                                                                                                          |
| S3   | n.a.   | `package.json` dependencies unchanged                                                                                                                                                                                                                                                                                                                                                                                                                |
| S4   | n.a.   | no dev-only code added; the probe's `renderer` getter existed (story 010)                                                                                                                                                                                                                                                                                                                                                                            |
| S5   | n.a.   | no root `scripts/`, `templates/app/` or app script touched; the skeleton's config passes no `ciWorkers` and `check:template` is green                                                                                                                                                                                                                                                                                                                |
| T1   | pass   | `npm run verify` exit 0 (vitest 5 + 154 + 100 + 95, check-dist ok, build-pages ok). Changed specs locally: minesweeper real loop, redesign AC2/AC5, AC6 `:773` x2 = 10 passed; avd reinvest + compare 18 passed. Runner logs of 42491468158 and 42492558540: "2 workers"/"1 worker", "80 passed", "110 passed", no flaky/failed/retry line                                                                                                           |
| T2   | pass   | no test added; `expectSavingUnchanged` now one helper instead of a copy in two specs                                                                                                                                                                                                                                                                                                                                                                 |
| T3   | pass   | chart: `differingPixels` returns Infinity on a size mismatch, `outerHTML` covers the hidden labels, tester's label and bar mutants fail; redesign AC2 waits for 0 animations but asserts unchanged values (hover mutant fails); the 2.5 s limit stays exact in the fake-clock test `:377`. Weak spot of the real-loop bound: finding 1                                                                                                               |
| T4   | pass   | names keep their ACs; `mouse.move(0, 0)` is the page corner, not an element; AC6 `click()` on the 2D page (no motion); no Tab counting                                                                                                                                                                                                                                                                                                               |
| T5   | pass   | the `ciWorkers` branch has no unit test; the story records the resolved values (`--list` under `CI=1`) and the runner logs show them                                                                                                                                                                                                                                                                                                                 |
| K1   | pass   | tester proposals 1 to 5 as design, deviation (HTML `span` labels, not `svg text`) in Implementation notes; dead hardware branch and a duplicate constant: findings 2, 4                                                                                                                                                                                                                                                                              |
| K2   | pass   | `ciWorkers?: number \| undefined`, no `any`/`!`, named exports                                                                                                                                                                                                                                                                                                                                                                                       |
| K3   | pass   | `overflow-wrap: anywhere` only; no colour, size or transition; full-page screenshots with and without the rule are byte-identical at 1280/768/375/320/240/200 px in both apps, differ only at 160 px; no pixel test covers an `h2` (avd compares the chart `img`, minesweeper the board scroller)                                                                                                                                                    |
| K4   | pass   | platform config and `base.css` name no app (comments say "an app whose specs drive software WebGL", "bug 019"); `check:structure` ok                                                                                                                                                                                                                                                                                                                 |
| K6   | pass   | story `in-review` = index row `in-review`                                                                                                                                                                                                                                                                                                                                                                                                            |
| K7   | pass   | gate, Open question 1 ("Grenze nur bei Software-Grafik") and `failOnFlakyTests` ("Nein, nur im Log") logged; only appended against `main`; `changes: [010/AC1]` set and 010/AC1 annotated with a working link                                                                                                                                                                                                                                        |
| K8   | n.a.   | CHANGELOG is written in the tech-writer step after this review; checked before gate 2                                                                                                                                                                                                                                                                                                                                                                |
| K9   | pass   | `format:check` in `verify` green (story re-checked after this section)                                                                                                                                                                                                                                                                                                                                                                               |
| K10  | n.a.   | no workspace script or tsconfig changed                                                                                                                                                                                                                                                                                                                                                                                                              |
| K11  | n.a.   | no env variable added (`CI` is set by the runner)                                                                                                                                                                                                                                                                                                                                                                                                    |
| A1   | n.a.   | no control, focus, label or live region changed                                                                                                                                                                                                                                                                                                                                                                                                      |
| A2   | n.a.   | no state cue or colour changed; wrapping only (see K3)                                                                                                                                                                                                                                                                                                                                                                                               |
| A3   | n.a.   | no animation or announcement changed                                                                                                                                                                                                                                                                                                                                                                                                                 |
| A4   | n.a.   | no render loop or canvas code changed                                                                                                                                                                                                                                                                                                                                                                                                                |

Findings:

1. `[minor] apps/minesweeper/e2e/minesweeper-3d-effects.spec.ts:801-813` - the bound
   `2500 + longestGap + 100` takes the longest gap anywhere in the run, including the first one,
   which is measured from the click and contains the `page.evaluate` round trip. The bound can only
   fail when a frame later than about 2.6 s still sees `running` and the stall happened at the end.
   With one early stall of g seconds, an effect that ends late by up to g still passes. On the
   runner, g is up to 6.6 s (capped by the 10 s window). The comment "the one slow frame that can
   hide the end" claims more than the code checks. This stays within hak's consent (2.5 s plus the
   measured gap, about 10 s, on software WebGL), and the fake-clock test `:377` still pins 2.5 s on
   every machine, so it is not a hole in 010/AC1. Fix: take the allowance from the frames at the end
   (`last.t` minus the last running frame, or the last two gaps, since `fxState.running` changes only
   in the scene's own frame and can be one frame stale), or correct the comment.
2. `[minor] apps/minesweeper/e2e/minesweeper-3d-effects.spec.ts:760-764` - `software` is true in
   every run: `launchArgs` force SwiftShader in every project, and headless Chromium on macOS reports
   "ANGLE (… SwiftShader driver)" even without the flags (probed). So `HARDWARE_WATCH_MS` and the
   60 s timeout never run, and the Decision-log premise "on hardware GL it stays 5 s" fits no e2e run.
   The relaxed 10 s cap therefore applies locally too, although the per-run bound there is about
   3.2 to 3.4 s, stricter than the old 5 s. Fix: tell hak at gate 2. Then either drop the branch
   (one 10 s cap, one 90 s timeout) or keep it with a comment that it only serves a GPU run outside
   the suite.
3. `[minor] .claude/agent-memory/tester/MEMORY.md` (new lines) - the DejaVu line recommends
   `screenshot({style:'svg text{visibility:hidden}'})`. That is the recipe the developer found to
   hide nothing (the labels are HTML `span`s), and the last line says "on hardware GL" for a
   SwiftShader run. Both would mislead later runs. Fix (tester): hide the chart's HTML text, as
   `CHART_TEXT_HIDDEN` in `avd.helpers.ts` does, and drop "on hardware GL".
4. `[nit] apps/minesweeper/e2e/minesweeper-3d-effects.spec.ts:44` - `AC_LIMIT_MS = 2500` repeats
   `LOSS_LIMIT_MS` (`:57`, "the only numbers asserted"). Fix: use `LOSS_LIMIT_MS`.
5. `[nit] apps/minesweeper/e2e/minesweeper-3d-effects.spec.ts:47-50` - the 6.6 s is cited as "story
   019 Verification", but it is measured in the Reproduction section (diagnostic run, 2 workers).
   Fix: cite "Reproduction".
6. `[nit] branch history` - the 8 `chore(diag) … (drop me)` commits (one edits `ci.yml`) net to
   zero, but their messages ask to be dropped. Also, the workflows `zz-diag` and `zz-probe-push`
   stay listed as active in the Actions tab with their 13 runs. Fix (hak's call at merge): squash
   or drop them, then delete the `zz-*` runs (`gh run delete`).

Checked, OK:

- `ciWorkers` acts only under `CI` and only for minesweeper; avd and the skeleton are unchanged.
- The 10 s software cap is honest: 2.5 s plus the measured 6.63 s gap plus the margin is about
  9.2 s, rounded up. It is what makes "never ends" fail on software WebGL.
- The push-trigger facts and the workaround (`gh workflow run CI --ref main`, shown by run 42484677241) are accurate. Cause candidates (a) and (b) are marked as unproven.

Outside this story: the minesweeper specs still copy their helpers (developer's follow-up). This
was there before and breaks "Shared e2e helpers"; it needs a follow-up chore.

## Explanation

CI had never run on GitHub: pushes to main started nothing, and the first manual run showed red e2e tests.
The tests passed on the Mac but failed on GitHub's Linux machine, which has other fonts and no graphics card.
Minesweeper's 3D tests now run one at a time on CI, because two at once overloaded the software graphics.
Two tests read a button colour or clicked a switch too early; they now wait for the animation or click directly.
Headings may now break inside a long word at very narrow widths; the wider Linux font made one overflow.
The avd chart comparison hides the axis labels in the picture and compares them as text instead.
The 3D explosion test on the real clock now allows the slow frames it measures (hak's decision).
The exact 2.5 s limit of the explosion is still checked on the fake clock on every machine.
Two runs in a row on GitHub are now green with no flaky test; locally everything stays green too.
Pushes to other branches start CI; why pushes to main don't is still unknown. The workaround is a manual run.
After review: the 3D test only counts the last frames before the end, so an early stall can't hide a late end.
Risks: the push trigger on main may stay broken; flaky tests only show in the log, the job stays green.
Not verified: a push to main starting CI, and the first deploy of the published site.

## Retrospective

**Why the bug got through**

- **CI never ran.** Since the first push on 2026-11-01, pushes to `main` started no CI run, and nobody checked the
  Actions tab; the note "CI not triggered yet" was deferred. So stories 009, 010, 015, 017 and 018 were merged on
  local runs only, and their e2e tests had never met the Linux runner. Root cause: the Definition of Done counts
  local `verify`/e2e only and never asks for a green CI run.
- **Tests assumed the Mac.** Fonts (DejaVu only), software WebGL speed and Linux text rendering differ on the runner;
  three tests also read state too early (hover colour, a reverting radio). Root cause: no convention about the
  runner environment; the review of 009/010/015 couldn't see it without a CI run.
- **This fix:** the reviewer found the first real-loop bound too loose and a hardware branch that never runs
  (headless Chromium is SwiftShader everywhere); fixed in one round. Eight diagnostic commits were needed on the
  branch to probe the runner.

**Proposed changes**

- **P1 (CLAUDE.md, Definition of Done):** "a green CI run of the story branch on GitHub (run id in the Test report);
  while a push doesn't start CI, the orchestrator starts it with `gh workflow run CI --ref <branch>`."
- **P2 (CLAUDE.md, test rules):** "e2e runs on the Ubuntu runner with DejaVu fonts only; headless Chromium renders
  WebGL with SwiftShader on every machine. Layout checks at narrow widths must hold with wider fonts; pixel
  comparisons across systems leave text out and compare it as DOM/text; computed styles are read only after
  transitions ended (`getAnimations()` empty); software-GL specs run with one worker on CI."
- **P3 (CLAUDE.md, Branches):** "throw-away diagnostic commits (`chore(diag) … drop me`) are squashed or dropped
  before merge; temporary workflows and their runs are removed."
- **P4 (`.claude/agents/tester.md`):** "A CI e2e job is green even with flaky tests; read the log for `flaky` and
  count a pass on retry as a failure."

**Outcome (gate, 2026-11-08):** hak approved all proposals. P1, P2 and P3 applied to CLAUDE.md, P4 to `.claude/agents/tester.md` (devops). AC1 and AC5 stay open until the first run on main after the merge.

Agent memory diffs were checked; the reviewer flagged two misleading tester lines, which the tester corrected.

### Cost

| Role                        | Round | Model  | Tokens       | Tool uses | Duration |
| --------------------------- | ----- | ------ | ------------ | --------- | -------- |
| product-owner               | 1     | sonnet | 55477        | 7         | 0:41     |
| tester                      | 1     | sonnet | 169613       | 66        | 21:23    |
| developer                   | 1     | opus   | 100247       | 45        | 6:38     |
| tester                      | 2     | sonnet | 71617        | 29        | 23:19    |
| product-owner               | 2     | haiku  | 66510        | 8         | 0:31     |
| developer                   | 2     | sonnet | 40835        | 10        | 2:57     |
| developer                   | 3     | sonnet | n/a          | 13        | 6:11     |
| tester                      | 3     | sonnet | 47633        | 19        | 27:47    |
| reviewer                    | 1     | opus   | 125756       | 39        | 8:29     |
| tech-writer                 | 1     | haiku  | 45951        | 8         | 0:24     |
| developer                   | 4     | sonnet | 37500        | 12        | 3:22     |
| tester                      | 4     | haiku  | 29471        | 3         | 0:10     |
| tester                      | 5     | haiku  | 45803        | 22        | 26:38    |
| devops                      | 1     | haiku  | 33159        | 10        | 0:32     |
| total (measured)            |       |        | 869572       | 291       | 2:09:02  |
| orchestrator (main session) |       | opus   | not measured | n/a       | n/a      |

The tester stands out: five runs, three of them waiting for two runner runs of about 12 minutes each.
