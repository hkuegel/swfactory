---
id: 005
title: Minesweeper with configurable board size and mine count
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
branch: feature/005-minesweeper
supersedes: []
changes: [004/AC7] # the signed-in content is no longer the placeholder text and the counter
superseded-by:
---

# 005 – Minesweeper with configurable board size and mine count

## Original request

> implementiere ein mine sweeper spiel. ich möchte grösse des spielfelds und ANzahl der Bomben festelgen können

## User story

As a signed-in player, I want to play Minesweeper on a board whose size and number of mines I choose myself, so that I can play easy or hard games as I like.

## Context

First domain story after the infrastructure baseline (git tag `base`). Requested by hak on 2026-11-01 in German; the app language stays English like all copy so far.

Interpretation (confirmed at gate 1):

- "Bomben" means the mines of classic Minesweeper.
- "Grösse des Spielfelds" means the number of rows and the number of columns, chosen separately (non-square boards are allowed).
- Classic Minesweeper: a rectangular grid of hidden cells, some of which contain a mine. Revealing a cell with a mine loses the game. Revealing a cell without a mine shows how many of its up to 8 neighbours (horizontal, vertical, diagonal) contain a mine. A cell with 0 neighbouring mines automatically reveals all its neighbours, and so on (flood fill). The player can mark hidden cells with a flag. The player wins when every cell without a mine is revealed.

What exists today: a login screen (Google, plus "Sign in as guest" in development, stories [001](001-login.md) and [004](004-guest-login.md)); once signed in the page shows a header ("Signed in as …", "Sign out"), a placeholder paragraph and a counter button. Nothing is stored (001: every reload shows the login screen).

Constraints confirmed by hak at gate 1 ("Passt, mit Split"). They are constraints unless an AC says otherwise:

- **Where the game lives:** it replaces the placeholder paragraph and the counter button in the signed-in view. Only signed-in users, guests included, can play. The signed-in header stays as it is.
- **Value ranges:** rows and columns 5 to 30; mines 1 to (rows × columns − 9). Defaults on first visit: 9 rows, 9 columns, 10 mines. The mine limit follows from the safe first reveal (AC5): the first revealed cell and its neighbours never contain a mine.
- **Flagging:** a flag has two states only, flagged or not flagged (no question marks). Flag with right-click on desktop and long-press on touch devices (AC6), or with the F key (AC8). The flag count has no limit.
- **Nothing is persisted:** settings, a running game and any times are lost on reload and on sign-out; best times would be a follow-up story.
- **No confirmation** is asked before "Start" discards a game in progress (AC2).
- **Setup stays visible** above the board, also while a game is running, so "Start" restarts with the values in the fields.

Relation to other stories:

- [001/AC1](001-login.md) still holds: someone who is not signed in sees the login screen and no game.
- [004/AC7](004-guest-login.md) says a guest sees "the same signed-in content as a Google user (the counter is visible)". "Same content as a Google user" still holds; the counter in its parenthesis is replaced by the game, hence `changes: [004/AC7]`.
- [006 – Presets and timer](006-minesweeper-presets-timer.md) was split off at gate 1 and extends AC1 and AC2 of this story.

## Acceptance criteria

- **AC1:** Given I am signed in, when I look at the page, then I see inputs for the number of rows, columns and mines, each with a visible label, the allowed range shown next to it, and the values 9, 9 and 10 prefilled, plus a "Start" option, and no board yet. (extended by [006](006-minesweeper-presets-timer.md))
- **AC2:** Given the setup values are valid, when I choose "Start" (the first time, during a game or after a game has ended, without any confirmation), then a new board with exactly the chosen number of rows and columns appears, all cells hidden, the remaining-mines counter shows the number of mines, no win or loss message is shown, and the setup inputs stay visible above the board; and when I only edit the setup values without choosing "Start", then the current board and counter stay unchanged. (extended by [006](006-minesweeper-presets-timer.md))
- **AC3:** Given a value is empty, not a whole number, or outside its allowed range (rows and columns 5 to 30, mines 1 to rows × columns − 9), when I choose "Start", then I see a message that names the problem field and states what is allowed, no board is created, and a game already in progress stays unchanged.
- **AC4:** Given a game in progress, when I reveal a hidden cell that contains no mine and has n ≥ 1 neighbouring mines (8-neighbourhood), then the cell shows the number n; revealing an already revealed cell changes nothing.
- **AC5:** Given a game in progress, when I reveal a hidden cell that contains no mine and has 0 neighbouring mines, then it is shown as empty and all its neighbours are revealed, repeating for every newly revealed empty cell, and flagged cells are not revealed by this; and the first cell I reveal in a game never contains a mine and is shown as empty, so that an area opens.
- **AC6:** Given a game in progress, when I flag a hidden cell with a right-click (mouse) or a long-press (touch), then the cell shows a flag, and when I do the same on the flagged cell, then it is hidden again; while a cell is flagged, trying to reveal it changes nothing, and a revealed cell cannot be flagged.
- **AC7:** Given a game in progress, when I look at the remaining-mines counter, then it shows the number of mines minus the number of flags currently placed, starting at the number of mines, updating on every flag placed or removed, and showing a negative number if there are more flags than mines.
- **AC8:** Given a game in progress, when I use only the keyboard, then the arrow keys move the focus between the cells of the board (not beyond its edges), Enter or Space reveals the focused cell as in AC4 and AC5, and the F key flags or unflags the focused cell as in AC6.
- **AC9:** Given a game in progress, when I reveal a hidden cell that contains a mine, then I see a message that the game is lost, all mines are shown, the mine I revealed is highlighted, flags on cells without a mine are marked as wrong, correctly flagged mines stay flagged, and revealing or flagging cells no longer changes the board.
- **AC10:** Given a game in progress, when I have revealed every cell that contains no mine, then I see a message that the game is won, all mines are flagged, the counter shows 0, and revealing or flagging cells no longer changes the board.

## Out of scope

- Presets (Beginner, Intermediate, Expert) and a timer: story [006](006-minesweeper-presets-timer.md), split off at gate 1.
- "Chording" (clicking a revealed number to reveal its remaining neighbours once enough flags are placed): follow-up story.
- Best times, high-score table, statistics or any other persisted data: follow-up story.
- Saving a running game, or keeping the settings, across a reload or sign-out.
- Question marks as a third flag state.
- Multiplayer, undo, hints, solver, custom themes, sound.
- Any backend, and any use of the signed-in identity beyond showing the game only to signed-in users.

## Open questions

None.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-01 — Story created from hak's request (German, kept verbatim). "Bomben" read as mines, "Grösse des Spielfelds" read as rows and columns (assumptions). ACs written for the answer-independent core of classic Minesweeper. 16 open questions recorded with proposed defaults in brackets, none confirmed. Marks change to 004/AC7 (depends on question 7). 10 ACs, above the ~7 guideline. Status draft. (product-owner)
- 2026-11-01 — Q1: Ranges and defaults? Proposed: rows and columns 5 to 30, mines 1 to (rows × columns − 9), defaults 9 × 9 with 10 mines. — A: "Passt, mit Split" (hak, gate 1) = as proposed. Consequence: AC1 (defaults, ranges shown), AC3 (validation); constraint in Context.
- 2026-11-01 — Q2: Presets in addition to free input (Beginner 9 × 9 / 10, Intermediate 16 × 16 / 40, Expert 16 × 30 / 99)? — A: "Passt, mit Split" (hak, gate 1) = yes, but moved to story 006 by the split. Consequence: no AC here; see 006.
- 2026-11-01 — Q3: First click always safe, including its neighbours? — A: "Passt, mit Split" (hak, gate 1) = yes, mines are placed after the first click. Consequence: second half of AC5; mine limit rows × columns − 9.
- 2026-11-01 — Q4: How to flag, and play without a mouse? — A: "Passt, mit Split" (hak, gate 1) = right-click on desktop, long-press on touch, keyboard with arrow keys, Enter or Space to reveal, F to flag; keyboard and touch play stay in this story (orchestrator recommendation, accepted for accessibility). Consequence: AC6 (mouse and touch flagging) and AC8 (keyboard play).
- 2026-11-01 — Q5: Timer (seconds since the first reveal, stops on win and loss, reset on a new game)? — A: "Passt, mit Split" (hak, gate 1) = yes, but moved to story 006 by the split. Consequence: no AC here; see 006.
- 2026-11-01 — Q6: Chording? — A: "Passt, mit Split" (hak, gate 1) = no, not in this story; follow-up. Consequence: Out of scope.
- 2026-11-01 — Q7: Where does the game live? — A: "Passt, mit Split" (hak, gate 1) = it replaces the placeholder paragraph and the counter; only signed-in users, guests included. Consequence: constraint in Context; `changes: [004/AC7]` confirmed.
- 2026-11-01 — Q8: Persistence? — A: "Passt, mit Split" (hak, gate 1) = nothing persisted, not settings, running game or times; best times a follow-up. Consequence: constraint and Out of scope.
- 2026-11-01 — Q9: Question marks as a third flag state? — A: "Passt, mit Split" (hak, gate 1) = no. Consequence: constraint and Out of scope.
- 2026-11-01 — Q10: Rows and columns separate (non-square boards allowed)? — A: "Passt, mit Split" (hak, gate 1) = yes, separate. Consequence: AC1 and AC3 have separate rows and columns inputs.
- 2026-11-01 — Q11: What does a lost game show? — A: "Passt, mit Split" (hak, gate 1) = the revealed mine is highlighted, flags on cells without a mine are marked as wrong, correctly flagged mines stay flagged. Consequence: AC9.
- 2026-11-01 — Q12: What does a won game show? — A: "Passt, mit Split" (hak, gate 1) = remaining unflagged mines are flagged automatically, counter shows 0. Consequence: AC10.
- 2026-11-01 — Q13: Can the counter go below 0? — A: "Passt, mit Split" (hak, gate 1) = yes, it shows the negative number; no limit on flags. Consequence: AC7.
- 2026-11-01 — Q14: Confirmation before "Start" discards a running game? — A: "Passt, mit Split" (hak, gate 1) = no confirmation. Consequence: AC2.
- 2026-11-01 — Q15: Setup always visible, also during a game? — A: "Passt, mit Split" (hak, gate 1) = yes, above the board. Consequence: AC2.
- 2026-11-01 — Q16: Minimum number of mines? — A: "Passt, mit Split" (hak, gate 1) = minimum 1. Consequence: AC3.
- 2026-11-01 — Scope decision: split. The orchestrator recommended moving presets (Q2) and the timer (Q5) into a follow-up story 006 and keeping keyboard and touch play in 005 for accessibility. — A: "Passt, mit Split" (hak, gate 1). Consequence: story 006 created; ACs folded and merged (overlapping flag, counter, win, loss and restart behaviour merged; 10 ACs remain, flagged as above the ~7 guideline because setup, play and keyboard are not useful alone); open questions now empty; status ready. (product-owner)

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
