---
id: 050
title: A cinematic 3D view with a realistic look, camera moves and animated effects
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature
app: minesweeper
size: L
branch: feature/050-minesweeper-cinematic-view
supersedes: []
changes: [008/AC1, 008/AC6]
superseded-by:
---

# 050 – A cinematic 3D view with a realistic look, camera moves and animated effects

## Original request

> neue story für minesweeper. Die Grafik ist zwar funktional, aber nicht wirklich umwerfend.
> Ich möchte gerne noch eine wirklich spektakuläre 3d Ansicht (zusätzlich zur jetzigen 3d), die
> schöne Effekte und von der Grafik wirklich was her macht. Gerne auch mit dynamischen Animationen

> Minesweeper: zusätzliche, wirklich spektakuläre 3D-Ansicht mit schönen Effekten und dynamischen
> Animationen. Stil : eher realistisch, Effekte : überasch mich, Kamerafahren hören sich
> interessant an. Handy tauglich muss es nicht unbedingt sein, können wir ggf. auch später machen

## User story

As a player, I want a third, cinematic view of the board with a realistic look, camera moves and
animated effects, so that playing Minesweeper looks impressive and not only functional.

## Context

The 3D view of stories 008, 009, 010 and 020 is functional: a tilted board with raised tiles, an
explosion and confetti at the end. hak finds it not stunning. This story adds a third view next
to "2D" and "3D"; both stay as they are. The style is realistic (real-looking materials, light and
shadow), the effects are the team's choice, camera moves are wanted. Mobile performance is not
required in this story. The game logic, keyboard play and screen-reader output stay the same in
every view.

## Acceptance criteria

- **AC1:** Given I am signed in, when I look at the "View" control, then it offers "2D", "3D" and
  "Cinematic"; switching between all three keeps the same game (as [008/AC2](008-minesweeper-3d-mode.md)),
  "Cinematic" is unavailable with the same notice as "3D" when the browser cannot show 3D
  ([008/AC7](008-minesweeper-3d-mode.md)), and after a reload or a new sign-in "2D" is current
  ([008/AC8](008-minesweeper-3d-mode.md)).
- **AC2:** Given the cinematic view, when I look at the board, then it looks realistic and clearly
  different from the "3D" view of the same board: tiles with real-looking materials and bevelled
  edges, light from an environment with soft shadows and reflections, and a background scene
  instead of a flat colour; numbers, flags and mines stay readable in light and dark mode.
- **AC3:** Given the cinematic view and normal motion settings, when I press "Start", then the camera
  flies in to the board in at most 2 s; when I reveal a cell, then the camera follows the action
  gently and returns; when I lose, then it moves towards the exploded mine; when I win, then it
  circles the board. Every camera move ends on its own, never makes a cell hard to hit, and a click
  or key during a move acts on the cell that is under the pointer or has the focus.
- **AC4:** Given the cinematic view and normal motion settings, when I reveal, flag or unflag, then
  the change is animated (tiles flip open in a wave outward from the clicked cell, a flag is
  planted, a removed flag disappears), each animation lasts at most 600 ms, and the board shows the
  correct final state at once for the screen reader and for the next input.
- **AC5:** Given the cinematic view and normal motion settings, when I lose or win, then a
  spectacular end effect plays (for a loss an explosion with shockwave, debris and smoke followed
  by the other mines going off one after another; for a win a light show or fireworks over the
  board), the message and the stopped timer appear at once, the effect ends at the latest 4 s after
  the click without looping, nothing flashes more than 3 times in any second, and "Start" during the
  effect stops it at once (a preset alone only fills the fields, [006/AC2](006-minesweeper-presets-timer.md)).
  A game that ended in another view shows the static final board without the effect.
- **AC6:** Given the cinematic view, when I play with mouse, long-press, keyboard or a screen reader,
  then everything behaves as in [008/AC4](008-minesweeper-3d-mode.md) and
  [008/AC5](008-minesweeper-3d-mode.md) (same grid structure, names, counter, timer and messages, a
  visible focus on every cell).
- **AC7:** Given I have set the system to reduce motion, when I use the cinematic view, then there is
  no camera move, no tile, flag or end animation and no idle motion; the board and every state
  change appear at once as a static picture with the realistic look of AC2.
- **AC8:** Given the cinematic view on the reference machine (hak's Mac), when I play and when an end
  effect plays, then the frame-rate floors of [009/AC3](009-minesweeper-3d-visual-upgrade.md) hold
  (at least 50 fps on 16 × 30, at least 30 fps on 30 × 30), effects being reduced on large boards
  rather than slowing the board down. (Verified by a script in headed Playwright on the reference
  machine; not part of CI.)

## Out of scope

- Performance and touch comfort on phones (hak: maybe later, as its own story).
- Changes to the "2D" and "3D" views.
- Sound.
- Remembering the chosen view across reloads.

## Open questions

- none

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-21 — The new view is in addition to the existing 3D view, which stays (hak, original request).
- 2026-11-21 — Style: realistic; effects: the team's choice ("überrasch mich"); camera moves wanted;
  mobile not required now, maybe later (hak, /story).
- 2026-11-21 — Lean process as for story 048: the orchestrator writes story, technical direction,
  review, docs, explanation and retro; developer and tester run on Sonnet (hak: "bitte wieder die
  schlanke, token-sparende Herangehensweise").
- 2026-11-21 — One story of size L instead of several S stories: look, camera, animations and end
  effects share one scene and one test setup, and hak prefers one larger story when it saves test
  effort (orchestrator).
- 2026-11-21 — No new dependency planned: post-processing (bloom, depth of field) comes from
  `three/examples/jsm`, which ships with the `three` package already in use; a new package would
  need an ADR (orchestrator).
- 2026-11-21 — AC1 changes [008/AC1](008-minesweeper-3d-mode.md) (two options become three) and
  AC3 changes [008/AC6](008-minesweeper-3d-mode.md) ("the 3D view never moves by itself" holds for
  "3D"; the cinematic view moves only with normal motion settings) (orchestrator).

- 2026-11-21 — Q: name of the third option, "Cinematic"? — A: yes; gate 1 approved (hak: "Ja, so committen").

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

## Technical design

## Implementation notes

## Test report

| AC  | Test(s) | Result |
| --- | ------- | ------ |

## Review

## Explanation

## Retrospective
