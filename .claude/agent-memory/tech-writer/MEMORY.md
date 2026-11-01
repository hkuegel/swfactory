# tech-writer memory

Lessons learned across stories. One rule per line, newest last. Keep under 100 lines.

- Copy setup values (origins, ports, scopes, env keys) from the story's Technical design and the ADR, not from memory, before writing README setup steps (story 001).
- Say in the README that `VITE_*` values are public in the bundle, and never show a secret as a `VITE_` example (story 001).
- Name the dev port wherever a Google OAuth origin is listed, and remind that a port change needs a new origin (story 001).
- Say explicitly when a test command never touches external services and needs no client ID, e.g. `npm run test:e2e` with the fake sign-in (story 001).
- Write a known limitation as one README line that names the follow-up story; don't add a separate section for it (story 001).
- Use CHANGELOG "Added" for new capabilities and "Changed" for existing screens whose behaviour changed, e.g. content moved behind sign-in (story 001).
- Write tables and lists by hand in Prettier style; the user runs Prettier afterwards and the tech writer can't run it (story 001).
- Read the story's Implementation notes "Open points" and the Review for doc tasks; they name the README sections that are owed (story 001).
- Before writing, check `docs/` for developer docs besides ADRs and backlog; in story 001 none existed, so only README and CHANGELOG changed (story 001).
