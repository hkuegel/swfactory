# Software Factory

A TypeScript/React app built by a team of Claude Code agents, each owning one role in
the development process: product owner, architect, UX designer, developer, tester,
reviewer, DevOps and tech writer. See [CLAUDE.md](CLAUDE.md) for the process and
conventions, and [`.claude/agents/`](.claude/agents/) for the role definitions.

## Getting started

Requires Node.js 20+ (see `.nvmrc`).

```bash
npm install
```

```bash
npx playwright install chromium
```

```bash
npm run dev
```

## Working with the factory

Open Claude Code in this folder and use:

| Command                | What happens                                                 |
| ---------------------- | ------------------------------------------------------------ |
| `/story <idea>`        | Product owner writes a story with acceptance criteria        |
| `/feature <idea>`      | Full pipeline: story → design → build → test → review → docs |
| `/bug <description>`   | Reproduce with a failing test → fix → verify → review        |
| `/rebuild [up-to NNN]` | Regenerate the app from the backlog on a fresh branch        |

You approve at two gates: after the story is written (the story is then committed), and
before the code is committed, where you also decide which retro proposals to apply.
You can also call any role directly, e.g. "ask the architect how we should handle routing".

### Keeping track and rebuilding

Every feature is a story file in `docs/backlog/` holding your original request, the
acceptance criteria, a log of your decisions, the designs, the test report and the
review. The index is `docs/backlog/README.md`. `/rebuild` replays all done stories in
order on a new branch and checks the result against the original end-to-end tests.

### How the agents learn

Each agent keeps its own lessons in `.claude/agent-memory/<agent>/MEMORY.md`, loaded
on every run. After each story a retro proposes improvements to the agents and
`CLAUDE.md`; you decide which ones are applied. All of it is in git, so you can review
and revert what the agents learned.

## Project layout

```
.claude/agents/        role definitions (one subagent per role)
.claude/agent-memory/  lessons each agent learned, per role
.claude/skills/        /feature, /story, /bug, /rebuild workflows
docs/backlog/     user stories — the single source of truth per feature
docs/adr/         architecture decision records
docs/templates/   story and ADR templates
src/              the app (feature folders under src/features/)
e2e/              Playwright end-to-end tests
```

## Scripts

| Script             | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `npm run dev`      | Dev server on http://localhost:5173            |
| `npm test`         | Unit and component tests (Vitest)              |
| `npm run test:e2e` | End-to-end tests (Playwright)                  |
| `npm run verify`   | Typecheck, lint, format check, tests and build |
| `npm run format`   | Format all files with Prettier                 |
