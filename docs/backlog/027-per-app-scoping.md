---
id: 027
title: The runner runs the test steps in the workspaces it planned
status: ready
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

## Explanation

_The gate 2 explanation is given in German; this is the English text of the record._

_The work is done at gate 2._
