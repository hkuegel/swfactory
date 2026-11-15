---
id: 037
title: A story needs one run for its results and one covering run
status: done
type: feature
app: platform
size: S
branch: feature/037-process-time-optimisation-batch
supersedes: []
changes: [026/AC2, 034/AC4]
superseded-by:
---

# 037 – A story needs one run for its results and one covering run

## Original request

> mach mal ein paar Vorschläge wie wir die Zeit die du für die Entwicklung brauchst, weiter optimieren können.
> Wir sollten meiner Meinung nach versuchen, unnötige, und zu oft ausgeführte Tasks, zu vermeiden.
> Ausserdem sollte der product owner entscheidungsfreudiger sein, und mehr Fragen selbstständig beantworten.
> Ist ein brainstorming: denke nach und mache Vorschläge

Proposal 1 of that brainstorm, which hak approved on 2026-11-14 as P32: write the report text completely first,
then run once; a run that only confirms text the previous run already covered is a duplicate. In stories 035 and
036 ten full runs were made for two stories, most of them because the report was edited after a run.

> stimme allen Verbesserungen zu. mache stories draus und setze sie direkt um

## User story

As the person who commits a story record, I want the run that covers a record to be a run on content that is
already finished, and a run that can find nothing to run nothing, so that a story costs one run for its results
and one cheap covering run instead of one run per report edit.

## Context

The measured cost of a full run on this machine is 12 steps and 88 s, of which the browser step is 81 s. The same
change set answered by the mapping for a markdown-only round is two checks: `format:check` (14,2 s) and
`check:structure` (1,5 s). So the difference between a round that edits the record and a round that runs the
mapping is about 73 s per story round, measured on 2026-11-14.

Two rules make that saving possible. The runner currently treats `--mode=full` as "run everything", even when the
content is the content a recorded run already covered. And a record is written only by a full or publishing run,
so a markdown-only round leaves no record and the next round runs everything again. The record is a coverage claim
for the change it saw, and the mapping is the guarantee of what a run could see, so a run that ran the checks the
mapping named for its change set did cover that change set.

The publishing run is not changed by this story: story 034 AC1 keeps the whole-tree checks in every publishing
plan, because the publish is the whole site and the site is rebuilt whatever the change set is.

## Acceptance criteria

- **AC1:** A green run that ran the checks the mapping named for its change set writes the record for that change
  set, so a markdown-only round is covered by its own two checks and the next round on the same content runs
  nothing. A change the mapping cannot answer completely (a path in no group, a tooling change, a data-file
  change) is still the full plan, so no check is skipped that could not see the change (story 026 AC1 unchanged).
- **AC2:** Given a record written by a run that read the whole tree (`full` or `publish`), when the content is
  unchanged since that record, then the plan is empty whatever mode is named. A record written by an affected run
  does not answer a full run: the full run stays the oracle for what the mapping could have missed (story 026 AC2
  and AC4 unchanged), and a publishing run always names the whole-tree checks (story 034 AC1 unchanged).
- **AC3:** The report text is complete before the run that covers it, so a story needs one run for its results and
  one covering run, and the covering run is the mapping run for the content as committed. A run never confirms a
  sentence it prints itself. Measured as the convention text in `CLAUDE.md`, read by hand.

## Out of scope

- No duration is asserted in a test; the savings are reported (story 026, Out of scope).
- The CI publishing run is not made cheaper: the build and the published-pages checks stay in its plan, because
  the deploy artifact is the whole site.
- No timestamp rule: a check cannot see whether a text was written before or after a run, so AC3 is a convention,
  not an enforceable check.

## Open questions

None. The brainstorm was approved as a whole, so gate 1 is given for all seven stories of this batch.

## Decision log

- 2026-11-14 — Q: is the brainstorm approved and shall it be implemented? — A: hak approves all proposals and asks
  for stories and direct implementation; this story is P32 of the numbering that started with P27 (hak)
- 2026-11-15 — D: the seven stories of this batch share one branch
  (`feature/037-process-time-optimisation-batch`) — reason: they are one rules set that has to be green together,
  and one branch per story is a reversible process choice, so this is recorded rather than asked
- 2026-11-15 — D: the record gate widens to a run that covered its own change set, not to a run that read the
  whole tree — reason: a record is a claim about the change it saw and the mapping is what guarantees the coverage,
  so a markdown-only run can claim coverage of a markdown-only change

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_Not a UI story: the change is the mapping, the runner's record gate and one convention line._

## Technical design

`plan` gains one branch: an empty change set with a record whose mode is `full` or `publish` answers an empty plan
for any mode except `publish`. A record written by an affected run keeps the full plan, so the gate 2 oracle still
runs after a cheap round. The runner already has the empty-plan answer that prints the covering message; the
wording names the record. `recordForRun` answers a record for an `affected` run as well, since the mapping's
guarantee is the coverage. The record keeps its mode, its workspaces and its scoped steps, so a scoped run is
still read as a scope (story 034 AC4), and the hand expectation that a recorded run plus a change set plus mode
`full` stays full is unchanged: this rule is about content that did not change.

## Implementation notes

- `plan` in `scripts/affected-checks.mjs` reads the mode of the record: an empty change set with a whole-tree
  record answers the empty plan for `affected` and for `full`. The `publish` branch is answered before it, so the
  publishing plan still names the eight whole-tree steps (story 034 AC1). A record with no mode field is read as
  a whole-tree record, so a record accepted before this rule was written is not re-read as something else (P9).
- `recordForRun` in `scripts/verify.mjs` answers a record for an `affected` run as well. It still writes the
  mode, the workspaces and the scoped steps from the same answer the command is built from (story 034 AC4), and
  a run that ran nothing claims nothing, so it answers null. The gate comment in `main` was corrected to this.
- Two hand expectations that this story moves were rewritten instead of being left to disagree, and are recorded
  here: the story 025 CI-round test now reads "a full run plans every step when nothing is recorded for the
  tree", which is the round a fresh CI machine runs, and story 034 AC4's full-run case now uses a change set the
  mapping cannot scope, because an empty change set with a whole-tree record is no longer a full plan.

## Test report

| AC  | Test(s)                                                                                                                                                                                                                                                      | Result                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| AC1 | `scripts/verify.test.mjs`: `recordForRun` answers the record for an `affected` run that ran the mapping's steps, and null for a run that ran nothing                                                                                                         | green                 |
| AC1 | `scripts/affected-checks.test.mjs`: the mapping's answer for a markdown-only change set is the two checks, so a run that ran them covered that change set                                                                                                    | green                 |
| AC2 | `scripts/affected-checks.test.mjs`: an empty change set with a whole-tree record answers an empty plan; a record with no mode field is read as a whole-tree record; an affected record keeps the full plan; `publish` still names the eight whole-tree steps | green                 |
| AC2 | `scripts/verify.test.mjs`: the same empty plan for a mode named `full`, and the publishing plan unchanged                                                                                                                                                    | green                 |
| AC3 | the convention line in `CLAUDE.md` (P32), read by hand                                                                                                                                                                                                       | green (read, not run) |

Hand runs, measured on 2026-11-15:

- The results run (`--mode=full --base=HEAD`): 12 of 12 steps, all green, 82,9 s wall clock, and it wrote the
  record with `mode: full`. The counts as that run printed them: `test` platform 16 files / 155 tests, avd
  11 / 100, laz 9 / 30, minesweeper 13 / 103, landing 5 / 18; `test:scripts` 7 files / 113 tests;
  `check:template` 2 / 5; `test:e2e` avd 80, laz 54, minesweeper 110; `test:pages` 24.
- With that record and no change to the content, the mapping answered 0 steps for `affected` and for `full`, and
  the runner printed `verify: the recorded run already covers this content, nothing to run`.
- The same content with a markdown-only change answered `check:structure` + `format:check`: the two checks the
  baseline round measured on 2026-11-14 at 1,5 s and 14,2 s, against 88,3 s for the full round.
- Mutation pass, scope `scripts/verify.test.mjs`: `(record.mode ?? 'full') === 'affected'` answered `false` moved
  the story 037 AC2 assertion in 1,4 s; the file was restored and verified by hash.

The covering round for this record is the mapping run for the content as committed; its own durations are not
written here, because a run cannot measure a sentence it prints itself.

## Review

Verdict: APPROVED (round 1, checklist v2).

- C1 pass: AC1 is `recordForRun` in `scripts/verify.mjs` and the mapping's answer in
  `scripts/affected-checks.mjs`, each shown by the test named above; AC2 is the record-mode branch in `plan`;
  AC3 is the convention line in `CLAUDE.md`, read by hand.
- S5 pass: the mapping was run by hand against the record the results run wrote, and the mutation pass refused a
  command that names `--mode=full`. T1 pass (the results run was green in all twelve steps). T2 pass: one test
  per AC, at the script level, no AC measured at two levels. T3 pass, with finding 1. T5 pass. T4 n.a. (no e2e
  spec changed by this story). C2 to C6, S1 to S4, K2, K3, K10, K11 and A1 to A4 n.a.: no app code, no CSS, no
  network call, no env variable. K4 pass (a factory script that names no app), K6, K7, K8, K9 pass.
- `[minor]` finding 1 — a run named `--mode=full` on content a whole-tree record already covered prints
  `mode affected`, because the answer is the mapping's answer and not the caller's mode. It is not misleading:
  the line printed after it names the covering fact, and a run that ran nothing writes no record, so the mode in
  the record is unaffected. Kept.

## Explanation

A run records what it covered, not only what it read. A green run that ran the checks the mapping named for its
change set writes the record for that change set, so a markdown-only round is covered by its own two checks and
the next round on the same content runs nothing. The full run stays the oracle for what the mapping could have
missed: a record written by an affected run does not answer a full run, a tooling or data-file change is still
the full plan, and the publishing plan still names the whole-tree checks. A story therefore costs one run for
its results and one cheap covering run for the record as committed, instead of one run per report edit.

## Retrospective

- P32 — the report text is complete before the run that covers it — applies to CLAUDE.md (approved)
- P32 — a run cannot measure a sentence it prints itself, so these reports quote the run that preceded the text
  and the round that confirms them is a later one (record only)
