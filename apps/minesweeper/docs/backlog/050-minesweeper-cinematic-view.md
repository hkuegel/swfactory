---
id: 050
title: A cinematic 3D view with a realistic look, camera moves and animated effects
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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
- **AC2:** Given the cinematic view, when I look at the board, then it is a realistic diorama of a
  minefield, clearly different from the "3D" view of the same board: hidden cells are grass-covered
  ground, revealed cells are dug-out earth holes, mines are rusty metal bodies, flags are small
  flags stuck in the ground, the scene is lit by low evening light with long soft shadows; numbers,
  flags and mines stay readable in light and dark mode.
- **AC3:** Given the cinematic view and normal motion settings, when I press "Start", then the camera
  flies in to the board in at most 2 s; when I lose, then it moves towards the exploded mine; when I win, then it
  circles the board. During play the camera stands still. Every camera move ends on its own, never makes a cell hard to hit, and a click
  or key during a move acts on the cell that is under the pointer or has the focus.
- **AC4:** Given the cinematic view and normal motion settings, when I reveal, flag or unflag, then
  the change is animated (the ground is dug out in a wave outward from the clicked cell with a puff of dust, a flag is
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

- 2026-11-21 — O2 (orchestrator, after the tester's observation): "circles the board" in AC3 means
  the win orbit sweeps at least 90 degrees of yaw in total, returns to the rest pose and ends within
  the effect's 4 s; the tester's AC3 threshold (more than 10 degrees to each side) becomes a total
  sweep of at least 90 degrees.

- 2026-11-21 — Q: name of the third option, "Cinematic"? — A: yes; gate 1 approved (hak: "Ja, so committen").

- 2026-11-21 — After trying round 2, hak: "gefällt mir nicht, besonders das Gewackele wenn man
  spielt, nervt" and "wacheln nervt, aber auch der Look ist nicht so interessant". Decision: no
  camera follow during play (AC3), camera moves only on Start and at the end; look direction
  chosen by hak from three options: "Diorama-Minenfeld" (AC2, AC4 reworded) (hak).

- 2026-11-21 — hak approved the diorama look of round 3 from the screenshots ("Ja, weiter testen") (hak).

- 2026-11-21 — Gate 2: P51 and P52 approved, commit approved (hak: "Beide, committen").

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

## Technical design

_Lean process (story 048): direction by the orchestrator; the developer records the details in
Implementation notes._

- **View state:** the view becomes `'2d' | '3d' | 'cinematic'`; `ViewToggle` gets a third radio.
  "Cinematic" shares the 3D capability check and the unavailable notice (AC1), and the 2D grid
  stays the accessible source of truth in every view (AC6), as in 008.
- **Scene:** a separate module `scene3d/cinematic/` with its own scene factory, built on the
  existing geometry, layout, input mapping, end plan and probe; the "3D" scene is not changed.
  Reuse over copy: shared pieces are imported, not duplicated.
- **Look (AC2):** `MeshPhysicalMaterial` tiles with bevelled geometry, a generated environment
  map (`RoomEnvironment` + `PMREMGenerator`), soft shadows, a background set (table/room), and
  post-processing from `three/examples/jsm` (`EffectComposer`, `UnrealBloomPass`, optionally
  `BokehPass`). No new package (Decision log).
- **Motion (AC3–AC5):** camera moves, tile/flag animations and end effects are pure functions
  of elapsed time on a timeline (as `timeline.ts`); time comes from the render loop clock, never
  inside reducers. Input picks against the final tile positions, so a click during a move hits
  the right cell. Start cancels every running effect.
- **Reduced motion (AC7):** every animation resolves to its end state at once; no idle motion.
- **Performance (AC8):** quality steps by board size (as `quality.ts`): fewer particles, no
  bokeh and smaller shadow maps on large boards.
- **Probe:** the dev-only probe reports the cinematic state (camera move, animations, effect
  phase) so e2e tests can pause and read it; its strings go into `dist-check.json`.
- **Tests (minimal set):** one e2e per AC in `e2e/minesweeper-cinematic.spec.ts` with pixel/frame
  comparisons for AC2–AC5, the 008/010 patterns for AC1, AC6, AC7; unit tests only for the
  timeline functions with branches. AC8 by the existing fps script on hak's Mac.

## Implementation notes

**What was built.** A third view "Cinematic" next to "2D" and "3D". `BoardView` is `'2d' | '3d' |
'cinematic'`; `ViewToggle` has a third radio; `view3dReducer` takes the view in `choose`, `ready` and
`lost`; `useBoard3d` keeps one controller per view (both live, each disposed on its own context loss
and on unmount) and loads the cinematic chunk on its own. The board's `data-view` is the scene's
`kind`; the CSS rules of "3D" apply to both through `:where(... , ...)`, the cinematic well is
`--scene-slab`. "3D" is unchanged: `createBoardScene(options, hooks, rigFactory?)` gets one optional
seam object (`scene3d/rig.ts`), and without it every line runs as before (all 110 earlier e2e specs
stay green).

**Structure** (`scene3d/cinematic/`, lazy chunk `createCinematicScene`, 12.5 kB gzip on top of the
shared three chunk):

- `cameraPose.ts`: one pose (yaw, tilt, dolly, pan) gives the overlay's CSS transform and the
  three camera, so a hit box lies on its drawn tile during every move; margins hold the board for
  the whole pose envelope (no scrollbars, no clipping while it moves). Unit test: camera against CSS
  projection in random poses, margins against 400 random poses on four board sizes.
- `cameraDirector.ts`: moves as pure functions of scene time (flyIn 1600 ms, follow 900, dive 2400,
  orbit 3400), blending from the current offset when one starts during another; all end at the rest
  pose by themselves and stay inside the envelope (unit test).
- `cinematicRig.ts`: HDR multisampled target, `UnrealBloomPass` (threshold 1.4), neutral tone mapping,
  vignette to the well colour; `RoomEnvironment` through PMREM for reflections; clearcoat on hidden
  tiles, bump-mapped stone for open tiles, metal tray, wood table, rim light, fog; the transition
  hook that starts the moves (fresh game: fly-in; reveal: follow; loss: dive to the mine; win: orbit).
- `set.ts`: procedural wood (planks, grain, knots), back wall gradient, 60 out-of-focus lights.
- `cinematicShow.ts` + `lossPlan.ts`, `fireworksPlan.ts`: on top of story 010's explosion (fire,
  smoke, chain, shards) a shockwave ring plus a travelling tile lift, 28 pieces of debris and a
  flash of light on a loss; fireworks (5 bursts 400 ms apart, rockets, sparks with trails, coloured
  light on the tiles) instead of the confetti on a win (`createEndEffects(..., { celebrate: false })`).

**Deviations from the design.** (1) The scene is not a separate factory but `createBoardScene` plus a
rig (reuse over copy; the loop, input mapping, layout, quality governor, probe and the 010 cell
animations are shared). (2) Reveal wave 600 ms in this view (`PlanOptions.waveTotalMs`, "3D" keeps
1000 ms). (3) No `BokehPass` (cost on 30 x 30; not needed for the look). (4) The cinematic probe is
installed on `attach` and the previous one restored on `detach`, so the "3D" probe survives.
(5) Debris and the fireworks glow are drawn with `Batch` of endEffects.ts (now exported with
`glowTexture`, `withInstanceAlpha`). (6) Mobile cell sizing reuses the "3D" fit token; the cinematic
stage is larger (envelope margins and 100 to 200 px of wall above the board), so below 600 px the
board may scroll sideways (out of scope, phones).

**Probe** (`window.__board3dProbe`, dev and mode e2e only; installed while a cinematic board is
attached): the existing `pause`, `holdSway`, `advance`, `project`, `pixels`, `luminance`, `frames`,
`level`, `renderer`, `fxState`, plus `rigState`: `cameraMove` ('none' | 'flyIn' | 'follow' | 'dive' |
'orbit'), `cameraMoveMs`, `pose` (yaw, tilt, dolly, panX, panY of the last frame), `shockwave`,
`fireworks` { running, bursts, sparks }, `debris`, `bloom`, `flashesLastSecond` (explosion flash and
bursts started in the last second, AC5 limit 3). `rigState` is `null` in the "3D" scene. Pause the
clock right after Start (the fly-in runs on it), `advance(ms)` steps moves and effects; the scene is
fixed to the clock, so `project(index, [0, 0, -0.15])` is the cell centre on the overlay plane and
`document.elementFromPoint` there returns that cell at every time of a move (checked by hand).
`probe.rigState` strings are in `dist-check.json` (`rigState` forbidden; lazy chunk marker
`cinematic-spark`, budget 30 kB gzip).

**Quality steps (AC8).** Governor level 1: DPR 1 (as "3D"); level 2: bloom off. Particle counts
(sparks, debris, bursts) follow `effectScale` by board size and level, with minimums (3 bursts, 24
sparks, 8 pieces). The shadow map halves at level 2 as in "3D". AC8 itself (50 fps on 16 x 30, 30
fps on 30 x 30 on the Mac) is not measured here: `npm run measure:fps -w apps/minesweeper -- --view=cinematic`
now runs the existing script on the cinematic view (headed, on hak's Mac).

**Checked by hand** (screenshots, software GL): light and dark scheme, fly-in, reveal, loss (flash,
ring, debris, smoke), win (fireworks, 3 flashes in the busiest second), hit test during the fly-in.

**Follow-ups.** The tile gloss is subtle in the light scheme (white tiles); the tester's pixel
checks should compare cinematic with "3D" on the same board (AC2). The loss ring is a plain
translucent ring in the light scheme (normal blending).

### Fixed in round 2 (developer, 2026-11-21)

- **D1 (photosensitivity, dark).** The luminance of a dark board changes by more than 10 % at every
  spark, so the count is set by how many bursts a second can hold. Bursts are now 3, first at
  400 ms, one every 1100 ms, spark life 900 ms (`fireworksPlan.ts`), the last spark is gone at
  3500 ms. Bursts sit in the upper part of the picture (`vFrom` 0.62), so their sparks cross the
  150 px window around the board middle less. The additive spark gain is 1.0 (was 1.9), the flash
  glow smaller (1.6 instead of 3.6 cells, alpha 0.2 instead of 0.55). Measured with the tester's
  test: dark whole 3, window 341 x 256 3, window 150 px 3 in the busiest second (was 6); light
  passes. The 150 px count is close to the limit (6 flashes in 3.5 s, max 3 in a second) and depends
  on the seed of the game, so the probe's `flashesLastSecond` stays what it was, bursts started in
  the last second (a plan, not a picture; the tester's rendered-luminance test is the proof).
- **O1.** Cause: on a win the story 010 flag hop wave (starts 1000 ms after the click, runs
  300 ms per flag over 1100 ms) planned a hop for every flag in the visible window; scrolling the
  board into view made the flag of the 30 x 30 test visible. The cinematic view plays no flag hops
  now (`PlanOptions.winHops`, off when a rig is present); the fireworks are its win show. "3D" is
  unchanged.
- **O2.** The orbit is `sin(3 pi p)` with the soft window: 1.5 swings, total yaw travel about 106
  degrees, peak yaw 22 degrees (inside `ENVELOPE.yaw` 24, so the margins hold), home at rest, 3400
  ms. Unit test added in `cameraDirector.test.ts`; AC3 threshold of the e2e spec changed as decided.
- **O3.** `rig.finish()` now also calls `show.rest()`, which resets the probe counters
  (`fireworks.bursts` 0 after Start). **O4.** Cause: the probe's `pause()` reset its manual clock to the
  page clock on every restart, running time backwards, so a move started at the advanced time had a
  negative age. `pause()` now keeps the advanced clock when already paused (a probe-only code path;
  the sway epoch is unchanged). A clamp of `elapsed()` was tried and dropped: it hid the offset the
  tester's helper reads to catch up, and the fly-in then never ended in the tests.
- **Mutation survivor.** The `if (newGame) finishEffects()` line in `update()` is removed:
  `detach()` already finishes the effects and the tester's mutation showed it redundant.

### Round 3 (developer, 2026-11-21): no camera motion during play, a diorama minefield

hak rejected round 2 (the Decision-log entry "Diorama-Minenfeld"; AC2, AC3, AC4 reworded). Only the
cinematic view changed; "2D" and "3D" run the same code as before (their e2e specs stay as they
were).

- **Camera (AC3).** The follow-on-reveal move is removed (`MoveKind` is `flyIn | dive | orbit`,
  `RigState.cameraMove` and the helper type likewise). The idle sway is off for this view as well:
  `swayOn()` in `createBoardScene.ts` is false when a rig is present, and the rig ignores the sway
  argument of `overlayTransform` and `cameraMatrix`. The frame loop therefore runs only for a camera
  move, a running effect, or the waving cloth of a flag (below). The fly-in on Start and the dive
  and orbit at the end are as before (O2 holds: orbit sweep about 106 degrees).
- **Look (AC2).** `scene3d/cinematic/art.ts` (shapes), `textures.ts` (canvas textures), `set.ts`
  (sky, hills, earth layers), `diorama.ts` (materials, shaders, terrain, ring, props, lantern) and
  the rewritten `cinematicRig.ts`. The instanced meshes of the board scene keep their matrices; only
  geometry and material are swapped: covered cell = turf block (soil walls, domed lawn with a
  painted grass texture, 36 blades, per cell a quarter turn, brightness and grass height from a hash
  of its position), opened cell = dug earth (earth texture with clods, pebbles, cracks, shaded
  towards the walls, a crumbly lip; the turf stands 0.1 cell taller than the "3D" tile, so the hole
  has a visible wall and a digit next to it is not hidden at the 28 degree tilt), mine = rust-pitted
  iron sphere with belt, rivets and capped horns, sunk 0.2 cell into the earth, flag = wooden stick
  with a ball and a pennant (red cloth, tapering), exploded cell = crater (the tile dips, soot, a
  ragged lip of clods, the mine glows). Around the field: two rings of turf blocks (one extra
  instanced mesh), the cross-section of the earth (layered strata texture with pebbles and roots,
  3.1 cells deep), rocks, 34 wildflowers, a lantern post. Light: low sun from the far left at 24
  degrees (warm, long soft shadows through the existing shadow map), a cool sky fill, a bounce light
  from the front, haze (fog in the sky's horizon colour), a painted sky with hills, sun glow and
  clouds, a warm wash and the vignette in the post-processing. Dark scheme = dusk: moon, stars,
  cooler fill, and a lantern with a point light that glows (bloom). The digits keep their unlit
  decals and halos, so the 007 pairs hold on the earth. Eleven new tokens `--scene-dio-*` (grass,
  grass tip, soil, deep soil, clay, rust, sky low and high, sun or moon, ambient, lantern) in both
  schemes (`tokens.css`, `palette.ts`, `types.ts`); the scene code may not hold colour literals
  (`tokens.test.ts`).
- **Seams added to `createBoardScene.ts`** (all inert without a rig): `rig.keyDirection` (low sun),
  `rig.stageLayout(..., cell)` (the stage grows by 3 cells at the sides and 5.2 below for the
  diorama: `DIORAMA_ROOM`), `rig.setMotion`, `SceneTransition.anims` (the planned cell animations,
  for the dust), `PlanOptions.dig` (no flip, a 0.07 cell heave instead; same timing), the
  `createEndEffects` option `shards: false` (no pale tile shards; the view throws clods of earth).
- **Animations (AC4).** Reveal: a wave from the clicked cell, 600 ms in total (unchanged timing),
  each cell heaves, sinks and turns to earth, with a puff of dust (and two small clods for the first
  70 cells of the wave) that ends with the cell's own animation, so nothing outlasts 600 ms. Flag:
  the stick drops into the turf (the 009 pose), a small puff; unflag: it is pulled out (rises,
  shrinks), a small puff. One dig effect serves every cell (one batch each, so two clicks within 600
  ms do not erase each other). The cloth waves (a vertex-shader wave) while a flag stands on a
  running game; still under reduced motion, after the game ended, on boards of more than 600 cells
  and at quality level 2 (`WIND_MAX_CELLS`; a large board stays an on-demand render between
  actions).
- **End effects (AC5).** Loss: the story 010 explosion (flash, fire, smoke, chain of mines, shake)
  without tile shards, plus the shock ring (thinner, translucent on the light lawn), the travelling
  lift of the covered cells, 28 clods (earth, turf, stone), a light flash on the board. Win: 3
  fireworks bursts and 54 slow motes (fireflies at night, pollen by day) that fade in and out
  smoothly. Luminance, measured with the tester's rule (story 010; whole canvas, 341 x 256 and 150
  px windows; 9 games per scheme, three layouts, the third with the last click in the middle of the
  board): flashes per second at the rule's 10 % swing: light at most 2, dark at most 2 (before: dark
  4 and 6 in the 150 px window in 2 of 9 games); at 5 % and 3 % swing at most 2 in light and 3 in
  dark. What gave the margin: a brighter dusk (night exposure, sky and moon fill), spark gain 0.55,
  the flash light at a quarter of its strength, the flash glow at half, motes without flicker. The
  tester's `test.fixme` for the dark "mines in the bottom row" layout is removed; it passes.
- **Quality steps (AC8).** Turf blocks have three variants: 36 blades up to 400 cells, 18 up to 600
  and at level 1, 8 above 600 cells and at level 2 (`Diorama.setQuality`; the ring follows). Bloom
  off at level 2 as before. Dust capacity 1000, clods 320, motes scale with `effectScale`. AC8
  itself (Mac, headed) is still `npm run measure:fps -w apps/minesweeper -- --view=cinematic`.
- **Spec changes** (`minesweeper-cinematic.spec.ts`, helper `meanColour` added to
  `minesweeper.helpers.ts`): AC3 no longer expects a follow move; new: the pose and `cameraMove` are
  rest and `none` at 0, 100, 300, 600 and 1200 ms after a reveal and after a flag and an unflag; the
  mid fly-in picture (not the first frame, which is at rest because a move blends in over 160 ms)
  differs from the rest picture; "back at rest" reads a cell that keeps its height through the loss
  (the mine's own cell moves from covered to dug level, 2.7 px). AC2: mean colour of a covered cell
  is green-led, of a dug cell red-led (measured in the spec comment); the sky band spread keeps its
  0.05 (measured 0.10 in both schemes). AC7: the control for "idle motion exists" is now a flag
  whose cloth waves with normal motion (more than 20 pixels in 600 ms) and a read that shows no idle
  camera motion at normal motion (0 pixels). AC5: the dark fireworks test of the second layout runs.
- **Budgets.** The cinematic chunk is 20.8 kB gzip (round 2: 12.5), inside the 30 kB budget of
  `dist-check.json`, which is unchanged; the shared three chunk is 147.7 kB of 180. No dist-check
  string was added: the probe is unchanged.
- **Result.** `npm run test:e2e -w apps/minesweeper`: 130 passed (chromium 83, chromium-3d 5,
  platform 41, 1 earlier `fixme` now a test); `npm run verify` green (10 steps, 253 s). Screenshots
  (2x, light and dark; ready board, mid game with a flag, a dig at 120 ms, the loss at 150 ms, 600
  ms and the end, the win at 700 ms and 1800 ms): they are in
  `screenshots/050/R3-diorama-<scheme>-<state>.png`; the round-2 `Cinematic-*` shots are deleted.
- **Open points.** AC8 on hak's Mac (not measured here); the loop now runs while a flag stands on a
  board of up to 600 cells (cloth), so idle GPU use is above round 2's "nothing" but below its idle
  sway on large boards; the sun and moon discs sit on the backdrop wall and are seen only on tall
  stages (a small board shows the glow and the hills); flowers and rocks are the same on every
  board.

- **Round 4 (after gate 2, developer, 2026-11-21).** `scripts/measure-fps.mjs --view=cinematic`
  fixed (script only, no app code). (1) Crash "Execution context was destroyed": a page reload
  during the run; with a cold `node_modules/.vite` cache (app and root) it did not recur in
  headless here and Vite logged no re-optimisation, `optimizeDeps.include` already lists every
  three import of the cinematic chunk, so the cause is not reproduced. The script now warms the
  chosen view once, restarts on a fresh page, and repeats the whole measurement (up to 3 times)
  when a navigation destroys the context. (2) "nothing animated" / 0.0 fps: the cinematic view
  renders on demand and has no idle motion since round 3, so the idle tail of each 3.2 s to 5 s
  window read as 0 fps, and in software GL one frame blocks the page for up to 1.8 s, so the
  "busy 150 ms after the click" sample missed the effect. Cinematic now ends the samples at the
  first one with the final frame count (a run shorter than a window counts as one window),
  "alive" means at least two frames drawn after the click, and the busy check also takes
  earlier samples and the rig state. The "3D" measurement is unchanged in behaviour.

## Test report

Round 3 re-verification (tester, 2026-11-21, lean process). Rounds 1 and 2 found D1 (dark fireworks flash
rate, 6 per second) and O1 to O4; all are closed by the developer's fixes and re-checked below. Tests:
`apps/minesweeper/e2e/minesweeper-cinematic.spec.ts` (19 tests; none added in round 3, the developer's
adaptations were reviewed and kept) and the shared `apps/minesweeper/e2e/minesweeper.helpers.ts`.
Verdict: **PASS** for AC1 to AC7; AC8 is a manual check on hak's Mac and stays open.

| AC  | Test(s) (file `minesweeper-cinematic.spec.ts`)                                                                                                                           | Result |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| AC1 | `AC1: "View" offers 2D, 3D and Cinematic, ...`; `AC1: without WebGL2 "Cinematic" is unavailable ...`                                                                     | PASS   |
| AC2 | `AC2: the cinematic board has a lit background scene and richer colours than the 3D board, glyphs stay readable` (light, dark; grass green-led, earth red-led, contrast) | PASS   |
| AC3 | `AC3: the camera flies in on Start, stands still during play, dives to the exploded mine and circles on a win; ...`                                                      | PASS   |
| AC4 | `AC4: reveal flips tiles in a wave, a flag is planted and removed, ...`; `AC4: the reveal wave of a 30 x 30 board ...`                                                   | PASS   |
| AC5 | loss, loss picture, win (light, dark); `AC5: the fireworks of a win flash at most 3 times ...` (light, dark, two layouts); `AC5: a game that ended in 2D ...`            | PASS   |
| AC6 | `AC6: mouse, keyboard and the accessibility tree behave as in 2D, ...`                                                                                                   | PASS   |
| AC7 | `AC7: with reduced motion there is no camera move, animation or idle motion, ...` (flag included, normal-motion control)                                                 | PASS   |
| AC8 | not tested here: `npm run measure:fps -w apps/minesweeper -- --view=cinematic`, headed, on hak's Mac                                                                     | OPEN   |

**Results as printed.** `npm run test:e2e -w apps/minesweeper`: `130 passed (3.7m)`; by project (count of
printed test lines): chromium 84, chromium-3d 5, platform 41; no `flaky`, no retry. `npm test -w
apps/minesweeper` (header `@swfactory/minesweeper`): Test Files 17 passed, Tests 120 passed.
`npm run verify`: `verify: ok, 12 step(s), 251.7 s wall clock`.

**Review of the developer's adaptations (round 3).**

- AC2 colours: grass at (3,1) and earth at (7,4) are asserted by ratio (green over red and blue by
  1.1; red over green and blue by 1.1), two oracles per cell, measured margins 1.2 to 2.0. Not vacuous: a
  red grass token (light and dark) and a green soil token each kill an assertion (below).
- AC3 stillness: pose and `cameraMove` are read at 0, 100, 300, 600 and 1200 ms after a reveal and
  after flag and unflag; the same read is non-rest during fly-in and dive, so it can move. The
  fly-in picture at 300 ms differs from the rest picture (more than 5000 pixels), "back at rest" reads a
  cell that keeps its height. Limit: the pose is the rig's report; idle camera motion in the picture is
  covered by the AC7 control (0 pixels over 3 s at normal motion).
- AC7: stillness under reduced motion is read at tolerance 0 with a planted flag in the picture
  (line 970), and the control is the waving cloth (more than 20 pixels in 600 ms), so the control moves.
- O1 is closed: `startCinematic` scrolls the 30 x 30 grid into view before the click and the wave still
  ends within 600 ms (the wave assertion reads `fxState.animating`; every animation of AC4 and the end
  effects is read to 0 within 600 ms, 4 s).

**Flash rate (AC5), rendered luminance, five seeds per scheme.** Throwaway spec (deleted): win on a 9 x 9
board, mines `(9,c)` and `(9,c+2)`, c = 1, 3, 4, 5, 7, first click `(1,9)`, last click `(9,c+1)`,
sampled 33 ms in the first second and 100 ms after, areas whole canvas, 341 x 256 px window, 150 px
window, rule of story 010 at swings 10 %, 5 % and 3 %. Maximum flashes in any second: at the 10 % swing
2 in light and 2 in dark (341 x 256 window; whole 0, 150 px window 1 to 2); at 5 % and 3 % swing 2 in
light and 3 in dark (150 px window, c = 4 and c = 7 and c = 1). All at most 3. The permanent flash
tests (light and dark, two layouts) are green; the loss is within 3 in the loss test. Seeds c = 2 and 6
leave an isolated safe cell and cannot be won with two clicks, so they were not used.

**Mutation checks** (runner in the scratchpad, backup outside the repository, restore in a `finally`,
byte identity asserted by the runner for every mutation; only the lines round 3 touched). The runner
printed the failing assertion's file and line:

| Mutation                                                | Test run | Result                              |
| ------------------------------------------------------- | -------- | ----------------------------------- |
| cloth also waves under reduced motion (`!calm` removed) | AC7      | killed, line 970 (static with flag) |
| cloth never waves (`windOn` false)                      | AC7      | killed, line 1022 (the control)     |
| `flyIn: 1600` to `2600`                                 | AC3      | killed, line 332                    |
| `WAVE_TOTAL_MS` 600 to 900                              | 30 x 30  | killed, line 546                    |
| grass token red (light), (dark)                         | AC2      | killed, line 244 both               |
| soil token green (light)                                | AC2      | killed, line 246                    |

Not mutated again: the follow move is removed from the code, so its absence is only asserted by the
stillness reads; earlier-round mutations of AC1, the loss extras and the dive stay as recorded in round 2.

**Defects.** None open. D1 and O1 to O4 closed. **Checked, OK.** Every move ends on its own and the pose
returns to rest exactly; the hit test at each projected cell centre holds during fly-in, dive and orbit; a
click and Enter or F during a move act on the pointer or focus cell; loss ends in 2.4 s and nothing loops;
Start and a preset as in 006/AC2; a game ended in 2D shows the static final board without the effect.
Not checked: touch long-press (covered by 008 in `chromium-3d`), phones (out of scope), AC8 (manual).
Screenshots of the developer: `screenshots/050/R3-diorama-*.png`.

Round 4 check (developer, 2026-11-21): `node scripts/measure-fps.mjs --headless --view=cinematic`
(also with a cleared Vite cache) and `--headless` (3D) run through; cinematic rows measure 0.5 to
1.9 fps in software GL with no "nothing animated"; only the renderer row and the fps floors fail
there, as allowed. AC8 on the GPU stays manual.

Gate 2 full run (orchestrator, 2026-11-21): `node scripts/verify.mjs --mode=full --no-record` → `verify: ok, 12 step(s), 263.6 s wall clock`.

CI on GitHub (orchestrator, 2026-11-21): run 44946743984 of the branch at 3a6d309, `success`.

## Review

Lean process (story 048): reviewed by the orchestrator, round 1, checklist version 3. Verdict:
**APPROVED** (full verify green, see Test report).

| Item | Result | Note                                                                                              |
| ---- | ------ | ------------------------------------------------------------------------------------------------- |
| C1   | pass   | AC1–AC7 each map to `minesweeper-cinematic.spec.ts` (Test report); AC8 manual                     |
| C2   | n.a.   | no new network or pending-UI await                                                                |
| C3   | pass   | the scene is created and disposed by the existing `useBoard3d` effect                             |
| C4   | pass   | reduced motion and Start resolve every animation to its end state (AC7 test)                      |
| C5   | pass   | motion is a function of the loop clock; the game reducer is unchanged                             |
| C6   | pass   | context loss falls back as in 009 (shared `createBoardScene`)                                     |
| S1   | n.a.   | no HTML or URL input                                                                              |
| S2   | n.a.   | no config or secrets                                                                              |
| S3   | n.a.   | no new dependency; `three/examples/jsm` ships with `three`                                        |
| S4   | pass   | probe install written out with `import.meta.env.DEV && MODE === 'e2e'`; `rigState` in `forbidden` |
| S5   | pass   | `measure-fps.mjs --view=cinematic` keeps its non-vacuity check                                    |
| T1   | pass   | full verify run at gate 2 (see Test report)                                                       |
| T2   | pass   | one e2e per AC; unit tests only for pose, director, fireworks and loss plans                      |
| T3   | pass   | 10 + 7 mutations killed in rounds 1 and 3; pixel checks with measured noise                       |
| T4   | pass   | cells by role, probe paused before clicks                                                         |
| T5   | pass   | branchy plans have unit tests                                                                     |
| K1   | pass   | deviations (rig on `createBoardScene`, no bokeh, larger stage) in Implementation notes            |
| K2   | pass   | no `any`, no unexplained `!`                                                                      |
| K3   | pass   | 11 `--scene-dio-*` tokens in both schemes; token test green                                       |
| K4   | pass   | `check:structure` green                                                                           |
| K6   | pass   | status and index row equal                                                                        |
| K7   | pass   | every answer of hak logged, append-only                                                           |
| K8   | pass   | app README section "Cinematic view" and CHANGELOG entry                                           |
| K9   | pass   | prettier in verify                                                                                |
| K10  | n.a.   | no workspace tooling change                                                                       |
| K11  | n.a.   | no env variable                                                                                   |
| A1   | pass   | third radio in the "View" group; grid identical to 2D (AC6)                                       |
| A2   | pass   | the view is a picture; state cues live in the shared accessible grid                              |
| A3   | pass   | reduced motion honoured (AC7)                                                                     |
| A4   | pass   | geometry, textures and vectors are built at setup, not per frame; 62 dispose calls                |

## Explanation

The Minesweeper View control has a third option, Cinematic, next to 2D and 3D.
It draws the board as a diorama of a minefield: turf blocks, dug-out earth, rusty mines, cloth flags.
A low evening sun gives long shadows; dark mode is dusk with moon, stars and a lantern.
After Start the camera flies in; during play it stands still, which hak asked for after round 2.
Revealing digs the ground out in a wave with dust; flags are stuck in and pulled out.
A loss throws up earth, leaves a crater and sets off the other mines; a win plays fireworks.
Every effect ends within 4 seconds, flashes at most 3 times a second and stops at Start.
With reduced motion nothing moves; the game, keyboard and screen reader work as in 2D.
2D and 3D are unchanged; the new view loads as its own small part (about 21 kB).
Risk: the frame rate on large boards was not measured on a real Mac (AC8 is a manual check).
Not verified: phones (out of scope) and long-press by touch in this view.

## Retrospective

What went wrong:

- The product-owner run was lost when the first session ended, and a resumed copy in the
  original session wrote a second story 050 in parallel; its index row slipped into the gate-1
  commit. Root cause: two sessions on one checkout. Fixed by hand; no rule proposed.
- Round 1 failed AC5: the dark fireworks flashed 6 times a second. The probe counted bursts
  started, not rendered flashes. The tester's luminance test caught it.
- hak rejected round 2 after trying it: the follow camera wobbled during play and the look was
  plain. Root cause: AC3 asked for a follow move and AC2 named techniques, not a look. hak chose
  the diorama from three concrete directions; round 3 was approved from screenshots.

Proposed changes:

- **P51:** for a story whose goal is a look ("spektakulär", "schön"), the orchestrator shows hak
  two or three concrete style directions at gate 1 and the developer delivers screenshots before
  the tester runs. Edit: one line under "Conventions" in `CLAUDE.md`.
- **P52 (tester's suggestion):** a flash or rate limit in an AC is tested on rendered luminance,
  never on a probe counter of effects started. Edit: one sentence in the test rules of `CLAUDE.md`.

Memory: developer (+10, pruned), tester (+7) and product-owner (+3, from the parallel session)
lessons look role-specific; the product-owner line about two writers taking one number is right.

Outcome at gate 2 (hak, 2026-11-21: "Beide, committen"): P51 and P52 approved and applied to
`CLAUDE.md`. AC8 (fps on hak's Mac) not run at gate 2; it stays an open manual check.

### Cost

| Role                        | Round | Model   | Tokens       | Tool uses | Duration |
| --------------------------- | ----- | ------- | ------------ | --------- | -------- |
| product-owner               | 1     | inherit | n/a          | n/a       | n/a      |
| developer                   | 1     | sonnet  | 309357       | 97        | 27:24    |
| tester                      | 1     | sonnet  | 233402       | 94        | 45:43    |
| developer                   | 2     | sonnet  | 126086       | 63        | 33:48    |
| tester                      | 2     | sonnet  | n/a          | n/a       | n/a      |
| developer                   | 3     | sonnet  | 431470       | 134       | 56:26    |
| tester                      | 3     | sonnet  | 103358       | 24        | 17:49    |
| total (measured)            |       |         | 1203673      | 412       | 3:01:10  |
| orchestrator (main session) |       | opus    | not measured | n/a       | n/a      |

Product-owner round 1 ended with the session (no completion data); tester round 2 was stopped by
the orchestrator after hak rejected the look. Developer round 3 stands out: it rebuilt the look.
