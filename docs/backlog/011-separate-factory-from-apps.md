---
id: 011
title: Separate the software factory and shared platform code from the apps
status: ready # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: chore # feature | bug | chore
branch: feature/011-separate-factory-from-apps
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [] # stories whose behaviour this one modifies, e.g. [004/AC2, 007]
superseded-by: # set on the OLD story when a newer one replaces it
---

# 011 – Separate the software factory and shared platform code from the apps

## Original request

> genug mit minesweeper.
> können wir die software factory (+ gemeinsamen Code wie zb die google auth) von den apps die damit entwickelt wurden, trennen ?

(hak, 2026-11-03)

## User story

As the sponsor of the software factory, I want the factory and the shared platform code (sign-in, design tokens, app shell) kept apart from the apps built with it, so that I can start further apps on the same factory without carrying Minesweeper along and without copying the sign-in.

## Context

- Technical restructuring of this repo, not a game feature. No new user-visible behaviour except the page heading (each app sets its own, see Decision log).
- Feasibility check by the architect (2026-11-03): feasible as proposed; the precisions below are worded into the ACs. Consequences: the `base` tag now marks the pre-split baseline and is no longer a rebuild start; `.env.example` and `.env.local` live at the repo root, shared by all apps; the fps measurement moves into the Minesweeper app.
- Today the only seam between factory and game is the app shell, which shows the game after sign-in under the heading "Software Factory". The game takes only a seeded random helper from shared code. Factory files (agents, skills, templates) do not mention Minesweeper; some agent memories and the dev-only-code check and fps measurement scripts do.
- Decided (see Decision log): one repo with several workspaces (monorepo) instead of separate repos or a template repo. Proposed layout:

```
swfactory/
  CLAUDE.md, .claude/        factory: agents, skills, templates, agent memories
  docs/adr, docs/backlog     platform ADRs (0001-0004) and platform stories (001-004)
  packages/platform/         shared code: Google + guest auth, e2e sign-in fake, app shell
                             (login -> app content as children), design tokens, Button, lib/
  apps/minesweeper/          src/, e2e/, own backlog (005-010), ADR 0005, three.js dependency
  apps/<next-app>/           created with a new /new-app skill
```

- Reasons: retro lessons apply to all apps at once, no package publishing cycle, the platform can later move to its own repo or package.
- Story 010 stays `ready` and is not started ("genug mit minesweeper").
- The headings "Software Factory" appear only in the design sections of 001, 004, 005 and 007, not in any AC, so no `changes:` link is needed; each app now sets its own heading (Minesweeper shows "Minesweeper").

## Acceptance criteria

- **AC1:** Given the restructured repo, when the Minesweeper app is started and the existing e2e tests of stories 001-009 are run, then they all pass with unchanged intent (Google sign-in with the fake, guest sign-in, 2D game, presets and timer, redesign, 3D mode and upgrade). The only edits to existing specs are the heading and title assertions (smoke e2e, auth e2e, app unit test: the page shows "Minesweeper" instead of "Software Factory") and moved paths or config.
- **AC2:** Given the repo, when the shared platform code (Google and guest sign-in, e2e sign-in fake, app shell, design tokens, shared button, shared helpers) is inspected, then it exists once in a single shared package that apps consume, that package contains no reference to Minesweeper or any other app and imports nothing from an app, and no app contains its own copy of the sign-in, shell or tokens. Generic tokens live in the platform; app-specific tokens (cell, scene and number colours of Minesweeper) live in the app and extend them; the token test is split the same way: a generic test over the platform and app CSS, the scene-parity checks in the app. No app has its own copy of the generic tokens.
- **AC3:** Given a fresh checkout, when `npm install` and `/new-app <name>` are run (a skill that copies an app skeleton), then a new app exists that, without any change to the Minesweeper app, starts with working Google sign-in, guest sign-in (dev only), the e2e sign-in fake, the design tokens and the verify and e2e toolchain, shows its own content after sign-in, and its tests pass; the skeleton has its own smoke unit test and e2e; the README explains the layout and this skill.
- **AC4:** Given the repo, when `CLAUDE.md`, agent definitions, skills and templates are searched for app names (Minesweeper), then there are no hits (`.claude/agent-memory/**` is exempt: memories keep story numbers as sources); and platform stories (001-004) and platform ADRs (0001-0004) are in the root docs, while the Minesweeper stories (005-010), ADR 0005, e2e tests and app-specific docs are inside the Minesweeper app; the platform sign-in e2e specs (smoke, auth, auth-guest) belong to the platform and every app runs them; the backlog README still lists every story with a working link.
- **AC5:** Given the repo root, when `npm run verify` and `npm run test:e2e` are run, then they cover the platform and all apps and fail if any of them fails; and when run for one app only, then only that app (plus the platform it uses) is checked.
- **AC6:** Given a production build of any app, when the dev-only-code check runs, then it fails if any dev-only or test-fake string (e.g. the e2e sign-in fake, "Sign in as guest") appears in that app's build output, and passes for a clean build; a newly created app (AC3) is covered by the platform's dev-only strings without editing the check; app-specific strings and budgets (3D probe, three.js scene budget) are declared in the app.
- **AC7:** Given the app skeleton, the current platform and an app's backlog, when `/rebuild` is run for that app, then it regenerates that app from the skeleton plus the current platform, replaying that app's done stories in id order and skipping superseded ones. Verified by a dry run of the rebuild skill's selection steps (expected replay list for Minesweeper: its done stories minus superseded ones) and a green `verify` of a fresh skeleton, not by a full rebuild.

## Out of scope

- Any change to game behaviour, look or 3D, and starting story 010.
- Moving the platform to its own repo or publishing it as a package.
- A second real app beyond the one created to prove AC3 (if one is created at all, it is not kept unless hak says so).
- Stories 002 (Microsoft login) and 003 (stay signed in) stay `draft` and are not started.
- Deployment of apps.

## Open questions

None. All former open questions are answered, see Decision log.

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-03 — Q: Separate factory and apps as a monorepo with npm workspaces (platform package + apps), instead of separate repos or a template repo? Also finish story 009 first? — A: "Ja, inkl. 009-Abschluss" (hak). The 009 part only meant finishing story 009 first; that is done.
- 2026-11-03 — Scope decision: story 010 stays `ready` and is not started ("genug mit minesweeper") (hak, via orchestrator).
- 2026-11-03 — Open questions 1-7 were proposed as defaults only; hak confirmed them at gate 1 (entries below).
- 2026-11-03 — Q1: How do `/rebuild` and the `base` tag work per app? Default: a rebuild of an app starts from the app skeleton plus the current platform and replays only that app's backlog; per-app tags only if needed. — A: "Ja, alles" (hak, gate 1). Consequence: the `base` tag now marks the pre-split baseline and is no longer a rebuild start.
- 2026-11-03 — Q2: Story numbering global or per app? Default: global, so existing links stay valid; app stories move to `apps/<app>/docs/backlog/`; the root backlog README keeps one table listing all stories. — A: "Ja, alles" (hak, gate 1).
- 2026-11-03 — Q3: Google OAuth client and dev ports? Default: one shared client ID in a root `.env.local`; every app's dev server on 5173, one at a time, so no new Google origins; e2e port stays 5174 per app run. — A: "Ja, alles" (hak, gate 1). Consequence: `.env.example` and `.env.local` at the repo root, shared by all apps.
- 2026-11-03 — Q4: Does each app set its own page heading and title? Default: yes, the app passes its title to the shell (Minesweeper shows "Minesweeper"). — A: "Ja, alles" (hak, gate 1).
- 2026-11-03 — Q5: Which app does `npm run dev` at the root start? Default: `npm run dev -w apps/<name>`; root `dev` starts Minesweeper while it is the only app. — A: "Ja, alles" (hak, gate 1).
- 2026-11-03 — Q6: Files moved with `git mv` in one commit so history stays traceable? Default: yes. — A: "Ja, alles" (hak, gate 1).
- 2026-11-03 — Q7: Are agent memories exempt from the "no app names" check in AC4, and do the scripts become per-app? Default: yes, memories keep story numbers as sources and are exempt; the scripts become per-app or take the app as parameter. — A: "Ja, alles" (hak, gate 1). Consequence: `measure-fps` moves into the Minesweeper app.
- 2026-11-03 — AC precisions from the architect's feasibility check (AC1 spec edits limited to heading assertions and moved paths; AC2 generic vs app-specific tokens and split token test; AC3 `npm install` + `/new-app <name>` with skeleton tests; AC4 platform sign-in e2e specs owned by the platform, memories exempt; AC6 platform dev-only strings cover new apps, app-specific strings and budgets in the app; AC7 verified by dry run of selection steps plus green `verify` of a fresh skeleton) — A: "Ja, alles" (hak, gate 1).

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

## Implementation notes

_developer: what was built, deviations from the design and why._

## Test report

_tester: AC → test mapping, results, defects found._

| AC  | Test(s) | Result |
| --- | ------- | ------ |

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

## Retrospective

_orchestrator: what went wrong (review rounds, defects, corrections at the gates),
proposed changes to agents/CLAUDE.md/templates, and which ones hak approved._
