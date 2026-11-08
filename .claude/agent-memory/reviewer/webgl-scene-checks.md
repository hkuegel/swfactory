---
name: webgl-scene-checks
description: Review checklist for imperative render controllers (three.js scene + DOM overlay, story 009) — lifecycle paths, inactive modes, GPU leaks, per-frame cost
metadata:
  type: feedback
---

For an imperative controller that React attaches and detaches (three.js scene, story 009), list every path that writes inline styles or GPU state, and check each one against every lifecycle edge, not just the first attach.

**Why:** in story 009 round 1, the overlay transform was written only by the render loop and by a media-query listener. In forced colours (loop inactive), every attach after the first (a new game remounts the Board with `key = game.id`, or a 2D→3D switch) left the grid flat with negative margins, so the top row was clipped and could not be scrolled to (major). Dev and tester had checked forced colours only on the first switch.

**How to apply:**

- Matrix: {first attach, re-attach after new game, 2D→3D again, after context loss} × {normal, reduced motion, forced colours/inactive, hidden tab}. Probe the ones where the loop doesn't run with a scratch Playwright spec and read `grid.style` plus the cell(1,1) box against the scroller box.
- Construction: anything that can throw after `new WebGLRenderer()` must dispose the renderer and call `forceContextLoss()`, or each retry leaks a context.
- Per animated frame: `needsUpdate` on instanced meshes uploads the whole capacity. Flag it when every mesh is flagged regardless of `count`.
- Frame-time governors that read rAF deltas can't see under 16.7 ms on 60 Hz displays, so a "fast" threshold below that never steps back up. The fix accepted in 009 round 2: "on time" means the median is within 1.15 × the shortest delta in the window, the slow check runs first, and the wait doubles after it oscillates.
- Keep the round-1 probe specs in the scratchpad and re-run them unchanged in round 2. That is the cheapest proof that a fix works (009: before/after numbers for the same probe).
- Grep the loop for allocations: array literals in helpers, `filter` / `slice` / `sort` per callback.
- Count canvases after N games plus N context losses (`page.locator('canvas').count()`). It was 1 in 009, which was correct.

Story 010 additions (end effects on the same controller):

- **Real loop vs probe:** the e2e probe pauses the clock, so rAF-only logic (gap watchdogs, first-frame cost) is never exercised. Run a scratch script without `pause()`, poll `fxState` every 40 ms and read when `running` drops. A "jump to end after a gap > N ms" rule counts the slow first effect frame itself (instance rewrite + shadow pass: about 350 ms on SwiftShader), so the effect is cut after 2 frames. A tester check "idle after Ns" is vacuous for "plays".
- **GPU leak probe:** patch `WebGL2RenderingContext.prototype.create*/delete*` in `addInitScript`, count live Buffer/Texture/Program/Framebuffer/VertexArray after game 1 vs game 8 (loss, win, scheme change, 2D round trip). Also proves "no shader compile at the first end": program count stays constant. Count `visibilitychange` add/remove the same way.
- **Dev-only helpers outside the guard:** module-level tables/statements used only by the probe (e.g. a LINEAR lookup built with `Array.from`) survive tree-shaking; grep `dist/assets/*.js` for their body, `check-dist` only sees identifying strings.
- Listeners registered in `buildController` before `renderer.compile` leak if the build throws: they should be registered after the last throwing step.
- Per-frame helpers returning arrays/objects (`screenToScene`, envelope functions) are the usual allocation leak despite an "allocation-free" doc comment; grep helper return types.
- **Renderer branches in e2e (019):** headless Chromium on macOS reports "ANGLE (… SwiftShader driver)" even without `--use-angle=swiftshader`, so a "hardware GL" branch in a spec never runs in the suite; probe the renderer string with a 10-line `chromium.launch()` script before accepting a hardware/software split.
- **Bounds from measured frame gaps (019):** check which gap feeds the bound: the longest gap anywhere (incl. the first one from the click, which holds the evaluate round trip) lets a late end pass after an early stall; only the gap(s) at the end matter, and `fxState.running` set in the scene's own frame can be one frame stale.

Related: [[ui-a11y-probes]], [[build-guard-checks]]
