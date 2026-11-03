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
