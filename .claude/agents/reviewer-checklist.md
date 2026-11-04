# Reviewer checklist

Version: 2

How to use: work through every item in order. Result is `pass`, `fail` or `n.a.`. An `n.a.` needs the
condition at the end of the item to be true and a one-line reason in the story. A `fail` needs a
finding with severity in the Review section. Findings outside the list are still allowed.
How to change: only through a hak-approved retro proposal. Bump `Version`, never renumber or reuse
an id, append a line to "Changes" below. Retired ids stay in the file as `~~C7~~ retired in vN`.

## Correctness

- **C1** Every AC is met by the code: for each AC name the code path and the test that shows it. n.a. never. For a process story (only factory text files changed) name the file and the text that implements each AC instead of a code path and a test.
- **C2** Async flows: every non-interactive await in a pending-UI flow has a timeout (AbortController + named constant) that ends in the error state; a late callback cannot overwrite a success. n.a. when the diff has no network call or pending state.
- **C3** React state and effects: effect dependencies complete, cleanup on unmount, no stale closures, derived values not stored. n.a. when no hook or component logic changed.
- **C4** Imperative controllers and render loops: every path that writes inline styles or external state is also written when the loop does not run (forced colours, reduced motion, inactive scene) and on every re-attach (new game, mode switch). n.a. when no render loop or imperative controller changed.
- **C5** Time and randomness are never read inside reducers (`now` or a seed is passed in the action). n.a. when no reducer changed.
- **C6** Every failure path ends in a visible state or a logged error; no swallowed errors; a deliberate catch counts as handled only if it logs (e.g. `console.error`) or ends in a visible state. n.a. when the diff has no error handling or I/O.

## Security and dev-only

- **S1** No `dangerouslySetInnerHTML`, no unvalidated URL or user input reaching DOM, URL or query sinks. n.a. when no input or rendering code changed.
- **S2** No secrets in code, config or docs; `VITE_*` values are public only. n.a. when no config, env or auth code changed.
- **S3** New dependencies: ADR exists, trustworthy source, types installed with `-D`. n.a. when `package.json` dependencies are unchanged.
- **S4** Dev-only code and test fakes are guarded with `import.meta.env.DEV` (and the mode) written out at every use site, their strings are in the owning workspace's `dist-check.json`, and helpers outside the guard are not left in the production bundle (grep `dist/`). n.a. when no dev-only code was added.
- **S5** Copied or generated code (root `scripts/`, `templates/app/`, app-level `scripts/*.mjs`) is exercised by `npm run verify` or was run by hand by the reviewer; a sufficient hand run probes each failure path of a new check once (a deliberately bad input that must make it fail). n.a. when none was touched.

## Tests

- **T1** `npm run verify` run by the reviewer is green. n.a. never.
- **T2** Test proportionality: one test per AC at the cheapest level; no AC tested at several levels or the same code path twice; unit tests only for logic with branches. n.a. when no test changed.
- **T3** Tests would fail on a regression: no vacuous fixtures (blank names, empty lists, `''` defaults, size-mismatched pixel diffs), assertions on intent not design values. n.a. when no test changed.
- **T4** Test independence: no counted Tab sequences or raw coordinates of moving elements, motion paused before clicks, tests named after ACs. n.a. when no e2e spec changed.
- **T5** New logic with branches (reducers, mappings, parsing, timeouts, check scripts) has a test, or the story records why it has none. n.a. when the diff adds no such logic.

## Conventions

- **K1** Matches the Technical design; deviations are in Implementation notes; no dead code, duplication or speculative abstraction. n.a. never.
- **K2** TypeScript rules of CLAUDE.md: no `any`, no `!` without a comment, optional props `?: T | undefined`, named exports, one component per file, tests next to the code. n.a. when no TypeScript changed.
- **K3** Styling rules: tokens only (no colour literals or `font-family`), `transition` uses `var(--duration)`, derived values are `calc()` over tokens, variant selectors in `:where()`, dark mode only in token files. n.a. when no CSS changed.
- **K4** Platform and factory files name and import no app (`check:structure` green); platform code is generic. n.a. when no platform or factory file changed.
- ~~K5~~ retired in v2 (split into K6 to K9).
- **K6** Story status and the index row in `docs/backlog/README.md` are correct and equal. n.a. when no story file or index changed.
- **K7** The Decision log has an entry for every answer or correction from hak and is append only. n.a. when no decision was made in this story.
- **K8** README and CHANGELOG are updated where the change is user-visible. n.a. when nothing user-visible changed.
- **K9** Markdown and all touched files pass prettier (`npm run verify`). n.a. never.
- **K10** Workspace tooling rule of CLAUDE.md: `prettier --check` inside a workspace uses `--ignore-path ../../.prettierignore`, and an app's `tsconfig.app.json` includes the platform's `vite-env.d.ts`. n.a. when no workspace script or tsconfig changed.
- **K11** `.env.example` documents every new `VITE_*` or other env variable, with no secret values. n.a. when no env variable was added or changed.

## Accessibility and UI

- **A1** Controls have role and accessible name, work by keyboard, focus is visible and managed (move, restore). n.a. when no control, focus, label or live region changed.
- **A2** Every state cue also exists as border, outline or glyph (survives forced colours); contrast checked for the pairs actually painted. n.a. when no UI or colour changed.
- **A3** Live regions mount before their content; reduced motion is honoured. n.a. when no UI, animation or announcement changed.
- **A4** Rendering cost: no per-frame allocation or whole-buffer uploads, no leak of GPU or listener resources across repeated attach (count them). n.a. when no render loop or canvas changed.

## Changes

- 1 (2026-11-04): first version.
- 2 (2026-11-04): C1 process-story variant; K5 retired and split into K6 to K9; new T5, K10, K11; S5 defines a sufficient hand run.
