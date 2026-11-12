# 0010 – GitHub Pages deploy: a guest-only build setting, a mode-aware dist check and subpath hosting

- **Status:** accepted
- **Date:** 2026-11-08
- **Revised:** 2026-11-12 (story 021, ADR 0011): the site root gets the landing page (`_site/index.html` + `_site/_landing/`); `check-dist --out` accepts it as a required root unit, checked against the forbidden sign-in strings of both modes, and still fails on any other entry.
- **Story:** docs/backlog/018-deploy-github-pages.md

## Context

hak wants every app published on a free hosting plan, chose GitHub Pages and decided that the
deployed apps offer only guest sign-in, no Google sign-in (story 018, Decision log). Three
things are costly to reverse because every app, the dist check and the CI depend on them:

1. **Guest sign-in leaves "dev only".** Until now "Sign in as guest" was dev-only code: a
   literal `import.meta.env.DEV` guard drops it from every production build, and
   `scripts/check-dist.mjs` fails if the string `Sign in as guest` appears in any `dist/`
   (story 004/AC12, ADR 0006, CLAUDE.md "Dev-only code"). The deploy build must contain it,
   every other production build must not, and the e2e sign-in fake must never ship.
2. **No Google online.** Today `createAuthClient()` runs once in each app's `main.tsx` and
   creates the Google client, which injects the Google Identity Services script
   (`https://accounts.google.com/gsi/client`) right away, on page load, not on click (ADR
   0002). The deploy build must make no request to a Google host.
3. **One Pages site per repository.** All apps live under one origin and one path prefix,
   `https://hkuegel.github.io/swfactory/<app>/`, from one artifact. Vite builds for `/` by
   default, so the asset URLs would 404 under the subpath.

## Options considered

### Build setting

1. **`VITE_ENABLE_GUEST` plus "no client ID ⇒ no Google UI"** – two mechanisms. The second
   changes local development and CI: with no `.env.local` client ID, dev and the e2e run (the
   fake needs no client ID) would lose the Google button, and 001/AC5 ("not configured" shows
   the error) would change. Rejected.
2. **Two flags, `VITE_ENABLE_GUEST` and `VITE_DISABLE_GOOGLE`** – flexible, but no build needs
   the other two combinations; twice the guards and check rules. Rejected (no speculative
   switches).
3. **One flag, `VITE_GUEST_ONLY`** (chosen) – `'true'` means "guest sign-in on, Google sign-in
   off". It is the exact product decision ("Nur Gast online"); default unset, so dev, e2e and
   every other build behave as before without any setting.

### Telling the dist check which build it checks

1. **Read the flag from the environment in `check-dist`** – hidden coupling to the shell; a
   stray variable would loosen the check. Rejected.
2. **A build manifest file in the output** – would be published too. Rejected.
3. **An explicit `--guest-only` option, with symmetric rules** (chosen) – the standard mode
   forbids the guest string; the guest-only mode _requires_ it and forbids the Google sign-in
   label and Google hosts. A build checked in the wrong mode always fails, so the option can't
   silently weaken the check.

### Subpath and app discovery

1. **`base` in each app's `vite.config.ts` from an env variable** – touches every app and the
   skeleton. Rejected.
2. **Vite CLI `--base` and `--outDir` from one deploy script** (chosen) – configs, skeleton and
   `scripts/new-app.mjs` stay unchanged; dev, preview and e2e stay at `/`.
3. **An explicit list of deployed apps** – a second list to keep in sync with `apps/`, and
   `/new-app` would have to edit it. Rejected: every workspace under `apps/` is deployed; the
   `apps/` directory is the deploy configuration.

## Decision

- **Setting:** `VITE_GUEST_ONLY`, typed in `packages/platform/src/vite-env.d.ts`. Guards are
  written out literally at every use site:
  - guest sign-in: `import.meta.env.DEV || import.meta.env.VITE_GUEST_ONLY === 'true'`;
  - Google sign-in (intro text, button, client creation):
    `import.meta.env.VITE_GUEST_ONLY !== 'true'` (in `createAuthClient` as an early return of
    the "not configured" client, before the Google client could load the GIS script);
  - e2e fake unchanged: `import.meta.env.DEV && import.meta.env.MODE === 'e2e'`.

  Vite replaces `import.meta.env.VITE_GUEST_ONLY` with a literal at build time, so the
  minifier drops the dead side. Spike 2026-11-08 (both apps, Vite 8): the guest-only build
  contains `Sign in as guest` and none of `Sign in with Google`, `accounts.google.com`,
  `openidconnect`, `__fakeGoogle`; the default build is the reverse for the guest and Google
  strings; in a browser the guest-only build under `/swfactory/<app>/` makes only same-origin
  requests (including Minesweeper's lazy 3D chunk) and guest sign-in works.

- **Only the deploy build sets it:** `scripts/build-pages.mjs` builds every app in `apps/`
  with `VITE_GUEST_ONLY=true vite build --base /swfactory/<app>/ --outDir _site/<app>`, then
  runs `check-dist --guest-only --out _site --base /swfactory/`. The flag never goes into
  `.env.local`.
- **Mode-aware dist check:** `dist-check.json` keeps `forbidden` (every build) and gains
  `standard` and `guestOnly` blocks with `forbidden` and `required` lists. The platform's file:
  `forbidden: ["__fakeGoogle"]`, `standard.forbidden: ["Sign in as guest"]`,
  `guestOnly.forbidden: ["Sign in with Google", "accounts.google.com", "googleapis.com"]`,
  `guestOnly.required: ["Sign in as guest"]`. With `--out`, every top-level entry of the
  output directory must be a checked app and every app must be present, so the check covers
  exactly the uploaded artifact; entry assets in `index.html` must lie under the app's base and
  exist.
- **CI:** a `pages` job (needs `verify`, runs on every event) builds `_site/`, runs the check
  and a Playwright smoke test against `_site/` served under `/swfactory/` by a strict static
  server, and uploads the artifact only for `main` on push or `workflow_dispatch`. A `deploy`
  job (needs `e2e` and `pages`, same condition) deploys it with `actions/deploy-pages` into the
  `github-pages` environment. No secret, no `configure-pages` (it is optional and fails before
  Pages is enabled).

## Consequences

- Guest sign-in is no longer strictly dev-only: CLAUDE.md "Dev-only code" names it as the one
  exception, tied to this setting. It stays harmless online because it is in memory only (no
  network, no storage, no identity toward a backend); a future backend must never trust a
  guest user.
- 004/AC12 holds only while the setting is off; 001/AC1, 001/AC9, 004/AC1, 004/AC4 and 004/AC11 are
  false in the deploy build (story 018 `changes:`).
- A new app is published on its next merge to `main` without any edit outside `apps/<name>`.
  Code that references files from `public/` must use `import.meta.env.BASE_URL`, not `/x`;
  the pages smoke test fails on any same-origin 404.
- The base prefix `/swfactory/` lives in `scripts/build-pages.mjs` and
  `packages/platform/config/pages.ts`; a mismatch makes every pages test 404. A repository
  rename means changing both.
- The site root `https://hkuegel.github.io/swfactory/` has no page (404) until a story adds
  one; `check-dist --out` then needs a rule for the extra entry.
- Before the first deploy, hak sets Settings → Pages → Source: GitHub Actions once;
  otherwise the `deploy` job fails on `main`.
