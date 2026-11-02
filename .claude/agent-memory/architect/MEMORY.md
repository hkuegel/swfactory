# architect memory

Lessons learned across stories. One rule per line, newest last. Keep under 100 lines.

- Check every AC against what the IdP/browser platform actually signals (popup gesture, iframe buttons, FedCM, 3P cookies) before designing; build an AC → mechanism table, since session/restore ACs often conflict with frontend-only constraints (story 001).
- When the ux-designer works in parallel, read their section before writing mine and answer their "open points for architect" explicitly in an "Alignment with UX" subsection (story 001).
- When blocking on one question, still deliver the full design for the parts the answer doesn't affect and isolate the variant-dependent part in one subsection, so the developer isn't stalled by a second architect round (story 001).
- Run `npx prettier --check` on every doc I edit (story, ADRs, backlog README), because `npm run verify` includes format:check over markdown and unaligned tables fail it (story 001).
- When a status cell in docs/backlog/README.md gets longer, re-run prettier on it, since the table column width changes (story 001).
- Give e2e its own dev-server port whenever the app behaves differently in e2e mode, because Playwright's reuseExistingServer silently reuses a normal `npm run dev` (story 001).
- Specify a minimal test set in the design: each AC tested once at the cheapest level that shows it (e2e per AC, unit only for reducer/pure logic), because hak found 001's 2:1 test-to-code ratio excessive (story 004).
- For dev-only code, require `import.meta.env.DEV` literally at each use site plus a `dist` grep in verify, since cross-module constant folding isn't guaranteed to strip the code (story 004).
- For UI-heavy stories, read the parallel UX section before fixing element semantics or focus model (e.g. button vs. gridcell) and follow UX there, because a11y semantics are UX-owned and the input wiring depends on them (story 005).
- Time in a pure reducer: pass `now` in the action and store timestamps in state, derive seconds in a tiny component/hook; prefer Playwright `page.clock` over a dev-only hook, so no check-dist entry is needed (story 006).
- Tie "start" events to leaving the initial phase, not to an intermediate phase: a game can end on its first reveal (ready → won) (story 006).
- Update story status with Edit, not `sed -i` (macOS BSD sed needs `-i ''`), and always run prettier --write on story + README after, since it realigns the README status column (story 006).
- For design tokens prefer light + `@media (prefers-color-scheme: dark)` blocks over `light-dark()`: e2e runs on the dev server, so a production-only CSS transform by Vite would go unseen; guard parity with a unit test over `tokens.css?raw` (story 007).
- Reduced motion via a `--duration` token set to `0s` in the media query is the primary guard; a global `!important` on `*` in index.css is only a safety net for animations and longhand transitions (story 007).
- When a design says "no `!important`" or "no X" and the UX or implementation needs an exception, write the exception into the ADR and Technical design at design time, because review had to flag the doc gap after the fact (story 007).
- Forced colours remove box-shadow and gradients: require every cell/state cue to also exist as border, outline or glyph, and test states pairwise via a computed-style signature under `emulateMedia({forcedColors:'active'})` (story 007).
- When a wrapper (panel) adds padding, any `100vw`-based fluid size formula must subtract it via shared tokens, not a literal (story 007).
- For a CSS-only visual variant (3D tilt) put `perspective()` inside the element's own `transform` and keep the DOM identical; scroller `overflow` flattens preserve-3d, and a transform needs margin compensation because only transformed bounds scroll and left/top overflow is unreachable (story 008).
- Derive geometry constants (margins, fluid-size divisors) from tilt/depth tokens in a unit test instead of trig in CSS, because Vite's CSS transform vs dev server could differ unseen (story 008).
- To re-run existing e2e flows in a variant, use a second Playwright project with `grep` + a `test.info().project.name` check in beforeEach rather than copying test bodies (story 008).
- jsdom has no `CSS.supports`: capability checks must be evaluated at mount (not module load) and be false-safe, so e2e can fake them with addInitScript (story 008).
