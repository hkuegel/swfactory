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
