---
id: 008
title: Minesweeper 3D mode, switchable during play
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
branch: feature/008-minesweeper-3d-mode
supersedes: []
changes: [] # extends 005 and 006 (their ACs also hold in 3D) but changes the wording of none
superseded-by:
---

# 008 – Minesweeper 3D mode, switchable during play

## Original request

> ich hätte gerne ein schönere UI.
> Und zwar eine schönere Version der jetzigen UI, plus einen zusätzlichen 3D Modus (umschaltbar, auch während des Spiels)

Note: this is one request (hak, 2026-11-02, German) that covers two parts. This story is part (b), the additional switchable 3D mode. Part (a), the nicer version of the current UI, is story [007](007-minesweeper-redesign.md). hak confirmed the split at gate 1.

## User story

As a player, I want to switch the board between the usual 2D view and a 3D view at any time, also in the middle of a game, so that I can play in the view I like without losing my game.

## Context

Requested by hak on 2026-11-02 in German; the app language stays English.

This story depends on [007](007-minesweeper-redesign.md) (built after it): the 3D view uses the visual direction chosen there. It builds on the game of [005](005-minesweeper.md) and [006](006-minesweeper-presets-timer.md).

3D is a different **view** of the same game. Constraints confirmed by hak at gate 1 ("Ja, alle Vorschläge", 2026-11-02). They are constraints unless an AC says otherwise:

- **What 3D means:** a 3D-looking board at a fixed viewing angle (a tilted board with relief: hidden tiles raised, revealed tiles lowered, flags and mines as small 3D-looking objects). No camera control: the player cannot rotate, zoom or pan the 3D view.
- **Control, keyboard, touch, screen reader:** the same as 2D, because the camera is fixed: arrow keys move focus between cells, Enter or Space reveals, F flags, right-click and long-press as in 005; a drag scrolls the board and never rotates it; the screen reader gets the same grid and names as in 2D (AC5).
- **Not remembered:** the chosen view is not persisted (consistent with 005 "nothing is persisted"); after a reload, or sign-out and sign-in, the app shows 2D again (AC8).
- **Control form and place:** a two-option choice labelled "View" with the options "2D" and "3D", next to the status bar so it is reachable during a game, and also available before the first "Start".
- **Rules, state, timer and texts** of 005 and 006 are the same in both views; only the board is presented differently. 2D stays the default and is always available.
- **Large boards and phones:** no width cut-off: 3D is offered on every screen size. The board scrolls inside its own box as in 005/007; a 30 × 30 board stays playable in 3D.
- **Colour schemes:** 3D follows light and dark like 2D, with the contrast rules of [007/AC3](007-minesweeper-redesign.md).
- **Visual sign-off by hak at gate 2** on screenshots of the key states, as in 007. The UX design of this story must list the screenshot states; the proposed minimum is: the 3D view in progress with revealed cells and flags, a lost game and a won game, each in light and dark, plus the game in progress at 375 px width, and the view control in both positions.

Feasibility check by the architect (recorded in the Decision log), with consequences for the ACs:

- The 3D view is one tilted plane on the existing board with a fixed tilt of at most 35°, a weak perspective and a small relief; the accessibility structure stays the one of 2D. No new dependency, no ADR.
- Because of the perspective, rows far from the viewer appear smaller: cells are 24 px nominal and only the far row is guaranteed at least 24 px on screen (AC3).
- The needed capability exists in all current browsers, so the fallback of AC7 is a cheap capability check.

Relation to other stories: all ACs of 005 and 006 hold in both views (AC4, AC5). No AC of 005 or 006 changes its wording, so there is no `changes:` link.

## Acceptance criteria

- **AC1:** Given I am signed in, when I look at the game (before the first "Start", during a game and after a win or loss), then I see the "View" control with the options "2D" and "3D" and a visible indication of the current view next to the status bar, and I can operate it with mouse, touch and keyboard.
- **AC2:** Given a game with revealed cells, flags, a counter value, a timer value and possibly a result (running, won or lost), when I switch to the other view and back, then no new board is created and in each view the same cells are revealed with the same numbers, the same cells are flagged, the counter shows the same number, the timer continues counting (or stays frozen if the game has ended) without a reset or a jump, a result message stays shown, and the board of a game that has not started yet is still empty.
- **AC3:** Given the 3D view, when I look at the board, then it is visibly different from the 2D view and shows depth: the board is displayed tilted at a fixed angle of at most 35°, hidden and flagged cells appear raised and revealed cells appear lowered, the cells are 24 px nominal and the cells of the far row are at least 24 px wide on screen; and when I switch back to 2D, then the 2D view of 007 is shown unchanged. (Verified by screenshot comparison within the same test run: the 3D board differs from the 2D board, and the 2D board after switching back equals the 2D board before; no committed reference images.)
- **AC4:** Given the 3D view and a game in progress, when I reveal, flag and unflag cells and win or lose, then everything behaves as in [005/AC4–AC10](005-minesweeper.md) and [006/AC3–AC5](006-minesweeper-presets-timer.md) (including mouse, long-press and the keyboard keys: arrow keys, Enter or Space, F), and starting a new game with "Start" or a preset still works as in 005/AC2 and 006/AC2 in either view.
- **AC5:** Given the 3D view, when I use a screen reader or look at the page structure, then the board offers the same structure and names as in 2D (the board as a grid with its rows and cells, each cell with the same accessible name as in 2D, the same counter and result announcements), and the focused cell is visibly marked with an indicator of at least 2 px and 3:1 contrast in both colour schemes.
- **AC6:** Given I have set the system to reduce motion, when I switch the view, then the switch is immediate with no animation and the 3D view never moves by itself; and given normal motion settings, when I switch, then any transition lasts at most 300 ms and nothing in the 3D view loops or flashes.
- **AC7:** Given a browser that cannot show the 3D view, when I look at the view control, then "3D" is shown as unavailable together with a short text that says so, I can still choose and use "2D", and no error, blank board or broken page appears. (Verified by simulating a browser without the capability.)
- **AC8:** Given I am signed in for the first time in a browser session, or I have reloaded the page, or signed out and signed in again, when I look at the game, then the "2D" view is the current one, even if I had chosen "3D" before.

## Out of scope

- Free camera control (rotating, zooming, panning) and a full 3D scene with an orbit camera: possible later as a separate story; it would need its own control, keyboard, touch and screen-reader decisions.
- Remembering the chosen view across reload or sign-out (AC8).
- New rules, board shapes (cubes, spheres, 3D boards with a third dimension of cells), sound or effects.
- Any change to the 2D view beyond 007.
- Backend, accounts or storing preferences.
- Hiding 3D on small screens (hak decided: no width cut-off).

## Open questions

None.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-02 — Story created from hak's request (German, kept verbatim) as part (b) of a two-part request. "Additional 3D mode, switchable, also during the game" read as an alternative view of the same game with unchanged rules and state (assumption). Depends on 007. Open questions 1 to 9 with proposed defaults; no AC written for the "remember the view" answer. No `changes:` link because no AC wording of 005 or 006 changes. 7 ACs. Status draft. (product-owner)
- 2026-11-02 — Q1: Order and dependency? Proposed: 008 is built after 007. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: stated in Context.
- 2026-11-02 — Q2: What does "3D" mean? Proposed: a 3D-looking board at a fixed viewing angle with raised hidden tiles, lowered revealed tiles, small 3D flags and mines, no camera control. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: constraint in Context; AC3; full 3D scene with camera is Out of scope.
- 2026-11-02 — Q3: Control, keyboard, touch, screen reader? Proposed: same as 2D, a drag never rotates. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: AC4 and AC5.
- 2026-11-02 — Q4: Is the chosen view remembered? Proposed: no, resets to 2D after reload or sign-out. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed, and the coordinator asked for it to be written as an AC or constraint. Consequence: AC8 (8 ACs, one above the ~7 guideline because the reset is its own observable behaviour); also Out of scope.
- 2026-11-02 — Q5: Reduced motion? Proposed: instant switch, nothing moves by itself, at most 300 ms otherwise. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: AC6.
- 2026-11-02 — Q6: Fallback? Proposed: "3D" shown as unavailable with a short text, 2D unaffected. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: AC7.
- 2026-11-02 — Q7: Control form and place? Proposed: two-option "View" choice with "2D" and "3D", with the status bar, also before the first "Start". — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: AC1.
- 2026-11-02 — Q8: Large boards and small screens? Proposed: board scrolls in its own box, 30 × 30 stays playable in 3D, no width cut-off. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed (no width cut-off). Consequence: constraint in Context; AC3 states the cell size on screen.
- 2026-11-02 — Q9: Colour schemes? Proposed: 3D follows light and dark with the 007/AC3 contrast rules. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: constraint in Context; AC5 (focus contrast in both schemes).
- 2026-11-02 — Scope decision: hak signs off screenshots of the key states at gate 2 (my proposal). — A: "Ja, alle Vorschläge" (hak, gate 1) = accepted. Consequence: stated in Context; the UX design must list the screenshot states.
- 2026-11-02 — Architect feasibility check (via the coordinator): approach is a tilted plane on the existing board (tilt at most 35°, weak perspective, small relief), no new dependency, no ADR, same accessibility structure; the capability exists in all current browsers, so the fallback is a cheap check. Consequences: AC3 reworded (cells 24 px nominal, only the far row guaranteed at least 24 px on screen because perspective shrinks far rows; screenshot comparison within the same run, no committed reference images); AC7 stays; a full 3D scene with orbit camera is a possible later separate story (Out of scope). Open questions now empty; status ready. (product-owner)

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes. Must list the screenshot states for hak's gate 2 sign-off (Context)._

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
