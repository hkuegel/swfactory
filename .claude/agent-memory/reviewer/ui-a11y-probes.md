---
name: ui-a11y-probes
description: How to probe UI/a11y claims (forced colours, computed styles) with a throwaway Playwright spec without touching e2e/ or the repo
metadata:
  type: feedback
---

Check a "forced-colors: every state distinguishable" claim with an actual probe. Don't trust a `@media (forced-colors: active)` block just because it exists.

**Why:** story 005 round 1. The board's forced-colours block only recoloured borders and glyphs. Forced colours drop `box-shadow` and replace backgrounds with `Canvas`, so hidden and revealed cells looked identical (major). Neither the developer nor the tester had checked forced colours.
**How to apply:** look for states told apart only by background or box-shadow (bevels, fills, overlays). Probe with `page.emulateMedia({ forcedColors: 'active' })` and read `getComputedStyle` (background-color, border, box-shadow) for each state, plus a grid screenshot.

Throwaway Playwright probe outside the repo:

- In the scratchpad, write `probe.config.ts` (`testDir: '.'`, a `webServer` with `cwd` set to the repo, `reuseExistingServer: true`, port 5174 mode e2e) and `probe.spec.ts`.
- Symlink `node_modules` into that directory, otherwise `@playwright/test` won't resolve.
- Run `npx playwright test --config <scratch>/probe.config.ts` from the repo.

Live regions that mount together with their first content usually aren't announced. Check where the region mounts, not just that `aria-live` is set (story 005).

The trailing no-break-space toggle that makes identical live text get announced again (story 005 round 2) is fine if it stays in a visually hidden region. Probe for visible text nodes containing U+00A0, and check that exact `getByText` still matches (both libraries trim it).

Re-render isolation claims (e.g. "the tick only re-renders the timer") are cheapest to prove with a MutationObserver on the grid plus `page.clock.install` + `runFor`: count grid vs timer mutations (story 006: 0 vs 1 per second). For flex rows that "must fit at 375 px", measure each button's first text node with a Range against the button width at 375/360/340/320 and at 200 % zoom (half the width); min-width: 0 fixes can hide text overflow.

Contrast audits: derive the fg/bg pairs from what the modules actually paint, including hover, press, invalid, callout icons and glyphs on revealed cells. Don't take them from the design's contrast table. Compute them with a small node script in the scratchpad that reads `src/app/tokens.css`. In story 007 the unit test's PAIRS left out six pairs that were in use (all passed).

Forced-colours e2e signatures that include `innerHTML` can't catch invisible glyphs: the markup differs even when the glyph is painted Canvas on Canvas. Ask for computed glyph fill vs cell background instead (story 007).

Probe pitfalls that nearly became false alarms (story 008): `getComputedStyle` read right after a click returns mid-transition values (cells fade box-shadow over `--duration`), so wait about 300 ms first. `page.mouse.down` at a `boundingBox()` below the 720 px viewport silently hits nothing (`:active` false, no `.pressed`), so call `scrollIntoViewIfNeeded()` first.

Layer and performance claims ("no per-cell layers"): count layers with a CDP `LayerTree.enable` / `layerTreeDidChange` before and after the switch. Record rAF frame gaps across the switch on a 30 × 30 board and add a grid MutationObserver for "no remount". In 008: +1 layer, one 33 ms frame, 0 mutations.

CSS calc constants derived from tokens (e.g. `/ 1.05` = 1 + 2 × a margin token) drift when the token changes and no test ties them together. Ask for the calc to use the token itself (story 008).

Related: [[build-guard-checks]], [[test-proportionality]]
