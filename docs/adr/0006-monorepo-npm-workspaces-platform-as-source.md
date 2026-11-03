# 0006 – Monorepo with npm workspaces: a platform package consumed as TypeScript source, apps beside it

- **Status:** accepted
- **Date:** 2026-11-03
- **Story:** docs/backlog/011-separate-factory-from-apps.md

## Context

The factory (agents, skills, templates), the shared platform code (Google and guest sign-in,
the e2e sign-in fake, app shell, design tokens, button, helpers) and the one app built with
it (Minesweeper) all live in one `src/`. hak wants to start more apps on the same factory
without carrying Minesweeper along and without copying the sign-in (story 011). hak decided
on a monorepo with npm workspaces (decision log of 011). What is still open, and costly to
reverse because every app and every import path depends on it, is how apps consume the
platform and how the toolchain is shared.

Constraints from earlier ADRs and `CLAUDE.md`: dev-only code (the e2e fake, "Sign in as
guest") must be dropped from production builds by `import.meta.env.DEV` guards written out
literally (ADR 0003, story 004); CSS Modules and design tokens (ADR 0004); e2e runs on the
dev server in mode `e2e` on port 5174.

## Options considered

1. **Platform package consumed as source** (chosen) – `packages/platform` has no build step;
   its `package.json` `exports` point at `.ts`/`.css` files. Each app's Vite build bundles the
   platform code like its own code. No publishing cycle, no second build, instant edits,
   and the `import.meta.env` guards are evaluated by the app's own build.
2. **Platform built to a `dist` and consumed as a library** – clean package boundary, but it
   needs a second build and watch process, the `DEV` guards would be evaluated once at
   platform build time (production) and the e2e fake would vanish from the dev server too,
   so the platform would need its own mode handling. Rejected: more moving parts for no
   current benefit.
3. **Separate repositories (platform published, apps consume)** – strongest isolation, but a
   publishing cycle for every platform change and retro lessons applying to several repos.
   Rejected by hak for now; option 1 keeps this open (see Consequences).
4. **Template repository (copy the platform into each app)** – no coupling, but fixes to the
   sign-in must be copied by hand to every app. Rejected: this is the "copying the sign-in"
   the story wants to end.
5. **TypeScript project references between platform and apps** – looks like the natural
   fit for a shared package, but referenced projects must be `composite` and then list every
   file; with a source-consumed package this fails (TS6307) or forces `composite` and
   emitted declarations. Rejected: each workspace is its own non-composite project and the
   app's program simply follows the imports into the platform source.

## Decision

Option 1, with these rules:

- **Layout:** `packages/platform/` (`@swfactory/platform`) and `apps/<name>/`
  (`@swfactory/<name>`) are npm workspaces (`"workspaces": ["packages/*", "apps/*"]`).
  Toolchain (Vite, Vitest, Playwright, TypeScript, ESLint, Prettier, Testing Library) is
  installed once at the root; an app declares only `react`, `react-dom`,
  `@swfactory/platform` and its own libraries (three.js belongs to Minesweeper).
- **Source consumption:** the platform has no `main`/build output. Its `exports` map names
  the entry points (`.`, `./tokens.css`, `./base.css`, `./lib/*`, `./test/*`,
  `./config/vite`, `./config/playwright`); apps never import deep paths that are not in the
  map. The package is linked by the workspace symlink, so its files resolve outside
  `node_modules` and every tool (Vite, Vitest, Playwright's TS loader, `tsc`) treats them as
  source, not as an external dependency.
- **One-way dependency:** the platform imports nothing from an app and mentions no app by
  name; enforced by `scripts/check-structure.mjs` (part of `verify`).
- **Typing:** no project references between workspaces. Every workspace has its own
  `tsconfig.json` (references only its own `tsconfig.app.json` and `tsconfig.node.json`),
  extending shared bases in the repo root. The platform is type-checked in its own project
  and again as part of every app's program (same strict options).
- **Dev-only guards stay in the platform.** They are evaluated by the app's build. Verified
  by a spike on 2026-11-03: with the platform moved to `packages/platform`, the app built
  with `vite build` contains none of `Sign in as guest`, `__fakeGoogle`,
  `__minesweeperMines`, `__board3dProbe`; a control build with `NODE_ENV=development
--mode e2e` does contain them (so the grep can see them and it is the `DEV` constant that
  removes them). `scripts/check-dist.mjs` stays as the permanent safety net for every
  `apps/*/dist`.
- **Shared tooling as code, not copies:** `@swfactory/platform/config/vite` and
  `.../config/playwright` export `createAppViteConfig()` / `createAppPlaywrightConfig()`
  (env dir at the repo root, CSS Modules with non-scoped class names in tests, shared
  setup file, e2e server on port 5174, a Playwright project that runs the platform's own
  e2e specs against the app).
- **Environment:** one `.env.local` and `.env.example` in the repo root, found through
  `envDir`; one Google OAuth client ID for all apps, dev server on 5173 one app at a time.
- **Docs:** platform stories (001-004, 011) and ADRs (0001-0004, 0006) stay in the root
  `docs/`; an app's stories and ADRs live in `apps/<name>/docs/{backlog,adr}/`. Story and
  ADR numbers are global across all of them.

## Consequences

- Adding an app is a copy of `templates/app/` plus `npm install` (skill `/new-app`); the
  sign-in, shell, tokens, fake, check-dist coverage and test toolchain come with it.
- A change to the platform can break any app: root `verify` and `test:e2e` cover all of
  them; per-app runs include the platform.
- Vite finds the workspace root through the `workspaces` key of the root `package.json`;
  without it, Vitest cannot load the shared setup file from outside the app (`server.fs`).
  Keep the key.
- The platform's tests run in the platform workspace; code in the platform that only an app
  exercises is still tested there with stubs, not with the app.
- Extracting the platform into its own repo or package later needs a build step and a
  re-check that the dev-only guards still drop out; the one-way dependency rule makes that
  extraction mechanical.
- Dev-only identifiers added to the platform go into `packages/platform/dist-check.json`;
  an app's own go into `apps/<name>/dist-check.json` (see story 011, "check-dist").
