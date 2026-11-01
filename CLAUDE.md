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
idea ─▶ product-owner ─▶ [GATE: hak approves story]
     ─▶ architect (+ ux-designer if UI) ─▶ developer ─▶ tester
     ─▶ reviewer ──CHANGES_REQUESTED──▶ developer (max 3 rounds, then escalate to hak)
              └─APPROVED─▶ tech-writer ─▶ [GATE: hak approves merge]
```

Story status (frontmatter `status:`) moves through:
`draft → ready → designed → in-progress → in-test → in-review → done`
(`blocked` at any point, with the reason in "Open questions").

Workflow entry points (skills in `.claude/skills/`):

- `/feature <idea>` — full pipeline for a new feature
- `/story <idea>` — only refine an idea into a story (no implementation)
- `/bug <description>` — reproduce with a failing test, fix, verify, review

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
- No `any`, no non-null `!` without a comment explaining why.

## Commands

```bash
npm run dev         # start dev server (http://localhost:5173)
npm run typecheck   # tsc --build
npm run lint        # eslint
npm run format      # prettier --write
npm test            # vitest (single run)
npm run test:e2e    # playwright (starts dev server itself)
npm run verify      # typecheck + lint + unit tests + build — must be green before review
```
