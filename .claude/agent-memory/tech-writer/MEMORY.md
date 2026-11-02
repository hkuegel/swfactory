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
- Check the Test report's "Manual check results" before writing setup steps; hak's real setup overrode the design (publishing needs a homepage and privacy URL, so keep "Testing" with test users locally) (story 001).
- Don't write Google Cloud steps as exact menu names; name the console page URL and the field, and say when a label may differ (story 001).
- For dev-only features, say where they are absent (build, preview, deploy) and name the build check that enforces it (story 004).
- Keep Scripts table column widths in sync when a command name gets longer; re-pad the whole table (story 004).
- Describe controls per cell state from the UX Interactions table: a click on a flagged cell does nothing, flags come off by right-click, long-press or F (story 005).
- Document keyboard extras only if the Implementation notes say they were built (Home/End were optional in UX and built in story 005).
- Don't name planned follow-up stories (e.g. best times) in CHANGELOG or README; document only what exists (story 005, reworded in 006).
- Cite the id of the story that built a change in CHANGELOG, even when it was split off from an earlier story (story 006 split from 005).
- Take README feature text from the ACs and the Implementation notes "Built" list; skip Test report probes and review nits, which are not user-facing (story 006).
- Keep CHANGELOG lines user-facing: name the look and the behaviour, not internal terms like "design tokens" or ADR numbers; put those in the README developer note (story 007).
- Point README links only at files that exist: check the ADR path with Glob before linking it (story 007).
- Describe a restyle with no behaviour change as one "Changed" entry with the story id, not one bullet per visual feature (story 007).
