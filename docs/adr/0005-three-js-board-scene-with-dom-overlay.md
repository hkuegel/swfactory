# 0005 – 3D board scene with three.js, lazy-loaded, the DOM grid as an aligned overlay

- **Status:** accepted
- **Date:** 2026-11-02
- **Story:** docs/backlog/009-minesweeper-3d-visual-upgrade.md (seam used by 010)

## Context

Story 009 replaces the CSS-tilted DOM board of 008 with a lit 3D scene: tiles with thickness,
soft shadows from one key light, glossy materials, flags and mines as 3D objects, reveal and
flag animations, a gently swaying camera (at most 3°, period at least 10 s) and a frame-rate
floor (50 fps on 16 × 30, 30 fps on 30 × 30 on hak's Mac). Input (mouse, long press, keyboard,
drag-scroll), the ARIA grid and the focus ring of 005–008 must stay as they are, 2D stays the
default and untouched, and 3D must fall back to 2D when it cannot load or the rendering is lost.
hak accepted about 170 kB extra download for 3D at gate 1. The decision is costly to reverse:
it brings the first large runtime dependency and fixes how the scene and the accessible board
fit together.

## Options considered

1. **Plain three.js, loaded with `import()` when 3D is first chosen, the existing DOM grid as a
   transparent overlay projected with the same camera math** (chosen) – mature WebGL2 renderer
   with instancing, shadow maps and PBR materials; MIT; tree-shakes; measured 135 kB gzip
   (544 kB minified) for a chunk with renderer, physical/standard/basic materials, instanced
   meshes, rounded-box geometry, directional + hemisphere light and canvas textures. The overlay
   keeps every input path and the accessibility tree byte-for-byte; only the look moves to the
   canvas.
2. **React Three Fiber (+ drei)** – declarative scene in React. Adds a reconciler and a second
   React renderer on top of three (≈ +40–60 kB gzip), and per-frame work (sway, animations)
   must bypass React anyway to keep 900 memoised cells from re-rendering. drei's `Html`
   overlays are per element and don't project a whole grid. More surface, no gain for one
   scene.
3. **Babylon.js / PlayCanvas** – full engines, several times the download (Babylon core alone
   is well above the budget), own scene graph conventions; more than one board needs.
4. **Small WebGL libraries (OGL, regl, twgl) or raw WebGL2** – 10–40 kB, but no shadow maps,
   PBR or instancing helpers; we would write and maintain a renderer.
5. **Keep CSS 3D (008) and add more CSS** – no dependency, but no real lighting, no cast
   shadows, no thickness; hak rejected that look ("komplett langweilig").
6. **Canvas-only board with raycast hit testing (no DOM overlay)** – one source of geometry,
   but every input path, the roving tabindex, the ARIA grid and the focus ring would have to be
   rebuilt or mirrored, and 008/AC4–AC5 re-verified from scratch.

## Decision

Option 1:

- `three` (runtime) and `@types/three` (dev) at `^0.187.0`. three has no semver; a caret on a
  `0.x` version only takes patch releases, so every minor (r-number) update is a deliberate
  change with a test run (r187 already removed `PCFSoftShadowMap`, found in the spike).
- All three.js code lives under `src/features/minesweeper/scene3d/` and is reached only through
  one dynamic `import()` in `useBoard3d`. Code in the main chunk imports from `scene3d/` with
  `import type` only, except the three-free pure modules (geometry, timeline, quality).
  `scripts/check-dist.mjs` fails if the entry chunk contains three or if the scene chunk grows
  above 180 kB gzip.
- The reflection environment of the hidden tiles is built in code from the scheme's `--scene-*`
  tokens (`scene3d/environment.ts`, PMREM-filtered), not with three's `RoomEnvironment` addon,
  because its diffuse light clipped the tops to white (changed during build/test/review, see the
  story's Implementation notes, deviation 2).
- The DOM grid stays the only input and accessibility surface. In 3D it is transparent
  (except the focus ring) and transformed with a CSS `perspective() rotateY() rotateX()` whose
  numbers come from the same pure module (`scene3d/geometry.ts`) that builds the three.js
  camera, so the rendered tile tops and the hit-test boxes coincide by construction.
- The canvas is sized to the board's content box and scrolls with it (no viewport-sticky
  canvas): compositor scrolling moves overlay and canvas together, with no re-render per scroll.
  Device pixel ratio is capped at 2 and the backbuffer at about 4.2 M pixels.
- Render on demand. The only loop is the idle sway (and animations while they run), capped at
  60 fps. Under `prefers-reduced-motion: reduce` there is no loop at all.
- The renderer outlives games: one controller per `Minesweeper` mount, its canvas is moved
  into each new board. Context loss or a failed creation returns the view to 2D.
- End-to-end tests run on software WebGL (SwiftShader) with a dev-only probe
  (`window.__board3dProbe`, `import.meta.env.DEV && import.meta.env.MODE === 'e2e'`) for scene
  time, sway and pixel reads. The frame-rate floor is checked by `scripts/measure-fps.mjs` in
  headed Chromium on hak's Mac, not in CI.

## Consequences

- 3D costs one extra request of about 135–155 kB gzip, only for players who choose 3D; 2D
  users download nothing new.
- Scene colours and the scheme-dependent look numbers (light intensities, shadow strength,
  gloss) come from `src/app/tokens.css` (ADR 0004) and are read at runtime; no colour literal
  in TypeScript. The reflection environment is rebuilt from the same tokens on a scheme change. The unitless `--scene-*` look tokens get parity checks only, no colour or
  contrast checks. Digits, flags and mines are drawn unlit with a halo in the colour of the
  surface under them, so the 007 contrast pairs hold under any lighting.
- In 3D the overlay cell carries the focus ring plus a two-tone halo (an outer `box-shadow`),
  because the pixels under the ring vary with light. This lifts 008's "no outer shadow on a
  cell" for the 3D overlay only.
- The loading state is static text (no spinner), so the sway and animations caused by input stay
  the only motion (story 009 AC4).
- Under forced colours the canvas is hidden and the tilted DOM grid shows its 2D/forced-colours
  look, because a WebGL canvas ignores system colours.
- e2e needs WebGL in headless Chromium: Playwright launches with
  `--use-angle=swiftshader --enable-unsafe-swiftshader`; Vite pre-bundles `three` at server
  start (`optimizeDeps.include`) so the first `import()` never triggers a dev reload.
- A three.js update can change rendering or remove APIs; it is a deliberate dependency bump with
  e2e and a look at the gate screenshots.
- Story 010 adds effects through the scene's effect host and transition hooks; no change to this
  decision.
- If a later story wants free camera control, the overlay projection still works (same camera
  math), but gestures change (out of scope of 009).
