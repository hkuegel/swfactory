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
