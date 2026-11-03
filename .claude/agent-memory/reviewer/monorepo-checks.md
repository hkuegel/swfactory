---
name: monorepo-checks
description: What to probe when reviewing workspace/platform/skeleton changes (check-dist, new-app, check-structure, shared e2e specs, rebuild skill)
metadata:
  type: feedback
---

Things that are NOT covered by `npm run verify` in the platform/apps split and need a manual look (story 011):

- `templates/app` is not a workspace: its skeleton tests never run in verify/CI. Run `cd templates/app && npx vitest run` by hand (works, root `node_modules/@swfactory/platform` link resolves), then `rm -rf templates/app/node_modules` (the vite cache lands there).
- Shared e2e specs take `appTitle` / `signedInContent` from Playwright options; defaults are `''`, which matches any h1. Check that app configs set both and whether the helper validates them.
- Path-suffix exemptions in the token rules (`endsWith('/tokens.css')`, `'/styles/base.css'`) are false-negative candidates for new apps.
- Probe `new-app.mjs` from a scratchpad copy (`scripts/` + `templates/` + empty `apps/`), never in the repo; its ROOT comes from `import.meta.url`.
- `git add -N .` to see untracked files in a diff mutates the index; undo with `git status --short | grep '^ A' | cut -c4- | xargs git reset -q --`. Prefer `git diff main -M --diff-filter=RM` (no pathspec: a pathspec breaks rename detection) and read untracked files directly.
- Rename-heavy diffs: filter with `grep -E '^(diff|[-+][^-+])'` to see only the real content changes per file.

**Why:** story 011 review found the skeleton unexercised, vacuous-by-default fixtures and an accidental index change from `git add -N`.
**How to apply:** run these checks first on any story touching `packages/platform`, `templates/app`, `scripts/` or the rebuild/new-app skills.

Related: [[build-guard-checks]], [[test-proportionality]]
