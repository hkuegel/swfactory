---
id: 026
title: Process slimming - run only what can regress, decide instead of ask
status: done
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
- 2026-11-13 — Q: does the orchestrator report progress somewhere — A: yes, in the chat, one short line
  per step (hak). Recorded as retro proposal R7, applied to CLAUDE.md.
- 2026-11-13 — Q: are the stories the right size — A: rather smaller stories, so progress can be tracked
  (hak). Recorded as retro proposal R8, applied to CLAUDE.md; `size: S` becomes the default.
- 2026-11-13 — Gate 2: hak approves the gate (the run as measured, the reviewer's verdict) and all eight
  retro proposals, including the two he added at gate 2 (R7, R8), and the commit.
- 2026-11-13 — The branch is pushed (`518035f`, `feature/026-process-slimming`). CI on a branch runs only
  for a pull request or a `workflow_dispatch` run, and `gh` is not installed on this machine, so the green
  CI run of the Definition of Done is open until hak opens the pull request or dispatches the workflow.

## Retro proposals (all eight approved by hak at gate 2, 2026-11-13; they change rules, not code)

- **R1:** when there is one clearly correct answer, the orchestrator decides it and writes it in the
  Decision log; it asks only for genuinely open questions or decisions costly to reverse.
- **R2:** all open questions are asked in one message at gate 1; after that the pipeline runs without
  stopping, unless a step is really blocked.
- **R3:** P16 narrowed: the hand oracle covers the number an AC asserts, not every value in the story.
- **R4:** the checks of a run are chosen by what the change can affect (AC1, AC2), which is P11 applied
  to checks.
- **R5:** the Cost table keeps its rows but must carry measured values or `not measured` with the reason
  (AC9), so the process records data instead of ceremony.
- **R6:** a fix in a parser is tested through its caller, not only through the exported function: a test
  that hands stored text to the parse cannot catch the trim that caused the defect in this story (nit 6).
- **R7:** the orchestrator writes the progress in the chat while the pipeline runs - one short line per
  step (what ran, what it answered, what it decided), not a wall of text, so hak can follow without
  opening the story. This is what story 026 did.
- **R8:** stories stay small, one checkable behaviour each, so progress is trackable: `size: S` (at most
  three ACs) is the default, `M` needs a reason, `L` only when several behaviours move together. Smaller
  stories also give a shorter test report and a cheaper gate 2.

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

- `scripts/affected-checks.mjs` — the mapping: `groupsOf` (one path can be in several groups), `NEEDS`,
  `levelsOf`, `checkLevels`, `appsIn` (apps read from the paths), `affectedPlan`, `plan`. The step names
  are the npm scripts, so the runner needs no second table. A path in no group answers with the full run.
- `scripts/verify.mjs` — the runner: the changed paths from git or from `--paths`, the record of the last
  full run in `.tmp/last-full-run.json` (gitignored), one level at a time with the steps of a level in
  parallel, the reported chain and the reported durations, a record written only by a successful full run,
  `--no-record` for CI, `--plan-only` and `--format=github-output` for the CI plan step.
- `scripts/check-structure.mjs` — the size rules, and the rule functions exported so a test can call them
  without scanning the repository; the scan runs only when the file is executed.
- `vitest.scripts.config.ts` and `test:scripts` in the `verify` chain, because `scripts/` is not an npm
  workspace. `test:pages` no longer builds. `.gitignore` gained `.tmp/`.
- `.github/workflows/ci.yml` — one job: the plan, the browser install only when the plan has a browser
  step, `node_modules` from the lockfile-keyed cache, `npm ci` only on a miss, and the Pages artifact
  uploaded by the same job that built `_site/`.

## Test report

| AC     | Test(s)                                                                                                                                                                                                                                                                                                                                         | Result                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| AC1    | `scripts/affected-checks.test.mjs`: `AC1: markdown`, `AC1: appSource`, `AC1: platformSource`, `AC1: token`, `AC1: tooling`, `AC1: the app named by the path …`                                                                                                                                                                                  | PASS, oracle hand-written; see defects D2, D3 and D5                                       |
| AC2    | `AC2: no recorded full run, so a markdown-only change still runs every check`, `AC2: a recorded full run lets the mapping skip …`                                                                                                                                                                                                               | PASS                                                                                       |
| AC3    | `AC3: a helper that only an e2e spec reads still needs the e2e run`, `AC3: the same answer for a markdown-only change …`, `AC3: a planted violation that reads a helper through a platform path …`                                                                                                                                              | PASS                                                                                       |
| AC4    | no test: the mode is chosen in `.github/workflows/ci.yml`, which no test reads                                                                                                                                                                                                                                                                  | reported only; one possible test is missing (a recorded run plus `--mode=full` stays full) |
| AC5    | `AC5: check:dist runs after build, the chain is at most three levels`, `AC5: a planted violation puts a dependent step in the level of its dependency`                                                                                                                                                                                          | PASS, the bound is slack: today's graph gives 2 levels                                     |
| AC6    | no test: `_site/` is built once by the plan and `test:pages` only serves it                                                                                                                                                                                                                                                                     | reported only                                                                              |
| AC7    | no test: a cache hit happens on the runner                                                                                                                                                                                                                                                                                                      | reported only                                                                              |
| AC8    | `AC8: the S story without Review, Cost table or UX section is accepted`, `AC8: planted violation - the same text as a size M story …`, `AC8: size S means at most three ACs …`                                                                                                                                                                  | PASS                                                                                       |
| AC9    | `AC9: every row saying n/a is a problem from story 026 on`, `AC9: one measured row makes the same table pass`, `AC9: a row that says not measured names the reason …`, `AC9: planted violation - the rule does not rewrite the record of an earlier story`                                                                                      | PASS                                                                                       |
| Runner | `scripts/verify.test.mjs`: `the first porcelain line keeps its path`, `a rename names the new path, an empty report names nothing`, `an app change includes build and build:pages because their checks read them`, `no record means the full plan, and a path in no group means the full plan`, `an unchanged tree with a record plans nothing` | PASS, added for finding 2 (the porcelain parse was wrong before the fix)                   |

Rows after the fixes: AC1 also covers `AC1: a template markdown file is read by the format check and by
the structure check` (with the answer for `templates/app/package.json`, finding 1) and `AC1: a path the
mapping cannot group is a full run, never an empty plan`; AC4 covers `AC4: a recorded run plus mode full
stays full …`; AC5 covers the two new planted cases for a dependency that is in the same level or missing
from the plan; the runner is covered by the row above (finding 2).

Run of `npm run test:scripts`: 3 test files, 29 tests passed (`scripts/check-structure.test.mjs` 7,
`scripts/affected-checks.test.mjs` 17, `scripts/verify.test.mjs` 5). No app test was touched (Out of
scope). Each planted case was
mutation-checked against a copy of the module: removing the AC9 rule gives 0 problems, loosening
`checkLevels` to `level < need` gives `[]`, so every assertion above can go red.

CI on the branch is open: the branch is pushed (`518035f`) but the workflow runs on a pull request, a run
on `main`, or a `workflow_dispatch`, and `gh` is not installed on this machine, so the green CI run of the
Definition of Done is still missing for this story.

Reported, not asserted (Out of scope): measured per level on hak's machine, full run, levels run at the
same time - level 0: build 11,6 s, build:pages 3,4 s, check:structure 0,8 s, check:template 7,6 s,
format:check 9,7 s, lint 9,8 s, test 61,5 s, test:e2e 61,7 s, test:scripts 1,0 s, typecheck 55,9 s;
level 1: check:dist 0,4 s, test:pages 6,6 s; 68,4 s wall clock, chain 2 levels (the gate 2 run, green).
Before the levels the same work took 102 s sequential (34,8 s verify + 59,1 s e2e + 8,4 s pages), so the
levels save the time of the shorter steps in a level, and the chain of 2 levels means the longest step
dominates. A markdown-only change ran 3,8 s instead of the full run.

Dry runs of the plan, exact output after the fixes (`--plan-only`, nothing executed):

```text
verify: mode affected, 2 of 12 steps, chain 1 levels
  changed: docs/backlog/README.md
  apps: none
  skipped: build, build:pages, check:dist, check:template, lint, test, test:e2e, test:pages, test:scripts, typecheck
  level 0: check:structure, format:check

verify: mode affected, 3 of 12 steps, chain 1 levels
  changed: templates/app/package.json
  apps: none
  skipped: build, build:pages, check:dist, lint, test, test:e2e, test:pages, test:scripts, typecheck
  level 0: check:structure, check:template, format:check

verify: mode full, 12 of 12 steps, chain 2 levels
  level 0: build, build:pages, check:structure, check:template, format:check, lint, test, test:e2e, test:scripts, typecheck
  level 1: check:dist, test:pages
```

The first is what a markdown-only pull request runs, the second shows finding 1 fixed (a template file
that is not markdown runs the structure check too), the third is what a run on `main` does (AC4).

Defects (not fixed by me):

- **D1, medium:** `npm run verify` fails on every step on this Windows machine: the runner builds the
  command as `"npm" run <step>`, and `spawn(…, {shell: true})` resolves `npm` through a path that
  makes `npm-cli.js` look for `node_modules/npm` in the working directory, so all 12 steps exit 1 with
  `MODULE_NOT_FOUND`. Repro here: `node scripts/verify.mjs --no-record`; the same step runs green when
  the leading quotes are dropped. CI is unaffected (the Linux branch does not use a shell), so CI stays
  green while a local run is red.
- **D2, medium (AC1):** `format:check` is added only when markdown is the single group, so prettier is
  skipped for a markdown change combined with anything: `--paths=docs/backlog/README.md,eslint.config.js`
  answers `check:structure` only.
- **D3, medium (AC1):** a template file answers `check:template` only, without prettier and
  `check:structure`, although prettier formats `templates/app/package.json` and rule 1 scans
  `templates`; `groupOf` tests `.md` before `templates/`, so template markdown is never a template.
- **D4, medium (the rule AC3 protects):** a path in no group - `eslint.config.js`, `.prettierignore`,
  `vitest.scripts.config.ts`, `tsconfig.json`, `.nvmrc` - answers with **zero steps**, so nothing runs
  although these files change what a check reads; `printPlan` then prints `chain -Infinity levels`.
- **D5, medium (AC1 against AC5):** the mapping requires `check:dist` for an app or platform change but
  never `build`, so the runner runs `check:dist` with its dependency skipped. On a clean CI checkout
  `check-dist.mjs` fails there with `dist not found; run the build first`; locally it passes against the
  `dist/` of an earlier run, which is not the output the check is meant to read. `checkLevels` cannot
  catch this: it only compares levels of steps that are in the plan.

Fixed after the tester's pass, in the same change:

- **D1:** the quotes around `npm` are dropped. With a shell only a name that contains a space needs
  quoting, and quoting the program name made `cmd.exe` resolve the shim from the working directory. A run
  on Windows is green again: `node scripts/verify.mjs --paths=docs/backlog/README.md` ran the two planned
  checks (`check:structure` 0,6 s, `format:check` 3,8 s).
- **D2:** prettier is planned whenever a changed path is in its scope, not only when markdown is alone.
- **D3:** a path can be in several groups (`groupsOf` replaced `groupOf`), so template markdown is read by
  prettier and the structure check, and a template change runs `check:template` with both.
- **D4:** a path the mapping cannot group is a full run, and the runner stops before the level maths when
  the plan is empty.
- **D5:** the mapping adds the step a check reads its input from, and `checkLevels` reports a step whose
  dependency is not in the plan at all.
- **AC4:** the missing test exists (`AC4: a recorded run plus mode full stays full, so the publish run
cannot lose its checks`). AC6 and AC7 stay reported only, because the cache hit and the single build
  happen on the runner and no fixture can observe them.

## Review

**Round 1, reviewer 2026-11-13. Verdict: CHANGES_REQUESTED. Checklist version: 2**

| Item | Result | Note                                                                                                                             |
| ---- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| C1   | fail   | findings 1 and 2; every other AC is traced to code and its named test (AC6/AC7 to code, reported only as recorded)               |
| C2   | n.a.   | the diff has no network call or pending state                                                                                    |
| C3   | n.a.   | no hook or component logic changed                                                                                               |
| C4   | n.a.   | no render loop or imperative controller changed                                                                                  |
| C5   | n.a.   | no reducer changed                                                                                                               |
| C6   | pass   | failed steps exit 1 with output, level violations are logged; a corrupt record ends in the visible full run (nit 4)              |
| S1   | n.a.   | no input or rendering code changed                                                                                               |
| S2   | pass   | no secrets in ci.yml, package.json or the record; no `VITE_*`                                                                    |
| S3   | n.a.   | package.json dependencies are unchanged                                                                                          |
| S4   | n.a.   | no dev-only code was added                                                                                                       |
| S5   | pass   | the scripts are exercised by `test:scripts` in verify, with planted failure paths, green on my run                               |
| T1   | pass   | my own full run on this machine: 12 steps ran, all green, format:check red only on the story until the required prettier --write |
| T2   | pass   | one level (fixtures), proportionate; the AC3 pair is the planted case the design names                                           |
| T3   | pass   | fixtures move the result, expectations hand-written, no duration asserted                                                        |
| T4   | n.a.   | no e2e spec changed; the tests are named after the ACs                                                                           |
| T5   | fail   | finding 2; mapping, levels and size rules are tested, the runner's parsing and record logic is not and no reason is recorded     |
| K1   | pass   | matches the design: named functions, step names are the npm scripts, no second table, no dead code                               |
| K2   | n.a.   | no TypeScript app code; only `.mjs` scripts and one config                                                                       |
| K3   | n.a.   | no CSS changed                                                                                                                   |
| K4   | pass   | `check:structure` green; the tests use placeholder apps `x`/`y`; apps are read from the paths                                    |
| K5   | n.a.   | retired in v2                                                                                                                    |
| K6   | fail   | finding 3; the story status and the index row are equal but `ready`, not `in-review`                                             |
| K7   | pass   | the Decision log holds every answer from hak and each recorded decision, append only                                             |
| K8   | pass   | README and CHANGELOG cover the runner, `test:scripts`, the size rules and the one-job CI                                         |
| K9   | pass   | the story passes prettier after the required `--write`; check-structure green                                                    |
| K10  | n.a.   | no workspace script or tsconfig changed                                                                                          |
| K11  | n.a.   | no env variable added or changed                                                                                                 |
| A1   | n.a.   | no control, focus, label or live region changed                                                                                  |
| A2   | n.a.   | no UI or colour changed                                                                                                          |
| A3   | n.a.   | no UI, animation or announcement changed                                                                                         |
| A4   | n.a.   | no render loop or canvas changed                                                                                                 |

Findings:

1. `[major]` scripts/affected-checks.mjs:118-121 — AC1 gives template files prettier and `check:structure`, but a
   template file that is not `.md` (e.g. `templates/app/package.json`) answers `check:template` + `format:check`
   only, although rule 1 of `check-structure.mjs` scans `templates` — add `check:structure` for the template group
   and assert the answer in the AC1 test.
2. `[major]` scripts/verify.mjs:37,64-65 — `git()` trims stdout, so the first porcelain line loses its status
   space and `slice(3)` drops the first character of the first path; seen on this machine: the plan prints
   `claude/agent-memory/…` for `.claude/…`, and the recorded run stores `gitignore` for `.gitignore`, so that path
   can never hash-match again and every later run falls back to full — parse porcelain without trimming.
3. `[minor]` docs/backlog/026-process-slimming.md:4 — the status is `ready` while this story is in review
   (equal to the index row, so `check:structure` is green) — set `in-review` in story and index, then
   `in-progress` for this verdict.
4. `[nit]` scripts/verify.mjs:75-77 — the catch in `readRecord` does not log; defensible because it ends in the
   visible full run, but a corrupt record is invisible unless it is logged.
5. `[nit]` scripts/verify.mjs:103-106 — `runStep` has no `'error'` handler, so a spawn that fails before `close`
   leaves the promise unresolved; resolve with a failure code.

**Round 2, reviewer 2026-11-13. Verdict: APPROVED. Checklist version: 2**

Findings 1, 2 and 3 are fixed in the working tree, and so are nits 4 and 5; every other row is
unchanged from round 1, so only the rows that were fail are restated here.

| Item | Result | Note                                                                                                                                                                                                                                                             |
| ---- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | finding 1 fixed: the template group adds `check:structure`, asserted in the AC1 test for `templates/app/package.json`, and my dry run of that path prints the three steps at level 0                                                                             |
| T5   | pass   | finding 2 fixed: `git()` no longer trims, `pathsOfStatus` reads each line by position and a rename resolves to the new path where the content lives, and the test imports the same parse the runner calls because the direct-run guard keeps `main` from running |
| K6   | pass   | finding 3 fixed: the story frontmatter and the index row `docs/backlog/README.md` both say `in-review`                                                                                                                                                           |

Nits: 4. fixed — `readRecord` logs the unreadable record and ends in the visible full run. Probed with a
corrupt record file: it printed `verify: the record … is unreadable, so this run is a full run` and then
planned 12 steps. 5. fixed — `runStep` resolves on `'error'` with code 1. Probed here by pointing
`COMSPEC` at a nonexistent program: both planned steps reported `FAILED (1)` with `spawn … ENOENT`
instead of a promise that never settles.

Run by me rather than read from the report: `npm run test:scripts` is 3 files and 29 tests,
`npx prettier --check .` and `node scripts/check-structure.mjs` are green, and the plan for the template
path shows `check:structure, check:template, format:check`. The first porcelain line keeps its path
(`changed: .claude/agent-memory/…`), which is what finding 2 was about, so the recorded run can hash the
same path again.

6. `[nit]` scripts/verify.test.mjs:11-17 — the test asserts the parse on stored text, so a trim put back
   in `git()` would leave it green; only the parse-by-position contract is tested, not its caller. Covered by
   the hand run above, so it does not change the verdict.

Verdict: APPROVED — no blocker or major left. Status stays `in-review` for hak's gate 2; I did not set it.

## Explanation

_The gate 2 explanation is given in German; this is the English text of the record._

The runner asks the mapping which checks can see a change and runs only those. The mapping puts every
changed path into one or more groups and answers with the checks that read that group; a path in no group
answers with the full run, so "skip" can never mean "skip everything". The steps of one level run at the
same time, and a check is never in the level of the step that writes what it reads. A check is skipped
only when nothing changed since a recorded full run, and only a successful full run writes that record.
A run that publishes to `main` is always full, so the published site keeps its checks and its one build.
Durations are reported, never asserted, because a duration test on a runner would be unstable.

Not verified: the cache hit and the single build happen on the CI runner and are reported only; the choice
of the mode in `ci.yml` is not covered by a test; the bound of three levels is slack, today's graph gives
two. The risk is a group that skips a check that matters: the planted violations are the only defence, and
the full run at gate 2 catches what the mapping missed.

## Retrospective

What this story changed in the process, not only in the code:

- The run is chosen by what can regress, which is P11 applied to checks: a markdown-only change took 3,8 s
  instead of the full 68,4 s, and a full run went from 102 s sequential (34,8 s `verify` plus 59,1 s e2e
  plus 8,4 s pages) to 68,4 s with the levels, because the longest step in a level dominates.
- The no-ask rule was used four times in this story (branch name, the dropped schedule, the reported-not-
  asserted numbers, the Windows quoting), and each decision is in the Decision log. Nothing was asked that
  had one clearly correct answer.
- The tester's pass found the defect that the writing had missed: a shell command that is correct on Linux
  was red on every step on Windows. Lesson kept: a runner that spawns commands must be executed once on the
  machine the change is written on, not only reasoned about.
- The hand oracle stayed a hand oracle: the expected step lists are written in the test, not read from
  `STEPS`, so the mapping can still go red.
- Cost table: this harness reports no per-run counters, so the rows say `not measured` with the reason
  instead of the `n/a` that story 022 had. The machine numbers are in the Test report, not here.
- Two rules hak added at gate 2, written into CLAUDE.md: the orchestrator reports the progress in the
  chat, one short line per step, and a story stays one checkable behaviour (`size: S` default) so the
  process can track it. Both are process rules, so neither is tested; they are recorded here and in the
  Decision log.

### Cost

| Role                        | Round | Model | Tokens                                                  | Tool uses                                          | Duration                                           |
| --------------------------- | ----- | ----- | ------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| product-owner               | 1     | n/a   | not measured (story written by the orchestrator)        | not measured (story written by the orchestrator)   | not measured (story written by the orchestrator)   |
| architect                   | 1     | n/a   | not measured (no architect run, design by orchestrator) | not measured (no architect run)                    | not measured (no architect run)                    |
| devops                      | 1     | n/a   | not measured (ci.yml written by the orchestrator)       | not measured (ci.yml written by the orchestrator)  | not measured (ci.yml written by the orchestrator)  |
| tester                      | 1     | n/a   | not measured (no per-run counters in this harness)      | not measured (no per-run counters in this harness) | not measured (no per-run counters in this harness) |
| tech-writer                 | 1     | n/a   | not measured (no per-run counters in this harness)      | not measured (no per-run counters in this harness) | not measured (no per-run counters in this harness) |
| reviewer                    | 1     | n/a   | not measured (no per-run counters in this harness)      | not measured (no per-run counters in this harness) | not measured (run at gate 2)                       |
| total (measured)            | -     | -     | n/a                                                     | n/a                                                | n/a                                                |
| orchestrator (main session) | 1     | n/a   | not measured                                            | n/a                                                | n/a                                                |

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
