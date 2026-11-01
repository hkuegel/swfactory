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
- src/components/ was empty at story 001; only Counter in src/features/counter exists. Check again before inventing shared components.
