# devops memory

Lessons learned across stories. One rule per line, newest last. Keep under 100 lines.

- Write bundle/file checks as small Node scripts under `scripts/` (not grep one-liners) because they behave identically on macOS and ubuntu CI; ESLint only lints ts/tsx, Prettier does check `.mjs` (story 004).
- Make dist checks fail on an empty/missing `dist/` (require index.html + a .js file) so they cannot pass trivially (story 004).
- check-dist makes the lazy-chunk checks mandatory only once `scene3d/createBoardScene.ts` exists (else skipped with a note), so a story's check-dist change can land before its code without a vacuous or failing pass; verify such checks with a fake chunk in a scratch copy of `dist/` (story 009).
- After removing a workspace (e.g. the `zzprobe` probe app) `npm install` and `npm prune` leave an `extraneous` `apps/<name>` entry in `package-lock.json`: delete that key by hand, then `npm install` and `npm ci --dry-run` to confirm (story 011).
- Keep `__X__` placeholders in skeleton markdown inside code spans because prettier rewrites `__X__` in prose to bold; in TS/JSON/HTML use them only inside string literals or text so the template still lints and formats (story 011).
- A skeleton's `tokens.css` needs empty `:root {}` and `@media (prefers-color-scheme: dark)` blocks because the shared `parseTokens` throws on a missing block; platform-only knowledge belongs to the platform's dist-check.json, an app's own dev-only strings to its dist-check.json (story 011).
- Never put an app name into factory files (CLAUDE.md, agents, skills, templates, platform): `check-structure` fails on any whole-word match, so write `<app>` or "the default app" (story 011).
- When a destructive script probe (`new-app.mjs`, check-dist) is run, snapshot `git status --short apps/<other-app>` before and after and diff, plus the lockfile checksum, to prove nothing else was touched (story 011).
- Run the non-workspace skeleton's checks via `scripts/check-template.mjs` (cwd `templates/app` for vitest; `--root` breaks the setup path) and let it delete the `templates/app/node_modules` vitest cache, because the skeleton is copied by `new-app` (story 011 review).
- `readCss` keys are `src/<path>` for both platform (`src/styles/…`) and apps (`src/tokens.css`): match them exactly, never with `endsWith` (story 011 review).
- `playwright test` exits 1 on an empty testDir, so a new Playwright config needs at least one spec file (placeholder) before the real spec lands (story 018).
- Playwright `webServer.url` needs a 2xx/3xx/400-403 answer: for a server whose root is 404 (strict Pages-like static server) use `port:` instead (story 018).
- Verify GitHub Action majors with `gh api repos/actions/<name>/releases/latest --jq .tag_name` before pinning, and bump all workflow uses to one version per action (story 018).
- `npm run test:e2e` takes about 2 minutes (minesweeper 110 specs): run it in the background, not in a foreground call with a 120 s timeout (story 018).
- Check factory-file diffs with explicit paths (zsh does not word-split a path variable) and expect CLAUDE.md to hold earlier uncommitted changes from other stories; report those separately (story 018 retro).
- Check the 120-char limit on added lines only (`git diff -U0 | grep '^+' | awk`) because CLAUDE.md has older long lines; zsh has no `${PIPESTATUS}`, use `${pipestatus}` (retro P1-P4, 019).
- Start long verify/e2e chains as one script file with `run_in_background`, never `( ... ) &` inside a tool call: the shell reports "completed" at once while the job runs on, and a second chain then fights over ports 5174/5175 (avd e2e failed against another run's minesweeper server) (story 021).
- A new workspace outside `apps/*` (e.g. `landing/`) extends `../tsconfig.*.base.json` and needs `--ignore-path ../.prettierignore`; vitest and Playwright exit 1 without any test/spec file, so a scaffold needs one placeholder each (story 021).
