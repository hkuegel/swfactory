---
id: NNN
title: Short title
status: draft # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: platform # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: feature/NNN-slug
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [] # stories whose behaviour this one modifies, e.g. [004/AC2, 007]
superseded-by: # set on the OLD story when a newer one replaces it
---

# NNN – Short title

## Original request

> hak's request, verbatim — exactly as given to `/feature`, `/story` or `/bug`.

## User story

As a <role>, I want <capability>, so that <benefit>.

## Context

Why this matters, who asked for it, relevant background.

## Acceptance criteria

- **AC1:** Given <precondition>, when <action>, then <observable result>.
- **AC2:** …

## Out of scope

- …

## Open questions

- …

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- YYYY-MM-DD — Q: … — A: … (hak)

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

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
