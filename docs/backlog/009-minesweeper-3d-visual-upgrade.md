---
id: 009
title: Minesweeper 3D visual upgrade, a lit 3D scene with reveal and flag animations
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
branch: feature/009-minesweeper-3d-visual-upgrade
supersedes: []
changes: [008/AC3, 008/AC6, 008/AC7] # 008 stays done; its switch (AC1, AC2, AC8), game behaviour (AC4) and accessibility (AC5) are kept
superseded-by:
---

# 009 – Minesweeper 3D visual upgrade, a lit 3D scene with reveal and flag animations

## Original request

> sorry, das 3d ist aber komplett langweilig. das soll graphisch was her machen

Note: hak, 2026-11-02, German, given right after story [008](008-minesweeper-3d-mode.md) was merged. It is feedback on the 3D view built there. At gate 1 hak confirmed a split: this story (a) is the lit 3D scene with reveal and flag animations, performance, reduced motion, parity and loading/fallback; the loss and win effects are story (b) [010](010-minesweeper-3d-end-effects.md), which depends on this one.

## User story

As a player, I want the 3D view to look spectacular (real depth, light and shadows, lively reveals and flags), so that playing in 3D is worth choosing over the plain 2D view.

## Context

hak finds the result of [008](008-minesweeper-3d-mode.md) (a tilted DOM grid with a fixed angle, relief from shadows, instant switch) "completely boring" and wants it to be visually impressive. "Graphisch was her machen" is subjective; it is read as: real 3D look (depth, lighting, soft shadows) and motion that rewards actions (reveal, flag). The look is signed off by hak at gate 2 on screenshots and a screen recording of at most 30 s; the ACs make the measurable parts testable.

**This partly reverses gate 1 of 008**, where hak accepted "a fixed angle, no camera" over a full 3D scene. hak was asked again and confirmed (Decision log, Q1): a real lit scene, but still **no orbit, zoom or pan** by the player. 008/AC3 (look) and 008/AC6 (motion: nothing moves by itself) are therefore changed here; 008/AC7 (fallback) is extended by new ways 3D can be unavailable.

Confirmed by hak at gate 1 ("Ja, alle Vorschläge", 2026-11-02; see Decision log):

- **Style:** glossy, slightly rounded tiles on a dark stone table, warm key light, soft shadows; the scene follows light and dark like 2D.
- **Camera:** fixed default tilt of at most 35° plus a gentle idle sway of at most 3° with a period of at least 10 s; no user control.
- **Effects in this story:** reveal flip/sink with a wave on opened areas, flag planting. The loss explosion (with camera shake) and the win celebration are in story 010.
- **No sound.** 3D stays switchable during a game; large boards behave as in 008 (the board scrolls in its own box, 30 × 30 playable, no width cut-off); phones get no frame-rate number, effects reduce automatically.
- **Reference machine** for the frame-rate floor is hak's Mac; the tester measures there and hak confirms at gate 2.

Kept from 008: the "View" control and its place, state preservation when switching (008/AC2), game behaviour in 3D (008/AC4), accessibility structure and focus indicator (008/AC5), 2D as the default after reload and sign-in (008/AC8), light and dark schemes, a drag scrolls the board and never rotates the camera, the view is not remembered. The 2D view is not touched.

Feasibility check by the architect (consequences recorded in the Decision log; the Technical design will work them out):

- The scene is built with plain three.js (no React wrapper libraries), loaded lazily when 3D is first chosen; about 150 to 180 kB gzip extra, accepted by hak. New dependency, therefore an ADR.
- The existing DOM grid stays as a transparent overlay aligned to the camera, so input (mouse, long-press, keyboard, drag-scroll) and the screen-reader structure are unchanged.
- Digits, flags and mines are drawn unlit or emissive so the contrast rules of [007/AC3](007-minesweeper-redesign.md) hold at every camera position.
- The scene renders on demand; the idle sway is the only continuous loop. Losing the rendering context returns the view to 2D with a message (AC6).
- End-to-end tests run on software WebGL, where wall-clock timing is unreliable; they use a dev-only time and sway probe (dev builds in the e2e mode only, with an entry in the dist check). The frame-rate check (AC3) is a script in headed Playwright on hak's Mac, not part of CI.
- The scene has a small seam for effects so that [010](010-minesweeper-3d-end-effects.md) is additive.

Numbers in the ACs (durations, sway angle, luminance thresholds) were proposed by the product owner for testability and confirmed by hak. The pixel checks in AC1 are proxies for "looks lit and has depth"; the tester may pick the sample points.

## Acceptance criteria

- **AC1:** Given the 3D view with a running game, when I look at the board, then it is shown as a lit three-dimensional scene: tiles have visible thickness (side faces at least 15 % darker than the top face), hidden tiles are raised and revealed tiles are sunk into the board, flags and mines are 3D objects, raised tiles and objects cast soft shadows (the surface next to a raised tile is at least 10 % darker than the lit surface farther away), digits, flags and mines keep the contrast rules of [007/AC3](007-minesweeper-redesign.md) at every camera position, the camera looks at the board at a tilt of at most 35° and sways gently by at most 3° with a period of at least 10 s (two frames taken 3 s apart differ, none shows a tilt above 35°), and the cells of the far row are at least 24 px wide on screen. (Verified by sampling rendered pixels in the same test run; no committed reference images. Replaces the look of 008/AC3.)
- **AC2:** Given the 3D view and a running game, when I reveal a cell, then it flips or sinks within 150 to 400 ms; when the reveal opens an area, then the newly opened cells animate as a wave that starts at the clicked cell, and the final state is shown at the latest 1.2 s after the click on any board size; when I flag or unflag a cell, then the flag is planted (or removed) with a short animation of at most 300 ms; and in all cases the game state, the counter, the accessible names of the cells and my next input (reveal, flag, keyboard) take effect immediately without waiting for an animation to end. (Verified by frames taken during and after the animation, and by the accessible name of a cell that already shows the new state at the first frame.)
- **AC3:** Given the 3D view on the reference machine (hak's Mac), when I play a 16 × 30 board including a large cascade, then the frame rate stays at 50 fps or higher (median over the cascade and the following 2 s), and given a 30 × 30 board, then it stays at 30 fps or higher and my input is visibly answered within 100 ms, animations being reduced in size or number rather than slowing the board down. (Verified by a script in headed Playwright on the reference machine; not part of CI.)
- **AC4:** Given I have set the system to reduce motion, when I use the 3D view, then the camera does not sway, there are no flip, wave or plant animations, every state change (revealed cells, flags, a lost or won game) is shown immediately as a static picture that is still readable, and switching the view is immediate; and given normal motion settings, then the only motion that continues without my action is the sway of AC1, and every animation caused by my action ends by itself. (Replaces the motion rule of 008/AC6; the 300 ms limit for switching the view stays.)
- **AC5:** Given the 3D view, when I switch between 2D and 3D during a game, play with the mouse, long-press, drag and the keyboard (arrow keys, Enter or Space, F), and lose or win a game, then [008/AC2](008-minesweeper-3d-mode.md), AC4 and AC5 still hold: the same cells, flags, counter, timer and result in both views, the same rules, the same gestures (a drag scrolls the board and never turns the camera), a lost or won game shows its final board and message as in [005/AC9 and AC10](005-minesweeper.md) (as a static picture; no loss or win effect is required here), the same grid structure and cell names for a screen reader, and a visible focus indicator on the focused cell of at least 2 px and 3:1 contrast in both colour schemes.
- **AC6:** Given I choose "3D" for the first time, when the 3D part has to be loaded, then I see a loading indication, the 2D board stays usable, and the 3D board replaces it when ready; given the loading fails or takes longer than 10 s, then I see a short message that 3D could not be loaded, "2D" stays the current view and the game is unchanged; given a browser or device that cannot show the 3D scene, then "3D" is shown as unavailable with a short text; given the 3D rendering is lost during a game, then the view returns to 2D with a short message, the game state is kept, "2D" remains usable and no blank board or error page appears. (Verified by simulating a slow or failing load, a missing capability and a lost rendering context. Extends the fallback of 008/AC7.)

## Out of scope

- The loss explosion with camera shake and the win celebration: story [010](010-minesweeper-3d-end-effects.md).
- Free camera control by the player (rotate, zoom, pan): hak confirmed the camera stays free of user control. It would change the gestures of [008/AC4](008-minesweeper-3d-mode.md) and needs its own story.
- Sound and music (hak: none in this story).
- Any change to the 2D view, the rules, board sizes, presets or the timer.
- Remembering the chosen view or any visual setting across reload; settings to turn effects on or off (the system "reduce motion" setting is the only switch, AC4).
- Themes the player can choose between; one visual style is built.
- Backend, accounts, scores or sharing.

## Open questions

None.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-02 — Story created from hak's request (German, verbatim). "Komplett langweilig, das soll graphisch was her machen" read as a request to make the 008 3D view visually impressive (assumption: real depth, lighting and shadows, animated reveal and flag, loss and win effects). This partly reverses hak's gate-1 decision in 008 ("fixed angle, no camera"), so it was asked again. `changes: [008/AC3, 008/AC6, 008/AC7]`; 008 stays done and is marked "(changed by 009)" on those ACs. 8 ACs, one above the ~7 guideline, with a proposed split. Open questions 1 to 11 with proposed defaults. Status draft. (product-owner)
- 2026-11-02 — Q1: Reversal of "fixed angle, no camera" (008 gate 1)? Proposed: a real scene with light, shadows and effects, but no orbit, zoom or pan. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: Context; Out of scope; 008/AC3 and AC6 changed.
- 2026-11-02 — Q2: Visual style? Proposed: glossy, slightly rounded tiles on a dark stone table, warm key light, soft shadows, following light and dark. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: Context; AC1.
- 2026-11-02 — Q3: Camera? Proposed: fixed tilt of at most 35° plus idle sway of at most 3° with a period of at least 10 s. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: AC1 and AC4 (sway stops under reduced motion).
- 2026-11-02 — Q4: Which effects and durations? Proposed: all four effects (reveal wave, flag planting, explosion with particles and camera shake, win celebration), durations as listed, at most 3 flashes per second, camera shake included. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed, with the split below. Consequence: reveal and flag in AC2 of this story; explosion and celebration in [010](010-minesweeper-3d-end-effects.md).
- 2026-11-02 — Q5: Sound? Proposed: none. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: Out of scope.
- 2026-11-02 — Q6: Switching during a game and after the end? Proposed: switchable, state preserved, no replay of end effects when switching to 3D after the end. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: AC5 (008/AC2 holds); the no-replay rule is in story 010.
- 2026-11-02 — Q7: Large boards and small screens? Proposed: as 008 (own scroll box, far-row cells at least 24 px, 30 × 30 playable, no width cut-off, effects shrink). — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: AC1 (24 px), AC3 (30 × 30).
- 2026-11-02 — Q8: Performance floor and reference machine? Proposed: 50 fps on 16 × 30, 30 fps on 30 × 30 on a typical laptop, reference machine to be named; phones no number. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed; reference machine is hak's Mac, the tester measures there and hak confirms at gate 2; phones get no fps number. Consequence: AC3.
- 2026-11-02 — Q9: Technology and download size? Proposed: architect's call, size reported to hak, loading timeout 10 s. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed; about 170 kB extra lazy download accepted. Consequence: Context (architect feasibility); AC6 (10 s timeout).
- 2026-11-02 — Q10: Light and dark scheme? Proposed: the scene follows the scheme, with the 007/AC3 contrast rules. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: AC1.
- 2026-11-02 — Q11: Sign-off at gate 2? Proposed: screenshots plus a screen recording of at most 30 s, recorded by the tester. — A: "Ja, alle Vorschläge" (hak, gate 1) = as proposed. Consequence: Context; the UX design lists the exact states (for this story: running game, reveal cascade, flag planting, light and dark, 375 px).
- 2026-11-02 — Scope decision: split the 8 ACs. — A: "Ja, alle Vorschläge" (hak, gate 1) = accepted. Consequence: this story keeps the scene, reveal and flag, performance, reduced motion, parity and loading/fallback and is renumbered to 6 ACs (old AC1, AC2, AC5, AC6, AC7, AC8 became AC1 to AC6; no design existed yet, so renumbering was safe); the loss and win effects (old AC3 and AC4 and their reduced-motion part) moved to the new story 010, which depends on this one. The lost and won final boards are still shown as static pictures here (AC5).
- 2026-11-02 — Architect feasibility check (via the coordinator): plain three.js (no wrapper libraries), loaded lazily, about 150 to 180 kB gzip, new dependency therefore an ADR; the DOM grid stays as a transparent overlay aligned to the camera so input and accessibility are unchanged; digits, flags and mines unlit or emissive to keep the 007/AC3 contrast; render on demand with the sway as the only loop; context loss returns to 2D with a message; e2e runs on software WebGL with a dev-only time and sway probe (dev builds in the e2e mode only, dist-check entry) because wall-clock checks are unreliable there; AC3 measured by a script in headed Playwright on hak's Mac, not in CI; a small effects seam so story 010 is additive. Consequences: Context; AC3 and AC6 worded accordingly; open questions cleared, status ready. (product-owner)
- 2026-11-03 — Gate 2: accept the look and the recording, apply all five retro proposals, commit and merge. — A: "Ja, inkl. 009-Abschluss" (hak, together with "genug mit minesweeper") = accepted as presented; light-mode digit halo and cream tiles stay as built. Consequence: status done; story 010 stays ready and is not started for now.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

Scope: the look of the lit 3D scene, its motion, the loading/unavailable/lost states of the View control, and the cues on the transparent overlay. Structure, copy, accessible names, tab order inside the board, live regions, rules and timer of 005 to 008 are **unchanged**. "007 §n" and "008 §n" refer to the UX designs of [007](007-minesweeper-redesign.md) and [008](008-minesweeper-3d-mode.md); the tokens in `src/app/tokens.css` (ADR 0004) are the base. The Technical design and [ADR 0005](../adr/0005-three-js-board-scene-with-dom-overlay.md) are binding; where something does not work from a UX view it is listed in section 14 (reconciliation), not silently changed. All contrast values were computed by hand with the sRGB formula (no shell available); the tester should re-check them with a tool, and a failing pair is a defect in this design. A value is "tight" when its margin is below 0.3.

Convention: scene sizes are in **cell units** (1 = the DOM cell width `--cell` at that moment; the 2 px gap is 2 px, i.e. 0.0625 cell at 32 px). The board plane is x (right) and y (towards the far row); z points up out of the board towards the viewer. The camera looks at it from 25° off the board normal, tilted towards the near side.

### 1. Principles

- The 3D board is a nicer picture of the same game: nothing is added to the grid's markup, names or tab order. The canvas is `aria-hidden` and has no pointer events.
- **Depth is decoration; shape is the cue** (007 §3.2 stays: raised tile, flat revealed cell, flag triangle on a pole, mine with spikes, disc plus ring, slash). Light and shadow only add to it.
- **Glyphs are unlit and carry their own contrast.** Digits, flags, mines and slashes are drawn in token colours and keep a halo in the surface colour (section 4). Lit surfaces may vary freely, glyphs may not.
- **The key light is high enough that shadows never reach a digit** (shadow length on a revealed cell is at most 0.17 cell, the digit halo starts 0.23 cell from the cell edge). Otherwise a halo in the token colour would show up as a light sticker inside a shadow.
- Everything colour-like comes from `--scene-*` or existing tokens; no colour literal in TypeScript. Contrast-tested colours are opaque hex; only the two overlay tints (section 6) are alpha composites and carry no required contrast.
- Motion is short, springy and always ends by itself; the only thing that keeps moving is the sway (AC4). Nothing waits for an animation (AC2).
- Native controls only; the View control of 008 §3 stays as it is.

### 2. Layout and component tree

```text
section.game
  div.column
    h2 "Minesweeper"
    SetupForm
    p[aria-live=polite][aria-atomic] (existing announcement region, mounted empty; also carries the 3D announcements, section 11)
    ViewToggle                                   (008 §3, extended)
      div.view  (flex row, wrap)
        div[role=radiogroup][aria-labelledby][aria-busy="true" only while loading]
          span "View"
          div.segments: label > input[radio] + span.box "2D" | "3D"
        p.loading     only while loading: spinner (aria-hidden) + "Loading 3D…"
        p.unavailable only when 3D is unavailable (008 §3.5, unchanged)
    p.notice          only when a notice is set: MessageIcon(error) + text
    GameStatus | empty text (unchanged)
  Board (key = game.id)
    div.scroller[data-view=2d|3d]     3D: background --scene-table
      div.stage                       padding = rim (4 px below 600 px, 16 px above)
        div.canvasHost[aria-hidden]   3D only; <canvas> inside, pointer-events none
        div[role=grid].grid           3D: transparent overlay, transform set by the scene
          div.row > Cell (unchanged markup)
```

The scene (canvas contents), from the table up:

- **Table** (stone, `--scene-table`) covers the whole canvas.
- **Tray**: a slab (`--scene-slab`) 0.18 cell thick on the table, with a frame of 0.14 cell width around the tile field (on screen: `min(0.14 cell, rim − 1 px)` so it never leaves the canvas). Frame top at z = +0.05, tray floor (what the 2 px gaps show) at z = −0.62, table at z = −0.80.
- **Tiles**: one rounded block per cell, 1.0 × 1.0 × 0.45 cell, edge radius 0.09 cell. Hidden tops at z = +0.15, revealed tops at z = −0.15 (sink 0.30), so a revealed cell is a pit with walls of 0.30 cell.
- **Objects**: digits, flags, mines, exploded disc and slash on top of their tile (section 4).

### 3. The scene look

#### 3.1 Light (world-fixed; the camera sways, the light does not, so the shadow map stays valid)

- **Key light**: a warm directional light from the far left and high above. Direction towards the light in board coordinates: `L = (−0.30, +0.38, +0.875)` (elevation 61°). Shadows fall towards the near right. Shadow length is 0.555 × the height of the caster: a raised tile (0.30 above a revealed cell) casts 0.17 cell (5.3 px at 32 px cells, 4.3 px at 26 px). A flag (pole 0.75 long, leaning) casts about 0.35 cell.
- **Fill**: a hemisphere light, `--scene-fill-sky` from above, `--scene-fill-ground` from below. Front faces (normal to the viewer) get no key light at all, only fill; that is what makes them read as thick side faces.
- **Calibration rule (the one number that matters):** an unshadowed, up-facing matte surface of albedo A must render as A × the factor in the table below (about 1.0, blue a little lower because the key is warm), within 3 % per channel. That keeps the lit revealed floor within a few percent of its token, so the digit halos disappear into it, and keeps flag and pole halos on the tile top honest. In three r187 (physical light units) the developer multiplies the `--scene-*-intensity` factors by π; **verify with a flat test (revealed tile, no shadow) instead of trusting the formula**, and adjust the fill if the environment map (3.3) brightens the hidden tops by more than 8 %.
- **Shadows**: `PCFShadowMap` (r187), `light.shadow.intensity = --scene-shadow-strength`, bias −0.0004, `normalBias` 0.02 cell, penumbra about 0.05 cell wide: `shadow.radius = clamp(93 / max(rows, cols), 2, 6)` (starting value, tune by eye at the gate-2 shots).

Resulting factors (computed, linear light; top = up-facing, front = facing the viewer, left = facing −x):

| Scheme | Top (R, G, B)    | Front            | Left             | Front is darker by | Shadowed floor is darker by |
| ------ | ---------------- | ---------------- | ---------------- | ------------------ | --------------------------- |
| Light  | 1.00, 0.96, 0.91 | 0.55, 0.54, 0.51 | 0.69, 0.66, 0.62 | 45 % (AC1: 15 %)   | 21 % (AC1: 10 %)            |
| Dark   | 1.00, 0.89, 0.77 | 0.35, 0.35, 0.34 | 0.51, 0.46, 0.41 | 62 %               | 29 %                        |

The lit revealed top in light is a neutral grey (the cool token times the warm light), the lit ivory tile a warm cream. Right faces equal the front faces.

#### 3.2 Tokens (new, in `:root` and the dark block; parity test applies)

Colours (opaque hex):

| Token                  | Light                  | Dark                     | Use                                                                                                                     |
| ---------------------- | ---------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `--scene-table`        | `#4b463f`              | `#2a2622`                | stone table; also the scroller background in 3D, so the canvas edge has no seam                                         |
| `--scene-slab`         | `#34312d`              | `#14120f`                | tray: floor of the gaps and the frame                                                                                   |
| `--scene-tile-top`     | `#f3eee4`              | `#343a45`                | hidden and flagged tile (light: warm ivory; dark: equal to `--cell-tile-fill`)                                          |
| `--scene-revealed-top` | `#e5e9ef`              | `#0e1014`                | revealed tile; **must equal `--cell-revealed-fill`** (tokens test) so the digit pairs of 007 stay valid by construction |
| `--scene-key`          | `#fff4e5`              | `#ffe0b8`                | key light colour (warm)                                                                                                 |
| `--scene-fill-sky`     | `#ffffff`              | `#ffffff`                | fill from above                                                                                                         |
| `--scene-fill-ground`  | `#ebe5db`              | `#8f8a84`                | fill from below (warm stone bounce)                                                                                     |
| `--scene-mine-lit`     | `#59616d`              | `#e8eaed`                | lit side of the baked mine shading (section 4.3)                                                                        |
| `--scene-mine-shade`   | `#1b1f24`              | `#9aa0a8`                | shaded side of the mine                                                                                                 |
| `--scene-focus-halo`   | `#ffffff`              | `#0e1014`                | the light/dark line on both sides of the focus ring (section 6)                                                         |
| `--scene-hover-tint`   | `rgb(29 78 216 / 18%)` | `rgb(168 199 250 / 22%)` | hover on hidden or flagged cells (alpha allowed by ADR 0004 for tints under no text)                                    |
| `--scene-pressed-tint` | `rgb(27 31 36 / 16%)`  | `rgb(0 0 0 / 28%)`       | pressed (mouse or touch)                                                                                                |

Unitless numbers (read by `readPalette` like colours, see 14.1):

| Token                     | Light | Dark | Use                                                                  |
| ------------------------- | ----- | ---- | -------------------------------------------------------------------- |
| `--scene-key-intensity`   | 0.46  | 0.51 | key light factor (× π in r187)                                       |
| `--scene-fill-intensity`  | 0.60  | 0.55 | hemisphere factor (× π in r187)                                      |
| `--scene-shadow-strength` | 0.55  | 0.75 | `light.shadow.intensity`: share of the key light removed in shadow   |
| `--scene-gloss`           | 0.55  | 0.80 | clear-coat strength of hidden tiles (dark albedo needs more to show) |
| `--scene-env-intensity`   | 0.30  | 0.45 | environment reflection on hidden tiles only                          |

Reused unchanged: `--n1` to `--n8`, `--color-text`, `--color-danger-solid`, `--color-danger-bg`, `--color-on-danger-solid`, `--color-focus`, `--color-accent`, `--color-border`, `--cell-revealed-fill`.

Removed with the 008 relief (the architect already lists them): `--cell-recess-light`, `--shadow-glyph-3d`, `--shadow-board-3d`, `--glyph-lift-3d`, `--recess-depth-3d`, `--tile-lip-3d`.

Swatch contrasts that matter (hand-computed):

| Pair                                 | Light | Dark | Rule                                                                                          |
| ------------------------------------ | ----- | ---- | --------------------------------------------------------------------------------------------- |
| Table on the panel `--color-surface` | 9.3   | 1.1  | decoration; the 1 px `--color-border` and the warm hue separate it in dark (shape is the cue) |
| Hidden tile top on the table         | 8.1   | 1.3  | decoration; in dark the bevel highlight and the tray frame separate them                      |
| Tile top lit vs revealed top lit     | 1.1   | 1.7  | decoration; the pit walls and the shadow carry hidden vs revealed                             |

#### 3.3 Materials and tile geometry feel

- **Hidden tile**: `MeshPhysicalMaterial`, roughness 0.42, clear-coat `--scene-gloss`, clear-coat roughness 0.18, reflection from the token-built environment (`scene3d/environment.ts`, replaces `RoomEnvironment`, see Technical design) at `--scene-env-intensity` (turn the environment off only if "3D ready" in e2e exceeds 3 s; the bevel highlight alone must then still show). Look to aim for: a **bright 1 to 2 px highlight line on the upper-left bevels** that slides a little while the camera sways, and a soft reflection gradient across the tops, brightest at the far left (at least 8 % luminance difference between the brightest and darkest tile top of a 9 × 9 board). The flat top is not a mirror.
- **Revealed tile and table**: matte (roughness 0.85, no clear-coat, no environment), so the lit floor under a digit is flat and the halo disappears.
- **Tile shape**: 1.0 × 1.0 × 0.45 cell, edge radius 0.09 cell (4 segments), so the top has a flat 0.82 cell core and a visible rounded edge; the flat vertical band of the side is 0.27 cell high. **"Slightly rounded", chunky like a game tile, not a pillow.** Corner radius on screen is about 3 px at 32 px cells; the overlay's `border-radius` for tints is `calc(var(--cell) * 0.09)`.
- **Tray frame**: rounded the same way (0.09). It is lower than the hidden tiles (z = +0.05 against +0.15) so the hidden field reads as the top level.
- **Table**: deterministic stone speckle, a 256 × 256 canvas texture repeated over the table, luminance noise of ±4 % with zero mean (seeded, so screenshots are reproducible), roughness 1. The mean must equal the token so the seam to the scroller background (`--scene-table`) stays under 4 % luminance; check by sampling 1 px inside and 1 px outside the canvas edge.
- **Depth cues the tester can sample** (cell units relative to the centre of a tile's top face, for the probe's `project`): front face of a hidden tile next to a revealed one `[0, −0.5, −0.18]`, its top `[0, 0, 0]` (side at least 15 % darker; designed 45 %); shadow on a revealed empty cell next to a hidden far neighbour `[0, +0.42, 0]` against the lit part `[0, −0.2, 0]` (designed 21 % darker in light, 29 % in dark); shadow beside a hidden left neighbour `[−0.42, 0, 0]`.

### 4. Glyphs: digits, flag, mine, exploded mine, wrong flag

All glyph meshes are `MeshBasicMaterial` (`toneMapped: false`, unlit) in token colours, depth-tested, lying on or standing on their tile; they cast shadows (except digits and the slash) and receive none. The sway never changes their colours.

#### 4.1 Digits 1 to 8

- Flat decals on the revealed top (z = −0.15 + 0.01), cap height **0.60 cell**, bold system font (`--font-family`, weight 700, tabular), one atlas for 8 glyphs, 128 px per glyph; colour `--n1` … `--n8` (007 §2.1, unchanged).
- **Halo**: the same glyph dilated by 0.07 of its height on every side, in `--scene-revealed-top`, drawn under the glyph (backing quad with the same atlas). Hard edge, no blur. Digit against its halo is exactly the 007 pair: at least 4.8:1 in light and 7.6:1 in dark, at every camera position and inside every shadow.
- On screen at the smallest cell (26 px in the far row, 0.96 × cos 25°) the digit is 13.6 px tall, larger than the 2D digit (14 px font, about 10 px cap height).
- If the gate-2 shots show the halo as a faint patch on the warm-lit floor, multiply the halo colour by the unshadowed top factor of the table in 3.1 (a knob, not a requirement; the AC1 pixel test samples digit against rendered halo).

#### 4.2 Flag

- Pole: cylinder radius 0.035, length 0.75, colour `--color-text`; base: flat disc radius 0.15, height 0.04, `--color-text`; cloth: a triangle 0.60 along the x axis and 0.46 along the pole, `--color-danger-solid`, double-sided, on the top of the pole pointing right.
- **The flag leans 28° away from the viewer** (towards the far row). An upright pole would be foreshortened to 42 % of its length by the 25° tilt (cloth about 5 px tall at 32 px cells, unreadable); leaning it back shows 80 %: pole 0.60 cell and cloth about 17 × 11 px at 32 px cells, 14 × 9 px at 26 px. It looks like a flag stuck in a little askew, which is what a planted flag does.
- Base at 0.30 cell from the cell centre towards the near side, so the whole flag stays inside its own cell on screen (top of the cloth reaches 0.39 cell above the centre; the cell edge is at 0.45).
- Halo: pole and base get a 0.03 halo, cloth a 0.04 halo, all in `--scene-tile-top` (flag on a hidden tile) or `--scene-revealed-top` (wrong flag on the floor).
- Contrast: cloth on tile top 5.65 (light) and 4.79 (dark); pole on tile top 14.3 and 9.5; cloth on the revealed top 5.36 and 8.07 (wrong flag). Rule: text 4.5, glyph 3.

#### 4.3 Mine (shown after a loss)

- Body: sphere radius 0.24 cell, 8 spikes (cones, 0.16 long, radius 0.045 at the base), standing on the floor (centre 0.30 above the revealed top), so the whole mine is about 0.8 cell across.
- **Baked shading, still unlit**: vertex colours between `--scene-mine-shade` and `--scene-mine-lit` by `n · L_key` (fixed key direction of 3.1, not the live light). Light scheme: dark body, lit side `#59616d`; dark scheme: light body, shaded side `#9aa0a8`. That gives the mine a rounded look (and the spikes a lit edge) without a pair that changes with the camera.
- Halo: a 0.05 dilated flat disc under the mine's silhouette in `--scene-revealed-top`.
- Contrast on the revealed top: lit side 5.13 (light) and 16.0 (dark); shade side 13.6 and 7.3. Rule 3.

#### 4.4 Exploded mine

- The tile is the revealed block with top colour `--color-danger-bg` (light `#fdecea`, dark `#3a1b1a`).
- A flat **disc** radius 0.40 on that top in `--color-danger-solid`, plus a **ring** (outer radius 0.50, inner 0.43) in the same colour: shape cue "disc plus thick ring", as 007. The mine on top is the 4.3 mine but drawn flat in `--color-on-danger-solid` (no shading); no ground shadow beyond the physical one.
- Contrast: disc on its tile 5.7 (light) and 6.5 (dark); mine glyph on the disc 6.5 and 6.9.

#### 4.5 Wrong flag

- A flag as 4.2 standing on the revealed floor plus the **slash**: a bar 1.0 cell long, 0.09 cell thick, `--color-text`, in the plane parallel to the screen (rotated back by `TILT_DEG` so it is seen face-on, not foreshortened), 0.45 cell above the floor, diagonal from lower left to upper right. Halo bar 0.18 thick in `--scene-revealed-top` so it separates from the flag where they cross.
- Slash on the revealed top 13.6 (light) and 16.0 (dark). On screen it is 2.9 px thick at 32 px cells, 2.3 px at 26 px (007: 2.5 px).

#### 4.6 What 3D adds, per cell state (the seven states of 008 §4.1)

| State                      | Scene                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| Hidden                     | glossy ivory/slate tile, top at +0.15, bevel highlight, casts a shadow on revealed neighbours          |
| Flagged                    | hidden tile plus flag (4.2)                                                                            |
| Revealed empty             | matte tile, top at −0.15, in the shadow band of its far and left hidden neighbours                     |
| Revealed number            | as empty plus digit with halo (4.1)                                                                    |
| Mine                       | as empty plus shaded mine (4.3)                                                                        |
| Exploded mine              | danger-bg tile, disc, ring, flat mine (4.4)                                                            |
| Wrong flag                 | as empty plus flag and slash (4.5)                                                                     |
| Pressed (touch long-press) | the scene sinks the tile by 0.10 cell (a third of the sink); mouse `:active` has only the overlay tint |

### 5. Motion

All curves are functions of the progress p from 0 to 1 over the duration; lengths in cell units. They sit inside the limits of `timeline.ts`. The scene updates the shadow map every frame while something moves.

#### 5.1 Reveal flip and sink (`FLIP_MS` = 260)

Character: a quick card turn that drops into its pit with a soft thud.

- **Rotation** about the tile's x axis (through its centre): `θ = 180° · easeInOutCubic(p)`, the far edge rising over the top, so the tile rolls towards the viewer.
- **Lift**: `0.18 · sin(π · p)` added to the centre height (also keeps the turning tile clear of the tray floor: at 45° its lowest corner is at −0.585, the floor at −0.62).
- **Sink**: the centre height goes from −0.075 (hidden) to −0.375 (revealed) by `easeOutBack` of `(p − 0.35) / 0.65` with overshoot parameter 1.0 (about 0.02 cell, under 1 px, "thud").
- **Colour/material swap** at p = 0.50 (edge-on, θ = 90°): hidden to revealed top colour and glossy to matte (the tile moves from the hidden mesh to the revealed mesh).
- **Digit/glyph** appears at p ≥ 0.50, scaling from 0.6 to 1.0 with `easeOutBack` (overshoot parameter 1.4) over the rest. The clicked cell gets lift × 1.5 as a "hit".
- Quality level 2: no rotation and no lift, sink only (same duration), digit pops without scale.
- Reduced motion: none; the final pose at once.

#### 5.2 Wave

- Delay per cell as the design: Euclidean distance from the clicked cell × `step` (at most 35 ms); the whole wave, including the last tile's flip, ends at 1 000 ms, 200 ms before the AC2 limit.
- Lift of a tile in the wave decays with distance: `0.18 · (1 − 0.4 · d / dMax)`, so the wave front is lively near the click and calmer at the edge (it makes a big opened area read as a ripple instead of noise).
- Quality level 2: distance bands, as the design.

#### 5.3 Flag plant (`PLANT_MS` = 240) and removal (`UNPLANT_MS` = 180)

- **Plant**: falls from 0.60 cell above along the pole axis, `easeInQuad`, reaching the tile at p = 0.60; then a settle of the base: it dips 0.035 below and returns, `−0.035 · sin(π · (p − 0.6) / 0.4)`. The cloth unfurls from p = 0.55: scale along x from 0.2 to 1 with `easeOutBack` (overshoot 1.6), anchored at the pole. The flag's shadow follows because it is real geometry.
- **Remove**: the flag lifts 0.35 cell with `easeInQuad` while it scales to 0 about its base (scale = `1 − easeInCubic(p)`), 180 ms.
- Reduced motion: appears or disappears at once.

#### 5.4 Sway

- `±2°` yaw, sine, period 14 s, as the design; maximum angular speed about 0.9°/s. The only effect is a slow slide of the bevel highlights and the reflection gradient; shadows do not move (the light is fixed).
- Continues while the tab is visible and the page has the loop; stops by itself in a hidden tab (rAF). Not paused during animations. Under reduced motion and in forced colours: none (phase 0).

#### 5.5 Palette switch (light/dark change at run time)

No transition: the scene re-reads the tokens and renders one frame (a system scheme switch is not a game action, and a crossfade would need a second render target).

### 6. Cues on the overlay: focus, hover, pressed

The overlay cells are transparent in 3D (`background-color: transparent; border-color: transparent; box-shadow: none; color: transparent`, glyph SVGs `opacity: 0`, no transition on those properties), inside `@media not (forced-colors: active)`. Never `visibility: hidden` or `display: none` on the cell or its children that carry names: the accessible names stay.

#### 6.1 Focus (AC5)

- Unchanged on the cell: `outline: 2px solid var(--color-focus); outline-offset: -2px` (the AC5 test reads the computed style).
- **Added in 3D**, because the pixels under the ring change with light, shadow and the face the ring happens to cross: a **two-tone sandwich**: `box-shadow: 0 0 0 1px var(--scene-focus-halo), inset 0 0 0 3px var(--scene-focus-halo)`. That is a 1 px halo outside the box (in the 2 px gap, it never touches the neighbour), the 2 px ring, and a 1 px halo inside it. This supersedes the 008 rule "no outer shadow on a cell": the overlay cell is transparent and has no relief to protect.
- Why: the lower 2 px of the ring lie on the front face of the tile, whose lit colour in light is about 0.46 luminance. The accent ring on it is only 3.25 (tight), and the outside neighbour in the gap is the near-black tray (accent on it about 1.5). The halo makes the contrast independent of what is behind: ring against halo is 6.7 (light, `#1d4ed8` on `#ffffff`) and 11.2 (dark, `#a8c7fa` on `#0e1014`).
- Ring against the surfaces it sits on without the halo (light / dark): tile top 5.8 / 6.7, revealed floor 5.4 / 11.1, front face 3.25 / 8+.

#### 6.2 Hover (open point 5)

- Only inside `@media (hover: hover)`, only on `.hidden` and `.flagged` cells, only while the board is not read-only (`.grid:not([aria-readonly='true'])`): `background-color: var(--scene-hover-tint); border-radius: calc(var(--cell) * 0.09)`, fade `var(--duration)` (0 s under reduced motion).
- Cursor: `pointer` as in 2D; nothing on revealed cells or a finished board.
- Contrast of the tint against the plain tile: 1.33 (light, a cool wash on the warm ivory) and 1.62 (dark). Hover is an extra, not the only cue: the cursor and the focus ring carry "interactive", and nothing is conveyed by hover alone. The tint sits about 2 px off the drawn top face (the overlay plane is halfway between the hidden and revealed tops); acceptable for a wash.
- The scene does not react to hover (binding). See 14.6 for the better alternative.

#### 6.3 Pressed

- Mouse (`:active`) and touch long-press (`.pressed`): `background-color: var(--scene-pressed-tint)` on hidden and flagged cells (1.38 light, 1.9 dark). The touch long-press also sinks the tile in the scene (`setPressed`, 0.10 cell). The 2D rule `box-shadow: inset 0 2px 4px …` is not used in 3D.

### 7. Loading, unavailable, load failed, context lost

All four keep the board playable. None blocks the 2D board.

| Situation                                            | What the player sees                                                                                                                                                                                                            | Where                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Choosing "3D" for the first time (module not loaded) | the "3D" radio is checked (the requested view); `aria-busy="true"` on the radiogroup; to its right a loading status with a spinner; the 2D board stays and works; when ready the 3D board replaces it and the status disappears | `p.loading` after the radiogroup in `.view`, same row if it fits (375 px and up), wrapping under the row at 320 px |
| Load fails or takes over 10 s                        | radio goes back to "2D"; notice "3D could not be loaded. The board stays in 2D."; game untouched                                                                                                                                | `p.notice` directly under the View control (below `.view`)                                                         |
| 3D not supported at mount                            | as 008: "3D" disabled with `3D is not available in this browser.`                                                                                                                                                               | inside `.view`, unchanged                                                                                          |
| Context cannot be created (after a try)              | as above: "3D" becomes disabled, the unavailable text appears, and the load-failed notice                                                                                                                                       | both                                                                                                               |
| Context lost during play                             | the view returns to 2D at once, notice "The 3D view stopped. Your game continues in 2D.", cell focus kept, game state kept                                                                                                      | `p.notice`                                                                                                         |

**Loading status**: `p.loading`, `--text-sm`, `--color-text-muted` (7.8 light, 7.7 dark on the panel), spinner 16 px as the login spinner (2 px border, `--color-text-muted`, one side transparent, `0.8 s linear infinite`), `aria-hidden`; gap 8 px; margin 0. **Static under reduced motion**: no animation, full ring at opacity 0.6 (as `LoginView.module.css`; the global reduced-motion rule also removes the animation). The spinner is the only loop besides the sway; it is started by the player's choice and ends by itself at the latest after 10 s (the timeout), so it fits AC4 "every animation caused by my action ends by itself"; see 14.8.

**Notice**: `p.notice`, a quiet callout in the style of the result message of GameStatus but smaller: `display: flex; gap: var(--space-2); margin: var(--space-3) 0 0; padding: 8px var(--space-3); border-left: 4px solid var(--color-danger); border-radius: var(--radius-control); background-color: var(--color-danger-bg); color: var(--color-text); font-size: var(--text-base); font-weight: 500; line-height: var(--leading-sm); overflow-wrap: anywhere`; icon `MessageIcon kind="error"` (20 px, `--color-danger`, `aria-hidden`). Text stays in the normal text colour: contrast 14.5 (light) and 12.9 (dark); bar and icon 6.5 / 9.6 on the panel; state is carried by the bar, the icon and the words, not by colour alone. The gap to the status divider below stays 24 px (status block margin).

- **Role**: none on the notice. The announcement goes through the existing live region (section 11), mounted empty from the start.
- **Cleared** by the next choice of a view (the reducer does it: `choose` clears the notice), never by a timer, never by starting a game.
- Both the loading status and the notice are plain static elements; no live region of their own (no duplicate reading).

### 8. States per view

| View / element     | State                                                                 | What the user sees and can do                                                                                                        |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| View control       | initial (2D)                                                          | as 008: "2D" selected                                                                                                                |
| View control       | 3D selected, ready                                                    | "3D" selected; 3D board shown; no status, no notice                                                                                  |
| View control       | loading                                                               | "3D" checked, `aria-busy`, spinner and "Loading 3D…"; "2D" operable (choosing it cancels loading, board stays 2D); 2D board playable |
| View control       | load failed                                                           | "2D" checked, notice; "3D" focusable and selectable again (retry)                                                                    |
| View control       | unavailable (mount)                                                   | "3D" disabled, text, no notice                                                                                                       |
| View control       | unavailable (after a try)                                             | same plus the failed notice; keyboard focus moved to "2D"                                                                            |
| View control       | lost                                                                  | "2D" checked, notice, "3D" selectable again                                                                                          |
| Game, before Start | any                                                                   | no board; empty text; choosing 3D loads in the background (the first board uses it)                                                  |
| Board 3D           | running                                                               | lit scene, sway, cues; everything as 2D                                                                                              |
| Board 3D           | animating                                                             | flip/wave/plant playing; input, names, counter immediate                                                                             |
| Board 3D           | won / lost                                                            | final static board and message (no effect here, story 010 adds it); read-only: no hover tint, no pointer cursor; the sway continues  |
| Board 3D           | reduced motion                                                        | static picture after every change, no sway                                                                                           |
| Board 3D           | forced colours                                                        | canvas hidden, 2D/forced-colours cells on the statically tilted grid (section 12)                                                    |
| Board 3D           | quality level 1 or 2                                                  | as the design (softer, then simpler animations); no visible message                                                                  |
| Board 3D           | hidden tab                                                            | no frames; resumes where it was                                                                                                      |
| Empty / error      | there is no empty state beyond "no game yet"; no per-cell error state |                                                                                                                                      |

### 9. Interactions

- **Choosing 3D (mouse, touch, keyboard)**: as 008 §6. First time: loading state; later (module and scene alive): immediate (AC4). Choosing 2D at any time: immediate, cancels a loading, clears the notice.
- **Focus after the load**: stays on the radio that was operated (it was the "3D" radio).
- **Load failed**: focus stays on the now unchecked "3D" radio; Space selects it again (retry). The notice is announced, not focused.
- **Unavailable after a try**: the focused "3D" radio becomes disabled; **focus moves to the "2D" radio** (never to the body). The implementation: `ViewToggle` moves focus in an effect when `status3d` turns `'unavailable'` while the "3D" input was the active element.
- **Context lost**: the board swaps in place (the grid element is the same), so a focused cell keeps focus; nothing else moves.
- **Board input in 3D**: identical to 2D (arrows, Enter or Space, F, right-click, long-press). A drag scrolls the scroller; nothing rotates the camera. The wheel and touch fling scroll the scroller.
- **Validation**: none.
- **Animations never wait for input and input never waits for animations** (AC2): clicking during a wave retargets, flags toggled twice quickly retarget at `now`.

### 10. Copy

| Where                                                | Exact text                                        |
| ---------------------------------------------------- | ------------------------------------------------- |
| Loading status (visible)                             | `Loading 3D…` (one ellipsis character)            |
| Notice, load failed (visible)                        | `3D could not be loaded. The board stays in 2D.`  |
| Notice, context lost (visible)                       | `The 3D view stopped. Your game continues in 2D.` |
| Unavailable text (008, unchanged)                    | `3D is not available in this browser.`            |
| Announcement, loading started                        | `Loading 3D…`                                     |
| Announcement, 3D ready after a load                  | `3D view ready.`                                  |
| Announcement, load failed or unavailable after a try | `3D could not be loaded. The board stays in 2D.`  |
| Announcement, context lost                           | `The 3D view stopped. Your game continues in 2D.` |

Everything else (labels "View", "2D", "3D", cell names, result messages, "New game: …") is as before. Tests: use roles for the radios (`getByRole('radio', { name: '3D' })`); `getByText('3D')` in non-exact mode matches several of the texts above. The announcement strings are identical to the visible ones on purpose (one constant each).

### 11. Accessibility

- **Structure**: unchanged grid (rows, cells, `aria-label`s, `aria-rowcount`, `aria-colcount`, `aria-readonly`, roving tabindex). The canvas host is `aria-hidden="true"`, the canvas has no role, tab stop or pointer events. The overlay cell text and glyph SVG are made visually transparent only (`color: transparent`, `opacity: 0`), never removed or hidden from the accessibility tree.
- **Announcements** go through the **one existing live region** of `Minesweeper.tsx` (`announce()`, polite, atomic, mounted empty, with the serial trick so the same text twice is read twice). No new live region, no `role="status"` or `alert`. Triggers, in an effect keyed on the view state's `status`, `notice` and `scene`: the status turns `loading` → announce `Loading 3D…`; `loading` → `idle` with a scene → `3D view ready.`; a notice becomes `loadFailed` → the failed text; a notice becomes `lost` → the lost text. An instant switch (module loaded) announces nothing: the focused radio says "3D, selected" itself (008 §8). The sway, flips, waves and flag animations are decoration and are never announced; the game state changes of a click are already announced by the existing counter, result and cell names (AC2 "takes effect immediately").
- **`aria-busy`** is on the radiogroup only while loading (attribute absent otherwise); the e2e ready wait depends on it (confirmed). Because `aria-busy` can make a screen reader skip the group, the status and the announcements sit **outside** the group.
- **Keyboard**: as 008 §6, plus Space on the unchecked "3D" after a failure is the retry. Tab order: Start, View radio, board's active cell; the notice and the loading status have no tab stops.
- **Focus visibility**: 6.1 (ring 2 px, 3:1 against ring-adjacent halo in both schemes; ring against the surfaces 3.25 or more).
- **Colour contrast (WCAG 2.2 AA)**: glyph pairs 4.1 to 4.5, notice 14.5 / 12.9, loading text 7.8 / 7.7, spinner and ring as above. Hover and pressed tints are not information. The table and tray colours are decoration (the rim, shadow and tile edge are not the only cue of any state).
- **Target size**: cells 26 px at least in the far row (AC1); radios 44 px high (008).
- **Motion**: sway at most 2° with a 14 s period (0.9°/s), no flashing, nothing parallaxes with the pointer; reduced motion removes sway, flip, wave, plant and the hover/press fades (the global rule of ADR 0004) and the spinner turns.
- **Zoom and text size**: texts in `rem`; at 200 % zoom at 320 px the loading status and notice wrap; the board scrolls in its own box.

### 12. Forced colours (Windows high contrast), open point 6

Confirmed: the canvas host is `display: none`, the scene stops rendering (`active: false`), the grid keeps its inline tilt at phase 0 (no sway), and the cells use the 2D/forced-colours look of 007 §8 (opaque, `ButtonFace` tiles with `ButtonText` border and 3 px bottom lip, revealed cells `GrayText` border, exploded cell with 3 px `CanvasText` border and disc). No tints, no halo sandwich (box-shadows are dropped by the browser and the rules sit in `@media not (forced-colors: active)`), focus ring `Highlight` 2 px offset −2 px. The scroller background becomes `Canvas`. The View control, loading status and notice use system colours; the notice keeps its icon and 4 px bar (`CanvasText` border-left in forced colours).

### 13. Responsive behaviour (below 600 px)

| Width | Rim   | Cell                                                                              | What it looks like                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----- | ----- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 320   | 4 px  | 26.75 px for 9 × 9 (26 px floor for larger boards); far row at least 24.8 px wide | 9 × 9 fits in the 278 px well with no sideways scroll; tray frame `min(0.14 cell, 3 px)` = 3 px; the table is only the 4 px well padding plus 3 px of rim, so the board reads as the tray with a thin stone edge; cast shadows of the tray are cut by the canvas edge (accepted); digits 14 px tall, flag cloth about 14 × 9 px, mine 0.8 cell; the loading status wraps under the View row (28 px shift while loading), the notice takes two lines |
| 375   | 4 px  | 33.5 px for 9 × 9                                                                 | fits without scrolling; 16 × 16, 16 × 30 and 30 × 30 sit on the 26 px floor and scroll inside the well, last cell reachable and its focus ring not clipped; loading status on the same row as the control                                                                                                                                                                                                                                           |
| 800   | 16 px | 32 px                                                                             | tray frame 4.5 px, table visible as a 16 px frame plus 8 px well padding; tray shadow 0.47 cell fits the rim except on the near-right edge where it fades out; 16 × 30 and 30 × 30 scroll inside the scroller                                                                                                                                                                                                                                       |

- Touch: no hover cues (media query); long-press shows the pressed tint and sinks the tile; a drag scrolls the scroller; nothing in the scene reacts to the pointer.
- Phones get the automatic quality levels of the design, with no message.
- The notice and the loading status are inside the 40 rem column and wrap with `overflow-wrap: anywhere`.

### 14. Reconciliation with the Technical design (nothing here changes an AC)

1. **Numbers in the palette.** The design wants light/dark-dependent lighting numbers (`--scene-key-intensity`, `--scene-fill-intensity`, `--scene-shadow-strength`, `--scene-gloss`, `--scene-env-intensity`). `ScenePalette` is typed as colours only. Needed: a second record (for example `SceneLook`, numbers) from `readPalette`, parsed with `parseFloat`; `tokens.test.ts` must skip these for the hex and contrast scans but keep the light/dark parity.
2. **Palette keys.** Add `explodedTop` (the exploded tile top, `--color-danger-bg`; the design list has only `exploded` and `explodedGlyph`). Replace `mine` by `mineLit` and `mineShade` (baked shading, 4.3). `tileHover` is unused because the hover is a DOM tint; drop it or use it (see 6 below).
3. **Two instanced tile meshes** (hidden: glossy physical, revealed: matte standard) instead of one with per-instance colour, because one material cannot be glossy and matte. The flip moves a tile from one mesh to the other at p = 0.5. One more draw call (about 16 in total).
4. **Halo colour.** The design's default (halo = the surface token) is kept. The lit floor is within a few percent of the token by the calibration rule, so the halo is not visible as a patch; the K_top knob in 4.1 is the fix if gate 2 shows otherwise.
5. **Key light elevation of 61°** (`L = (−0.30, +0.38, +0.875)`) is a binding UX constraint, not a taste: a lower light lengthens shadows into the digit halos (sticker effect). The "key light from the far left" of the design is met.
6. **Hover in the scene would look better.** A tile that lifts 0.04 cell and takes `tileHover` colour would be far more convincing than a wash, and it costs one render per hover change. It needs `setHover(index | null)` on the handle and a pointer listener in `Board`, which the binding design excludes. Not requested; proposed as a possible later change.
7. **Flags lean back by 28°** and the slash is screen-parallel (uses `TILT_DEG`): `sceneLayout.ts` needs the lean and `geometry.ts` must export the tilt to it. Without it the flag is 5 px tall at 32 px cells.
8. **Spinner versus "nothing loops".** The loading spinner is a loop started by the player and ended by the 10 s timeout at the latest; AC4 allows animations "caused by my action" that "end by themselves". The login spinner comment says it is "the one allowed loop"; the product owner should confirm both are fine (the alternative is a static "Loading 3D…" without the spinner; the design works with that too).
9. **Shadows frozen in quality level 2** (design: shadow map updated only at the end of an animation) show a ghost shadow of a sinking tile for at most 1 s on very large boards on slow machines. Acceptable; expected never to happen on the reference Mac.
10. **Table seam.** The scroller background equals `--scene-table` and the lit table must match it within 4 % (3.3). If the speckle texture makes this hard, drop the speckle, not the calibration.
11. **Overlay focus halo** is an outer `box-shadow` on a cell (6.1). 008 §1/§4 forbade outer shadows on cells for the CSS-relief reasons that no longer exist; AC5's computed-style check is unaffected.
12. **Announcements** need the view state transitions in `Minesweeper.tsx` (a ref with the previous `status` and `notice`); `useBoard3d` already returns what is needed.
13. **Focus on "unavailable after a try"**: `ViewToggle` needs an effect and refs (9). Not in the Technical design.
14. **Contrast pairs for `tokens.test.ts`** (by hand; please add): flag `--color-danger-solid` on `--scene-tile-top` at least 4.5 (5.65 / 4.79, dark is tight); pole `--color-text` on `--scene-tile-top` at least 3; `--n1` … `--n8` on `--scene-revealed-top` at least 4.5 plus equality with `--cell-revealed-fill`; flag on `--scene-revealed-top` at least 3; `--scene-mine-lit`, `--scene-mine-shade` and `--color-text` on `--scene-revealed-top` at least 3; `--color-danger-solid` on `--color-danger-bg` at least 3; `--color-on-danger-solid` on `--color-danger-solid` at least 3; `--scene-focus-halo` against `--color-focus` at least 3.
15. **Rim**: 4 px below 600 px and 16 px above, confirmed. With cells up to 40 px on phones the tray frame is limited by the rim (3 px), as specified in section 2.

Answers to the numbered open points of the Technical design: 1 loading, aria-busy: sections 7, 11 (confirmed, text outside the busy group); 2 notice: sections 7, 10; 3 palette, halos, light direction: sections 3, 4; 4 geometry and easing: sections 3.3, 5; 5 hover: 6.2; 6 forced colours: 12 (confirmed); 7 rim: 13, 14.15 (confirmed); 8 gate-2 shots: section 16.

### 15. Superseded parts of 008's UX design (008 stays done)

- 008 §2 relief tokens (`--cell-recess-light`, `--shadow-glyph-3d`, `--shadow-board-3d`, `--glyph-lift-3d`, `--recess-depth-3d`) and §4.1 "3D addition" column, §4.2 relief recipe (lip, recess, ground ellipse, slab shadow): replaced by sections 3 and 4.
- 008 §4.3 focus: extended by the halo sandwich (6.1); the ring itself is unchanged.
- 008 §4.4 forced colours: same result (canvas hidden, 2D look), confirmed in 12.
- 008 §5 "There is no loading or error state" and §10 "nothing moves by itself, no loops": replaced by sections 5, 7 and AC4 (sway, animations, loading spinner).
- 008 §12 open points and §13 screenshot list: replaced by section 16.
- Kept: §3 the View control (markup, look, states, placement, copy), §6 interactions (plus 9), §8 accessibility base, §9 phone sizing as the architect's formula, §14 relation to 007.

### 16. Screenshots and recording for gate 2 (open point 8)

Common set-up: guest sign-in, dev server in mode `e2e`, fixed mine layouts, 9 × 9 unless noted, DPR 2, headed Chromium on hak's Mac with the real GPU (no SwiftShader flags), light and dark for every still (use `emulateMedia({ colorScheme })`), 800 px wide unless noted. Time-dependent frames use the probe: `pause()`, `holdSway(true)`, `advance(ms)`. M = must be in the gate-2 package, E = evidence only.

| #   | State                                                                                                                                                                                 | Why                                               |     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --- |
| 1   | Hero: fresh 3D board, all hidden, sway at one extreme                                                                                                                                 | tile gloss, bevel highlight, tray, table, shadows | M   |
| 2   | Running game: cells with digits 1 to 6 (and 7 and 8 if the layout has them, each revealed by clicking it), empty revealed cells, two flags, hidden tiles, focus ring on a hidden tile | digits with halos, pit and shadows, flag look     | M   |
| 3   | Cascade on 16 × 16 at +120 ms, +350 ms, +700 ms and settled (4 frames, sway held)                                                                                                     | the wave                                          | M   |
| 4   | Flag planting at +80 ms, +160 ms and settled; removal at +90 ms                                                                                                                       | plant and unplant                                 | M   |
| 5   | Same running board in 2D and 3D side by side, one in light and one in dark                                                                                                            | the difference hak asked for                      | M   |
| 6   | Lost board (shaded mines, exploded mine, wrong flag) with the danger message                                                                                                          | static final board                                | M   |
| 7   | Won board with the success message                                                                                                                                                    | static final board                                | M   |
| 8   | Close-ups of the focus ring on a hidden tile, on a revealed number cell, and on the last cell of a 30 × 30 board scrolled into view                                                   | focus halo sandwich, no clipping                  | M   |
| 9   | 375 px: 9 × 9 running (no scroll), 16 × 30 scrolled with its last cell focused                                                                                                        | phone look                                        | M   |
| 10  | 320 px: 9 × 9 running (fits, no scrollbar)                                                                                                                                            | smallest case                                     | M   |
| 11  | 30 × 30 at 800 px (scroll box) and at 375 px (scrolled to the last cell)                                                                                                              | scale                                             | M   |
| 12  | Loading (route held) at 375 px with the 2D board visible behind; load failed notice; context-lost notice; unavailable text (375 px, light and dark)                                   | AC6                                               | M   |
| 13  | Reduced motion: a settled board after a cascade and a flag (static)                                                                                                                   | AC4                                               | E   |
| 14  | Forced colours (emulated): board and View control                                                                                                                                     | shapes without colour                             | E   |
| 15  | Quality level 2 forced once (large cascade) mid-wave                                                                                                                                  | check it still looks intentional                  | E   |

**Screen recording, at most 30 s, one take, 1280 × 800, headed, mouse pointer visible, light scheme first.** Every pause is at least 1 s so the eye can follow. No overlays, no sound (there is none).

| Time       | Action                                                                                                                                           | What the viewer sees                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| 0 to 3 s   | A 9 × 9 game in 2D with a few cells open; click "3D" (module already loaded earlier so this is the instant path; the load state is a still, #12) | instant switch to the lit scene                                   |
| 3 to 7 s   | Hands off the mouse                                                                                                                              | the sway: bevel highlights slide, reflections shift, shadows stay |
| 7 to 11 s  | Click a cell that opens a large area, hold 2 s                                                                                                   | the wave from the click, digits popping, settle                   |
| 11 to 15 s | Right-click three cells (plant), right-click one again (remove)                                                                                  | flag drop, cloth unfurl, shadow; removal                          |
| 15 to 18 s | Keyboard: arrow keys across the board, F, Enter                                                                                                  | focus ring over tiles and pits                                    |
| 18 to 20 s | Switch to 2D and back to 3D                                                                                                                      | same state in both views                                          |
| 20 to 23 s | Emulate dark scheme (the page's scheme changes while 3D is shown); hold 2 s                                                                      | scene re-lit in dark at once                                      |
| 23 to 27 s | "Start" with the 16 × 30 preset, click for a big cascade                                                                                         | the 1.0 s wave on a large board                                   |
| 27 to 30 s | Start 9 × 9, click a mine                                                                                                                        | static lost board and message (no effect: story 010)              |

The tester records with Playwright video or the macOS screen recorder, trims to at most 30 s and attaches the stills and the clip to the Test report. A separate 5 s clip with reduced motion (E) may be added; it counts outside the 30 s of the main clip only if hak asks for it.

## Technical design

_architect, 2026-11-02. Decision: [ADR 0005](../adr/0005-three-js-board-scene-with-dom-overlay.md) (three.js, lazy, DOM overlay). Works out the gate-1 feasibility check in the Decision log. The UX section was empty when this was written; points UX owns are listed in "Open points for UX" at the end._

### Spike results (measured 2026-11-02 on hak's Mac, MacBook Pro M2 Max, three 0.187.0, Vite 8, Playwright 1.64.1 / Chromium 1248)

Throwaway build (deleted afterwards) with renderer, physical, standard and basic materials, instanced rounded-box tiles, digit atlas on a canvas texture, instanced flags and mines, hemisphere and directional light with a 2048² shadow map, behind one `import()`.

| What                                                                                                    | Result                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lazy chunk size (`vite build`)                                                                          | **544 kB minified, 135 kB gzip**; entry chunk 2.6 kB with no three code. Real scene code will add about 10–20 kB gzip. Vite warns about chunks > 500 kB      |
| WebGL in headless Chromium (Playwright default headless)                                                | **works without extra flags on macOS**: WebGL2 via ANGLE + SwiftShader (Vulkan). Same renderer with `--enable-unsafe-swiftshader`, `--use-angle=swiftshader` |
| SwiftShader, 16 × 30, 1200 × 800 canvas, MSAA on                                                        | 101 ms per frame, 128 ms with a shadow-map update                                                                                                            |
| SwiftShader, 30 × 30, 1200 × 800, MSAA on                                                               | 152 ms per frame, 196 ms with a shadow-map update                                                                                                            |
| SwiftShader, 800 × 560, MSAA on / off, 16 × 30                                                          | 89 ms / **36 ms** (64 ms with a shadow update); 9 × 9: 19 ms; 30 × 30: 55 ms (98 ms)                                                                         |
| Headed Chromium on the M2 Max GPU (Metal), shadow update + readback every frame, 2000 × 1300 backbuffer | **117–119 fps on 16 × 30 and 30 × 30**, i.e. the 120 Hz display limit; frame time 8.3 ms                                                                     |
| `renderer.forceContextLoss()`                                                                           | fires `webglcontextlost` on the canvas (usable to test AC6)                                                                                                  |
| `getContext` stubbed to return null                                                                     | `new WebGLRenderer()` throws "Error creating WebGL context" (usable to test AC6)                                                                             |
| three r187 API note                                                                                     | `PCFSoftShadowMap` was removed (falls back to `PCFShadowMap` with a warning); use `PCFShadowMap` + `shadow.radius`, or `VSMShadowMap`                        |

Consequences: the size fits the accepted budget (budget check at 180 kB gzip); e2e can render but only at 7–25 frames per second, so every timing check runs on the probe's manual clock; the AC3 floors have a large margin on the reference machine.

`three@^0.187.0` (dependencies) and `@types/three@^0.187.0` (devDependencies) were installed in this branch for the spike and stay. `npm audit` reports only the existing eslint/minimatch advisories, nothing from three.

### Approach in one paragraph

3D stays a **presentation** of the same game. The grid DOM of 005–008 is unchanged and stays the only input and accessibility surface. In 3D it becomes a transparent overlay, apart from the focus ring and the hover and press cues. Its CSS transform (`perspective(P) rotateY(sway) rotateX(tilt)`) and the three.js camera come from **one pure geometry module**, so the hit-test box of every cell lies on its rendered tile. A `<canvas>` behind the grid, in the same scroll content, shows the scene. That is a stone table, instanced rounded tiles, digits, flags and mines, one shadow-casting key light and a fill light. The scene renders on demand: when the game state changes, during the sway (the only loop) and while animations run. Animations are planned by a **pure timeline** from the difference between the previous and the next cell states. They only change pixels, never game state, so input and accessible names take effect at once. three.js is loaded with one `import()` when "3D" is first chosen. Loading has a 10 s timeout and fails safely to 2D, as do a missing WebGL2 and a lost context.

### AC → mechanism

| AC  | Mechanism                                                                                                                                                                                                                                                                                                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 | `createBoardScene`: rounded tiles with thickness, key light from the far left so side faces are darker, PCF shadows; hidden tiles raised, revealed tiles sunk (levels in `sceneLayout.ts`); 3D flag and mine meshes; unlit digits, flags and mines with token colours and a halo; camera from `geometry.ts` (tilt 25°, sway ±2°, period 14 s); far-row width from the 26 px floor |
| AC2 | `timeline.ts` plans reveal flip/sink (260 ms), a wave by distance from the clicked cell (finished ≤ 1.0 s after the state change), flag plant (240 ms) and unplant (180 ms); the scene samples it per frame; React state and DOM update synchronously before any frame                                                                                                            |
| AC3 | instancing (≈ 16 draw calls for any board), shadow map updated only while geometry moves, DPR cap 2 and a 4.2 M px budget, a frame-time `quality.ts` governor that shrinks effects first; checked by `scripts/measure-fps.mjs` on hak's Mac                                                                                                                                       |
| AC4 | `matchMedia('(prefers-reduced-motion: reduce)')` → no sway loop, empty timeline (every change is static), no transition on switching                                                                                                                                                                                                                                              |
| AC5 | same DOM, same `useBoardInput`, same `Cell`; overlay aligned by construction (`geometry.ts`), canvas `pointer-events: none`, scroll with the content; focus ring is the DOM outline as in 008                                                                                                                                                                                     |
| AC6 | `useBoard3d` + pure `view3dReducer`: loading state with indication, 10 s timeout, import error, WebGL2 missing at mount, context creation failure, `webglcontextlost` → back to 2D with a notice                                                                                                                                                                                  |

### Files

New (`src/features/minesweeper/`):

- `scene3d/geometry.ts`: pure, three-free. Constants (tilt, perspective depth, sway amplitude and period) and functions. It builds the overlay CSS transform, the overlay margins that hold the projected board for every sway angle, the canvas/stage layout, the camera world matrix, the frustum, the sway angle at a time and the device-pixel ratio under the pixel budget.
- `scene3d/geometry.test.ts`: unit tests (see "Minimal test set").
- `scene3d/timeline.ts`: pure, three-free. It turns the difference between two board snapshots into per-cell animations and samples a cell's pose at a time.
- `scene3d/timeline.test.ts`
- `scene3d/quality.ts`: pure frame-time governor (quality level 0–2 with hysteresis).
- `scene3d/quality.test.ts`
- `scene3d/types.ts`: types (`BoardSceneHandle`, `BoardSceneController`, `CreateBoardSceneOptions`, `ScenePalette`, `SceneEffect`, `EffectHost`, `TransitionHook`) plus one string constant, the unavailable error name. three-free. Main-chunk code imports from `scene3d/` only this file, `palette.ts` and the pure modules.
- `scene3d/palette.ts`: the token lists (`SCENE_COLOUR_TOKENS`, `SCENE_LOOK_TOKENS`) and `readPalette(getVar)`, which returns `{ colours, look }` (hex strings and `parseFloat` numbers). Throws on a missing or non-numeric token. three-free. Its lists are checked by `tokens.test.ts`.
- `scene3d/sceneLayout.ts`: scene constants in cell units from UX §2–§4: tile 1.0 × 1.0 × 0.45, radius 0.09, hidden top +0.15, revealed top −0.15, tray frame +0.05, floor −0.62, table −0.80, key direction `L`, flag sizes and `FLAG_LEAN_DEG = 28`, mine sizes, slash orientation from `TILT_DEG`. The overlay plane (z = 0) sits halfway between hidden and revealed tops.
- `scene3d/createBoardScene.ts`: **the lazy entry** (only target of `import()`). It builds renderer, scene, lights, meshes, the effect host and the frame loop, and implements `BoardSceneController`. It installs the dev-only probe.
- `scene3d/meshes.ts`: factories for table, board slab, instanced tiles, the 8 digit meshes (atlas on a canvas texture), flag (pole, cloth, base), mine, exploded marker and wrong-flag slash. Each mesh is instanced with a capacity of rows × cols.
- `scene3d/effects.ts`: the effect host (seam for 010). 009 registers no effect.
- `scene3d/environment.ts`: reflection environment of the hidden tiles, built in code from the scheme's `--scene-*` tokens (dim room, key-coloured window, overhead panel) and filtered with PMREM; rebuilt on a scheme change. Replaces `RoomEnvironment`, which clipped the tops to white (changed during build/test/review, see Implementation notes, deviation 2).
- `scene3d/probe.ts`: the dev-only probe object (`createProbe`), imported under the literal e2e guard in `createBoardScene.ts` (changed during build/test/review, see Implementation notes).
- `useBoard3d.ts`: hook in the main chunk. It holds the view state machine, the `import()` with timeout, the controller lifetime and the media queries (reduced motion, colour scheme, forced colours).
- `logic/view3d.ts` + `logic/view3d.test.ts`: the pure state machine of the view (reducer).
- `scripts/measure-fps.mjs` (repo root `scripts/`): the AC3 measurement, headed, not in CI.
- `e2e/minesweeper-3d-scene.spec.ts`: the 009 e2e specs (tester).

Changed:

- `logic/boardView.ts` (+ test): `supports3dView()` checks WebGL2 as well. The constructor must exist; no context is created at mount.
- `Minesweeper.tsx`: `view`/`setView`/`available3d` are replaced by `useBoard3d()`. It renders the notice and passes `scene` to `Board` and the 3D status to `ViewToggle`.
- `Board.tsx`: new prop `scene`. An always-present stage wrapper goes around the grid, plus a canvas host before the grid in 3D only. It records the reveal origin and keeps the scene in step through a layout effect (attach, update, pressed, detach). `Cell` and `useBoardInput` are unchanged.
- `Board.module.css`: removes the 008 relief block (lip, recess, glyph lift, `::before` ellipses and their forced-colours rule) and the 008 grid transform/margins rule. Adds the stage, the canvas host, the transparent overlay (inside `@media not (forced-colors: active)`), forced colours (canvas hidden) and the 3D phone cell size with `--board3d-fit` and `--board3d-rim`.
- `ViewToggle.tsx` (+ CSS): new prop `status3d` for loading/unavailable. The checked radio is the _requested_ view. During loading the group has `aria-busy="true"` and a static `Loading 3D…` text sits after it (no spinner). Focus moves to "2D" when "3D" becomes unavailable while focused.
- `Minesweeper.tsx` also renders the notice and announces 3D transitions through the existing live region (see "ViewToggle contract change").
- `src/app/tokens.css`: tokens removed and added (see "008 tests and tokens replaced").
- `src/app/tokens.test.ts`: the 008 3D-token test is replaced (see the test set). Scene tokens are added to parity and contrast where they sit under glyphs. There is a new scan for colour literals in `scene3d/**/*.ts`.
- `vite.config.ts` (devops): `optimizeDeps.include: ['three', 'three/addons/geometries/RoundedBoxGeometry.js']` and `build.chunkSizeWarningLimit: 600`, with a comment pointing to the check-dist budget.
- `playwright.config.ts` (devops/tester): launch args and the `chromium-3d` ready wait (below).
- `scripts/check-dist.mjs` (devops): add `__board3dProbe` to the forbidden list, a three-not-in-entry check and a scene chunk budget (below).
- `package.json` (devops): `three` and `@types/three` (done in the spike) and the script `"measure:fps": "node scripts/measure-fps.mjs"`.
- `e2e/minesweeper-3d.spec.ts`, `e2e/minesweeper.spec.ts` (tester): adapted (below).

### Types and contracts

```ts
// scene3d/types.ts (type-only; imported by main-chunk code with `import type`)
import type { GameState } from '../logic/types.ts';

/** What Board needs. Non-null only while the 3D scene is ready and shown. */
export interface BoardSceneHandle {
  /** Moves the canvas into `host` and starts driving `grid`'s inline transform and margins. */
  attach(host: HTMLElement, grid: HTMLElement): void;
  /** Removes the canvas, clears the inline transform/margins, stops the loop. */
  detach(): void;
  /** New game state; `origin` = index of the last revealed-by-input cell (wave start) or null. */
  update(game: GameState, origin: number | null): void;
  /** Touch long-press feedback (`useBoardInput.pressedIndex`). */
  setPressed(index: number | null): void;
}

export interface BoardSceneController extends BoardSceneHandle {
  setPalette(palette: ScenePalette): void;
  /** reducedMotion: no sway, no animations. active false: no rendering at all (forced colours). */
  setMotion(motion: { readonly reducedMotion: boolean; readonly active: boolean }): void;
  /** Removes the context-lost listener first, then disposes GPU resources. */
  dispose(): void;
}

export interface CreateBoardSceneOptions {
  readonly palette: ScenePalette;
  readonly reducedMotion: boolean;
  readonly onContextLost: () => void;
}

/**
 * `error.name` of what createBoardScene throws when no WebGL2 context can be created (→ "unavailable").
 * The class itself lives in createBoardScene.ts; the hook compares the name, because importing the
 * class value would pull the lazy module into the main chunk.
 */
export const SCENE3D_UNAVAILABLE = 'Scene3dUnavailableError'; // the one value export of types.ts

/** Everything the scene reads from tokens.css (UX §3.2): colours and unitless look numbers. */
export interface ScenePalette {
  readonly colours: Readonly<Record<SceneColour, string>>; // '#rrggbb'
  readonly look: SceneLook;
}
/** Unitless, scheme-dependent numbers (`parseFloat` of `--scene-*` tokens; UX §3.2, §14.1). */
export interface SceneLook {
  readonly keyIntensity: number; // --scene-key-intensity (× π in r187 physical units)
  readonly fillIntensity: number; // --scene-fill-intensity (× π)
  readonly shadowStrength: number; // --scene-shadow-strength → light.shadow.intensity
  readonly gloss: number; // --scene-gloss → clearcoat of hidden tiles
  readonly envIntensity: number; // --scene-env-intensity → hidden tiles only
}
export type SceneColour =
  | 'table' // --scene-table
  | 'slab' // --scene-slab
  | 'tileTop' // --scene-tile-top
  | 'revealedTop' // --scene-revealed-top (equals --cell-revealed-fill)
  | 'explodedTop' // --color-danger-bg
  | 'keyLight' // --scene-key
  | 'fillSky' // --scene-fill-sky
  | 'fillGround' // --scene-fill-ground
  | 'flag' // --color-danger-solid
  | 'pole' // --color-text
  | 'mineLit' // --scene-mine-lit
  | 'mineShade' // --scene-mine-shade
  | 'exploded' // --color-danger-solid (disc and ring)
  | 'explodedGlyph' // --color-on-danger-solid
  | 'slash' // --color-text
  | 'n1'
  | 'n2'
  | 'n3'
  | 'n4'
  | 'n5'
  | 'n6'
  | 'n7'
  | 'n8';

/** Seam for story 010. */
export interface SceneEffect {
  /** Advances the effect; returns false when it has ended (it is then disposed). */
  update(nowMs: number): boolean;
  dispose(): void;
}
export interface EffectHost {
  /** Root group the effect adds its objects to (three's Object3D; typed `unknown` here to keep three out of main-chunk types). */
  readonly root: unknown;
  add(effect: SceneEffect): void;
  /** Ends every effect at once (new game, 010 AC1/AC2). */
  clear(): void;
}
export interface SceneTransition {
  readonly prev: GameState | null;
  readonly next: GameState;
  readonly origin: number | null;
  readonly reducedMotion: boolean;
}
export type TransitionHook = (transition: SceneTransition, effects: EffectHost) => void;
```

```ts
// scene3d/createBoardScene.ts (lazy entry)
export function createBoardScene(
  options: CreateBoardSceneOptions,
  hooks?: readonly TransitionHook[], // 009 passes none; 010 adds its hooks here
): BoardSceneController; // renders nothing until attach(); compiles all materials before returning
```

```ts
// logic/view3d.ts (pure)
export type View3dStatus = 'idle' | 'loading' | 'unavailable';
export type View3dNotice = 'loadFailed' | 'lost' | null;

export interface View3dState {
  /** The radio's checked value (what the player asked for). */
  readonly requested: BoardView;
  /** What the board shows. '3d' only after the scene was created. */
  readonly shown: BoardView;
  readonly status: View3dStatus;
  readonly notice: View3dNotice;
  /** Incremented per load attempt; late results of older attempts are ignored. */
  readonly attempt: number;
}

export type View3dAction =
  | { readonly type: 'choose'; readonly view: BoardView; readonly loaded: boolean }
  | { readonly type: 'ready'; readonly attempt: number }
  | { readonly type: 'loadFailed'; readonly attempt: number } // import error or timeout
  | { readonly type: 'unavailable' } // no WebGL2 context
  | { readonly type: 'lost' };

export function initialView3d(available: boolean): View3dState; // requested/shown '2d', status 'idle' | 'unavailable'
export function view3dReducer(state: View3dState, action: View3dAction): View3dState;
```

Rules of the reducer, each a unit test:

- `choose 3d` with the module loaded and a controller alive gives shown `3d` at once (immediate switch).
- `choose 3d` otherwise gives requested `3d`, status `loading`, `attempt + 1`, and clears the notice.
- `choose 2d` gives requested and shown `2d`, status `idle` (if it was loading) and clears the notice. A later `ready` of that attempt does **not** switch.
- `ready` with the current attempt while requested is `3d` gives shown `3d` and status `idle`.
- `loadFailed` with the current attempt gives requested `2d`, status `idle`, notice `loadFailed`.
- `unavailable` gives status `unavailable` permanently for this mount, requested and shown `2d`, notice `loadFailed`.
- `lost` gives requested and shown `2d`, notice `lost`. The hook disposes the controller, and a later `choose 3d` creates a new one (module cached).

```ts
// useBoard3d.ts
export const SCENE_LOAD_TIMEOUT_MS = 10_000; // AC6; covers import + controller creation

export function useBoard3d(): {
  readonly requested: BoardView;
  readonly status: View3dStatus;
  readonly notice: View3dNotice;
  /** Non-null iff the 3D board is shown. */
  readonly scene: BoardSceneHandle | null;
  readonly choose: (view: BoardView) => void;
};
```

- **Loader.** `import('./scene3d/createBoardScene.ts')` is cached in a module-level promise variable _inside the hook file_. It is never imported statically. A timer of `SCENE_LOAD_TIMEOUT_MS` dispatches `loadFailed` for that attempt. `import()` cannot be aborted, so the attempt id makes a late success harmless; the module stays cached for the next choice. This is the CLAUDE.md "network timeout" rule; there is no AbortController because `import()` has none. Chromium caches a failed module fetch until reload, so a retry after a real network failure fails fast with the same notice. That is acceptable.
- **Creating the controller** with the loaded module: `createBoardScene({ palette: readPalette(getVar), reducedMotion, onContextLost })` inside a try. An error whose `name` is `SCENE3D_UNAVAILABLE` dispatches `unavailable`; any other error dispatches `loadFailed`; success dispatches `ready`. The controller lives in state (`useState`), not in a ref, because the react-hooks v7 lint rule `refs` rejects the ref form (changed during build/test/review, see Implementation notes, deviation 7). It is kept while the player switches to 2D (switching back is instant) and disposed on `lost` and on unmount (sign-out, 008/AC8).
- **Media queries** (`matchMedia`, change listeners added in an effect):
  - `prefers-reduced-motion: reduce` → `setMotion`;
  - `prefers-color-scheme: dark` → `setPalette(readPalette(...))`, tokens re-read after the media change;
  - `forced-colors: active` → `setMotion({ active: false })`.
- **`getVar`** is `(name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()`.

```ts
// Board.tsx
export interface BoardProps {
  readonly game: GameState;
  /** Non-null iff the 3D board is shown (story 009). Replaces 008's `view` prop. */
  readonly scene: BoardSceneHandle | null;
  readonly onReveal: (index: number) => void;
  readonly onToggleFlag: (index: number) => void;
}
```

```tsx
// Board.tsx (sketch)
const originRef = useRef<number | null>(null);
const handleReveal = useCallback((index: number) => { originRef.current = index; onReveal(index); }, [onReveal]);
// useBoardInput({ ..., onReveal: handleReveal })
const hostRef = useRef<HTMLDivElement>(null);
useLayoutEffect(() => {            // attach before paint: no frame without the scene
  if (!scene || !hostRef.current || !gridRef.current) return;
  scene.attach(hostRef.current, gridRef.current);
  return () => scene.detach();
}, [scene, gridRef]);
useLayoutEffect(() => { scene?.update(game, originRef.current); originRef.current = null; }, [scene, game]);
useLayoutEffect(() => { scene?.setPressed(pressedIndex); }, [scene, pressedIndex]);

<div className={styles.scroller} data-view={scene ? '3d' : '2d'}>
  <div className={styles.stage}>
    {scene && <div ref={hostRef} className={styles.canvasHost} aria-hidden="true" />}
    <div ref={gridRef} role="grid" … style={gridStyle} {...handlers}>…unchanged…</div>
  </div>
</div>
```

- The stage is rendered in **both** views, so switching never re-parents or remounts the grid (008/AC2 test "same grid element"). In 2D it is `display: contents`, so the 2D layout is unchanged.
- The canvas host is a conditional sibling _before_ the grid. React keeps the grid's identity because of the positional `false` slot.
- The scene controller owns the grid's inline `transform` and `margin*` in 3D and removes them on `detach`. `gridStyle` must never contain `transform` or `margin`, or React would overwrite them on re-render.

**ViewToggle contract change** (UX styles it): props `{ requested: BoardView; status3d: View3dStatus; onChange(view) }`.

- `checked` follows `requested`.
- While `status3d === 'loading'` the radiogroup has `aria-busy="true"` and a static `<p>` with `Loading 3D…` sits after the group, outside it. **No spinner** (decided by the orchestrator on UX §14.8): no extra loop, so AC4 holds without an exception.
- `'unavailable'` keeps 008's disabled "3D" and the unavailable `<p>` with the 008 copy.
- **Focus move (UX §9):** when `status3d` becomes `'unavailable'` while the "3D" input is `document.activeElement`, an effect in `ViewToggle` focuses the "2D" input (refs to both inputs). A disabled radio would otherwise drop focus to the body.
- The notice (`loadFailed`, `lost`) is a plain `<p>` (no role) rendered by `Minesweeper` directly under the View control, with the UX §10 copy and `MessageIcon kind="error"`. It is cleared by the next choice.

**Announcements (UX §11)** go through the existing live region of `Minesweeper.tsx` (`announce()`). The previous view state, as `View3dSeen` (`status`, `notice`, whether a scene is ready), is kept in state in `Minesweeper.tsx`, and the text is derived while rendering by the pure `view3dAnnouncement` in `logic/view3d.ts` (React's "adjust state when a value changes" pattern), not in an effect with a ref, because the react-hooks v7 lint rules reject that form (changed during build/test/review, see Implementation notes, deviation 7). It announces on these transitions:

- into `loading` → `Loading 3D…`;
- `loading` → `idle` with a scene → `3D view ready.`;
- a new notice `loadFailed` → `3D could not be loaded. The board stays in 2D.`;
- a new notice `lost` → `The 3D view stopped. Your game continues in 2D.`

An instant switch announces nothing. The strings are constants shared by the visible text and the announcement. Sway and animations are never announced.

### Overlay alignment and scrolling (decision: canvas sized to the content, not a sticky viewport canvas)

Structure in 3D:

```
.scroller[data-view=3d]  overflow: auto (as 005–008), background = --scene-table
  .stage                 position: relative; display: flow-root; padding: var(--board3d-rim)
    .canvasHost          position: absolute; inset: 0; pointer-events: none  ← <canvas> appended by the controller
    [role=grid]          transform + margins set inline by the controller (overlay)
```

The canvas covers the stage, which is the board's projected box plus the rim. It scrolls with the content.

**Why not a sticky viewport canvas.** A viewport-sized canvas would have to re-render on every scroll event. Scrolling (above all touch fling) runs on the compositor, while a WebGL re-render runs on the main thread a frame later. The tiles would "swim" against the overlay and the focus ring, and a tap during a fling could hit a cell that is not under the drawn tile.

**Cost of a content-sized canvas.** Its cost is pixels, bounded by the DPR cap 2 and a 4.2 M px budget (`devicePixelRatio = min(dpr, 2, sqrt(4.2e6 / (cssW · cssH)))`). A 30 × 30 board at 32 px is about 1 100 × 1 000 CSS px, so the DPR is about 1.95. The spike rendered a 2 000 × 1 300 backbuffer at the 120 Hz display limit on hak's Mac. Phones stay well inside the budget, because the boards are smaller.

**Geometry (`geometry.ts`, pure, same numbers for CSS and camera).**

- Coordinates are CSS px, the origin is the grid's layout centre, y points down, and the viewer is at +z.
- The CSS model is `perspective(P) · rotateY(φ) · rotateX(θ)` with `P = DEPTH · H` (H is the grid's layout height).
- Constants: `TILT_DEG = 25`, `DEPTH = 5` (008's values, validated at 320 px), `SWAY_DEG = 2`, `SWAY_PERIOD_MS = 14_000`, and `φ(t) = SWAY_DEG · sin(2πt / SWAY_PERIOD_MS)`. These replace the 008 CSS tokens `--board3d-tilt`/`--board3d-depth`, because only TypeScript uses them now.
- The three.js camera is the inverse of that model: the camera world matrix is `S · (Ry(φ) · Rx(θ))⁻¹ · S · T(0, 0, P)` with `S = diag(1, −1, 1)` (three is y-up). The projection is `makePerspective(left, right, top, bottom, near, far)` from the principal point (the grid's layout centre in canvas coordinates, `rim + marginInline + W/2`, `rim + marginTop + H/2`). The camera moves and the world stays put, so the **shadow map stays valid during sway** and is only updated when tiles move.
- The **overlay plane** (CSS z = 0) is three's z = 0. `sceneLayout.ts` puts the hidden-tile tops at +0.15 cell and the revealed tops at −0.15 cell (UX §2, sink 0.30). The worst offset between a drawn top face and its hit box is then `0.15 · sin 25°`, about 2 px at 32 px cells.
- **Margins** are computed per board from W and H for the full sway range, by sampling φ ∈ [−SWAY, SWAY] over the four corners:
  - `marginTop` and `marginBottom` are negative (they shrink the layout box to the projected height);
  - `marginInline` is symmetric, so the vanishing point stays centred.

  The controller sets them inline from a `ResizeObserver` on the grid (layout size, unaffected by transforms). Measured values at 2° sway: inline 0.0275 W on square boards, 0.0322 W on 5 × 30 and 0.0681 W on 30 × 5; top −0.064 H, bottom −0.025 H. Without margins that cover the sway, the transformed bounds would change every frame (flickering scrollbars) or be clipped on the left.

- **Phone cell size (below 600 px, 3D):** `clamp(var(--board3d-cell-min), (100vw − var(--board-chrome) − 2·var(--board3d-rim) − (cols − 1)·gap) / cols / var(--board3d-fit), 40px)`.
  - Built formula: `clamp(var(--board3d-cell-min), ((100vw − var(--board-chrome) − 2·var(--board3d-rim)) / var(--board3d-fit) − (cols − 1)·gap) / cols, 40px)`. The fit factor applies to the whole grid width including the gaps, because the projected board is scaled as a whole; the formula above, with the gaps not scaled, overflowed by gaps·(fit − 1), a 1 px sideways scroll for 9 × 9 at 320 and 375 px (changed during build/test/review, see Implementation notes, deviation 3).
  - `--board3d-fit` is `1.056` (not 1.055; margins are rounded outwards to 1/64 px, exact value 1.0551) and is `1 + 2 · marginInline / W` for a square board at 2° sway. `tokens.test.ts` derives it from `geometry.ts` (changed during build/test/review, see Implementation notes, deviation 4).
  - `--board3d-rim` is 4 px below 600 px and 16 px above.
  - Measured: a 9 × 9 board at 320 px gets 26.75 px cells with the design formula and about 26.6 px with the built one ((270 / 1.056 − 16) / 9); both fit. With an 8 px rim the design formula would overflow by 1.8 px.
  - Far row at the 26 px floor: at least 24.77 px wide over the whole sway range (AC1 ≥ 24 px). The combined tilt (25° pitch with 3° yaw) is 25.17°, so it is below 35° at every camera position.
- **Per frame (sway):** the controller writes `grid.style.transform = overlayTransform(H, φ)`, which is not inherited, so only the grid's style changes and the browser composites it. It then renders the canvas **in the same rAF callback**, so overlay and pixels never disagree. No React render happens per frame.
- **Layout changes** (viewport resize, new board): `ResizeObserver` on the grid and the stage gives new margins, canvas size and frustum, then a render. The scene measures in `update()`, not in `attach()`: on a new board `attach` runs before `update` and would measure with the previous game's columns. Both run in the same layout-effect pass, so the first painted 3D frame is still complete (changed during build/test/review, see Implementation notes, deviation 8).

### Scene (lazy chunk)

- **Renderer.** `WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })`, `NoToneMapping` (token colours stay predictable), sRGB output, `shadowMap.type = PCFShadowMap` with `shadow.radius` for softness (r187 removed `PCFSoftShadowMap`; `VSMShadowMap` is the alternative if UX finds PCF too hard), `shadowMap.autoUpdate = false`. `needsUpdate` is set when tile matrices change (animations, state change) and on a palette or size change, **not on sway**. `renderer.compile(scene, camera)` runs once in `createBoardScene`, so the first board frame does not hitch.
- **Lights.** One `DirectionalLight` (warm key `--scene-key`, `castShadow`, shadow camera fitted to the board, map 2048², 1024² at quality level 2). Its direction is `KEY_DIRECTION` in `sceneLayout.ts`: the UX §3.1 azimuth (from `L = (−0.30, +0.38, +0.875)`), but **elevation 47°, not 61°**, because at 61° the cast shadow of a raised tile falls into the 2 px gap and the AC1 shadow check (10 %) fails; at 47° it reaches 15 to 16 % (changed during build/test/review, see Implementation notes, deviation 1). The intensity is normalised to the UX top cosine, `keyIntensity · π · 0.875 / sin(elevation)`, so the up-facing calibration is unchanged. One `HemisphereLight` (fill). Intensities, shadow strength, gloss and environment come from `SceneLook` and are calibrated by the UX rule "unshadowed up-facing matte surface renders as its albedo times the UX §3.1 factor within 3 %", checked with a flat test, not by formula. The environment map is `createEnvironment` (`scene3d/environment.ts`), built from the tokens and applied to the hidden tiles only; `RoomEnvironment` is not used, because at `--scene-env-intensity` 0.3 its diffuse light clipped the hidden tops to white and left the front faces only about 16 % darker (changed during build/test/review, see Implementation notes, deviation 2). **Dark scheme look values changed after defect D1:** `--scene-env-intensity` 0.45 to 0.06 and `--scene-gloss` 0.8 to 0.5, because the environment and clear coat lifted the dark tile tops well above their token and broke the flag's 3:1 (light values unchanged; changed during test, see Implementation notes).
- **Meshes** (all instanced, about 16 draw calls for any board size):
  - table plane (seeded stone speckle with zero-mean noise, so it matches the `--scene-table` scroller background within 4 %; drop the speckle before the calibration if both can't hold) and the tray slab with frame;
  - tiles: **two** instanced meshes of `RoundedBoxGeometry` (`three/addons`), each with a capacity of rows × cols: hidden (glossy `MeshPhysicalMaterial`, clear-coat) and revealed (matte `MeshStandardMaterial`), because one material cannot be glossy and matte. Instance colour picks tile top, revealed top or exploded top. A reveal moves the instance from the hidden to the revealed mesh at p = 0.5;
  - 8 digit meshes: a quad per digit value with a canvas-texture atlas, white glyph plus halo, tinted per mesh with `--n1…--n8`;
  - flag: pole, cloth, base, leaning back by `FLAG_LEAN_DEG = 28` (in `sceneLayout.ts`), base 0.30 cell towards the near side;
  - mine: body with spikes merged into one geometry, `MeshBasicMaterial` with vertex colours baked between `mineShade` and `mineLit` by `n · L` (fixed key direction, still unlit);
  - exploded disc and ring, and the wrong-flag slash, which is kept parallel to the screen by rotating it back by `TILT_DEG` (exported from `geometry.ts`, imported by `sceneLayout.ts`).

  Per state change the instance matrices and counts are rewritten from `cellView(game, i)`. That costs O(cells) for an index of up to 900 entries, which is negligible.

- **Contrast (007/AC3 at every camera position).**
  - Digits, flag cloth, pole, mine and slash use `MeshBasicMaterial` (unlit, `toneMapped: false`) in their token colours, so their colour never changes with light or sway.
  - Each digit and glyph carries a **halo** in the token colour of the surface it sits on (revealed fill for digits and mines, tile top for flags), drawn into the atlas or as a slightly larger backing quad. The contrast to the pixels around a glyph is therefore always the 007 token pair, even inside a shadow or a specular highlight.
  - Lit surfaces (tops, sides, table) may vary freely.
- **Depth cues for AC1.**
  - The front and side faces of tiles get less key light than the tops (light from above-far). The developer tunes light directions and intensities so that **side faces are at least 15 % darker** and the **ground next to a raised tile is at least 10 % darker** than lit ground farther away. Use `light.shadow.intensity` (r187) to keep shadows soft but present.
  - Flags and mines cast shadows.
- **Pressed and hover cues.**
  - Pressed: `setPressed(i)` (touch long press) sinks the tile by 0.10 cell. This is a scene change: one render, no animation timing. Mouse `:active` and the touch press also get the overlay tint `--scene-pressed-tint`.
  - Hover: the scene does not change. The DOM overlay cell gets `--scene-hover-tint` (UX §6.2).
  - Focus: the DOM outline of 008 plus a two-tone halo on the overlay cell, `box-shadow: 0 0 0 1px var(--scene-focus-halo), inset 0 0 0 3px var(--scene-focus-halo)` (UX §6.1). This **supersedes 008's "no outer shadow on a cell"** for the 3D overlay: the cell is transparent and has no relief left to protect. AC5's computed-style check of the outline is unaffected.
- **Frame loop.**
  - `requestRender()` schedules one rAF.
  - The loop keeps running while sway is on (normal motion, active, attached) or an animation or effect is running, capped at 60 scene fps (frames are skipped on 120 Hz displays).
  - rAF stops by itself in hidden tabs.
  - Under reduced motion nothing loops: every change renders exactly one frame.
- **Quality governor (`quality.ts`).** It reads the median frame time over the last 30 frames.
  - At more than 20 ms it goes one level down: level 1 = DPR 1 and shadow update every 2nd animated frame; level 2 = sink only (no flip), the wave in 4 distance bands instead of per cell, shadow map 1024² and updated only at the end of an animation.
  - Step-up: the fixed 12 ms threshold could never be reached on a 60 Hz display, because rAF deltas are at least 16.7 ms (review minor 3), so the step-up threshold was changed in review round 1 and `quality.ts` (`FAST_FRAME_MS`, `STEP_UP_AFTER_MS`) is the reference for the value (changed during review, see Implementation notes and Review). It steps up after the fast window has held for 2 s.

  It never changes durations past the AC2 limits and never touches game state ("animations reduced rather than slowing the board down"). On hak's Mac it is expected to stay at level 0 (spike: 8.3 ms frames).

- **Context loss.** On `webglcontextlost`, `onContextLost()` is called (the hook dispatches `lost`). `dispose()` removes that listener **before** calling `renderer.dispose()`/`forceContextLoss()`, so a deliberate dispose never shows the "lost" notice.
- **Effects seam (010).**
  - `createBoardScene(options, hooks)` creates an `EffectHost` with a `root` group in the scene.
  - Every `update()` calls each `TransitionHook` with `{ prev, next, origin, reducedMotion }` after the timeline is planned.
  - Running effects keep the loop alive, `update(now)` returning false ends them, and a new `game.id` calls `effects.clear()`.
  - 010 adds hooks (explosion, celebration, camera shake as a camera offset added in the same place as the sway) without touching the timeline or the overlay.

### Animation timeline (`timeline.ts`, pure)

```ts
export const FLIP_MS = 260; // AC2: 150–400 ms
export const PLANT_MS = 240; // AC2: ≤ 300 ms
export const UNPLANT_MS = 180;
export const WAVE_TOTAL_MS = 1000; // AC2: final ≤ 1.2 s after the click; 200 ms slack for input-to-frame latency
export const WAVE_STEP_MAX_MS = 35;

export type CellKind = CellViewKind; // from logic/cellView.ts
export interface BoardSnapshot {
  readonly gameId: number;
  readonly phase: GamePhase;
  readonly kinds: readonly CellKind[];
}
export type CellAnim =
  | {
      readonly kind: 'reveal';
      readonly index: number;
      readonly start: number;
      readonly duration: number;
    }
  | {
      readonly kind: 'plant' | 'unplant';
      readonly index: number;
      readonly start: number;
      readonly duration: number;
    };

/** Animations for prev → next; [] if reduced motion, a new game, or the transition ends the game (static final board, AC5; 010 adds effects via hooks). */
export function planTransitions(
  prev: BoardSnapshot | null,
  next: BoardSnapshot,
  origin: number | null,
  cols: number,
  nowMs: number,
  options: { readonly reducedMotion: boolean; readonly level: 0 | 1 | 2 },
): CellAnim[];

/** 0 = start pose, 1 = final pose; clamps; pure. */
export function progress(anim: CellAnim, nowMs: number): number;
```

- **Reveal wave.**
  - `delay = distance(cell, origin) · step` with Euclidean distance in cells and `step = min(WAVE_STEP_MAX_MS, (WAVE_TOTAL_MS − FLIP_MS) / maxDistance)`, so a full 30 × 30 cascade ends at 1 000 ms.
  - If `origin` is null (cannot happen through input, only defensively), the centroid of the newly revealed cells is used.
  - The origin cell starts at delay 0.
- **Retargeting.** If a cell changes again while it is animating (for example a flag toggled twice quickly), its old animation is dropped and the new one starts at `now`. Nothing queues, so no input ever waits.
- **Static changes.**
  - A new game (`gameId` differs), or `prev === null` (first attach, switching to 3D mid-game or after the end): no animation (also the "no replay" base for 010/AC3).
  - A transition into `won` or `lost`: no animation; mines, exploded cell, wrong flags and auto-flags appear at once.
  - Reduced motion: no animation.
- The scene samples `progress` per frame for every running animation and writes the instance matrices.
  - **Reveal:** flip 180° about the tile's x-axis while sinking from the hidden to the revealed level. The instance colour switches at 90° (edge-on), and the digit appears at `progress ≥ 0.5`.
  - **Plant:** the flag drops in from 0.6 cell above with ease-out and a small settle.
  - **Unplant:** the flag lifts and scales to 0.

### Data flow and state ownership

| State                                         | Owner                                               | Notes                                                                 |
| --------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| game, counter, timer, result, focus           | unchanged (005/006: `gameReducer`, `useBoardInput`) | the scene reads `game` only; nothing reads the scene                  |
| requested/shown view, status, notice          | `useBoard3d` → `view3dReducer` in `Minesweeper`     | not persisted (008/AC8): unmount disposes, a new mount starts at `2d` |
| available (WebGL2 + CSS 3D)                   | `initialView3d(supports3dView())` once per mount    | can become `unavailable` later when context creation fails            |
| scene controller                              | state in `useBoard3d` (`useState`)                  | survives games and 2D↔3D switches; disposed on `lost`/unmount         |
| reveal origin                                 | ref in `Board`                                      | set by the wrapped `onReveal`, consumed by the next `update`          |
| overlay transform/margins, canvas size        | the controller (imperative, inline styles)          | derived from `geometry.ts`; no React state per frame                  |
| visual poses, animations, effects             | the controller (`timeline.ts`, `EffectHost`)        | derived from snapshots + scene clock; never fed back into React       |
| reduced motion, colour scheme, forced colours | `matchMedia` listeners in `useBoard3d`              | pushed into the controller                                            |

**AC2 "never delays".** Clicks and keys go to the DOM grid, then `useBoardInput`, then `dispatch`. React commits the new names, counter and live regions synchronously in that task. The layout effect then calls `scene.update`, which only plans animations and requests a frame. No code path waits for an animation, reads animation state or disables input during one. The canvas itself never receives pointer events.

### Error handling

| Failure                                            | Detection                                                 | Result                                                                              |
| -------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| No WebGL2 constructor or CSS 3D transform          | `supports3dView()` at mount                               | "3D" disabled + unavailable text (as 008/AC7)                                       |
| Chunk fetch fails                                  | `import()` rejects                                        | `loadFailed`: notice, radio back to "2D", game untouched                            |
| Loading takes longer than 10 s                     | `SCENE_LOAD_TIMEOUT_MS` timer                             | as above; a late success is ignored (attempt id) but cached                         |
| Context cannot be created (blocklisted GPU, limit) | `createBoardScene` throws, `name === SCENE3D_UNAVAILABLE` | `unavailable`: "3D" disabled + text, plus the load notice                           |
| Context lost during play                           | `webglcontextlost`                                        | `lost`: back to 2D with notice, controller disposed, "3D" can be chosen again       |
| Any other error inside `createBoardScene`          | try/catch in the hook                                     | `loadFailed`                                                                        |
| Error inside a frame (bug)                         | not caught per frame                                      | surfaces in e2e (`pageerror` collected in the AC6 tests); no silent per-frame catch |

### Dev-only e2e probe

It is installed in `createBoardScene.ts` with the literal guard at the use site, and its module has no top-level side effects:

```ts
if (import.meta.env.DEV && import.meta.env.MODE === 'e2e') {
  window.__board3dProbe = createProbe(controllerInternals); // deleted again in dispose()
}
```

```ts
interface Board3dProbe {
  /** Manual scene clock from now on: no frame loop; each render request renders synchronously at the frozen time. */
  pause(): void;
  /** true: the sway stays at phase 0 while time advances (for animation checks). */
  holdSway(hold: boolean): void;
  /** Moves the scene clock forward and renders one frame synchronously. */
  advance(ms: number): void;
  /** Viewport CSS px of a point given in cell units relative to the centre of the cell's top face (dz up). */
  project(
    index: number,
    offset?: readonly [dx: number, dy: number, dz: number],
  ): { x: number; y: number };
  /** Renders a frame at the current time and reads RGB at viewport CSS px points (DPR-corrected, y-flipped). */
  pixels(points: readonly { x: number; y: number }[]): [r: number, g: number, b: number][];
  /** Scene frames rendered since creation (fps script). */
  readonly frames: number;
}
```

- `scripts/check-dist.mjs`: add `'__board3dProbe'` to `FORBIDDEN`.
- The probe makes no game decisions: the mine layout stays `window.__minesweeperMines`.
- Context loss in tests uses the standard `WEBGL_lose_context` extension on the existing canvas. That needs no probe.

### Bundle and check-dist

- The main chunk imports nothing from `scene3d/` except `import type`, the `SCENE3D_UNAVAILABLE` constant and the three-free modules (`geometry.ts`, `timeline.ts`, `quality.ts`, `palette.ts`). `@typescript-eslint/consistent-type-imports` is already on.
- `check-dist.mjs`, new checks (plain Node, `zlib.gzipSync`):
  1. Read `dist/index.html`. The files in its `<script type="module" src>` and `<link rel="modulepreload" href>` must **not** contain the three marker `THREE.WebGLRenderer` (a literal in three's build, verified).
  2. At least one other JS file **must** contain the marker. Otherwise the check is vacuous (lazy chunk missing or marker changed).
  3. That chunk's gzip size must be ≤ `SCENE_CHUNK_GZIP_MAX = 180 * 1024` (gate-1 budget). The check prints the size.
- `vite.config.ts`: `build.chunkSizeWarningLimit: 600` (kB, minified). The scene chunk is lazy and budgeted by check-dist, so the default 500 kB warning is noise.

### Playwright

- **Launch args for all projects** (`use.launchOptions.args`): `['--use-angle=swiftshader', '--enable-unsafe-swiftshader']`.
  - They force the same software WebGL on macOS and on ubuntu CI. The spike showed this renderer works on macOS; the flags are needed on Linux, where recent Chromium dropped the automatic software fallback unless `--enable-unsafe-swiftshader` is given.
  - The flags have no effect on 2D tests.
  - The first CI run verifies Linux. If WebGL is missing there, the ready helper fails with a clear message (it checks that the unavailable text is not shown).
- **Ready wait.** A helper `choose3d(page)` in each spec that needs it (no shared fixture across specs; CLAUDE.md "independent tests"):

  ```ts
  await page.getByRole('radio', { name: '3D' }).check();
  await expect(page.getByRole('radiogroup', { name: 'View' })).not.toHaveAttribute(
    'aria-busy',
    'true',
    { timeout: 15_000 },
  );
  await expect(page.getByText(UNAVAILABLE_OR_FAILED)).toHaveCount(0); // fail loudly if WebGL is missing
  await page.evaluate(() => window.__board3dProbe?.pause()); // no continuous frames on SwiftShader
  ```

  `chromium-3d` keeps `testMatch: 'minesweeper.spec.ts'` and `grep: /AC(6|8|9|10):/`. Its `beforeEach` line becomes the same three steps.

  Tests that need the sway (AC1) or real loading (AC6) don't pause.

- `vite.config.ts` `optimizeDeps.include` (above) avoids the "new dependencies optimized, reloading" page reload on the first `import()` in the dev server, which would make e2e flaky.
- **Time.** All animation and sway checks use `probe.advance()`. `page.clock` is used only for the 10 s load timeout. While paused, the probe renders synchronously, so tests that use `page.clock` (008/AC2) do not depend on faked rAF.

### AC3 measurement: `scripts/measure-fps.mjs`

- It does **not** run against `vite preview`: a production build has no guest sign-in (dev-only, story 004) and no fixed mine layout, so it cannot sign in or produce a reproducible cascade.
- Instead the script starts its own dev server in mode `e2e` on port 5175 (`--strictPort`). React then runs its development build, so the measurement is **conservative**: if the floors hold there, they hold in production.
- It launches **headed** Chromium without SwiftShader flags (real GPU), with viewport 1440 × 900 and `deviceScaleFactor: 2` (Retina).
- **Scenario A (16 × 30, 99 mines).** Sign in as guest, then set a fixed layout with a large empty region around (1,1) (mines packed in the far half). Choose 3D and wait until ready (no probe pause). Click (1,1). Read `__board3dProbe.frames` every 100 ms from the click to 2 s after the cascade (1.2 s + 2 s). Result: the median of scene fps per 500 ms window and the minimum window. **Pass at a median ≥ 50.**
- **Scenario B (30 × 30, 180 mines).** Same, with a cascade. **Pass at a median ≥ 30.** Then 20 inputs (alternating right-click flag and reveal on hidden cells). Latency = first scene frame after the cell's `aria-label` changed (MutationObserver plus the probe's frame counter, `performance.now()`) minus the `pointerdown` `timeStamp`. **Pass at a maximum ≤ 100 ms.**
- Output: a table with renderer string (must be a GPU, not SwiftShader), DPR, quality level reached, fps median/min, latency median/max, and exit code 1 if a floor is missed.
- The tester runs it on hak's Mac and pastes the table into the Test report. It is not part of `verify` or CI.

### 008 tests and tokens replaced

Tokens removed from `tokens.css` (both blocks), with what replaces them:

| Removed                                                         | Replaced by                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `--board3d-tilt`, `--board3d-depth`                             | `TILT_DEG`, `DEPTH` in `geometry.ts` (used by TypeScript only)                  |
| `--board3d-top`, `--board3d-bottom`, `--board3d-side`           | per-board margins from `geometry.ts` (inline), `--board3d-fit` for phone sizing |
| `--tile-lip-3d`, `--glyph-lift-3d`, `--recess-depth-3d`         | scene geometry (`sceneLayout.ts`)                                               |
| `--cell-recess-light`, `--shadow-glyph-3d`, `--shadow-board-3d` | lit scene + cast shadows; scene colours as `--scene-*` tokens (UX)              |

- Kept: `--board3d-cell-min` (26 px).
- New:
  - `--board3d-fit`, `--board3d-rim` (sizes);
  - the `--scene-*` tokens of UX §3.2 (light and dark): colours `--scene-table`, `--scene-slab`, `--scene-tile-top`, `--scene-revealed-top`, `--scene-key`, `--scene-fill-sky`, `--scene-fill-ground`, `--scene-mine-lit`, `--scene-mine-shade`, `--scene-focus-halo`; alpha tints `--scene-hover-tint`, `--scene-pressed-tint` (CSS only); unitless look numbers `--scene-key-intensity`, `--scene-fill-intensity`, `--scene-shadow-strength`, `--scene-gloss`, `--scene-env-intensity`. Digits, flag, pole, slash and exploded reuse `--n1…--n8`, `--color-text`, `--color-danger-solid`, `--color-danger-bg` and `--color-on-danger-solid`.

CSS removed from `Board.module.css`:

- the `.scroller[data-view='3d'] .grid` transform/margins/slab-shadow rule (now inline from the controller);
- all `:where(.scroller[data-view='3d'])` relief rules (lip, recess, glyph lift, `::before` ellipses);
- the 3D `::before` rule in the forced-colours block.

Tests:

| 008 test                                                                                       | Fate                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokens.test.ts` "AC3: the 3D tokens match tilt and depth, and the tilt is at most 35 degrees" | **replaced** by `geometry.test.ts` (tilt, sway, margins) and the `--board3d-fit` check in `tokens.test.ts`                                                                             |
| `boardView.test.ts` (3 cases, `CSS.supports`)                                                  | **changed**: 4 cases (no `CSS`, `CSS.supports` false, no `WebGL2RenderingContext`, all present)                                                                                        |
| e2e 008 "AC3: the 3D board is tilted and has relief, and 2D afterwards is unchanged"           | **replaced**: the look by 009 AC1; the "2D after a 3D round trip equals 2D before" pixel comparison **moves** into the 009 AC5 test (2D stays untouched, and the stage wrapper is new) |
| e2e 008 "AC3: a fitting 3D board has no scrollbars and no spill-over"                          | **moves** to the 009 spec as part of AC1 (margins now come from `geometry.ts`)                                                                                                         |
| e2e 008 "AC3: at 320 px the far row is at least 24 px wide, …"                                 | **moves** to the 009 spec as AC1 (far row ≥ 24 px is now 009/AC1)                                                                                                                      |
| e2e 008 "AC6: with reduced motion …" and "AC6: with normal motion …"                           | **replaced** by 009 AC4                                                                                                                                                                |
| e2e 008 "AC7: without 3D support …"                                                            | **replaced** by 009 AC6 (stub `WebGL2RenderingContext` instead of `CSS.supports`)                                                                                                      |
| e2e 008 AC1, AC1 (tap), AC2, AC5 (light, dark), AC8                                            | **kept**. They go through `choose3d` where they choose 3D, and the `scroller` helper becomes the element with `data-view` (the grid's parent is now the stage)                         |
| `chromium-3d` project (008/AC4 re-runs)                                                        | **kept**, `beforeEach` waits for 3D ready + pauses the probe; it now also proves 009/AC5 (same gestures, lose/win as static boards)                                                    |

### Minimal test set (one per AC, cheapest level)

Unit (pure logic only):

- `scene3d/geometry.test.ts`:
  - (1) **Alignment**: for random board points, several W × H (5 × 5, 9 × 9, 16 × 30, 30 × 5, 30 × 30) and sway −2°, 0°, 2°, the camera projection (world matrix + frustum) equals the CSS `perspective · rotateY · rotateX` projection to 1e-6 px. This is the overlay guarantee.
  - (2) The margins contain the projected corners for every sampled sway angle, for aspect ratios from 30 × 5 to 5 × 30, and are symmetric inline.
  - (3) `TILT_DEG` ≤ 35, `SWAY_DEG` ≤ 3, `SWAY_PERIOD_MS` ≥ 10 000; the combined tilt over the sway range stays ≤ 35°.
  - (4) The far row at the 26 px floor stays ≥ 24 px wide over the sway range.
  - (5) The DPR cap and pixel budget.
- `scene3d/timeline.test.ts`:
  - (1) a single reveal lasts 150–400 ms;
  - (2) a cascade starts at the origin, delays grow with distance, and a full 30 × 30 cascade (worst case) ends ≤ 1 200 ms;
  - (3) plant and unplant ≤ 300 ms;
  - (4) reduced motion, a new game, `prev` null and transitions into won/lost give `[]`;
  - (5) a change during a running animation retargets at `now` (no queued delay);
  - (6) quality level 2 keeps the same end bound.

  (AC2 limits for any board size and AC4 "ends by itself".)

- `scene3d/quality.test.ts`: steps down on slow frames, steps up only after 2 s of fast frames (hysteresis), clamps at 0 and 2.
- `logic/view3d.test.ts`: the reducer rules listed above, especially the races: 2D chosen during loading, a late ready after a timeout, and lost (AC6).
- `logic/boardView.test.ts`: 4 cases (above).
- `src/app/tokens.test.ts`:
  - `--board3d-fit` lies within +0.005 of `1 + 2 · marginInline / W` for a square board from `geometry.ts`;
  - every token in `palette.ts` exists in light and dark;
  - the **look tokens** (`SCENE_LOOK_TOKENS` exported from `palette.ts`: `--scene-key-intensity`, `--scene-fill-intensity`, `--scene-shadow-strength`, `--scene-gloss`, `--scene-env-intensity`) get **parity only**: present in both blocks, a finite number in [0, 2]. They are excluded from every colour-format and contrast check. The alpha tints (`--scene-hover-tint`, `--scene-pressed-tint`) are decoration and not contrast-tested (ADR 0004's alpha exception for tints with no text under them);
  - `--scene-revealed-top` equals `--cell-revealed-fill` in both schemes;
  - new contrast pairs (UX §14.14), in both schemes:
    - `--color-danger-solid` on `--scene-tile-top` ≥ 4.5;
    - `--color-text` on `--scene-tile-top` ≥ 3;
    - `--n1`…`--n8` on `--scene-revealed-top` ≥ 4.5;
    - `--color-danger-solid`, `--scene-mine-lit`, `--scene-mine-shade` and `--color-text` on `--scene-revealed-top` ≥ 3;
    - `--color-danger-solid` on `--color-danger-bg` ≥ 3;
    - `--color-on-danger-solid` on `--color-danger-solid` ≥ 3;
    - `--color-focus` on `--scene-focus-halo` ≥ 3;
  - no hex or `0x` colour literal in `src/features/minesweeper/scene3d/**/*.ts`.

E2E, `e2e/minesweeper-3d-scene.spec.ts` (guest sign-in, fixed mine layouts, titles start with the 009 AC id; `choose3d` as above):

- **AC1 (look), light and dark** (parametrised as in 008 AC5), 9 × 9 fixed layout with hidden, revealed, numbers 1–3, two flags and a mine after a loss on a second board. Probe paused, then `probe.pixels` at `probe.project(...)` points:
  - side face vs top face of a hidden tile next to a revealed area: side at least 15 % darker (relative luminance);
  - ground next to a raised tile vs lit ground farther away: at least 10 % darker;
  - hidden tile top vs revealed top lie on different levels (the projected top centres of a hidden and a revealed cell, with the same overlay centre, differ in y);
  - flag and mine pixels sit above the tile plane (`dz > 0` points have the glyph colour);
  - digit vs its halo, and flag and mine vs surround, ≥ 4.5:1 and 3:1 at sway −2° and +2° (`holdSway(false)`, `advance` to a quarter and three quarters of the period);
  - two frames 3 s apart differ (`advance(3000)`).
- **AC1 (size)**: at 320 px with 30 columns the far-row cell box is ≥ 24 px wide, the last cell of a 30 × 30 board is reachable inside the scroller, and a 9 × 9 board needs no sideways scroll at 320 and 375 px. A fitting 5 × 5 board shows no scrollbars. (Moved from 008.)
- **AC2**, probe paused with sway held:
  - (a) reveal a number cell: right after the click (before any `advance`) the cell's accessible name and the counter show the new state; the frame at +140 ms differs from the final frame (+2 000), and the frame at +400 ms equals it;
  - (b) a cascade on a 30 × 30 board with an open area: at +60 ms pixels near the origin changed while a far cell's did not; the frame at +1 200 ms equals +3 000 ms;
  - (c) flag with F: the frame at +300 ms equals +1 000 ms, and +40 ms differs;
  - (d) during the cascade (+60 ms, not advanced further) flag another cell by right-click and reveal one by keyboard: names and counter update at once.
- **AC4**: `emulateMedia({ reducedMotion: 'reduce' })`.
  - Switching to 3D (module already loaded by a first switch) is immediate: shown at once, no `document.getAnimations()`.
  - Without pausing, the frames before and after `advance(3000)` are equal (no sway).
  - After a cascade and a flag, the frame right after the input equals the frame at +3 000 ms (static).
  - A lost board is static and its names are as in 005/AC9.
- **AC5** (parity beyond the re-runs):
  - (a) Alignment in the browser: on a 30 × 30 board, scrolled to the bottom-right and at both sway extremes, `probe.project(i, [0, 0, -0.15])` (the overlay plane under a hidden tile's top) of a near-corner, a far-corner and a centre cell lies within 2 px of the DOM cell's box centre, and a `page.mouse.click` at the projected point reveals exactly that cell.
  - (b) A 2D screenshot before and after a 3D round trip is equal (tolerance as in 008).
  - 008 AC2/AC5 and the `chromium-3d` re-runs cover the rest.
- **AC6**:
  - (a) Slow, failing and timed-out load: `page.route('**/scene3d/createBoardScene.ts*')` held. "3D" shows the loading text and `aria-busy`, the 2D board stays usable (reveal a cell), and the release makes the 3D board appear. A new page with `route.abort()` shows the failure notice, "2D" checked, game unchanged. A new page with `page.clock.install()` and a held route, then `runFor(10_000)`, shows the same notice.
  - In (a), the live region also reads `3D view ready.` after the release.
  - (b) Unavailable: `addInitScript` deletes `window.WebGL2RenderingContext`. "3D" is disabled with the text, and 2D plays with no `pageerror`. A second page stubs `getContext('webgl2')` to return null and chooses "3D" by keyboard: "3D" becomes disabled with the text and the load notice, and focus is on "2D" (UX §9).
  - (c) Lost: in 3D mid-game, the test evaluates `canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()`. The view returns to 2D with the notice, the grid's `ariaSnapshot()` and counter are unchanged, no `pageerror`, and "3D" can be chosen again.

Not tested, listed as "checked, OK" if looked at: forced colours in 3D (canvas hidden, 008's DOM look applies), drag-scroll in 3D on touch (canvas has no pointer events; same scroller), WebKit and Firefox (not run).

AC3: `scripts/measure-fps.mjs` on hak's Mac (tester); the table goes in the Test report.

### Risks and mitigations

- **Overlay and scene disagree, so a click hits the wrong tile.** One pure geometry module feeds both, the unit test proves equal projections, and the e2e AC5 (a) checks the real browser incl. scrolling and sway extremes. Never place the overlay with a separate CSS formula.
- **Sway changes the transformed bounds (scrollbar flicker, clipped left column).** Margins cover the full sway range per board (unit-tested over aspect ratios). Do not reintroduce fixed-ratio margin tokens.
- **Contrast under light and shadow.** Glyphs unlit in token colours with a halo in the surface colour. The e2e samples at both sway extremes in both schemes. If a pair fails, fix the halo, not the light.
- **e2e slow or flaky on SwiftShader (7–25 fps, CPU-bound, parallel workers).** The probe pauses (no loop) right after 3D is ready, renders synchronously and keeps frame counts small. If CI time grows noticeably, the tester may set `test.describe.configure({ mode: 'serial' })` for the scene spec rather than lowering checks.
- **WebGL missing on Linux CI.** Explicit SwiftShader flags. The ready helper fails with a clear message. Verify on the first CI run (not measurable here).
- **Vite dev reload on the first `import()`.** `optimizeDeps.include`.
- **Main-thread block on creation (shader compile, PMREM).** Compile once in `createBoardScene`. Keep the environment map optional. The 10 s timeout catches pathological cases.
- **three.js upgrades break APIs or the look** (r187 removed `PCFSoftShadowMap`). `^0.187.0` takes patches only; minors are deliberate (ADR 0005).
- **three leaks into the main chunk.** `import type` only, plus the check-dist marker and budget check.
- **GPU memory and battery.** DPR cap 2 and pixel budget, 60 fps cap for the sway loop, no loop under reduced motion, rAF stops in background tabs, dispose on unmount and lost.
- **Spurious "lost" notice on dispose.** Remove the `webglcontextlost` listener before disposing (unit-free; covered by AC6 (c), where choosing 3D again must not show a notice).
- **React overwrites the inline transform.** `gridStyle` never contains `transform`/`margin`. The controller is the only writer in 3D, and `detach` clears both.
- **Forced colours.** The canvas ignores system colours, so under `forced-colors: active` the canvas host is `display: none`, the overlay keeps its 2D/forced-colours cell styles (the transparent rules sit in `@media not (forced-colors: active)`) and the controller stops rendering.
- **Mobile Safari canvas limits.** The pixel budget (4.2 M) stays below the iOS canvas area limit; not testable in the Chromium-only suite.

### Implementation plan (ordered)

1. Pure modules with tests: `geometry.ts`, `timeline.ts`, `quality.ts`, `logic/view3d.ts`; update `boardView.ts`.
2. Tokens: remove the 008 relief and geometry tokens, add `--board3d-fit`, `--board3d-rim` and the `--scene-*` colours (UX values); update `tokens.test.ts`.
3. `scene3d/types.ts`, `palette.ts`, `sceneLayout.ts`, `meshes.ts`, `effects.ts`, `createBoardScene.ts` incl. the guarded probe. Check by hand in `npm run dev` on 9 × 9, 16 × 30 and 30 × 30, light and dark, with the 15 %/10 % light targets.
4. `useBoard3d.ts`, `Minesweeper.tsx`, `Board.tsx` (stage, host, layout effects, origin), `ViewToggle.tsx` (status, `aria-busy`) and `Board.module.css` (remove the 008 3D block, add stage, overlay, forced colours and phone formula).
5. Config (devops): `vite.config.ts`, `playwright.config.ts`, `check-dist.mjs`, `package.json` script.
6. e2e (tester): new spec, adapt the 008 spec and the `chromium-3d` `beforeEach`; `scripts/measure-fps.mjs` run on hak's Mac.
7. `npm run verify` and `npm run test:e2e`.

### Alignment with UX

The UX section answered the design's eight open points (UX §14, last paragraph). Each point of UX §14 is reconciled here; the sections above were updated to match, and the UX section is unchanged.

| UX §14 point                                                                    | Decision                             | Reason                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Numbers in the palette: a `SceneLook` record, parity only in `tokens.test.ts` | Accepted                             | Lighting numbers differ per scheme, so they belong in the token file. They are not colours, so they get parity plus a numeric range check and are skipped by colour checks.                                                                                                                                                                               |
| 2 Palette keys `explodedTop`, `mineLit`/`mineShade`, drop `tileHover`           | Accepted                             | They match the glyph and tile design of UX §4. Hover is a DOM tint, so `tileHover` had no reader.                                                                                                                                                                                                                                                         |
| 3 Two instanced tile meshes (glossy hidden, matte revealed)                     | Accepted                             | One material cannot be both. It costs one draw call (about 16), and the flip moves the instance at p = 0.5.                                                                                                                                                                                                                                               |
| 4 Halo colour = surface token                                                   | Accepted                             | It was the design default, and the calibration rule keeps the lit floor near the token. The K_top knob stays a gate-2 option.                                                                                                                                                                                                                             |
| 5 Key light elevation 61°, `L = (−0.30, +0.38, +0.875)`                         | Changed: elevation 47°, azimuth kept | The azimuth is "from the far left" as designed. At 61° the cast shadow falls into the gap and AC1's 10 % check fails (3 to 7 % measured); at 47° it is 15 to 16 %, still clear of the digit halos. The intensity is normalised to the UX top cosine. Fixed in `sceneLayout.ts` (changed during build/test/review, see Implementation notes, deviation 1). |
| 6 Hover in the scene (`setHover`)                                               | Rejected for 009                     | It needs a pointer listener and a new handle method for a cue that no AC needs. It is a possible later change; the DOM tint satisfies UX §6.2.                                                                                                                                                                                                            |
| 7 Flag lean 28°, slash parallel to the screen via `TILT_DEG`                    | Accepted                             | Without the lean the flag is 5 px tall at 32 px cells. `geometry.ts` exports `TILT_DEG` to `sceneLayout.ts`, so there is one source.                                                                                                                                                                                                                      |
| 8 Loading spinner vs "nothing loops"                                            | Changed: no spinner                  | Decided by the orchestrator: a static `Loading 3D…` text, so there is no extra loop and AC4 needs no exception. `aria-busy` and the announcement stay.                                                                                                                                                                                                    |
| 9 Ghost shadow at quality level 2                                               | Accepted                             | Only on slow machines with very large boards, for at most 1 s. The reference Mac stays at level 0 (spike: 8.3 ms frames).                                                                                                                                                                                                                                 |
| 10 Table seam within 4 %, drop the speckle before the calibration               | Accepted                             | The scroller background equals `--scene-table`. The speckle is zero-mean and seeded, and it is the first thing to drop.                                                                                                                                                                                                                                   |
| 11 Overlay focus halo as an outer `box-shadow`                                  | Accepted                             | It supersedes 008's "no outer shadow on a cell" in 3D only. The overlay cell is transparent, and AC5 checks the outline's computed style, which is unchanged.                                                                                                                                                                                             |
| 12 Announcements via the existing live region, previous state in a ref          | Accepted, form changed               | One existing live region, nothing read twice, as designed. The previous view state is kept in state and the text is derived while rendering, not in an effect with a ref (react-hooks v7 lint; changed during build/test/review, see Implementation notes, deviation 7). One e2e assertion is added (AC6 (a)).                                            |
| 13 Focus to "2D" when "3D" becomes unavailable while focused                    | Accepted                             | A disabled radio would drop focus to the body. An effect in `ViewToggle` with refs, checked in AC6 (b).                                                                                                                                                                                                                                                   |
| 14 New contrast pairs in `tokens.test.ts`                                       | Accepted                             | They guard the unlit glyph pairs by construction, at every camera position. The focus-halo pair covers the 3D ring.                                                                                                                                                                                                                                       |
| 15 Rim 4 px below 600 px, 16 px above                                           | Accepted (was the design value)      | 9 × 9 fits at 320 px only with a rim of at most about 6 px (measured: 26.75 px cells).                                                                                                                                                                                                                                                                    |

UX geometry adopted in `sceneLayout.ts`: tile 0.45 thick, hidden top +0.15, revealed top −0.15. The overlay offset is about 2 px at 32 px cells (it was 1.5 px in the first draft), which is still well inside a cell. The AC5 alignment e2e therefore projects the overlay plane (`dz = −0.15` under a hidden top), not the top face, so its 2 px tolerance tests the geometry and not the tile height.

## Implementation notes

_developer: what was built, deviations from the design and why._

developer, 2026-11-02.

**Built** (as the Technical design, files in `src/features/minesweeper/`):

- Pure, three-free: `scene3d/geometry.ts` (CSS overlay transform, margins over the sway range, stage layout, camera world matrix and frustum, DPR cap), `scene3d/timeline.ts` (plan, retarget, poses, easing), `scene3d/quality.ts`, `scene3d/palette.ts`, `scene3d/sceneLayout.ts`, `scene3d/types.ts`, `logic/view3d.ts` (reducer, `VIEW3D_TEXT` copy, `view3dAnnouncement`); `logic/boardView.ts` also checks `WebGL2RenderingContext`.
- Lazy chunk: `scene3d/createBoardScene.ts` (controller, frame loop, dev-only probe under the literal e2e guard), `meshes.ts`, `environment.ts`, `effects.ts` (seam for 010, no effect registered), `probe.ts`.
- `useBoard3d.ts` (state machine, `import()` with `SCENE_LOAD_TIMEOUT_MS`, controller lifetime, media queries), `Board.tsx` (stage wrapper in both views, canvas host, reveal origin, layout effects), `ViewToggle.tsx` (requested view, `aria-busy`, static `Loading 3D…`, focus to "2D" when "3D" becomes unavailable), `Minesweeper.tsx` (notice with `MessageIcon`, announcements through the existing live region).
- CSS: 008 relief and transform block removed; stage, canvas host, transparent overlay with focus halo, hover/pressed tints, forced colours (canvas hidden), 3D phone cell size. Tokens: 008 relief/geometry tokens removed, `--board3d-fit`, `--board3d-rim` and the `--scene-*` tokens of UX §3.2 added.
- Unit tests: `geometry.test.ts` (camera = CSS projection to 1e-6 px for 6 board shapes incl. off-plane points, margins, tilt/sway limits, far row, DPR), `timeline.test.ts`, `quality.test.ts`, `view3d.test.ts`, `boardView.test.ts` (4 cases), `tokens.test.ts` (fit, scene tokens in both schemes, look numbers in range, revealed top = revealed fill, new contrast pairs, no colour literals in `scene3d/`).
- `scripts/measure-fps.mjs`: headed Chromium on the real GPU, own dev server (mode e2e, port 5175), scenarios A (16 × 30) and B (30 × 30 + 20 inputs), prints a Markdown table, exit 1 if a floor is missed. `--headless` is a dry run only (software WebGL; checked here: it runs end to end).
- Scene chunk: **137.2 kB gzip** (check-dist, KiB; Vite reports 142.3 kB), 562 kB minified; entry chunk without three.

**Deviations** (smallest change that met the ACs; please review at gate 2):

1. **Key light elevation 47° instead of 61°** (UX §3.1/§14.5, design "binding"). Measured at 61°: the shadow of a raised tile falls almost entirely into the 2 px gap and onto the 0.09 bevels; the revealed floor next to it was only 3–7 % darker (AC1: 10 %). At 47° (same azimuth) it is 15–16 % darker at `[0, +0.42, 0]` and `[−0.44, 0, 0]` (light; dark much more), covering the outer ≈ 0.11 cell, still clear of the digit halos. The key intensity is normalised (`× 0.875 / L_z`, `UX_TOP_COSINE`), so the UX calibration of up-facing surfaces is unchanged; no token changed.
2. **Own reflection environment instead of `RoomEnvironment`** (`scene3d/environment.ts`: dim room in `--scene-table`, a window in `--scene-key` towards the far left, a soft overhead panel in `--scene-fill-sky`, rebuilt per scheme). With `RoomEnvironment` at 0.3 its diffuse light clipped the hidden tops to white and left the front faces only ≈ 16 % (linear) darker; now front face `179` vs top `255` (light). Also avoids a second addon in `optimizeDeps`.
3. **Phone cell formula**: `--board3d-fit` applies to the whole grid width incl. gaps: `((100vw − chrome − 2·rim) / fit − (cols − 1)·gap) / cols`. The design's version overflowed by `gaps·(fit − 1)`, measured as a 1 px sideways scrollbar for 9 × 9 at 320 and 375 px.
4. **`--board3d-fit: 1.056`** (not 1.055): margins are rounded outwards to 1/64 px (layout unit), exact value 1.0551.
5. **Far-row width test** measures through the cell's centre line: the far edge itself of a 5 × 30 board at the 26 px floor and full sway is 23.98 px.
6. **Types**: reveal `CellAnim` has `flip` (false at quality level 2) and `lift` (wave decay, × 1.5 on the clicked cell); the probe has read-only `level` and `renderer` for the fps script. `pause()` starts the sway at phase 0 (so `advance(SWAY_PERIOD_MS / 4)` is +2°, three quarters −2°); `holdSway(false)` restarts it at phase 0. Mines have 8 spikes (4 level, 4 at 45°).
7. **Announcements** are derived while rendering (React's "adjust state when a value changes" pattern, pure `view3dAnnouncement`) instead of an effect with a ref, and the controller lives in `useState` instead of a ref: react-hooks v7 lint (`set-state-in-effect`, `refs`) rejects both of the design's forms.
8. **The scene measures in `update()`**, not in `attach()`: on a new board `attach` runs before `update` and would measure with the previous game's columns. Both run in the same layout-effect pass, so the first painted 3D frame is still complete.
9. **CSS details forced by the token test / CSS grammar**: the tint radius is a module property `--radius-tile-3d: calc(var(--cell) * 0.09)` (border-radius must be `var(--radius-*)`); the overlay uses `transition-duration: 0s` (not `transition: none`); the focus halo is set through `--overlay-halo` so hover/pressed rules keep it; `@media (not (forced-colors: active)) and (hover: hover)` (`not (a) and (b)` is invalid; lightningcss failed the build).
10. Slash and its halo are drawn last without depth test (the leaning flag's cloth would otherwise cover parts of it); the exploded mine has no halo (the disc carries its contrast). A context lost while 2D is shown is silent (no notice).

**Checked by hand** (SwiftShader, light and dark, screenshots): lit scene, wave and plant mid-frames, lost board, focus halo, 320/375/800 px (no sideways scroll for 9 × 9; 30 × 30 scrolls), alignment `project(i, [0, 0, −0.15])` vs DOM cell centre within 0.1 px on hidden cells, context loss → 2D + notice + 3D again, no WebGL2 context → disabled + notice + focus on "2D", aborted load → notice, forced colours → canvas hidden, 2D look. 3D ready on SwiftShader ≈ 3 s for the first load (incl. chunk), < 1 s later.

**For the tester / e2e** (no edits to `e2e/` by me; `npm run test:e2e`: 71 passed, 10 failed, all in earlier specs):

- The grid's parent is now the stage (`display: contents` in 2D): `scroller` helpers and `gridEl.parentElement` must become `closest('[data-view]')`. Affected: `minesweeper-3d.spec.ts` (AC3 ×2, AC5 ×2) and **`redesign.spec.ts` AC5 (007, 2D; not in the design's list)**.
- 3D now loads asynchronously: `minesweeper-3d.spec.ts` AC1 reads the transform right after checking "3D" (`none` while loading); use the `choose3d` ready wait.
- **A swaying cell is never "stable" for Playwright**: `click()`/`scrollIntoViewIfNeeded()` time out unless the probe is paused (or reduced motion). That is why the `chromium-3d` re-runs (AC6 ×2, AC9, AC10) time out; their `beforeEach` needs `choose3d` with `pause()`. Specs that need the live sway should click by coordinates.
- `getByText` for the notice texts finds two elements (visible notice + live region with the same string, by design).

**Fixed after test: D1** (dark hidden tile too bright, flag cloth 2.58–2.93:1). The reflection environment and the dark clear-coat lifted the dark tile top to about rgb(90–99, 85–92, 81–86) against the token #343a45. Dark look tokens changed: `--scene-env-intensity` 0.45 → 0.06 and `--scene-gloss` 0.8 → 0.5 (light unchanged). The rendered dark top is now rgb(68–74, 66–71, 67–70) over a full sway period; env 0 measured 65–71, so the environment now adds ≈ 4 %, inside the UX §3.1 limit of 8 %. The rest is the key light's clear-coat highlight. Cloth #f28b82 against it is 3.85–4.2:1. The front face (rgb 27, 30, 36) and the shadow (20 vs 33) stay far below the AC1 limits. `minesweeper-3d-scene` passes 20/20, `npm run verify` is green, `npm run test:e2e` passes 95/95.

**Fixed in round 1** (review round 1):

- **Major (forced colours):** the overlay transform is written by `writeOverlay()` together with the margins in `measure()` (every attach/update/resize), by `setMotion` and by each frame. A new board or 2D → 3D in forced colours keeps the static tilt; checked on 30 × 30: `matrix3d`, cell (1,1) inside the scroller after the first choice, after "Start" and after 2D → 3D. It also removes a possible flat first frame of a re-attached board before the first rAF.
- **Minor (a):** everything after `new WebGLRenderer()` runs in `buildController`; if it throws, the renderer is disposed and its context released before the error goes to the hook.
- **Minor (b):** per frame only meshes with instances are uploaded, and only their used range (`addUpdateRange(0, count · 16)` / `count · 3`). The mesh list is collected once, not traversed per frame.
- **Minor (c), design change:** the governor no longer uses a fixed 12 ms step-up threshold (unreachable at 60 Hz). A frame window counts as "on time" when its median is within 1.15 × the display's own interval, which is estimated as the shortest frame in the window. Two seconds on time steps up one level. The step-up wait doubles (up to 32 s) after a step down that follows a step up, so the level cannot oscillate. Step down is unchanged (median > 20 ms). `quality.ts` is now an allocation-free governor (ring buffer, preallocated sort array); its 3 unit tests cover 60 Hz recovery and the back-off.
- **Nits:**
  - no per-frame allocations from `rt` (basis hoisted), the `anims` filter (skipped or cleared), the quality window or the `running` map (reused);
  - `tokens.test.ts` ties `--radius-tile-3d`'s factor to `TILE_RADIUS`;
  - the mine colour attribute is rewritten in place on a scheme switch;
  - `window` in `environment.ts` is renamed to `pane`.
- **Far edge ≥ 24 px (supersedes deviation 5):**
  - `--board3d-cell-min` is now 26.25 px (was 26 px). At 26 px, the far edge of a 5 × 30 board at full sway was 23.98 px; at 26.25 px every board shape stays at 24.2 px or more.
  - The far-row unit test now measures the far edge itself, reads the floor from `tokens.css` and samples 41 sway angles.
  - At 320 px, 9 × 9 still needs no sideways scroll (its cells are 26.6 px, above the floor). 30 × 30 at 375 px scrolls inside its box, with the far-left cell box 26.2 px wide.

**Follow-ups / open points**: the digit halo shows as a faint light outline on the warm-lit floor in light (UX §4.1 K_top knob, left as designed for gate 2); the AC3 numbers need the headed run on hak's Mac (`npm run measure:fps`).

## Test report

_tester: AC → test mapping, results, defects found._

tester, 2026-11-02. `npm run verify` green (232 unit tests, build, dist check, scene chunk 137.2 kB gzip). `npm run test:e2e`: 94 tests, 93 pass, 1 fails on purpose (defect D1 below). Everything below ran on SwiftShader through the dev-only `__board3dProbe` (paused clock, `advance`, `pixels`, `project`); AC3 ran headed on the real GPU.

| AC  | Test file and name                                                                                                                                                                                                                                                                                                                                                                                                             | Result                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 | `e2e/minesweeper-3d-scene.spec.ts`: "AC1: the scene is lit with thick raised tiles, sunk revealed tiles, 3D flags and soft shadows, and digits keep their contrast at every sway" (light, dark): front face >= 15 % darker, shadow >= 10 % darker, cloth pixels rise above the tile plane, digit >= 4.5:1 at sway +2 and -2 degrees, sway reaches +-2 and tilt <= 35 degrees                                                   | PASS                                                                                                                                                                               |
| AC1 | same file: "AC1: mines are 3D objects that keep their contrast on the lost board" (light, dark): mine >= 3:1 against the floor at both sway extremes, mine pixels above the tile plane                                                                                                                                                                                                                                         | PASS                                                                                                                                                                               |
| AC1 | same file: "AC1: the flag cloth keeps 3:1 against the rendered hidden tile it stands on, at every sway" (light, dark)                                                                                                                                                                                                                                                                                                          | light PASS, **dark FAIL (D1)**: 2.58 to 2.93, needs 3                                                                                                                              |
| AC1 | same file: "AC1: the camera tilts at most 35 degrees and sways by at most 3 degrees with a period of at least 10 s; two frames 3 s apart differ" (tilt at 57 times over two periods, sway amplitude, zero crossings >= 10 s apart, 1600 canvas pixels differ after 3 s)                                                                                                                                                        | PASS                                                                                                                                                                               |
| AC1 | same file: "AC1: a fitting 3D board has no scrollbars and no spill-over" and "AC1: at 320 px the far row is at least 24 px wide (also across the sway), the last cell of 30 x 30 is reachable, a 9 x 9 board needs no sideways scroll" (moved from 008)                                                                                                                                                                        | PASS                                                                                                                                                                               |
| AC2 | same file: "AC2: a reveal flips within 150 to 400 ms, the name is immediate; a flag is planted within 300 ms and removed within 300 ms" (name and counter before any `advance`; +140 ms differs, +400 ms equals final; plant +40 differs, +300 equals; unplant +90 differs, +300 equals)                                                                                                                                       | PASS                                                                                                                                                                               |
| AC2 | same file: "AC2: a cascade is a wave from the clicked cell, finished within 1.2 s on 30 x 30, and input during it takes effect at once" (+60 ms: origin changed, far cell not; flag by right-click and reveal by keyboard at +60 ms update names and counter at once; frame +1200 ms equals +3000 ms)                                                                                                                          | PASS                                                                                                                                                                               |
| AC3 | `scripts/measure-fps.mjs` (`npm run measure:fps`, headed, real GPU, MacBook Pro M2 Max, DPR 1.99), two runs                                                                                                                                                                                                                                                                                                                    | PASS: 16 x 30 median 59.2 and 60.2 fps (min 56.3, 56.5); 30 x 30 median 59.1 and 59.3 fps (min 53.8); input latency median 34.2 and 24.8 ms, max 57.6 and 56.8 ms; quality level 0 |
| AC4 | same spec file: "AC4: the switch is immediate, nothing sways, changes show as a static picture, a lost board is static" (reduced motion: second switch has a canvas, tilt matrix and no `getAnimations()`; frame right after a cascade and a flag equals frame +3000 ms; sway 0 after `advance`; lost board frame static, names as 005/AC9)                                                                                    | PASS                                                                                                                                                                               |
| AC5 | same file: "AC5: the overlay lies on the drawn tiles on 30 x 30, scrolled, at both sway extremes, and a click at a projected point reveals exactly that cell" (3 cells x 2 extremes within 2 px; 3 real clicks each reveal exactly one cell)                                                                                                                                                                                   | PASS                                                                                                                                                                               |
| AC5 | same file: "AC5: after a round trip through 3D the 2D board is pixel-identical and has no leftovers" (moved from 008/AC3)                                                                                                                                                                                                                                                                                                      | PASS                                                                                                                                                                               |
| AC5 | `e2e/minesweeper-3d.spec.ts`: "AC1" x2 (View control), "AC2" (state across switches), "AC5" (light, dark: names, structure, ring >= 2 px, new: halo sandwich box-shadow with outer and inner halo line), "AC8"; Playwright project `chromium-3d` re-runs `minesweeper.spec.ts` AC6, AC8, AC9, AC10 with the 3D scene ready and the clock paused                                                                                | PASS                                                                                                                                                                               |
| AC6 | same new spec: slow load (loading text, `aria-busy`, 2D stays usable, 3D replaces it, announcement "3D view ready."), aborted load (notice, "2D" checked, snapshot unchanged), 10 s timeout on `page.clock`, no WebGL2 (disabled, text, no `pageerror`), `getContext('webgl2')` null by keyboard (disabled, notice, focus on "2D"), lost context (notice, snapshot, counter and focus kept, 2D plays, 3D again without notice) | PASS (6 tests)                                                                                                                                                                     |
| UX  | `src/app/tokens.test.ts` contrast pairs of UX §14.14 (not re-written; developer's)                                                                                                                                                                                                                                                                                                                                             | PASS; re-checked with a script (below)                                                                                                                                             |

**Tests added and changed.** Added 20 e2e tests in `e2e/minesweeper-3d-scene.spec.ts` (AC1 x 9 incl. light/dark pairs, AC2 x 2, AC4 x 1, AC5 x 2, AC6 x 6). Removed 6 superseded 008 tests from `e2e/minesweeper-3d.spec.ts` (AC3 look, AC3 fit, AC3 phone, AC6 x 2, AC7: replaced or moved as listed in "008 tests and tokens replaced"). Fixed the 10 known failures: `scroller` helper via `ancestor::*[@data-view]` (3D spec), `closest('[data-view]')` (`redesign.spec.ts` AC5), `choose3d` (ready wait on `aria-busy`, then `probe.pause()`) in the 008 specs that choose 3D, and the same three steps in the `beforeEach` of the `chromium-3d` project (`minesweeper.spec.ts`); assertions untouched. One assertion added to the kept 008 AC5 test (focus halo sandwich). No unit test added.

**Every new assertion shown failing once** (temporary edit of production code, restored; `src/` compared with a backup afterwards, identical): lit/depth (REVEALED_TOP = HIDDEN_TOP, shadow intensity 0), cloth colour = tile colour, digits in the floor colour, flat flag (pole 0.02), mine colour = floor, mine sunk, no sway, tilt 40, sway 4 degrees, period 8 s, phone cell floor 18 px, extra inline margin (+40 at 320 px, +700 on desktop), flip 100 and 600 ms, plant 20 and 500 ms, unplant 10 and 600 ms, no wave delay, wave 2.5 s, reduced motion ignored (live path), overlay tilt +3 degrees, 2D keeps the transform, load timeout 20 s, no `aria-busy`, wrong "ready" text, no focus move to "2D", lost not handled, WebGL2 not checked, no notice when unavailable, aborted load keeps "3D" requested, focus halo removed, input ignored 30 s after a reveal; `tokens.test.ts` with five token edits (mine lit/shade, revealed top != cell fill, focus halo, tile top). Equivalent mutant: reduced-motion initial value (overwritten by `setMotion` on mount). A +700 px top margin does not fail the desktop "no scrollbars" test (the scroller grows vertically); the horizontal mutants do.

**Contrast re-check with a tool** (script computing WCAG luminance from `tokens.css`, both schemes): every pair of UX §14.14 passes; values match the UX table (flag cloth on tile top 5.65 / 4.78 tight, `--n3` on revealed top 4.76 light (UX §4.1 says "at least 4.8", the rule is 4.5, so no defect), mine lit/shade 5.14 / 13.59 and 15.80 / 7.22, focus on halo 6.70 / 11.08, `--scene-revealed-top` equals `--cell-revealed-fill`). Note D1: the token pair is fine, the rendered pixels are not.

**AC3 table** (`npm run measure:fps`, headed, `ANGLE (Apple, ANGLE Metal Renderer: Apple M2 Max)`, DPR 1.99, run twice): 16 x 30 fps median / min 59.2 / 56.3 and 60.2 / 56.5 (floor 50); 30 x 30 fps median / min 59.1 / 53.8 and 59.3 / 53.8 (floor 30); input latency median / max 34.2 / 57.6 ms and 24.8 / 56.8 ms (floor 100 ms); quality level 0 / 0. The scene loop is capped at 60 fps, so 60 is the ceiling. Development React build, so conservative.

**Gate-2 package**: `/Users/haraldkuegel/swfactory/screenshots/009/` (gitignored), headed Chromium on the Apple GPU, DPR 2, light and dark: `01-hero`, `02-running` (digits 1 to 4, 6 to 8, two flags, focus ring on a hidden tile), `03-cascade-120/350/700/settled` (16 x 16), `04-plant-80/160/settled`, `04-unplant-90`, `05-2d` and `05-3d`, `06-lost`, `07-won`, `08-focus-hidden`, `08-focus-number`, `08-focus-last-30x30`, `09-375-9x9`, `09-375-16x30-last`, `10-320-9x9`, `11-30x30-800`, `11-30x30-375-last`, `12-loading`, `12-failed`, `12-lost`, `12-unavailable` (375 px); light only: `13-reduced-motion-light`, `14-forced-colours`, `15-level-mid-wave-light`. Recording: `gate2-recording.webm` (1280 x 800, 29.9 s, headed real GPU, orange dot marks the pointer, follows UX §16: 2D to 3D instant switch, sway, big cascade, three flags plus one removal, keyboard, 2D and back, dark scheme switch, 16 x 30 cascade, lost board), contact sheet `gate2-recording-contact-sheet.png`. I looked at the stills 01, 02, 03 (350 ms), 06 (dark), 08 (last cell, dark), 12 (failed, 375 px) and at the recording's contact sheets; the rest were produced by the same script and only checked for completeness.

**What the stills and the clip show** (nothing broken; observations for hak at gate 2): the scene is clearly 3D, the wave is readable (tiles roll and sink from the click outward), flags lean and stand above their tile, digits are crisp with no visible halo patch in the stills I opened, focus ring is complete on the corner cell of a 30 x 30 board, notices and loading text are clean at 375 px, the dark scheme re-lights at once. Taste points: in light the hidden tiles read as near-white cream (gloss and bevel are subtle at 800 px); in dark the hidden tiles render mid grey-brown, much lighter than the `#343a45` token (cause of D1); in the lost dark board the mines are small white spiked balls on a near-black floor (fine). Not reachable: `15-level-mid-wave` stayed at quality level 0 under 20x CPU throttling (the governor reads rAF deltas and the throttle did not slow them enough), so quality level 2 was not seen; no test hook exists to force it (evidence item only).

**Deviations seen, not defects**: key light elevation 47 degrees instead of the UX's 61 degrees (developer's note 1; needed to reach the 10 % shadow of AC1, my pixel check measures about 15 %); own reflection environment instead of `RoomEnvironment`. Both are documented in the Implementation notes.

**Probes beyond the ACs, checked, OK**: double and rapid input during a wave and a plant (names at once, scene clock independent); reload and sign-out while 3D loads (AC8 test, no error); keyboard-only selection of "3D" and failure focus; forced colours (canvas hidden, 2D cells, screenshot 14); reduced motion screenshot 13; drag-scroll and touch long-press in 3D are covered by the `chromium-3d` re-runs (long-press test passes with the scene ready); hostile or long text is not applicable (no new text input). Overlay-to-scene alignment is also consistent with `project()` after Playwright's click-scrolling when read in the same task (reading the DOM box and the projection in two round trips gave a 4.5 px false failure while the page was still scrolling: read both in one `evaluate`).

**Defects**

- **D1 (medium, AC1): in the dark scheme the flag cloth has less than 3:1 against the rendered hidden tile.** The 007/AC3 rule (flag glyphs 3:1) is part of AC1. The token pair is 4.78, but the glossy dark tile (`--scene-gloss` 0.8, `--scene-env-intensity` 0.45) renders far brighter than its token: tile top pixel about `104,96,89` at the far left and `94,88,84` elsewhere (token `#343a45` is `52,58,69`, luminance about 0.04 against 0.10 to 0.12 rendered), so the cloth `#f28b82` reaches only 2.58 to 2.93. UX §3.1 required the environment not to brighten hidden tops by more than 8 %. Pole (`--color-text`) and base keep their contrast, so the flag stays recognisable; light scheme passes (tile top within 5 % of the token). Repro: `npx playwright test minesweeper-3d-scene -g "the flag cloth keeps 3:1.*dark" --project=chromium` (test at `e2e/minesweeper-3d-scene.spec.ts`, "AC1: the flag cloth keeps 3:1 against the rendered hidden tile it stands on, at every sway (dark)"); or: dark scheme, 9 x 9 with a mine layout, 3D, flag a cell, probe `pixels` at `project(i, [-0.3, 0.3, 0])` and on the red cloth pixels. Fix direction: lower the dark env intensity or gloss, or add a halo darker than the cloth (a fix in the scene, not in the test).

**Verdict: FAIL** (one defect, D1; all other ACs pass, AC3 measured on the reference machine). Status stays `in-test`.

**Round 1 regression (tester, 2026-11-02): PASS.** D1 fixed by the developer (dark `--scene-env-intensity` 0.45 to 0.06, `--scene-gloss` 0.8 to 0.5 in `src/app/tokens.css`). `npm run verify` green (232 unit tests, build, dist check, scene chunk 137.2 kB gzip). `npm run test:e2e`: 95 of 95 pass, including "AC1: the flag cloth keeps 3:1 against the rendered hidden tile it stands on, at every sway (dark)" (D1 repro, now green). No test changed in this round; `src/` not touched by me. All dark stills of `screenshots/009/` (names 01 to 12, `-dark`) were re-taken headed on the real GPU and overwrite the old ones, and `gate2-recording.webm` (29.96 s) was re-recorded because it shows the dark scheme (20 to 23 s and the 16 x 30 and lost boards). I looked at `02-running-dark` and the recording's contact sheet: dark hidden tiles are now dark slate, the salmon flag cloth stands out clearly from its tile, digits and focus ring unchanged. AC3 fps was not re-measured (the change is two look numbers in the dark palette, no scene geometry or loop change). Status set to `in-review`.

**Round 2 (tester, after review round 1): PASS.** Test changes in `e2e/minesweeper-3d-scene.spec.ts`: (1) new regression test "AC5: in forced colours every 3D board keeps its static tilt and its first row stays reachable" (forced colours, 30 x 30: 3D chosen over a running board, "Start" again, 2D and back; each time the overlay has a `matrix3d` transform and cell (1,1) lies inside the scroller). It failed on the code of round 1 (first run: "first board: static tilt", received `none`) and, after the developer's fix landed, fails again when the `writeOverlay` call in `measure()` is removed ("after Start: static tilt"); passes with the fix. (2) The camera test now takes 3 samples instead of 57 (peak, 5 s still on the same side so the period is above 10 s, opposite peak) plus the 3 s frame pair; mutants no sway, tilt 40, period 8 s and sway 4 degrees all still fail it; its 90 s timeout is gone. The comment in the first look test no longer claims a 3:1 check (the contrast lives in the cloth test). (3) The "without WebGL2" test again listens for console errors and presses ArrowRight on "2D" (disabled "3D" is skipped, focus and selection stay); the `unavailable` mutant fails it at the disabled check. After the developer's changes: `npm run verify` green (234 unit tests, scene chunk 137.3 kB gzip) and `npm run test:e2e` 96 of 96 pass (twice in a row after the last `src/` edit at 23:32; one intermediate run overlapped the developer's edits and is not counted). AC3 re-measured after the review fixes (`npm run measure:fps`, headed, M2 Max): 16 x 30 median 59.5 fps (min 56.5), 30 x 30 median 60.2 fps (min 54.4), input latency median 36.8 ms and max 56.0 ms, quality level 0: unchanged. The stills were not re-taken (no visual change intended).

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

### Round 1 (reviewer, 2026-11-02): CHANGES_REQUESTED

I ran `npm run verify` myself: green (232 unit tests, build, check-dist "scene chunk 137.2 kB gzip"). `minesweeper-3d-scene.spec.ts` and `minesweeper-3d.spec.ts`: 26/26 pass. I also ran scratch probes outside the repo:

- **Production builds** (`--mode e2e` and with `VITE_GOOGLE_CLIENT_ID=dummy`): the entry chunk has no three, there is no modulepreload of the scene chunk, and `__board3dProbe`, `holdSway`, `createProbe` and `WEBGL_debug_renderer_info` are absent (the probe internals are tree-shaken).
- **check-dist**: fails as it should on three injected into the entry, a missing scene chunk and a chunk over budget.
- **Lifecycle**: 25 new games plus 5 round trips through 2D leave one canvas. Three context losses each followed by choosing 3D again leave one canvas and show no stray notice.

Load, timeout and abort, and the reducer are correct:

- the attempt id, plus cancel in the effect cleanup, drops late results;
- a failed import is not cached;
- `dispose()` is idempotent and removes the context-lost listener first;
- the second dispose on the lost path is harmless.

The overlay and the camera come from one geometry module (unit-tested to 1e-6 px, e2e within 2 px). Animations never gate state or input. The shadow map is not updated on sway. The DPR cap and budget are in place. The probe is guarded literally at both use sites.

**Major**

- [major] `src/features/minesweeper/scene3d/createBoardScene.ts:541-557, 579-609` (with `requestRender` at 449-454 and `measure` at 197-210): **in forced colours, every board attached after the first loses its tilt but keeps the negative margins, so the top row is clipped and can't be scrolled to.**
  - Cause: the overlay transform is only written by `renderFrame` (never runs while `active === false`) and by `setMotion` (runs only when the media query changes). `measure()` writes the margins regardless. So after "Start" (Board remounts with `key = game.id`, detach, then attach) or after 2D, then 3D, the grid is flat with `margin-top ≈ −0.064 H`.
  - Probe (scratch Playwright, `forcedColors: 'active'`):
    - 9 × 9 at 800 px: `transform ""`, margins `-19.375px 8.375px -7.625px`;
    - 30 × 30: cell (1,1) spans y 611–643 while the scroller's top is 651, so the whole first row is above the scroll box and unreachable (negative overflow). The first choice of 3D is fine only because `setMotion({ active: false })` runs after that first attach.
  - Breaks UX §12 ("the grid keeps its inline tilt at phase 0") and the forced-colours a11y parity, and on 16 × 16 and larger it hides cells.
  - Fix: write the static transform whenever the layout is known and the scene is inactive. For example, at the end of `measure()` (or in `requestRender` when `!active`): `if (!active) grid.style.transform = overlayTransform(next.gridHeight, 0)`.
  - Keep one e2e regression test, since this probe found a defect: in forced colours, choose 3D, press "Start" again, then assert the overlay transform is a `matrix3d` and cell (1,1) lies inside the scroller. This can sit in the existing forced-colours check or in an AC5 test.

**Minor**

- [minor] `src/features/minesweeper/scene3d/createBoardScene.ts:108-470`: if anything after `new WebGLRenderer()` throws (mesh build, PMREM, `compile`), the hook maps it to `loadFailed`, but the renderer and its WebGL context are never disposed. Each retry leaks a context; Chromium keeps about 16 and then evicts the oldest. Wrap the rest of construction in `try { … } catch (e) { renderer.dispose(); renderer.forceContextLoss(); throw e; }`.
- [minor] `src/features/minesweeper/scene3d/createBoardScene.ts:392-397`: on every animated frame, all 20 instanced meshes get `instanceMatrix.needsUpdate` (and colour) at full capacity (900 × 64 B each), including meshes with `count` 0. That is about 1.2 MB of buffer upload per frame during waves. It is fine on the M2 (AC3 met), but it is the first cost a phone pays. Flag only meshes whose count is above 0 or changed, or use `addUpdateRange(0, count * 16)`.
- [minor] `src/features/minesweeper/scene3d/quality.ts:15` (`FAST_FRAME_MS = 12`): the governor measures rAF deltas, which never drop below 16.7 ms on a 60 Hz display. So once it has stepped down (for example, a slow first cascade), it never steps back up for the life of the controller, which outlives games. This follows the Technical design, so it is input for the architect: compare against the display's own frame interval (for example, the 30-frame minimum delta × 1.2) or measure render time instead of rAF deltas.

**Nits**

- [nit] `src/features/minesweeper/scene3d/geometry.ts:151-152`, `createBoardScene.ts:321, 419`, `quality.ts:28, 40`: per-frame allocations in the sway loop:
  - `rt` builds a `[ex, ey, ez]` array on each of its 12 calls per frame;
  - `anims.filter` runs every frame, even when `anims` is empty;
  - `nextQuality` does slice, spread and sort on every rAF callback (120 times a second on 120 Hz);
  - `writeInstances` creates a new `Map` per animated frame.

  Small, but this is the only continuous loop. Hoist `[ex, ey, ez]`, skip the filter when it's empty, and keep a ring buffer for the samples.

- [nit] `src/features/minesweeper/Board.module.css:198` `--radius-tile-3d: calc(var(--cell) * 0.09)`: duplicates `TILE_RADIUS` in `sceneLayout.ts` with no test tying them together. The two drift silently (the same class of issue as 008's calc constants). Add an assertion to `tokens.test.ts` or a comment that names the source.
- [nit] `src/features/minesweeper/scene3d/meshes.ts:169`: `bakeMineColours` replaces the `color` attribute on every scheme switch without disposing the old one, so its GPU buffer stays until the controller is disposed. Update the existing attribute's array and set `needsUpdate`.
- [nit] `src/features/minesweeper/scene3d/environment.ts:38`: `const window` shadows the global. Rename it (for example, `pane`).
- [nit] Test proportionality, `e2e/minesweeper-3d-scene.spec.ts`: "tilt ≤ 35° and sway ≤ 3°" is asserted three times:
  - `geometry.test.ts` (constants and the combined tilt);
  - the camera e2e (57 samples over two periods on SwiftShader, 90 s timeout);
  - again at the sway extremes inside both look tests.

  The camera e2e could sample about 5 points (two extremes, two zero crossings, the 3 s frame pair). In the first look test, the comment "≥ 3:1 against the tile top" asserts only red-pixel count and rise; the contrast lives in the separate cloth test, which found D1 and stays. Align the comment.

- [nit] `e2e/minesweeper-3d-scene.spec.ts:779` (replacement of 008/AC7, which 009/AC6 _extends_): the console-error listener and the "ArrowRight on 2D skips the disabled 3D" check were dropped. They're cheap; keep them so the replacement covers everything the old test did. No assertion of a kept 008 test was weakened: those changes are the `choose3d` wait, the scroller selector and one added halo assertion.
- [nit] Traceability: the Technical design (Scene: "elevation 61°, a binding UX constraint", `RoomEnvironment` + PMREM) and UX §3.1/§14.5 still describe what was replaced by Implementation notes deviations 1–3. A `/rebuild` developer would follow the Technical design and hit the same 3–7 % shadow failure. The architect should fold deviations 1–3 into the Technical design after gate 2. Also, `docs/backlog/README.md` still lists 009 as `designed`.

**Checked, OK:**

- Reduced motion: empty timeline, no loop, static transform; the `setMotion` push-down on mount.
- Scheme switch: tokens re-read after the media change, the environment rebuilt and the old one disposed.
- Token discipline: no colour literals in `scene3d/` (tested), `--scene-*` in both schemes, the look numbers kept out of the contrast scans.
- Overlay CSS: all 3D rules inside `not (forced-colors: active)`; specificity checked against the 2D hover, active and pressed rules (the 3D rules win, so no opaque leak).
- Accessibility: focus moves to "2D" when "3D" becomes unavailable while focused; announcements go through the single live region; `aria-busy` only while loading; the notice has no role.
- Security: no `dangerouslySetInnerHTML` or URL sinks. three 0.187 (MIT, ADR 0005), pinned to patch updates by `^0.x`.
- Context-lost listener removed before dispose. No per-frame shadow update on sway.
- The AC5 round-trip pixel diff fails on a size mismatch, so it is not vacuous.

### Round 2 (reviewer, 2026-11-02): APPROVED

What I re-ran:

- `npm run verify`: green (234 unit tests, build, check-dist with the scene chunk at 137.3 kB gzip).
- `minesweeper-3d-scene.spec.ts` and `minesweeper-3d.spec.ts`: 27/27 pass.
- My round-1 forced-colours probes: 9 × 9 and 30 × 30, after "Start" and after switching to 2D and back.

Fixes verified:

- **Major (forced colours): fixed.** `writeOverlay()` now writes the transform together with the margins in `measure()` (every attach, update and resize), in `setMotion` and on every frame.
  - Probe after a new board and after 2D → 3D: transform `perspective(…) rotateY(0deg) rotateX(25deg)`. On 30 × 30, cell (1,1) is at y 678 and the scroller top at 651, so the first row is inside the box (was 611).
  - The new e2e test "AC5: in forced colours every 3D board keeps its static tilt and its first row stays reachable" covers the three paths (`e2e/minesweeper-3d-scene.spec.ts:705`).
  - The lifecycle probe still leaves one canvas after 25 games and 3 context losses, with no stray notice.
- **Minor (a): fixed.** `createBoardScene.ts:108-115` puts everything after the renderer into `buildController`. If that throws, the renderer is disposed and its context released, and the error is rethrown unchanged, so the hook's `loadFailed`/`unavailable` mapping is unchanged.
- **Minor (b): fixed.** `createBoardScene.ts:425-438` skips meshes with count 0 and uploads only the used range (`addUpdateRange(0, count · 16 / 3)`), from a list collected once.
- **Minor (c): fixed (design change, recorded).**
  - `quality.ts`: a frame counts as "on time" when the median is within 1.15 × the shortest frame in the window, which works at 60 and 120 Hz.
  - The step-down check (> 20 ms) runs first, so a uniformly slow display can't count as "on time".
  - The wait before stepping up doubles after it oscillates, capped at 32 s.
  - The governor no longer allocates per frame (ring buffer, `Float64Array.sort` is numeric).
  - Unit tests cover the 60 Hz step-up, late frames resetting the clock, and the back-off.
- **Nits:** all fixed or addressed.
  - The `[ex, ey, ez]` basis is hoisted, the `anims` filter is skipped when empty, and the map is reused.
  - `tokens.test.ts:266` ties `--radius-tile-3d` to `TILE_RADIUS`.
  - The mine colours are rewritten in place.
  - `pane` replaces `window`.
  - The camera e2e takes fewer samples, and the look-test comment is corrected.
  - The console-error listener and the ArrowRight check are back in the AC6 unavailable test.
  - The Technical design (Files, Lights, alignment table, 47°) and ADR 0005 (own environment) now record the deviations.
  - The backlog README shows `in-review`.
- **Extra change:** `--board3d-cell-min` is now 26.25 px, and `geometry.test.ts` measures the far edge, reading the floor from `tokens.css`. This closes the 23.98 px far edge that deviation 5 had worked around in the test. No AC was weakened.

Remaining nit (not blocking):

- [nit] UX §3.3 still says "`RoomEnvironment` reflection". The Technical design and ADR 0005 now carry the decision, and the UX section is the ux-designer's to touch. If hak wants the UX text in step, it is a one-line update after gate 2.

## Retrospective

_orchestrator, 2026-11-02._

Went well: gate 1 with an early feasibility check and a split (010); a real spike
(bundle size, headless WebGL, fps on hak's Mac) before the design; the reconciliation
step caught 15 UX/design points before the build; fps ≈ 60 on hak's Mac; three never
reaches the entry chunk. A usage limit interrupted the design step once; resuming the
agent worked.

### What went wrong

| #   | Problem                                                                                                                     | Root cause                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| P1  | Defect D1: in dark the flag had < 3:1 against the rendered tile although the token pair passed (4.78).                      | Contrast was checked on tokens; lighting and gloss changed the rendered colour.                                 |
| P2  | Review major: in forced colours every board after the first lost its tilt but kept its margins (top row unreachable).       | An inline style was written only by the render loop, which doesn't run in that mode or on re-attach.            |
| P3  | Ten earlier specs failed: a new wrapper broke `parentElement` helpers, and swaying cells are never "stable" for Playwright. | The design didn't list the affected specs; no rule for e2e on continuously moving views.                        |
| P4  | The developer had to deviate from "binding" UX light numbers (61°, `RoomEnvironment`); docs drifted until review.           | Look numbers were computed by formula, not calibrated by sampling; the AC thresholds are the real binding part. |
| P5  | The architect had to install a dependency for the spike, outside its read-only Bash rule.                                   | The role file doesn't cover spikes.                                                                             |

### Proposed changes

1. **`CLAUDE.md`, Styling (P1; tester's suggestion):** for rendered scenes (canvas,
   WebGL) contrast is checked on rendered pixels in e2e; passing token pairs are
   necessary, not sufficient.
2. **`CLAUDE.md`, Conventions (P2; reviewer's suggestion):** inline styles written from
   a render loop are also written when the loop doesn't run (forced colours, reduced
   motion, inactive scene) and on every re-attach.
3. **`CLAUDE.md`, Independent tests (P3; developer's suggestion):** views with
   continuous motion are paused via the dev-only probe (or reduced motion) before any
   `click()`; click by coordinates only when the live motion is under test. Plus
   **`architect`**: when a design wraps existing markup, list every e2e spec (all
   stories) that walks `parentElement` / `locator('..')` from it.
4. **`ux-designer` (P4):** for rendered scenes, the AC thresholds are binding; light
   and material numbers are starting values the developer calibrates by pixel
   sampling, and the architect records the final values.
5. **`architect` (P5):** may install a dependency for a spike when the orchestrator
   asks, and removes it again if the design doesn't adopt it.

### Outcome

hak approved all five proposals at gate 2 ("Ja, inkl. 009-Abschluss", 2026-11-03).
Applied: 1, 2 and 3 in `CLAUDE.md` (Styling, Conventions "Render loops", Independent
tests); the architect part of 3 and proposal 5 in `.claude/agents/architect.md`;
proposal 4 in `.claude/agents/ux-designer.md`.
