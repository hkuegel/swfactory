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
