---
id: 034
title: A publish run checks the whole tree only for the checks that read the whole tree
status: done
type: feature
app: platform
size: M
branch: feature/034-publish-run-scopes-the-workspace-steps
supersedes: []
changes: [029/AC3, 026/AC4, 029/AC1]
superseded-by:
---

# 034 – A publish run checks the whole tree only for the checks that read the whole tree

## Original request

> "ok, ich frage mich wieso die minesweeper sachen gecheckt werden, wenn wir an einer eigenen app arbeiten"

and, after the two options were put in front of him:

> "mach B"

## User story

As the person who publishes one app, I want the run that publishes to check the whole tree only where a
check reads the whole tree at once, and to run the per-workspace checks in the workspaces my change can
reach, so that a change in one app does not read the other apps even in the run that publishes.

## Context

Story 029 already scopes the checks a workspace can run alone, but only in an affected run, and story 026
AC4 says a run that publishes is always a full run. So the run that publishes reads every workspace, which
is what hak asked about: a `laz`-only change runs the minesweeper e2e group, and that group is the flakiest
in the tree (story 025, Review finding 1) and blocks the publish when it fails.

The mapping itself answers correctly for a `laz`-only change with a recorded run: the steps are `build`,
`check:dist`, `format:check`, `lint`, `test`, `test:e2e`, `typecheck` and the workspaces are `apps/laz`. The
whole-tree part of the answer is what this story keeps, the workspace part is what it applies to the
publishing run as well.

Two kinds of check behave differently, and that is the whole of this story:

- A check that reads or writes the tree in one pass cannot be scoped: `build` writes the published site for
  every app, `check:dist` reads that site, `build:pages` and `test:pages` produce and compare the published
  pages, `format:check`, `check:structure` and `check:template` scan the whole tree, `test:scripts` runs the
  factory scripts. The publish is the whole site, so these run whatever the change set is.
- A check a workspace can run alone reads only that workspace: `typecheck`, `lint`, `test`, `test:e2e`. These
  are scoped to the workspaces the change can reach, with the same rule story 029 uses (the workspace defines
  the script in its own `package.json`, `--if-present`, and every changed path must lie inside a workspace).

## Acceptance criteria

- **AC1:** Given a run that publishes, when its plan is made, then the checks that read or write the tree in
  one pass are in the plan whatever the change set is — `build`, `build:pages`, `check:dist`,
  `check:structure`, `check:template`, `format:check`, `test:scripts`, `test:pages` — and each of them runs
  as a whole-tree command; measured as the plan's step list for a markdown-only change, which an affected run
  answers with two steps.
- **AC2:** In the same run, the checks a workspace can run alone — `typecheck`, `lint`, `test`, `test:e2e` —
  run only in the workspaces the change can reach, with `-w <workspace>` and `--if-present`, measured as the
  command the runner builds for each step from a hand script map.
- **AC3:** The publishing run never scopes a step when a run that only visits workspaces cannot see the
  change: a changed path in no workspace (`docs/`, a root file), a tooling change, a data-file change
  (story 025, hak's rule of 2026-11-14), or no recorded run. A publishing run with no record is still a full
  run, so the record rule and the data-file rule are not weakened by this story.
- **AC4:** The record names the mode of the run that wrote it and the workspaces it ran, and the report names
  the scope of every step, so a run that covered one workspace cannot be read as a run that checked the whole
  tree. A green publishing run writes the record, a red one writes nothing, and `--no-record` writes nothing.
- **AC5:** CI names the mode for the event: `publish` for a push to `main` and for a run started from the UI,
  `affected` for a pull request, and it names the change the run publishes: the pull-request base, the commit
  `main` was at before a push, or the pushed commit for a run started from the UI. Without the second, a
  publishing run has no changed path, so nothing can be scoped and the workspace steps are skipped. Measured as
  the expression in the plan step, read for each event by hand, not as a test that reads the repository.

## Out of scope

- No duration is asserted in a test; the savings are reported (story 026, Out of scope).
- No change to the mapping's groups: which checks can see a change stays story 026's decision; this story
  decides where a planned step runs in a publishing run.
- Pull-request runs are not changed: an affected run already scopes what it can.
- The residual risk hak accepted with B: a change that the mapping cannot see — the runner's machine, its
  GPU, a browser build — is not a changed path, so a scoped run can look green for a workspace it did not
  run. A dependency or tooling change is a tooling path and stays a full run, which covers the Playwright
  version (story 028 AC2); a machine change is not covered by any rule, and the publish is the whole site.

## Open questions

1. Whether the flaky minesweeper 3D e2e group gets a defect story of its own, or is accepted as machine load
   under 16 parallel workers with only the publishing run required to be green (story 025, Review finding 1).
   Hak's decision.

## Decision log

- 2026-11-14 — Q: why does a change in one app check the other apps? — A: the mapping does not; the run that
  publishes was always full (story 026 AC4), and locally nothing was recorded, so `--no-record` made every
  run full. Hak chose B: the whole-tree checks stay whole tree, the workspace checks run in the workspaces
  the change can reach (hak, 2026-11-14).
- 2026-11-14 — Decision (orchestrator): the third mode name is `publish`, so `full` keeps its meaning — a run
  that checks the whole tree, which is what a run with no record is. The publish plan is the whole-tree steps
  always, plus the workspace steps the mapping can see, scoped to the reachable workspaces. `build:pages` is
  in the whole-tree set because `test:pages` reads what it writes (story 026 AC5), which is why the set has
  eight steps rather than the seven hak named in B: he named the checks, and a producer is always counted with
  the check that reads its output.
- 2026-11-14 — Decision (orchestrator): a publishing run records, because the next run compares against it;
  the record names its mode and the workspaces it ran, so a scoped run is not read as a full run. The record
  is not read as coverage of a workspace it did not run: the plan derives the workspaces from the changed
  paths, so a change in a workspace always runs that workspace, and a change in no workspace is never scoped.
- 2026-11-14 — Decision (orchestrator): CI names `publish` for a push to `main` and for a UI run, `affected`
  for a pull request, so the CI comment and the plan step say the same thing.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_Not a UI story: the change is the runner's plan and the CI plan step._

## Technical design

The mode is data passed to `plan`, so the third name is a branch in the same function that answers
the record rule and the data-file rule. `runsPerWorkspace` takes the mode it is given and the step it is asked
about, and answers false for a step in the whole-tree set when the mode is `publish`. The whole-tree set is
derived from the step list, not written twice: eight steps, the four scoping steps named by what a workspace
can run alone. The runner's record is written by a function that takes the plan answer and the snapshot, so the
record's content can be asserted with a hand expectation instead of by running a pipeline. The report line for
a step already names its scope; with a publishing run that line becomes meaningful for the scoping steps._

## Implementation notes

- `SCOPING_STEPS` and `WHOLE_TREE_STEPS` are derived once in `scripts/affected-checks.mjs`: the four names are
  written, the eight are the step list without them. `plan` has the publish branch as described, and
  `runsPerWorkspace` answers false for a whole-tree step in a publishing run. The data-file rule, the no-record
  rule and the tooling rule are unchanged, so a publishing run that cannot scope stays the full plan.
- `recordForRun` and `scopeText` are exported from `scripts/verify.mjs` so both can be asserted without running
  a pipeline (P17). `printPlan` prints the changed/apps/skipped lines for any mode except `full`, which is the
  change needed for the report to name a publishing plan at all.
- One deviation from the hand expectation as first written: a tooling change in a publishing run keeps mode
  `publish` with all twelve steps and nothing scoped, because the record must still say which run wrote it. The
  test now asserts that (the mode is `publish`, the plan is the whole plan). It does not answer `full`: the mode
  is the caller's statement about the event, and the plan is what the rules allow for that event.
- The record gate is `full` or `publish`. `scopedSteps` is computed inside `recordForRun` from the same answer
  and the same script map the command is built from, so the record cannot claim a scope the command did not run.

## Test report

| AC  | Test(s)                                                                                                                                                                                                                                                                       | Result                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| AC1 | `scripts/affected-checks.test.mjs`: the eight and the four sets, the markdown-only publishing plan                                                                                                                                                                            | green                 |
| AC1 | same file: `build:pages` and `check:dist` are in the whole-tree set                                                                                                                                                                                                           | green                 |
| AC2 | same file: the four scoping steps scoped to `apps/x`, the eight not; the affected plan has seven steps                                                                                                                                                                        | green                 |
| AC3 | same file: planted violation - a change in no workspace is never scoped; tooling and no-record keep the full plan; the data-file rule still answers a full run                                                                                                                | green                 |
| AC4 | `scripts/verify.test.mjs`: the record for a publishing run, for a full run, and nothing for an affected run                                                                                                                                                                   | green                 |
| AC4 | `scripts/verify.test.mjs`: `scopeText` and the command for the same step cannot disagree                                                                                                                                                                                      | green                 |
| AC5 | `ci.yml` plan step read by hand: `publish` for `push` to main and `workflow_dispatch`, `affected` for a pull request                                                                                                                                                          | green (read, not run) |
| —   | Hand run of the runner in `scratchpad-034/cli`, `--mode=publish`: the report printed `in apps/x` for the four and `whole tree` for the eight, `check:dist` was whole tree although `apps/x` defines the script, `test:scripts` was whole tree because no workspace defines it | observed              |
| —   | The same hand run wrote the record with `mode: publish`, `workspaces: [apps/x]`, `scopedSteps` the four; the failing path (one stub exits 1) exited 1 and wrote no record                                                                                                     | observed              |
| —   | Mutation checks on copies: whole-tree guard removed → AC3 fails; union removed → AC1 and AC2 fail; the `inside` rule dropped → AC3 fails; record gate widened → an affected run writes a record; record drops `workspaces` → the record assertions fail                       | each rule fails once  |

The two test files together: 51 tests, all pass (33 + 18). `prettier --check`, `check:structure`,
`check:template`, `typecheck`, `lint`, `test`, `test:scripts`, `check:dist`, `test:pages` and the builds are
green on this content in the full run. In that run `test:e2e` was green on the second attempt and red on the
first, with the two 3D cases story 025 already names; the run that publishes this story was green in all twelve
steps.

CI observation for AC5 (run `43616278535`, commit `988da31`, the first publishing run on CI): the plan printed
`mode publish, 8 of 12 steps`, `changed: nothing`, `apps: none`, `skipped: lint, test, test:e2e, typecheck`.
The base was the pushed commit itself, so the run had no changed path, nothing could be scoped, and no app test
ran. That is finding 1 below, and the fix is the base expression in the plan step.

Defects found: none in the runner. The minesweeper 3D e2e instability recorded in story 025 (Review finding 1)
is a `[major]` finding that this story does not fix; with the publish run scoping `test:e2e` to the changed app,
a `laz`-only change no longer runs that group, which removes the blocking effect hak asked about, but the group
still runs for a change that reaches the minesweeper app.

## Review

Verdict: CHANGES_REQUESTED at round 2, APPROVED at round 1.

Round 1:

- `[minor]` The hand run is a stub tree, so it shows where the commands go, not that a real check passes in the
  scoped workspace. A real scoped publish run will be observed on CI with the next `laz` change.
- `[minor]` `recordForRun` sorts the workspaces it writes; the plan already answers sorted, so the sort is
  defensive. Kept, because the record is read as a coverage claim by the next run.
- Accepted residual risk (hak, rule B): a machine or GPU change is not a changed path, so a scoped run can look
  green for a workspace it did not run.

Round 2 (2026-11-14, read from the first publishing run on CI, run `43616278535`):

- `[major]` finding 1 — the plan step took the pushed commit as the base for a push, so a publishing run had no
  changed path, could scope nothing, and skipped the four workspace steps: it published the site without running
  any app test (`mode publish, 8 of 12 steps`, `changed: nothing`, `apps: none`). The base for a push is the
  commit `main` was at before the push, which is now the expression in the plan step and part of AC5. A run
  started from the UI has no change to compare against, so it keeps the whole-tree checks; that is stated as the
  rule here rather than assumed, and the next `laz` change on CI must show the plan naming `apps/laz` for the
  four steps.

## Explanation

The run that publishes now separates two kinds of check. A check that reads or writes the whole site at once
still runs for the whole site: the build, the published-pages comparison, the structure and template gates,
the formatting check, the script tests. A check that one workspace can run alone runs only in the workspaces
the change can reach: typecheck, lint, the tests, the browser tests. A `laz` change therefore no longer runs
the minesweeper browser tests, which was the flakiest group and the one that blocked the publish.

Nothing is skipped that a publishing run could miss: a file belonging to no workspace, a tooling change, a
committed data file, or a run with nothing recorded still checks everything. And the record of a publishing run
now names the workspaces it ran and the steps it scoped, so a coverage claim can be read as what it was.

A publishing run also names the change it is publishing: for a push it compares against the commit main was at
before the push, because a run that compares against the commit it just pushed sees no change at all and would
skip every test that belongs to one app.

## Retrospective

- One round with no defects, then round 2 from the first publishing run on CI: the base the plan used was the
  pushed commit, so a publishing run had nothing to scope and ran no app test. The rule needed the commit `main`
  was at before the push, which is what the plan step now names. The story's own AC5 did not say which base a
  publishing run uses; a criterion that names the mode but not the change it compares against is not complete,
  so AC5 now names both.
- One hand expectation was corrected by the implementation: a tooling change in a publishing run keeps the mode
  it was given, with all twelve steps and nothing scoped, because the record must still say which run wrote it.
  This is the second time this story's own expectation and the rules of an earlier story disagreed; the earlier
  stories' rules won, as they should.
- A test title with an apostrophe breaks vitest's import analysis in a `.mjs` file. Proposed change to
  `tester.md`: write test titles without an apostrophe, as P31. Pending hak's approval.
- No process rule changed by this story beyond the mode itself: the whole-tree checks are the ones that read
  the tree in one pass, and that is already what P30 says about coverage claims.

### Cost

| Role                        | Round | Model | Tokens                                                    | Tool uses                                                 | Duration                                           |
| --------------------------- | ----- | ----- | --------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| product-owner               | 1     | n/a   | not measured (gate 1 answered by hak in the main session) | not measured (gate 1 answered by hak in the main session) | not measured (no per-run counters in this harness) |
| architect                   | 1     | n/a   | not measured (no architect run, design by orchestrator)   | not measured (no architect run)                           | not measured (no architect run)                    |
| developer                   | 1     | n/a   | not measured (no per-run counters in this harness)        | not measured (no per-run counters in this harness)        | not measured (no per-run counters in this harness) |
| tester                      | 1     | n/a   | not measured (no per-run counters in this harness)        | not measured (no per-run counters in this harness)        | not measured (no per-run counters in this harness) |
| reviewer                    | 1     | n/a   | not measured (no per-run counters in this harness)        | not measured (no per-run counters in this harness)        | not measured (run at gate 2)                       |
| total (measured)            | -     | -     | n/a                                                       | n/a                                                       | n/a                                                |
| orchestrator (main session) | 1     | n/a   | not measured                                              | n/a                                                       | n/a                                                |
