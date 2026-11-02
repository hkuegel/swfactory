---
id: 008
title: Minesweeper 3D mode, switchable during play
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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
- **AC3:** Given the 3D view, when I look at the board, then it is visibly different from the 2D view and shows depth: the board is displayed tilted at a fixed angle of at most 35°, hidden and flagged cells appear raised and revealed cells appear lowered, the cells are 24 px nominal and the cells of the far row are at least 24 px wide on screen; and when I switch back to 2D, then the 2D view of 007 is shown unchanged. (Verified by screenshot comparison within the same test run: the 3D board differs from the 2D board, and the 2D board after switching back equals the 2D board before; no committed reference images.) (changed by [009](009-minesweeper-3d-visual-upgrade.md))
- **AC4:** Given the 3D view and a game in progress, when I reveal, flag and unflag cells and win or lose, then everything behaves as in [005/AC4–AC10](005-minesweeper.md) and [006/AC3–AC5](006-minesweeper-presets-timer.md) (including mouse, long-press and the keyboard keys: arrow keys, Enter or Space, F), and starting a new game with "Start" or a preset still works as in 005/AC2 and 006/AC2 in either view.
- **AC5:** Given the 3D view, when I use a screen reader or look at the page structure, then the board offers the same structure and names as in 2D (the board as a grid with its rows and cells, each cell with the same accessible name as in 2D, the same counter and result announcements), and the focused cell is visibly marked with an indicator of at least 2 px and 3:1 contrast in both colour schemes.
- **AC6:** Given I have set the system to reduce motion, when I switch the view, then the switch is immediate with no animation and the 3D view never moves by itself; and given normal motion settings, when I switch, then any transition lasts at most 300 ms and nothing in the 3D view loops or flashes. (changed by [009](009-minesweeper-3d-visual-upgrade.md))
- **AC7:** Given a browser that cannot show the 3D view, when I look at the view control, then "3D" is shown as unavailable together with a short text that says so, I can still choose and use "2D", and no error, blank board or broken page appears. (Verified by simulating a browser without the capability.) (changed by [009](009-minesweeper-3d-visual-upgrade.md))
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
- 2026-11-02 — Gate 2: sign off the look, keep the 3D focus ring at 2 px computed (about 1.7–1.9 px on screen) instead of 3 px, apply all three retro proposals, commit? No open manual checks. — A: "Ja, alles" (hak, gate 2). Consequence: look and focus ring accepted (AC5 read as computed width); proposals applied to `CLAUDE.md` and tester; status done. (orchestrator)

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

Scope: the "View" control and the 3D look of the board. Everything else (structure, copy, accessible names, tab order inside the board, live regions, rules, timer) of 005, 006 and 007 is **unchanged** in both views (AC4, AC5). "007 §n" refers to the UX design of [007](007-minesweeper-redesign.md); its tokens (`src/app/tokens.css`) are the base. The Technical design below this section is binding; where something does not work from a UX view this is said in section 12, not silently changed. All contrast values were computed by hand with the sRGB formula (no shell available); the tester should re-check them with a tool, and a failing pair is a defect in this design.

### 1. Principles

- 3D is a different look of the same board, not a different game: nothing is added to the board's markup or its accessible names.
- Depth is decoration and never the only cue. Every cell state keeps the shape cue of 007 §3.2 (lip, flatness, glyph, disc, ring, slash); relief only adds to it.
- Native controls only (radio inputs in labels). Colours, sizes and durations come from tokens; no component hard-codes a colour. Hover only inside `@media (hover: hover)`.
- Cells keep the 007 rule: only background, border, inset `box-shadow`, outline and SVG glyphs; no `filter`, `clip-path` or outer shadow on a cell, no layers (no `will-change`, no `translateZ`).
- Nothing moves by itself and the switch is instant (section 10).

### 2. Tokens

The architect's non-colour tokens (`--board3d-tilt` 25deg, `--board3d-depth`, `--board3d-top`, `--board3d-bottom`, `--board3d-side`, `--board3d-cell-min`, `--tile-lip-3d` 5px) are taken as they are (but see open point 3 on `--board3d-cell-min`). New tokens from this design, in `:root` and the dark block (the parity test of `tokens.test.ts` applies):

| Token                 | Light                                 | Dark                               | Use                                                                                           |
| --------------------- | ------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------- |
| `--cell-recess-light` | `#ffffff`                             | `#2f3642`                          | 1 px bottom edge of a lowered (revealed) cell in 3D; decoration (1.2:1 and 1.6:1 on its fill) |
| `--shadow-glyph-3d`   | `rgb(16 24 40 / 25%)`                 | `rgb(0 0 0 / 55%)`                 | ground ellipse under a flag or mine; composite, decoration only                               |
| `--shadow-board-3d`   | `0 6px 10px -2px rgb(16 24 40 / 30%)` | `0 6px 10px -2px rgb(0 0 0 / 60%)` | soft slab shadow under the near edge of the tilted grid; composite, decoration only           |
| `--glyph-lift-3d`     | `1px`                                 | (same)                             | how far a flag or mine glyph is lifted (size, not colour)                                     |
| `--recess-depth-3d`   | `2px`                                 | (same)                             | offset of the inner top shade of a lowered cell (size, not colour)                            |

Reused unchanged: `--cell-tile-fill`, `--cell-tile-hover`, `--cell-tile-pressed`, `--cell-tile-highlight`, `--cell-tile-lip`, `--cell-pressed-shade`, `--cell-revealed-fill`, `--cell-revealed-edge`, `--color-edge`, `--color-focus`, `--color-danger-solid`, `--color-danger-bg`, `--color-on-danger-solid`, `--color-text`, `--n1` to `--n8`; for the control `--color-surface`, `--color-edge`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-accent-subtle`, `--color-accent-subtle-press`, `--color-disabled-text`, `--control-height`, `--radius-control`, `--space-*`, `--text-sm`, `--text-base`.

### 3. The View control

#### 3.1 Markup refinement (the architect's contract holds; this adds detail)

`ViewToggle` renders one wrapper `<div class="view">` (the sibling above the status block, always mounted) containing:

- `<div role="radiogroup" aria-labelledby={labelId}>` with a visible `<span id={labelId}>View</span>` and `<div class="segments">` holding two `<label class="segment">`;
- each label: `<input type="radio" name={useId()}>` followed by `<span class="box"><svg aria-hidden="true" focusable="false">check mark</svg>2D</span>` (and `3D`); the check mark is always in the DOM and shown only for the checked option (CSS), so selecting does not shift the layout; the accessible names stay exactly "2D" and "3D";
- only when `available3d` is false: `<p id={unavailableId}>` as a **sibling after** the radiogroup (not inside it), referenced by `aria-describedby` on the "3D" input.

The input covers its segment: `position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: inherit`, the label is `position: relative`. Do not use `display: none`, `visibility: hidden` or the 1 px clipped hidden pattern: the whole segment must be the click target and Playwright `check()` has to find a visible, hit-testable input.

#### 3.2 Look

A segmented control: label "View" on the left, two joined segments on the right.

- **Label "View"**: `--text-sm`, weight 600, `--color-text-muted` (7.8:1 on the panel in light, 7.7:1 in dark), like the legends of 007 §4.2. Gap to the segments `--space-3`, vertically centred.
- **Segment (`.box`)**: height `--control-height` (44 px), min width 4rem (64 px), padding `0 var(--space-4)` (below 600 px `0 var(--space-3)`), `display: inline-flex; align-items: center; justify-content: center; gap: var(--space-1)`, `font: inherit` (`--text-base`, weight 500, the same weight in every state so selecting never reflows), 1 px `--color-edge` border, no fill (the panel shows through). First segment radius `--radius-control` on the left corners only, last on the right corners only; the second segment has `margin-left: -1px` so the shared edge is 1 px.
- **Check mark**: 16 px svg, stroke `currentColor` set to `--color-accent`, shown (`visibility: visible`) only on the checked segment, otherwise `visibility: hidden` but still taking its 16 px (no layout shift).
- Transitions: background and border colour over `--duration`, like the buttons of 007 §4.1.

#### 3.3 States of the control

| State                                         | 2D segment                                                                                                                                                          | 3D segment                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2D current (initial, AC8)                     | selected: fill `--color-accent-subtle-press`, 2 px `--color-accent` bottom border (the 1 px bottom edge grows, text stays), check mark visible, text `--color-text` | rest: no fill, 1 px `--color-edge`, text `--color-text`, check hidden                                                                                              |
| 3D current                                    | rest                                                                                                                                                                | selected                                                                                                                                                           |
| Hover (not selected, `@media (hover: hover)`) | fill `--color-accent-subtle`, `cursor: pointer`                                                                                                                     | same                                                                                                                                                               |
| Hover on selected                             | no change, `cursor: default`                                                                                                                                        | no change                                                                                                                                                          |
| Pressed (not selected)                        | fill `--color-accent-subtle-press`                                                                                                                                  | same                                                                                                                                                               |
| Keyboard focus                                | ring drawn on the `.box` of the focused radio, see below                                                                                                            | same                                                                                                                                                               |
| 3D unavailable (AC7)                          | selected and operable as above                                                                                                                                      | `input:disabled`: no fill, 1 px `--color-border`, text `--color-disabled-text`, check hidden, `cursor: not-allowed`, no hover; the unavailable text is shown (3.5) |
| Loading, empty, error                         | none: the control is static and always shown                                                                                                                        | none                                                                                                                                                               |

"Selected" is told apart by three cues, none of them colour alone: the check mark, the fill and the thicker bottom border. In every state (before the first "Start", running, won, lost) the control looks and works the same; it is never disabled by game state.

Focus ring: the input is invisible (opacity 0) and its own outline would be invisible too, so `input:focus-visible { outline: none }` and the ring is drawn on the sibling `.box` with the global values of 007 §4.6: `outline: 2px solid var(--color-focus); outline-offset: 2px`, and the focused segment gets `position: relative; z-index: 1` so the ring is not covered by the neighbour. In forced colours the ring is `Highlight`. This replaces, not removes, the global ring.

#### 3.4 Placement and responsive behaviour

DOM order is binding (toggle, then status). Visually the control is one row directly above the status block, left-aligned in the 40 rem column: `.view { margin-top: var(--space-5) }`, the row is `display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-3)`. Before the first "Start" it sits between the setup form and the empty text; with a game it sits between the form and the status divider. No change to the status block's own spacing (24 px margin, divider, 16 px padding), so the gap between the control and the divider is 24 px.

| Width | Layout                                                                                                                                                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 320   | content column 288 px; one row: label about 34 px, gap 12, two segments of 66 px (padding 12) = about 178 px, left-aligned; the unavailable text (if shown) wraps under it, about 230 px wide on one line; nothing is wider than 288 |
| 375   | same as 320, column 343 px                                                                                                                                                                                                           |
| 800   | same row, left-aligned in the 40 rem column, segments 74 px each (padding 16) = about 148 px, row about 194 px                                                                                                                       |

At 200 % zoom at 320 px (160 CSS px) the label and the segments may wrap onto two lines (`flex-wrap: wrap` on the row and on `.segments`); the segments keep 44 px height; the unavailable text wraps (`overflow-wrap: anywhere`). Touch targets are 44 px high and at least 64 px (66 px) wide, above the 24 px minimum (WCAG 2.5.8).

"Next to the status bar" (AC1) is met as "the row directly above it, in the same column": the architect fixed the DOM order (toggle above status) and a same-row layout would need a wrapper around both. See open point 7.

#### 3.5 Copy of the control

| Element                         | Exact text                             |
| ------------------------------- | -------------------------------------- |
| Group label (visible)           | `View`                                 |
| Options                         | `2D`, `3D`                             |
| Unavailable text (visible, `p`) | `3D is not available in this browser.` |

Nothing else: no tooltip, no confirmation, no announcement text. The unavailable text is `--text-sm`, `--color-text-muted` (7.8:1 and 7.7:1), `margin: var(--space-2) 0 0`, no icon and no box (a hint like those of 007 §4.2); it is static page content, not a live region. Test queries must use roles (`getByRole('radio', { name: '3D' })`) or the exact full text: `getByText('3D')` in non-exact mode would also match the unavailable text (it cannot be reworded without losing the word "3D").

### 4. The 3D board

Geometry (from the Technical design): the grid is tilted back by 25° (top edge away from the viewer) with weak perspective; the far (top) row is about 0.96 and the near (bottom) row about 1.04 of the flat size. Light comes from above in both views: raised things have a highlight at the top and a lip at the bottom, which also matches the tilt (the viewer sees the front faces).

#### 4.1 The seven cell states in 3D

Cell surfaces are 007's. 3D changes only what is listed in "3D addition". Light / dark values.

| State                             | Surface (light / dark)                                                                                                 | 3D addition                                                                                                                                                                                              | Shape cue that stays                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Hidden                            | fill `#f7f8fa` / `#343a45`, 1 px edge `#737c8b` / `#8b94a3`, top highlight `#ffffff` / `#4a515d`                       | bottom lip 5 px (`--tile-lip-3d`) in `#c3cad6` / `#1c2028` instead of 3 px                                                                                                                               | raised tile, thick lip                     |
| Flagged                           | as hidden; flag `#b3261e` / `#f28b82`, pole and base `--color-text`                                                    | as hidden, plus: glyph lifted 1 px (`--glyph-lift-3d`) and a ground ellipse under the pole foot (4.2)                                                                                                    | raised tile with a flag (triangle on pole) |
| Revealed empty                    | fill `#e5e9ef` / `#0e1014`, hairline `#cfd5de` / `#232831`                                                             | lowered: inner top shade `inset 0 var(--recess-depth-3d) 3px var(--cell-pressed-shade)` (`#b9c1ce` / `#0a0c10`) and a 1 px bottom edge `inset 0 -1px 0 var(--cell-recess-light)` (`#ffffff` / `#2f3642`) | flat, no lip                               |
| Revealed number                   | as revealed empty, digit colour per 007 §2.1 (4.8:1 or more light, 7.6:1 or more dark)                                 | as revealed empty; the digit is not shifted or shadowed                                                                                                                                                  | flat, the digit                            |
| Mine (after a loss)               | as revealed empty, mine glyph `--color-text`                                                                           | as revealed empty, plus glyph lifted 1 px and a centred ground ellipse (4.2)                                                                                                                             | flat, mine glyph (circle with 8 spikes)    |
| Exploded mine                     | fill `#fdecea` / `#3a1b1a`, 2 px border `#b3261e` / `#f28b82`, disc `#b3261e` / `#f28b82`, glyph `#ffffff` / `#1b1f24` | the same lowered inner top shade as the revealed cells; no glyph lift, no ground ellipse (the disc is its own object and must stay exactly as in 007)                                                    | thick ring, solid disc behind the mine     |
| Wrong flag                        | as revealed empty, flag and slash as in 007                                                                            | as revealed empty; no lift, no ground ellipse (a flat marker of an error)                                                                                                                                | flat, flag with a diagonal slash           |
| Pressed (long press or `:active`) | `--cell-tile-pressed` `#e9edf3` / `#2a2f38`                                                                            | as in 2D: no lip, inset `0 2px 4px --cell-pressed-shade`; the 3D lip rule must not win over it                                                                                                           | tile pushed in                             |
| Hover (running game)              | tile fill `--cell-tile-hover` `#ffffff` / `#3f4652`                                                                    | as in 2D, only inside `@media (hover: hover)`                                                                                                                                                            | unchanged                                  |

In dark mode the revealed cells are almost the colour of the well, so the inner top shade is nearly invisible there (1.1:1); the lowered look comes from the light bottom edge `#2f3642` (1.6:1) and from the contrast to the raised tiles. That is intended: the cue is shape (lip, flatness, glyph), not shading.

Distinguishable by shape when tilted: the smallest on-screen glyph is 70 % of 28 px = 19.6 px wide and about 17 px high in the far row (cos 25° times 0.96); the flag triangle, the 8 mine spikes, the 2.5 px slash (about 2 px) and the exploded disc (about 18 by 16 px, a slightly flattened circle) stay recognisable at that size. Hidden, flagged and revealed are separated by lip, edge and glyph; mine, exploded mine and wrong flag by spikes, disc plus ring, and slash.

#### 4.2 Relief recipe (CSS only, no new markup)

- **Raised tiles** (`.hidden`, `.flagged`): the 007 shadow with `--tile-lip-3d` instead of `--tile-lip`.
- **Lowered cells** (`.empty`, `.number`, `.mine`, `.mineExploded`, `.flagWrong`): `box-shadow: inset 0 var(--recess-depth-3d) 3px var(--cell-pressed-shade), inset 0 -1px 0 var(--cell-recess-light)`. These are inset shadows only.
- **Flag and mine objects**: `.flagged .glyph, .mine .glyph { transform: translateY(calc(-1 * var(--glyph-lift-3d))) }` plus a ground ellipse as `::before` of the cell (a pseudo-element with a plain `background-color: var(--shadow-glyph-3d)`, not a `filter` and not a `box-shadow`): cell `position: relative`, glyph `position: relative` so it paints above the ellipse, ellipse `position: absolute; border-radius: 50%; height: 3px; pointer-events: none`. Flag: `left: 22%; width: 34%; bottom: calc(var(--tile-lip-3d) + 3px)` (under the pole foot, above the lip). Mine: `left: 27%; width: 46%; bottom: 12%` (under the body). Values may be nudged by up to 2 px by eye at the gate-2 screenshots. A `filter: drop-shadow` on 700 glyphs would create one offscreen surface per glyph, which is why the pseudo-element is used (open point 4).
- **Slab shadow**: `box-shadow: var(--shadow-board-3d)` on `.grid` in 3D (not on a cell, not on the scroller, open point 2). It only shows as a soft darker edge below the near row inside the well; no AC depends on it.
- No shading or shift on digits; no change of cell size, gap or radius.

#### 4.3 Focus

Unchanged from 007: `outline: 2px solid var(--color-focus); outline-offset: -2px` on the focused cell, inside the cell, so it follows the tilt and is never clipped; the 3D block must not touch `outline`, `overflow`, `clip-path` or `filter` on `.cell` (AC5). Contrast of the ring: against the raised tile 6.3:1 light / 6.7:1 dark, against the 5 px lip `#c3cad6` 4.1:1 and `#1c2028` 9.5:1, against the revealed fill 5.5:1 and 11.1:1, all at least 3:1. The ring is 2 px wide; after the tilt it is still at least 1.9 px (cos 25° times 0.96 times 2 px is 1.74 px on the top and bottom edges of the far row and 1.92 px on the side edges). That is below the nominal 2 px only through the perspective of the whole plane; the specified width stays 2 px and the AC5 test measures the computed style (open point 6).

#### 4.4 Forced colours (Windows high contrast), 3D

Forced colours drop shadows, so relief disappears; the shapes remain through 007 §8:

- Hidden and flagged: `forced-color-adjust: none`, `ButtonFace` fill, 2 px `ButtonText` border, `inset 0 -3px 0 ButtonText` lip (3 px also in 3D, so the two views look the same here and the perspective supplies the depth).
- Revealed cells: automatic adjustment, 1 px `GrayText` border, no lip; box-shadows are dropped by the browser.
- Exploded mine: 3 px `CanvasText` border, `CanvasText` disc, `Canvas` glyph.
- Ground ellipse: `display: none`. Slab shadow: dropped by the browser. Glyph lift stays (harmless).
- Focus ring: `Highlight`, 2 px, offset -2 px.
- Specificity: the 3D selectors (`.scroller[data-view='3d'] .hidden`, 3 parts) beat the single-class rules of the forced-colours block even though that block comes later. Write the 3D selectors with `:where()` around the scroller part (`:where(.scroller[data-view='3d']) .hidden`, specificity of one class) so the order "3D block before the forced-colours block" really makes the forced-colours rules win. See open point 1.

#### 4.5 Contrast values that matter in 3D (hand-computed)

| Pair                                                       | Light                                                       | Dark             | Rule               |
| ---------------------------------------------------------- | ----------------------------------------------------------- | ---------------- | ------------------ |
| Digits, flag, glyphs on their fill                         | as 007 §2.2 (4.8:1 or more / 7.6:1 or more; flag 6.2 / 4.8) |                  | text 4.5, glyph 3  |
| Tile edge `--color-edge` on well (unchanged)               | 3.5                                                         | 6.2              | 3:1                |
| Focus ring on tile / lip / revealed fill                   | 6.3 / 4.1 / 5.5                                             | 6.7 / 9.5 / 11.1 | 3:1                |
| Lip, inner shade, bottom edge, ground ellipse, slab shadow | decoration, no requirement                                  |                  | never the sole cue |

### 5. States per view

| View / element     | State                                        | What the user sees and can do                                                                                                    |
| ------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| View control       | initial (also after reload and sign-in, AC8) | "2D" selected; both options operable; one tab stop                                                                               |
| View control       | "3D" unavailable (AC7)                       | "3D" dimmed and disabled, text "3D is not available in this browser." below; "2D" selected and operable; no error, nothing blank |
| Game, before Start | 2D or 3D                                     | setup, View control, empty text; no board; choosing 3D changes nothing visible yet and applies to the first board                |
| Game, running      | 3D                                           | tilted board with relief, chips, no result callout; everything as in 2D                                                          |
| Game, won          | 3D                                           | success callout, frozen timer, board read-only (no hover, no pointer cursor); tiles unchanged                                    |
| Game, lost         | 3D                                           | danger callout, mines (lifted, with ground ellipse), exploded cell, wrong flags, read-only board                                 |
| Any                | switch view                                  | immediate; same cells, numbers, flags, counter, timer, result; scroll position clamped by the browser; focus stays on the radio  |
| Disabled           | none other than 3D unavailable               | the View control is never disabled by game state                                                                                 |

There is no loading or error state (no network).

### 6. Interactions

- **Mouse and touch**: a click or tap on a segment selects it at once (no confirmation, no animation of the board). Tapping the already selected segment does nothing.
- **Keyboard**: Tab reaches the checked radio (one stop for the group); ArrowRight, ArrowDown, ArrowLeft, ArrowUp move to the other option and select it immediately (native radio behaviour, wraps); Space selects the focused one. The disabled "3D" is skipped; ArrowRight on "2D" then does nothing. Tab order: ... "Start", the View radio, the board's active cell (the status block has no tab stops). Shift+Tab reverses.
- **Validation**: none (there are two fixed options).
- **Focus after a switch**: stays on the radio that was operated; nothing moves focus to the board. The board's roving tabindex and the focused cell are untouched. With the mouse the radio takes focus but shows no ring (`:focus-visible`).
- **Board input in 3D**: identical to 2D (arrow keys, Enter or Space, F, right-click, long press); a drag scrolls the well and never rotates.
- **Reload and sign-out** reset to 2D (AC8); there is no storage and nothing to explain on screen.

### 7. Copy

All texts of 005, 006 and 007 stay as they are, including the cell names ("Row 3, column 4, hidden") and the result messages. New texts: `View`, `2D`, `3D` and `3D is not available in this browser.` (3.5). No new announcement text, no new error text, no empty text change.

### 8. Accessibility

- **Semantics**: native `input type="radio"` inside `label`, `role="radiogroup"` named by the visible "View" (`aria-labelledby`), accessible names exactly "2D" and "3D" (the check-mark svg is `aria-hidden`, so it does not enter the name). Unavailable: the "3D" input is `disabled` and `aria-describedby` points to the visible text; a disabled radio is not focusable, which is why the text is always visible and not in a tooltip. The board keeps its grid, rows, cells, `aria-label`s, `aria-rowcount`, `aria-colcount` and `aria-readonly`; the screen reader gets the same grid in both views (AC5).
- **Announcements, decision: none for the switch.** The radio that has focus announces its own change ("3D, radio button, selected, 2 of 2"); the board's names do not change, so there is nothing else to say. A live region such as "3D view on" would be read twice. This satisfies the team rule "every state change without focus movement needs a live announcement" because the state change happens on the focused native control. The existing live regions (counter, result, "New game: …") are not touched and the timer stays plain text outside every live region.
- **Keyboard flow**: section 6; every control operable by keyboard; the view can be switched in the middle of a game by Shift+Tab from the board, switching, Tab back (the focused cell is still the active cell).
- **Focus visibility**: control 2 px `--color-focus` ring, offset 2 px, 6.7:1 (light) and 9.6:1 (dark) on the panel; cells as in 4.3.
- **Colour contrast** (WCAG 2.2 AA): table 9.2; every text at 4.5:1 or more, every meaningful non-text element at 3:1 or more; the one tight value (3.2:1, light, edge on the selected fill) is not the only cue of that edge, because the 2 px accent bottom border (5.1:1) and the check mark carry the selection.
- **Target size**: segments 44 px high and at least 64 px wide; cells at least 24 px wide on screen in the far row (AC3) and, with 2 px gaps, the spacing exception of WCAG 2.5.8 covers cells that are slightly under 24 px high on screen.
- **Motion**: nothing moves by itself; no flashing (section 10). No vestibular trigger: the tilt is static and small.
- **Zoom and text size**: all control sizes are in px for the box but text in `rem`; at 200 % zoom the row wraps (3.4).

#### 8.1 Control contrast table (hand-computed, WCAG relative luminance)

| Pair                                                                    | Light | Dark | Rule   |
| ----------------------------------------------------------------------- | ----- | ---- | ------ |
| Label "View" `--color-text-muted` on the panel                          | 7.8   | 7.7  | 4.5    |
| Segment text `--color-text` on the panel (rest)                         | 16.6  | 13.7 | 4.5    |
| Segment text on the selected fill `--color-accent-subtle-press`         | 12.6  | 9.7  | 4.5    |
| Segment text on the hover fill `--color-accent-subtle`                  | 14.3  | 11.7 | 4.5    |
| Segment border `--color-edge` on the panel                              | 4.2   | 5.4  | 3      |
| Segment border `--color-edge` on the selected fill (tight in light)     | 3.2   | 3.8  | 3      |
| Segment border `--color-edge` on the hover fill                         | 3.7   | 4.6  | 3      |
| Check mark and 2 px bottom border `--color-accent` on the selected fill | 5.1   | 6.8  | 3      |
| Focus ring `--color-focus` on the panel                                 | 6.7   | 9.6  | 3      |
| Unavailable text `--color-text-muted` on the panel                      | 7.8   | 7.7  | 4.5    |
| Disabled "3D" text `--color-disabled-text` (exempt, inactive control)   | n/a   | n/a  | exempt |

The accent text colour is not used for the segment label (text stays `--color-text`) so no tinted-text contrast has to be hunted for.

#### 8.2 Forced colours, control

Segments: 1 px `ButtonText` border; selected: check mark in `ButtonText` plus a 3 px `Highlight` bottom border (the fill is dropped, the check mark and the border thickness remain as cues); disabled "3D": `GrayText` text and border; focus ring `Highlight`. No `forced-color-adjust: none` on the control.

### 9. Responsive behaviour (below 600 px)

- **Control**: segment padding `0 var(--space-3)`; layout as in 3.4; unchanged otherwise.
- **Board at 800 px**: cell 32 px (as 2D); a 9 by 9 board is about 304 px wide, centred in the well; 16 by 30 and 30 by 30 scroll sideways inside the well, the page does not.
- **Board at 375 px**: cell = fluid formula of the Technical design with the floor `--board3d-cell-min`; a 9 by 9 board gets about 33.5 px cells (2D: 35.2 px) and fits without scrolling (grid 317 px plus margins 15 px = 332 px of 333 px); 16 by 16, 16 by 30 and 30 by 30 sit on the floor and scroll inside the well, with the last cell reachable and its focus ring not clipped.
- **Board at 320 px**: see open point 3: with a 28 px floor a 9 by 9 board overflows by about 2 px (grid 268 px plus margins 12 px = 280 px of 278 px).
- The well keeps `overflow: auto`; a drag scrolls it; there is no horizontal page scroll in either view.

### 10. Motion and reduced motion

- The view switch is **instant** in both motion settings: no transition on `transform` or on any layout property, and no animated tilt (the margins would animate the layout of 900 cells every frame). From a UX view this is acceptable: the control state changes at once and the board jumps to the other look; an animated tilt is not needed for the gate-1 request.
- The only motion left is the 120 ms (`--duration`) fade of cell background and shadow of 007, which is within the 300 ms limit of AC6 and also runs when a switch changes the shadows of the cells; it becomes 0 s under `prefers-reduced-motion: reduce` (token and the global safety net of ADR 0004). Never wait for `transitionend`.
- Nothing in 3D loops, pulses, floats or parallaxes; no hover tilt; pressed tiles do not translate.
- Reduced motion: no difference in what is shown, only that the 120 ms fade is 0 s, so the switch is immediate with no animation (AC6).

### 11. Dark mode summary

Every new element has both values: the control uses existing tokens only (their light and dark values are in 8.1 and in 007 §2); the board uses 007's cell tokens plus `--cell-recess-light`, `--shadow-glyph-3d` and `--shadow-board-3d` (section 2, light and dark). Visually hidden text has no colour. The unavailable text and the label use `--color-text-muted`. Both schemes follow `prefers-color-scheme` only.

### 12. Open points for the architect and the product owner

1. **Forced colours versus specificity (architect).** The Technical design says the 3D block is placed before the forced-colours block "so the existing forced-colours rules keep winning". They do not: `.scroller[data-view='3d'] .hidden` has higher specificity than `.hidden`, so the 3D lip and shadows would win in forced colours. Fix: write the 3D selectors with `:where()` around the scroller part (4.4), or repeat the forced-colours rules with the 3D selector.
2. **Slab shadow target (architect).** The Technical design puts `--shadow-board-3d` on the scroller; an outer shadow there falls outside the well, not under the board. This design puts it on `.grid` (3D only). Same cost, no layer, not on a cell.
3. **320 px, 9 by 9 board (architect).** With `--board3d-cell-min: 28px` the default board overflows the well by about 2 px at 320 px (2D fits at 24.6 px cells). AC3 needs the far row at least 24 px **wide**, which allows a floor of 25.1 px. Proposal: `--board3d-cell-min: 26px` (far row 24.9 px wide; 26 by cos 25° by 0.96 is 22.6 px high, covered by the 2.5.8 spacing exception since the pitch is about 24.4 px, above 24 px) so that 9 by 9 fits at 320 px (grid 250 px plus margins 11 px = 261 px of 278 px). The e2e check "no horizontal overflow of the default board" should then also run at 320 px. If the architect keeps 28 px, a 2 px sideways scroll at 320 px is accepted by UX but hak should see it in the 320 px screenshot.
4. **Glyph shadow (architect).** The Technical design suggests a drop shadow on `.glyph`. This design avoids `filter` and uses a `::before` ellipse on flagged and mine cells (4.2). It needs `position: relative` on `.cell` in 3D and a `::before` rule; it does not touch the markup, `outline`, `overflow` or `clip-path` of the cell.
5. **ViewToggle markup (architect).** One wrapper `div` around the radiogroup and the unavailable `p` (the `p` is not inside the radiogroup), the "View" label as a `span` inside the radiogroup, and the radio input as a transparent overlay (3.1). The contract's names, DOM position and "no live region" are kept.
6. **Focus ring width on screen (tester).** The 2 px ring becomes about 1.7 to 1.9 px on screen at the far row and edges because of the tilt; AC5's "at least 2 px" should be tested on the computed style, which the architect's AC5 test already does. Product owner: no AC change proposed.
7. **"Next to the status bar" (product owner).** Met as "directly above the status block, same column", because the DOM order is fixed. If hak wants the control in the same row as the counter and timer chips, the architect must wrap them in one container (a DOM change); tell the UX designer.
8. **New tokens and checks (architect).** Add `--cell-recess-light`, `--shadow-glyph-3d`, `--glyph-lift-3d`, `--recess-depth-3d` (section 2) to `tokens.css` and the parity test; `--cell-recess-light` is a decoration colour, not contrast-tested.
9. **Copy collision.** The unavailable text contains "3D", so non-exact text queries for "3D" match two elements; tests must use the radio role (the Technical design does).

### 13. Screenshot states for hak's gate 2

Taken in light and dark unless noted, at 800 px width unless noted, 9 by 9 with a fixed mine layout, and each next to the same state in 2D where it helps (AC3 also compares them):

1. View control close-up: "2D" selected, "3D" selected, "3D" focused by keyboard (light and dark).
2. Signed in before the first "Start" with the View control (2D selected) between the setup and the empty text.
3. 3D, game in progress: revealed numbers 1 to 8, empty revealed cells, flags, hidden tiles, the focus ring on one cell.
4. 3D, lost game: mines, exploded mine, wrong flag, danger callout.
5. 3D, won game: success callout, frozen timer.
6. The same running board in 2D and 3D, side by side (one light, one dark), so the difference is visible.
7. 3D at 375 px: 9 by 9 in progress (no scroll), and 16 by 30 (scrolls inside the well), light and dark.
8. 3D at 320 px: 9 by 9 (checks open point 3).
9. 30 by 30 in 3D: at 800 px and at 375 px with the well scrolled to the last cell, focus ring on it (reachable and not clipped).
10. Forced colours (emulated) of a lost 3D game and of the View control, so shapes can be judged without colour (evidence, not a sign-off item).
11. Unavailable state: View control with disabled "3D" and the text, at 375 px and 800 px, light and dark.
12. Reduced motion and the instant switch are verified by the AC6 test, no screenshot.

### 14. Relation to the 007 design

Nothing in 007 is superseded. Used or extended: 007 §9 (selected option with `--color-accent-subtle-press` fill, 2 px accent bottom border and check mark, as built here from native radios because the shared `Button` is a `button`, not a radio), 007 §3.2 (cell states, extended by 4.1) and §8 (forced colours, extended by 4.4). One allowed addition to the cell rule "no outer shadow, filter or clip-path": a `::before` ground ellipse on 3D flagged and mine cells, which is a background, not a shadow or filter.

## Technical design

_architect, 2026-11-02. Consequences of the gate-1 feasibility check (Decision log) are worked out here. No new dependency, no ADR: everything is cheap to reverse (one presentation prop, one CSS block, one component)._

### Approach in one paragraph

3D is a **presentation state** of the existing board: `Minesweeper.tsx` owns `view: '2d' | '3d'` in a `useState` next to `values`/`errors` (not in `gameReducer`, because it is not game state), and passes it to `Board` as a prop. `Board` only writes `data-view` on its scroller; the 3D look is pure CSS on the **same DOM** (`.grid` gets `transform: perspective(…) rotateX(…)`). No element is added, removed or re-keyed on a switch, so the grid, its focus, `useBoardInput` state and every `Cell` (memoised, not receiving the view) stay as they are. The timer lives in `GameStatus`/`Timer` from `game.startedAt`/`endedAt` and is not touched at all.

Why the transform sits on `.grid` and not on a wrapper or the scroller: `.scroller` has `overflow: auto`, which flattens `preserve-3d` and would clip a transformed child's perspective; putting `perspective()` **inside the grid's own `transform`** needs no `perspective` property on an ancestor and no `preserve-3d` anywhere, and makes the grid's own centre the vanishing point. Relief comes from shadows inside the plane (see "3D look"); no per-cell `translateZ`, no `will-change`, no `preserve-3d` (900 composited layers would be the cost).

### Files

New:

- `src/features/minesweeper/logic/boardView.ts` — `BoardView` type and `supports3dView()` capability check (pure, unit-tested).
- `src/features/minesweeper/ViewToggle.tsx` + `ViewToggle.module.css` — the "View" radio group (contract below). UX styles it; the markup contract is fixed here.
- `src/features/minesweeper/logic/boardView.test.ts` — unit test of `supports3dView()`.
- `e2e/minesweeper-3d.spec.ts` — the 008 e2e specs (below).

Changed:

- `src/features/minesweeper/Minesweeper.tsx` — `view` state, `available3d` (computed once per mount), renders `<ViewToggle>` always mounted, passes `view` to `Board`.
- `src/features/minesweeper/Board.tsx` — new prop `view`; `data-view={view}` on `.scroller`; `--rows` next to `--cols` in the inline grid style. Nothing else (no conditional markup, `Cell` gets no new prop).
- `src/features/minesweeper/Board.module.css` — the `[data-view='3d']` block (transform, compensation margins, phone cell size, relief). Every selector that restyles a cell is written with the scroller part inside `:where()` (`:where(.scroller[data-view='3d']) .hidden`, specificity of one class, same as the 2D rule) and the block comes **before** the `forced-colors` block, so the existing forced-colours rules (and the 2D `:hover`/`:active`/`.pressed` rules, which are more specific) really win (UX §12 point 1). Only the grid-level rule (`transform`, margins, `--cell`) uses the plain `.scroller[data-view='3d'] .grid` selector, since forced colours do not touch it.
- `src/app/tokens.css` — the 3D tokens (below), in `:root`; the colour tokens (`--shadow-board-3d`, `--shadow-glyph-3d`, `--cell-recess-light`) also in the dark block, plus the sizes `--glyph-lift-3d` and `--recess-depth-3d` (UX §2).
- `src/app/tokens.test.ts` — one extra test: the 3D compensation tokens match tilt and depth, and the tilt is at most 35° (below).
- `playwright.config.ts` and `e2e/minesweeper.spec.ts` — second project and one `beforeEach` line for AC4 (below). Config is a tester/devops change.
- `scripts/check-dist.mjs` — **no change**: nothing here is dev-only.

### Types and contracts

```ts
// logic/boardView.ts
export type BoardView = '2d' | '3d';

/** Cheap capability check: a transform with perspective() and rotateX(). Evaluated at mount. */
export function supports3dView(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('transform', 'perspective(100px) rotateX(10deg)')
  );
}
```

```ts
// Board.tsx
export interface BoardProps {
  readonly game: GameState;
  readonly view: BoardView; // new; the only change to the props
  readonly onReveal: (index: number) => void;
  readonly onToggleFlag: (index: number) => void;
}

// ViewToggle.tsx
export interface ViewToggleProps {
  readonly view: BoardView;
  readonly onChange: (view: BoardView) => void;
  /** false: the "3D" option is disabled and the unavailable text is shown (AC7). */
  readonly available3d: boolean;
}
```

```tsx
// Minesweeper.tsx (sketch)
const [view, setView] = useState<BoardView>('2d'); // AC8: not persisted, so a reload or an unmount (sign-out) resets it
const [available3d] = useState(supports3dView); // lazy initial value: read once per mount, never at module load
// …inside .column, after the live region, BEFORE the game === null ? … : <GameStatus/> switch:
<ViewToggle view={view} onChange={setView} available3d={available3d} />
// …
<Board key={game.id} game={game} view={view} onReveal={…} onToggleFlag={…} />
```

**ViewToggle markup contract (for the UX design):**

- Always mounted by `Minesweeper`, a sibling directly **above** the status block, inside `.column` (so it exists before the first "Start", during and after a game, AC1) and **not** inside the `game === null` conditional; it must never be unmounted or moved in the DOM tree when the game appears (a stable DOM position keeps focus and avoids layout jumps). UX may lay it out beside the status chips with CSS as long as the DOM order stays: toggle, then status.
- Markup as refined in UX §3.1 (accepted): one wrapper `<div>` (the sibling above the status block) containing `<div role="radiogroup" aria-labelledby={labelId}>` with a visible `<span id={labelId}>View</span>` and two `<label>` elements, each with `<input type="radio" name={useId()}>` followed by a `<span>` holding an `aria-hidden` check-mark svg and the text "2D" or "3D". The unavailable `<p>` is a sibling **after** the radiogroup (not inside it). Accessible names are exactly "2D" and "3D" (e2e uses `getByRole('radio', { name: '3D' })`). Native inputs because they give Tab (one stop = the checked radio), arrow keys (move and select), Space, mouse and touch for free; UX styles them as a segmented control: the input is a transparent overlay covering its segment (`position: absolute; inset: 0; opacity: 0`, never `display: none`/`visibility: hidden`/clipped, so the whole segment is the click target and Playwright `check()` finds a hit-testable input); the ring is drawn on the sibling box via `input:focus-visible + span`. The segment is at least 44 px high like the other controls.
- Selecting is immediate (`onChange` → `setView`); there is no confirmation, the board is not remounted, focus stays on the radio.
- Unavailable (AC7): the "3D" input is `disabled`, a visible `<p id>` with the short text (UX writes the exact copy, e2e matches the text the UX design specifies) is linked via `aria-describedby` on the "3D" input. "2D" is checked and stays operable. The text is visible without focusing anything, because a disabled radio cannot be focused.
- No live region for the switch itself: the change of the checked radio is announced by the screen reader on the control; the board's names do not change (AC5).

### Data flow and state ownership

| State                               | Owner                         | Notes                                                     |
| ----------------------------------- | ----------------------------- | --------------------------------------------------------- |
| `view`                              | `Minesweeper` `useState`      | presentation, outside the reducer; `'2d'` initially (AC8) |
| `available3d`                       | `Minesweeper` lazy `useState` | read once at mount via `supports3dView()`                 |
| game, counter, timer, result, focus | unchanged (005/006)           | a view switch touches none of them                        |
| tilt, relief, cell size in 3D       | CSS only (`data-view`)        | derived from the prop, no JS geometry                     |

- **AC2 (no state loss, timer unaffected):** the switch changes one prop. `Board` keeps `key={game.id}`, so it is not remounted; the grid element, `activeIndex` and the cells' state are untouched; `Cell` is `memo` and receives no view prop, so a switch re-renders `Board` but **no cell**. `GameStatus`/`Timer` do not receive the view; `useElapsedSeconds` keeps ticking from `startedAt` (and stays frozen from `endedAt`). Nothing can reset or jump because nothing is recreated.
- **AC8 (reset to 2D):** `view` is plain component state with no storage of any kind. A reload re-initialises it; `App` renders `<Minesweeper />` only while `status === 'signedIn'`, so sign-out unmounts it and the next sign-in mounts a fresh one (initial `'2d'`). Nothing to build besides "do not persist"; the e2e test guards it.
- **AC5 (same a11y tree, focus ring not clipped):** `Board.tsx` renders identical markup in both views (only `data-view` on a generic wrapper differs). Roles, `aria-rowcount/colcount`, `aria-readonly`, cell names and the roving tabindex come from the same code. The focus ring is `.cell:focus-visible { outline: var(--focus-width) solid …; outline-offset: -2px }` (inside the cell, 007): the 3D block must not override `outline`, `overflow`, `clip-path` or `filter` on `.cell`. Clipping can then only come from the scroller, which is what the compensation margins prevent (next section).
- **Hit testing, long press, keys:** all input is delegated on the grid through `event.target.closest('[data-index]')` and `clientX/Y` distances (`useBoardInput`); the browser hit-tests transformed boxes, so no change. A drag on the board scrolls the scroller exactly as in 2D (`touch-action: manipulation` is kept); nothing rotates.

### 3D look (CSS, `Board.module.css`)

All numbers live in `tokens.css`; the rules read them. Constants are derived for a grid transformed about its centre with `transform: perspective(P) rotateX(θ)`, `P = k · H` (`H` = grid height; so the far/near scale is the same for every board size). With `θ = 25°`, `k = 5`: far-row scale `s_f = k / (k + sin θ / 2) = 0.959`, near-row scale `s_n = k / (k − sin θ / 2) = 1.044`; projected top edge `(cos θ / 2) · s_f · H = 0.4348 H` above the grid centre, bottom edge `0.4732 H` below it.

```css
/* tokens.css, :root (non-colour, same in light and dark) */
--board3d-tilt: 25deg; /* at most 35deg (tokens.test.ts) */
--board3d-depth: 5; /* perspective distance as a multiple of the grid height */
--board3d-top: -0.0652; /* margin-top  = (cos θ / 2) · s_f − 0.5, times grid height */
--board3d-bottom: -0.0268; /* margin-bottom = (cos θ / 2) · s_n − 0.5, times grid height */
--board3d-side: 0.023; /* margin-inline = at least (s_n − 1) / 2, times grid width */
--board3d-cell-min: 26px; /* phone floor in 3D, see AC3 below */
--tile-lip-3d: 5px; /* thicker lip of raised tiles (2D: --tile-lip 3px) */
/* colour token, light + dark: --shadow-board-3d (soft slab shadow under the tilted board) */
```

```css
/* Board.module.css, sketch (after the 2D rules, before @media (forced-colors)) */
.scroller[data-view='3d'] .grid {
  --grid-h: calc(var(--rows) * var(--cell) + (var(--rows) - 1) * var(--cell-gap));
  --grid-w: calc(var(--cols) * var(--cell) + (var(--cols) - 1) * var(--cell-gap));
  transform: perspective(calc(var(--grid-h) * var(--board3d-depth))) rotateX(var(--board3d-tilt));
  transform-origin: 50% 50%;
  margin: calc(var(--grid-h) * var(--board3d-top)) calc(var(--grid-w) * var(--board3d-side))
    calc(var(--grid-h) * var(--board3d-bottom));
}
```

- **Compensating the transformed box:** a transform does not change layout and only the _transformed_ bounds count as scrollable overflow, and overflow to the left/top is unreachable. Without compensation the board would show a band of empty space above and below (the tilted plane is only 0.908 H tall) and the near row would stick out 2.2 % of the width beyond each side, clipped on the left. The negative top/bottom margins shrink the scroller's content height to the projected height; the positive side margins give the near row room. **Do not rely on the numbers: verify by measuring** (e2e AC3 below), then adjust the tokens; `tokens.test.ts` keeps them consistent with tilt and depth.
- **Phone cell size (AC3):** the 2D rule `--cell: clamp(24px, (100vw − chrome − gaps) / cols, 40px)` (below 600 px) is overridden for `[data-view='3d']` by `clamp(var(--board3d-cell-min), calc((100vw − var(--board-chrome) − (var(--cols) − 1) · var(--cell-gap)) / var(--cols) / 1.05), 40px)`. The `/ 1.05` is `1 + 2 · side` (the margins added by the compensation, same lesson as the panel chrome in 007); the `26px` floor guarantees the far row at least `26 · 0.959 = 24.9 px` wide on screen (AC3: at least 24 px **wide**); its height is `26 · cos 25° · 0.959 = 22.6 px`, covered by the WCAG 2.5.8 spacing exception (pitch `28 · cos 25° · 0.959 = 24.4 px`, at least 24 px). On desktop `--cell` stays 32 px as in 2D. So the "24 px nominal" of AC3 is met as: nominal ≥ 24 px in 2D, ≥ 26 px in 3D on phones (32 px on desktop), far row ≥ 24 px wide on screen at every size. The floor was 28 px in the first draft; UX §12 point 3 showed that 9 × 9 then overflows the well by about 2 px at 320 px (the formula gives 27.7 px, the floor lifts it to 28 px). With 26 px the formula wins at 320 px and the board fits (grid about 265 px plus margins about 12 px of 278 px). The compensation margins are ratios of the grid size, so they do not change with the floor; re-checked.
- **Relief (shadows, no layers):** under `[data-view='3d']` raised tiles (`.hidden`, `.flagged`) use `--tile-lip-3d` instead of `--tile-lip`; revealed cells get one inset shadow at the top edge (reusing `--cell-pressed-shade`) so they look lowered; `.grid` gets `box-shadow: var(--shadow-board-3d)` (a soft slab shadow under the tilted plane; not on the scroller, where an outer shadow would fall outside the well; clipped by the well's padding edge, decoration only, not part of scrollable overflow). Flags and mines ("small 3D objects"): `translateY(-var(--glyph-lift-3d))` on `.glyph` plus a ground ellipse as `::before` of the flagged/mine cell (`content: ''`, plain `background-color: var(--shadow-glyph-3d)`, `position: absolute`, `pointer-events: none`; `.cell` gets `position: relative` in 3D). Not a `filter: drop-shadow` (one offscreen surface per glyph, up to about 700 on a lost 30 × 30 board). The pseudo-element has no content, so it is not in the accessibility tree and `Cell` markup stays unchanged; its colour is a token. Exploded mine and wrong flag get neither lift nor ellipse; in forced colours the ellipse is `display: none`. No `clip-path`, `filter` or `will-change` anywhere, no outer shadow on `.cell` itself. Pressed state (`:active`, `.pressed`) stays as in 2D. Relief adds shading only, never the sole cue: the seven states stay distinguishable by border/glyph exactly as in 007 (forced colours rules apply unchanged; shadows vanish there, which is fine).
- **Switching:** instant. No transition on `transform` or any layout property (margins would animate layout every frame). The only motion is the existing 120 ms (`--duration`) fade of cell background/box-shadow, which is at most 300 ms and becomes 0 s under reduced motion (token + global safety net, ADR 0004). **Never wait for `transitionend`** (it does not fire under reduced motion). If UX asks for an animated tilt, it must be `transform` only, `var(--duration)`, and the e2e settle-wait (`document.getAnimations().length === 0`) already used in `redesign.spec.ts` covers it.
- **Dark/light:** only tokens, so both follow (007/AC3). New colour token `--shadow-board-3d` needs a dark value (parity is already enforced by `tokens.test.ts`).

### Error handling and capability fallback (AC7)

No network, no async. `supports3dView()` is the only failure path: if it is false (or `CSS.supports` does not exist), `available3d` is false, the 3D radio is disabled with the visible text, `view` can never become `'3d'`, and the board is the 2D board. There is no "try 3D and fall back" path, no error state, no blank board. jsdom has no `CSS.supports`, so under Vitest the check returns false; component tests that need 3D must stub it (none are planned). The check runs at **mount** (not module load), so a test can fake it before the app starts.

### Risks and mitigations

- **Compensation numbers wrong (clipped near row, empty bands, spurious scrollbars)** → measure, not trust: e2e AC3 checks no scrollbars on a fitting board and that the last cell of a 30 × 30 board is reachable and fully inside the scroller; tokens are derived from tilt and depth by a unit test.
- **Far row below 24 px, or phone width overflow in 3D** → phone floor 26 px and the `/ 1.05` in the fluid formula; e2e AC3 measures far-row cell width at 320 px with 30 columns and the horizontal overflow of the default board at 320 and 375 px.
- **Performance on 30 × 30 (900 cells under a 3D transform)** → one composited layer for the grid, no `preserve-3d`, no per-cell `translateZ`/`will-change`/filters (the glyph shadow is a `::before` background, not a filter); the switch re-renders no `Cell`. If the developer sees jank on a 30 × 30 board, reduce relief effects first, never add layers.
- **Blurry text under perspective** → tilt is small (25°), scale between 0.96 and 1.04; acceptable, judged at hak's gate 2 screenshots. If digits look soft, try `backface-visibility`-free fixes only (no `will-change`).
- **jsdom/test mismatch of `CSS.supports`** → see above; the e2e fake for AC7 replaces `CSS.supports` before the app starts.
- **Scroll position on switch** (content size changes by about 9 % in height) → the browser clamps `scrollTop/Left`; no repositioning code. The focused cell is not scrolled into view on a switch (focus is on the radio); accepted.
- **Safari:** `perspective()` inside `transform` and `rotateX` are long supported; the capability check covers old engines. Not testable in the Chromium-only suite; note in the Test report as "not run in WebKit/Firefox".

### Implementation plan (ordered)

1. `logic/boardView.ts` + `boardView.test.ts`.
2. Tokens: 3D block in `tokens.css` (incl. dark value of `--shadow-board-3d`); extend `tokens.test.ts`.
3. `Board.tsx` (`view` prop, `data-view`, `--rows`) and the `[data-view='3d']` block in `Board.module.css`; measure the box by hand in the browser at 5 × 5, 16 × 30, 30 × 30 and 375 px, fix the tokens.
4. `ViewToggle.tsx` + CSS per the UX design (wait for it; the markup contract above is fixed), wire it into `Minesweeper.tsx`.
5. E2E: `e2e/minesweeper-3d.spec.ts`, then the second project for AC4.
6. `npm run verify`.

### Minimal test set (one per AC, cheapest level)

Unit (pure logic only):

- `boardView.test.ts`: `supports3dView()` is false without `CSS`, false if `CSS.supports` returns false, true if it returns true (3 cases; stub `globalThis.CSS`).
- `tokens.test.ts`: the 3D tokens match tilt and depth (formulas above, ±0.002 for top/bottom, `side` between the computed value and +0.005), and `--board3d-tilt` is at most 35deg. (AC3 "at most 35°"; a pure arithmetic guard, so e2e does not measure the angle.)

E2E, `e2e/minesweeper-3d.spec.ts` (guest sign-in per test; helper `openGame(page)`; titles start with the AC id):

- **AC1:** `radiogroup` named "View" with radios "2D" (checked) and "3D"; present before Start, with a running game and after a lost game; choosing "3D" by click and by keyboard (focus "2D", ArrowRight; then Space on "2D" after ArrowLeft) changes the checked radio. Touch is the same native input; no separate tap test.
- **AC2:** fake clock as in 006 (`page.clock`); fixed 5 × 5 layout; (a) before the first reveal switch: board still all hidden, same grid element; (b) reveal, flag, run 3 s, capture state = the grid's `ariaSnapshot()` + counter text + timer text, switch to 3D, state identical, run 2 s: timer `Time: 5` (no reset, no jump), switch back: identical; (c) `grid.elementHandle()` taken before the first switch is still connected after switch and back (no remount); (d) lose the game, switch: result message still shown, timer frozen on its value after `runFor`, board state identical.
- **AC3 (look):** same board, `scroller.screenshot()` in 2D (A), 3D (B), 2D again (C): `B` differs from `A`, `C` equals `A` (compare buffers; settle with `document.getAnimations().length === 0` first; mouse moved away so no hover differs); no scrollbars on the fitting 5 × 5 3D board (`scrollHeight <= clientHeight + 1`, same for width).
- **AC3 (size, large and phone):** viewport 320 px, 30 × 30 in 3D: bounding box of cell (1,1) (far row, 26 px floor) is at least 24 px wide, of cell (30,1) wider; after scrolling cell (30,30) into view it lies fully inside the scroller's box (reachable, not clipped); with the default 9 × 9 board at 320 px and at 375 px the scroller has no horizontal overflow (`scrollWidth <= clientWidth + 1`).
- **AC5:** the grid's `ariaSnapshot()` equals between 2D and 3D (same structure and names); in 3D, for a corner cell (5,5) focused by keyboard in light and dark (`emulateMedia({ colorScheme })`): outline style not `none`, width at least 2 px, outline colour equals the resolved `--color-focus` token, and the cell's bounding box lies inside the scroller's (ring not clipped). Contrast of `--color-focus` on the board fills is already guarded by `tokens.test.ts`.
- **AC6:** `emulateMedia({ reducedMotion: 'reduce' })`: right after a switch `document.getAnimations().length === 0`; normal motion: right after a switch every animation has `iterations === 1` and `duration <= 300`, and after settling `getAnimations().length === 0` (nothing loops).
- **AC7:** `addInitScript(() => { CSS.supports = () => false; })`, then reload and sign in: the "3D" radio is disabled, the unavailable text (from the UX design) is visible, "2D" is checked; start a game and reveal a cell: the board works, no console error (`page.on('pageerror')` collects none).
- **AC8:** choose 3D, reload and sign in: "2D" checked; choose 3D, sign out, sign in as guest: "2D" checked.

AC4 (no duplicated bodies): the existing 005/006 flows run once more in 3D through a second Playwright project:

```ts
// playwright.config.ts: projects add
{
  name: 'chromium-3d',
  testMatch: 'minesweeper.spec.ts',
  grep: /AC(6|8|9|10):/, // flag/unflag (mouse + touch long press), keyboard, lose, win
  use: { ...devices['Desktop Chrome'] },
},
// e2e/minesweeper.spec.ts, end of the outer beforeEach (after sign-in):
if (test.info().project.name === 'chromium-3d') {
  await page.getByRole('radio', { name: '3D' }).check();
}
```

That is five existing tests re-run unchanged in 3D (mouse reveal/flag, long press, arrow keys + Enter/Space/F, loss, win). "Start" and presets in 3D (005/AC2, 006/AC2) are covered by every one of them starting a game while 3D is chosen (the choice precedes Start). 006/AC3–AC5 (timer) are view-independent and covered by AC2 above. The default project still runs the whole suite in 2D; names and expectations of existing tests do not change.

Not tested, listed in the Test report as "checked, OK" if the tester looks: tilt angle on screen, forced-colours in 3D (007's rules apply unchanged), WebKit/Firefox.

### Alignment with UX

Reconciled with UX §12 (the UX section is unchanged; this section and the sections above were updated to match):

| UX §12 point                                                                                      | Decision  | Reason                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Forced colours vs specificity: `:where()` around the scroller                                   | Accepted  | My "place the block before the forced-colours block" was wrong: `.scroller[data-view] .hidden` out-specifies `.hidden`; `:where()` gives equal specificity so order decides (the 2D hover/active rules stay stronger).                                                                                    |
| 2 Slab shadow on `.grid`, not the scroller                                                        | Accepted  | An outer shadow on the scroller falls outside the well; on `.grid` it follows the plane, costs no layer and is not scrollable overflow.                                                                                                                                                                   |
| 3 Floor 26 px instead of 28 px, e2e at 320 px                                                     | Accepted  | Floor 28 px lifts the 27.7 px formula value at 320 px and overflows by about 2 px; 26 px keeps the far row 24.9 px wide (AC3 asks for width). Margins are ratios of the grid, so unchanged. The e2e check runs at 320 and 375 px.                                                                         |
| 4 `::before` ground ellipse instead of `filter`                                                   | Accepted  | No offscreen surface per glyph (about 700 on a lost 30 × 30 board); no markup change, nothing in the accessibility tree.                                                                                                                                                                                  |
| 5 Control markup: wrapper, label span, transparent overlay input                                  | Accepted  | Same contract (names, DOM position, no live region); the refinements are needed for a whole-segment click target.                                                                                                                                                                                         |
| 6 Focus ring about 1.7 to 1.9 px on screen                                                        | Confirmed | The AC5 e2e measures the computed style (`outline-width` ≥ 2 px, CSS px before the transform), not rendered pixels. Known deviation from a literal "2 px on screen" reading, to be named at gate 2; if hak wants it strict: 3 px width with offset -3 px in 3D only (UX decision, no AC change proposed). |
| 7 AC1 "next to the status bar" = directly above the status block                                  | Accepted  | The DOM order (toggle, then status) keeps the control mounted and focus stable; no AC wording change.                                                                                                                                                                                                     |
| 8 New tokens (`--cell-recess-light`, `--shadow-glyph-3d`, `--glyph-lift-3d`, `--recess-depth-3d`) | Accepted  | Added to `tokens.css` (colours in light and dark, sizes in `:root`); the existing parity test covers them.                                                                                                                                                                                                |
| 9 Copy collision "3D"                                                                             | Accepted  | Tests use `getByRole('radio', { name: '3D' })`; the unavailable text is matched by its exact full text.                                                                                                                                                                                                   |

What UX can rely on: the control is always mounted, DOM order toggle then status, native radios named "2D"/"3D", "3D" can be disabled with a visible text. UX decided: the look of the control, the copy, the relief details within the constraints above (CSS only, no new markup in `Cell`, no filter or clip-path on `.cell`, no layers), the screenshot list.

## Implementation notes

_developer: what was built, deviations from the design and why._

**What changed**

- `logic/boardView.ts` (+ `boardView.test.ts`, 3 cases): `BoardView` and `supports3dView()` exactly as in the design.
- `Minesweeper.tsx`: `view` (`useState('2d')`, not in the reducer, not persisted) and `available3d` (lazy `useState(supports3dView)`, read once per mount); `<ViewToggle>` always mounted between the live region and the status/empty block; `view` passed to `Board`.
- `Board.tsx`: new prop `view` written as `data-view` on the scroller; `--rows` next to `--cols`; nothing else (the local `view` of the cell loop was renamed `cell`). `Cell` is untouched.
- `Board.module.css`: the 3D block before the forced-colours block: tilt, compensation margins and slab shadow on `.grid`; phone cell size with the 26 px floor and `/ 1.05`; every cell-level rule with `:where(.scroller[data-view='3d'])` (one-class specificity); raised tiles with the 5 px lip, lowered cells with inset shades, glyph lift and `::before` ground ellipses on flagged and mine cells; ellipse `display: none` in forced colours. Verified in Chromium with `forcedColors: 'active'`: a 3D hidden cell computes `inset 0 -3px 0 ButtonText` (the forced-colours rule wins).
- `ViewToggle.tsx` + `ViewToggle.module.css`: UX §3 (radiogroup named by the visible "View", native radios as transparent overlays, check mark always in the DOM, unavailable `<p>` as a sibling after the radiogroup, `aria-describedby` on "3D"). The two options are mapped from one constant, so there is one component and no extra file.
- `tokens.css`: `--board3d-*`, `--tile-lip-3d`, `--glyph-lift-3d`, `--recess-depth-3d` in `:root`; `--cell-recess-light`, `--shadow-glyph-3d`, `--shadow-board-3d` in light and dark.
- `tokens.test.ts`: new test for the 3D tokens (derived from tilt and depth, tilt at most 35deg, far row of the narrowest cell at least 24 px) and new contrast pairs: focus on `--cell-tile-lip`, edge on `--color-accent-subtle` and `--color-accent-subtle-press`, focus on `--color-accent-subtle-press`.

**Measured (Chromium, throwaway script, not committed)**: default 9 x 9 board in 3D has no scrollbar at 320, 375 and 800 px (`scrollWidth == clientWidth`, `scrollHeight == clientHeight`); 16 x 30 and 30 x 30 scroll inside the well only, the last cell lies inside the scroller; the page never scrolls sideways. The compensation tokens from the design are right (top and bottom of the projected board coincide with the well's content box to 0.1 px), so no token was changed. Cell bounding boxes in the far row are at least 26 px wide at the 26 px floor (the box includes the slant of the side edges).

**Deviations**

- `.input` of the radio has `appearance: none`, `border-radius: var(--radius-control)` and `font: inherit` (not in UX §3.1): redesign.spec.ts AC2 collects font family and border radius of every `input`, and a native radio computes `Arial` and `50%` (Chromium keeps the radio's 50% unless `appearance: none`). The input is invisible, so nothing changes visually.
- Cursor is set per state on the input itself (pointer, default when checked, not-allowed when disabled) instead of `cursor: inherit` from the label; same result, no `:has()`.
- `.input` has `z-index: 2` so that the focused segment's `.box` (`z-index: 1`, for the ring) never sits above it as a hit target.

**Open points / for the tester**

- Earlier e2e specs that need an update because of the View control (not edited by me): `minesweeper.spec.ts` "AC8: the board is played with the keyboard only" and `redesign.spec.ts` "AC4: cell states differ ..." assume that Tab after "Start" lands on the board; it now lands on the checked View radio (one more Tab). `minesweeper.spec.ts` "touch > AC6: a long press ..." dispatches CDP touch events at the cell's `boundingBox()`; with the extra row (about 70 px) the 5 x 5 board now starts below the 720 px viewport (cell (3,3) at y = 728), so the press must scroll the cell into view first (`scrollIntoViewIfNeeded()`).
- `npm run test:e2e`: 61 passed, 3 failed (the three above).
- Not run: the `chromium-3d` project and `e2e/minesweeper-3d.spec.ts` (tester).

**Fixed in round 1:** (1) minor: the phone cell size in `Board.module.css` now divides by `(1 + 2 * var(--board3d-side))` instead of the hand-rounded `1.05`, so it follows the tilt token. (2) nit: `tokens.test.ts` has the new pair focus ring on `--cell-pressed-shade`, and the "far row at least 24 px" unit assertion is removed (the 320 px e2e measurement in `minesweeper-3d.spec.ts` covers it). The focus-ring width is unchanged (hak decides at gate 2); the e2e nits are the tester's.

## Test report

_tester: AC → test mapping, results, defects found._

Round 1, 2026-11-02. `npm run verify` green (207 unit tests, build, check-dist). `npm run test:e2e`: 81 passed, run twice, no flake (76 in project `chromium`, 5 in `chromium-3d`). Chromium only: WebKit and Firefox not run.

| AC  | Test(s)                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Result |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | `e2e/minesweeper-3d.spec.ts`: "AC1: the View control is there before Start, during a game and after a loss, and works by mouse, keyboard and touch" (mouse, keyboard arrows, Shift+Tab from the board); "AC1: a tap on a segment selects it" (touch)                                                                                                                                                                                                                       | PASS   |
| AC2 | `e2e/minesweeper-3d.spec.ts`: "AC2: switching keeps the board, flags, counter, timer and result; no new board is created" (fake clock: timer 3 then 5 across a switch, same grid element, lost game frozen in both views, empty board before Start)                                                                                                                                                                                                                        | PASS   |
| AC3 | `e2e/minesweeper-3d.spec.ts`: "AC3: the 3D board is tilted and has relief, and 2D afterwards is unchanged"; "AC3: a fitting 3D board has no scrollbars and no spill-over"; "AC3: at 320 px the far row is at least 24 px wide, the last cell of 30 x 30 is reachable, a 9 x 9 board needs no sideways scroll" (also 375 px). The 3D look is shown by the computed `matrix3d` tilt and the changed box-shadows; tilt at most 35 degrees is guarded by `tokens.test.ts` only | PASS   |
| AC4 | Playwright project `chromium-3d` re-runs `minesweeper.spec.ts` AC6 (mouse), AC6 (touch long press), AC8 (keyboard), AC9 (lose), AC10 (win) with 3D chosen in the `beforeEach`                                                                                                                                                                                                                                                                                              | PASS   |
| AC5 | `e2e/minesweeper-3d.spec.ts`: "AC5: 3D has the same grid structure and names as 2D, and a visible, unclipped focus ring (light)" and "(dark)" (identical `ariaSnapshot`, ring at least 2 px, colour equals `--color-focus`, far corner cell inside the scroller)                                                                                                                                                                                                           | PASS   |
| AC6 | `e2e/minesweeper-3d.spec.ts`: "AC6: with reduced motion the switch is immediate and nothing moves"; "AC6: with normal motion a switch animates for at most 300 ms and nothing loops"                                                                                                                                                                                                                                                                                       | PASS   |
| AC7 | `e2e/minesweeper-3d.spec.ts`: "AC7: without 3D support "3D" is shown as unavailable and 2D works without errors" (`CSS.supports` stubbed in an init script; no page error, no console error)                                                                                                                                                                                                                                                                               | PASS   |
| AC8 | `e2e/minesweeper-3d.spec.ts`: "AC8: after a reload and after sign-out and sign-in the view is 2D again"                                                                                                                                                                                                                                                                                                                                                                    | PASS   |

**Tests added: 12** (all in `e2e/minesweeper-3d.spec.ts`) plus the project `chromium-3d` in `playwright.config.ts` (5 re-runs, no new bodies) and one `beforeEach` line in `minesweeper.spec.ts`.

**Tests changed (known failures of the developer, fixed as "Independent tests"):** `minesweeper.spec.ts` "AC8: the board is played with the keyboard only" and `redesign.spec.ts` "AC4: cell states differ by shape ..." now Tab on from "Start" until the board has focus (at most 12 presses) instead of counting one Tab; `minesweeper.spec.ts` "touch > AC6: a long press ..." calls `scrollIntoViewIfNeeded()` before reading the cell box for the CDP touch.

**Design decision in the AC3 test (not a weakened assertion):** "2D after 3D equals 2D before" is compared pixel by pixel with a per-channel tolerance of 8/255, not byte for byte. After a 3D round trip 164 of 35 000 pixels (rounded cell edges) differ by at most 2/255, which is anti-aliasing noise and not visible. The pixel comparison "3D differs from 2D" was dropped after review (the images have different sizes, so it could not fail); the 3D look is proven by the `matrix3d` transform and the changed box-shadows.

**Review nits handled (round 1):** the e2e 35 degree check was dropped (`tokens.test.ts` guards it); the AC5 corner loop over one cell was simplified and the comment fixed (the tested cell (5,5) is the near corner); the AC1 touch-tap test stays because it is the only place that shows the View control working by touch.

**Mutation checks:** lowering `--board3d-cell-min` to 20 px makes the 320 px far-row test fail (19.97 px); the tokens were restored. The AC3 look test requires the computed transform to be a `matrix3d` (not run as a mutation).

**Checked, OK (no permanent test):**

- Forced colours in 3D: the 007 AC3 spec re-run with 3D chosen (throwaway copy): all seven cell states distinguishable, no invisible glyph; screenshot `10-forced-colours-lost-3d.png` shows lip, glyphs, exploded ring and the View control with check mark and thick bottom edge.
- Dark mode: AC5 runs in light and dark; screenshots in both schemes.
- Reduced motion: AC6 test above (computed transition duration 0 s, no animations after a switch).
- The 007 AC5 layout spec re-run in 3D at 160, 320, 375 and 800 px: no sideways page scroll, nothing overlaps, boards 30 columns scroll inside the well. The 007 AC4 "shape not colour" proxy and the "cell is 32 px wide" check do not apply unchanged to 3D: in 3D an empty cell also has an inset shadow (the proxy `box-shadow !== none` no longer separates hidden from empty, but the 5 px lip versus recess does), and a cell's bounding box is 33 px because it includes the slant. Not defects.
- Probes on a 16 x 16 3D board: right-click flags exactly the clicked cell in all four corners and in the centre; a click on the very edge between two far-row cells flags one cell; 30 rapid switches keep all flags; no sideways page scroll.
- Not run: WebKit and Firefox; tilt angle on screen (the computed matrix and the token test cover the angle).

**Screenshots (gate 2):** `/Users/haraldkuegel/swfactory/screenshots/008/` (gitignored, 37 files, taken after the last e2e run, 9 x 9 board with fixed mines showing numbers 1 to 8, flags, hidden and empty cells): `01-control-{2d,3d,3d-focus}-{light,dark}`, `02-before-start-{light,dark}`, `03-running-{2d,3d}-{light,dark}` and `03-running-3d-board-*`, `04-lost-{2d,3d}-{light,dark}` and `04-lost-3d-board-*`, `05-won-3d-{light,dark}`, `07-3d-375-{9x9,16x30}-{light,dark}`, `08-3d-320-9x9-light`, `09-30x30-3d-800-{light,dark}`, `09-30x30-3d-375-last-{light,dark}` (last cell with focus ring), `10-forced-colours-{lost-3d,control}`, `11-unavailable-{375,800}-{light,dark}`. State 6 (side by side) is the pair `03-running-2d-*` and `03-running-3d-*`.

**Looked at the screenshots myself:** nothing broken. The tilt is gentle but visible (far row narrower, lip and recess readable, flags and mines clearly raised objects with a small ground shadow, exploded mine ring and wrong flag clear); digits and glyphs are sharp in the far rows; the focus ring is visible on tiles and on the last cell of 30 x 30 at 375 px and is not clipped. Remarks for hak, not defects: (1) in dark mode revealed cells are almost the colour of the well, so a 3D won board with many empty cells looks like a grid of faint outlines (intended in UX 4.1: lowered look comes from the 1.6:1 bottom edge); (2) the 3D board is about 8 % lower than the 2D board at 800 px because of the 25 degree tilt (and slightly wider at the near edge); (3) at 375 and 320 px the top rows of a scrolled 16 x 30 board leave a dark empty band on the left (the far rows are narrower by perspective); (4) at 320 px the "Intermediate" preset label nearly touches its border (story 006/007 layout, not 008, same in 2D).

**Defects:** none.

| Severity | Defect | Steps to reproduce |
| -------- | ------ | ------------------ |
| none     | none   | none               |

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

### Round 1 (2026-11-02): APPROVED

I ran `npm run verify` myself and it is green (207 unit tests, build, check-dist ok). I also ran `minesweeper-3d`, `minesweeper` and `redesign` e2e in both projects: 40 passed. Then I checked the focus areas with a throwaway Playwright probe (scratchpad, not committed):

- **AC2, no remount:** on a 30 × 30 board the MutationObserver on the grid sees 0 mutations when the view switches. Only `data-view` on the scroller changes. The same grid element and `activeIndex` survive: Shift+Tab to the radio, ArrowRight to 3D, Tab goes back to the cell focused before.
- **Forced colours in 3D:** the `:where()` specificity works. Hidden and flagged cells compute `inset 0 -3px 0` ButtonText with a 2 px border, so the forced-colours rule wins over the 5 px 3D lip. Revealed and mine cells have box-shadow `none`. The `::before` ellipse is `display: none`. On the control, the selected segment has a 3 px Highlight bottom border.
- **Pressed state in 3D:** mouse `:active` and the touch `.pressed` class both compute the 2D pressed shadow, so the 3D lip doesn't win over it.
- **AC5:** the grid's `ariaSnapshot` is identical in 2D and 3D. The `::before` ellipses add nothing to the accessibility tree.
- **AC7:** the capability is read with a lazy `useState(supports3dView)`, so it runs once per mount and never at module load. The init-script stub reaches it.
- **ViewToggle hit testing:** `elementFromPoint` at the segment centre returns the `input`, also while the focused `.box` has `z-index: 1`. In the rounded corners the hit goes to the `label` or `span`. A click there still activates the label's radio, so that is fine. Keyboard (one tab stop, arrows, the disabled 3D option skipped) and tap are covered by the tests.
- **Performance, 30 × 30:** one extra compositing layer (7 → 8). After the switch there is one 33 ms frame, then steady 17 ms frames. No animations are left after 300 ms. There are no per-cell layers.
- **Contrast:** the new pairs pass. The ring next to the recess shade is 3.70:1 light and 11.4:1 dark (see the nit below).
- **Changes to earlier specs:** the bounded Tab loop and `scrollIntoViewIfNeeded()` follow CLAUDE.md "Independent tests". The old single Tab didn't prove "one tab stop" either, so no assertion got weaker.
- **`chromium-3d` project:** `testMatch` and `grep` select exactly the 5 intended tests.

Findings:

- [minor] `src/features/minesweeper/Board.module.css:194` — the `/ 1.05` is a hand-rounded copy of `1 + 2 * --board3d-side`, and neither `tokens.test.ts` nor anything else ties the two together. If the tilt is raised within the allowed 35°, `side` becomes 0.0305 and the factor 1.061. The 9 × 9 board would then overflow by a few px at 320 px. Suggested fix: write `/ (1 + 2 * var(--board3d-side))` (a unitless divisor is valid in `calc`) and drop the comment.
- [minor] `src/features/minesweeper/Board.module.css:59-62` together with AC5 — the focus ring is 2 px in computed style. On screen it is about 1.74–1.89 px on the horizontal edges in 3D, because the tilt shortens them (cos 25° × scale). This is known and recorded in UX §4.3 and the Alignment table (point 6). It needs hak's decision at gate 2: accept the "2 px computed" reading, or use 3 px with offset -3 px in 3D only. This doesn't block the review.
- [nit] `e2e/minesweeper-3d.spec.ts:294` — "3D board differs from 2D" can't fail as written. The 3D scroller differs in size (the side margins add width, the top and bottom margins remove height). With different sizes, `differingPixels` returns `MAX_SAFE_INTEGER`. The tilt matrix and the box-shadow assertions above already prove the difference. Suggested fix: drop the pixel count for A vs B, or assert the size difference explicitly. The A vs C check (2D unchanged) is sound.
- [nit] `e2e/minesweeper-3d.spec.ts:386-399` — the comment says "far corner (5,5) and (1,1)", but the loop runs over one element only, and (5,5) is the near corner. The near corner is the right one to test, because the near row sticks out at the sides. Suggested fix: drop the one-element `for` and fix the comment.
- [nit] Test proportionality:
  - `e2e/minesweeper-3d.spec.ts:179` tap test: the Technical design said "no separate tap test". `tap()` goes through the same native input as `check()`.
  - `e2e/minesweeper-3d.spec.ts:289` (cos ≥ cos 35°) repeats the `tokens.test.ts` tilt guard. The design said e2e doesn't measure the angle; `cos < 0.99` is enough.
  - `src/app/tokens.test.ts:246` (far row of the floor ≥ 24 px) repeats the 320 px e2e measurement, which is the AC3 oracle.

  Each check is cheap, so this is input for the retro, not a change request.

- [nit] `src/app/tokens.test.ts:165` — in 3D every lowered cell paints `--cell-pressed-shade` directly inside the focus ring. At 3.70:1 in light this is now the tightest focus pair, and it isn't guarded. Suggested fix: add `['--color-focus', '--cell-pressed-shade', NON_TEXT]`.

No security issues: no new dependency, no HTML injection, nothing dev-only (check-dist unchanged, as intended).

## Retrospective

_orchestrator, 2026-11-02._

Went well: the new reconciliation step (007 retro) caught four errors in the Technical
design before the build (forced-colours specificity, slab shadow, 320 px overflow, glyph
filters); tester PASS without defects; review APPROVED in round 1; no new dependency.

### What went wrong

| #   | Problem                                                                                                                     | Root cause                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| P1  | Three earlier specs broke again because a new control added a Tab stop and moved the board below the viewport (third time). | Old specs counted Tabs and touched raw coordinates; "Independent tests" doesn't name these patterns.  |
| P2  | Review minor: a hand-rounded `/ 1.05` copied a token-derived value; a tilt change would overflow 320 px.                    | No rule that derived CSS values are computed from the tokens.                                         |
| P3  | The architect's CSS claim on forced colours was wrong (variant selector out-specified the forced block).                    | Specificity of variant selectors vs override blocks isn't a team rule.                                |
| P4  | Test nits: a pixel check that could not fail, two duplicated checks, and a flake from reading styles mid-transition.        | New assertions weren't each shown to fail once; computed styles were read before transitions settled. |

### Proposed changes

1. **`CLAUDE.md`, Styling (P2, P3; reviewer's and UX's suggestions):** values derived
   from tokens are written as `calc()` over the token, never as a hand-rounded number;
   variant selectors (e.g. `[data-view]`) wrap their scoping part in `:where()`, so
   forced-colours and other override blocks still win.
2. **`CLAUDE.md`, Independent tests (P1; developer's suggestion):** no counted Tab
   sequences and no raw coordinates of elements that may move — focus by role or Tab
   until the target has focus, and `scrollIntoViewIfNeeded()` before raw input.
3. **`tester` agent (P4):** show every new assertion failing once (a temporary
   mutation), and read computed styles only after `document.getAnimations()` is empty.

### Outcome

hak signed off the look from the screenshots in `screenshots/008/`, accepted the focus
ring as is (2 px computed, about 1.7–1.9 px on screen in 3D) and approved all three
proposals at gate 2 ("Ja, alles"). Applied: `CLAUDE.md` Styling (1) and Independent
tests (2), `.claude/agents/tester.md` (3).
