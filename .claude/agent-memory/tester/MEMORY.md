# tester memory

Lessons learned across stories. One rule per line, newest last. Keep under 100 lines.

- Start e2e specs with `/// <reference lib="dom" />` because `e2e/` is typed by tsconfig.node.json (no DOM lib) and `page.evaluate(() => window…)` otherwise breaks `npm run typecheck` (story 001).
- Run `npm run verify` (not just vitest/playwright) after writing e2e: typecheck covers `e2e/` and only verify catches it (story 001).
- Assert "focus left the page" with `document.activeElement === document.body`, not `locator('body').toBeFocused()`: Tab past the last stop moves focus to browser chrome and body reports inactive (story 001).
- Drive the e2e fake via `page.evaluate(() => window.__fakeGoogle?.settleSignIn(...))`; poll in `beforeEach` that `__fakeGoogle` exists so specs can't silently run against real Google; call `setAccount` after each goto/reload (story 001).
- Integration pattern that works: real `App` + `AuthProvider` + `createGoogleAuthClient({loadScript, fetchFn})` with stubbed GIS gives AC coverage for real error mapping without a browser (`src/app/App.google.test.tsx`, story 001).
- Use `vi.stubEnv('VITE_GOOGLE_CLIENT_ID','')` to test the missing-client-ID path; stub `console.error`/`warn` (provider warns in DEV) to keep output clean (story 001).
- Layout checks at the 600 px breakpoint via bounding boxes + `scrollWidth > clientWidth` are stable in Chromium; use `test.use({ viewport })` in a describe block (story 001).
- Probes worth repeating on UI-with-async-state stories: double click, settle twice, reload while pending, rapid repeated failures, hostile text (`<img onerror>`), very long strings, keyboard-only with Enter and Space (story 001; none found a defect there).
- For timeout logic use `vi.useFakeTimers()` after `await setup()` (setup flushes with a real setTimeout) and `advanceTimersByTimeAsync`; in component tests wrap in `act(() => …)` (story 001 round 1).
- Add boundary tests for timeouts (answer at limit-1 succeeds, limit fails, timer count 0 afterwards) and a stale-response-vs-next-attempt race test (story 001 round 1).
- Keep tests minimal when hak asks (story 004): one test per AC or AC group at one level, skip what developer unit tests cover, run probes as throwaway specs (write in e2e/, run, delete) and list them as "checked, OK" unless they found a defect or real risk.
- A temp spec in e2e/ can probe a `vite preview` production build via an absolute URL (start `npx vite preview --port N` in background, kill after) (story 004).
- Mutation-check build guards by appending the forbidden string to dist/assets/*.js and re-running `npm run check:dist`, then rebuild (story 004).
- Real touch long-press in Chromium: `test.use({ hasTouch: true })` + `page.context().newCDPSession(page)` + `Input.dispatchTouchEvent` touchStart / wait / touchEnd; `locator.tap()` for a short tap. Catches long-press-plus-click/contextmenu double actions better than dispatched pointer events (story 005).
- Query ARIA-grid cells whose accessible name changes with state by prefix regex (`^Row 3, column 5,`) and assert state with `toHaveAccessibleName`; `page.locator(':focus')` + `toHaveAccessibleName` checks roving focus (story 005).
- Enter inside a form field leaves focus in that field; "focus stays on Start" only holds after clicking Start. Don't assert Start focus after Enter-submit (story 005).
- Fixed-layout hooks (`window.__minesweeperMines`): convert 1-based test coordinates to 0-based in one helper; layout length must equal the mine count or the reducer throws (story 005).
- When a feature removes UI that older specs name (counter), grep `e2e/` for the old strings and also look for assertions that now pass vacuously (`toHaveCount(0)` on a gone element) (story 005).
- Forced-colours probes: `page.emulateMedia({ forcedColors: 'active' })` applies `@media (forced-colors)` rules at once; in Chromium `ButtonFace` resolves to white like Canvas, so compare the inset `box-shadow`/border, not the background (story 005 round 1).
- Before comparing "hidden" vs "revealed" styles in a grid probe, read the accessible name of the sample cell and pick one a flood fill cannot open; a fixed layout with corner mines wins after one reveal and flags every mine (story 005 round 1).
- Fake clock for timers: `page.clock.install({ time })` before `goto`, sign in, then `pauseAt(time + 60 s)`; works with the sign-in fake and guest login, no hook needed. Use `fastForward` for huge jumps (`runFor` of 1e6 s fires 4M ticks, 20 s) (story 006).
- The `__minesweeperMines` hook persists across Starts on the same page: `delete window.__minesweeperMines` before a start with another mine count, or the reducer throws and the board never renders (story 006).
- Compare layout claims in the UX design (e.g. "three buttons in one row at 375 px") with bounding boxes at 320/375/800; flex items with `min-width:auto` break them (story 006). Keep a layout defect as `test.fixme` so the suite stays green.
- Adding a new tab stop before existing ones (presets before Rows) breaks keyboard specs in `e2e/auth.spec.ts`; grep for `Tab` sequences when UI is added above the form (story 006).
- Keyboard specs must not name controls of another feature: to step past a control assert `not.toBeFocused()`, then return with `Shift+Tab` and assert focus again; this stays valid when layouts change (auth.spec.ts keyboard sign-out test, fixed after stories 005/006).
- CSS-module class names are hashed in the dev server: inject-CSS mutation checks must select by role/attribute (`div:has(> [role=grid])`, `[role=gridcell]`), not `.scroller`/`.hidden` (story 007).
- Cells transition `box-shadow`/background for 120 ms: before reading computed styles of cells, `expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0)`, otherwise "hidden vs empty" signatures flake (story 007).
- A fixed layout with a wall of mines (column 3 of a 5 x 5) lets one click open a region and leaves hidden, flagged, wrong-flag, mine and exploded cells all visible after a loss (story 007 `loseWithAllStates`).
- Chromium's `forcedColors: 'active'` emulation draws `GrayText` dark red; reddish thin borders there are not a bug (story 007).
- Screenshot runs: wait ~400 ms after a state change; the mouse still hovering a button makes it look "hover-coloured" in the shot (story 007). Gate-2 shots: throwaway spec in e2e/, output to `test-results/<story>/` (gitignored), delete the spec.
- When an old spec pins a replaced visual spec (colour, px), check the story ACs first: if they don't mention it, rewrite to the intent (focus ring >= 2 px solid and not transparent; button width == its container) instead of new magic numbers (story 007).
- Playwright wipes `test-results/` on every run: write screenshots (or any artefact meant to outlive the run) to `screenshots/<story>/` (gitignored) and run the e2e suite BEFORE taking them (story 007).
- "X equals its container" checks prove nothing when the container is the element's own flex wrapper; compare with an ancestor's content box (clientWidth minus padding) (story 007).
- For forced-colours cell checks assert glyph paint != backdrop (fill/stroke resolved) rather than comparing markup; markup always differs even if the glyph is invisible (story 007).
