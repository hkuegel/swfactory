# devops memory

Lessons learned across stories. One rule per line, newest last. Keep under 100 lines.

- Write bundle/file checks as small Node scripts under `scripts/` (not grep one-liners) because they behave identically on macOS and ubuntu CI; ESLint only lints ts/tsx, Prettier does check `.mjs` (story 004).
- Make dist checks fail on an empty/missing `dist/` (require index.html + a .js file) so they cannot pass trivially (story 004).
