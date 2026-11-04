---
id: 010
title: Minesweeper 3D end effects, explosion on loss and celebration on win
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
branch: feature/010-minesweeper-3d-end-effects
supersedes: []
changes: [] # extends 009 (adds effects to the end of a game); no AC of 009 or 008 changes its wording
superseded-by:
---

# 010 – Minesweeper 3D end effects, explosion on loss and celebration on win

## Original request

> sorry, das 3d ist aber komplett langweilig. das soll graphisch was her machen

Note: hak, 2026-11-02, German, given right after story [008](008-minesweeper-3d-mode.md) was merged. At gate 1 hak confirmed a split into two stories: [009](009-minesweeper-3d-visual-upgrade.md) (the lit 3D scene with reveal and flag animations) and this story, the loss and win effects. This story depends on 009 (built after it).

## User story

As a player, I want a dramatic explosion when I lose and a celebration when I win in the 3D view, so that the end of a game feels rewarding.

## Context

Part of hak's wish to make the 3D view visually impressive (see [009](009-minesweeper-3d-visual-upgrade.md) for the full context, the confirmed visual style and the architect's feasibility check). 009 already shows a lost or won game as a static final board with its message ([009/AC5](009-minesweeper-3d-visual-upgrade.md)); this story adds the effects on top without changing that final state.

Confirmed by hak at gate 1 ("Ja, alle Vorschläge", 2026-11-02; see Decision log):

- **Loss:** an explosion effect (flash, particles and a short camera shake of at most 0.4 s) at the mine, the other mines then revealed one after another, whole effect at most 2.5 s.
- **Win:** a celebration (for example confetti or fireworks) of at most 4 s, no loop.
- **Safety:** nothing flashes more than 3 times in any second; the camera shake is included and is off under reduced motion.
- **No replay:** switching to 3D after a game has ended shows the final board without the effect.
- **No sound.** Large boards: effects shrink in size or number so the frame-rate floors of [009/AC3](009-minesweeper-3d-visual-upgrade.md) hold.
- The effects use the small seam the architect plans in 009's scene, so this story is additive. The same test approach applies as in 009: end-to-end tests run on software WebGL with the dev-only time probe, the frame-rate check is a script in headed Playwright on hak's Mac, and hak signs off a screen recording of at most 30 s at gate 2 (loss and win, light and dark).

## Acceptance criteria

- **AC1:** Given the 3D view and a running game, when I reveal a mine and lose, then an explosion effect (flash, particles and a camera shake of at most 0.4 s) plays at that mine, the other mines are then revealed one after another, the whole effect ends at the latest 2.5 s after the click in a static final board as in [005/AC9](005-minesweeper.md), the "lost" message and the stopped timer appear immediately and not after the effect, nothing flashes more than 3 times in any second, and when I start a new game with "Start" during the effect, then the effect stops at once; a preset alone only fills the fields ([006/AC2](006-minesweeper-presets-timer.md)).
- **AC2:** Given the 3D view and a running game, when I reveal the last safe cell and win, then a celebration (for example confetti or fireworks) plays over the board, ends at the latest 4 s after the click without looping, leaves the board readable and operable for "Start", the presets and the view control, the "won" message and the stopped timer appear immediately and not after the effect, nothing flashes more than 3 times in any second, and when I start a new game with "Start" during the celebration, then it stops at once; a preset alone only fills the fields ([006/AC2](006-minesweeper-presets-timer.md)).
- **AC3:** Given a game that has already ended (lost or won), when I switch to 3D (the view starts as 2D after a reload, [008/AC8](008-minesweeper-3d-mode.md), and the game does not survive a reload), then the static final board is shown without any explosion or celebration, also when the game ended while I was in 2D.
- **AC4:** Given I have set the system to reduce motion, when I lose or win in the 3D view, then there is no explosion, camera shake, particle or celebration animation, and the final board and the message appear immediately as a static picture in which the lost state (mines, exploded mine, wrong flags) and the won state (all mines flagged, counter 0) are clearly distinguishable.
- **AC5:** Given the 3D view on the reference machine (hak's Mac), when the explosion or the celebration plays on a 16 × 30 or a 30 × 30 board, then the frame-rate floors of [009/AC3](009-minesweeper-3d-visual-upgrade.md) hold during the effect (at least 50 fps on 16 × 30, at least 30 fps on 30 × 30), the effects being reduced in size or number on large boards rather than slowing the board down. (Verified by a script in headed Playwright on the reference machine; not part of CI.)

## Out of scope

- The scene, reveal and flag animations, loading and fallback: story [009](009-minesweeper-3d-visual-upgrade.md).
- Sound and music; settings to turn effects off (the system "reduce motion" setting is the only switch).
- A replay of the effect, scores, sharing or a leaderboard.
- Free camera control by the player.
- Any change to the 2D view, the rules or the timer.

## Open questions

None.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-02 — Story created by the split of [009](009-minesweeper-3d-visual-upgrade.md) at gate 1. hak's words on the split: "Ja, alle Vorschläge" (hak, gate 1) = accepted. The loss and win effects (old AC3 and AC4 of 009 and their reduced-motion part) moved here; the request line is the same verbatim in both stories. Depends on 009. (product-owner)
- 2026-11-02 — Q4 (of 009): Which effects and durations? Proposed: explosion with particles and a short camera shake (at most 0.4 s, whole loss effect at most 2.5 s), win celebration (at most 4 s), at most 3 flashes per second; does the shake go too far? — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed, camera shake included. Consequence: AC1, AC2, AC4.
- 2026-11-02 — Q5 (of 009): Sound? Proposed: none. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: Out of scope.
- 2026-11-02 — Q6 (of 009): Switching after the end? Proposed: switching to 3D after the game has ended shows the final board without replaying the effect. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: AC3.
- 2026-11-02 — Q7 and Q8 (of 009): Large boards, performance floor and reference machine? Proposed: effects shrink on large boards; at least 50 fps on 16 × 30 and at least 30 fps on 30 × 30. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed; reference machine is hak's Mac. Consequence: AC5.
- 2026-11-02 — Q11 (of 009): Sign-off at gate 2? Proposed: screenshots plus a screen recording of at most 30 s. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: Context; the UX design lists the states (explosion and celebration mid-effect and final, light and dark).
- 2026-11-02 — Architect feasibility check (via the coordinator), as recorded in 009: the effects use a small seam in the scene built in 009, so this story is additive; end-to-end tests use the dev-only time probe on software WebGL; the frame-rate check runs in headed Playwright on hak's Mac. Open questions none; status ready. (product-owner)

- 2026-11-03 — Start of the story after the platform split (011). — A: "ok, die Explosion und das Konfette hätte ich aber noch gern :)" (hak) = build 010 as approved at gate 1; the confetti wording means a confetti celebration is wanted for AC2. Consequence: story moves to design.
- 2026-11-04 — Gate 2: accept the look and the recording, apply all six retro proposals (incl. the AC1/AC2 wording on presets, behaviour unchanged), commit. — A: "Ja, alles" (hak, gate 2) = as proposed. Consequence: AC1/AC2 reworded; status done.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

Scope: what the player sees and feels when a 3D game ends: the explosion (AC1), the confetti celebration (AC2), the no-replay and reduced-motion pictures (AC3, AC4) and how they scale (AC5). Structure, copy, accessible names, live regions, rules and the timer of 005 to 009 are **unchanged**. "009 §n" refers to the UX design of [009](009-minesweeper-3d-visual-upgrade.md); its scene (tiles, glyphs, light, tokens in `src/tokens.css`) is the base and its units apply: **cell units** (1 = the DOM cell width at that moment), x right, y towards the far row, z up out of the board, camera 25 degrees off the board normal.

**What hak asked for, in one line:** "das soll graphisch was her machen" and now "die Explosion und das Konfetti hätte ich aber noch gern". So both effects are loud, readable at a glance and over quickly; the limits of the ACs (shake at most 0.4 s, loss at most 2.5 s, win at most 4 s, no loop, at most 3 flashes per second) are binding and kept with a margin of 300 to 400 ms. **All numbers are in section 5**; they are starting values that the developer calibrates by pixel sampling and by eye at the gate-2 stills (section 14). Contrast values were computed by hand with the sRGB formula (no shell available); the tester should re-check them with a tool. A value is "tight" when its margin is below 0.3.

### 1. Principles

- **Effects are decoration; the game is the DOM.** The lost or won message, the stopped timer, the counter and the cell names appear at click time 0 in the DOM exactly as in 009. Nothing waits for the effect, nothing announces the effect.
- **No new DOM, no new copy, no new control.** The effects live in the scene's canvas (`aria-hidden`, no pointer events) behind the transparent overlay grid. They can never cover the Start button, the presets, the View control or the status, because they never leave the canvas (the board and its rim).
- **One flash, and no strobe.** The whole game ends with exactly one luminance flash (the explosion bloom at t = 0 on a loss; none on a win). Mine reveals after the bang have no flash, confetti pieces change width when they turn, never colour or brightness. The camera shake is one decaying push, not a rattle (section 9).
- **Same final picture as 009.** The last frame of every effect is identical to the static lost or won board of 009 §4 (and to the reduced-motion picture): no particle, no offset, no leftover tile. That makes "ends at the latest at 2.5 s / 4 s" and "no replay" the same pixel check.
- **Cells, not pixels.** Sizes are in cell units so the effect scales with the board; the only pixel rules are minimums for the 26 px phone cell and a cap on the flash and shake (section 9, 12).
- **Deterministic.** All randomness is seeded (`gameId * 31 + cellIndex`), so the gate-2 stills and the tests are reproducible; time is the scene time of the probe (`pause()`, `holdSway(true)`, `advance(ms)`).
- **Light scheme is not a copy of dark.** Ivory tiles cannot get brighter than they are, so in light the bang reads through orange fire, dark smoke, a dark shock ring, flying shards and the shake; in dark it reads through glow (section 6).

### 2. Layout and component tree

Unchanged from 009 §2 (nothing is added to the DOM). New objects in the scene, all children of the effect host's `root` group, built once at scene creation and re-used (no allocation at the click):

```text
canvasHost (aria-hidden)
  scene
    ... table, tray, tiles, glyphs (009)
    effects.root
      loss:   bloom (1 billboard) + point light
              shockwave ring (flat) · fire puffs · sparks · shards (debris) · smoke puffs
              (puffs, sparks, smoke: one instanced quad mesh each; shards: one instanced mesh)
      win:    confetti rectangles · dots · ribbons (3 instanced meshes, one per shape)
```

Everything in `effects.root` is unlit (`MeshBasicMaterial`, `toneMapped: false`) except the shards, which use the tile material colour so they look like pieces of the tile; nothing in `effects.root` casts or receives shadows (keeps the shadow pass at the 009 cost, AC5). The overlay grid with its focus ring is DOM above the canvas, so the focus ring is always on top of every particle.

### 3. Explosion on loss (AC1), timeline from the click (t = 0)

The player reveals a mine. At t = 0 the game state is `lost`: message, timer stop, counter and cell names change in the DOM; the scene gets the new state with the clicked cell as origin.

| t (ms)       | What happens                                                                                                                                                                                                                                                                                   | Look                                         |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 0            | The clicked hidden tile is **blown off**: its instance disappears, the pit (revealed block with the danger-bg top) is there at the first frame, hidden by the bloom. No flip for this cell. Bloom, shake, shockwave, fire puffs, sparks and shards start in the same frame.                    | The tile bursts into 8 shards                |
| 0 to 280     | **Flash**: a warm bloom billboard at the mine, diameter 1 to 4 cells in 90 ms, peak alpha at 50 ms, linear decay to 0 at 280 ms. In dark a point light lights the neighbours for 400 ms.                                                                                                       | One bright pop, once                         |
| 0 to 400     | **Shake**: the camera is pushed away from the mine and settles (translation only, one cycle, decaying), section 9.                                                                                                                                                                             | A hard shove, no wobble                      |
| 0 to 450     | **Shockwave**: a flat ring on the board grows from 0.4 to 3.5 cells and fades. Hidden tiles within 3 cells jump up as it passes (section 5, L9).                                                                                                                                               | Ripple through the tiles                     |
| 0 to 600     | **Fireball**: 12 puffs rise and grow, colour by age core (yellow) to mid (orange) to edge (red).                                                                                                                                                                                               | A fireball about 2.4 cells across            |
| 0 to 900     | **Sparks** (40 streaks, outward and up, gravity) and **shards** (8 pieces of tile in the tile colour, tumbling, falling back into the pit or onto the tiles, vanishing on touch).                                                                                                              | Embers and debris                            |
| 250 to 1700  | **Smoke**: 8 puffs rise slowly and fade.                                                                                                                                                                                                                                                       | Grey column over the pit                     |
| 300 to 500   | The exploded cell's **disc, ring and flat mine** (009 §4.4) pop in, scale 0.6 to 1 with overshoot, out of the fire.                                                                                                                                                                            | The danger marker of the final board         |
| 550 to 1550  | **Chain**: the other mines are revealed one after another, nearest to the exploded cell first. Step 90 ms, at most 1 000 ms for the whole chain (more mines means shorter steps, on 30 × 30 several mines in one frame). Each uses the 009 flip at 200 ms and a tiny smoke puff, **no flash**. | The explosion spreads outward over the board |
| 1650 to 1900 | **Wrong flags** (a flag on a safe cell) get their slash, one after another (nearest first, spread over at most 250 ms), the slash draws on with a little overshoot in 200 ms. Correctly flagged mines stay as flags, as in the static board.                                                   | The flags are marked wrong                   |
| 2100         | Last motion ends (latest case: 1 000 ms chain plus wrong flags).                                                                                                                                                                                                                               |                                              |
| 2200         | **Effect ends.** Every particle, shard and offset is removed; the board is the static lost board of 009 (shaded mines, exploded mine, wrong flags). 300 ms before the AC limit.                                                                                                                | Static                                       |

Pacing note for the calibration: the **first 450 ms carry the drama** (flash, shake, ring, fireball, shards all in the first frames); after that the chain keeps a steady rhythm so a player can follow it; the last 700 ms are quiet so the final board is calm when it is reached. With fewer than 12 mines the chain is shorter (step 90 ms), so a 9 × 9 board with 10 mines ends its motion at about 1 700 ms.

### 4. Confetti on win (AC2), timeline from the click (t = 0)

The player reveals the last safe cell. At t = 0 the game state is `won`: message, timer stop and counter in the DOM at once. The 009 reveal (flip or wave, at most 1 000 ms) and the flag planting run as before; the celebration starts on top of them in the same frame.

| t (ms)       | What happens                                                                                                                                                                                                                                                     | Look                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 0 to 120     | **Two confetti cannons** at the lower left and lower right corner of the visible part of the board fire 35 % of the pieces up and 30 degrees inward; drag slows them, they bloom and then flutter down.                                                          | A pop from both bottom corners         |
| 150 to 1250  | **Confetti rain**: the other 65 % of the pieces start just above the top edge of the visible part, spread over its width and over time, and fall with a sideways flutter.                                                                                        | Colourful paper falling over the board |
| 1000 to 2400 | **Flag hop wave**: the planted flags in the visible part hop one after another, outward from the clicked cell (0.22 cell up and down in 300 ms each, spread over 1 100 ms). It is the "all mines found" cue; it starts after the 009 reveal has certainly ended. | The flags dance                        |
| until 3500   | Each piece leaves through the bottom of the visible part, or is scaled to nothing between 3 200 and 3 500 ms.                                                                                                                                                    | Last pieces trickle out                |
| 3600         | **Effect ends.** No piece is left; the board is the static won board of 009 (all mines flagged, counter 0). 400 ms before the AC limit.                                                                                                                          | Static                                 |

- **No camera shake and no flash on a win**; the sway continues as in 009.
- **Shapes**: three, each one instanced mesh: **rectangles** (paper, 0.26 x 0.16 cell, 45 %), **dots** (0.16 cell across, 30 %), **ribbons** (thin streamers, 0.40 x 0.06 cell, 25 %). Flat, double-sided, **the same colour on both sides**, unlit. A turning piece changes only its apparent width, so nothing flickers.
- **Colours** are six tokens (section 6): blue, green, red, purple, gold and pink; gold is drawn most often (25 %), the others 15 % each.
- **Motion per piece** (all seeded): spin about its long axis 0.6 to 1.2 turns per second, a slow tumble in the screen plane, sideways flutter of plus or minus 0.5 cell at 0.7 to 1.3 Hz, depth jitter of plus or minus 1.5 cells in front of the board (z above 0.6, so tiles and flags never hide a piece, and pieces get a little parallax). Pieces move in the screen-parallel plane (rotated back by `TILT_DEG` like the 009 slash), so "down" is down on screen.
- **Covering and readability**: pieces are small and sparse; target at most 6 % of the visible board pixels covered on average and 12 % at the busiest frame, so digits, flags and the focus ring stay readable all the time. The cannons and the rain never hide the same corner for more than the first 400 ms.
- **Not over the controls**: the pieces exist only inside the canvas (the board and its rim). The Start button, presets, View control and status are outside the canvas and are never covered.

### 5. Numbers (the one table to calibrate)

Scheme-independent numbers live in one constants module of the effects (named constants, one place); the three scheme-dependent numbers are `--scene-fx-*` tokens (section 6). "Start" values are starting points; the "Calibrate" column says what to sample.

| ID  | What                               | Start value                                                                                                                                                                                                                    | Limit it must keep                           | Calibrate by                                                                                             |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| G1  | Loss effect end                    | 2 200 ms                                                                                                                                                                                                                       | at most 2 500 ms (AC1)                       | frame at 2 200 ms equals the static lost board                                                           |
| G2  | Win effect end                     | 3 600 ms                                                                                                                                                                                                                       | at most 4 000 ms (AC2)                       | frame at 3 600 ms equals the static won board                                                            |
| G3  | Hidden tab ends the effect         | none, no frame-gap rule: `visibilitychange` to hidden ends a running effect at once (updated after review round 1)                                                                                                             | no catch-up replay after a hidden tab        | hide the tab for 3 s during an effect, return: static board; a slow frame does not end it                |
| G4  | Seed                               | `gameId * 31 + cellIndex`                                                                                                                                                                                                      | same stills every run                        | two runs, pixel-identical stills at the same probe time                                                  |
| L1  | Bloom                              | 0 to 280 ms; diameter 1 to 4 cells in 90 ms, on screen at most 150 px; peak alpha at 50 ms = `--scene-fx-flash-alpha`; linear fade                                                                                             | one flash; area at most 20 % of 341 x 256 px | mean luminance of the board shows one rise and one fall                                                  |
| L2  | Flash light                        | point light 0.8 cell above the mine, reach 6 cells, `--scene-fx-light-intensity`, peak 40 ms, 0 at 400 ms                                                                                                                      | dark only (light value 0)                    | neighbour tiles lit warm for about 0.4 s, no clipping of the unlit glyphs                                |
| L3  | Shake                              | 0 to 400 ms; amplitude 0.18 cell (peak about 0.14 cell), on screen peak 3 to 5 px; 2.5 Hz, one cycle, linear decay                                                                                                             | at most 400 ms (AC1), translation only       | peak offset of a tile in the still sequence, 3 to 5 px                                                   |
| L4  | Shockwave ring                     | 0 to 450 ms; radius 0.4 to 3.5 cells (ease-out); width 0.25 to 0.05 cell; opacity 0.6 to 0; flat at z = +0.2                                                                                                                   |                                              | ring visible as a clean circle at 180 ms, gone at 450 ms                                                 |
| L5  | Fire puffs                         | 12; start 0 to 120 ms; life 350 to 600 ms; diameter 0.8 to 2.4 cells; rise 1.5 to 3 cells/s; colour core to mid to edge by age; alpha 1 to 0 in the last 40 %                                                                  |                                              | fireball reads as fire (not a flat disc) at 180 ms                                                       |
| L6  | Sparks                             | 40; streak 0.05 x 0.18 cell (at least 2 px wide); speed 6 to 10 cells/s, up and outward; gravity 18 cells/s2; life 500 to 900 ms; core to mid colour; scale to 0 in the last 30 %                                              |                                              | embers arc and fall, none left after 1 000 ms                                                            |
| L7  | Shards                             | 8; 0.18 to 0.30 cell; speed 5 to 8 cells/s, 20 to 55 degrees off vertical; spin 1 to 3 turns/s; gravity 20 cells/s2; vanish on touch or at 1 200 ms (120 ms scale-out); colour `--scene-tile-top`                              |                                              | shards visibly tile-coloured in both schemes, none after 1 300 ms                                        |
| L8  | Smoke                              | 8; start 250 ms; life 1 000 to 1 400 ms; diameter 0.8 to 2.2 cells; rise 0.8 cell/s; peak alpha `--scene-fx-smoke-alpha`, end at 1 700 ms                                                                                      |                                              | neighbouring digits are still readable at 900 ms (smoke over a digit lowers contrast but never hides it) |
| L9  | Tile shudder                       | hidden tiles within 3 cells jump `0.10 * (1 - d / 3)` cell when the ring arrives (`d / 8` s), 260 ms ease-out up and back                                                                                                      | boards up to 256 cells and level 0 only      | looks like a pressure wave, not like the 009 wave                                                        |
| L10 | Exploded marker                    | disc, ring and flat mine pop in at 300 ms (disc and ring) and 350 ms (mine), scale 0.6 to 1, overshoot parameter 1.4, 200 ms                                                                                                   | final = 009 §4.4                             | marker settled by 600 ms                                                                                 |
| L11 | Chain                              | start 550 ms; length `min(1 000, (n - 1) * 90)` ms; nearest first; per mine the 009 flip at 200 ms; 2 smoke puffs, diameter 0.5 to 1.0 cell, 350 ms, only for the first 40 mines; **no flash, no light**                       | 150 to 400 ms flip (009 AC2 range)           | step reads as a rhythm on 9 × 9, as a sweep on 30 × 30                                                   |
| L12 | Wrong flags                        | start `chain end + 100` ms; spread at most 250 ms, nearest first; slash draws on (scale along its length 0 to 1, overshoot 1.4, 200 ms)                                                                                        |                                              | all slashes drawn by 2 100 ms                                                                            |
| W1  | Cannons                            | 2, at the lower corners of the visible part, 0.5 cell inside; 35 % of N in 0 to 120 ms; 30 degrees inward; speed `clamp(2.4 * H, 10, 26)` cells/s with H = visible rows; drag 3 per second                                     |                                              | pieces reach about 80 % of the visible height and turn over                                              |
| W2  | Rain                               | 65 % of N; start between 150 and 1 250 ms at a line 1.5 cells above the visible top, over the width plus 1 cell each side; fall speed `clamp((H + 2) / 2.2, 4.5, 14)` cells/s; flutter plus or minus 0.5 cell at 0.7 to 1.3 Hz |                                              | every piece crosses the window in at most 2.2 s                                                          |
| W3  | Piece size and spin                | rectangle 0.26 x 0.16 cell, dot 0.16 cell, ribbon 0.40 x 0.06 cell; on screen at least 6 x 4 px, 4 px and 9 x 2 px; spin 0.6 to 1.2 turns/s                                                                                    |                                              | readable as confetti at 375 px                                                                           |
| W4  | Piece count N                      | `clamp(round(2.5 * visibleCells), 160, 320)`; boards of 400 cells and more: times 0.7                                                                                                                                          | coverage at most 6 % average, 12 % peak      | coloured pixels in the board area at 700 ms and 1 200 ms                                                 |
| W5  | Piece end                          | leaves at 1.5 cells below the visible bottom, or scale-out between 3 200 and 3 500 ms                                                                                                                                          | no piece after 3 600 ms                      | nothing coloured left at 3 600 ms                                                                        |
| W6  | Flag hop wave                      | start 1 000 ms; flags in the visible part only; order by distance from the click, spread over 1 100 ms; hop 0.22 cell, 150 ms up (ease-out) and 150 ms down (ease-in); ends by 2 400 ms                                        | not at quality level 2                       | flags hop one after another, not all at once                                                             |
| S1  | Board scaling                      | cells at most 256 (up to 16 × 16): effect times 1; 257 to 600 (16 × 30): puffs, sparks, shards, smoke times 0.75, no shudder, chain puffs for 20 mines; more than 600 (30 × 30): times 0.5, shards 4, chain puffs for 10 mines | fps floors 50 and 30 (AC5)                   | headed script on the Mac, median fps during the effect                                                   |
| S2  | Quality level 1 / 2 (009 governor) | level 1: particle counts times 0.6, no shudder, no point light; level 2: times 0.3, 3 shards, chain in 4 distance bands, no smoke, no hop wave, flips as sink only                                                             | still looks intentional                      | force level 2 once and look at the still (evidence)                                                      |

Numbers that scale with the screen: shake peak 3 to 5 px, bloom at most 150 px, minimum piece sizes (W3). Everything else is in cells.

### 6. Colours (light and dark), tokens and contrast

New tokens, in `:root` and in the dark block of `src/tokens.css` (parity test applies; opaque 6-digit hex; the three numbers are unitless like the other `--scene-*` look numbers, section 14.1 of 009). The fire colours are the same in both schemes on purpose (fire is fire); the flash, smoke and confetti differ.

| Token                        | Light     | Dark      | Use                                                                                                          |
| ---------------------------- | --------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| `--scene-fx-flash`           | `#ffb43a` | `#fff1c2` | bloom and flash light (warm orange in light, warm white in dark)                                             |
| `--scene-fx-fire-core`       | `#ffd54a` | `#ffd54a` | fire puffs young, sparks start                                                                               |
| `--scene-fx-fire-mid`        | `#ff7a1a` | `#ff7a1a` | fire puffs middle age, sparks late                                                                           |
| `--scene-fx-fire-edge`       | `#d93a0b` | `#d93a0b` | fire puffs old                                                                                               |
| `--scene-fx-smoke`           | `#4a4540` | `#a8a39c` | smoke puffs, shockwave ring and chain puffs (dark smoke in light, light grey in dark)                        |
| `--scene-confetti-1`         | `#2f7bf0` | `#8ab4f8` | blue                                                                                                         |
| `--scene-confetti-2`         | `#2fa24f` | `#81c995` | green                                                                                                        |
| `--scene-confetti-3`         | `#e5392f` | `#f28b82` | red                                                                                                          |
| `--scene-confetti-4`         | `#9b4fe0` | `#c58af9` | purple                                                                                                       |
| `--scene-confetti-5`         | `#c98a00` | `#ffd54a` | gold (drawn most often)                                                                                      |
| `--scene-confetti-6`         | `#e0449b` | `#f48fb1` | pink                                                                                                         |
| `--scene-fx-flash-alpha`     | 0.85      | 0.70      | peak opacity of the bloom                                                                                    |
| `--scene-fx-smoke-alpha`     | 0.40      | 0.35      | peak opacity of smoke (the ring uses 0.6 from L4)                                                            |
| `--scene-fx-light-intensity` | 0         | 1.5       | flash point light (times pi in r187); 0 in light because the lit tiles are already near white and would clip |

Debris uses the existing `--scene-tile-top`; nothing else new.

**Why the confetti differ per scheme.** In light the surfaces are very bright (revealed top luminance 0.81, ivory 0.86) and the table rim is dark stone (0.06): pieces must be mid-bright (luminance 0.18 to 0.31) to show against both, so they are mid-tone saturated colours, not the dark digit colours (the digit blue `#0b57d0` would be 1.5:1 on the rim). In dark every surface is near black (revealed 0.005, tile 0.042, table 0.020), so the pastel digit colours (`--n1`, `--n2`, `--n3`, `--n4`) are reused as hex values for the confetti, plus gold and pink.

Contrast of the new colours (hand-computed; decoration, so no AA requirement; the rule is "visible on every surface it crosses"; minimums per row are what the design promises):

| Colour (light)          | on ivory tile | on revealed top | on table rim    | Colour (dark)       | on tile top | on revealed top | on table rim |
| ----------------------- | ------------- | --------------- | --------------- | ------------------- | ----------- | --------------- | ------------ |
| flash `#ffb43a`         | 1.5 (tight)   | 1.5 (tight)     | 5.3             | flash `#fff1c2`     | 10.1        | 16.8            | 13.3         |
| fire core `#ffd54a`     | 1.2 (tight)   | 1.2 (tight)     | 6.6             | fire core `#ffd54a` | 8.1         | 13.5            | 10.6         |
| fire mid `#ff7a1a`      | 2.3           | 2.1             | 3.6             | fire mid `#ff7a1a`  | 4.4         | 7.3             | 5.8          |
| fire edge `#d93a0b`     | 4.0           | 3.8             | 2.0             | fire edge `#d93a0b` | 2.5         | 4.1             | 3.3          |
| smoke `#4a4540`         | 8.2           | 7.8             | 1.0 (invisible) | smoke `#a8a39c`     | 4.6         | 7.6             | 6.0          |
| confetti blue `#2f7bf0` | 3.5           | 3.3             | 2.3             | blue `#8ab4f8`      | 5.4         | 9.0             | 7.1          |
| green `#2fa24f`         | 2.8           | 2.7             | 2.9             | green `#81c995`     | 5.8         | 9.7             | 7.7          |
| red `#e5392f`           | 3.7           | 3.5             | 2.2             | red `#f28b82`       | 4.8         | 8.0             | 6.3          |
| purple `#9b4fe0`        | 4.0           | 3.8             | 2.0             | purple `#c58af9`    | 4.6         | 7.6             | 6.0          |
| gold `#c98a00`          | 2.6           | 2.4             | 3.2             | gold `#ffd54a`      | 8.1         | 13.5            | 10.6         |
| pink `#e0449b`          | 3.3           | 3.2             | 2.4             | pink `#f48fb1`      | 5.1         | 8.5             | 6.7          |

How the weak pairs are carried (the effect never conveys state, the message and the final board do):

- **Light, flash and fire core on light tiles (1.2 to 1.5):** a bright orange pop cannot be brighter than ivory. The bang is carried by the saturated orange and red of the fireball (2.1 to 4.0), the dark smoke and the dark shock ring (7.8 to 8.2), the flying shards, the shake and the tile shudder. The point light is 0 in light for the same reason. Gate-2 look check: the bang must read as an explosion in light as well (section 14, stills 2 to 4).
- **Light, smoke on the table rim (1.0):** the smoke is meant to hang over the board; where it drifts over the rim it disappears, which is fine.
- **Light, confetti on the table rim (2.0 to 3.2):** the lowest is purple and red at 2.0 to 2.2; mid-tone by design, together with the six-colour mix and 6 x 4 px size they stay visible; a darker piece would vanish on the board, a lighter one on the tiles.
- **Dark, fire edge on the tile (2.5):** the fire has three colours and the bloom, so the edge ring is only the outline of the fire.

### 7. States

| View / element          | State                                                            | What the user sees and can do                                                                                                                                                                                                                                                          |
| ----------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3D board                | running                                                          | as 009; nothing of this story is visible                                                                                                                                                                                                                                               |
| 3D board                | loss effect (0 to 2.2 s)                                         | sections 3, 5; message "You lost. You revealed a mine." and the stopped timer already there; board read-only (009); Start, presets and View control operable                                                                                                                           |
| 3D board                | lost, final                                                      | static lost board (009 §4.3 to 4.5) with the message; the sway continues                                                                                                                                                                                                               |
| 3D board                | win celebration (0 to 3.6 s)                                     | sections 4, 5; message "You won! Every safe cell is revealed." and the stopped timer already there; board readable; Start, presets and View control operable                                                                                                                           |
| 3D board                | won, final                                                       | static won board (all mines flagged, counter 0); the sway continues                                                                                                                                                                                                                    |
| 3D board                | Start pressed during an effect (updated at gate 2)               | the effect stops **in that frame**: `effects.clear()`, every particle, shard and the shake offset are gone before the first frame of the new board; the new board is the normal fresh 3D board (AC1, AC2). A preset alone only fills the fields and does not stop the effect (006/AC2) |
| 3D board                | switch to 2D during an effect                                    | the scene is detached, the effect is gone; switching back later shows the static final board (AC3)                                                                                                                                                                                     |
| 3D board                | switch to 3D after the game ended (also if it ended in 2D)       | static final board, no effect, nothing played (AC3). The effect only starts from a transition (`prev` was running, `next` is lost or won) while the 3D scene is shown                                                                                                                  |
| 3D board                | reduced motion                                                   | no effect at all: the final picture appears at once (section 10)                                                                                                                                                                                                                       |
| 3D board                | forced colours                                                   | canvas hidden, so no effect; the 2D forced-colours final board at once (section 11)                                                                                                                                                                                                    |
| 3D board                | hidden tab during an effect                                      | the effect ends at once when the tab is hidden (`visibilitychange`); on return the static final board is shown, it does not replay. A slow frame does not end it (updated after review round 1)                                                                                        |
| 3D board                | colour scheme or reduced-motion setting changes during an effect | the effect ends at once and the board is the static final board in the new scheme (rare; avoids re-colouring live particles)                                                                                                                                                           |
| 3D board                | rendering context lost during an effect                          | as 009 AC6: back to 2D with the notice; the effect is gone                                                                                                                                                                                                                             |
| 3D board                | quality level 1 or 2                                             | smaller effect (S2), no visible message                                                                                                                                                                                                                                                |
| Empty / loading / error | none new                                                         | no loading, empty or error state is added; the effect cannot fail visibly (if anything throws in the effect, the scene shows the static final board, never an error page, no message)                                                                                                  |

### 8. Interactions

- **Nothing new to operate.** No control, no tab stop, no setting to turn effects off (out of scope; the system "reduce motion" is the switch).
- **During an effect** every control works as before: Tab and Shift+Tab, Start and presets (updated at gate 2: only Start stops the effect, section 7; a preset alone only fills the fields and leaves the effect running, 006/AC2), the View control, the form fields. The board is read-only after the end (009), so a click or key on it does nothing and does not stop the effect. Focus is never moved by an effect: after the losing click or the winning key press focus stays on the activated cell; after Start the existing behaviour applies.
- **Pointer events**: canvas and all particles have none; clicks pass through to the DOM as before.
- **Scrolling a large board** during the effect works as usual; particles are part of the scene and scroll with the board (they are placed where the visible part was at the start, section 12).

### 9. Safety: flashes, shake, motion

- **Flashes (AC1, AC2).** One flash per game end at most: the loss bloom of 280 ms (L1), nothing on a win. There is no second flash in any window: the mine chain, the sparks and the smoke have no luminance pulse, the point light of the flash fades smoothly, confetti pieces never change brightness (same colour on both sides). The bloom is capped at 150 px on screen (about 20 % of the 341 x 256 px reference window of the WCAG general-flash rule) and fades in 280 ms. A test proxy: the mean luminance of the board over the frames of the effect shows at most one rise of 10 % or more and one fall; the tester picks the frames (every 33 ms of scene time).
- **Shake (AC1).** One decaying push of 0.4 s in the screen plane, 3 to 5 px at its peak, about 2.5 Hz, one cycle: no rotation, no zoom, no repeated rattle. It is added to the sway offset in the same place (the overlay grid follows the camera as for the sway, so the focus ring stays on its tile; if the overlay does not follow, the ring is off by at most 5 px for 0.4 s, accepted). Under reduced motion it does not exist.
- **Duration and WCAG 2.2.2.** The win effect is 3.6 s and the loss 2.2 s, both under the 5 s of "pause, stop, hide" and never looping; reduced motion removes both.
- **The canvas edge** is never exposed by the shake: the table plane extends past the canvas and the renderer clear colour is `--scene-table`, so a shifted view shows plain table.

### 10. Reduced motion (AC4): the two final pictures

With reduced motion no effect is started: no flash, shake, particle, shard, hop or confetti. At click time the game state is lost or won and the scene shows at once the **same static board as the end of the animated effect**:

- **Lost picture** (as 009 §4.3 to 4.5, nothing added): every unflagged mine as a shaded mine on the revealed floor, the exploded mine with its danger-bg tile, solid red disc and ring and the flat white mine (the only red disc on the board), wrong flags (flag with the black slash), correctly flagged mines still flagged (005/AC9), remaining safe cells as they were; message "You lost. You revealed a mine.".
- **Won picture**: no mine glyph, no disc, no slash; every mine cell carries a flag with a red cloth (the unflagged ones were flagged automatically, 005/AC10); counter 0; message "You won! Every safe cell is revealed.".
- **How they differ at a glance** (for the AC4 pixel check, the tester picks the points): lost has a `--color-danger-solid` disc at the clicked cell and mine glyphs; won has none of them but a red flag on every mine cell. The two are distinguishable by shape alone; the message and its icon (cross against check) say it again.

### 11. Forced colours

Unchanged from 009 §12: the canvas host is `display: none` and the scene is inactive, so no effect is drawn and nothing is started; the 2D forced-colours look of the final board and the message (system colours, icon and bar) appear at once, exactly as in reduced motion. No forced-colours rule is needed in this story. The effects add no DOM, so there is nothing to give a `ButtonText` border.

### 12. Responsive behaviour and scaling (below 600 px, large boards)

- **375 px, 9 × 9** (cell 33.5 px, canvas about 300 px): everything in cells, so the fireball is about 80 px across, the bloom 134 px (under the 150 px cap), the shake 3 to 5 px, rectangles about 9 x 5 px, dots 5 px. The cannons are at the bottom corners of the 300 px canvas; the rain falls over the whole board.
- **320 px, 9 × 9** (cell 26.75 px): the same, minimum piece sizes (6 x 4 px, 4 px, 9 x 2 px) apply; sparks at least 2 px.
- **375 px, 16 × 16, 16 × 30, 30 × 30**: the board scrolls in its own box, cell 26 px. The explosion happens where the mine is (it may be scrolled out of view: then only the shake and the chain on the visible part are seen; accepted, the message is always in view above the board). Confetti uses the **visible part of the board** as its window (scroll position and box size read when the game is won): H is the visible rows, N from W4, so a 30 × 30 board scrolled to a corner still gets a full celebration in front of the player and not spread over a board of 900 cells.
- **Large boards** (S1): counts shrink, sizes stay in cells (the 26 px cell floor keeps them legible); shudder and hop wave are limited. The fps floors (50 and 30) have priority over the look; the governor (S2) cuts further.
- **Phones** get no fps number; the governor reduces effects automatically with no message.
- **Zoom 200 %**: the page layout is as 009; the effect stays inside the canvas.

### 13. Accessibility

- **Screen readers get nothing new.** The canvas host is `aria-hidden`, the canvas has no role, tab stop or text. The existing announcements stay exactly as they are and at the same moment (click time 0): the result message in `GameStatus` (`You lost. You revealed a mine.` or `You won! Every safe cell is revealed.`, with the existing visually hidden final time for the win), the counter, the stopped timer final value, the changed cell names. **No new live region, no `role`, no announcement** such as "Explosion", "Mines revealed" or "Confetti": they would only talk over the real result. The effect cannot delay or replace them because they come from the DOM, not from the scene.
- **Focus** is unchanged and visible: the 009 focus ring (2 px plus the halo sandwich) is a DOM element above the canvas, so it is above every particle and shard; the pieces never reduce its contrast because the halo lines sit on both sides of the ring. Focus does not move during or after an effect.
- **Keyboard**: every control reachable and operable as before; Start and the View control stop the effect; a preset alone does not (updated at gate 2); nothing needs a pointer.
- **Colour and contrast (WCAG 2.2 AA)**: the effects are decoration; no text or state is conveyed by them. The glyph contrast rules of 009 hold in the final pictures (the effect is gone). While smoke or confetti is over a digit, its contrast may drop briefly; this is allowed because the smoke is over at 1.7 s on a lost (finished) game and confetti covers at most 6 % of the board (W4). The one information-carrying result (message, icon, bar, final board) is unchanged.
- **Motion and seizures**: one flash at most (section 9), shake of one cycle with a few pixels, no looping, both effects end by themselves under the 4 s the AC asks for; reduced motion removes all of it; forced colours shows none.
- **Pointer and touch**: no hover or press cues are added.

### 14. Gate-2 package: screenshots and recording

Set-up as 009 §16: guest sign-in, dev server in mode `e2e`, fixed mine layouts, 9 × 9 unless noted, DPR 2, headed Chromium on hak's Mac with the real GPU, light and dark for every still (`emulateMedia({ colorScheme })`), 800 px wide unless noted, probe `pause()`, `holdSway(true)`, `advance(ms)`, seeded. t is the time after the click. M = must be in the gate-2 package, E = evidence only. Every M still exists in light and dark.

| #   | State                                                                                                                  | Why                               |     |
| --- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------- | --- |
| 1   | Loss, before the click: 9 × 9 with three flags (one wrong), mine under the cursor                                      | the baseline                      | M   |
| 2   | Loss at t = 60 ms (bloom at peak), 180 ms (fireball, ring, shards), 400 ms (end of shake)                              | the bang                          | M   |
| 3   | Loss at t = 900 ms (chain halfway) and 1 750 ms (wrong flags drawing)                                                  | the chain and the wrong flags     | M   |
| 4   | Loss at t = 2 300 ms: the static lost board with the message                                                           | final picture equals 009 stills 6 | M   |
| 5   | Win, before the click: 9 × 9, one safe cell left                                                                       | baseline                          | M   |
| 6   | Win at t = 150 ms (cannons), 700 ms (rain, densest), 1 400 ms (hop wave), 2 400 ms (last hops), 3 300 ms (last pieces) | the celebration                   | M   |
| 7   | Win at t = 3 700 ms: the static won board with the message                                                             | final picture equals 009 stills 7 | M   |
| 8   | 375 px: loss at 180 ms and 900 ms on 9 × 9; win at 700 ms on 9 × 9                                                     | phone                             | M   |
| 9   | 16 × 30 at 800 px: loss at 1 200 ms and win at 1 500 ms (scroll box, scrolled to the middle)                           | large board, the visible window   | M   |
| 10  | 30 × 30 at 375 px scrolled to a corner: win at 1 500 ms                                                                | smallest cells, biggest board     | M   |
| 11  | Reduced motion: lost board and won board immediately after the click (t = 0)                                           | AC4                               | M   |
| 12  | Switch to 3D after a lost game and after a won game (the game ended in 2D)                                             | AC3, no replay                    | M   |
| 13  | Focus ring on a cell during the win at 700 ms (the ring above the confetti)                                            | ring stays visible                | E   |
| 14  | Start pressed 400 ms into a win and 300 ms into a loss, next frame of the new board                                    | stops at once                     | E   |
| 15  | Forced colours (emulated) after a loss and a win                                                                       | no effect, 2D look                | E   |
| 16  | Quality level 2 forced: loss at 900 ms on 16 × 30                                                                      | still looks intentional           | E   |

**Screen recording, at most 30 s, one take, 1280 × 800, headed, mouse pointer visible, light first.** Every pause at least 1 s so the eye can follow; no overlays, no sound. Layouts come from the fixtures (loss: a mine layout with ten mines and a wrong flag; win: a one-mine layout, a corner click opens nearly everything).

| Time           | Action                                                  | What the viewer sees                         |
| -------------- | ------------------------------------------------------- | -------------------------------------------- |
| 0 to 1 s       | Running 9 × 9 in 3D, light, three flags                 | calm baseline                                |
| 1 to 6 s       | Click a mine, hold 3 s after the effect                 | the bang, the chain, the final lost board    |
| 6 to 7.5 s     | Start; click the corner of the one-mine layout          | a nearly open board                          |
| 7.5 to 13.5 s  | Click the last safe cell, hold 2 s after the effect     | the confetti, the flag hop wave, final board |
| 13.5 to 14.5 s | Emulate the dark scheme, hold 1 s                       | scene re-lit in dark                         |
| 14.5 to 19.5 s | Start, click a mine, hold 2 s                           | the dark bang                                |
| 19.5 to 26 s   | Start, corner click, click the last safe cell, hold 2 s | the dark confetti                            |
| 26 to 30 s     | Start with the 16 × 30 preset, click a mine, hold       | the effect on a large board                  |

If the take is over 30 s, drop the last row (it exists as still 9). A separate clip of at most 5 s with reduced motion (E) and one with Start pressed during an effect (E) may be added; they count outside the 30 s only if hak asks for them. The tester trims to at most 30 s and attaches stills and clip to the Test report.

### 15. Points for the architect and the product owner (nothing here changes an AC)

1. **Visible window for the confetti.** W1, W2 and W4 need the visible part of the board (scroll offsets and box size of the scroller at the moment of the win). The hook for the effect (`SceneTransition`) needs it, or the scene gets it at `attach` and on scroll. Without it a 30 × 30 board gets a thin cloud spread over 900 cells.
2. **Palette.** New colour keys (flash, fire core, mid, edge, smoke, six confetti colours) and three numbers (`SceneLook`: flash alpha, smoke alpha, light intensity) from `readPalette`; the tokens test needs the new tokens in its parity scan, the numbers skipped in the hex and contrast scans. No contrast pair is asked for (decoration).
3. **Clicked cell.** The exploded cell skips the 009 flip: the hidden tile is removed at t = 0 (an instance hidden or matrix collapsed), the pit is the revealed block; shards are separate meshes in the tile colour.
4. **Time and seed.** Effects take the scene time given to `update(nowMs)` (the probe controls it) and a seeded random generator (G4). A hidden tab (`visibilitychange`) ends a running effect at once; a slow frame does not (the effects follow the scene clock, G3, updated after review round 1). A scheme or reduced-motion change calls `clear()` and shows the final board.
5. **Pre-warm.** Build geometry, materials and instance buffers for the effects at scene creation (idle), and compile their shaders before the first click (`renderer.compile`); a shader compile at the first mine would eat the 2.5 s budget and the 009 frame-rate floor on the first loss.
6. **Shake and overlay.** The shake offset goes through the same path as the sway, so the overlay follows (section 9); if that is costly, the 5 px offset of the focus ring on a read-only board for 0.4 s is accepted.
7. **Flash proxy.** Section 9 gives the pixel proxy; the tester may pick other sample points but not a looser rule.
8. **For the product owner.** Two additions go beyond the words of the ACs but stay inside them: the **tile shudder** near the mine (L9) and the **flag hop wave** on a win (W6), both decoration, both dropped on large boards and at quality level 2. A scheme or reduced-motion change during an effect, a hidden tab and a lost context end the effect at once (section 7); this was not in the ACs and is the safest reading of "no replay". In the light scheme the bang is carried by smoke, ring and shards more than by glow (section 6); if hak finds it too weak at gate 2, the first knob is `--scene-fx-flash-alpha` and the second a darker `--scene-fx-fire-edge`.

### 16. Superseded parts of 009's UX design (009 stays done)

- 009 §8 rows "Board 3D | won / lost | ... (no effect here, story 010 adds it)": the transition into the final board now plays the effect of sections 3 and 4; the final state itself is unchanged.
- 009 §16 recording row "27 to 30 s ... static lost board and message (no effect: story 010)": the recording of this story (section 14) shows the effects.
- 009 §5.4 "the sway ... not paused during animations": unchanged; the shake is added on top of it for 0.4 s.

## Technical design

_architect, 2026-11-03. No new dependency and no new ADR: [ADR 0005](../adr/0005-three-js-board-scene-with-dom-overlay.md) already fixes "story 010 adds effects through the scene's effect host and transition hooks; no change to this decision". Builds on the seam of [009](009-minesweeper-3d-visual-upgrade.md) (`effects.ts`, `timeline.ts`, `probe.ts`, `quality.ts`). The UX section was written in parallel; it is read and reconciled in "Alignment with UX" at the end. All paths below are under `apps/minesweeper/`._

### Approach in one paragraph

The end of a game is a **phase change in the reducer** (`playing → lost | won`), which already reaches the scene as `scene.update(game, origin)` with the previous state still held by the controller. Two kinds of things then happen, and they are kept apart on purpose. **Cell-bound motion** (the mines flipping one after another, the exploded marker popping in, wrong-flag slashes drawing on, the tile shudder, the flag hop wave, and on a win the normal reveal wave and flag planting) is planned by the pure `timeline.ts` as more `CellAnim`s and drawn through the existing instance writer. **Free-floating effects** (bloom, shock ring, fire, sparks, shards, smoke, confetti, the camera shake, the flash light) are `SceneEffect`s in the existing `EffectHost`, created by one `TransitionHook`; they are **closed-form functions of elapsed time** (no integration state), so the probe's manual clock, a hidden tab and a late first frame all give the same picture. All numbers of the UX table (§5) live in **one module, `effectParams.ts`**, next to the hard limits of the ACs, and a unit test checks the first against the second for every board size and quality level. "No replay" (AC3) holds by construction: the hook starts an effect only from a transition whose `prev` is a _running_ game of the same id, and `attach()` resets the controller's `prev` to null. "Stops at once" (AC1/AC2) holds because a new game remounts `Board` (`key={game.id}`), whose `detach()` already calls `effects.clear()`.

### AC → mechanism

| AC  | Mechanism                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 | `endEffects.hook` on `playing → lost`: explosion effect (bloom, ring, fire, sparks, shards, smoke, flash light, shake) + `timeline` chain (mines flip nearest first), marker pop-in, slashes, shudder. Everything ends at `LOSS_END_MS` (UX G1, 2200) ≤ 2500 − 200 ms slack. Message and timer are DOM/reducer and never wait. Flash rule: `maxFlashesPerSecond(LOSS_FLASH_PEAKS) ≤ 3` (unit) + rendered luminance series (e2e). Start → `Board` remount → `detach()` → `effects.clear()` and `anims = []` |
| AC2 | `endEffects.hook` on `playing → won`: confetti effect (cannons + rain, three instanced shapes) + normal reveal wave, flag planting and hop wave from `timeline`. Ends at `WIN_END_MS` (UX G2, 3600) ≤ 4000 − 200. No loop: every piece has a finite life, nothing respawns. Canvas has no pointer events, so Start, presets, the view control and the (read-only) board are unaffected                                                                                                                     |
| AC3 | The hook requires `prev !== null && prev.id === next.id && prev.phase is not ended`; the controller's `game` is `null` after every `attach()`, so a switch to 3D, a re-attach and a game that ended in 2D all have `prev === null`                                                                                                                                                                                                                                                                         |
| AC4 | `reducedMotion` and `!active` make the hook return and `planTransitions` return `[]`; `setMotion` and `setPalette` call `finishEffects()` (clear effects, drop anims) so a change mid-effect ends at once. The final pictures are the 009 static boards, no new mechanism                                                                                                                                                                                                                                  |
| AC5 | Effects-only frames skip the instance rewrite and the shadow pass (only cell animations need them); counts scale by board size and quality level (`effectScale`, UX S1/S2); one instanced draw per particle family (≈ +9 draw calls); everything pre-built and pre-compiled at scene creation; checked by the extended `scripts/measure-fps.mjs`, which now really animates (see "Finding")                                                                                                                |

### Finding: 009's measurement scenario A never animated

`scripts/measure-fps.mjs` layout A (16 × 30, columns 24–29 full of mines plus three in column 23) has **all 381 safe cells connected to (0, 0)** (checked with a flood fill: 381 of 381 revealed), so the first click **wins** the game. 009's code returns no animations for a transition into `won`, so the 009 AC3 figure for 16 × 30 (59 to 60 fps) was measured on a static board. Layout B (30 × 30) is fine (708 of 720 revealed). This story's script fixes A (an isolated safe cell that the cascade cannot open, and a self-check that the layout leaves hidden safe cells and reveals more than N cells) and measures the cascade, a loss and a win on both boards, each with a non-vacuity check against `probe.fxState`. The 009 numbers for 16 × 30 should be read as "static", and are replaced by the new run.

### Files

New (`src/features/minesweeper/scene3d/`):

- `effectParams.ts`: pure, three-free. **The one place for numbers**: the UX §5 table (IDs G1…S2) as named, typed constants grouped by effect, plus `EFFECT_LIMITS` (the hard limits and where each comes from). Calibrating means editing this file and the `--scene-fx-*` tokens, nothing else.
- `endPlan.ts` (+ `endPlan.test.ts`): pure, three-free. Seeded RNG, `effectScale`, `mineChain`, `shakeAt`, `bloomAt`, `maxFlashesPerSecond`, `visibleWindow`, the particle spawners and the closed-form `particleAt`.
- `endEffects.ts`: lazy chunk (three). Pre-builds the effect meshes, texture and light once; `createEndEffects(host)` returns `{ hook, applyPalette, state, dispose }`. The explosion and confetti `SceneEffect`s are closures in here.

Changed (same folder unless noted):

- `types.ts`: `SceneTransition` (new fields), `SceneEffect.update(nowMs, frame)`, `EffectFrame`, `BoardGeometry`, `CellWindow`, palette keys, `SceneLook` numbers, `Board3dProbe.fxState` and `luminance()`.
- `palette.ts`: the new colour and look tokens in the two token lists.
- `timeline.ts` (+ test): `BoardSnapshot.explodedIndex`; transitions into `lost` and `won` no longer return `[]`; new `CellAnim` kinds `marker`, `slash`, `shudder`, `hop` with pose functions; chain flips use `CHAIN_FLIP_MS`.
- `effects.ts`: the host gets the frame context (quality level, shake accumulator) and isolates exceptions per effect.
- `createBoardScene.ts`: builds `endEffects` before `renderer.compile`, passes the new transition fields, applies the shake to the camera, splits "board moving" from "effects running", ends running effects when the tab is hidden (`visibilitychange`, no frame-gap rule, updated after review round 1), handles `setMotion`/`setPalette`/`detach`, extends the probe.
- `probe.ts`: `fxState` and `luminance` pass-throughs.
- `meshes.ts`: the exploded marker, the mine and the slash take a scale (the marker and slash pop in); nothing else.
- `apps/minesweeper/src/tokens.css` (+ `src/tokens.test.ts` only through its generic scans): UX §6 tokens in `:root` and the dark block.
- `apps/minesweeper/dist-check.json` (devops): `forbidden` gets `"fxState"` (the new dev-only probe member; it must not appear in `dist/`). The lazy chunk budget stays `gzipMaxKb: 180`.
- `apps/minesweeper/scripts/measure-fps.mjs`: scenarios extended (below).
- `e2e/minesweeper-3d-effects.spec.ts` (new, tester) and two small edits to existing specs (below).

No change to `Board.tsx`, `Cell.tsx`, `useBoard3d.ts`, `Minesweeper.tsx` or any CSS: the effects add no DOM and the hook is internal to the lazy chunk. `createBoardScene(options, hooks = [])` keeps its second parameter; `createBoardScene` itself puts `endEffects.hook` first in the list, because the main chunk must not import three (ADR 0005).

### Types and contracts

```ts
// types.ts (three-free). Changed and new parts only.
import type { QualityLevel } from './timeline.ts';

/** Board part the player can see, in cell units of the scene (x right, y towards the far row). */
export interface CellWindow {
  readonly left: number;
  readonly right: number;
  readonly bottom: number; // near side
  readonly top: number; // far side
}

export interface BoardGeometry {
  readonly rows: number;
  readonly cols: number;
  /** Scene position of a cell's centre (the same formula as writeInstances; gap 0 while unmeasured). */
  cellCentre(index: number): readonly [x: number, y: number];
  /** The scroller's visible part (UX §12), clamped to the board plus rim; the whole board if it doesn't scroll. Reads the DOM: call on demand. */
  visibleWindow(): CellWindow;
}

export interface SceneTransition {
  readonly prev: GameState | null; // null after every attach(): no effect may start (AC3)
  readonly next: GameState;
  readonly origin: number | null;
  readonly reducedMotion: boolean;
  readonly active: boolean; // false: canvas hidden (forced colours), nothing may start
  readonly now: number; // scene clock at update(): effect time 0
  readonly level: QualityLevel; // governor level at the click
  readonly board: BoardGeometry;
}

export interface EffectFrame {
  readonly level: QualityLevel; // read per frame: counts follow the governor
  /** Out-parameter, zeroed by the host before each round: effects add their camera push (cells, screen axes). */
  readonly shake: { x: number; y: number };
}
export interface SceneEffect {
  /** false = ended; the host then disposes it. Allocation-free. */
  update(nowMs: number, frame: EffectFrame): boolean;
  dispose(): void; // releases its slots in the shared meshes (count back to 0)
}

// ScenePalette: SceneColour gains
//   'fxFlash' (--scene-fx-flash), 'fxFireCore', 'fxFireMid', 'fxFireEdge' (--scene-fx-fire-*),
//   'fxSmoke' (--scene-fx-smoke), 'confetti1'…'confetti6' (--scene-confetti-1…6)
// SceneLook gains
//   fxFlashAlpha (--scene-fx-flash-alpha), fxSmokeAlpha (--scene-fx-smoke-alpha),
//   fxLightIntensity (--scene-fx-light-intensity, × π in r187)

/** Dev-only probe additions (installed under the existing literal e2e guard). */
export interface FxState {
  readonly running: boolean; // any end effect alive
  readonly animating: number; // running cell animations (reveal, chain, marker, slash, shudder, hop)
  readonly particles: number; // instances drawn by the effect meshes at the last frame
  readonly shake: number; // |camera push| at the last frame, cells
  readonly flash: number; // bloom opacity at the last frame, 0..1
  readonly minesPending: number; // chain mines not yet flipped at the last frame
}
// Board3dProbe gains:  readonly fxState: FxState;
//                      luminance(rect?): number  // re-renders, mean relative luminance 0..1 of the canvas (or a viewport-px rect)
```

```ts
// effectParams.ts (three-free) – skeleton; the values are the UX §5 starting values, transcribed 1:1
/** Hard limits. Never calibrated; effectParams.test (in endPlan.test.ts) checks the params against them. */
export const EFFECT_LIMITS = {
  lossMaxMs: 2500, // AC1
  winMaxMs: 4000, // AC2
  shakeMaxMs: 400, // AC1
  flashesPerSecondMax: 3, // AC1, AC2 (WCAG 2.3.1 style)
  frameSlackMs: 200, // the plan must end this long before the AC limit: a late frame still lands inside it
  flashAreaMaxPx: 150, // UX L1: bloom diameter on screen
} as const;

export const FX_GENERAL = { lossEndMs: 2200 /* G1 */, winEndMs: 3600 /* G2 */ } as const; // G3: hidden tab only, no gap constant (updated after review round 1)
export const FX_LOSS = { bloom, light, shake, ring, fire, sparks, shards, smoke, shudder, marker, chain, wrongFlags } as const; // L1…L12
export const FX_WIN = { cannons, rain, piece, count, end, hop } as const; // W1…W6
export const FX_SCALE = { bySize: [...], byLevel: [...] } as const; // S1, S2 tables
```

```ts
// endPlan.ts (pure) – the API the hook, the timeline and the tests share
export const effectSeed = (gameId: number, cellIndex: number): number => gameId * 31 + cellIndex; // G4
export function rng(seed: number): () => number; // mulberry32; never Math.random, so stills and tests repeat

/** UX S1 ∘ S2: multipliers for each particle family, and which decorations exist at all. */
export interface EffectScale {
  readonly puffs: number;
  readonly sparks: number;
  readonly shards: number;
  readonly smoke: number;
  readonly confetti: number;
  readonly chainPuffMines: number; // how many chain mines get a puff
  readonly shudder: boolean;
  readonly hop: boolean;
  readonly light: boolean;
}
export function effectScale(cells: number, level: QualityLevel): EffectScale;

export interface MineStep {
  readonly index: number;
  readonly delayMs: number;
}
/** Chain order (UX L11): nearest to the exploded cell first, ties by index; step 90 ms, whole chain ≤ 1000 ms; level 2: 4 distance bands. */
export function mineChain(
  exploded: number,
  mines: readonly number[],
  cols: number,
  level: QualityLevel,
): MineStep[];

export function shakeAt(elapsedMs: number): { readonly x: number; readonly y: number }; // cells; 0 outside [0, shake.durationMs); deterministic
export function bloomAt(
  elapsedMs: number,
  cellPx: number,
): { readonly diameter: number; readonly alpha: number }; // diameter capped at flashAreaMaxPx
export function maxFlashesPerSecond(peaksMs: readonly number[]): number; // max pulses whose peak lies in any [t, t + 1000)
export const LOSS_FLASH_PEAKS: readonly number[]; // from FX_LOSS.bloom (one entry); the light shares the pulse
export const WIN_FLASH_PEAKS: readonly number[]; // []

export function visibleWindow(m: {
  rows: number;
  cols: number;
  step: number; // cells, 1 + gap/cell
  scrollLeft: number;
  scrollTop: number;
  clientWidth: number;
  clientHeight: number; // scroller, px
  stageWidth: number;
  stageHeight: number;
  gridCentreX: number;
  gridCentreY: number;
  cellPx: number; // px
}): CellWindow;

/** One particle: a closed-form path. p(t) = p0 + vt·t + (v0 − vt)(1 − e^{−k t})/k − ½ g t², spin and flutter on top. */
export interface Particle {
  born: number;
  life: number;
  p0: Vec3;
  v0: Vec3;
  terminal: Vec3;
  drag: number;
  gravity: number;
  spin: number;
  flutter: { amp: number; hz: number; phase: number };
  size: number;
  colour: number;
}
export interface ParticleState {
  alive: boolean;
  x: number;
  y: number;
  z: number;
  angle: number;
  scale: number;
  alpha: number;
}
export function particleAt(p: Particle, elapsedMs: number, out: ParticleState): boolean; // allocation-free, writes `out`
export function screenToScene(u: number, v: number, depth: number): Vec3; // screen-plane (right, up, towards viewer) → scene, rotated back by TILT_DEG like the slash
export function spawnExplosion(
  seed: number,
  origin: readonly [x: number, y: number],
  scale: EffectScale,
): ExplosionParticles;
export function spawnConfetti(seed: number, window: CellWindow, scale: EffectScale): Particle[];
```

```ts
// timeline.ts additions
export interface BoardSnapshot {
  gameId;
  phase;
  kinds;
  readonly explodedIndex: number | null;
}
export type CellAnim =
  /* existing reveal | plant | unplant */
  | { kind: 'marker'; index; start; duration } // exploded disc+ring (UX L10: 300 ms) and mine (350 ms) pop in; before start: scale 0
  | { kind: 'slash'; index; start; duration } // wrong-flag slash draws on (L12)
  | { kind: 'shudder'; index; start; duration; amplitude } // hidden tile hops when the ring passes (L9)
  | { kind: 'hop'; index; start; duration }; // planted flag hops (W6)
export const CHAIN_FLIP_MS = 200; // L11, inside the 009 AC2 range 150–400 ms
export function planTransitions(
  prev,
  next,
  origin,
  cols,
  nowMs,
  options: {
    reducedMotion: boolean;
    level: QualityLevel;
    /** Needed for the hop wave of a win (flags in the visible part only); null = whole board. */
    visible: CellWindow | null;
  },
): CellAnim[];
export const markerPose: (
  a: Extract<CellAnim, { kind: 'marker' }>,
  now: number,
) => { disc: number; mine: number };
export const slashScale: (a: Extract<CellAnim, { kind: 'slash' }>, now: number) => number;
export const shudderLift: (a: Extract<CellAnim, { kind: 'shudder' }>, now: number) => number;
export const hopRise: (a: Extract<CellAnim, { kind: 'hop' }>, now: number) => number;
```

```ts
// endEffects.ts (lazy)
export interface EndEffects {
  readonly hook: TransitionHook;
  applyPalette(palette: ScenePalette): void; // colours of materials, light, per-family look numbers
  state(): FxState; // for the probe: counts at the last frame
  dispose(): void;
}
export function createEndEffects(host: EffectRunner): EndEffects;
```

### Data flow and state ownership

```
gameReducer ─▶ game (React) ─▶ Board layout effect ─▶ scene.update(game, origin)
                                   │ (same task as the DOM commit: message, timer, names already final)
                                   ├─ snapshot prev/next ─▶ planTransitions ─▶ anims   (cell-bound)
                                   └─ hooks(transition) ─▶ endEffects.hook ─▶ host.add(effect)  (free-floating)
rAF loop or probe.advance ─▶ renderFrame(now):
   effects.update(now, {level, shake}) ─▶ camera(sway, shake) ─▶ writeInstances (only if cells move) ─▶ render
```

| State                                  | Owner                                                               | Notes                                                                    |
| -------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| result, timer, counter, names          | unchanged (reducer, `GameStatus`)                                   | the scene never delays or feeds back                                     |
| `prev` game, snapshot, `anims`         | controller (`createBoardScene`)                                     | `attach()` nulls them (AC3)                                              |
| running effects, shake sum             | `EffectRunner` (`effects.ts`)                                       | derived per frame; `clear()` empties them in the same task as `detach()` |
| particle specs                         | the effect closure                                                  | created at the click from `effectSeed`; read-only afterwards             |
| instance buffers, bloom, ring, light   | `endEffects` (pre-built at scene creation, shared, count 0 at rest) | an effect writes its slots each frame and zeroes them in `dispose()`     |
| quality level                          | `quality.ts` governor (unchanged)                                   | passed in `EffectFrame`, so counts follow it mid-effect                  |
| reduced motion, forced colours, scheme | `useBoard3d` → `setMotion` / `setPalette`                           | both end running effects (UX §7)                                         |

### Loss: what happens and where

On `update()` with `prev.phase` ∈ {ready, playing} and `next.phase = lost`:

1. **`timeline`** plans, from `next.kinds` and `explodedIndex`: the chain (`mineChain`: every `hidden → mine` cell gets a `reveal` anim with `duration = CHAIN_FLIP_MS` and `start = now + FX_LOSS.chain.startMs + delay`), the `marker` anim of the exploded cell, one `slash` anim per `flagWrong` cell (start after the chain, nearest first) and, when `effectScale(...).shudder`, a `shudder` anim for every hidden or flagged tile within 3 cells (start = ring arrival `d / 8` s). The exploded cell and the wrong-flag _flags_ are in their final pose from frame 0 (the pit under the bloom, UX §3).
2. **`endEffects.hook`** adds one `ExplosionEffect`: seeded by `effectSeed(next.id, explodedIndex)`, centred on `board.cellCentre(explodedIndex)`, counts from `effectScale`. Its `update` writes the bloom (`bloomAt`), the ring, the fire/spark/shard/smoke instances (`particleAt`), the chain puffs (from the same `mineChain` call, so puffs and flips agree) and the flash light, adds `shakeAt(elapsed)` to `frame.shake`, and returns `false` once `elapsed ≥ FX_GENERAL.lossEndMs`.
3. The DOM is the same as always: `You lost…`, the stopped timer, the names and the counter are final at click time 0 (AC1); nothing in the scene is read by them.

`writeInstances` changes (all inside the existing per-cell loop, no new pass): the chain reveal branch also draws the mine and its halo with `glyphScale` (as it does for digits); the exploded marker uses `markerPose` (0 before 300 ms); the slash uses `slashScale`; hidden and flagged tiles add `shudderLift`; a flag adds `hopRise` to its `rise` (the existing pose parameter).

### Win: what happens and where

On `next.phase = won` from a running game: the **winning reveal is no longer static**: `planTransitions` now plans the normal wave (`origin`) and the `plant` anims of the auto-flagged mines (UX §4: "the 009 reveal and the flag planting run as before"), plus `hop` anims for flagged cells in `board.visibleWindow()` (start 1000 ms, after the wave; none at level 2). The hook adds one `ConfettiEffect` (`effectSeed(next.id, origin ?? 0)`), with two cannons and the rain placed relative to `visibleWindow()`, pieces moving in the screen-parallel plane (`screenToScene`), no shake, no flash. It returns `false` at `FX_GENERAL.winEndMs`. This changes 009's "transitions into won give no animation"; 009/AC5's static final board is the state after the animation, so no AC wording changes.

### Particle system

- **Instanced quads, no `Points`, no per-particle `Mesh`.** Built once at scene creation inside `effects.root` (count 0, `frustumCulled = false`, no shadows, no pointer events), so `renderer.compile` sees every program and there is no shader compile at the first mine (UX §15.5). Textures (a radial glow and a ring, canvas-generated like the digit atlas, no colour literals) are uploaded with `renderer.initTexture` at creation.

  | Mesh                                | Material                                                                                     | Holds              |
  | ----------------------------------- | -------------------------------------------------------------------------------------------- | ------------------ |
  | `bloom`, `ring` (one instance each) | `MeshBasicMaterial`, additive (bloom) / normal (ring), `depthTest: false`, opacity per frame | L1, L4             |
  | `glowAdditive`                      | `MeshBasicMaterial` + glow map, additive, per-instance colour **and alpha**                  | fire puffs, sparks |
  | `glowNormal`                        | same, normal blending                                                                        | smoke, chain puffs |
  | `shards`                            | opaque, per-instance colour (`tileTop`), double-sided                                        | L7                 |
  | `rects`, `dots`, `ribbons`          | opaque, per-instance colour (`confetti1…6`), double-sided, same colour on both sides         | W3                 |

  Per-instance alpha is not in three's `InstancedMesh`; the two glow meshes get it from one `InstancedBufferAttribute` and a four-line `onBeforeCompile` patch (`diffuseColor.a *= vInstanceAlpha`). It is the only shader patch; if a three update breaks it, the fallback is fading by scale. Capacity is the maximum of the UX counts at scale 1 plus 20 %; the particle budget can never overflow a buffer (`put` clamps, like the board meshes).

- **Flash light.** One `PointLight` is created at scene creation with intensity 0 and left in the scene (a light added at the click would recompile every lit material). The effect sets its intensity from `fxLightIntensity` (× π) for UX L2 and back to 0; `effectScale(...).light` is false at level ≥ 1 and in the light scheme the token is 0. Risk and fallback in "Risks".
- **Closed form, seeded.** `particleAt` is the only motion code (gravity, drag-to-terminal for confetti and smoke, flutter, spin, life and fade). Spawners draw from `rng(seed)` in a fixed order, so one game always gives the same picture (G4: stills and tests repeat). No per-frame allocation: specs are plain objects made once at the click, the evaluator writes into one reused `ParticleState`.
- **Budget (AC5).** `effectScale(cells, level)` is UX S1 ∘ S2 as a pure lookup (cells ≤ 256, ≤ 600, > 600; levels 0, 1, 2). Counts are fixed at the click from the board size; the **visible count is re-evaluated each frame** from `frame.level` (`ceil(spawned × factor)`, specs are ordered so the dropped ones are the last), so a governor step-down mid-effect shrinks the effect without re-planning. Level 2 also drops smoke, hop, light and the shudder; the chain uses bands and sink-only flips (the existing `simple` path in `timeline.ts`).
- **Cost control.** Today `animating(now)` makes every frame rewrite 900 instances and re-render the shadow map. Split it: `boardMoving(now)` (only `anims`) drives the instance rewrite and the shadow pass; `animating(now) = boardMoving || effects.running` drives the loop. During the last second of a loss and all of a win's confetti phase nothing on the board moves, so those frames cost only the particles.

### Camera shake (AC1)

`frame.shake` (cells, screen axes) is multiplied by the cell size and applied as a translation in camera space after the sway: `camera.matrix = cameraWorldMatrix(sway) · T(dx, dy, 0)` (the camera moves, the world stays, so the shadow map stays valid). `updateCamera(sway, shake)`; `probe.project` passes zero shake so the 009 alignment tests keep their meaning. **The DOM overlay does not follow the shake**: the overlay's transform is part of the scroll bounds (the margins cover the sway only), so a per-frame translation of the grid would make scrollbars flicker on fitting boards. The cost is that for at most 0.4 s a focused cell's ring is off its tile by the peak push (UX: 3 to 5 px, accepted in UX §9 and §15.6); the board is read-only then, so no click can hit a wrong cell, and the grid is `aria-readonly`. Bounds are testable as pure rules: `shakeAt(t) = (0, 0)` for `t ≥ shake.durationMs` and for `t < 0`, `|x|, |y| ≤ amplitude`, `durationMs ≤ EFFECT_LIMITS.shakeMaxMs`. Nothing writes an inline style from the effect, so the "render loops" rule (styles also written when the loop doesn't run) has nothing to cover here.

### Flash rate (AC1, AC2) as a testable rule

- **Data rule.** A _flash_ is one pulse of the luminance envelope; the plan lists them as peak times (`LOSS_FLASH_PEAKS`, `WIN_FLASH_PEAKS`; the flash light and the bloom are one pulse by construction). `maxFlashesPerSecond(peaks)` is the maximum number of peaks inside any window `[t, t + 1000)`. The unit test requires ≤ `EFFECT_LIMITS.flashesPerSecondMax` for both lists and for every board size, plus table cases for the function (4 peaks in 900 ms → 4, three 400 ms apart → 3, 1000 ms apart → 1). Nothing else in the design pulses: mine flips and puffs have no brightness peak, sparks fade by scale, confetti never changes colour (UX §9).
- **Rendered rule (e2e).** The data rule only proves the plan. The tester steps the probe clock over the whole effect (every 33 ms for the first 1 s, then every 100 ms), reads `probe.luminance()` after each step and counts _rises_ of at least 10 % of the series' range followed by a fall; the result must be ≤ 3 in any 1 s window, in both colour schemes (UX §9 states the stricter proxy: one rise and one fall). The tester may pick other points but not a looser rule.

### Time, tab visibility and failures

- **Clock.** Effects and cell anims use the scene clock passed to `update`/`renderFrame` (`performance.now()` or the probe's manual clock) and start at `transition.now`. They are clock-based, not frame-count-based, so a slow machine drops frames but still ends at `lossEndMs`/`winEndMs`.
- **Hidden tab (UX G3).** A `visibilitychange` to hidden calls `finishEffects()` (`effects.clear(); anims = []; dirty`) while effects or end anims run. A hidden tab therefore ends in the static final board on return instead of replaying. There is no frame-gap rule: a slow frame never ends an effect (updated after review round 1).
  - _Update (developer, review round 1, 2026-11-03): the frame-gap rule was dropped. It cut the effect off after its first slow frame on software WebGL. A hidden tab now ends a running end effect through `visibilitychange`, and the closed-form effects need no catch-up rule (they end at `lossEndMs` / `winEndMs` by the scene clock). `FX_GENERAL.jumpGapMs` is gone; UX G3 and the "hidden tab" row of UX §7 read accordingly (see Implementation notes, review round 1 follow-up)._
- **Isolation.** `EffectRunner.update` and the hook call are wrapped per effect: an exception disposes that effect, logs with `console.error` once and leaves the board static (UX §7: "never an error page"). This is a deliberate exception to 009's "no silent per-frame catch": it is not silent (the e2e specs fail on any console error), and it keeps a bug in decoration from taking the game away.
- **Palette, motion, context.** `setPalette` and `setMotion` call `finishEffects()` (UX §7, avoids re-colouring live particles; their tokens only matter at the next game end). `webglcontextlost` already disposes the controller, effects included; `dispose()` also disposes `endEffects` (geometries, materials, textures, light).

### Probe, e2e driving and what it asserts

`probe.fxState` and `probe.luminance(rect?)` are added to the existing dev-only probe (same literal guard, same dist check; the new identifying string `fxState` goes into `forbidden`). `pause()` + `holdSway(true)` + `advance(ms)` drive everything; effects are closed-form, so one `advance(2600)` gives the final picture and stepping gives the series. e2e asserts **intent**, never UX design values:

| What                    | Asserted through                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| effect plays            | at a mid time `fxState.running`, `particles > 0`, and the frame differs from the final one                                                                                           |
| shake ≤ 0.4 s           | `fxState.shake > 0` at some sample before 400 ms, exactly 0 from 400 ms on                                                                                                           |
| mines one after another | `fxState.minesPending` sampled every 100 ms is non-increasing, starts above 0 after the click and is 0 by the end, with at least 3 distinct values on a layout with at least 6 mines |
| ends by itself, no loop | at the AC limit (2500 ms loss, 4000 ms win): `running === false`, `particles === 0`, `animating === 0`, and the frame equals the frame 5 s later                                     |
| final = static board    | the end frame equals the frame of the same game after a 2D round trip (AC3 test) and, in reduced motion, the frame right after the click                                             |
| message and timer       | visible and frozen at click time while the scene clock is still at 0 (the effect has not progressed, so the DOM cannot depend on it)                                                 |
| stops at once           | after Start (or preset + Start) with no `advance`: `fxState` all zero and the frame equals the frame 5 s later                                                                       |
| no replay               | after 2D → 3D (game ended in 3D, and ended in 2D): `running === false`, `animating === 0`, frame stable                                                                              |
| flash rate              | the luminance rule above                                                                                                                                                             |

### Scripts: `measure-fps.mjs` (AC5)

Same dev-server-in-mode-e2e approach, headed on the real GPU. Changes:

1. **Layout A fixed** (the Finding): keep 99 mines but make one safe cell unreachable for the cascade (a safe cell whose neighbours are all mines), and add a self-check that floods the layout and aborts with "layout would end the game" if no safe cell stays hidden. Same self-check for B.
2. **Four effect scenarios** after the existing cascade: A and B each with a **loss** (click a known hidden mine after the cascade; window = 2.5 s + 2 s) and a **win** (click the isolated safe cell on A; on B click the remaining 12 safe cells, measuring from the last click; window = 4 s + 1 s). Floors as in AC5 (A ≥ 50, B ≥ 30 median over 500 ms windows), plus the minimum window and the quality level reached after each.
3. **Non-vacuity**: at about 150 ms after the effect click, `probe.fxState.running || fxState.animating > 0` must hold, otherwise the row fails with "nothing animated". Rows are added to the printed table; exit 1 on a miss.
4. The input-latency check stays.

The tester pastes the table into the Test report. Not part of `verify` or CI.

### Bundle and dist check

No new dependency; the new three imports (`PointLight`, `AdditiveBlending`, `InstancedBufferAttribute`, `PlaneGeometry`/`MeshBasicMaterial` already in the chunk) are small. Estimate: about +8 to +12 kB gzip on today's 137 KiB (budget 180, `dist-check.json` unchanged); the developer reports the size, and if it passes 160 KiB, stops and tells the orchestrator. `scripts/check-dist.mjs` already checks the three marker in the entry chunk; `endPlan.ts`, `effectParams.ts` and `timeline.ts` are three-free and imported only by the lazy chunk. New dev-only string: **`fxState`** (probe member) into `forbidden`; the developer greps `src/` to confirm it occurs only in `types.ts`, `probe.ts` and the guarded probe code, and the build must not contain it. `luminance` is not listed (not unique enough); it sits in the same guarded object.

### Minimal test set (one per AC, cheapest level)

Unit (pure logic with limits and branches):

- `scene3d/endPlan.test.ts`:
  1. **Limits for every board size and level** (5 × 5, 9 × 9, 16 × 16, 16 × 30, 30 × 30 with 891 mines; levels 0 to 2): chain delays ≤ the chain length, the last cell anim and the last particle end ≤ `lossEndMs`, `lossEndMs + frameSlackMs ≤ lossMaxMs`; the same for the win (`winEndMs`, last piece, last hop); every particle has a finite life (no loop).
  2. **Flash rule**: the function on table cases, and `LOSS_FLASH_PEAKS`/`WIN_FLASH_PEAKS` ≤ 3; bloom diameter never above `flashAreaMaxPx` for cell sizes 26 to 40 px.
  3. **Shake**: zero outside `[0, durationMs)`, bounded by the amplitude, `durationMs ≤ shakeMaxMs`, deterministic.
  4. **Chain**: nearest first, ties by index, strictly increasing delays when the count fits, level 2 in 4 bands, 0 and 1 mines work.
  5. **Scale**: monotone non-increasing in cells and level, rows of UX S1/S2 (the thresholds 256, 600; levels 1 and 2), counts never above buffer capacity.
  6. **Seeds and closed form**: same seed → same specs; `particleAt` is `alive = false` before `born` and after `born + life`, and the drag formula is continuous towards its `k → 0` (pure gravity) limit.
  7. **`visibleWindow`**: a board that fits gives the whole board plus rim; a 30 × 30 scrolled to a corner gives that corner, clamped to the board.
- `scene3d/timeline.test.ts` (changed): the existing case "transitions into won/lost give `[]`" becomes: **lost** → chain anims for every `hidden → mine` cell, none for the exploded cell, one `marker`, one `slash` per wrong flag, none after the end bound; **won** → the normal wave and plants plus hops; reduced motion, new game and `prev === null` still `[]` (AC3/AC4); level 2 chain is sink-only.
- `src/tokens.test.ts`: no new test; the new tokens are covered by the existing parity scan, the hex scan and the look-range scan (`fx-light-intensity` may be 0). No contrast pair (decoration, UX §6).

E2E, new `e2e/minesweeper-3d-effects.spec.ts` (guest sign-in, fixed layouts, `choose3d` as in the 009 spec, probe paused with sway held; titles start with the AC id):

- **AC1** loss lifecycle: message and frozen timer at click time; effect plays; shake zero from 400 ms; `minesPending` sequence; ends at 2500 ms with the final frame stable. One test, one 9 × 9 layout with at least 6 mines.
- **AC2** win lifecycle: message and timer at click time; pieces present mid-effect; ends at 4000 ms, nothing left, frame stable; the view control still works during it (switch to 2D).
- **AC1 + AC2** flash rate, both end types, light and dark (the parametrised pattern of the 009 look tests).
- **AC1 + AC2** cancel: for loss and for win, `Start` (and a preset followed by Start) during the effect; zero effect state and a static frame at once, no `advance`. A preset alone leaves the board and the effect as they are (006/AC2), asserted in the same test.
- **AC3** no replay: lost and won, ended in 3D and ended in 2D; switch to 3D; `fxState` idle and the frame equal to the end-of-effect frame of the first scenario.
- **AC4** reduced motion: lose and win; `fxState` idle at once, frame right after the click equals the frame 3000 ms later; the names show the lost and won states as in 005/AC9 and AC10.
- **AC5**: `scripts/measure-fps.mjs` on hak's Mac.

Edits to existing specs (the tester): `e2e/minesweeper-3d-scene.spec.ts` "AC1: mines are 3D objects … on the lost board" advances 2000 ms after the loss, now less than the 2200 ms effect; it must advance past `lossEndMs` (use 2600). Nothing else asserts pixels right after a loss or win with the clock running (checked: the `chromium-3d` re-runs and the 008 spec read names only, and the probe is paused). **No markup is wrapped or moved, so no spec that walks `parentElement` / `locator('..')` is affected.** Typed `Probe` copies in specs only need the two new members if they use them.

### Risks and mitigations

- **A static "cascade" measured as an animation** (the Finding). Self-check in the script and the non-vacuity row; do not trust a figure without the `animating` check.
- **Shader compile or texture upload at the first loss.** Everything pre-built, `renderer.compile` after `createEndEffects`, `initTexture` for both textures, the point light always present. Check by hand: first loss on a fresh load has no frame over 50 ms on the Mac.
- **The always-present point light costs every lit fragment** (tiles, table) one more light. Measure in `measure-fps` at level 0; if either floor is at risk, drop the light (UX marks it dark-only; the bloom already carries the pop). `FX_LOSS.light` has an `enabled` flag for exactly this.
- **Big boards.** Effects-only frames skip instances and shadows; counts scale; the governor shrinks the visible counts mid-effect. If 30 × 30 still misses 30 fps, the first cuts are shudder, hop and chain puffs (all already scale to zero at level 2).
- **Per-instance alpha patch** breaks on a three update. It is four lines, covered by the e2e luminance and frame checks; the fallback is fading by scale.
- **Late frames.** Clock-based timing plus 200 ms slack (a unit test enforces it) keeps AC1/AC2 on slow machines; a slow frame never ends an effect, only a hidden tab does (updated after review round 1).
- **Flash rule drift.** One list (`*_FLASH_PEAKS`) feeds both the unit rule and the effect; the rendered series guards against anyone adding a pulse elsewhere.
- **Overlay offset during the shake.** Documented above; reads as accepted in UX.
- **Confetti window on scrolled large boards.** `visibleWindow` reads the DOM at the click; it is pure given its inputs and unit-tested; on a fitting board it degenerates to the whole board.
- **Vacuity of e2e on SwiftShader.** Series steps are small only for the first second; all other checks jump with one `advance`. Small boards only (9 × 9) keep a frame under about 40 ms.
- **e2e and console errors.** The isolation `try/catch` logs to the console; the effects spec fails on any `console.error`, so a silent break cannot pass.

### Implementation plan (ordered)

1. Pure: `effectParams.ts`, `endPlan.ts` + tests; `timeline.ts` changes + tests (lost chain, marker, slash, shudder; won wave, plants, hop). Green without three.
2. Types and palette: `types.ts`, `palette.ts`; tokens in `src/tokens.css` (UX §6 values); `npm test` (token scans).
3. Lazy chunk: `endEffects.ts`; `effects.ts` (frame context, shake, isolation); `meshes.ts` (marker, mine and slash scale); `createBoardScene.ts` (build before `compile`, new transition fields, shake in `updateCamera`, `boardMoving` split, hidden-tab ending via `visibilitychange` (updated after review round 1), `finishEffects` in `setMotion`/`setPalette`/`detach`, probe members). Check by hand in `npm run dev -- --mode e2e` with the probe: loss on 9 × 9, 16 × 30, 30 × 30; win on 9 × 9 and a scrolled 30 × 30; light and dark.
4. **Calibrate** (below).
5. Devops: `dist-check.json` (`fxState`), `measure-fps.mjs` scenarios and self-check.
6. Tester: new spec, the one edit, `npm run measure:fps` on the Mac, gate-2 stills and recording per UX §14.
7. `npm run verify` and `npm run test:e2e`.

**Calibration protocol.** The UX numbers are starting values; the AC limits are binding and the unit test guards them. The developer calibrates by pixel sampling and by eye at the probe times of UX §14 (stills 2 to 4, 6, 8 to 10), edits only `effectParams.ts` and the `--scene-fx-*` tokens, and records the final values in "Implementation notes" (the table of UX §5 with start and final value per ID), as done for the 009 look numbers.

### Alignment with UX

The UX section (§3 to §15) fits the mechanism; where it asks for more than the seam gave, the answer is:

| UX point                                                                      | Decision                                                     | Reason                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §5 numbers "in one constants module"                                          | Accepted: `effectParams.ts`                                  | Limits and params side by side, unit-tested against each other. The three scheme-dependent numbers are `SceneLook` tokens as in 009 §14.1                                                                                                                           |
| §6 tokens (`--scene-fx-*`, `--scene-confetti-1…6`)                            | Accepted                                                     | New palette keys and look numbers; generic token scans cover them. Names follow the UX table                                                                                                                                                                        |
| §15.1 visible window for the confetti                                         | Accepted: `BoardGeometry.visibleWindow()` in the transition  | Read on demand at the click; pure `visibleWindow` over scroller and stage numbers, unit-tested. Perspective is ignored (a screen-plane window from board rows × cos(tilt)); the developer verifies the corners with `probe.project`                                 |
| §15.3 clicked cell skips the flip, tile blown off                             | Already so                                                   | `mineExploded` is drawn as the pit from frame 0; the shards and the bloom are the effect                                                                                                                                                                            |
| §15.4 time, seed, hidden tab                                                  | Accepted, hidden tab only (updated after review round 1)     | Closed-form effects need no catch-up; a hidden tab calls `finishEffects()`, and tests can take big steps                                                                                                                                                            |
| §15.5 pre-warm                                                                | Accepted                                                     | Meshes, textures, light built before `compile`; the point light stays in the scene at intensity 0                                                                                                                                                                   |
| §15.6 / §9 shake through the same path as the sway                            | **Changed to the accepted fallback: camera only**            | A per-frame grid translation changes the scroll bounds (margins cover the sway only) and would flicker scrollbars. Focus ring off by the peak push (3 to 5 px) for ≤ 0.4 s on a read-only board; UX already accepts this                                            |
| §15.7 flash proxy                                                             | Accepted                                                     | Unit rule on the plan plus the rendered luminance series; `probe.luminance()` makes the series cheap on SwiftShader                                                                                                                                                 |
| §15.8 shudder (L9) and flag hop (W6)                                          | Accepted as decoration; first to drop for AC5                | They are new `CellAnim` kinds (small pose functions, one branch each in `writeInstances`), scale to zero on big boards and at level 2. Not required by any AC                                                                                                       |
| §4 "the 009 reveal and planting run as before" on a win                       | Accepted; this changes 009's static win                      | `planTransitions` no longer returns `[]` for `won`. No AC wording changes (009/AC5 is about the final picture)                                                                                                                                                      |
| §7 scheme or reduced-motion change, hidden tab, lost context end effects      | Accepted                                                     | `finishEffects()`; the lost context is 009's existing path                                                                                                                                                                                                          |
| §7 "Start or a preset pressed during an effect → effect stops"                | **Needs a reading**: Start stops it, a preset alone does not | 006/AC2 (hak, 2026-11-02): a preset only fills the inputs, the board stays until Start. The effect stops with the new game. The AC text "with Start or a preset" is read as "a preset, then Start"; the test does both and asserts the preset alone changes nothing |
| §7 "if anything throws in the effect, the scene shows the static final board" | Accepted with `console.error`                                | Isolation per effect (see "Time, tab visibility and failures")                                                                                                                                                                                                      |
| §3 L2 flash light (dark only)                                                 | Accepted with a kill switch                                  | Always-present light with intensity 0; costs every lit fragment; measured in `measure-fps`                                                                                                                                                                          |
| §12 "visible part" on 30 × 30 and §5 S1/S2                                    | Accepted                                                     | `effectScale` is S1 ∘ S2; the visible window feeds W1, W2, W4, W6                                                                                                                                                                                                   |

Open points for UX (none blocking): (1) the screen-plane height of the window is `visibleRows × cos(25°)`, about 9 % less than the row count the W1/W2 speeds assume; the developer calibrates the speeds on the stills. (2) Fire and smoke use per-instance alpha; in the light scheme the smoke is dark and normal-blended, additive is used only for bloom, fire and sparks, which matches the UX look.

## Implementation notes

_developer: what was built, deviations from the design and why._

developer, 2026-11-03.

**What was built** (all under `apps/minesweeper/`):

- New, three-free: `scene3d/effectParams.ts` (UX §5 numbers as named constants next to `EFFECT_LIMITS`, plus `FX_CAPACITY`), `scene3d/endPlan.ts` (seeded `rng`, `effectScale`, `levelShare`, `mineChain`, `shakeAt`, `bloomAt`, `flashLightAt`, `maxFlashesPerSecond`, `visibleWindow`, `screenToScene`, closed-form `particleAt`, `spawnExplosion`, `spawnConfetti`, `confettiFade`) and `scene3d/endPlan.test.ts` (the 7 cases of the minimal test set).
- New, lazy: `scene3d/endEffects.ts`: bloom billboard, flat shock ring (radii rewritten in place), two glow batches (smoke + chain puffs; fire + sparks) with a per-instance alpha attribute (the one `onBeforeCompile` patch), lit shard batch, three confetti batches, an always-present `PointLight`; the explosion and confetti `SceneEffect`s as closures; the transition hook.
- Changed: `types.ts` (`EffectFrame`, `SceneEffect.update(now, frame)`, `CellWindow`, `BoardGeometry`, the new `SceneTransition` fields, `FxState`, palette keys and look numbers, probe `fxState` + `luminance`), `palette.ts`, `effects.ts` (frame context, shake sum, per-effect isolation with `console.error`), `timeline.ts` (`explodedIndex`, loss plan: chain, marker, slashes, shudder; win plan: 009 wave and plants plus hops; pose functions; `PoseAnim`/`DecorationAnim` split), `meshes.ts` (slash rotation moved into the instance as `SLASH_ROTATION`, so it can scale along its length), `createBoardScene.ts` (end effects built before `renderer.compile`, hook first; `boardMoving` vs `animating` split, effects-only frames skip the instance rewrite and shadow pass; shake as a camera-space translation; mines drawn in the chain flip; marker, slash, shudder and hop poses; `finishEffects()` on new game, detach, palette and motion changes; gap jump; probe members), `probe.ts`, `src/tokens.css` (UX §6 tokens, values unchanged), `dist-check.json` (`fxState` forbidden), `scripts/measure-fps.mjs`, and the one planned spec edit in `e2e/minesweeper-3d-scene.spec.ts` (advance 2600 instead of 2000 after the loss).
- Unit tests: `endPlan.test.ts` (7) and `timeline.test.ts` (the old "end of a game is static" case became the reduced-motion/no-replay case, plus 3 new cases for loss, level-2 loss and win). The e2e spec `minesweeper-3d-effects.spec.ts` is the tester's.

**Deviations from the design (small, all inside the ACs):**

1. **Two bugs of the seam, fixed:** the controller collected every `InstancedMesh` under `meshes.root` to reset its counts per frame, which included the effect batches (they were zeroed whenever cells moved); it now skips children of `effects.root`. And `renderer.compile` only walks visible objects, so the effect objects are visible for the compile and hidden right after it (`endEffects.rest()`).
2. **Blending by scheme:** the bloom, fire and sparks blend additively only when the revealed top is dark (relative luminance < 0.2, read from the palette, no literal); on the light scheme additive light clipped to white on ivory (the bloom was a pale smudge, the fire invisible), so they are painted with normal blending there. Smoke and chain puffs are always normal-blended (dark smoke in light).
3. **Gap jump (UX G3):** a gap counts only between two loop frames that both come after the effect start, and a `visibilitychange` to hidden ends running end effects directly. Measured from the effect start (as first built), the slow first frame after the click (585 ms on SwiftShader: click render plus shadow pass) killed the effect before it was ever seen; a slow phone could do the same.
4. **Signatures:** `createEndEffects(host, renderer)` (needs `initTexture`); `planTransitions` takes `isVisible: (index) => boolean` instead of a `CellWindow` (the timeline does not know the cell pitch); `visibleWindow` takes the visible canvas rectangle (canvas rect ∩ scroller client box ∩ viewport) instead of scroll offsets, which also covers a page that scrolls instead of the board box; `screenToScene(u, v, height)` takes the height above the board (a piece keeps its height while it falls on screen); `EffectRunner.update(now, level)` builds the frame itself; `BoardGeometry` also carries `cellPx`.
5. **Confetti height:** pieces fly 1.0 to 4.0 cells above the board instead of "z above 0.6 ± 1.5 cells": the flag tops reach about 0.81, so 0.6 would let flags hide pieces.
6. **Shake cap:** the push is scaled so its peak stays at most 5 px (`EFFECT_LIMITS.shakeMaxPx`) on large cells; measured peak on 9 × 9 at 800 px: 0.118 cell ≈ 4 px at 99 ms, exactly 0 from 396 ms.
7. **Confetti count for S2** is re-evaluated per frame from the governor level (`levelShare`), as designed; the shard counts of S1/S2 are absolute counts (8 / 6 / 4, level 2: 3), not factors.

**Calibration (UX §5, start → final; only changed values listed; tokens of §6 unchanged):**

| ID  | Start                                                      | Final                                                                                                | Why                                                                                                                                                                                                                                                                                               |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L4  | width 0.25 → 0.05 cell, opacity 0.6                        | width 0.40 → 0.08 cell, opacity 0.7                                                                  | the ring was a hairline at 180 ms                                                                                                                                                                                                                                                                 |
| L5  | 12 puffs, life 350–600 ms, Ø 0.8–2.4, alpha fade last 40 % | 16 puffs, life 400–650 ms, Ø 1.0–2.8 (× 0.8–1.2 per puff), outward 2.4 cells/s, alpha fade last 55 % | read as a small blob, not a fireball; the earlier fade removes a luminance swell in dark (below)                                                                                                                                                                                                  |
| L6  | 40 sparks, 0.05 × 0.18 cell, 6–10 cells/s                  | 56 sparks, 0.06 × 0.32 cell, 7–12 cells/s                                                            | barely visible streaks                                                                                                                                                                                                                                                                            |
| L7  | 0.18–0.30 cell                                             | 0.22–0.34 cell                                                                                       | shards visible as tile pieces                                                                                                                                                                                                                                                                     |
| L8  | 8 puffs, Ø 0.8–2.2                                         | 10 puffs, Ø 0.9–2.6                                                                                  | a readable smoke column; the marker stays visible through it at 900 ms                                                                                                                                                                                                                            |
| W1  | speed clamp(2.4 H, 10, 26), drag 3, 30°                    | speed clamp(3.0 H, 12, 32) × 0.7–1.1, drag 2, 30° ± 50 % (15–45°)                                    | with drag against the terminal fall the burst stopped at about 45 % of the window; now about 75 % and spread over the width                                                                                                                                                                       |
| W4  | clamp(round(2.5 × cells), 160, 320)                        | clamp(round(3.5 × cells), 220, 420)                                                                  | denser for hak's "spectacular"; measured coverage on 9 × 9 at 800 px (pixels that differ from the final board, 80 × 80 grid): 4.1 / 3.5 / 3.9 / 4.4 / 5.8 / 6.7 / 8.6 / 6.8 / 0.7 % at 150 / 400 / 700 / 1000 / 1200 / 1400 / 1800 / 2400 / 3300 ms: mean ≈ 5 %, peak 8.6 % (limits 6 % and 12 %) |
| —   | glow mask (not in UX)                                      | alpha (1 − r²)², full core, soft rim                                                                 | puffs looked smaller than their size                                                                                                                                                                                                                                                              |

Everything else is the UX start value (G1 2200, G2 3600, G3 250, L1–L3, L9–L12, W2, W3 sizes, W5, W6, S1, S2).

**Measurements:**

- **Scene chunk:** 145.4 kB gzip (was 137.3; budget 180, stop line 160).
- **AC5, `npm run measure:fps`** (headed, `ANGLE Metal Renderer: Apple M2 Max`, DPR 1.99, after the final look numbers except the fire fade start, which changes alpha only), two runs:

  | Measure (fps median / min, longest frame ms, level) | Run 1              | Run 2              | Floor |
  | --------------------------------------------------- | ------------------ | ------------------ | ----- |
  | A 16 × 30 cascade                                   | 59.5 / 56.9        | 59.4 / 58.6        | 50    |
  | A 16 × 30 loss effect                               | 59.5 / 56.4, 51, 0 | 59.4 / 56.4, 50, 0 | 50    |
  | A 16 × 30 win effect                                | 59.5 / 56.9, 42, 0 | 59.6 / 59.0, 33, 0 | 50    |
  | B 30 × 30 cascade                                   | 59.7 / 56.2        | 59.6 / 54.2        | 30    |
  | B 30 × 30 loss effect                               | 59.4 / 59.1, 16, 0 | 59.4 / 56.8, 42, 0 | 30    |
  | B 30 × 30 win effect                                | 59.6 / 54.2, 58, 0 | 59.7 / 56.5, 51, 0 | 30    |
  | B input latency median / max (ms)                   | 34.9 / 53.4        | 36.4 / 58.7        | ≤ 100 |
  | Layout self-check A / B (revealed, hidden safe)     | 380, 1 / 708, 12   | same               |       |

  The governor never left level 0, so no decoration had to be cut. The longest frame includes the click's React render (development build); on the 16 × 30 loss it is 50–51 ms, at the design's "no frame over 50 ms" hand check, with no shader compile (everything is pre-compiled). One earlier run in this session showed input latency 167 / 308 ms; the 009 script (from `HEAD`) showed 180 / 353 ms right after it on the same code, and three later runs (with and without the effect scenarios) gave 26–36 / 53–59 ms, so it was the machine, not the effects.

- **AC1/AC2 probe series (SwiftShader, 9 × 9 at 800 px, loss with 7 chain mines and one wrong flag):** `particles` > 0 from the click, `shake` > 0 only before 400 ms (0 from 396 ms), `minesPending` 7 → 6 → 4 → 2 → 0 by 1188 ms, `animating` 0 by 1584 ms, `running` false and all zero at 2376 ms; win: pieces from 150 ms, `running` false and all zero at 3700 ms. Mean canvas luminance, dark: 0.044 → 0.081 at 66 ms, then a monotone fall apart from a 7 %-of-range swell (0.0768 → 0.0795) to 0.050: one rise and one fall. Light: the bang darkens the board (orange fire and dark smoke over ivory: 0.608 → 0.577), then smoke clearing and mines flipping move it by about ±0.013 (absolute) until 1.6 s.
- **No replay, cancel, reduced motion:** by construction (`attach()` nulls `prev`; a new game and `detach()` call `finishEffects()`; the hook and the plan return nothing under reduced motion or when inactive), not probed separately (the tester's effects spec does); the existing 009 reduced-motion spec "a lost board is static" passes. By hand: a scheme change during an effect ends it at once (`fxState` all zero), and a 400 ms main-thread gap during an effect jumps to the static board.

**Open points / follow-ups:**

1. **Flash proxy in light (for the tester):** with the "rises of 10 % of the series' range" rule the light series can show 2 slow "rises" in a second (0.012 absolute luminance each, smoke clearing and mine flips, no flash). They are below WCAG's general-flash threshold (a change of 0.1 relative luminance) by a factor of 8 and inside AC1's "at most 3 per second", but they fail UX §9's stricter "one rise and one fall" if read on the light series. Suggest the tester counts rises of at least 0.1 absolute (or 10 % of the brighter value), or samples a rect around the mine.
2. Gate-2 stills and recording (UX §14) are the tester's; my look-check stills are evidence only.
3. The `measure-fps` latency outlier above: if it recurs at the tester's run, re-run once before treating it as a defect.

**Review round 1 follow-up (developer, 2026-11-03).** Fixed in round 1:

1. Finding 1 (gap watchdog): the frame-gap rule is removed (`onFrame`, `fxStartTs`, `FX_GENERAL.jumpGapMs`). A hidden tab still ends the effect via `visibilitychange`; a slow frame no longer does, because the closed-form effects show the right picture at any frame time and end by the scene clock. This supersedes deviation 3 above and UX G3 ("jump after a 250 ms gap") and the UX §7 hidden-tab row ("after a gap over 250 ms"): the board is static on return because the effect was ended when the tab was hidden. Real loop on SwiftShader, 9 × 9: the effect is still `running` at 597, 1186 and 1189 ms after the click (first frame 597 ms) and after a 400 ms main-thread block; before the fix it was cut at about 568 ms. A scheme change still ends it at once.
2. Finding 2: the luminance table is built inside the probe's `luminance()`, so it is dropped with the probe; `dist/` no longer contains it (the only `0.04045` left is three's own sRGB conversion).
3. Finding 3: the `visibilitychange` listener is registered after `renderer.compile` and `endEffects.rest()`, the last steps that can throw.
4. Finding 4: the per-frame path allocates nothing new. `shakeAt`, `bloomAt` and `screenToScene` write out-parameters (scratch objects of `endEffects`; the defaults still return fresh objects for the unit tests). `putSmoke` is built once per effect. Plain index loops replace `forEach`/`reduce` in the frame path. `EffectRunner.update` filters in place without a thunk per effect.
5. Finding 5: `state()` builds the probe object on demand (`minesPending` counted from the last elapsed time). The frame path only assigns three plain values.
6. Finding 7: `effects.ts` reports a failure once and disposes a failed effect once (`disposeSafely`); no second `dispose()`, no empty `catch`.

Findings 6 (real-loop e2e) and 8 (test set) are for the tester and the architect. Finding 9 (blending threshold in code, always-on point light) is unchanged, as the reviewer suggested.

Checks after the fixes: `npm run verify` exit 0 (95 app unit tests, 154 platform, 5 others; lazy chunk 145.4 kB gzip); `npm run test:e2e -w apps/minesweeper` 108 of 108 pass; `npm run measure:fps` (headed, M2 Max): 16 × 30 cascade 59.4 / 59.2, loss 59.5 / 57.0 (longest frame 50 ms), win 59.5 / 58.8; 30 × 30 cascade 59.4 / 54.5, loss 59.5 / 56.6, win 59.6 / 54.5; latency 29.5 / 54.4 ms; level 0.

## Test report

_tester: AC → test mapping, results, defects found._

tester, 2026-11-03. New spec `apps/minesweeper/e2e/minesweeper-3d-effects.spec.ts`: **12 test runs from 8 test definitions** (the flash test is parametrised, 4 runs; AC3 2 runs); no unit test added (the developer's `endPlan.test.ts` and `timeline.test.ts` cover the pure limits). Driven by the dev-only probe on SwiftShader (`pause`, `holdSway`, `advance`, `fxState`, `luminance`); the timer runs on `page.clock`. Every test also fails on a console error or uncaught exception (the effects are isolated and would otherwise fail silently).

| AC       | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Result |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC1      | `AC1: a loss shows the message and a stopped timer at once, plays an explosion that is drawn, shakes for at most 0.4 s, reveals the mines one after another and ends within 2.5 s as a static board`: message and `Time: 3` frozen with the scene clock still at the click (and after the page clock runs 5 s more); fire-token coloured pixels on the canvas at 180 ms (> baseline + 150); shake > 0 at 180 ms and exactly 0 at every sample from 400 ms; `minesPending` never rises, starts > 0, ends 0, at least 3 distinct values (8 chain mines); at 2500 ms fx state all idle, frame identical 5 s later | PASS   |
| AC1      | `AC1: Start during the effect stops it at once; a preset alone changes nothing until Start`: preset alone leaves board and effect; preset then Start and Start alone give fx idle and a static frame with no `advance`                                                                                                                                                                                                                                                                                                                                                                                         | PASS   |
| AC2      | `AC2: a win shows the message and a stopped timer at once, plays confetti that is drawn and leaves the board readable, and ends within 4 s without a loop`: message, counter 0, frozen timer at click time; confetti-token pixels exceed the final board by > 150 px; no shake; busiest frame covers < 15 % of the canvas beyond the final board; at 4000 ms idle and the frame is identical 5 s later                                                                                                                                                                                                         | PASS   |
| AC2      | `AC2: during the celebration the presets, the view control and Start work; Start stops it at once`: preset works and the celebration goes on; 2D shows the board without canvas, switching back shows no replay; Start stops a second celebration at once                                                                                                                                                                                                                                                                                                                                                      | PASS   |
| AC1, AC2 | `AC1/AC2: nothing flashes more than 3 times in any second of the loss/win effect (light/dark)`, 4 runs, plus the self-test of the counter. Definition below                                                                                                                                                                                                                                                                                                                                                                                                                                                    | PASS   |
| AC3      | `AC3: switching to 3D after a loss/win shows the static final board without an effect, whether the game ended in 3D or in 2D` (2 runs): ended in 3D then 3D -> 2D -> 3D, and ended in 2D then 3D: fx idle at once, frame identical to the end-of-effect frame and stable 2.5 / 4 s later                                                                                                                                                                                                                                                                                                                       | PASS   |
| AC4      | `AC4: with reduced motion a loss and a win show the static final board at once, and the two are clearly different`: fx idle right after the click, frame equal to the frame 3 / 4.5 s later; lost names (exploded mine, mines, wrong flag), right flag stays; red disc pixels at the exploded cell (> 200) on the lost board, none (< 10) at that cell on the won board; won: counter 0, every mine cell flagged, no exploded mine                                                                                                                                                                             | PASS   |
| AC5      | `npm run measure:fps -w apps/minesweeper` run by me on hak's Mac (ANGLE Metal, Apple M2 Max, DPR 1.99), table below                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | PASS   |

**Flash rule used (WCAG 2.3.1 style, stricter than WCAG's 0.1 absolute).** An opposing change is a swing of luminance between two turning points (found with a 5 % hysteresis) of at least 10 % of the brighter of the two values; a flash is two consecutive opposing changes; the rate is the largest number of flashes completed in any 1 s window. Series: probe `luminance()` every 33 ms in the first second and every 100 ms after, to 2.6 s (loss) / 4.1 s (win), measured on three areas: the whole canvas, a 341 x 256 px window (the WCAG area) and 150 px around the mine (the board centre on a win). Results (flashes per second, whole / 341 x 256 / 150 px): loss light 0 / 0 / 1, loss dark 2 / 2 / 2, win light 0 / 1 / 1, win dark 1 / 1 / 1. The same series with a 5 % swing threshold: at most 2 per second everywhere. The developer's finding is confirmed: light shows slow +/-0.01 absolute changes (smoke, mine flips), 2 to 3 % of the value, which this rule rightly does not count. Mutation: a full-screen white strobe in `renderFrame` (11 flashes per second) fails all four runs; a four-pulse bloom in `bloomAt` fails dark (in light the pulse is hidden under the fireball and changes no luminance, which is correct).

**Frame rate (AC5), my runs, headed, level 0 in all rows:**

| Measure (fps median / min, longest frame ms) | Run 1                    | Run 2           | Floor  |
| -------------------------------------------- | ------------------------ | --------------- | ------ |
| A 16 x 30 cascade                            | 59.5 / 59.1              | 59.5 / 59.4     | 50     |
| A 16 x 30 loss effect                        | 59.3 / 54.0, 67          | 59.4 / 56.9, 50 | 50     |
| A 16 x 30 win effect                         | 59.5 / 52.1, 58          | 59.6 / 57.0, 42 | 50     |
| B 30 x 30 cascade                            | 59.6 / 53.9              | 59.4 / 54.4     | 30     |
| B 30 x 30 loss effect                        | 59.4 / 51.8, 75          | 59.3 / 57.2, 42 | 30     |
| B 30 x 30 win effect                         | 59.5 / 54.6, 59          | 59.5 / 54.4, 58 | 30     |
| B input latency median / max (ms)            | **111.8 / 211.4 (FAIL)** | 35.0 / 54.9     | <= 100 |

Run 1 had the latency outlier the developer also saw once (cold start of the dev server); the re-run was clean (35 / 55 ms), as were the developer's four other runs, so it is not treated as a defect. The fps rows are the floors with a large margin.

**Mutation checks (each new assertion shown failing once, source restored and diffed afterwards):** effect root hidden at render (counters stay non-zero, nothing drawn) fails the loss "fire pixels" and win "confetti pixels" assertions; shake duration 600 ms fails "no shake from 0.4 s"; chain step 0 fails "one after another"; loss end 2600 ms and win end 4500 ms fail the idle-at-limit checks (and AC3); no `finishEffects` on detach / new game fails both cancel tests; hook without the `prev` rule (replay) fails both AC3 runs; hook ignoring reduced motion fails AC4; static exploded marker removed fails the AC4 disc check; a canvas covering the page while an effect runs fails the operability tests (click intercepted); a Timer that ignores `endedAt` fails both lifecycle tests; a throw inside the effect fails the console-error guard; strobe and bloom mutants above fail the flash tests.

**Probes, checked, OK (throwaway specs, deleted):** 30 x 30 at 1280 and 375 px and 16 x 30 at 800 px: loss and win end by themselves (`running` false, particles 0, animating 0 after the limit), no console error; clicking and right-clicking the read-only board and pressing Space during an effect does not stop it; Enter on a focused mine loses and focus stays on that cell; a colour-scheme change during an effect ends it at once; forced colours: canvas host `display: none`, message shown, no effect; real loop (no probe): a 600 ms main-thread gap ends the effect (static board, no replay) and an undisturbed real run is idle after 2.9 s; double Start (cancel test) leaves a clean board. Not checked: quality level 2 (the governor cannot be forced from e2e), a hidden tab (no way to emulate `visibilitychange` reliably; the gap jump was checked instead).

**Gate-2 media** (after the last e2e run, `screenshots/010/`, gitignored, 55 stills at DPR 2 in light and dark, full page, headed real GPU, plus one recording of 27.9 s). UX §14 items 1 to 12, 14 and 15 are covered; item 13 (focus ring above the confetti) is visible in `06-win-0700-*` (focus stays on the winning cell); item 16 (quality level 2) is not captured, the level cannot be forced.

**Defects:** none found. Observations (not defects): the focus ring is off its tile by the shake peak for 0.4 s (accepted in the design); the first measure-fps latency outlier above.

**Verdict: PASS.** `npm run verify` green (95 unit tests, build, dist check ok, lazy chunk 145.4 kB gzip); `npm run test:e2e` 108 / 108 (96 before + 12), the new spec also 3 repeats in a row (36 / 36).

**Round 1 regression (tester, 2026-11-03), review finding 6.** The reviewer was right that my earlier real-loop probe ("idle after 2.9 s") was vacuous for "plays": it is also idle when the effect is cut after one frame (the frame-gap watchdog did that after about 570 ms on software WebGL). Two new tests in `minesweeper-3d-effects.spec.ts`, describe `real loop` (no `pause()`, real clock, 375 px wide, a warm-up game first because the first end of a game pays one-time costs, keyboard input because the sway makes cells never "stable" for Playwright), **total 2 new tests, now 14 test runs from 10 definitions**:

| Test                                                                                                                       | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Result |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `AC1: on the real clock the explosion survives the slow first frames, is drawn, and ends by itself`                        | time zero is taken by a mutation observer in the commit that shows the message (and starts the effect). The effect is seen running at the first frame, the first frame that sees it ended is at or after 2.0 s (it lasts 2.2 s; the bug ended it at about 0.57 s), it is idle with 0 particles by 5 s at the latest, and the luminance around the mine while it runs (read once after 0.4 s, dark) is more than 1.1 times that of the final board (measured about 1.7 times) | PASS   |
| `AC1: on the real clock a blocked main thread does not end the explosion, a hidden tab and a scheme change end it at once` | a 400 ms main-thread block plus two animation frames mid-effect: still running (and the check happens inside the 2.2 s), then it ends by itself; a `visibilitychange` with `document.hidden` overridden to true: running false, 0 particles, 0 animations in the same step and before its own end; a colour-scheme change: idle within 1.5 s and before its own end                                                                                                          | PASS   |

The `real loop` describe uses `retries: 2` because frames can stall for seconds when six workers share the CPU on software WebGL (2 of 12 parallel runs failed once without it); a real regression fails every attempt. Unmutated: 20 / 20 in a parallel run of 10 repeats, plus 3 solo runs.

Mutations (each applied with the dev server given 4 s to pick it up, source restored and diffed afterwards): re-adding a 250 ms frame-gap rule (`if (effects.running && ts - lastCallbackTs > 250) finishEffects()` in `onFrame`) fails both tests on all three attempts; removing the `visibilitychange` listener fails the hidden-tab step; removing `finishEffects()` from `setPalette` fails the scheme step; hiding `effects.root` fails the luminance check. (One run of the gap mutant right after writing the file showed test 2 passing: the dev server had not yet re-served the file; with the settle time it failed 3 / 3 solo and in combination.)

Regression: `npm run verify` exit 0 (95 app, 154 platform, 5 other unit tests; build; dist check ok, lazy chunk 145.4 kB gzip). `npm run test:e2e`, all projects: **110 / 110** (108 before, plus the 2 new). The gate-2 stills and the recording in `screenshots/010/` are kept: the developer's round 1 fixes (watchdog removed, allocations, probe cost, listener order) change no look, and the paused-probe tests (frame equality, pixel counts) still pass unchanged. Verdict unchanged: **PASS**. Status stays `in-review`.

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

**Round 1, reviewer 2026-11-03. Verdict: APPROVED.** No blockers or majors; six minors and three nits (none needs to hold the merge; 1 to 3 are worth fixing before or right after gate 2).

Checked myself: `npm run verify` green (95 unit tests, build, dist check ok, lazy chunk 145.4 kB gzip); `minesweeper-3d-effects.spec.ts` and `minesweeper-3d-scene.spec.ts` in project `chromium`: 33 / 33. Scratch probes in the scratchpad (outside the repo):

- Resource counts via a patched WebGL context, 8 games (loss and win alternating, a dark switch and a 2D round trip in between): buffers, textures, programs, shaders, vertex arrays and framebuffers are identical after game 1 and game 8 (the one step is the 009 environment map on the scheme switch, once). One canvas. **No program is added by the first loss or win**, so the compile-then-hide fix works.
- `visibilitychange` listeners: 1 added, removed at `dispose()` (not per game).
- Real loop (no probe pause) on SwiftShader: see finding 1.

**Findings**

1. [minor] `createBoardScene.ts:592-602` (gap watchdog in `onFrame`) — measured in the real loop on software WebGL, 9 × 9: the explosion is on screen for about 400 ms and then jumps to the static board at 568 ms (`fxState.running` true at 151 to 527 ms, false from 568 ms; the frame counter stalls for about 350 ms in between). The first effect frame carries the instance rewrite, the shadow pass and the particles, takes more than `jumpGapMs` (250 ms), and the gap is counted from that frame (`lastCallbackTs >= fxStartTs` only skips the gap that ends at the first frame, not the one it causes). On a device whose first frame is that slow (software WebGL, a weak phone) the effect never plays. The ACs still hold (static final board, message at once), and on hak's Mac it is not seen (measure-fps non-vacuity row passes, longest frame about 50 ms). But the rule buys little: the effects are closed-form in the scene time, so a late frame already shows the right picture and ends at `lossEndMs`/`winEndMs`; a hidden tab is already handled by `onVisibility`. Fix: drop the gap rule, or count only gaps whose start frame is at least two frames after `fxStartTs`. The tester's "undisturbed real run is idle after 2.9 s" cannot show that the effect plays (it is also idle when cut after one frame); if the rule stays, keep one real-loop check that `running` is still true 300 ms after the click on a 9 × 9 board.
2. [minor] `createBoardScene.ts:108-112` — the dev-only luminance table `LINEAR` (`Array.from({ length: 256 }, …)`) is a module-level statement, so it stays in the production chunk (found in `dist/assets/createBoardScene-*.js`) although only the probe uses it. Violates "dev-only code must never reach a production build" (harmless, 256 `pow` calls at load, but `check-dist` cannot see it because it has no identifying string). Fix: compute the table inside `luminance()` (it is then dropped with the probe), or inside the guarded block.
3. [minor] `createBoardScene.ts:569-575` — the `visibilitychange` listener is added in `buildController` before `renderer.compile`. If compile (or anything after) throws, `createBoardScene` disposes the renderer but the document listener, which holds the controller, stays for the page's lifetime. Fix: register it after `compile` (and the `endEffects.rest()` call), or in a try/finally.
4. [minor] `endEffects.ts:527`, `endPlan.ts:121,131`, `effects.ts:58-63`, `endEffects.ts:395,523,538` — the per-frame path allocates although `SceneEffect.update` is documented as "Allocation-free" and the design promised no per-frame allocation: `screenToScene` returns a new array per confetti piece per frame (up to 420 per frame), `shakeAt` and `bloomAt` return objects, `last = {…}` per frame, closures (`putSmoke`, `forEach`/`reduce` callbacks, the `safely` thunk per effect, `effects.filter`). Not visible at the measured 59.5 fps on the M2 Max; it is GC churn (about 25 000 short-lived arrays per second during a win) for weaker phones. Fix: an out-parameter for `screenToScene`, plain loops, preallocated results.
5. [minor] `endEffects.ts:476-488` — dev-probe state is computed in production: the `minesPending` loop over the chain (up to 891 mines) and the `last` object are built every frame for `fxState`, which only the e2e probe reads. Cheap, but it is dev-only work in the shipped path; compute it lazily in `state()` from the last elapsed time.
6. [minor] No automated check of the lifecycle paths that are not driven by the probe: the gap watchdog and the hidden tab (`onFrame`, `onVisibility`, UX G3), and a scheme change during an effect. The tester probed them by hand (throwaway specs). They are exactly where the developer already had one bug (deviation 3), and finding 1 shows the real loop is not covered at all. One real-loop e2e (block the main thread for about 400 ms mid-effect, expect idle and a static frame; in the same test an unblocked run is still `running` after the first frames) would cover the race. Not needed for the rest.
7. [nit] `effects.ts:20-30` — `safely` calls `effect.dispose()` a second time inside its `catch` when `dispose` itself is what failed (in `clear()`); harmless (`hideAll` is idempotent) but the nested empty `catch` hides a second failure. The try/catch is otherwise scoped tightly: only the hook call in `update()` and per-effect `update`/`dispose`; it logs with `console.error`, it is not silent, and the effects spec fails on any console error.
8. [nit] Test proportionality (`minesweeper-3d-effects.spec.ts`): the AC2 second test re-asserts "no replay after 2D → 3D", which the AC3 test owns; the AC1 cancel test runs the same remount path three times (preset + Start, then Start alone); the flash rule is a unit rule plus four e2e runs plus a self-test of the counter. All of this follows the architect's minimal test set, so it is input for the architect, not a defect of the tester. The 0.15 coverage bound is looser than the UX 6 % / 12 %, which fits "intent, not design values".
9. [nit] `endEffects.ts:87,588-592` and the always-present `PointLight` — two judgement calls to keep in view: the additive/normal blending is chosen by a luminance threshold in code (`DARK_SURFACE`) where the other scheme-dependent numbers are tokens; and the flash light costs every lit fragment for the whole session, in the light scheme with intensity 0 for nothing. Both are measured only on the M2 Max (59.5 fps); no action unless a weaker GPU shows a regression.

**Answers to the points asked**

- **Lifecycle:** cancel on new game (`finishEffects()` in `update()` for a new id and in `detach()`), no replay (`prev === null` after attach, `isEnded(prev)` check in the hook, `ends` only for the same game id), reduced motion and forced colours (`reducedMotion || !active` in plan and hook), scheme change (`setPalette`), hidden tab (`onVisibility`), context loss (`dispose` incl. `endEffects.dispose()`): all correct by reading and consistent with the e2e. Gap watchdog: finding 1. No GPU or listener leak across games (probe above).
- **The two 009 seam fixes:** no side effect on 009. The traversal skip only excludes children of `effects.root` (nothing was there in 009); showing the effect objects for `renderer.compile` and hiding them with `rest()` keeps the program count constant through the first end. Intended 009 changes: a win is no longer static (reveal wave and plants play), and `setPalette` and `setMotion(!active)` now also drop a running 009 reveal (a scheme switch mid-cascade snaps it; benign).
- **try/catch exception to 009's rule:** scoped tightly and logged (finding 7).
- **Shader patch, seeded particles, blending:** `onBeforeCompile` patch is four string replaces on stable three includes (`common`, `begin_vertex`, `color_fragment`); it silently does nothing if an include is renamed by a three update, which the e2e pixel checks would catch only loosely (the stated fallback is fading by scale). Particles are seeded (`mulberry32`, no `Math.random`) and closed-form; all limits are unit-tested for every board size and level.
- **Performance:** effects-only frames skip `writeInstances` and the shadow pass (`boardMoving` vs `animating`); buffer uploads use update ranges for the live count only. Allocations: finding 4.
- **Input latency:** nothing in the click path of an ordinary reveal or flag can explain 110 to 170 ms. The new code there is `boardGeometry` (closures only, no DOM read), the early return of the hook, and `effects.update` on an empty list. The DOM read (`visibleWindow`, one forced layout) happens only on the winning click, the effect planning (about 900 `cellView` calls, sorts) only on the losing or winning click, and I measured no shader compile or new GPU object at the first end. The latency rows run on the dev build with React in development mode on a 30 × 30 board, after two heavy scenarios; the developer's 009-from-`HEAD` run on the same machine showed the same spike, and four other runs gave 26 to 36 ms. Machine load or a cold dev server is the plausible cause. No defect.
- **Dev-only additions:** `fxState` is forbidden in `dist-check.json` and absent from `dist/`; the probe is installed only under the literal `import.meta.env.DEV && import.meta.env.MODE === 'e2e'` guard (lines 804 and 931, unchanged form). `luminance` sits in the same unguarded `probeInternals` object, which is dropped; the table behind it is not (finding 2).
- **New e2e spec and the 009 edit:** asserts intent (limits of the ACs, pixels of token colours on the canvas, `fxState` counters, frame equality), not design values; every assertion that matters was shown failing by the tester's mutations; the console-error guard makes the isolated `try/catch` non-silent. The 009 edit (2000 to 2600 ms) is needed (the effect runs to 2200 ms) and sufficient.

## Retrospective

_orchestrator, 2026-11-03._

Went well: UX and design ran in parallel and the architect aligned them himself (14-row
table, no contradictions left); all look numbers in one file made calibration fast;
fps ≈ 59.5 on hak's Mac in all six cascade/loss/win rows; the tester mutation-checked
every assertion; review APPROVED in round 1. A usage limit interrupted the tester once;
resuming the agent worked.

### What went wrong

| #   | Problem                                                                                                                                                         | Root cause                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| P1  | 009's 16 × 30 fps figure was invalid: the script's layout A won the game with the first click, so a static board was measured. Nobody noticed in 009.           | The measurement script never checked that its scenario actually happens (game keeps running, something moves). |
| P2  | Two bugs in the 009 effects seam made the effects invisible while the probe counters looked normal; the tester's first real-loop check was vacuous for "plays". | Visual effects were checked through counters and end states, not through pixels or frames.                     |
| P3  | Review finding 1: a 250 ms frame-gap watchdog (UX G3, designed in) cut the explosion off on slow first frames; the paused-probe e2e could not see it.           | A frame-timing rule on clock-based animations; no real-loop test for logic that depends on real frame timing.  |
| P4  | Review finding 2: a module-level lookup table used only by the dev-only probe reached `dist/`; `check-dist` couldn't see it.                                    | The dev-only rule covered guarded call sites and strings, not module-level helpers of dev-only code.           |
| P5  | The real-loop e2e needs `retries: 2` on SwiftShader under parallel load.                                                                                        | Real-clock tests on software WebGL; accepted, documented in the spec.                                          |

### Proposed changes

1. **`CLAUDE.md`, Conventions (P1):** measurement and check scripts verify that their
   scenario is non-vacuous (e.g. the game keeps running, something animates) before
   they report a number.
2. **`CLAUDE.md`, Test proportionality / Independent tests (P2, P3; developer's and
   reviewer's suggestions):** counters and state prove that code ran, not that pixels
   changed — every check of a visual effect includes at least one pixel or frame
   comparison; logic that depends on real frame timing gets one real-loop test that
   proves the effect plays, not only that it ends.
3. **`CLAUDE.md`, Dev-only code (P4; developer's and reviewer's suggestion):** helpers
   used only by dev-only code (lookup tables, counters) live inside the guarded
   function, never at module level, because they survive tree-shaking and
   `check-dist` can't see them.
4. **`architect` (P3):** clock-based animations get no frame-gap watchdog; a hidden tab
   is handled with `visibilitychange`.
5. **Story 010, AC1 and AC2 (wording):** "when I start a new game with "Start" or a
   preset" becomes "when I start a new game with "Start" (a preset alone only fills the
   fields, [006/AC2](006-minesweeper-presets-timer.md))"; behaviour unchanged, as built
   and tested.
6. **`check-structure` (devops; tech-writer's suggestion):** fail when a story's status
   in the root index differs from its frontmatter (the index lagged twice in 010/011).

### Outcome

hak accepted the look and the recording and approved all six proposals at gate 2
("Ja, alles", 2026-11-04). Applied: 1, 2 and 3 in `CLAUDE.md` (Conventions "Measurement
scripts", Test proportionality, Dev-only code); 4 in `.claude/agents/architect.md`; 5 in
AC1/AC2 of this story (UX text aligned); 6 in `scripts/check-structure.mjs`.
