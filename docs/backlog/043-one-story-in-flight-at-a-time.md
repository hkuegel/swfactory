---
id: 043
title: One story is in flight at a time
status: done
type: chore
app: platform
size: S
branch: feature/037-process-time-optimisation-batch
supersedes: []
changes: []
superseded-by:
---

# 043 – One story is in flight at a time

## Original request

> mach mal ein paar Vorschläge wie wir die Zeit die du für die Entwicklung brauchst, weiter optimieren können.
> Wir sollten meiner Meinung nach versuchen, unnötige, und zu oft ausgeführte Tasks, zu vermeiden.
> Ausserdem sollte der product owner entscheidungsfreudiger sein, und mehr Fragen selbstständig beantworten.
> Ist ein brainstorming: denke nach und mache Vorschläge

Proposal 10 of that brainstorm, approved by hak on 2026-11-14 as P38: one story at a time, because a story that
moves while another story's numbers are still being moved costs more than it saves.

> stimme allen Verbesserungen zu. mache stories draus und setze sie direkt um

## User story

As hak, I want one story to be worked on at a time, so that progress is trackable and a record is not written while
the numbers it quotes are still changing.

## Context

The convention that stories stay small exists; the convention that only one is worked on at a time does not. In
stories 035 and 036 the two records were moving at once: the dev server ran for a look while the numbers of the
other story were still being written, and the runs had to be repeated for both. The in-flight statuses are the four
that mean work is happening: `designed`, `in-progress`, `in-test`, `in-review`. `ready` means the story is written
and waiting, `blocked` means work stopped with the reason in Open questions, `done` means the work is finished, so
none of them is in flight.

This batch is the first thing the rule applies to: the seven stories of the brainstorm share one branch, and they
were kept `ready` while they were implemented and set `done` at once, which is recorded in their Decision logs.

## Acceptance criteria

- **AC1:** Given a scan of all backlogs, then more than one story with a status in the in-flight set
  (`designed`, `in-progress`, `in-test`, `in-review`) is a problem the structure check reports (rule 10).
  Measured with hand fixture text.
- **AC2:** A story with `status: blocked` is not in flight, and neither is `ready` or `done`: three fixture texts
  with `blocked`, `ready` and `done` answer no problem, and the same three with `in-test` answer one.

## Out of scope

- The rule is a record check, not a lock: it reports a second story in flight, it does not decide which one the
  orchestrator should finish first.
- A look at the app in the browser is not a story in flight.

## Open questions

None.

## Decision log

- 2026-11-14 — Q: is the brainstorm approved? — A: hak approves all proposals and asks for stories and direct
  implementation; this story is P38 of the numbering that started with P27 (hak)
- 2026-11-15 — D: the batch keeps its seven stories `ready` while they are implemented and sets them `done` at once
  — reason: the rule cannot be satisfied by the batch that writes it, since seven stories cannot be in flight at
  once; recorded here as the first application of the rule

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_Not a UI story: the change is the structure check._

## Technical design

`check-structure` gains rule 10 with one exported function that takes the list of story texts as data (P16), so a
test passes its own fixtures, and the scan calls it with the story files it already reads for rule 3 — no second
walk of the tree.

## Implementation notes

- Rule 10 is `checkInFlight(statuses)` in `scripts/check-structure.mjs`: it takes the list of story statuses as
  data (P16), so a test passes its own fixtures, and the scan calls it with the story files rule 3 already reads —
  no second walk of the tree. The in-flight set is the four statuses the story names.
- The rule applies to every story, including the ones written before it, because it reads the current status and
  not a record: a story that is `done` cannot be read as in flight, so nothing earlier is rewritten (P9).
- `reportOfStep` is not part of this story; the closing-block rule is story 042.

## Test report

| AC  | Test(s)                                                                                                                                                         | Result   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| AC1 | `scripts/check-structure.test.mjs`: two stories in flight answer one problem naming both; one story in flight answers nothing                                   | green    |
| AC2 | same file: `blocked`, `ready`, `done`, `draft` and `superseded` answer nothing, and the same fixtures with `in-test` answer one problem each                    | green    |
| —   | `check:structure` over the tree: 42 story statuses read by rule 10, nothing reported, because the seven stories of this batch are `done`                        | green    |
| —   | measured pass, scope `scripts/check-structure.test.mjs`: the in-flight set emptied moved its own assertion in 1,2 s; the file was restored and verified by hash | observed |

The batch's own state is the first application of the rule: the seven stories were kept `ready` while they were
implemented and set `done` at once, which is recorded in each story's Decision log. A batch that writes a rule
cannot be read as one story in flight, so the rule is satisfied here by the record, not by the work order.

## Review

Verdict: APPROVED (round 1, checklist v2).

- C1 pass (process story): AC1 is `checkInFlight` with its two fixtures, AC2 is the same function read with the
  five statuses that are not in flight. S5 pass (the rule was read by hand over the tree). T1 pass. T2 pass: one
  test per AC at the script level. T3 pass. T4 n.a. (no e2e spec changed). T5 pass. C2 to C6, S1 to S4, K2, K3,
  K10, K11, A1 to A4 n.a.: no app code, no CSS, no network call, no env variable. K4 pass, K6, K7, K8, K9 pass.
- `[minor]` finding 1 — the rule reports a second story in flight but cannot say which one should be finished
  first, so it is a record check, not a lock (stated in Out of scope). Kept.
- `[minor]` finding 2 — the seven stories of this batch were in flight in the working sense while the rule was
  being written, and the check could not report it because a `ready` story is not in flight. This is the case the
  Decision log records; it is not a defect in the check, since the check reads the status, not the intent. Kept.

## Explanation

One story is worked on at a time, and the structure check now reports a second one. This is what keeps a record
readable: a story's Test report quotes the numbers of a run, and if another story's numbers are still moving at
the same time, the record quotes a state that is no longer true. The check does not decide the order; it reports
the situation, so the orchestrator's report names which story is waiting.

## Retrospective

- P38 — one story in flight at a time, read as the four statuses that mean work is happening — applies to
  CLAUDE.md (approved)
- P38 — the batch that writes this rule is the exception it records: seven stories, one branch, one batch commit,
  all `ready` until they were `done` at once (record only)
