---
id: 027
title: The runner runs the test steps in the workspaces it planned
status: done
type: chore
app: platform
size: S
branch: feature/027-per-app-scoping
supersedes: []
changes: [026/AC1]
superseded-by:
---

# 027 – The runner runs the test steps in the workspaces it planned

## Original request

> "ja, passt. bitte noch mit aufnehmen. Der Orchestrator soll in den chat den Fortschritt schreiben.
> Eher etwas kleinere Storys um besser traken zu können" — and after the measurement: "die offenen
> performance verbesserungen bitte umsetzen".

## User story

As the person who runs `npm run verify`, I want the runner to execute a workspace check in only the
workspaces the change can reach, so that a change in one app does not start the other app's suites.

## Context

Story 026 chose the checks by what can regress, but the runner still calls the workspace scripts as a
whole (`npm run test`, `npm run test:e2e`), so the plan names the affected apps and the execution
ignores them. Measured on hak's machine, same input, through the runner: an app-only change took 62,8 s
wall clock, dominated by `test` (57,6 s) and `test:e2e` (62,5 s). Run directly for one app they take
2,5 s and 7,0 s, against 11,9 s and 59,3 s for all workspaces. So the open saving is the workspaces that
cannot see the change. The two steps that read the whole tree (`lint`, `format:check`) and the CI steps
are not touched by this story.

## Acceptance criteria

- **AC1:** Given an affected plan that names workspaces, when the runner executes `test` or `test:e2e`,
  then it runs that step only in the planned workspaces, with `-w <workspace>`, so a change in one app
  does not run the other app's suite.
- **AC2:** Given a change that cannot be attributed to one workspace (a platform path, a landing path, a
  root file), then the step runs in every workspace, never in an empty list — a shared workspace reaches
  every app (ADR 0006), and the platform's own tests are not lost by the scoping.
- **AC3:** Given a full run or a run without a record, then every workspace runs; the plan that lists all
  workspaces is the same answer as today, so the scoping cannot hide a regression.

## Out of scope

- No app behaviour changes, no test of the apps is touched.
- `lint`, `format:check`, `typecheck`, `build` stay on the whole tree in this story; `eslint .` and
  prettier read the whole tree, so they cannot be scoped by a path, and `typecheck` builds project
  references. Measured separately, so this story keeps one behaviour.
- No duration is asserted in a test; the numbers are reported (story 026, Out of scope).

## Open questions

_none._

## Decision log

- 2026-11-13 — Q: which steps are scoped — A: the workspace steps `test` and `test:e2e`, the two
  measured dominators; `lint` and `format:check` read the whole tree and cannot be scoped by a path
  (orchestrator, R1).
- 2026-11-13 — Q: can a path in a workspace be missing from the answer — A: no, a path the mapping
  cannot attribute to a workspace answers with all workspaces, the same rule as the empty plan in story
  026 AC3 (architect).
- 2026-11-13 — Q: does the gate 1 story commit go to `main` — A: no, it goes on the story branch,
  because the code this story changes (`scripts/verify.mjs`) is on the unmerged `feature/026` branch and
  a branch must be reviewable on its own (story 024, P14).
- 2026-11-13 — Gate 1: hak approves the improvement ("die offenen performance verbesserungen bitte
  umsetzen").
- 2026-11-13 — Gate 2: hak approves the story ("ich gebe 27/28 frei"), so the status is `done`.
- 2026-11-13 — The merge of the two pull requests resolved the backlog index conflict in favour of the 028
  branch, so the row for 027 said `ready` while this story said `done`; `check:structure` was red on `main`,
  so the row is set to `done` here (the index must equal the story status).
- 2026-11-13 — Q: does the scoped command need `--if-present` — A: yes, a workspace may not have the
  script (`landing` has no `test:e2e`), so a scoped run would otherwise fail on that workspace; checked by
  running `npm run test:e2e --if-present -w landing`, which skips it.
- 2026-11-13 — The review was run by the orchestrator, not by the `reviewer` subagent, because this harness
  does not offer that role; the verdict is recorded as such in the Review section.

## Test report

| AC  | Test(s)                                                                                                                                                                                                                      | Result |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | `affected-checks.test.mjs`: `AC1: an app change scopes the test step to that app, not to the other app`; `verify.test.mjs`: `AC1: a scoped test step names the planned workspace, not the other app`                         | PASS   |
| AC1 | `verify.test.mjs`: `AC1: a step that reads the whole tree keeps the root command` (`lint`, `format:check` are not scoped)                                                                                                    | PASS   |
| AC2 | `affected-checks.test.mjs`: `AC2: a platform change scopes to the platform and to every app, so its own tests are not lost`; `verify.test.mjs`: `AC2: a platform change runs the platform workspace and every app workspace` | PASS   |
| AC2 | `affected-checks.test.mjs`: `AC2: a path in no workspace scopes to all of them, never to an empty list`                                                                                                                      | PASS   |
| AC3 | `affected-checks.test.mjs`: `AC3: planted violation - a full run names every workspace, the same answer as today`; `verify.test.mjs`: `AC3: planted violation - an empty scope names every workspace, never runs nowhere`    | PASS   |

Run of `npm run test:scripts`: 3 test files, 37 tests passed (`check-structure` 7, `affected-checks` 21,
`verify` 9). Fixture mode: stored change lists, hand expectations, no request, no repository read (P17); the
apps are the placeholders `x` and `y`. No app test was touched (Out of scope).

Mutation-checked against copies of the modules, so each assertion can go red: `workspacesOf` answering with
all workspaces makes the AC1 expectation red; dropping the platform branch makes the AC2 expectation red;
`commandForStep` answering `answer.workspaces ?? allWorkspaces` (an empty array passes `??`) makes the AC3
expectation red.

Measured, reported not asserted (same input, same machine, through the runner):

| Case                                                          | Before this story | After this story                      |
| ------------------------------------------------------------- | ----------------- | ------------------------------------- |
| one app change (`apps/avd/src/features/plan/logic/fields.ts`) | 62,8 s wall clock | 11,1 s wall clock, four green runs    |
| `test`, all workspaces vs. one app                            | 11,9 s / 2,5 s    | the runner now asks for one workspace |
| `test:e2e`, all workspaces vs. one app                        | 59,3 s / 7,0 s    | the runner now asks for one workspace |
| full run                                                      | 70,9 s            | 70,5 s, green                         |

The first scoped run failed once in a platform sign-in spec (`auth.spec.ts` AC10, 5 s poll) while the other
level-0 steps ran at the same time; four further runs were green, so this is not reported as a defect. The
risk stays: the scope does not change which step runs, only where, and a level-0 step that reads the whole
tree still runs everywhere.

Open, unchanged by this story: a landing-only change still does not plan the landing workspace's own unit
tests, because story 026's mapping answers the landing group with `build:pages` and `test:pages`. Recorded
here so it is not lost; it is a mapping question, not a runner question.

## Review

Verdict: APPROVED, one round. Run by the orchestrator, because no reviewer subagent is available in this
harness (recorded in the Decision log); no blocker and no major.

- `[nit]` the workspace list is read from `package.json` at run time, so the command test cannot cover the
  expansion of `apps/*` without reading the repository (P17); it is covered by the hand test that passes its
  own list, not by a test of `workspacesHere`.
- `[nit]` `--if-present` is needed because a workspace may not have the script (`landing` has no
  `test:e2e`); confirmed by running `npm run test:e2e --if-present -w landing`, which skips.

## Explanation

_The gate 2 explanation is given in German; this is the English text of the record._

The mapping now answers with the workspaces a change can reach, and the runner uses that answer for the two
test steps: a change in one app runs only that app's suite, a platform change runs the platform and every
app that consumes it. A step that reads the whole tree stays global, and a path that cannot be put in a
workspace runs the step everywhere, so a scope never means "run nothing". A full run or a run without a
record names every workspace, which is the same work as before this story.

Measured on hak's machine with the same input: an app-only change went from 62,8 s to 11,1 s wall clock, and
the full run stays green at 70,5 s. Reported, not asserted, so no test can go red by a slow machine.

Not verified: the numbers are machine-dependent and one machine only; the plan step in CI and the check step
use the same code, so the scoping is the same there, but a green CI run of this branch is still open (the
workflow needs a pull request or a dispatch, and `gh` is not installed here).
