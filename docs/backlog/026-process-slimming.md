---
id: 026
title: Process slimming - run only what can regress, decide instead of ask
status: ready
type: chore
app: platform
size: M
branch: feature/026-process-slimming
supersedes: []
changes: [012, 019, 022]
superseded-by:
---

# 026 - Process slimming - run only what can regress, decide instead of ask

## Original request

> machen wir einen neuen branch auf main, mit dem wir unsere sw factory optimieren. Ziel :
> bessere performance

> mir ging es hauptsächlich um die Entwicklungsgeschwindigkeit. Ich denke wir müssen unsere
> Prozess in der sw factory verschlanken. Prüfe bitte warum das so lange dauert, und wir
> wir das verbessern können

> Bitte auch: nicht nachfragen, wenn es eine fachlich klar richtige Antwort gibt. Wenn es
> doch falsch war, können wir es korrigieren.

> Ich bin auch nicht sicher, ob wir alle checks nach jeder Story brauchen, z.B. die cross
> platforms checken. würde es nicht reichen, das einmal am schluss zu machen ?

## User story

As the factory, I want a run to check only what the change can affect and the orchestrator to
record a decision instead of asking a question when there is one clearly correct answer, so that
development time goes into work instead of into waiting.

## Context

Measured baseline on hak's machine (same tree, warm cache), per full check:

| Step               | Time       | Note                                    |
| ------------------ | ---------- | --------------------------------------- |
| `typecheck`        | 6,0 s      | workspaces one after another            |
| `lint`             | 3,4 s      |                                         |
| `format:check`     | 3,9 s      |                                         |
| `check:structure`  | 0,5 s      |                                         |
| `check:template`   | 2,6 s      | spawns `new-app.mjs`                    |
| `test`             | 12,3 s     | one Vitest process per workspace        |
| `build`            | 4,3 s      |                                         |
| `check:dist`       | 0,3 s      | the only real dependency: needs `build` |
| `build:pages`      | 1,8 s      | built again by the CI `pages` job       |
| **`verify` total** | **34,8 s** | strict `&&` chain                       |
| `test:e2e`         | 59,1 s     | separate CI job                         |
| `test:pages`       | 8,4 s      |                                         |

Real time per story (git history, gate 1 to gate 2): 021 about 15 min, 022 about 45 min, 023
about 1 h plus an overnight pause, 024 about 3 h, bug 019 about 2,6 h with eight diagnostic
commits. Machine time is 2-4 min of that. So the cost is the rounds: gates that stop for an
answer, questions asked one at a time, and CI rounds of 10-14 min (three jobs, `npm ci` in each,
`playwright install` twice, the pages job builds what `verify` already built).

The Cost table of story 022 has `n/a` in every measured column, so the process currently records
ceremony without data. P11 already limits tests to what can regress; this story applies the same
rule to checks and to questions.

## Acceptance criteria

- **AC1:** Given a change of files, when the run asks which checks it needs, then `scripts/affected-checks.mjs`
  answers with the checks that can see the change: markdown and template files only - prettier and
  `check:structure`; an app's `src/` - that app's unit tests, `check:dist` and its e2e; platform `src/` -
  every app's tests and e2e; a token file - the token tests plus the e2e that compares pixels; a
  `scripts/` check or `package.json` - the full run.
- **AC2:** Given no recorded full run for the current tree, when a check runs, then every check runs; a
  check is skipped only when its recorded inputs are unchanged since a recorded full run, never
  because a pattern says it is unimportant.
- **AC3:** Given a planted violation - a helper that only an e2e spec reads, and a markdown-only change -
  when the mapping answers, then the e2e run is required for the helper and the e2e run is not
  required for the markdown, so "skip" cannot mean "skip everything".
- **AC4:** Given a run that publishes to `main` or a `workflow_dispatch` run, when it executes, then it is a
  full run; a pull-request run may use the mapping. The full run at gate 2 is the oracle that
  cross-platform drift cannot stay invisible.
- **AC5:** Given the checks of `verify`, when they run, then independent checks run at the same time and
  the longest dependency chain is at most three levels (`build` before `check:dist`); the runner reports
  the levels, and a check that depends on another is never in the same level.
- **AC6:** Given one pipeline, when it finishes, then `_site/` is built exactly once: `verify` does not build
  what another job builds and checks in the same run.
- **AC7:** Given an unchanged `package-lock.json`, when a job prepares its tools, then it restores
  `node_modules` from the cache and installs only on a cache miss.
- **AC8:** Given a story with `size: S` (at most three ACs), when `check:structure` reads it, then it does not
  require a Cost table, a Review section or a UX design section; `size: M` and `size: L` keep today's
  required sections.
- **AC9:** Given a Cost table of a `size: M` or `size: L` story, when `check:structure` reads it, then it fails
  if every row says `n/a`: a row is measured or says `not measured` with the reason.

## Out of scope

- No app behaviour changes; no test of the apps is touched by this story.
- No timing assertion inside a test: a wall-clock number is reported in the Test report, not asserted,
  because a duration test on the runner would be unstable.
- No scheduled trigger: every run that publishes to `main` is already a full run, so a schedule would
  repeat the same checks without new information (hak: a trigger would be ok, but it is not needed).

## Open questions

_none - all levers are in the ACs; the rule changes that cannot be tested are retro proposals below._

## Decision log

- 2026-11-13 — Q: is the goal CI minutes or development speed — A: development speed, the process
  (hak).
- 2026-11-13 — Q: are all checks needed after every story, or once at the end — A: only what can
  regress per story, plus a full run at gate 2 (hak's question, answered by AC1, AC2 and AC4 because a
  check that cannot see the change is vacuous).
- 2026-11-13 — Q: should the orchestrator ask when there is a clearly correct answer — A: no, it
  decides and records the decision; it asks only when the answer is genuinely open or the decision is
  costly to reverse (hak). Recorded as retro proposal R1, because a rule cannot be tested.
- 2026-11-13 — Q: branch name — A: `feature/026-process-slimming`, the convention in CLAUDE.md
  (branches are `feature/NNN-slug` or `fix/NNN-slug`), decided by the orchestrator.
- 2026-11-13 — Q: is a scheduled trigger needed — A: a trigger would be ok but is not needed, because
  the run that publishes to `main` is a full run already; the schedule is dropped and the gate 2 full run
  stays the only full run (hak, decision recorded by the orchestrator).
- 2026-11-13 — Gate 1: hak approves the story with all levers (mapping, parallel levels, one build,
  cache, `size: S`, measured Cost table, no-ask rule).
- 2026-11-13 — Q: which machine numbers may be asserted — A: none; durations are reported, structural
  numbers (levels, one build, mapping answer) are asserted (orchestrator).

## Retro proposals (hak's approval needed; they change rules, not code)

- **R1:** when there is one clearly correct answer, the orchestrator decides it and writes it in the
  Decision log; it asks only for genuinely open questions or decisions costly to reverse.
- **R2:** all open questions are asked in one message at gate 1; after that the pipeline runs without
  stopping, unless a step is really blocked.
- **R3:** P16 narrowed: the hand oracle covers the number an AC asserts, not every value in the story.
- **R4:** the checks of a run are chosen by what the change can affect (AC1, AC2), which is P11 applied
  to checks.
- **R5:** the Cost table keeps its rows but must carry measured values or `not measured` with the reason
  (AC9), so the process records data instead of ceremony.

## UX design

_ux-designer: not needed, this story has no UI._

## Technical design

_architect: factory scripts only, no app code._

**Files**

- `scripts/affected-checks.mjs` — the mapping. Input: the changed paths (read from `git diff --name-only`,
  or from a list passed by the test). Output: the set of steps. `--full` forces the full set. Modes are
  named: `--mode=affected` and `--mode=full` (P17).
- `scripts/verify.mjs` — runs the steps from the mapping in levels; the levels come from the declared
  dependency graph (only `check:dist` depends on `build`), the chain length is reported.
- `scripts/check-structure.mjs` — adds the `size:` rules (AC8) and the Cost-table value rule (AC9).
- `docs/templates/story.md` — gains `size: S | M | L`.
- `.github/workflows/ci.yml` — pull-request run calls `verify --mode=affected`; a run on `main`,
  `workflow_dispatch` call `verify --mode=full`; `build:pages` appears once
  (AC6); `node_modules` restored from cache (AC7).
- `package.json` — `verify` calls `scripts/verify.mjs`; `test:scripts` added so `scripts/` is tested.

**Types**

```
Step      = { name, level, needs: string[] }
Mapping   = { mode: 'affected' | 'full', changed: string[], steps: Step[] }
```

**Data flow:** changed paths → mapping → steps → levels → runner → reported plan. No network request, no
cache write outside a recorded run id (`CI` or the `--record` flag writes nothing in the repo).

**Minimal test set (P11, five tests)** in `scripts/affected-checks.test.mjs`, fixture mode, no live
request, stored change lists:

1. mapping answers for the five input classes of AC1 (hand oracle, not the same table the code parses);
2. nothing recorded → every step, so no skip without a recorded full run (AC2);
3. planted violation (AC3): helper-only change requires e2e, markdown-only change does not;
4. level graph (AC5): `check:dist` after `build`, chain length ≤ 3, and a planted violation with a
   dependent step in the same level is rejected;
5. one build per pipeline (AC6) plus the `size: S` section rule and the Cost-table value rule (AC8, AC9)
   through `check-structure` on stored story fixtures.

**Risks**

- A wrong path pattern could skip a check that matters; only the planted violation in test 3 makes this
  falsifiable, and the gate 2 full run catches what the mapping missed.
- `actions/cache` on `node_modules` can serve a stale tree if the key does not include the lockfile hash;
  the key must be `node_modules-${hash(package-lock.json)}`.
- The reported numbers are machine-dependent; they are reported, not asserted, so no test can go red by
  a slow runner.

## Implementation notes

_not filled yet._

## Test report

| AC  | Test(s) | Result |
| --- | ------- | ------ |

## Review

_not filled yet._

## Explanation

_not filled yet._

## Retrospective

_not filled yet._

### Cost

| Role                        | Round | Model        | Tokens       | Tool uses    | Duration     |
| --------------------------- | ----- | ------------ | ------------ | ------------ | ------------ |
| product-owner               | 1     | not measured | not measured | not measured | not measured |
| architect                   | 1     | not measured | not measured | not measured | not measured |
| devops                      | 1     | not measured | not measured | not measured | not measured |
| tester                      | 1     | not measured | not measured | not measured | not measured |
| reviewer                    | 1     | not measured | not measured | not measured | not measured |
| total                       | -     | not measured | not measured | not measured | not measured |
| orchestrator (main session) | 1     | not measured | not measured | not measured | not measured |

## Implementation plan

1. `scripts/affected-checks.mjs` with the mapping and the two named modes; tests 1 and 2 first.
2. Planted violation for the mapping (test 3), then the level graph (test 4).
3. `scripts/verify.mjs` runs the plan in levels; `package.json` `verify` and `test:scripts`.
4. `check-structure` gains the `size:` rules and the Cost-table value rule (test 5);
   `docs/templates/story.md` gains `size:`.
5. `ci.yml`: affected mode for pull requests, full mode for a run on `main` and `workflow_dispatch`
   (no scheduled trigger), one `build:pages`, `node_modules` cache. Dry run with a planted violation that
   would skip the publish run.
6. Tester pass on the AC mapping, prettier, `check:structure`, then tech-writer (README Commands
   section, `CHANGELOG.md`) and gate 2.
