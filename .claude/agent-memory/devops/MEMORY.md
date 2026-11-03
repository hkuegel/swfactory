# devops memory

Lessons learned across stories. One rule per line, newest last. Keep under 100 lines.

- Write bundle/file checks as small Node scripts under `scripts/` (not grep one-liners) because they behave identically on macOS and ubuntu CI; ESLint only lints ts/tsx, Prettier does check `.mjs` (story 004).
- Make dist checks fail on an empty/missing `dist/` (require index.html + a .js file) so they cannot pass trivially (story 004).
- check-dist makes the lazy-chunk checks mandatory only once `scene3d/createBoardScene.ts` exists (else skipped with a note), so a story's check-dist change can land before its code without a vacuous or failing pass; verify such checks with a fake chunk in a scratch copy of `dist/` (story 009).
