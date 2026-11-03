# Software Factory

This repo is a **software factory**: a TypeScript/React product built by a team of
specialised Claude Code subagents (`.claude/agents/`), each owning one role in the
development process. The main Claude session acts as the **orchestrator** — it
never skips a role and hands work from one agent to the next via files in `docs/`.

The human (hak) is the **sponsor**: approves scope, answers open questions and
approves merges.

## Roles

| Agent           | Role                        | Owns / writes                                            |
| --------------- | --------------------------- | -------------------------------------------------------- |
| `product-owner` | Requirements, user stories  | `docs/backlog/*.md` (story, acceptance criteria)         |
| `architect`     | Technical design, decisions | "Technical design" section of the story, `docs/adr/*.md` |
| `ux-designer`   | UI structure, states, a11y  | "UX design" section of the story                         |
| `developer`     | Implementation + unit tests | `src/**`                                                 |
| `tester`        | Verification against ACs    | `src/**/*.test.ts(x)`, `e2e/**`, "Test report" section   |
| `reviewer`      | Code + security review      | "Review" section of the story (read-only on code)        |
| `devops`        | Build, CI/CD, tooling       | `package.json` scripts, configs, `.github/workflows/`    |
| `tech-writer`   | User/dev documentation      | `README.md`, `CHANGELOG.md`, `docs/**` (non-story)       |

Subagents cannot call each other — only the orchestrator delegates. Pass each agent
the story file path; the story file is the single source of truth for a feature.

## Process

```
idea ─▶ product-owner ─▶ [GATE 1: hak approves story → story committed on main]
     ─▶ architect (+ ux-designer if UI) ─▶ developer ─▶ tester
     ─▶ reviewer ──CHANGES_REQUESTED──▶ developer (max 3 rounds, then escalate to hak)
              └─APPROVED─▶ tech-writer ─▶ retro ─▶ [GATE 2: hak approves retro proposals + commit]
```

Story status (frontmatter `status:`) moves through:
`draft → ready → designed → in-progress → in-test → in-review → done`
(`blocked` at any point, with the reason in "Open questions"; `superseded` when a
newer story replaces it).

Workflow entry points (skills in `.claude/skills/`):

- `/feature <idea>` — full pipeline for a new feature
- `/story <idea>` — only refine an idea into a story (no implementation)
- `/bug <description>` — reproduce with a failing test, fix, verify, review
- `/rebuild [up-to NNN]` — regenerate the domain code from the backlog on a fresh branch,
  starting from the `base` tag

## Baseline

The git tag **`base`** marks the infrastructure baseline: the factory, the toolchain
(tests, CI, dist check) and the technical login (stories 001 Google sign-in and 004
guest sign-in) — no domain code. Everything after `base` is domain functionality.
`/rebuild` keeps the baseline and replays only the stories done after it. Move the tag
only on hak's explicit decision.

## Traceability

The backlog must be enough to rebuild the app without any chat history:

- **Original request** — hak's words, verbatim, in every story.
- **Decision log** — every answer and correction from hak, appended, never edited.
- **Links** — `supersedes:` / `superseded-by:` when a story replaces another,
  `changes: [NNN/ACx]` when it modifies parts of one. Rebuilds replay the stories done
  after `base` in id order and skip `superseded` ones.
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

- **Stories:** `docs/backlog/NNN-short-slug.md`, created from `docs/templates/story.md`.
  Acceptance criteria are numbered `AC1, AC2, …` in Given/When/Then form; tests
  reference them in their names (e.g. `it('AC2: shows an error when …')`).
- **ADRs:** `docs/adr/NNNN-title.md` from `docs/templates/adr.md`, for any decision
  that's costly to reverse (new dependency, state management, API contract, …).
- **Branches:** one per story, `feature/NNN-slug` or `fix/NNN-slug`. Agents never
  commit, push or merge unless hak says so.
- **Definition of Done:** all ACs covered by passing tests, `npm run verify` green,
  reviewer verdict APPROVED, README/CHANGELOG updated where user-visible.

## Tech stack

- React 19 + TypeScript (strict), built with Vite
- Vitest + Testing Library (unit/component), Playwright (e2e)
- ESLint (flat config, typescript-eslint) + Prettier
- Styling: CSS Modules. No UI framework or state library without an ADR.

## Code layout

```
src/
  app/            app shell, routing, providers
  features/<name>/  feature-sliced code: components, hooks, api, tests colocated
  components/     shared, generic UI components
  lib/            framework-agnostic helpers
  test/           test setup and utilities
e2e/              Playwright specs
```

- Function components and hooks only; named exports; one component per file.
- Tests live next to the code: `Foo.tsx` + `Foo.test.tsx`.
- Query UI by role/label in tests (`getByRole`), not by test IDs or classes.
- **Test proportionality:** one test per AC at the cheapest level that shows it — usually
  one e2e test per AC (or per group of related ACs), which is also the `/rebuild` oracle.
  Unit tests only for logic with branches (reducers, mappings, parsing, timeouts); no
  component test that repeats what an e2e test already shows. Probes beyond the ACs are
  kept as tests only if they found a defect or cover a real risk (security, races);
  otherwise they're listed in the Test report as "checked, OK". The architect names the
  minimal test set in the Technical design. e2e specs assert an AC's intent, never
  design values (exact colours, pixel sizes) — those live in the tokens and their test.
- **Independent tests:** tests of one feature don't depend on another feature's layout or
  tab order — e.g. an auth test asserts that focus left the auth controls, not which game
  control it landed on. No counted Tab sequences and no raw coordinates of elements that
  may move: focus by role or Tab until the target has focus, and call
  `scrollIntoViewIfNeeded()` before raw input. Views with continuous motion are paused via
  their dev-only probe (or reduced motion) before any `click()`; click by coordinates only
  when the live motion itself is under test.
- **Time and randomness** never inside reducers: pass `now` or a seed in the action. e2e
  tests control time with Playwright `page.clock`; a dev-only hook only if that doesn't
  work.
- No `any`, no non-null `!` without a comment explaining why.
- **Render loops:** inline styles written from a render loop are also written when the
  loop doesn't run (forced colours, reduced motion, inactive scene) and on every
  re-attach.
- Optional props that receive CSS-module classes or refs are typed `prop?: T | undefined`
  (required under `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`).
- **Network timeouts:** every network call that keeps the UI in a progress state needs a
  timeout (AbortController + named constant) that ends in the error state — no UI state
  may stay pending forever. Only interactive steps (e.g. a provider popup) are exempt.
- **Dev-only code** must never reach a production build:
  - test fakes (e.g. the e2e sign-in fake) via
    `import.meta.env.DEV && import.meta.env.MODE === '<mode>'`;
  - dev-only features (e.g. "Sign in as guest") via `import.meta.env.DEV`;
  - in both cases written out literally at every use site — never a shared constant,
    runtime flag or env var alone — so Vite drops the code;
  - their identifying strings are added to the forbidden list in
    `scripts/check-dist.mjs` in the same change; `npm run verify` fails if they appear in
    `dist/`.
- **Styling:** colours, radii, type sizes and durations come from `src/app/tokens.css`
  (ADR 0004). No colour literals or `font-family` in CSS modules; dark mode only in the
  token file; every `transition` uses `var(--duration)`. Every state cue also exists as a
  border, outline or glyph, so it survives forced colours. `src/app/tokens.test.ts`
  enforces this over the CSS, with the contrast pairs the modules actually paint. Values
  derived from tokens are `calc()` over the token, never a hand-rounded number. Variant
  selectors (e.g. `[data-view]`) wrap their scoping part in `:where()`, so forced-colours
  and other override blocks still win. In rendered scenes (canvas, WebGL), contrast is
  checked on rendered pixels in e2e; passing token pairs are necessary, not sufficient.
- **Config:** `VITE_*` values are public (inlined into the bundle) — never put secrets
  there. Per-developer values go in `.env.local` (gitignored), documented in `.env.example`.

## Commands

```bash
npm run dev         # start dev server (http://localhost:5173 — part of the Google OAuth origins)
npm run typecheck   # tsc --build
npm run lint        # eslint
npm run format      # prettier --write
npm test            # vitest (single run)
npm run test:e2e    # playwright: app in mode e2e on port 5174 with the fake sign-in, never real Google
npm run verify      # typecheck + lint + prettier check (incl. markdown) + unit tests + build
```
