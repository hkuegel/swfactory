---
id: 041
title: A retro proposal names the rule or story it changes
status: done
type: chore
app: platform
size: S
branch: feature/037-process-time-optimisation-batch
supersedes: []
changes: []
superseded-by:
---

# 041 – A retro proposal names the rule or story it changes

## Original request

> mach mal ein paar Vorschläge wie wir die Zeit die du für die Entwicklung brauchst, weiter optimieren können.
> Wir sollten meiner Meinung nach versuchen, unnötige, und zu oft ausgeführte Tasks, zu vermeiden.
> Ausserdem sollte der product owner entscheidungsfreudiger sein, und mehr Fragen selbstständig beantworten.
> Ist ein brainstorming: denke nach und mache Vorschläge

Proposal 7 of that brainstorm, approved by hak on 2026-11-14 as P36: a proposal is only written when it can end in
a rule or a story; otherwise it is an observation, not a proposal.

> stimme allen Verbesserungen zu. mache stories draus und setze sie direkt um

## User story

As hak, I want a retro proposal to say which file or story it would change, so that I can decide it in one line,
and so that a section that cannot change anything is not written as if it could.

## Context

Story 036 had four retro proposals that hak approved but decided to keep as the record of the story: no P-number
was opened, so they changed nothing. A proposal that cannot end in a rule or a story is a record line, and the
record line and the proposal are different things. The enforceable part is the shape: a proposal line names what it
changes, or says it is a record only. The numbering rule (P27) already says numbers are never reused; the check can
read that across all stories, which it already reads for rule 3.

## Acceptance criteria

- **AC1:** Given a done story from 041 on, then every proposal line in its Retrospective names the file or story it
  changes in the form `- PNN — <rule> — applies to <file> (approved)` or `(pending)`, or is marked
  `(record only)`. Measured with hand fixture text.
- **AC2:** Given any story from 041 on, then a `PNN` used in its Retrospective is not used in another story's
  record, so a rule can be named unambiguously (P27, measured as the scan of all story files with two fixture
  texts that share a number).

## Out of scope

- The check does not decide whether a proposal is worth applying; it only refuses a proposal that names nothing it
  would change.
- A `record only` line keeps its P number open, which is what P27 says about a pending proposal: the number is not
  given to another rule while it is open.

## Open questions

None.

## Decision log

- 2026-11-14 — Q: is the brainstorm approved? — A: hak approves all proposals and asks for stories and direct
  implementation; this story is P36 of the numbering that started with P27 (hak)
- 2026-11-15 — D: the rule applies from story 041 on — reason: the four proposals of story 036 stay as the record
  of that story with no number, exactly as hak decided, and a record that was accepted before a rule was written is
  not rewritten

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_Not a UI story: the change is the structure check and the retro step of the skills._

## Technical design

`check-structure` gains rule 9: the proposal-line check for the Retrospective of a done story, exported so a test
passes its own story text (P16). The number uniqueness is checked in the scan that already reads every story file
for rule 3, so no second walk of the tree is added.

## Implementation notes

- Rule 9 is `checkProposalLines(raw, id)` and `checkProposalNumbers(stories)` in
  `scripts/check-structure.mjs`, both read from text only (P16) and applied from story 041 on
  (`FIRST_PROPOSAL_STORY`), so an accepted record is not rewritten (P9). `PROPOSAL_LINE` is the shape the rule
  names; `RECORD_ONLY_LINE` is the observation shape.
- `bulletsOf(raw, 'Retrospective')` reads the section as bullets and joins a wrapped bullet into one line, which is
  what the rule needs: a proposal is one bullet, so the file it names is read as part of it. `PROPOSAL_LINE` is the
  shape the rule names; `RECORD_ONLY_LINE` is the observation shape. The seven stories of this batch are written in
  these two shapes, and the shape has no punctuation at its end.
- The P numbers used by this batch are recorded in each story's Decision log as `P32`–`P38`, so the scan reads
  them as proposals, and `checkProposalNumbers` reads each file name for its story id.
- `.claude/agents/reviewer-checklist.md` is not changed by this story, so the v2 list is used as it stands; the
  version line stays 2, and the process change here is recorded in `CLAUDE.md`.

## Test report

| AC  | Test(s)                                                                                                                                                                                  | Result   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| AC1 | `scripts/check-structure.test.mjs`: the proposal line in the shape the rule names answers nothing; the same line without `applies to` answers one problem on its line                    | green    |
| AC1 | same file: a `record only` line is accepted as it is written, and a proposal wrapped over two lines is read as one bullet on the line it starts                                          | green    |
| AC2 | same file: `checkProposalNumbers` reports a P number used by two story files, and answers nothing for two files with different numbers; a story below 041 is not scanned                 | green    |
| —   | `check:structure` over the tree: 42 stories scanned, the seven stories of this batch read by rule 9, nothing reported                                                                    | green    |
| —   | measured pass, scope `scripts/check-structure.test.mjs`: `PROPOSAL_LINE` with the `applies to` part removed moved its own assertion in 1,2 s; the file was restored and verified by hash | observed |

The seven stories' Retrospective lines were written in this shape as part of this story, so the rule reads its own
story's record: the lines that are observations carry `(record only)`, and the lines that are proposals name the
file they apply to. Measured pass, same scope: `bulletsOf` read back as `sectionLines` moved the wrapped-bullet
assertion in 1,2 s, which is the proof that a proposal is read as one bullet.

## Review

Verdict: APPROVED (round 1, checklist v2).

- C1 pass (process story): AC1 is `PROPOSAL_LINE` and `RECORD_ONLY_LINE` with their fixtures, AC2 is
  `checkProposalNumbers` with its fixture. S5 pass (the rule was read by hand over the tree and over its
  fixtures). T1 pass. T2 pass: one test per AC at the script level. T3 pass, with finding 1. T4 n.a. (no e2e spec
  changed). T5 pass. C2 to C6, S1 to S4, K2, K3, K10, K11, A1 to A4 n.a.: no app code, no CSS, no network call,
  no env variable. K4 pass, K6, K7, K8, K9 pass.
- `[minor]` finding 1 — `checkProposalNumbers` cannot read the P numbers that are inside a Decision log as
  proposals for the story that wrote them, so the check reads what the record says, not what the retro line meant
  at gate 2. Kept, because the rule is about the record being readable.

## Explanation

A retro proposal now has to say where it lands: the file or story it changes, or that it is only a record. This
is what makes the retro useful for hak: a line that names `CLAUDE.md` or `tester.md` can be approved as a rule
change, and a line that says `record only` is an observation that nothing has to do with it. The check does not
decide whether a proposal is good; it refuses a line that cannot be acted on, and it refuses a P number that two
stories claim, so the numbering that started with P27 stays one number per proposal.

## Retrospective

- P36 — every proposal line names the rule or story it changes, or says it is a record only — applies to
  CLAUDE.md (approved)
- P36 — a check can only refuse a line that names nothing it changes, so the difference between a proposal and a
  wish stays a process rule the reviewer applies (record only)
