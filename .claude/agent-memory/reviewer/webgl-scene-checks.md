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

Related: [[ui-a11y-probes]], [[build-guard-checks]]
