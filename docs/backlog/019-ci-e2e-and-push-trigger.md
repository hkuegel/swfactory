---
id: 019
title: CI - e2e green on the GitHub runner and push to main starts CI
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: bug # feature | bug | chore
app: platform # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: fix/019-ci-e2e-and-push-trigger
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [] # stories whose behaviour this one modifies, e.g. [004/AC2, 007]; stays empty unless hak relaxes a timing AC (Open question 1)
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

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

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
