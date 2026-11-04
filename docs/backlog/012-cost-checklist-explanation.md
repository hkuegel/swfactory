---
id: 012
title: Factory process - cost per story, reviewer checklist, plain-language explanation at gate 2
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: chore # feature | bug | chore
app: platform # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: feature/012-factory-process-improvements
supersedes: []
changes: []
superseded-by:
---

# 012 – Factory process: cost per story, reviewer checklist, plain-language explanation at gate 2

## Original request

> Verbatim, hak, 2026-11-04 (short exchange):
>
> - hak: "such mir mal nach mehr Artikeln zum Thema software factories (also mit AI)"
> - hak: "ja bitte. ich will nicht alles lesen. gib mir eine zusammenfassung und weise darauf hin wenn ich was komplett lesen sollte"
> - The orchestrator summarised Addy Osmani "Software Factories, Light and Dark", LaunchDarkly "Building a software factory on our scariest code" and Zylos Research "Multi-agent software development" and proposed three improvements:
>   1. "Kosten pro Story: Tokens pro Story/Rolle in der Retro festhalten (LaunchDarkly hat das von Anfang an als Metrik geführt, wir bisher gar nicht)."
>   2. "Reviewer mit fester Checkliste statt freiem Review, damit der LLM-Reviewer weniger beliebig ist (Osmanis Kritik)."
>   3. "Gegen Comprehension Debt: bei Gate 2 eine kurze Klartext-Erklärung, wie die Lösung funktioniert und wo die Risiken liegen – nicht nur AC-Tabelle und Bilder."
> - hak: "Ja, Story schreiben"

## User story

As the sponsor of the factory, I want to see what a story cost, have reviews follow a fixed checklist, and get a short plain-language explanation at gate 2, so that I can steer cost, trust the review to be consistent, and understand what was built without reading code.

## Context

Three improvements to the factory process itself, taken from articles on AI software factories. No app or platform code changes; only process files (`CLAUDE.md`, agent files, the `feature` and `bug` skills, the story template) and the structure check.

- Cost: the orchestrator sees each subagent's token usage, tool uses, duration and chosen model when the agent finishes. It does not see its own main-session tokens per story exactly.
- Review: today the reviewer writes free-form findings with severities; its memory holds several check files. A fixed checklist makes reviews comparable between stories.
- Comprehension: hak does not read code. Gate 2 today shows an AC table, test results and screenshots, but no explanation of how the solution works.

Applies to `/feature` and `/bug` (both have a retro and gate).

Decided at gate 1 (see Decision log):

- Reviewer checklist: one factory file `.claude/agents/reviewer-checklist.md` with a `version:` in its first lines, referenced from the reviewer's agent file. The existing check files in the reviewer's memory stay as lessons.
- Explanation: a new section "Explanation" between "Review" and "Retrospective", written by the orchestrator after the review verdict, from story, diff and test report. The tech-writer is not involved.
- Enforcement: `npm run check:structure` fails for a story with `status: done` and an id above 012 that lacks the cost table row or has an empty or missing "Explanation" section. This is a script change for `devops`.
- Scope in time: stories 001 to 011 are not backfilled. The rule applies from story 013 on; story 012 is exempt from AC1 to AC7, because they cannot be observed on it before it is done.
- Cost numbers are recorded only: no thresholds, no budgets. The retro may comment when one role stands out.

## Acceptance criteria

- **AC1:** Given a story of `/feature` or `/bug` that went through the pipeline after this change, when its "Retrospective" section is read, then it contains a cost table with one row per agent run (role, round, model, tokens, tool uses, duration) and a total over the rows.
- **AC2:** Given a cost table, when the orchestrator's own main-session usage is not exactly observable, then the table has a separate row "orchestrator (main session)" marked as "not measured" or as an estimate labelled "estimate"; it is never shown as a measured value, and it is not included in the total of measured rows.
- **AC3:** Given a run of an agent whose usage was not reported, when the cost table is written, then that row shows "n/a" instead of a number or a guess.
- **AC4:** Given a reviewer run, when the story's "Review" section is read, then it lists every item of the reviewer checklist with a result of pass, fail or n.a. (n.a. with a one-line reason), plus the checklist version used.
- **AC5:** Given the checklist, when it is read, then it is one versioned file in the repository, `.claude/agents/reviewer-checklist.md` (version in its first lines), that the reviewer agent is instructed to work through, and findings outside the checklist are still allowed and reported with severity as before.
- **AC6:** Given gate 2, when the orchestrator presents the story to hak, then the presentation includes, in German, an explanation of at most 15 lines (how the solution works, what changed where, the main risks, what was not verified), in plain language without code or file-level jargon, in addition to the existing gate items.
- **AC7:** Given a story that reached gate 2 after this change, when its file is read, then it has a section "Explanation" in English with the same content as the German one shown at gate 2, placed between "Review" and "Retrospective", and the story template contains that section heading.

## Out of scope

- Changing models, the agent roster or roles.
- Dashboards, charts or any cost tooling beyond the table in the story.
- Budgets or limits on cost; this story only records it.
- Any app or platform code.
- Rewriting old stories (stories 001 to 011 are exempt, see Decision log).

## Open questions

None.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-04 — Q: Write a story for the three proposed improvements? — A: "Ja, Story schreiben" (hak)
- 2026-11-04 — Q: Open question 1, where does the reviewer checklist live? Proposed default: `.claude/agents/reviewer-checklist.md`, a factory file with a `version:` in its first lines, referenced from `reviewer.md`; the existing check files in the reviewer's memory stay as lessons. — A: "Ja, alles" (hak, gate 1). Default confirmed; folded into Context and AC5.
- 2026-11-04 — Q: Open question 2, where does the explanation live in the story and who writes it? Proposed default: new section "Explanation" between "Review" and "Retrospective", written by the orchestrator after the review verdict from story, diff and test report; the tech-writer is not involved. — A: "Ja, alles" (hak, gate 1). Default confirmed; folded into Context and AC7.
- 2026-11-04 — Q: Open question 3, should `check-structure` enforce the new sections? Proposed default: yes, for a story with `status: done` and an id above 012 a cost table row and a non-empty "Explanation" section; script change by devops, not required for the process change to count as done. — A: "Ja, alles" (hak, gate 1). Default confirmed; folded into Context (enforcement).
- 2026-11-04 — Q: Open question 4, are old stories (001 to 011) exempt? Proposed default: yes, nothing is backfilled; the rule applies from story 013 on, and 012 itself is exempt from AC1 to AC7. — A: "Ja, alles" (hak, gate 1). Default confirmed; folded into Context (scope in time).
- 2026-11-04 — Q: Open question 5, how are cost numbers used? Proposed default: recorded only, no thresholds; the retro may comment when one role stands out. — A: "Ja, alles" (hak, gate 1). Default confirmed; folded into Context.
- 2026-11-04 — Q: Open question 6, for `/bug`, is the cost table required too? Proposed default: yes, same table, because it also has a retro. — A: "Ja, alles" (hak, gate 1). Default confirmed; folded into AC1.
- 2026-11-04 — Q: AC1 to AC7 as written, approved at gate 1? — A: "Ja, alles" (hak, gate 1). ACs unchanged in wording except the references to the open questions (AC5 location, AC7 placement) which now carry the confirmed values.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

Not applicable (no UI).

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

## Implementation notes

_developer: what was built, deviations from the design and why._

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s) | Result |
| --- | ------- | ------ |

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates),
proposed changes to agents/CLAUDE.md/templates, and which ones hak approved._
