# Software Factory

This repo is a **software factory**: TypeScript/React apps built by a team of
specialised Claude Code subagents (`.claude/agents/`), each owning one role in the
development process. The factory (this file, `.claude/`, `docs/templates/`) and the shared
**platform** (`packages/platform/`: sign-in, app shell, design tokens) are kept apart from
the **apps** (`apps/<name>/`) built with them (ADR 0006). The main Claude session acts as
the **orchestrator** — it never skips a role and hands work from one agent to the next via files in `docs/`.

The human (hak) is the **sponsor**: approves scope, answers open questions and
approves merges.

## Roles

| Agent           | Role                        | Owns / writes                                                                               |
| --------------- | --------------------------- | ------------------------------------------------------------------------------------------- |
| `product-owner` | Requirements, user stories  | `docs/backlog/*.md`, `apps/*/docs/backlog/*.md` (story, acceptance criteria)                |
| `architect`     | Technical design, decisions | "Technical design" section of the story, `docs/adr/*.md`, `apps/*/docs/adr/*.md`            |
| `ux-designer`   | UI structure, states, a11y  | "UX design" section of the story                                                            |
| `developer`     | Implementation + unit tests | `packages/platform/src/**`, `apps/*/src/**`                                                 |
| `tester`        | Verification against ACs    | `**/*.test.ts(x)`, `**/e2e/**`, "Test report" section                                       |
| `reviewer`      | Code + security review      | "Review" section of the story (read-only on code)                                           |
| `devops`        | Build, CI/CD, tooling       | `package.json` scripts, configs, `scripts/`, `templates/app/`, `.github/workflows/`         |
| `tech-writer`   | User/dev documentation      | `README.md`, `apps/*/README.md`, `CHANGELOG.md`, `docs/**` and `apps/*/docs/**` (non-story) |

Subagents cannot call each other — only the orchestrator delegates. Pass each agent
the story file path; the story file is the single source of truth for a feature.

**Factory files** (`CLAUDE.md`, `.claude/agents`, `.claude/skills`, `docs/templates`)
change only through hak-approved retro proposals or an approved story AC. The orchestrator
assigns such edits (normally to `devops`) and reviews the diff before gate 2. A step that
can't be split into green steps may be given to one agent across roles; it's recorded in
the story's Implementation notes.

## Process

```
idea ─▶ product-owner ─▶ [GATE 1: hak approves story → story committed on main]
     ─▶ architect (+ ux-designer if UI) ─▶ developer ─▶ tester
     ─▶ reviewer ──CHANGES_REQUESTED──▶ developer (max 3 rounds, then escalate to hak)
              └─APPROVED─▶ tech-writer ─▶ explanation ─▶ retro ─▶ [GATE 2: hak approves retro proposals + commit]
```

Story status (frontmatter `status:`) moves through:
`draft → ready → designed → in-progress → in-test → in-review → done`
(`blocked` at any point, with the reason in "Open questions"; `superseded` when a
newer story replaces it).

Workflow entry points (skills in `.claude/skills/`):

- `/feature <idea>` — full pipeline for a new feature (platform or an app)
- `/story <idea>` — only refine an idea into a story (no implementation)
- `/bug <description>` — reproduce with a failing test, fix, verify, review
- `/new-app <name> [title]` — create a new app from the skeleton in `templates/app/`
- `/rebuild <app> [up-to NNN]` — regenerate one app from its backlog on a fresh branch,
  starting from the app skeleton and the current platform

## Baseline

The baseline is the **platform plus the toolchain**: the factory, `packages/platform/`
(Google and guest sign-in, e2e sign-in fake, app shell, design tokens, shared helpers), the
tests, CI, the dist check and the app skeleton `templates/app/` — no domain code. Apps
are everything under `apps/`. `/rebuild <app>` regenerates one app from the skeleton and the
current platform and replays only that app's done stories. The git tag **`base`** is
unchanged and marks the **pre-split** baseline (single-app layout, stories 001 and 004 as
the technical login); it is no longer a rebuild start. Move the tag only on hak's
explicit decision.

## Traceability

The backlog must be enough to rebuild the app without any chat history:

- **Original request** — hak's words, verbatim, in every story.
- **Decision log** — every answer and correction from hak, and every scope decision of
  the orchestrator (e.g. dropping a designed element), appended at once, never edited.
- **Links** — `supersedes:` / `superseded-by:` when a story replaces another,
  `changes: [NNN/ACx]` when it modifies parts of one. A rebuild replays an app's done
  stories in id order and skips `superseded` ones. When a story adds an option that changes
  earlier behaviour only while enabled, `changes:` lists every earlier AC that is false in
  the enabled state, and those ACs are annotated "holds while <option> is off".
- **Commit early** — the approved story is committed on `main` at gate 1, before any code.
- **Tests as oracle** — e2e tests named after ACs verify that a rebuild behaves the same.

## Learning

- **Agent memory** — each agent has `memory: project` and keeps its own lessons in
  `.claude/agent-memory/<agent>/MEMORY.md` (in git, so every lesson is reviewable
  and revertable). Role-specific lessons only.
- **Team knowledge** — lessons that apply to everyone go into this file or an ADR,
  never into one agent's memory. Agents propose them as "Suggested for CLAUDE.md".
- **Retro** — after each story the orchestrator analyses what went wrong and proposes
  concrete edits to agents, this file or the templates. Only hak-approved proposals
  are applied; agents never rewrite their own role files.

## Conventions

- **Stories:** `NNN-short-slug.md`, created from `docs/templates/story.md`, in
  `docs/backlog/` (platform) or `apps/<name>/docs/backlog/` (an app; frontmatter
  `app: platform | <name>`). Numbers are global across all backlogs; the root
  `docs/backlog/README.md` lists every story. Acceptance criteria are numbered
  `AC1, AC2, …` in Given/When/Then form; tests reference them in their names (e.g. `it('AC2: shows an error when …')`).
- **Story record:** from story 013 on, a done story has a `### Cost` table in its
  Retrospective (one row per agent run, orchestrator row "not measured" or "estimate"), a
  Review section that lists every item of the versioned `.claude/agents/reviewer-checklist.md`
  with its result, and a non-empty "Explanation" section (at most 15 lines of at most 120 characters, plain language;
  shown in German at gate 2). `npm run check:structure` enforces the Cost table and the
  Explanation for `status: done` stories with an id above 012.
- **ADRs:** `docs/adr/NNNN-title.md` (platform) or `apps/<name>/docs/adr/NNNN-title.md`
  (an app; numbers global) from `docs/templates/adr.md`, for any decision
  that's costly to reverse (new dependency, state management, API contract, …).
- **Branches:** one per story, `feature/NNN-slug` or `fix/NNN-slug`. Agents never
  commit, push or merge unless hak says so. Agents use only read-only git commands and
  `git mv`; they never stage, unstage, commit or reset.
- **Definition of Done:** all ACs covered by passing tests, `npm run verify` green,
  reviewer verdict APPROVED, README/CHANGELOG updated where user-visible.
- **Measurement scripts:** a script that measures or checks something (fps, sizes, …)
  first verifies that its scenario is non-vacuous (e.g. the game keeps running, something
  animates) before it reports a number.

## Tech stack

- React 19 + TypeScript (strict), built with Vite
- npm workspaces: `packages/platform` (shared code, consumed as source, never built) and
  `apps/*` (ADR 0006)
- Vitest + Testing Library (unit/component), Playwright (e2e)
- ESLint (flat config, typescript-eslint) + Prettier
- Styling: CSS Modules. No UI framework or state library without an ADR.

## Code layout

```
packages/platform/      shared code, imported as `@swfactory/platform` (ADR 0006)
  src/auth/             Google + guest sign-in, e2e sign-in fake
  src/shell/            app shell (title + children)
  src/components/       shared, generic UI components
  src/lib/              framework-agnostic helpers
  src/styles/           generic design tokens (tokens.css), base.css
  src/test/             test setup, shared token rules
  config/               createAppViteConfig(), createAppPlaywrightConfig()
  e2e/                  sign-in specs (smoke, auth, auth-guest); every app runs them
  dist-check.json       dev-only strings that no production build may contain
apps/<name>/            one app
  src/main.tsx          composes AuthProvider + AppShell title="…" + the app
  src/features/<name>/  feature-sliced code: components, hooks, api, tests colocated
  src/tokens.css        app-specific design tokens (extend the platform's)
  e2e/                  the app's Playwright specs
  docs/backlog, docs/adr  the app's stories and ADRs
  dist-check.json       the app's own dev-only strings and budgets (optional)
templates/app/          app skeleton, copied by /new-app (scripts/new-app.mjs)
scripts/                check-dist.mjs, check-structure.mjs, new-app.mjs
```

Platform code never names or imports an app (`npm run check:structure` fails on it). A
workspace's `src/` follows the same layout rules (feature-sliced, `components/`, `lib/`).

- Function components and hooks only; named exports; one component per file.
- Tests live next to the code: `Foo.tsx` + `Foo.test.tsx`.
- Query UI by role/label in tests (`getByRole`), not by test IDs or classes.
- **Test proportionality:** one test per AC at the cheapest level that shows it — usually
  one e2e test per AC (or per group of related ACs), which is also the `/rebuild` oracle.
  Unit tests only for logic with branches (reducers, mappings, parsing, timeouts); no
  component test that repeats what an e2e test already shows. Probes beyond the ACs are
  kept as tests only if they found a defect or cover a real risk (security, races);
  otherwise they're listed in the Test report as "checked, OK". The architect names the
  minimal test set in the Technical design; if a design has separate rules for the first and
  the last item (row, year), it includes the case where both are the same item (N = 1). e2e
  specs assert an AC's intent, never design values (exact colours, pixel sizes) — those live in the tokens and their test.
  Counters and state prove that code ran, not that pixels changed: every check of a visual
  effect includes at least one pixel or frame comparison, and logic that depends on real
  frame timing gets one real-loop test that proves the effect plays, not only that it ends.
  A pixel-diff tolerance is backed by the measured maximum noise (stated in a comment).
  Tests never write into DOM the app renders (e.g. live regions); they reset state through
  the UI or the clock. When existing cases are rerun for a new option, or a rule is
  mutation-checked, at least one case must actually move the result (a strict difference);
  inputs at a cap hide changes.
- **Independent tests:** tests of one feature don't depend on another feature's layout or
  tab order — e.g. an auth test asserts that focus left the auth controls, not which game
  control it landed on. No counted Tab sequences and no raw coordinates of elements that
  may move: focus by role or Tab until the target has focus, and call
  `scrollIntoViewIfNeeded()` before raw input. Views with continuous motion are paused via
  their dev-only probe (or reduced motion) before any `click()`; click by coordinates only
  when the live motion itself is under test. e2e specs look up table cells by their column
  header (header index or accessible name), never by position (`last()`, a fixed `nth`,
  `$`-anchored text), because later stories add columns. e2e helpers that find values by
  label (`dt` text, region name) are scoped to their region; `getByRole` matches `name` as a
  case-insensitive substring unless `exact: true` is set, and later stories add blocks with
  the same labels.
- **Shared e2e helpers:** an app's shared e2e helpers live in one `e2e/<app>.helpers.ts`
  that every spec imports; never copy them.
- **Time and randomness** never inside reducers: pass `now` or a seed in the action. e2e
  tests control time with Playwright `page.clock`; a dev-only hook only if that doesn't
  work.
- No `any`, no non-null `!` without a comment explaining why.
- **Generated code:** code that is copied or generated (e.g. `templates/app`) is exercised
  by `npm run verify`. Shared test helpers reject inputs that would make a test pass
  vacuously (blank names, empty lists).
- **Render loops:** inline styles written from a render loop are also written when the
  loop doesn't run (forced colours, reduced motion, inactive scene) and on every
  re-attach.
- Optional props that receive CSS-module classes or refs are typed `prop?: T | undefined`
  (required under `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`).
- **Text inputs with negatives:** an input whose allowed range includes negative values uses
  `inputMode="text"`; iOS numeric/decimal keypads have no minus key.
- **Money:** integer cents at module boundaries and string-based parsing of user input (no
  `parseFloat`); round only where the story's convention says, and derive the last part of a
  "parts sum to total" breakdown instead of rounding it separately.
- **Network timeouts:** every network call that keeps the UI in a progress state needs a
  timeout (AbortController + named constant) that ends in the error state — no UI state
  may stay pending forever. Only interactive steps (e.g. a provider popup) are exempt.
- **Dev-only code** must never reach a production build (checked per app):
  - test fakes (e.g. the e2e sign-in fake) via
    `import.meta.env.DEV && import.meta.env.MODE === '<mode>'`;
  - dev-only features (e.g. "Sign in as guest") via `import.meta.env.DEV`;
  - in both cases written out literally at every use site — never a shared constant,
    runtime flag or env var alone — so Vite drops the code;
  - their identifying strings are added to `dist-check.json` (`forbidden`) of the
    workspace that owns the code (`packages/platform/` for platform code, else the app) in
    the same change; `npm run verify` fails if they appear in an app's `dist/`
    (`scripts/check-dist.mjs`). The platform's strings cover every app, new ones included;
  - helpers used only by dev-only code (lookup tables, counters) live inside the guarded
    function, never at module level, because they survive tree-shaking and `check-dist`
    can't see them.
- **Styling:** colours, radii, type sizes and durations come from the generic tokens in
  `packages/platform/src/styles/tokens.css` and the app's own `apps/<name>/src/tokens.css`
  (ADR 0004, 0006); a token belongs to the platform iff a platform module reads it. No
  colour literals or `font-family` in CSS modules; dark mode only in the token files;
  every `transition` uses `var(--duration)`. Every state cue also exists as a
  border, outline or glyph, so it survives forced colours. The token test of the
  platform and of every app (`src/tokens.test.ts`, shared rules in
  `@swfactory/platform/test/tokenRules`) enforces this over the CSS, with the contrast pairs
  the modules actually paint. Values derived from tokens are `calc()` over the token, never a hand-rounded number. Variant
  selectors (e.g. `[data-view]`) wrap their scoping part in `:where()`, so forced-colours
  and other override blocks still win. In rendered scenes (canvas, WebGL), contrast is
  checked on rendered pixels in e2e; passing token pairs are necessary, not sufficient.
- **Config:** `VITE_*` values are public (inlined into the bundle) — never put secrets
  there. Per-developer values go in `.env.local` in the repo root (gitignored, shared by
  all apps), documented in `.env.example`.
- **Workspace tooling:** `prettier --check` inside a workspace needs
  `--ignore-path ../../.prettierignore` (it reads only the `.prettierignore` of its working
  directory, so it would check `dist/`); an app's `tsconfig.app.json` includes
  `../../packages/platform/src/vite-env.d.ts` (the `ImportMetaEnv` of `VITE_GOOGLE_CLIENT_ID`;
  a triple-slash reference in the platform fails lint).

## Commands

```bash
npm run dev         # dev server of the default app (root package.json) (http://localhost:5173 — part of the Google OAuth origins)
npm run dev -w apps/<name>          # dev server of one app (one at a time: port 5173)
npm run typecheck   # tsc --build, every workspace
npm run lint        # eslint (whole repo)
npm run format      # prettier --write
npm test            # vitest (single run), every workspace
npm run test:e2e    # playwright for every app: app in mode e2e on port 5174 with the fake sign-in, never real Google
npm run test:e2e -w apps/<name>     # one app's specs plus the platform's sign-in specs
npm run check:dist  # dev-only strings and budgets in every app's dist/ (after build)
npm run check:structure  # no app names in factory files/platform, no dead markdown links, every story listed once, index status = story status
npm run check:template   # unit tests + typecheck of the app skeleton templates/app (not a workspace)
npm run verify      # typecheck + lint + prettier check (incl. markdown) + structure + skeleton + unit tests + build + dist check
npm run verify -w apps/<name>       # that app plus the platform it uses
```
