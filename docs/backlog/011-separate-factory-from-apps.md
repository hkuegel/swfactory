---
id: 011
title: Separate the software factory and shared platform code from the apps
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
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

- **AC1:** Given the restructured repo, when the Minesweeper app is started and the existing e2e tests of stories 001-009 are run, then they all pass with unchanged intent (Google sign-in with the fake, guest sign-in, 2D game, presets and timer, redesign, 3D mode and upgrade). The only edits to existing specs are the heading and title assertions (smoke e2e, auth e2e, app unit test: the page shows "Minesweeper" instead of "Software Factory") and moved paths or config, plus the platform specs' app-specific assertions (heading, Start, board) replaced by the app's `signedInContent`.
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
- 2026-11-03 — Gate 2: apply all four retro proposals (incl. widening AC1 to cover the `signedInContent` parameterisation, intent unchanged) and commit. — A: "Ja, alles" (hak, gate 2) = as proposed. Consequence: AC1 reworded; status done.

<!-- Sections below are filled in by later roles. Don't delete headings. -->

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

## Technical design

Design basis: ADR [0006](../adr/0006-monorepo-npm-workspaces-platform-as-source.md) (monorepo, platform consumed as source). No UX design is needed: the only UI change is the page heading (below). A spike on 2026-11-03 (throwaway copy of the repo in the scratchpad, since deleted) validated the load-bearing assumptions; its result is the first subsection.

### Spike result (dev-only guards, tooling)

Throwaway copy with the target layout: platform code in `packages/platform`, Minesweeper in `apps/minesweeper`, thin `vite.config.ts` / `playwright.config.ts` calling config helpers exported by the platform, workspace symlinks, no build step for the platform.

| Check                                                                                                                                                                  | Result                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vite build` of the app; grep `dist` for `Sign in as guest`, `__fakeGoogle`, `__minesweeperMines`, `__board3dProbe`                                                    | **0 hits for all four.** The guards living in `packages/platform` are dropped by the app's build. Entry chunk 80 kB gzip, lazy scene chunk 142 kB gzip, as before.       |
| Control: `NODE_ENV=development vite build --mode e2e`, same grep                                                                                                       | Hits for `Sign in as guest`, `__fakeGoogle`, `__minesweeperMines` (so the grep sees them, and `DEV` is what removes them).                                               |
| Real `VITE_GOOGLE_CLIENT_ID` from the root `.env.local` with `envDir` pointing at the repo root, set in the platform's config helper (loaded by Vite's config bundler) | Inlined into the app bundle. The helper's `import.meta.url` works inside the bundled config.                                                                             |
| Dev server in mode `e2e` on 5174, started by the platform's Playwright helper; moved `auth`, `auth-guest`, `smoke` specs                                               | 41 of 41 pass once the heading assertions were adapted. A second Playwright project with its own `testDir` inside `packages/platform/e2e` runs against the app's server. |
| Vitest in both workspaces with the shared setup file imported as `@swfactory/platform/test/setup`                                                                      | Platform: 12 files, 119 tests pass. App: 76 of 77 pass; the one failure reads the old `src/app/tokens.css` path (expected, handled by the token split).                  |
| `tsc --build` with non-composite workspace projects, app program following imports into the platform source                                                            | Green; the app program contains 25 platform files; no TS6307. ESLint with the root config: clean.                                                                        |

Findings that shape the design:

1. **The root `package.json` needs the `workspaces` key.** Without it Vitest's `server.fs` refuses to load the shared setup file from outside the app root (`Cannot find module '/@fs/…/setup.ts'`).
2. **Importing a moved module changes relative depth**: `auth/…` moves from `features/auth` (depth 2) to `src/auth` (depth 1), so `../../lib` and `../components` imports change.
3. **Heading collision:** the app title `Minesweeper` (h1) and the game's own h2 `Minesweeper` both match `getByRole('heading', { name: 'Minesweeper' })` after sign-in (strict-mode violation). `minesweeper.spec.ts:87` already uses `level: 2`; the specs listed in "Test plan" must too.
4. **The platform's auth e2e specs assert Minesweeper content** (`auth.spec.ts:50-51,105`, `auth-guest.spec.ts:62,65`, `smoke.spec.ts:17-18`: heading, `Start`, board grid). They cannot stay in the platform as they are; they need an app-supplied probe (below).
5. **Not covered by the spike:** a real `npm install` of the workspace links (done by hand), `/new-app`, CI, ESLint node globals in nested `e2e` folders (config globs must be `**/…`).

### Heading and title behaviour

- `AppShell` takes `title: string` and renders it as the page's one `<h1>` in both the login view and the signed-in view (exactly where "Software Factory" is today). Nothing else in the shell changes.
- `apps/<name>/index.html` carries the static `<title>` (same text as the shell title; the skeleton fills both from one value). The shell does not touch `document.title`.
- Minesweeper: title `Minesweeper`. The game's own `<h2>Minesweeper</h2>` stays (out of scope).
- Platform e2e specs read the expected title from the app's Playwright config (option `appTitle`), so a leftover dev server of another app on port 5174 fails the heading assertion loudly instead of passing silently.

### Target tree (what moves where)

All moves with `git mv` (stage the renames before editing contents, so similarity detection keeps `git log --follow` working; for split files the larger half keeps the history).

```
swfactory/
  package.json              root: private, "workspaces": ["packages/*","apps/*"], aggregate scripts, toolchain devDependencies only
  package-lock.json         regenerated by `npm install`
  tsconfig.base.json        NEW  common strict options (from tsconfig.app.json, minus include/types/lib/jsx/tsBuildInfoFile)
  tsconfig.app.base.json    NEW  extends base: lib DOM, jsx react-jsx, types ["vite/client","@testing-library/jest-dom/vitest"]
  tsconfig.node.base.json   NEW  extends base: lib ES2023, types ["node"]
  eslint.config.js          globs widened to workspaces (see Configs)
  .env.example, .env.local  stay at the root (envDir), shared by all apps
  scripts/
    check-dist.mjs          REWRITTEN generic engine (see check-dist)
    check-structure.mjs     NEW  structure and link guard, part of verify
    new-app.mjs             NEW  copies templates/app, fills placeholders; also `--reset` for /rebuild
  templates/app/            NEW  app skeleton (see below)
  .claude/skills/new-app/SKILL.md   NEW
  packages/platform/
    package.json            NEW  "@swfactory/platform", private, type module, exports map, scripts (typecheck, lint, format:check, test, verify)
    tsconfig.json, tsconfig.app.json, tsconfig.node.json   NEW  (app: src; node: config, e2e, vite.config.ts)
    vite.config.ts          NEW  `createAppViteConfig()` for the platform's own Vitest run
    dist-check.json         NEW  {"forbidden": ["Sign in as guest", "__fakeGoogle"]}
    config/vite.ts          NEW  createAppViteConfig()
    config/playwright.ts    NEW  createAppPlaywrightConfig()
    e2e/fixtures.ts         NEW  `test` extended with the options appTitle, signedInContent
    e2e/auth.spec.ts        git mv e2e/auth.spec.ts       (assertions parameterised, see Test plan)
    e2e/auth-guest.spec.ts  git mv e2e/auth-guest.spec.ts (same)
    e2e/smoke.spec.ts       git mv e2e/smoke.spec.ts      (generic: title as h1, content after sign-in)
    src/index.ts            NEW  public barrel: AppShell, AuthProvider, createAuthClient, Button (+ types); starts with /// <reference path="./vite-env.d.ts" />
    src/vite-env.d.ts       git mv src/vite-env.d.ts  (ImportMetaEnv with VITE_GOOGLE_CLIENT_ID)
    src/auth/**             git mv src/features/auth/** (incl. fake/, google/; tests move with the code)
    src/components/Button.{tsx,module.css}   git mv src/components/*
    src/lib/{createDeferred,seededRandom}.ts (+ test)   git mv src/lib/*   (reached as @swfactory/platform/lib/<name>)
    src/shell/AppShell.tsx, AppShell.module.css          git mv src/app/App.tsx, App.module.css (renamed, gets title/children)
    src/shell/AppShell.test.tsx, AppShell.google.test.tsx  git mv src/app/App.test.tsx, App.google.test.tsx (stub children; no Minesweeper board assertion)
    src/styles/tokens.css   git mv src/app/tokens.css, then remove the app-specific tokens (see Token split)
    src/styles/base.css     git mv src/index.css
    src/test/setup.ts       git mv src/test/setup.ts
    src/test/tokenRules.ts  NEW  shared token rules engine (extracted from tokens.test.ts)
    src/styles/tokens.test.ts   NEW  generic half of src/app/tokens.test.ts, run over the platform CSS
  apps/minesweeper/
    package.json            NEW  "@swfactory/minesweeper": deps react, react-dom, @swfactory/platform "*", three; devDeps @types/three; scripts below
    tsconfig.json, tsconfig.app.json, tsconfig.node.json   NEW
    vite.config.ts          git mv vite.config.ts, now `createAppViteConfig({ optimizeDeps…three…, build.chunkSizeWarningLimit })`
    playwright.config.ts    git mv playwright.config.ts, now `createAppPlaywrightConfig({ title: 'Minesweeper', signedInContent: {role:'grid', name:'Minesweeper board'}, extraProjects: [chromium-3d], launchArgs: SwiftShader })`
    dist-check.json         NEW  forbidden ["__minesweeperMines","__board3dProbe"], lazyChunks [three scene, 180 kB gzip]
    index.html              git mv index.html, <title>Minesweeper</title>
    public/                 git mv public/
    scripts/measure-fps.mjs git mv scripts/measure-fps.mjs; script `measure:fps` moves into the app's package.json
    src/main.tsx            git mv src/main.tsx, rewritten: AuthProvider + AppShell title="Minesweeper" wrapping <Minesweeper />; imports platform tokens.css, base.css, then ./tokens.css
    src/tokens.css          NEW  app tokens (see Token split)
    src/tokens.test.ts      NEW  app half of the token tests (scene parity, --board3d-fit, tint radius, scene literals, app contrast pairs, no-bypass over the app's CSS)
    src/features/minesweeper/**   git mv src/features/minesweeper/**  (SetupForm imports Button from '@swfactory/platform'; gameReducer/placeMines import '@swfactory/platform/lib/seededRandom'; geometry.test.ts reads ../../tokens.css)
    e2e/{minesweeper,minesweeper-3d,minesweeper-3d-scene,redesign}.spec.ts   git mv e2e/*
    docs/backlog/005…010-*.md   git mv docs/backlog/005…010-*.md
    docs/adr/0005-three-js-board-scene-with-dom-overlay.md   git mv docs/adr/0005-*
    README.md               NEW  game rules, 3D view, measure:fps (moved out of the root README by the tech-writer)
  docs/backlog/             001-004, 011, README.md (index of ALL stories, relative links into apps/*/docs/backlog/)
  docs/adr/                 0001-0004, 0006
  docs/templates/           story.md (new frontmatter field `app:`), adr.md
```

Deleted at the root after the moves: `src/`, `e2e/`, `index.html`, `public/`, `vite.config.ts`, `playwright.config.ts`, `tsconfig.app.json`, the old `tsconfig.node.json` and `tsconfig.json` contents (root `tsconfig.json` is removed; typecheck is per workspace), `scripts/measure-fps.mjs`. `three` and `@types/three` leave the root `package.json`. `.claude/launch.json` configurations become `npm run dev -w apps/minesweeper -- …` (ports unchanged).

`templates/app/` (app skeleton; placeholders `__NAME__` (slug) and `__TITLE__` only inside string literals or JSON values, so the files stay valid TS/JSON and pass lint and prettier as they are):

```
templates/app/package.json, index.html, vite.config.ts, playwright.config.ts,
  tsconfig.json, tsconfig.app.json, tsconfig.node.json, README.md
  public/favicon (copy of Minesweeper's public/ if generic)
  src/main.tsx            AuthProvider + AppShell title="__TITLE__" + <Content />
  src/Content.tsx         placeholder content: a labelled region "__TITLE__ content"
  src/Content.test.tsx    smoke unit test
  src/tokens.css          comment only (app tokens go here)
  src/tokens.test.ts      calls the shared token rules over the app's CSS
  docs/backlog/.gitkeep, docs/adr/.gitkeep
```

The skeleton has no e2e spec of its own: its Playwright config's `platform` project already runs the platform's `smoke`, `auth` and `auth-guest` specs against it (signedInContent = the placeholder region). That is the skeleton's e2e and proves the sign-in, fake, guest and shell.

### Types and contracts

```ts
// packages/platform/src/shell/AppShell.tsx
export interface AppShellProps {
  readonly title: string; // the page's h1, both views
  readonly children: ReactNode; // the app; rendered only when signed in
}
```

`AppShell` keeps everything `App` does today (SignedInHeader, `LoginView`, `useAuthFocus`, `styles.wide` when signed in) and replaces `<h1>Software Factory</h1>` by `<h1>{title}</h1>` and `<Minesweeper />` by `{children}`. The "presentation only, not access control" comment stays. `AuthProvider` and `createAuthClient()` stay as they are and are created in each app's `main.tsx` (outside React, once, ADR 0003).

```ts
// packages/platform/e2e/fixtures.ts
export interface SignedInContent {
  readonly role: Parameters<Page['getByRole']>[0];
  readonly name: string; // something only visible after sign-in
}
export interface AppOptions {
  appTitle: string;
  signedInContent: SignedInContent;
}
export const test = base.extend<AppOptions>({
  appTitle: ['', { option: true }],
  signedInContent: [{ role: 'main', name: '' }, { option: true }],
});
export { expect } from '@playwright/test';
```

```ts
// packages/platform/config/playwright.ts
export interface AppE2eOptions {
  title: string; // becomes appTitle
  signedInContent: SignedInContent;
  extraProjects?: readonly Project<AppOptions>[]; // e.g. Minesweeper's chromium-3d
  launchArgs?: readonly string[]; // e.g. the SwiftShader flags
}
export function createAppPlaywrightConfig(options: AppE2eOptions): PlaywrightTestConfig<AppOptions>;
// projects: `chromium` (testDir ./e2e of the app) + `platform` (testDir = packages/platform/e2e,
// use: appTitle, signedInContent) + extraProjects. Port 5174 const, webServer `npm run dev -- --mode e2e
// --port 5174 --strictPort`, reuseExistingServer: !CI, forbidOnly/retries/reporter as today.

// packages/platform/config/vite.ts
export function createAppViteConfig(overrides?: ViteUserConfig): ViteUserConfig;
// plugins [react()], envDir = repo root, resolve.dedupe react/react-dom, test: jsdom,
// setupFiles ['@swfactory/platform/test/setup'], include src/**/*.test.{ts,tsx},
// css.modules.classNameStrategy 'non-scoped'; overrides merged with mergeConfig (not spread).
```

```jsonc
// <package>/dist-check.json (optional per app; required shape when present)
{
  "forbidden": ["__minesweeperMines", "__board3dProbe"],
  "lazyChunks": [
    {
      "marker": "THREE.WebGLRenderer", // literal that identifies the chunk
      "entry": "src/features/minesweeper/scene3d/createBoardScene.ts", // relative to the app; once it exists the chunk is mandatory (no vacuous pass)
      "gzipMaxKb": 180,
    },
  ],
}
```

Token rules shared module (`@swfactory/platform/test/tokens`, exported in `exports`; test-only, never imported by production code). Suggested API (the developer may shape it, but the rules are fixed):

```ts
export type Tokens = ReadonlyMap<string, string>;
export interface Scheme {
  light: Tokens;
  dark: Tokens;
}
export function parseTokens(css: string): Scheme; // :root + @media (prefers-color-scheme: dark)
export function withBase(base: Scheme, extension: Scheme): Scheme; // dark = base.dark + ext.dark, same for light
export function parityProblems(scheme: Scheme): string[]; // colour tokens classified by VALUE (hex / rgb()), not by name prefix
export function contrastProblems(scheme: Scheme, pairs: readonly Pair[]): string[];
export function bypassProblems(cssByPath: Readonly<Record<string, string>>): string[]; // the old AC2/AC6 rule set
export function undefinedVarProblems(cssByPath, defined: Tokens): string[]; // every var(--x) is defined
export function readCss(srcDir: string): Record<string, string>; // key = path below the workspace
```

Rules that must hold (they are today's rules, now per workspace): light and dark define the same colour tokens; opaque 6-digit hex for contrast-tested tokens; contrast pairs in both schemes; no colour literal, `font-family`, own `prefers-color-scheme`, free `border-radius`, free `transition`/`animation` outside `tokens.css` (and `base.css` for the reduced-motion reset); the sign-in spinner file switches its animation off under reduced motion (platform test). New: every `var(--x)` in **platform** CSS is defined in the platform's `tokens.css` (this is what keeps app tokens out of the platform, AC2); in an app, `var(--x)` must be defined in platform or app tokens.

### Token split

- A token belongs to the platform iff a platform CSS module or `base.css` reads it; otherwise to the app. Decide with `grep -rn "var(--x)"`; the platform test above then fails on any wrong placement.
- Expected platform tokens: surfaces/text/edge, accent/danger/success/disabled, focus, `--google-*`, shadows, spacing, `--radius-control/well/panel`, `--control-height`, `--focus-width`, `--page-pad`, `--panel-border`, `--panel-pad`, type, motion, `color-scheme`, their dark values, the reduced-motion block and the 600 px block for the shell tokens.
- Expected app tokens (`apps/minesweeper/src/tokens.css`): `--cell-*`, `--scene-*` (colours and look numbers), `--n1…--n8`, `--board3d-*`, `--radius-cell`, `--cell-gap`, `--tile-lip`, `--well-pad`, `--well-border`, `--board-chrome`, with their own `@media (prefers-color-scheme: dark)` and `@media (min-width: 600px)` blocks. Values are moved unchanged; `--board-chrome` keeps reading the platform's `--page-pad`, `--panel-border`, `--panel-pad`.
- `main.tsx` imports `tokens.css`, `base.css`, then the app's `./tokens.css`, so the app block can override or extend and the dark block order stays valid.
- Contrast `PAIRS`: generic pairs (text/muted/accent/edge/focus/danger/success/google on surface/page/input/accent-subtle/danger-bg/success-bg) stay in the platform test; every pair that mentions a `--cell-*`, `--n*` or `--scene-*` token goes to the app test, evaluated over the merged scheme.
- The app test keeps `--board3d-fit` vs `boardMargins`, scene token existence and look-number range, `--scene-revealed-top` equals `--cell-revealed-fill`, overlay tint radius vs `TILE_RADIUS`, and "no colour literals in scene3d". `geometry.test.ts` reads `--board3d-cell-min` from the app's own `tokens.css`.

### Data flow and state ownership

Unchanged by the story. Auth state stays in `AuthProvider` (reducer, ADR 0003) inside the platform; each app creates the `AuthClient` once in `main.tsx` and passes it in; the shell reads it through `useAuth()`. The game state stays in the Minesweeper reducer. The only new data path is the title: `main.tsx` → `AppShell` prop → `<h1>`.

### Configs

- **Root `package.json`:** `"workspaces": ["packages/*", "apps/*"]`. Scripts:
  - `dev`: `npm run dev -w apps/minesweeper`
  - `build`, `typecheck`, `test`, `test:e2e`: `npm run <x> --workspaces --if-present` (sequential, so the e2e server on 5174 is never shared)
  - `lint`: `eslint .`, `format`: `prettier --write .`, `format:check`: `prettier --check .` (whole repo, incl. markdown)
  - `check:dist`: `node scripts/check-dist.mjs` (all apps), `check:structure`: `node scripts/check-structure.mjs`
  - `verify`: `typecheck && lint && format:check && check:structure && test && build && check:dist`
  - Root `devDependencies`: the current toolchain; `dependencies`: none (`react`, `react-dom` are declared by the apps and as `peerDependencies` of the platform).
- **Workspace scripts.** Platform: `typecheck` (`tsc --build`), `lint` (`eslint .`), `format:check` (`prettier --check .`), `test` (`vitest run`), `verify` (all four). App: `dev` (`vite`), `build` (`tsc --build && vite build`), `typecheck`, `lint`, `format:check`, `test`, `test:e2e` (`playwright test`), `check:dist` (`node ../../scripts/check-dist.mjs <name>`), `verify` = `npm run verify -w @swfactory/platform && typecheck && lint && format:check && test && build && check:dist`. So `npm run verify -w apps/<name>` checks that app plus the platform it uses (AC5); `npm run test:e2e -w apps/<name>` runs the app's specs plus the platform project.
- **TypeScript:** no project references between workspaces, none at the root (ADR 0006, option 5). Per workspace: `tsconfig.json` = `{ "files": [], "references": [app, node] }`; `tsconfig.app.json` extends `tsconfig.app.base.json` (include `src`, own `tsBuildInfoFile` under the workspace's `node_modules/.tmp`); `tsconfig.node.json` extends `tsconfig.node.base.json` (include `vite.config.ts`, `playwright.config.ts`, `e2e`, plus `config` in the platform). The platform's `src/index.ts` carries `/// <reference path="./vite-env.d.ts" />`, so an app's program gets `ImportMetaEnv` without listing it (verify in step 3; fallback: the app's `tsconfig.app.json` includes the file).
- **Vite/Vitest:** `createAppViteConfig()` as above; each workspace's `vite.config.ts` is one line plus app overrides. The root has no Vite config.
- **Playwright:** `createAppPlaywrightConfig()` as above; the app keeps only its own extras (the `chromium-3d` project, which keeps `testMatch: 'minesweeper.spec.ts'` and `grep: /AC(6|8|9|10):/`, and the SwiftShader launch args).
- **ESLint:** one root flat config. `ignores` become `**/dist`, `**/coverage`, `**/playwright-report`, `**/test-results`; node-globals block becomes `['**/*.config.ts', '**/e2e/**/*.ts', '**/config/**/*.ts']`. `templates/app` is linted like everything else (it is valid TS).
- **Prettier:** root `.prettierrc` and `.prettierignore` unchanged (patterns `dist`, `coverage`, `playwright-report`, `test-results` already match at any depth). `npx prettier --write docs apps/*/docs README.md CHANGELOG.md apps/*/README.md` replaces `docs README.md CHANGELOG.md` in the `/feature` skill.
- **CI (`.github/workflows/ci.yml`):** keeps calling `npm ci`, `npm run verify`, `npm run test:e2e`; only the failure artifact path changes to `apps/*/playwright-report` and `apps/*/test-results`.
- **Env:** `.env.example` text says "copy to `.env.local` in the repo root"; `VITE_GOOGLE_CLIENT_ID` stays the only variable.

### check-dist redesign (AC6)

`scripts/check-dist.mjs [app…]` (default: every directory in `apps/` that has a `package.json`):

1. Load the forbidden strings from `packages/platform/dist-check.json` and, if present, `apps/<app>/dist-check.json`.
2. For each app: `apps/<app>/dist` must exist and contain `index.html` and a JS file (otherwise fail, "run build first"); scan every file for every forbidden string; fail on any hit with `apps/<app>/dist/…: "<string>"`.
3. For each `lazyChunks` entry of the app: its marker must not occur in the entry chunk (script/modulepreload files of `index.html`); if its `entry` file exists, a non-entry chunk with the marker must exist (no vacuous pass) and stay within `gzipMaxKb`. This is today's three.js logic, parameterised.
4. Print one `check-dist: ok` line per app.

A new app is covered with no edit: it is discovered by directory and inherits the platform strings (the sign-in fake and guest button are the only dev-only code it gets from the skeleton). Dev-only code an app adds itself must be listed in its `dist-check.json` in the same change (CLAUDE.md rule, enforced in review). Strings of `dist-check.json` files are the only place to maintain.

### check-structure (AC2, AC4)

`scripts/check-structure.mjs`, plain Node, exit 1 with a list on any violation:

1. App names = directory names in `apps/`. Whole-word, case-insensitive match of any app name in `CLAUDE.md`, `.claude/agents/**`, `.claude/skills/**`, `docs/templates/**`, `templates/**` and `packages/platform/**` (excluding `node_modules`, `dist`) fails. `.claude/agent-memory/**` is exempt. A generic app name such as "todo" can cause false positives: pick distinctive names or extend the script's exempt list in the same change.
2. Every relative markdown link in `docs/**` and `apps/*/docs/**` and the READMEs resolves to a file.
3. Every story file in `docs/backlog/` and `apps/*/docs/backlog/` is listed exactly once in `docs/backlog/README.md`, and story ids are unique across all backlogs.

### Factory files (paths, roles, rebuild)

Edited by `devops` in this story (hak's approval of the story; agents otherwise never edit their own role files):

- **CLAUDE.md:** Roles table, "Owns / writes" column: developer `packages/platform/**`, `apps/*/src/**`; tester `**/*.test.ts(x)`, `**/e2e/**`; architect also `apps/*/docs/adr/`; product-owner `docs/backlog/` and `apps/*/docs/backlog/`; tech-writer also `apps/*/README.md`. Workflow entry points: add `/new-app <name> [title]`; `/rebuild <app> [up-to NNN]`. "Baseline": the baseline is the platform plus the toolchain; the `base` tag is unchanged and now marks the **pre-split** baseline (single-app layout, stories 001, 004 as the technical login); it is no longer a rebuild start. "Conventions": stories and ADRs live in the root docs (platform) or `apps/<name>/docs/` (app), numbers global, template field `app: platform | <name>`. "Code layout": new tree (packages/platform, apps/*, templates/app, scripts). "Tech stack": add npm workspaces (ADR 0006). "Commands": `npm run dev` (Minesweeper), `-w apps/<name>` variants, `verify` / `test:e2e` aggregate, `check:structure`. "Styling": tokens in `packages/platform/src/styles/tokens.css` plus the app's `src/tokens.css`; rules enforced by the shared token test in the platform and in every app. "Dev-only code": `scripts/check-dist.mjs` reads `dist-check.json` (platform and per app). "Config": `.env.local` at the repo root.
- **Agent role files** (path references only): `architect.md` (code in `packages/platform/src` and `apps/<app>/src`, ADR/backlog locations), `developer.md` (`src/lib/` → the workspace's `src/lib/`; e2e belongs to the tester), `devops.md` (configs incl. `packages/platform/config/`, templates/app; boundary: no application code under `packages/*/src`, `apps/*/src`), `product-owner.md` (backlogs, next free number = max over all backlogs + 1, row in the root README, `app:` field), `tester.md` (`apps/<name>/e2e`, `packages/platform/e2e`, `**/src/test/**`, run `-w apps/<name>`), `ux-designer.md` (reuse `packages/platform/src/components/` and the app's `src/`).
- **Skills:** `/feature` and `/story` (app question at gate 1: platform or which app; backlog path; prettier globs), `/bug` (e2e location), `/rebuild` (rewritten, below), `/new-app` (new). Templates: `docs/templates/story.md` gets `app:`; `docs/templates/adr.md` unchanged.
- **`/rebuild <app> [up-to NNN] [from: <tag|commit>] [stack: …]`:**
  1. Plan: clean tree on `main`; `apps/<app>/` exists. Replay list = stories in `apps/<app>/docs/backlog/` with `status: done`, sorted by id, skipping `superseded`, stopping at `up-to`. Platform stories are never replayed (the platform is the starting point). Empty list: stop. Show hak the list and effort, ask go / commit-per-story / `stack:` approval. (The `git show base:…` comparison is dropped; every app story is newer than any baseline.)
  2. Prepare: `git switch -c rebuild/<app>-<YYYY-MM-DD>`; save the oracle `git archive main apps/<app>/e2e | tar -x -C <scratchpad>/oracle`; reset the app to the skeleton: `node scripts/new-app.mjs <app> --reset` removes `apps/<app>/src`, `e2e` and `public` and copies the skeleton's versions (title read from the app's `index.html`); `package.json`, configs, `dist-check.json`, `docs/` stay from `main`. `npm install`; `npm run verify -w apps/<app>` must be green (the skeleton's own tests run).
  3. Replay each story as today (architect → developer → tester → reviewer, max 3 review rounds, optional commit `rebuild: story NNN – <title>`).
  4. Oracle: copy to `apps/<app>/e2e/oracle/`, `npm run test:e2e -w apps/<app> -- e2e/oracle`, remove it, report.
  - `from: base` still means the pre-split commit tree and is meant only for archaeology; the skill says so.
- **`/new-app <name> [title]`:** orchestrator runs `node scripts/new-app.mjs <name> --title "<title>"`, `npm install`, `npm run verify -w apps/<name>`, `npm run test:e2e -w apps/<name>`, and reports. It never touches another app. `new-app.mjs` rejects names not matching `^[a-z][a-z0-9-]*$` and existing directories (except with `--reset`).

### New dependencies

None. (`three` and `@types/three` only move from the root to the Minesweeper workspace.) ADR 0006 covers the structure.

### Risks and mitigation

| Risk                                                                                                      | Mitigation                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dev-only code leaks into a production build through the platform                                          | Spike proved the guards drop; keep the guards literal at every use site; `check-dist` over every `apps/*/dist` runs in `verify`; the tester repeats the control build (`NODE_ENV=development --mode e2e`), which must make the check fail. |
| Someone makes the platform a built package or adds project references later                               | ADR 0006 states why not; `exports` point at source.                                                                                                                                                                                        |
| `workspaces` key missing or `npm install` links not created (spike linked by hand)                        | Step 1 runs a real `npm install` and checks `node_modules/@swfactory/*` are symlinks; `@swfactory/platform` is declared as `"*"` in the app (satisfied by the local 0.1.0).                                                                |
| Wrong app tested through a leftover dev server on 5174                                                    | `reuseExistingServer` unchanged (as today); platform specs assert the app's own `appTitle`, so the mismatch fails loudly.                                                                                                                  |
| History lost by edit-and-move                                                                             | Stage `git mv` first, edit after; no content edits to a file in the same step that moves it where avoidable.                                                                                                                               |
| Broken relative links in moved stories (links from 005-010 to 001-004 and ADR 0004 now cross directories) | `check-structure` rule 2 fails on any dead link; fix them to the new relative paths in step 7.                                                                                                                                             |
| Token placement mistakes (a token read by the platform defined in the app)                                | The `undefinedVarProblems` rule for platform CSS fails the platform test.                                                                                                                                                                  |
| Platform specs hard-wire Minesweeper content                                                              | `signedInContent` and `appTitle` options set by each app's config (fixtures); no app name in platform specs (also caught by `check-structure` rule 1).                                                                                     |
| `import.meta.dirname`/`new URL(..., import.meta.url)` in config helpers not working in some loader        | Spike showed it works in Vite's config bundler and for the Playwright config; fallback `path.resolve(process.cwd(), '../../…')` relative to the workspace.                                                                                 |
| Platform code type-checked twice (own project, and inside each app)                                       | Accepted: about 2 s; same options via shared bases, so no divergence.                                                                                                                                                                      |
| CI e2e time grows with every app (platform specs run per app, ~30 tests)                                  | Accepted; apps run sequentially. Revisit with a second port and a matrix if it hurts.                                                                                                                                                      |

### Implementation plan (each step ends with `npm run verify` and, where noted, e2e green)

1. **devops: scaffold, no removals.** Root `workspaces` key; create `packages/platform/{package.json,tsconfig*,vite.config.ts,config/vite.ts,config/playwright.ts,e2e/fixtures.ts,src/index.ts}` and `apps/minesweeper/{package.json,tsconfig*}` (empty shells), the three `tsconfig*.base.json`; real `npm install`; check symlinks. The old root layout is untouched. Green: old `npm run verify` and `npm run test:e2e`.
2. **developer: extract the platform (the root app still exists).** `git mv` auth, components, lib, test setup, tokens (still whole), index.css to `base.css`, `App*` to `shell/AppShell*`; `AppShell` gets `title`/`children`; `src/index.ts` barrel; root `src/main.tsx` and `Minesweeper` import from `@swfactory/platform`, still with title "Software Factory". Platform `vite.config.ts`. devops adds `npm test -w @swfactory/platform` to the root `test` and `verify` for this interim. Green: verify (interim scripts) and `npm run test:e2e` unchanged.
3. **developer + devops: extract the app, flip the toolchain (one commit; no green point inside).** developer: `git mv` the game, `main.tsx`, `index.html`, `public/`, e2e specs, `measure-fps`; platform e2e specs move with `fixtures.ts` and are parameterised; title becomes "Minesweeper" and `level: 2` is added where the game's h2 is meant. devops: app `package.json` scripts, `vite.config.ts`/`playwright.config.ts` via the helpers, root scripts aggregate (including `--workspaces`), delete the old root configs and `src/`, ESLint globs, CI artefact path, `.claude/launch.json`, `.env.example` wording; app `check:dist` runs the unchanged old `scripts/check-dist.mjs` from the app directory (`node ../../scripts/check-dist.mjs`). Green: `npm run verify`, `npm run test:e2e` (all projects), `npm run verify -w apps/minesweeper`.
4. **developer: token split and test split.** Split `tokens.css` and `tokens.test.ts` as designed; `tokenRules.ts`; app `tokens.test.ts`; `geometry.test.ts` path; `AppShell` tests with stub children (the board assertion goes, the e2e covers it). Green: verify.
5. **devops: check-dist redesign.** New `check-dist.mjs`, both `dist-check.json`, root `check:dist` over all apps. Green: verify (including the control probe: a development-mode build makes it fail).
6. **devops: `templates/app`, `scripts/new-app.mjs`, `/new-app` skill** (placeholders in strings only). Probe: create `zzprobe`, `npm install`, `npm run verify -w apps/zzprobe`, `npm run test:e2e -w apps/zzprobe`, run check-dist on it, `git status` shows nothing under `apps/minesweeper`, then remove it and re-run `npm install`. Green: verify (templates are linted and formatted).
7. **devops: docs, factory files and `check-structure`.** `git mv` backlog 005-010 and ADR 0005 into `apps/minesweeper/docs/`; fix cross-directory links; root `docs/backlog/README.md` links; CLAUDE.md, agent role files, skills (including the rewritten `/rebuild`), story template; then add `scripts/check-structure.mjs` and `check:structure` to the root `verify` (all three rules at once, so it is green from its first run). Then **tech-writer:** root README (layout, `/new-app`, verify and e2e per app, shared `.env.local`), `apps/minesweeper/README.md` (game, 3D, `measure:fps`), CHANGELOG entry. Orchestrator runs prettier on markdown. Green: verify.
8. **tester:** the tests below; Test report. **reviewer** after that.

### Test plan (minimal; each behaviour once, at the cheapest level)

| AC  | Test                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Level                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| AC1 | The existing e2e specs and unit tests, moved, are the test. Allowed edits: `appTitle` instead of "Software Factory" (platform specs, via fixtures) and the AppShell unit test, `getByRole('heading', { level: 2, … })` where the game's h2 is meant; the platform specs' game-specific assertions (heading, `Start`, board grid, `auth.spec.ts:50-51,105`, `auth-guest.spec.ts:62,65`, `smoke.spec.ts:17-18`) use `signedInContent`. Run: `npm run test:e2e` | e2e (moved)                  |
| AC2 | `check-structure` rule 1 (no app name and no `@swfactory/<app>` import in `packages/platform`) plus the platform token test's `undefinedVarProblems`; split token tests (platform generic, app scene checks).                                                                                                                                                                                                                                                | script + unit                |
| AC3 | One scripted probe by the tester (step 6) reported as "checked, OK": new app from the skeleton passes `verify` and `test:e2e` (the platform specs act as the skeleton's e2e), `apps/minesweeper` unchanged. The skeleton's `Content.test.tsx` and `tokens.test.ts` are permanent.                                                                                                                                                                            | script probe + skeleton unit |
| AC4 | `check-structure` rules 1-3 (names, dead links, every story listed once), part of `verify`; the tester checks the tree by `ls`.                                                                                                                                                                                                                                                                                                                              | script                       |
| AC5 | Root `verify` and `test:e2e` are themselves the check; one probe each: break one platform test, then one app test, and see root and `-w apps/minesweeper` fail; the app `verify` includes the platform tests.                                                                                                                                                                                                                                                | script probe                 |
| AC6 | `check-dist` in `verify` (clean build passes); one control probe: build with `NODE_ENV=development vite build --mode e2e` in the app and see the check fail; run the check on the `zzprobe` app's build (covered without edit).                                                                                                                                                                                                                              | script probe                 |
| AC7 | Dry run of `/rebuild minesweeper` steps 1-2 on a scratch branch: replay list must be 005, 006, 007, 008, 009 (010 is `ready`, not done); `new-app.mjs --reset` on a scratch copy of the app then green `npm run verify -w apps/minesweeper`; no story replay.                                                                                                                                                                                                | dry run                      |

No new component test repeats an e2e. Net new automated tests: the platform and app `tokens.test.ts` (split from the existing one), the skeleton's `Content.test.tsx` and `tokens.test.ts`, the platform `fixtures` options, `check-structure` and `check-dist` as scripts in `verify`.

### Alignment with UX

No UX design for this story; the heading/title behaviour is specified above. No visual or interaction change.

## Implementation notes

_developer: what was built, deviations from the design and why._

### Steps 1-4 (developer, 2026-11-03)

Exception to the role split, ordered by the orchestrator: the developer also did the devops
parts of steps 1-3 (root, app and platform `package.json`, tsconfigs, `config/vite.ts`,
`config/playwright.ts`, vite and playwright configs, ESLint globs, CI artefact path,
`.claude/launch.json`, `.env.example` wording, interim app `check:dist`), because step 3 is one
atomic switch. Steps 5-7 (check-dist redesign, `templates/app` + `/new-app`, docs, factory files,
`check-structure`) are not done.

**Step results** (each: `npm run verify` green; steps 2 and 3 also `npm run test:e2e` green):

| Step                      | verify                                                        | e2e                                                 |
| ------------------------- | ------------------------------------------------------------- | --------------------------------------------------- |
| baseline (before)         | 25 files / 234 tests                                          | 96 passed                                           |
| 1 scaffold                | green, 234 tests                                              | not run (nothing moved)                             |
| 2 extract platform        | green; root 84 + platform 150 = 234 tests                     | 96 passed                                           |
| 3 extract app, flip tools | green; platform 150 + app 84; `verify -w apps/minesweeper` ok | 96 passed (chromium 50, platform 41, chromium-3d 5) |
| 4 token split             | green; platform 154 + app 85 = 239 tests                      | 96 passed                                           |

Moves were `git mv` first, content edits after. The app's `tokens.test.ts` is a `git mv` of the
old `src/app/tokens.test.ts` (the platform half `styles/tokens.test.ts` is new); the platform
`tokens.css` is the `git mv` of the old one, the app `tokens.css` is new (values moved unchanged;
the set of declared custom properties of both files equals the old file's).

**Deviations from the design:**

1. **`signedInContent` of Minesweeper is `{ role: 'button', name: 'Start' }`**, not the board
   grid: the grid only exists after pressing Start, so it is not "visible right after sign-in".
   Consequence: the platform's `auth-guest` AC7 no longer clicks Start and checks the grid (that
   is game behaviour, covered by `minesweeper.spec.ts`); it only asserts `signedInContent`.
2. **`/// <reference path="./vite-env.d.ts" />` in `src/index.ts` fails lint**
   (`@typescript-eslint/triple-slash-reference`, path: never). Used the design's fallback instead:
   an app's `tsconfig.app.json` has `include: ["src", "../../packages/platform/src/vite-env.d.ts"]`
   (the skeleton must do the same).
3. **Prettier in a workspace ignores the root `.prettierignore`** (it only reads the one in the
   cwd), so `prettier --check .` inside an app also checked `dist/` and `test-results/`. The
   workspace `format:check` scripts are `prettier --check . --ignore-path ../../.prettierignore`.
4. **Token rules module is imported as `@swfactory/platform/test/tokenRules`** (the `./test/*`
   export maps to `src/test/tokenRules.ts`), not `.../test/tokens` as written in the design.
   API as suggested, with these shape changes: `Pair` and `TEXT`/`NON_TEXT` exported;
   `readPlatformScheme()` (reads the platform's own `tokens.css` next to the module, so apps
   don't need a path), `colourTokenNames()`, `stripComments()`, `blockOf()`;
   `undefinedVarProblems(css, defined, allowed = [])` also accepts custom properties declared in
   the stylesheets themselves (`--callout-color`, `--cell`, …) and an `allowed` list for inline
   ones (the app passes `--cols`, `--rows`). Parity classifies colours by value
   (hex or `rgb()` in either scheme), so the old name prefix list and `--cell-gap` exclusion are
   gone. `readCss(dir)` keys are `src/<path>`.
5. **Token placement follows the design's explicit lists where they differ from the "read by a
   platform module" rule:** `--radius-well` stays in the platform (the design lists it there),
   `--radius-cell`, `--cell-gap`, `--tile-lip`, `--well-*`, `--board-chrome` are the app's. The
   platform keeps generic colours that no platform module reads (`--color-success*`,
   `--color-danger-solid`, `--color-input-bg`, `--shadow-*`, …); it is the design system. The
   platform's `--page-pad`, `--panel-border`, `--panel-pad` stay in the platform's 600 px block;
   the app's 600 px block has `--well-pad` and `--board3d-rim`.
6. **Non-composite bases:** all strict flags (incl. `noUncheckedIndexedAccess`,
   `exactOptionalPropertyTypes`) are in `tsconfig.base.json` as designed, so the node projects
   (configs, e2e) are now checked as strictly as the app code; they passed unchanged.
7. **Root scripts:** `npm test`, `build`, `typecheck`, `test:e2e`, `check:dist` are
   `npm run <x> --workspaces --if-present`. The root no longer has `preview`, `test:watch` or
   `measure:fps` (they are the app's: `npm run measure:fps -w apps/minesweeper`). Step 2 used an
   interim `vitest run && npm test -w @swfactory/platform` as the design says.

**For devops (steps 5-7):**

- Old `scripts/check-dist.mjs` is unchanged and runs per app via `node ../../scripts/check-dist.mjs`
  (cwd = the app, so `dist` and `SCENE_ENTRY` are relative to the app). Root `check:dist` is
  `npm run check:dist --workspaces --if-present`. Replace both when redesigning. `vite.config.ts`
  of the app still mentions `scripts/check-dist.mjs (SCENE_CHUNK_GZIP_MAX)` in a comment.
- `packages/platform/config/vite.ts` and `config/playwright.ts` exist and are used; the skeleton's
  `vite.config.ts` / `playwright.config.ts` are one call each. The skeleton also needs: the
  `tsconfig.app.json` include of `../../packages/platform/src/vite-env.d.ts` (deviation 2), the
  `format:check` with `--ignore-path ../../.prettierignore` (3), `src/main.tsx` importing
  `@swfactory/platform/tokens.css`, `.../base.css`, then `./tokens.css`, a `src/tokens.test.ts`
  calling the shared rules (`readPlatformScheme`, `withBase`, `parseTokens`, `parityProblems`,
  `bypassProblems`, `undefinedVarProblems(css, merged.light, ['--cols', '--rows'])` as needed) and
  `signedInContent` pointing at the placeholder region.
- The platform e2e specs read `appTitle` and `signedInContent` from the `platform` Playwright
  project; `fixtures.ts` also exports `signedInLocator(page, content)`. A default `appTitle` of
  `''` would match every heading, so every app config must set `title`.
- Stale paths in docs/factory files that step 7 must fix: README (layout, `measure:fps`, env
  file), CLAUDE.md, agent files, skills, ADRs 0001-0005 mention `src/app/...`,
  `src/features/auth/...`, `src/index.css`, `e2e/...` (the ADR/backlog edits already in the
  working tree are the architect's). Code comments were fixed where they pointed at moved files.
- Marker files: `git status` shows `D tsconfig*.json` staged (a stray `git rm --cached` by the
  developer); the files are removed from disk too.
- Root `package.json` still has `"engines"`; `three`/`@types/three` moved to the app (verified with
  `npm ls three`). `package-lock.json` was regenerated by `npm install`.

### Steps 5-7 (devops, 2026-11-03)

| Step                          | verify                                                         | other                                                                                  |
| ----------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 5 check-dist redesign         | green; platform 154 + app 85                                   | control probes below                                                                   |
| 6 `templates/app`, `/new-app` | green (templates linted and formatted)                         | `zzprobe` probe below                                                                  |
| 7 docs, factory, structure    | green, incl. `check:structure` (24 md files, 90 factory files) | `npm run test:e2e` (all projects): 96 passed (chromium 50, platform 41, chromium-3d 5) |

**Step 5.** `scripts/check-dist.mjs [app…]` (default: every `apps/*` with a `package.json`; root
`check:dist` = `node scripts/check-dist.mjs`, app `check:dist` = `node ../../scripts/check-dist.mjs <name>`)
reads `packages/platform/dist-check.json` (`Sign in as guest`, `__fakeGoogle`) and the app's optional
`dist-check.json` (`forbidden`, `lazyChunks[{marker, entry, gzipMaxKb}]`; shape is validated, a malformed file
fails). The root dir comes from `import.meta.url`, not the cwd. Output: one `check-dist: ok <app> (…)` line per
app; all apps are checked before the exit code is set. Probes (all as expected): a development-mode build
(`NODE_ENV=development vite build --mode e2e`) makes the check fail with the four strings, in the Minesweeper
app and in `zzprobe`; a missing `dist/` fails; an unknown app fails; `gzipMaxKb` lowered to 100 fails
(over budget); a marker that matches no chunk fails ("would be vacuous"). The comment in the app's
`vite.config.ts` now points at `dist-check.json`.

**Step 6.** `templates/app/` (placeholders `__NAME__`, `__TITLE__` only inside string literals, JSON values,
HTML text and, in the README, code spans, because prettier would turn `__X__` in prose into bold),
`scripts/new-app.mjs <name> [--title "<Title>"] [--reset]` and the skill `.claude/skills/new-app/SKILL.md`.
The script rejects names not matching `^[a-z][a-z0-9-]*$`, the reserved names app, apps, platform, package,
packages, template and templates, existing directories, and titles with quotes, backticks, backslashes, angle
brackets, ampersand, dollar sign or braces (they would need escaping in TS, JSON or HTML). The title defaults
to the capitalised name. `--reset` replaces `src`, `e2e` and `public` and keeps everything else (title read
from `index.html`). Probe, as designed:

- `new-app.mjs zzprobe --title "ZZ Probe"`, then `npm install` (symlink `node_modules/@swfactory/zzprobe`).
- `npm run verify -w apps/zzprobe` green (platform 154 tests + app 5 tests, build, check-dist ok).
- `npm run test:e2e -w apps/zzprobe`: 41 passed (the platform specs are the skeleton's e2e).
- `check-dist` on it ok; a development-mode build of it fails the check without any edit (AC6).
- `git status --short apps/minesweeper` identical before and after.
- `--reset` on `zzprobe` with a stray file leaves exactly the skeleton and a green `verify`.
- Then `rm -rf apps/zzprobe` and `npm install`.

**Step 7.** Moved with `git mv`: stories 005-010 to `apps/minesweeper/docs/backlog/`, ADR 0005 to
`apps/minesweeper/docs/adr/`. Cross-directory links fixed (by a one-off script that resolves each dead link by
file name); `docs/backlog/README.md` is the index of all stories, new column `App`, 011 shown as `in-progress`.
`scripts/check-structure.mjs` (+ root `check:structure`, in `verify` between format check and tests):
rule 1 (whole-word, case-insensitive app names in `CLAUDE.md`, `.claude/agents`, `.claude/skills`,
`docs/templates`, `templates`, `packages/platform`; plus a platform file importing `@swfactory/<not platform>`
or a path through `apps/`), rule 2 (relative links in `docs`, `apps/*/docs`, READMEs, CHANGELOG, CLAUDE.md,
`templates`; links inside code are ignored), rule 3 (every `NNN-*.md` in all backlogs linked exactly once from
`docs/backlog/README.md`, ids unique, frontmatter id equals file name). Probes (each caught, then removed): the word
Minesweeper in an agent file, an `@swfactory/<app>` import in the platform, a dead link, an unlisted story, a duplicate id.
AC7 dry run (selection only): the replay list for `/rebuild minesweeper` is 005, 006, 007, 008, 009.

**Deviations from the design (step 5-7):**

1. `templates/app/e2e/.gitkeep` exists (the design lists no `e2e/`): the skeleton has a place for specs and
   `/rebuild --reset` has a directory to replace. The skeleton's own `chromium` Playwright project finds no
   specs and that is fine; the `platform` project is its e2e.
2. The skeleton's `tokens.css` has empty `:root {}` and dark blocks: the shared `parseTokens` throws when a block
   is missing.
3. ADR 0004's revision note named `@swfactory/platform/test/tokens`; corrected to `…/tokenRules` (deviation 4 of
   the developer). ADR 0005 got a "Revised" line like 0002-0004, and its `Story:` line (and ADR 0004's) points to
   the moved story file. Old paths in the ADR bodies stay as historical record, as the architect did for 0002-0004.
4. Stories 001-010 have no `app:` frontmatter field (only the template got it); the backlog directory says which
   app a story belongs to. The product-owner sets `app:` from the next story on.
5. `npm install` after removing a workspace leaves an `extraneous` `apps/<name>` entry in `package-lock.json`
   (`npm prune` does not remove it); it was deleted by hand and `npm install` / `npm ci --dry-run` accept the file.
6. `npm audit`: 12 moderate findings, all dev-only through `minimatch` (ESLint toolchain); no dependency added or
   changed in steps 5-7.

**Factory files changed (step 7):** `CLAUDE.md` (intro, roles table, entry points, Baseline, links bullet,
Conventions stories/ADRs, tech stack, code layout, dev-only code, styling paths, config, workspace tooling
notes, commands); agents `product-owner`, `architect`, `developer`, `devops`, `ux-designer`, `tester`,
`tech-writer` (paths only; `reviewer` had none); skills `feature`, `story`, `bug` (backlog location, app question,
prettier globs), `rebuild` (rewritten per app), `new-app` (new); `docs/templates/story.md` (`app:`),
`docs/templates/adr.md` (story path). Agent memories untouched.

**For the tech-writer:** root `README.md` and `CHANGELOG.md` still describe the single-app layout (paths
`src/app/…`, `src/features/auth/…`, `src/index.css`, `e2e/…`, `scripts/check-dist.mjs` strings, `measure:fps`,
env file); document the layout (platform, apps, skeleton), `/new-app`, per-app `verify` / `test:e2e`, shared
root `.env.local`, `check:structure`, and create `apps/minesweeper/README.md` (game rules, 3D view,
`npm run measure:fps -w apps/minesweeper`). Links in README.md and CHANGELOG.md currently resolve, so
`check:structure` passes; keep them relative and valid. Then run `npx prettier --write` on the markdown.

### Review round 1 follow-up (devops, 2026-11-03)

Findings 1-6 of review round 1 fixed (7 left open on purpose):

1. `npm run check:template` (`scripts/check-template.mjs`): Vitest in `templates/app` plus `tsc -p templates/app/tsconfig.app.json --noEmit`, wired into root `verify` after `check:structure`. `templates/app` is still not a workspace. The script deletes the `templates/app/node_modules` cache Vitest creates (only if it did not exist before), so the skeleton stays clean; `.gitignore` already covers `node_modules` at any depth.
2. `/rebuild` skill §2.4 and §3.2: after `--reset` only `verify` is green; the `platform` e2e project fails until the app shows its `signedInContent`, which the first replayed story must build.
3. `createAppPlaywrightConfig` throws on a blank `title` and a blank `signedInContent.name`.
4. `/new-app` skill and README ("Creating an app"): stale `extraneous` lockfile entry after deleting an app; restore `package-lock.json` from git or remove the entry, then `npm ci --dry-run`.
5. `bypassProblems` exempts exact `readCss` keys only (`src/tokens.css`, `src/styles/tokens.css`, `src/styles/base.css`), no longer path suffixes.
6. `check-dist` fails if the platform's `forbidden` list is empty or missing.

Also: README command table and verify order, and CLAUDE.md "Commands", list `check:template`.
Probes: empty platform `forbidden` list, blank title and `src/x/tokens.css` / `src/x/styles/base.css` are rejected/flagged. `npm run verify` green (skeleton 2 files / 5 tests, platform 154, app 85); `npm run test:e2e` 96 passed.

## Test report

_tester: AC → test mapping, results, defects found._

Run 2026-11-03 on the uncommitted working tree of `feature/011-separate-factory-from-apps`.
`npm run verify`: green (typecheck, lint, format, `check:structure`, platform 154 + app 85 unit
tests, build, `check:dist`). `npm run test:e2e` (all projects): **96 passed** (chromium 50,
platform 41, chromium-3d 5). **Tests added by the tester: 0** — the Test plan names the moved
specs, the split token tests and the skeleton's tests as the oracle, and everything else is a
script probe (listed as "checked, OK").

| AC  | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Result |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| AC1 | `npm run test:e2e` 96 passed. `npx playwright test --list` on a `git archive main` copy: 96 tests (91 chromium + 5 chromium-3d); the sorted title lists (without file/line) of before and after differ in exactly two titles ("...(the game)" → "(the app)", "app loads and shows the game..." → "...its content..."). The four Minesweeper specs are pure renames (3 at 100 % similarity, `redesign.spec.ts` differs in one comment path). The platform specs differ only by `appTitle` / `signedInContent` parameters (`expectLoginView`, AC2, smoke, auth-guest AC7) and the import of `./fixtures.ts`; no assertion of intent lost. Moved unit tests differ only in imports, `AppShell` with stub children, and the `tokens.css` path. Guest sign-in → game stays covered: `minesweeper.spec.ts` signs in via "Sign in as guest" and then plays; the dropped "click Start, see grid" in `auth-guest` AC7 is covered there. | PASS   |
| AC2 | `check-structure` rule 1 plants caught: app name in `.claude/agents/tester.md`, in `CLAUDE.md`, `@swfactory/minesweeper` import and `../../../apps/...` import in `packages/platform/src/index.ts`. Platform CSS using `var(--cell-gap)` fails the platform token test (`AppShell.module.css: var(--cell-gap) is not defined`); an undefined `var(--nope)` in app CSS fails the app token test. Split token tests exist (platform: 4 tests, app: 8 incl. scene parity). The app's `tokens.css` defines only `--cell/--scene/--n1-8/--board*/--well*/--radius-cell/--tile` tokens. Grep finds no auth client, shell or generic token in `apps/` or `templates/`.                                                                                                                                                                                                                                                                | PASS   |
| AC3 | `node scripts/new-app.mjs zztest --title "ZZ Test"` → `npm install` (symlink created) → `npm run verify -w apps/zztest` green (platform 154 + app 5 tests, build, check-dist ok) → `npm run test:e2e -w apps/zztest` 41 passed (the platform specs assert the app's own title "ZZ Test") → `npm run dev -w apps/zztest`: `document.title` and h1 "ZZ Test", guest sign-in shows "Signed in as Guest" and the region "ZZ Test content". Root `verify` with both apps green. `git status apps/minesweeper` identical before and after. Skeleton has `Content.test.tsx` + `tokens.test.ts`. README documents layout, `/new-app`, per-app commands. Probe app removed, `npm install`: see note 1 on the lockfile.                                                                                                                                                                                                                  | PASS   |
| AC4 | `check-structure` ok; plants caught: dead link (`docs/backlog/001-login.md`), unlisted story id 012 in an app backlog (listed 0 times). `grep -riw minesweeper` over `CLAUDE.md`, `.claude/agents`, `.claude/skills`, `docs/templates`, `templates`, `packages/platform`: no hits (only `.claude/agent-memory`, exempt). `ls`: root `docs/backlog` = 001-004, 011, README; `docs/adr` = 0001-0004, 0006; `apps/minesweeper/docs/backlog` = 005-010, `docs/adr` = 0005, `e2e/` = the four game specs; `packages/platform/e2e` = smoke, auth, auth-guest, fixtures. The backlog README lists all 11 stories with working links (checked by `check-structure`).                                                                                                                                                                                                                                                                   | PASS   |
| AC5 | Planted failing unit test in the platform: root `verify` and `-w apps/minesweeper` verify exit 1 (platform tests run inside the app's verify). Planted in the app: root `verify` and `-w apps/minesweeper` exit 1; `-w @swfactory/platform` verify stays green. Planted failing e2e spec in the platform and in the app: root `test:e2e` exit 1. `verify -w apps/zztest` never touched Minesweeper (0 hits in the log), and the `-w apps/minesweeper` log has no `zztest`. Root `verify` with two apps ran both apps' unit tests and both `check-dist`s. All plants reverted.                                                                                                                                                                                                                                                                                                                                                  | PASS   |
| AC6 | `NODE_ENV=development vite build --mode e2e` in Minesweeper: `check-dist` exit 1 with `Sign in as guest`, `__fakeGoogle`, `__minesweeperMines`, `__board3dProbe`; same in `zztest` (`Sign in as guest`, `__fakeGoogle`, no edit to the check). Clean `npm run build` → `check-dist: ok minesweeper (5 files, … lazy chunk 137.3 kB gzip)`; `zztest` clean ok. App-specific strings and the 180 kB budget live in `apps/minesweeper/dist-check.json`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | PASS   |
| AC7 | Selection of `/rebuild minesweeper` step 1 on `apps/minesweeper/docs/backlog`: `status: done` and not superseded = **005, 006, 007, 008, 009** (010 is `ready`, none superseded). Step 2 on a scratch copy of the repo: `new-app.mjs minesweeper --reset` leaves exactly the skeleton `src`, empty `e2e`/`public`, keeps `package.json`, configs, `dist-check.json`, `docs/`; `npm run verify -w apps/minesweeper` green (platform 154 + skeleton 5 tests, check-dist ok "no THREE.WebGLRenderer chunk yet"). No story replayed.                                                                                                                                                                                                                                                                                                                                                                                               | PASS   |

**Also checked, OK:** `npm run dev` at the root starts Minesweeper on 5173; title and h1
"Minesweeper", guest sign-in shows the "Start" button. A platform spec fails loudly on a wrong
`appTitle` by design (empty default would match any heading; every config sets it).

**Defects:** none.

**Notes (no defect, for hak / devops):**

1. Removing an app leaves a stale `extraneous` `apps/<name>` entry in `package-lock.json` after
   `npm install` (confirmed: the lockfile differed from the pre-probe one by exactly that entry).
   Restoring the pre-probe lockfile and running `npm install` is stable, and `npm ci --dry-run`
   accepts it. It is not mentioned in the README or the `/new-app` skill, so anyone who creates and
   deletes a throw-away app will commit a dirty lockfile.
2. After `new-app.mjs <app> --reset` the skeleton shows its placeholder region, not Minesweeper's
   "Start" button, so the `platform` e2e project of that app fails until the first replayed story
   builds the Start button (only `verify` is green at that point, which is all the skill claims;
   not run by the tester).
3. `docs/backlog/README.md` still shows 011 as `in-progress`; the story status is now `in-review`
   (orchestrator updates it when the status moves on).

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

**Round 1 — verdict: APPROVED** (no blockers, no majors). Status stays `in-review`.

Checked myself: `npm run verify` green (exit 0; `check-dist: ok minesweeper … lazy chunk 137.3 kB gzip`).
Read: all of `scripts/check-dist.mjs`, `check-structure.mjs`, `new-app.mjs`, `packages/platform/config/*`,
`e2e/fixtures.ts`, `tokenRules.ts` and both token tests (rule by rule against the old `tokens.test.ts`),
the diffs of the renamed-and-edited files (content changes are imports, the `appTitle` / `signedInContent`
parameters, the heading and two comment paths only), `CLAUDE.md`, every agent and skill diff, the story
and ADR templates, the rewritten `/rebuild` and the new `/new-app`. Probed `new-app.mjs` from a scratch
copy: traversal and odd names (`../x`, `a/b`, `Abc`, `-a`, reserved) are rejected; titles are inserted by
split/join (no `$&` replacement hazard); `--reset` can only touch `apps/<valid-name>/{src,e2e,public}`.
No secrets: `envDir` is the repo root, only `VITE_*` is exposed, root `.gitignore` covers `.env`, `.env.*`,
`*.local` (`!.env.example`); the lockfile has no stale entry. Dev-only guards: every
`import.meta.env.DEV` use in `packages/` and `apps/` is literal, and each identifying string is in a
`dist-check.json` (`Sign in as guest`, `__fakeGoogle`; `__minesweeperMines`, `__board3dProbe`).
Factory files: only paths, layout, commands, baseline, rebuild and new-app changed; no rule lost
(Test proportionality, Independent tests, Network timeouts, Dev-only code, Styling and the agents'
boundaries are intact). Checked, OK: the dropped "click Start, see grid" in platform `auth-guest` AC7 is
covered by `minesweeper.spec.ts`; the app token test keeps every rule of the old file (parity now by value,
which also covers shadows); `check-dist` is not vacuous (needs index.html + JS, validated config, marker must
exist once the entry file exists).

Findings:

1. **[minor] `templates/app/src/Content.test.tsx`, `tokens.test.ts` (and the skeleton as a whole) — never run by
   `verify` or CI.** `templates/app` is not a workspace, so `tsc`, Vitest and the e2e never see it; ESLint and
   Prettier only check syntax. The Technical design counts the skeleton's two tests as "permanent", but nothing
   executes them, so a platform change (a renamed export of `tokenRules`, a new `AppShell` prop, a tsconfig
   option) breaks the skeleton unnoticed until the next `/new-app` or the `/rebuild` reset (AC3, AC7). I ran
   `cd templates/app && npx vitest run` by hand: it works (2 files, 5 tests, 0.5 s) because the root
   `node_modules/@swfactory/platform` link resolves from there. Fix: a root script (e.g. `check:template` =
   `npm --prefix templates/app exec -- vitest run` plus `tsc -p templates/app/tsconfig.app.json --noEmit`) in
   `verify`, or state in the story and the `/new-app` skill that the skeleton is verified only by the probe.
   Not blocking: the AC wording is met by the one-time probe (tester, AC3) and hak is wary of heavy suites.
2. **[minor] `.claude/skills/rebuild/SKILL.md` §2.4/§3 (tester note 2) — platform e2e fails until the first replayed
   story builds the signed-in content.** After `new-app.mjs --reset` the skeleton shows its placeholder region,
   but the kept `playwright.config.ts` expects the `Start` button, so every `test:e2e -w apps/<app>` run during
   story 005 (and the `platform` project in each later run until then) fails for a reason that is not a defect.
   The skill promises only a green `verify`, which is true, but does not warn the tester or tell the replay of the
   first story to treat `signedInContent` as part of its acceptance. Fix: one sentence in §2 and §3: "the `platform`
   e2e project fails until the app shows the `signedInContent` named in its `playwright.config.ts`; the first
   story must produce it; don't read earlier failures as regressions."
3. **[minor] `packages/platform/config/playwright.ts:36`, `e2e/fixtures.ts:26-27` — an empty `title` makes the
   platform specs pass vacuously.** The fixture default `appTitle: ''` and `getByRole('heading', { level: 1,
name: '' })` match any h1 (the design notes this in "Risks"). The type only demands a `string`. Fix: in
   `createAppPlaywrightConfig` throw if `options.title.trim() === ''` (also for an empty `signedInContent.name` with
   the default role), or make the fixture defaults throw when used unset. Three lines; no new test needed beyond
   the existing config loading.
4. **[minor] `.claude/skills/new-app/SKILL.md`, `README.md` — stale `extraneous` lockfile entry after a throw-away
   app is deleted** (tester note 1, confirmed by the devops memory). The workaround exists only in agent memories.
   Fix: one sentence in the `/new-app` skill ("if you delete an app again, run `npm install`, then remove the
   `extraneous` `apps/<name>` entry from `package-lock.json` by hand and check `npm ci --dry-run`") or a note in
   the root README; otherwise a probe app leaves a dirty lockfile in the commit.
5. **[nit] `packages/platform/src/test/tokenRules.ts` (`bypassProblems`) — path-suffix exemptions.** Any file named
   `…/tokens.css` or `…/styles/base.css` in an app is exempt from the colour/font/motion rules (`endsWith`).
   Pre-existing for `tokens.css`; new for `base.css`. Anchor both to the exact keys (`src/tokens.css`,
   `src/styles/base.css`) if it ever matters.
6. **[nit] `scripts/check-dist.mjs:readConfig` — the platform list may be empty.** `{"forbidden": []}` in
   `packages/platform/dist-check.json` passes validation, so deleting the platform strings silences the check for
   every app, new ones included. Require at least one entry for the platform file.
7. **[nit] `docs/backlog/001-004, 005-010` — no `app:` frontmatter** (documented deviation 4) and
   `check-structure` does not compare `app:` with the backlog directory. Fine for now; add the check when the
   first story with `app:` exists.

Not findings (verified): `--reset` with `--title` can make `index.html` and `main.tsx` differ — only
reachable by passing both on purpose; `reuseExistingServer` on 5174 with another app's server is caught by
`appTitle` in the platform specs.

## Retrospective

_orchestrator, 2026-11-03._

Went well: an architect spike on a throwaway copy before the design proved the main risk
(dev-only guards dropped from a source-consumed package) early; every implementation step
ended green; the tester found no defect; review APPROVED in round 1. The old e2e suite
worked as the oracle (96 before and after, same titles except two renames).

### What went wrong

| #   | Problem                                                                                                                                                              | Root cause                                                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| P1  | AC1 allowed only heading/title edits in specs, but the platform specs asserted game content (Start, board), so they had to be parameterised (`signedInContent`).     | The AC was written before anyone grepped the specs for app-specific assertions.                                  |
| P2  | Roles didn't fit: step 3 had to be done by the developer including configs, and the factory files (`CLAUDE.md`, agents, skills) had no owner, so devops edited them. | The roles table has no owner for factory files and no rule for atomic cross-role steps.                          |
| P3  | Review minors: the app skeleton was never run by `verify`, and a blank app title made the platform specs pass vacuously.                                             | Generated code (templates) wasn't treated as code that needs a check; parameterised specs had no guard on input. |
| P4  | Agents touched the git index outside `git mv` (a stray `git rm --cached`, a `git add -N`), and had to undo it.                                                       | No rule on which git commands agents may run.                                                                    |

### Proposed changes

1. **Story 011, AC1 (P1):** widen the wording to "…and moved paths or config, plus
   the platform specs' app-specific assertions replaced by the app's `signedInContent`";
   intent unchanged (the tester confirmed no assertion of intent was lost).
2. **`CLAUDE.md`, Roles (P2):** factory files (`CLAUDE.md`, `.claude/agents`,
   `.claude/skills`, `docs/templates`) change only through hak-approved retro proposals
   or an approved story AC; the orchestrator assigns such edits (normally to `devops`)
   and reviews the diff before gate 2. A step that can't be split into green steps may
   be given to one agent across roles; it's recorded in the Implementation notes.
3. **`CLAUDE.md`, Conventions (P3; reviewer's suggestion):** code that is copied or
   generated (e.g. `templates/app`) is exercised by `npm run verify`; shared test
   helpers reject inputs that would make a test pass vacuously (blank names, empty
   lists).
4. **`CLAUDE.md`, Branches (P4):** agents use only read-only git commands and `git mv`;
   they never stage, unstage, commit or reset.

### Outcome

hak approved all four proposals at gate 2 ("Ja, alles", 2026-11-03). Applied: 1 in
AC1 of this story; 2 in `CLAUDE.md` "Roles" (factory files paragraph); 3 in `CLAUDE.md`
Conventions ("Generated code"); 4 in `CLAUDE.md` Conventions ("Branches").
