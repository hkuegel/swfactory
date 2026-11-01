---
name: build-guard-checks
description: How to verify that test-only code (e2e fakes, window hooks) cannot reach production bundles in this Vite app
metadata:
  type: feedback
---

Don't stop at the plain `npm run build && grep`: a build without env vars can drop whole branches (Vite inlines `undefined`), so the grep may pass for the wrong reason.

**Why:** story 001 — without `VITE_GOOGLE_CLIENT_ID` the Google adapter was tree-shaken too; only builds with an ID set prove the guard itself works.
**How to apply:** additionally run `VITE_<ID>=dummy npx vite build --outDir <scratchpad>/dist-x --emptyOutDir` and the same with `--mode e2e`, grep both for the fake's markers (window key, control method names, default fake account), and confirm the real adapter's URLs ARE present. Build into the scratchpad so the repo's `dist/` and git state stay untouched.

Also: before flagging a doc/ADR as stale because the Implementation notes say so, read the ADR — the architect may already have revised it (story 001, ADR 0003).

Related: [[async-adapter-checks]]
