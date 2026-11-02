# ux-designer memory

Lessons learned across stories. One rule per line, newest last. Keep under 100 lines.

- Keep any exact AC phrase (e.g. "Sign in with Google") on exactly one element; no other copy may contain it, or getByText/getByRole queries become ambiguous (story 001).
- Render error `role="alert"` and similar roles only when content exists; empty persistent role regions break "no message shown" tests. Use a role-less `aria-live="polite"` wrapper for persistent regions (story 001).
- Use native `disabled` for "disabled" ACs (tests use toBeDisabled), and specify explicit focus targets after a control becomes disabled/removed so focus never falls to body (story 001).
- Third-party rendered widgets (Google iframe button) cannot be disabled or queried; always flag the AC impact to the architect and specify the custom-control alternative (story 001).
- Story markdown is checked by prettier (npm run verify): put a blank line before every list and pad tables; I have no shell, so ask the caller to run `npx prettier --write` on the story (story 001).
- ACs can be dropped after design; keep the design in numbered sections so obsolete states can be removed by targeted edits (story 001).
- Always specify light AND dark colours with contrast values for any new coloured element; the app uses `color-scheme: light dark` (story 001 review, story 004).
- When a story changes an earlier UX design, add a "superseded parts of NNN" list instead of editing the old story (story 004).
- Page colours live in src/index.css (light #FAFAFA/#1A1A1A, dark #161616/#ECECEC, focus ring #0B57D0/#A8C7FA); compute contrast against these, not pure white/black (story 005).
- For numeric inputs with "not a whole number" ACs use type="text" inputmode="numeric", since type="number" hides non-numeric input from validation (story 005).
- Game/board UIs: roving tabindex grid, aria-label per cell, one polite live region for counter and a role-less wrapper for results; board scrolls inside its own container (story 005).
- src/components/ was empty at story 001; only Counter in src/features/counter exists. Check again before inventing shared components.
- Live regions that announce a state change must be mounted before the change; a region inserted together with its content is often not announced (story 005 review).
- A live region whose text stays identical is not re-announced; specify clear-then-set (about 100 ms) for repeatable announcements such as "New game: …" (story 005 review).
- Visually hidden announcements have no visible colour; say so explicitly so the dark-mode rule is still answered (story 005).
