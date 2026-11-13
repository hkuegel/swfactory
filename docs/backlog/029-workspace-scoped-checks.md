---
id: 029
title: The runner scopes every check that a workspace can run alone
status: ready
type: chore
app: platform
size: S
branch: feature/029-workspace-scoped-checks
supersedes: []
changes: [027/AC1, 026/AC1]
superseded-by:
---

# 029 – The runner scopes every check that a workspace can run alone

## Original request

> "mach das nächste performance improvement"

## User story

As the person who runs `npm run verify`, I want every check that a workspace can run by itself to run
only in the workspaces the change can reach, so that a change in one app does not read the other apps.

## Context

Story 027 scoped `test` and `test:e2e`. The other steps still ran for every workspace. Measured on hak's
machine, whole tree against one app, same input: `typecheck` 5,9 s against 1,6 s, `format:check` 3,8 s
against 1,3 s, `lint` 3,2 s against 2,1 s, `build` 4,2 s against 1,9 s, `check:dist` 0,3 s against 0,3 s.
Every workspace defines these scripts in its own `package.json`, so they can run in one workspace. Steps
that are not a workspace script cannot be scoped this way (`test:scripts`, `check:structure`,
`check:template`).

Two things were checked before writing this story. A check run in a workspace reads the same config as the
whole-tree check: a planted violation that only the root `.prettierrc` can see (`singleQuote`) and one that
only the root `eslint.config.js` can see (`consistent-type-imports`) were both found by a run in `apps/avd`,
and a run in another workspace did not see them. And a file the tools ignore stays ignored when it is passed
explicitly, so a scoped run cannot turn an ignored file into a failure.

## Acceptance criteria

- **AC1:** Given an affected plan whose changed paths all lie inside workspaces, then the steps a
  workspace defines in its own `package.json` (`typecheck`, `build`, `test`, `test:e2e`, `lint`,
  `format:check`, `check:dist`) run only in the planned workspaces, with `-w <workspace>`, and a
  workspace without the script is skipped, not failed (`--if-present`).
- **AC2:** A check never reads what this run did not write: a step that is not a workspace script
  (`test:scripts`, `check:structure`, `check:template`) is never scoped, `check:dist` runs in the same
  workspaces as `build`, and a changed path that lies in no workspace keeps the whole-tree command, so a
  root file is never skipped.
- **AC3:** Planted violation: a violation in one workspace is found by the scoped run, and a full run or a
  run without a record keeps the whole-tree command, so the scoping cannot hide a regression outside the
  planned workspaces.

## Out of scope

- No duration is asserted in a test; the numbers are reported (story 026, Out of scope).
- No change to the mapping's groups: which checks can see a change is story 026's decision; this story
  only decides where a planned step runs.

## Open questions

_none._

## Decision log

- 2026-11-13 — Q: scope by file or by workspace — A: by workspace, because the runner's table is the npm
  scripts (story 026), and calling prettier or eslint with single files would need a second
  name-to-command map (orchestrator, R1).
- 2026-11-13 — Q: does a scoped check read the same rules as the whole-tree check — A: yes, measured with
  a planted violation that only the root config can see; recorded in Context.
- 2026-11-13 — Q: does a workspace that does not define the script fail the run — A: no, `--if-present`
  skips it, so the scope can name a workspace without the script (checked with `landing`, which has no
  `test:e2e`).
- 2026-11-13 — Gate 1: hak approves the next improvement ("mach das nächste performance improvement").
- 2026-11-13 — The review was run by the orchestrator, not by the `reviewer` subagent, because this harness
  does not offer that role; the verdict is recorded as such in the Review section.

## Implementation notes

`runsPerWorkspace(answer, step, scriptsByWorkspace)` in `scripts/affected-checks.mjs` answers the rule;
`commandForStep` in `scripts/verify.mjs` builds the command from that answer. The plan answer now carries
`changed`, so the scoping reads its input as data instead of the caller setting it afterwards. The script
map is read from each workspace's own `package.json` once per run, so a step the repository does not define
per workspace cannot be scoped. The plan prints the scoped steps, and every step prints the scope it ran in
(` in <workspaces>` or ` whole tree`), so a run that covers one workspace is not read as a full run.

## Test report

| AC  | Test(s)                                                                                                                                                                                                                                               | Result |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | `affected-checks.test.mjs`: `AC1: a step the workspace defines in its own package.json runs in the affected workspace only`; `verify.test.mjs`: `AC1: a step the workspace defines runs in the planned workspace, with --if-present`                  | PASS   |
| AC1 | `affected-checks.test.mjs`: `AC1: a workspace without the script is skipped, not failed` (hand data: the platform defines no `test:e2e`)                                                                                                              | PASS   |
| AC2 | `affected-checks.test.mjs`: `AC2: a step that is not defined per workspace is never scoped, and check:dist runs where build ran`; `verify.test.mjs`: `AC2: a step no workspace defines keeps the root command, and check:dist uses build's scope`     | PASS   |
| AC2 | `affected-checks.test.mjs`: `AC2: a changed path in no workspace keeps the whole-tree command` (a change list that mixes one workspace file and one root file); `verify.test.mjs`: `AC2: a changed path in no workspace keeps the whole-tree command` | PASS   |
| AC2 | `affected-checks.test.mjs`: `AC2: a platform change scopes to the platform and to every app, so its own tests are not lost`; `verify.test.mjs`: `AC2: a platform change runs the platform workspace and every app workspace`                          | PASS   |
| AC3 | `affected-checks.test.mjs`: `AC3: planted violation - a full run is never scoped, so nothing outside the workspaces is missed`; `verify.test.mjs`: `AC3: planted violation - a full run and an empty scope are never executed as a scope`             | PASS   |
| AC3 | planted violation through the caller: `verify.mjs --paths=apps/avd/probe-violation.ts` scoped `format:check` and `lint` to `apps/avd` and found the planted file                                                                                      | PASS   |

Run of `npm run test:scripts`: 3 test files, 43 tests passed (`check-structure` 7, `affected-checks` 26,
`verify` 10). Fixture mode: stored change lists, hand expectations, no request and no repository read (P17);
the apps are the placeholders `x` and `y`, and the script map is hand data, not the `package.json` files the
runner reads. No app test was touched (Out of scope). `check:structure` is green, prettier is green.

Mutation-checked against copies of the modules, so each assertion can go red: `every` answered as `some` in
the "every path lies in a workspace" test makes the mixed change list red; dropping the full-run guard makes
the AC3 assertion red in both files; reading the hand map as "always defined" makes three assertions red;
`some` answered as `every` in the script map makes the "skipped, not failed" assertion red. The copies were
removed after the check.

Measured, reported not asserted (same input, same machine, through the runner):

| Case                                                          | Before this story | After this story                      |
| ------------------------------------------------------------- | ----------------- | ------------------------------------- |
| one app change (`apps/avd/src/features/plan/logic/fields.ts`) | 11,5 s wall clock | 8,8 s wall clock, two green runs      |
| `typecheck`, whole tree against one workspace                 | 5,9 s / 1,6 s     | the runner now asks for one workspace |
| `lint`, whole tree against one workspace                      | 3,2 s / 2,1 s     | the runner now asks for one workspace |
| `format:check`, whole tree against one workspace              | 3,8 s / 1,3 s     | the runner now asks for one workspace |
| `build`, whole tree against one workspace                     | 4,2 s / 1,9 s     | the runner now asks for one workspace |
| full run                                                      | 70,5 s            | 70,8 s, green, not scoped             |

Not verified: the numbers are machine-dependent and one machine only; the CI run of this branch is open, so
the numbers there are not compared (`gh` is not installed here, the run is read from the Actions API).

## Review

Verdict: APPROVED, one round. Run by the orchestrator, because no reviewer subagent is available in this
harness (recorded in the Decision log); no blocker and no major.

- `[nit]` the script map is read from `package.json` at run time, so the command test cannot cover the real
  map; it is covered by the hand data and by the planted-violation run through the caller, not by a test that
  reads the same files (P17).
- `[nit]` `--if-present` is needed because a workspace may not define the script (`landing` has no
  `test:e2e`); confirmed by running `npm run test:e2e --if-present -w landing`, which skips.

## Explanation

_The gate 2 explanation is given in German; this is the English text of the record._

The runner now asks one more question before it calls a step: can this step run in one workspace at all, and
does every changed file belong to a workspace. If both are true, the step runs in the affected workspaces
only; if not, the whole-tree command runs, so a file outside the plan is never skipped. A full run is never
scoped, and a step that no workspace defines cannot be scoped, which is why the whole-tree checks stay as
they were. Measured on hak's machine with the same input: a one-app change went from 11,5 s to 8,8 s, and the
full run stays green. Reported, not asserted, so no test can go red by a slow machine.

## Retrospective

_size S: no Cost table is required (story 026, R8). No review round, no correction at the gates, one
measurement run, no defect found._
