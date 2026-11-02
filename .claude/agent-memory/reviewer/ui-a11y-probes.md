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

Related: [[build-guard-checks]], [[test-proportionality]]
