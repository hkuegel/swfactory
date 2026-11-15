---
id: 038
title: A mutation check runs its candidates in one call at the narrowest scope
status: done
type: feature
app: platform
size: S
branch: feature/037-process-time-optimisation-batch
supersedes: []
changes: []
superseded-by:
---

# 038 – A mutation check runs its candidates in one call at the narrowest scope

## Original request

> mach mal ein paar Vorschläge wie wir die Zeit die du für die Entwicklung brauchst, weiter optimieren können.
> Wir sollten meiner Meinung nach versuchen, unnötige, und zu oft ausgeführte Tasks, zu vermeiden.
> Ausserdem sollte der product owner entscheidungsfreudiger sein, und mehr Fragen selbstständig beantworten.
> Ist ein brainstorming: denke nach und mache Vorschläge

Proposal 3 of that brainstorm, approved by hak on 2026-11-14 as P34: measure the mutation candidates in one pass
instead of one run per hypothesis. What a single pass cannot do is attribute a moved result to one candidate, so
the pass is one call that runs each candidate once at the narrowest scope, from backups, and reports which
candidate moved which result.

> stimme allen Verbesserungen zu. mache stories draus und setze sie direkt um

## User story

As the tester who proves that an assertion can fail, I want one call that applies my candidate mutations one
after the other, runs only the scope that can see each of them, and puts every file back, so that proving four
rules costs four narrow runs instead of four full runs.

## Context

In story 036 each mutation check was a separate call. A full run costs 88 s; the same assertion measured through
one test file costs about one second. The narrowest scope is what the assertion can be moved by: a single test
file, not the tree. The rule that a mutation is reverted from a backup copy made before it (tester, P-rule) stays,
and a candidate that cannot move anything must not be counted as a proof.

## Acceptance criteria

- **AC1:** Given a candidate whose search text occurs nowhere in the file, or occurs more than once, or is
  identical to its replacement, then the script refuses that candidate and names it (`no-op` or `ambiguous`), and
  the file is not touched: a candidate that does not change one location cannot move a result.
- **AC2:** Every file the script wrote is restored to the content of its backup, verified by content hash,
  including a run that stops in the middle because a candidate's command failed.
- **AC3:** The command the script runs is the narrowest scope it is given; it refuses a command that names
  `verify` or `--mode=full`, so a mutation check cannot be a full run. Durations are reported, never asserted.

## Out of scope

- No assertion of how much time a mutation check saves; that is reported.
- The script does not write a story record and does not write a Test report: the tester writes both from its
  output.
- No new dependency.

## Open questions

None.

## Decision log

- 2026-11-14 — Q: is the brainstorm approved? — A: hak approves all proposals and asks for stories and direct
  implementation; this story is P33 of the numbering that started with P27, and the numbers of this batch follow
  the story numbers (P32 = 037, P33 = 038, P34 = 039, P35 = 040, P36 = 041, P37 = 042, P38 = 043) (hak)
- 2026-11-15 — D: "one pass" cannot mean one run for all candidates — reason: a run cannot say which candidate
  moved the result, so the pass is one call with one backup per file, one narrow run per candidate, and the report
  of which candidate moved which assertion; recorded so the wording of the proposal is not read as a stronger rule
  than the test can show

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_Not a UI story: the change is a script and a rule in `tester.md`._

## Technical design

`scripts/check-mutations.mjs` reads a candidate list as data (`--candidates=<json>`), where each candidate names
the file, the text to find, the replacement and the assertion the tester expects to move. The rule functions are
exported so a test passes its own candidate list and a hand expectation instead of touching the tree (P16): the
candidate check (occurs once, differs from the replacement), the restore check (content hash against the backup),
and the scope check (the command must name one test file, not `verify`). The script applies candidates one at a
time, runs the given command, prints which candidate moved which result, and restores every file from the backup
before it exits — never with `git checkout`, `git restore` or `git stash`. A script a test imports runs its scan
only when it is executed directly (story 026).

## Implementation notes

- `scripts/check-mutations.mjs`: three rule functions exported as data (`checkCandidate`, `checkRestore`,
  `checkScope`) and `runPass`, which takes `read`, `write` and `run` so a test passes its own candidate list,
  its own files and a fake runner instead of touching the tree (P16, P17). One backup per file, taken before the
  first change to it; every file the pass wrote is put back from that backup and checked against its hash before
  the answer is returned, in both paths. The restore is a write from the backup, never `git checkout`,
  `git restore` or `git stash`.
- The pass stops when a command fails without naming the assertion the candidate expects: a failure that names
  nothing cannot be attributed to one candidate, so it is not read as a proof.
- The script's own rules cannot be proven by mutating the script, because a candidate that changes
  `checkCandidate` or `checkScope` would be measured by itself. Its eight tests are hand fixtures only, and the
  hand runs below are the measured part.

## Test report

| AC  | Test(s)                                                                                                                                                                                                           | Result   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| AC1 | `scripts/check-mutations.test.mjs`: an identical replacement is `no-op`, a `find` that occurs nowhere or more than once is `ambiguous`, a blank `find` is refused, and a refused candidate never calls the runner | green    |
| AC2 | same file: every file the pass wrote is restored and verified against the backup hash, including a pass that stops at a failed command                                                                            | green    |
| AC3 | same file: a command naming `verify` or `--mode=full` is refused, a command naming no single test file is refused, a command naming one test file is accepted                                                     | green    |
| —   | measured pass, scope `scripts/verify.test.mjs`: 3 candidates, 2 moved (1,4 s and 1,2 s), 1 refused as `no-op` before its command ran; both files restored and verified by hash                                    | observed |
| —   | measured pass, scope `scripts/check-structure.test.mjs`: 5 candidates, 4 moved (1,1 s to 1,2 s), 1 not moved (finding 1); the file restored and verified by hash                                                  | observed |
| —   | the same candidate list against `node scripts/verify.mjs --mode=full --base=HEAD`: `scope refused: names the full run`, nothing touched                                                                           | observed |

The narrowest scope the tester named was one test file: each narrow run cost 1,1 s to 1,4 s against the 82,9 s
full run measured the same day. For a change inside `scripts/` the mapping answers the full plan, so a mutation
check there could not be narrow at all — the narrow scope is what the tester names, not what the mapping would
have answered.

## Review

Verdict: APPROVED (round 1, checklist v2).

- C1 pass: AC1 is `checkCandidate`, AC2 is `checkRestore` plus the restore loop in `runPass`, AC3 is
  `checkScope`; each is shown by the test named above. S5 pass: the script was run by hand three times, once
  with a candidate that must be refused and once with a command that must be refused. T1 pass (the results run
  was green in all twelve steps, including `test:scripts`). T2 pass: one test per AC at the script level. T3
  pass, with finding 1. T4 n.a. (no e2e spec changed). T5 pass (the branches are the three rule functions).
  C2 to C6, S1 to S4, K2, K3, K10, K11, A1 to A4 n.a.: no app code, no CSS, no network call, no env variable.
  K4 pass (a factory script that names no app), K6, K7, K8, K9 pass.
- `[minor]` finding 1 — the first pass reported one candidate as `not moved`: the comment branch of rule 7 was
  covered only through `callArgs`, so a fixture whose assertion depends on the comment stripping was missing.
  The fixture `rule 7 does not read a comparison written in a comment as an assertion` was added for this, and
  the same candidate moved in 1,2 s with it. The pass's own output is what showed this, which is the point of
  the rule.
- `[minor]` finding 2 — `moved` is read as the command output containing the expected test title, so a candidate
  whose expected title appears for another reason could be misattributed. The strongest form the script can
  answer is the one it has: it stops when a command fails without naming the assertion. Stated in the script
  header.

## Explanation

A mutation check is one call. The tester names its candidates and the narrowest scope that can see each
assertion; the script refuses a candidate that cannot change one location, applies each candidate from a backup
taken before the first change, runs the narrow scope once per candidate, says which candidate moved which
assertion, and puts every file back before it exits. A mutation check can no longer be a full run: a command
that names `verify` or `--mode=full` is refused before anything is touched. What a single pass cannot do is
attribute a moved result to one candidate, so the pass is one call with one narrow run per candidate, not one
run for all of them.

## Retrospective

- P33 — prove a mutation through `scripts/check-mutations.mjs`, at the narrowest scope, never a full run —
  applies to .claude/agents/tester.md (approved)
- P33 — a rule that measures itself cannot be proven by mutation, so the script's own rules stay hand fixtures
  (record only)
