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

Story 027 scoped `test` and `test:e2e`. The other steps still run for every workspace. Measured on
hak's machine, whole tree against one app, same input: `typecheck` 5,9 s vs 1,6 s, `format:check` 3,8 s
vs 1,3 s, `lint` 3,2 s vs 2,1 s, `build` 4,2 s vs 1,9 s, `check:dist` 0,3 s vs 0,3 s. Every workspace
defines these scripts in its own `package.json`, so they can run in one workspace. Two steps cannot be
scoped this way: the checks that read the whole tree at once (`check:structure`, `check:template`) and
`test:scripts`, which is not a workspace (story 026).

Two things were checked before writing this story. A check run in a workspace reads the same config as
the whole-tree check: a planted violation that only the root `.prettierrc` can see (`singleQuote`) and
one that only the root `eslint.config.js` can see (`consistent-type-imports`) were both found by a run
in `apps/avd`, and a run in another workspace did not see them. And a file the tools ignore stays
ignored when it is passed explicitly, so a scoped run cannot turn an ignored file into a failure.

## Acceptance criteria

- **AC1:** Given an affected plan whose changed paths all lie inside workspaces, then the steps a
  workspace defines in its own `package.json` (`typecheck`, `build`, `test`, `test:e2e`, `lint`,
  `format:check`, `check:dist`) run only in the planned workspaces, with `-w <workspace>`, and a
  workspace without the script is skipped, not failed (`--if-present`).
- **AC2:** A check never reads what this run did not write: the steps that read the whole tree at once
  (`check:structure`, `check:template`, `test:scripts`) are never scoped, `check:dist` runs in the same
  workspaces as `build`, and a changed path that lies in no workspace keeps the whole-tree command, so a
  root file is never skipped.
- **AC3:** Planted violation: a violation in one workspace is found by the scoped run (run through the
  caller, not through the parser), and a full run or a run without a record keeps the whole-tree command,
  so the scoping cannot hide a regression outside the planned workspaces.

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
- 2026-11-13 — Gate 1: hak approves the next improvement ("mach das nächste performance improvement").

## Explanation

_The gate 2 explanation is given in German; this is the English text of the record._

_The work is done at gate 2._
