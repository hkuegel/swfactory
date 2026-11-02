---
id: 006
title: Minesweeper presets and timer
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
branch: feature/006-minesweeper-presets-timer
supersedes: []
changes: [005/AC1, 005/AC2] # setup gets presets (AC1); starting a board also resets the timer (AC2)
superseded-by:
---

# 006 – Minesweeper presets and timer

## Original request

> implementiere ein mine sweeper spiel. ich möchte grösse des spielfelds und ANzahl der Bomben festelgen können

Note: this is hak's request for story [005](005-minesweeper.md) (2026-11-01, German). Presets and the timer were split off from 005 at hak's decision at gate 1 ("Passt, mit Split").

## User story

As a player, I want ready-made difficulty levels and a running timer, so that I can start a typical game with one choice and see how long a game takes.

## Context

Split off from [005](005-minesweeper.md) at its gate 1. hak confirmed both features there with the proposed defaults:

- **Presets** in addition to free input: Beginner 9 × 9 with 10 mines, Intermediate 16 × 16 with 40 mines, Expert 16 × 30 with 99 mines (rows × columns).
- **Timer:** seconds since the first reveal; stops on win and on loss; reset on a new game.

This story depends on 005 (setup inputs, "Start", board, win and loss). The preset values are within the ranges of 005 (rows and columns 5 to 30, mines 1 to rows × columns − 9).

Nothing is persisted (005): the timer is lost on reload; best times are a separate follow-up story.

## Acceptance criteria

- **AC1:** Given I am signed in and look at the setup, when I see the difficulty options, then there are exactly three presets named "Beginner", "Intermediate" and "Expert" next to the free inputs of [005/AC1](005-minesweeper.md).
- **AC2:** Given the setup is shown, when I choose a preset, then the rows, columns and mines inputs show 9 / 9 / 10 (Beginner), 16 / 16 / 40 (Intermediate) or 16 / 30 / 99 (Expert), I can still edit them, and a board in progress stays unchanged until I choose "Start" (as in [005/AC2](005-minesweeper.md)).
- **AC3:** Given a board has been created with "Start", when I look at the timer, then it shows 0 and does not advance until I reveal the first cell; after that it shows the whole seconds elapsed since the first reveal, increasing by one every second while the game is in progress, with no upper limit.
- **AC4:** Given a game in progress with a running timer, when the game is won or lost, then the timer stops and keeps showing the elapsed seconds.
- **AC5:** Given a game is in progress or finished, when I choose "Start" with valid values, then the timer shows 0 and does not run until the first reveal of the new game.

## Out of scope

- Best times, high-score table or statistics (follow-up story); the timer value is not stored.
- Saving the chosen preset or the timer across reload or sign-out.
- Further presets, custom named presets, or a preset that starts the game by itself (see Decision log, 2026-11-02).
- Chording and everything else listed as out of scope in [005](005-minesweeper.md).

## Open questions

_None._

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-01 — Story created by the split of 005 at hak's gate 1 ("Passt, mit Split"). Presets (005 Q2) and timer (005 Q5) were confirmed there with the proposed defaults, so ACs are written for both. One new open question recorded with a proposed default: whether a preset only fills the inputs or starts the game; not asked at gate 1, so the story stays draft until hak confirms. `changes: [005/AC1, 005/AC2]`. (product-owner)
- 2026-11-02 — Gate 1, hak: "passt. leg los". Answer to the former open question 1 (does a preset only fill the inputs or start a game immediately): a preset only fills the inputs; "Start" is still needed, as in 005/AC2. Consequence: AC2 unchanged, question removed from "Open questions", status set to `ready`. (product-owner)
- 2026-11-02 — Gate 1, hak: "passt. leg los" (accepts the orchestrator's proposal at gate 1). Scope decision: the timer has no upper limit, unlike classic Minesweeper, which stops at 999. Consequence: "with no upper limit" added to AC3; the 999 cap is not applied. (product-owner)

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
