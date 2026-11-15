---
id: 040
title: The product owner writes a default with the reason, not a question
status: done
type: chore
app: platform
size: S
branch: feature/037-process-time-optimisation-batch
supersedes: []
changes: []
superseded-by:
---

# 040 – The product owner writes a default with the reason, not a question

## Original request

> mach mal ein paar Vorschläge wie wir die Zeit die du für die Entwicklung brauchst, weiter optimieren können.
> Wir sollten meiner Meinung nach versuchen, unnötige, und zu oft ausgeführte Tasks, zu vermeiden.
> Ausserdem sollte der product owner entscheidungsfreudiger sein, und mehr Fragen selbstständig beantworten.
> Ist ein brainstorming: denke nach und mache Vorschläge

Proposals 5 and 6 of that brainstorm, approved by hak on 2026-11-14 as P35: a question the story already answers is
not asked, and a reversible preference is decided as a default with one line at gate 2, so that hak reads one line
instead of answering a question.

> stimme allen Verbesserungen zu. mache stories draus und setze sie direkt um

## User story

As hak, I want the product owner to write a default with its reason instead of asking me about a preference it can
decide, so that only the questions that are genuinely mine reach me, and so that I can see each default as one
line at gate 2.

## Context

The convention "Decide, don't ask" exists but names no threshold, so the threshold is what this story writes. The
questions that stay hak's are the ones the machine cannot answer: the meaning of a word hak used, the data the
source carries, the merge, and what a page looks like when hak has to see it. Everything else is a default with a
reason. In story 036 the column order and the label wording were such defaults: they were asked, and they could
have been written as a decision with the reason, which is one line at gate 2.

The enforceable part is the shape of the record: an open question must name why it is hak's, a decision line must
say whose it is, and a `ready` story cannot carry an open question that blocks work.

## Acceptance criteria

- **AC1:** Given a story from 040 on, when its Open questions section has a line, then that line names the kind of
  question it is, with one of the words `word`, `data`, `source`, `look` or `irreversible` after `hak:`; the
  structure check fails a line that names no kind (rule 8). Measured with hand fixture text.
- **AC2:** Given a story from 040 on, then every Decision-log line is either a hak answer in the form
  `Q:` … `A:` … `(hak)` or an orchestrator default in the form `D:` … `reason:`; the structure check fails a
  decision line that is neither (rule 8). Measured with hand fixture text.
- **AC3:** Given a story from 040 on with `status: ready`, then its Open questions section is empty, because a
  default with a reason is a decision, not an open question (product-owner rule 7 already sets `draft` when an open
  question blocks work). Measured with hand fixture text.

## Out of scope

- No automatic decision: the product owner still writes the default, the check only refuses a record that hides
  whose decision it is.
- The five kinds are not a permission list for the product owner; they are the words that name why a question is
  hak's.

## Open questions

None.

## Decision log

- 2026-11-14 — Q: is the brainstorm approved? — A: hak approves all proposals and asks for stories and direct
  implementation; this story is P35 of the numbering that started with P27 (hak)
- 2026-11-15 — D: the five kinds are `word`, `data`, `source`, `look` and `irreversible` — reason: the four kinds
  hak named in the brainstorm (his word, the source data, the merge authority, what he must see in the browser)
  plus the existing "costly to reverse", which is written as one word so the check can read it
- 2026-11-15 — D: a decision line names its owner at its end, `(hak)` or `reason:` — reason: gate 2 shows one line
  per default, and a line that does not say whose decision it is cannot be read as a default

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_Not a UI story: the change is a rule in `product-owner.md` and the structure check._

## Technical design

`check-structure` gains rule 8 with two exported rule functions that take the story text as data: the open-question
line check and the decision-line check, plus the ready-status check. They apply from story 040 on, so an earlier
story's record is not rewritten, which is the same rule style as the size rules from story 026 on.

## Implementation notes

- Rule 8 is `checkStoryRecordLines(raw, id)` in `scripts/check-structure.mjs`, read from the story text only
  (P16) and applied from story 040 on (`FIRST_RECORD_LINE_STORY`), so a record accepted before the rule was
  written is not rewritten (P9). What it reads: `KIND_LINE` for the open-question line, `DECISION_OWNER` for the
  decision line, and the `status:` line for the ready check. `bulletsOf` reads a wrapped bullet as one line,
  which is what the acceptance shape needs.
- `DECISION_OWNER` is `/\(hak\)$|— reason: /`, the two shapes the rule names. The shapes earlier records used
  (`(hak, <date>)` and `Decision (orchestrator):`) are not read, because the rule starts at 040 and the records
  that used them are below it.
- `.claude/agents/product-owner.md` names the threshold and the owner at the end of a decision line.

## Test report

| AC         | Test(s)                                                                                                                                                                                                                                                                                                                                                                                     | Result   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| AC1        | `scripts/check-structure.test.mjs`: `checkStoryRecordLines` with a question that names its kind answers nothing; the same text with a question that names no kind answers one problem, on the line the question is on                                                                                                                                                                       | green    |
| AC2        | same file: a decision line that names no owner is a problem; the two shapes the rule names are read as they are written, including a hak answer wrapped over two lines                                                                                                                                                                                                                      | green    |
| AC3        | same file: the same text with `status: ready` and an open question answers one problem                                                                                                                                                                                                                                                                                                      | green    |
| AC1 to AC3 | `check:structure` over the tree: 42 stories, 66 markdown files, nothing reported; the seven stories of this batch are read by rule 8 and pass                                                                                                                                                                                                                                               | green    |
| —          | the kinds read in this batch, by hand: `word` (story 036, hak's word for the column), `data` (story 035, the values the fund list carries), `irreversible` (the merge, hak's standing rule). `look` and `source` name a page hak must see and a value whose authority is in question; neither was needed in this batch, so no question was asked: gate 1 was given for the whole brainstorm | observed |

Mutation pass, scope `scripts/check-structure.test.mjs`: `DECISION_OWNER` without the `— reason:` branch moved
the rule-8 assertion in 1,2 s; the file was restored and verified by hash.

## Review

Verdict: APPROVED (round 1, checklist v2).

- C1 pass (process story): AC1 is `KIND_LINE` and its fixture, AC2 is `DECISION_OWNER` and its fixtures, AC3 is
  the status read in `checkStoryRecordLines`; each is named above. S5 pass (the rule was read by hand over the
  tree). T1 pass. T2 pass: one test per AC at the script level. T3 pass, with finding 1. T4 n.a. (no e2e spec
  changed). T5 pass. C2 to C6, S1 to S4, K2, K3, K10, K11, A1 to A4 n.a.: no app code, no CSS, no network call,
  no env variable. K4 pass, K6, K7, K8 pass, K9 pass.
- `[minor]` finding 1 — the rule reads the word, not the meaning: a line that happens to contain one of the five
  words passes even when the question is not genuinely hak's. The story says the kinds are words that name why a
  question is hak's, not a permission list, so this is the rule as written; it cannot be closed by a check.
- `[minor]` finding 2 — `data` and `source` name two different things in this project (the value a source
  carries, and whether the app may read it live at all), and the rule lists both. Recorded in the Decision log so
  the two words are not read as one.

## Explanation

The product owner asks only what is genuinely hak's: the meaning of a word he used, the values a source carries,
the authority a value comes from, what a page must look like to him, and anything costly to reverse — including
the merge, which is his. Everything else is written as a default with its reason, which is one line in the
Decision log that he reads at gate 2. The check does not make the decision: it refuses a record that hides whose
decision it is, so a default cannot be read as an answer hak gave, and a question that is really a preference
cannot be asked as if it were hak's. A `ready` story has no open question, because a default with a reason is a
decision.

## Retrospective

- P35 — the product owner writes a default with its reason and names the kind of a question that is hak's —
  applies to CLAUDE.md and .claude/agents/product-owner.md (approved)
- P35 — `data` names the value a source carries and `source` names whether the app may read it live, so the two
  words name different things and are not read as one (record only)
