---
id: 018
title: Deploy the apps on GitHub Pages
status: done # draft | ready | designed | in-progress | in-test | in-review | done | blocked | superseded
type: feature # feature | bug | chore
app: platform # platform | <app name>: the backlog the story lives in (docs/backlog or apps/<name>/docs/backlog)
branch: feature/018-deploy-github-pages
supersedes: [] # stories this one fully replaces, e.g. [004]
changes: [001/AC1, 004/AC1, 004/AC11, 004/AC12, 001/AC9, 004/AC4] # stories whose behaviour this one modifies, e.g. [004/AC2, 007]
superseded-by: # set on the OLD story when a newer one replaces it
---

# 018 – Deploy the apps on GitHub Pages

## Original request

> 1. hak, 2026-11-08: "können wir das noch irgendwo in der cloud über einen freien kostenplan deployen ? Google zum Beispiel"
> 2. hak's slash command, 2026-11-08: "/feature Deployment auf Firebase Hosting"

Later words of hak (gate 1, 2026-11-08, verbatim):

> 3. "4. mit Gastzugang. 6. ja. wir sollten in keinerlei rechtliche Probleme laufen"
> 4. Choices in a question dialog: Google sign-in online → "Nur Gast online (Recommended)"; Impressum and privacy pages in every app → "Nein"; hosting → "GitHub Pages".

## User story

As the sponsor of the software factory, I want every app to be published automatically on GitHub Pages with guest sign-in only, so that I can open and show the apps from any browser without running them locally and without any Google or cloud console setup.

## Context

- The hosting target changed from Firebase Hosting to GitHub Pages at gate 1 (Decision log). The Firebase research of the first draft is obsolete and removed from this story; the Decision log keeps its trace.
- GitHub Pages facts (research 2026-11-08 from the official GitHub and Vite docs; unconfirmed points are marked):
  - One Pages site per repository: `https://hkuegel.github.io/swfactory/`, so the apps live under subpaths (`/avd/`, `/minesweeper/`). Every app needs its public base path set accordingly; one artifact carries all apps.
  - hak sets "Pages → Source: GitHub Actions" once in the repository settings. The deploy runs as jobs of the CI workflow that need the verify job and run only for pushes to `main`. No token or secret is needed (the workflow's own permissions are enough).
  - No custom cache headers on Pages. Hashed build files make that harmless; the start page may be stale for a few minutes (secondary source, unconfirmed). No cache criterion is therefore written.
  - Limits: site up to 1 GB, bandwidth soft limit 100 GB per month, deploy timeout 10 minutes. Prohibited: sites primarily for commercial transactions or software as a service. Not relevant for these apps.
  - GitHub logs visitor IP addresses (GitHub privacy statement).
- Sign-in online (hak's decision, "Nur Gast online"): the deployed apps offer **only** "Sign in as guest". There is no Google sign-in online, so no OAuth client ID, no consent screen and no Google console step are needed. Open Questions 4 and 6 of the first draft are thereby answered.
- Feasibility (architect, 2026-11-08): guest sign-in is in memory only (no network, no storage), so enabling it online is low risk. The smallest change is a public build setting (default off, set only by the deploy build) so that the existing dev-only guards become "development or setting on". Consequences that the design must handle:
  - 004/AC12 ("no guest option in a production build") holds only while the setting is off; the deploy build is the exception. 001/AC1, 004/AC1 and 004/AC11 name the Google option or the Google intro text and are false in the deploy build. The old ACs are annotated accordingly.
  - The dev-only check (`npm run check:dist`) forbids the guest string today for every build. It must keep forbidding it while the setting is off, and it must forbid the e2e sign-in fake marker always (011/AC6 still holds).
  - The CLAUDE.md "Dev-only code" rule names guest sign-in as its example. It needs an edit, and a new ADR records the decision. This story's AC6 is the approval for that factory-file edit (CLAUDE.md "Factory files").
  - The Google Identity Services script is loaded lazily by the Google client; the design must confirm that the deployed build makes no request to Google on page load.
- The platform serves all apps (ADR 0006): the deploy mechanism is generic and lists apps in configuration; no app name appears in platform code (`npm run check:structure`). App names appear only in this story.
- Legal (hak's decision, no legal assessment by the factory): before hak decided, the orchestrator pointed out that a public site from Germany may need an Impressum (section 5 DDG) and a privacy statement, because GitHub logs visitor IP addresses. hak decided against both pages in the apps ("Nein"). The risk is named in the README (AC7) as a note for hak. Whether this is sufficient is open for hak to review with the AI transformation lead (Open question 2).
- Agents cannot operate the GitHub settings. hak's only one-time manual step: Settings → Pages → Source: GitHub Actions.

## Acceptance criteria

- **AC1:** Given a deploy of `main`, when hak opens `https://hkuegel.github.io/swfactory/avd/` and `https://hkuegel.github.io/swfactory/minesweeper/`, then each shows its own app with its login screen, and none of its JS or CSS files returns a 404 (all asset requests succeed under the subpath). Both apps come from one published artifact, and a further app added to the deploy configuration is published without a change to platform code. (changed by [021](021-factory-landing-page.md): the site root now serves the factory page; the app URLs are unchanged.)
- **AC2:** Given the deploy build, when I open an app's login screen, then it shows "Sign in as guest" and no "Sign in with Google" option, no text that offers Google sign-in (see Open question 1), and the page makes no request to a Google host on load. Choosing "Sign in as guest" signs me in with no error message, and 004/AC2, AC4, AC8 and AC10 still hold.
- **AC3:** Given the default build (guest setting off, as for any other production build), when the dev-only check runs on it, then 004/AC12 holds (no guest option, no guest string in the built files) and the e2e sign-in fake string is absent. Given the deploy build, then the check passes with the guest string allowed and the fake string still absent; and it fails when the fake string appears in either build or when the guest string appears while the setting is off.
- **AC4:** Given local development and test runs (`npm run dev`, `npm run test:e2e`), when I open the login screen, then it behaves as before this story: Google option and guest option both shown (004/AC1, AC11), the e2e sign-in fake works, and no setting has to be provided.
- **AC5:** Given a push to `main`, when verification (`npm run verify`) and the e2e tests are green, then the apps are published once, and the dev-only check ran on exactly the artifact that is published. Given verification, the e2e tests or the dev-only check fail, or a push to a branch other than `main`, then nothing is published. A manual run of the same checks (`workflow_dispatch`) publishes only if all pass. No secret or token is committed, and none is needed. (changed by [021](021-factory-landing-page.md): the published artifact also contains the root page, which the dev-only check covers too.)
- **AC6:** Given the repo, when the factory files are read, then the CLAUDE.md "Dev-only code" rule describes guest sign-in as available in development or when the public build setting is on (deploy build only), keeps the e2e fake as never shipped, and a new ADR records the build setting, the flag-aware check and the subpath hosting decision. This AC approves that edit of a factory file.
- **AC7:** Given the README, when hak sets up deployment, then a deployment section names the one-time step (Pages → Source: GitHub Actions), the URLs of both apps, the manual run, that only guest sign-in is online (no Google), and, as a note for hak, that no Impressum or privacy page is provided by his decision and that GitHub logs visitor IP addresses.
- **AC8:** Given a deploy has run, when hak checks the live apps, then both URLs are reachable, guest sign-in works, a reload on the app path still shows the app, and the apps behave as locally. Manual check: the Test report lists it as such (agents cannot reach the live site).

## Out of scope

- A custom domain, PR preview deployments (hak accepted "no previews"), paid services and any hosting other than GitHub Pages.
- Google sign-in online and everything it needs (client ID, authorized origins, consent screen); Microsoft sign-in (story 002); staying signed in across reloads (story 003); route protection.
- Impressum and privacy pages in the apps (hak: "Nein"); legal assessment.
- A backend, analytics, error monitoring and uptime checks.
- Operating the GitHub settings (hak's manual step).

## Open questions

1. Does the deploy build hide the intro text "Use your Google account to sign in." entirely, or show a short guest-only note? [Copy is left to the UX design; the criterion is only that no Google offer appears.]
2. Is publishing without an Impressum and privacy page acceptable from a legal view? [hak decided "Nein"; the factory makes no legal assessment. Not blocking: hak confirms the decision at gate 1 (a legal review, e.g. by a lawyer, is hak's choice). Marked "prüfungs- bzw. abstimmungsbedürftig".] Closed at gate 1: hak confirmed "Nein" (Decision log).

## Decision log

_Every answer or correction from hak and every scope decision, so the story can be
rebuilt without the chat. Append only._

- 2026-11-08 — Scope decision (orchestrator): recommended Firebase Hosting on the Spark plan, one site per app in one Firebase project; open points named to hak: which apps, manual or automatic deploy, guest access online. hak then started `/feature Deployment auf Firebase Hosting`. The proposals in the Open questions are unconfirmed defaults. **Superseded by the entries below (hosting is GitHub Pages).**
- 2026-11-08 — Gate 1, general: after the orchestrator said that its proposal holds for every point hak does not name, hak answered: "4. mit Gastzugang. 6. ja. wir sollten in keinerlei rechtliche Probleme laufen". (product-owner)
- 2026-11-08 — Q4 (guest sign-in online?): hak: "4. mit Gastzugang." Then, in the question dialog, for Google sign-in online: "Nur Gast online (Recommended)". Consequence: deployed apps offer only guest sign-in, no Google; AC2, AC3, AC6; 004/AC12 and others get `changes:`.
- 2026-11-08 — Q6 (publish the OAuth consent screen without branding): hak said "6. ja" before choosing guest only. **Obsolete:** with no Google sign-in online there is no consent screen step.
- 2026-11-08 — Hosting (question dialog): hak chose "GitHub Pages". Consequence: Firebase decisions are superseded; Q5 (site IDs), Q7 (Firebase terms) and Q8 (quota conflict) are obsolete; story renamed to 018-deploy-github-pages; first-draft Firebase Context and ACs replaced.
- 2026-11-08 — Impressum and privacy pages in every app (question dialog): hak chose "Nein". Orchestrator note: before this, it pointed out (no legal assessment) that a public site from Germany may need an Impressum (section 5 DDG) and a privacy statement because GitHub logs visitor IP addresses. hak decided against both pages; the risk is recorded here and in the README (AC7). hak also said: "wir sollten in keinerlei rechtliche Probleme laufen"; this tension is Open question 2.
- 2026-11-08 — Q1 (which apps), Q2 (automatic deploy on push to `main` after green CI plus a manual fallback) and Q3 (no PR previews): accepted proposals through hak's "my proposal holds for all points you don't name". With GitHub Pages the manual fallback is a manual `workflow_dispatch` run with the same checks (AC5).
- 2026-11-08 — Feasibility (architect): guest sign-in is in memory only, so enabling it online is low risk; a public build setting (default off) is the smallest change; `check:dist` must become flag-aware; the CLAUDE.md dev-only rule and 004/AC12 need changes. Recorded in Context, AC3, AC6. (product-owner)

<!-- Sections below are filled in by later roles. Don't delete headings. -->

- 2026-11-08 — Gate 1: hak approved the story ("Ja, committen") after the orchestrator said that approving it confirms the "Nein" to Impressum and privacy pages; Open question 2 is closed by that confirmation. A legal review stays hak's choice.
- 2026-11-08 — Design: the architect found 001/AC9 and 004/AC4 also name the Google option after sign-out; added to `changes:` with the "holds while the guest-only build setting is off" annotation.
- 2026-11-08 — Gate 2: hak approved all retro proposals and the commit ("Alle, dann committen"). Manual checks (Pages source set to GitHub Actions before the merge, the first CI deploy on main, both live URLs with guest sign-in) not answered by hak: recorded as not run, open.

## UX design

_ux-designer: component tree, states (loading/empty/error/success), interactions, accessibility notes._

Scope: only the login screen of the **deploy build** (`VITE_GUEST_ONLY === 'true'`). The
standard build (dev, e2e, any other production build) keeps the look and copy of 001 and 004
unchanged (both buttons, intro "Use your Google account to sign in.", dashed secondary guest
button). The login copy today is English, so the new text is English. Nothing in the deploy
build's login screen may contain the word "Google" (pages spec asserts no visible `/Google/`).

#### 1. Layout (deploy build)

```text
div.login (card, unchanged)
  p                                  intro, first child of the card (kept for CSS and auth.spec)
  div.buttons
    Button variant="primary" (ref = signInButtonRef)   "Sign in as guest"
  div[aria-live="polite"].messages   mounted empty, stays empty
```

Reused: card, `.buttons`, `.messages`, shared `Button`. No new component, no new token, no
new colour (the primary `Button` already paints `--color-accent` / `--color-on-accent`).

#### 2. Decisions on the points of Technical design section 10

1. **Intro text: shown, one short `<p>`.** Hiding it would leave a card with a lone button and
   no hint why there is no account sign-in; the card's first child stays a `<p>`. One
   paragraph carries both the "guest only" note and the "nothing is stored" hint (point 5), so
   there is no second element.
2. **Guest button: `variant="primary"`, no dashed border.** It is the only action on the
   screen, so it is the one filled action ("Start" convention in `Button.module.css`). The
   dashed border marks a test tool next to a real option; online the guest sign-in is the
   real entry, so the dashed style would mislead. Keep `width: 100%` (same rule as in the
   standard build). The label stays exactly "Sign in as guest".
3. **Focus after sign-out: confirmed, the guest button** (`signInButtonRef` on it, as in
   Technical design section 1). It is the only sign-in control, so focus lands on a visible,
   enabled, named control and never on `body`.
4. **Live region: confirmed mounted, empty, and stays empty.** No Google progress or notices
   can occur, so no announcement is needed. Keep it mounted (same `div aria-live="polite"`,
   no `role`), so the markup and the `min-height` reservation match the standard build and
   nothing jumps. Guest sign-in itself moves focus (the app shell takes over), so it needs no
   announcement (as in 004).
5. **Hint that nothing is stored: yes, inside the intro `<p>`** (see Copy). It helps: after
   a reload the guest is signed out (004/AC10), and the visitor should know before choosing.

#### 3. Copy (exact)

| Element         | Deploy build text                                                                 |
| --------------- | --------------------------------------------------------------------------------- |
| Intro `<p>`     | `This site offers guest access only. Nothing is stored; reloading signs you out.` |
| Button          | `Sign in as guest` (unchanged, AC2)                                               |
| Live region     | empty                                                                             |
| Error or notice | none (cannot occur; the Google texts stay unreachable in the bundle)              |

Collision check: the intro contains neither "Sign in as guest" (getByText is a
case-insensitive substring match) nor "Google". Its only overlap with the button is the word
"guest"; role queries on the button name are not affected.

#### 4. States

| State                | What the user sees and can do                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Default (only state) | Card with intro and enabled primary button; Enter/Space or click signs in.                                                       |
| Loading              | None. Guest sign-in is synchronous and in memory, so there is no progress callout and the `.messages` area stays empty.          |
| Empty                | Not applicable.                                                                                                                  |
| Error                | None can occur; no `role="alert"` is rendered.                                                                                   |
| Success              | The app shell shows the signed-in view (004/AC2, AC8); focus moves as already implemented by `useAuthFocus`.                     |
| Disabled             | `inProgress` is never true here, so the button is never disabled. If it ever were, native `disabled` and the Button's own style. |
| After sign-out       | Login screen again, focus on "Sign in as guest" (point 3).                                                                       |

#### 5. Interactions and accessibility

- One interactive element, a native `<button type="button">` with the accessible name "Sign
  in as guest"; Tab reaches it, Enter and Space activate it. No other focus stops on the card.
- The intro `<p>` is plain text, not linked to the button (no `aria-describedby`): the
  sentence is short and read in document order before the button.
- Focus indicator: the existing shared focus style (`--color-focus`: light #1d4ed8, dark
  #a8c7fa, 3:1 against the card surface #ffffff / #1b1f26, as in 001). On the primary button
  the ring sits outside the filled area, against the card, so it stays visible.
- The page title and the app's `h1` are unchanged, so the screen-reader landmark structure
  equals the standard build.

#### 6. Colours and contrast (light and dark)

No new element is coloured; all values come from existing tokens. Contrast computed by hand
(sRGB linearisation, no shell available); the tester re-checks with a tool.

| Element             | Light                                                   | Dark                                   | Contrast                     |
| ------------------- | ------------------------------------------------------- | -------------------------------------- | ---------------------------- |
| Intro text          | `--color-text` #1b1f24 on `--color-surface` #ffffff     | `--color-text` #e8eaed on #1b1f26      | about 16:1 / 13:1 (AA)       |
| Button label        | `--color-on-accent` #ffffff on `--color-accent` #1d4ed8 | `--color-on-accent` #062e6f on #a8c7fa | about 6.7:1 / 7.7:1 (AA)     |
| Button fill vs card | #1d4ed8 on #ffffff                                      | #a8c7fa on #1b1f26                     | about 6.7:1 / 9.4:1 (3:1 UI) |
| Focus ring vs card  | `--color-focus` #1d4ed8 on #ffffff                      | #a8c7fa on #1b1f26                     | same as above (3:1)          |

All margins are large; none is tight. Hover and pressed states use the existing
`--color-accent-hover` / `--color-accent-active` of the Button (hover only inside
`@media (hover: hover)`, as the Button already does).

#### 7. Forced colours

The shared primary `Button` already sets `border-color: ButtonText` in
`@media (forced-colors: active)`, so the fill-less button keeps a visible 1 px border; the card
keeps `CanvasText`. Focus stays an `outline`. Dropping the dashed border removes the only
style that relied on `--color-edge`, so nothing else is needed. The guest-only branch must not
add a `box-shadow` or background as the sole cue.

#### 8. Responsive (below 600 px)

No change to the card: padding stays `--space-4` below 600 px and `--space-5` from 600 px up.
The button fills the card width (`width: 100%`), the intro wraps to at most three lines at
320 px; the touch target is the Button's `--control-height`. No horizontal scrolling.

#### 9. For the developer (CSS and markup)

- Inside the literal guard, render `variant="primary"` and keep `className={styles.guest}`
  only for `width: 100%`; the dashed border and the `--color-edge` colour rules of
  `.buttons .guest` apply **only** in the standard build. Cleanest: split the module rules,
  `.guest` (width) plus `.guestTool` (dashed, `--color-edge`, `--color-text`) and set
  `variant` and the extra class by the guard, e.g. standard build
  `variant="secondary"` + `styles.guestTool`, deploy build `variant="primary"` only. The
  standard build's rendered look must stay pixel-identical (AC4).
- Note: `.buttons .guest:not(:disabled)` currently also overrides the primary text colour with
  `--color-text`, which would give dark text on the blue fill; this rule must not apply in the
  deploy build (it is the reason for the split above).
- The intro `<p>` is the first direct child of `.login` in both builds (the
  `.login > p:first-child` rule and `auth.spec.ts` rely on it).

#### 10. Contradictions with the Technical design

None. Section 10 point 2 is answered with `variant="primary"` (allowed in its sketch); the
sketch's single `.guest` class needs the split of section 9 above. Open question 1 is
answered: short guest-only note, no word "Google".

## Technical design

_architect: affected modules, new files, data flow, types/interfaces, dependencies, risks, ADR links._

Decision record: [ADR 0010](../adr/0010-github-pages-guest-only-deploy-build.md) (build
setting, mode-aware dist check, subpath hosting); [ADR 0006](../adr/0006-monorepo-npm-workspaces-platform-as-source.md)
gets a "Revised" line. No new dependency.

#### Spike (2026-11-08, scratchpad copy of the repo, Vite 8, both apps)

The guards below were applied to a throwaway copy and both apps built twice:

| String in the built files  | default build | `VITE_GUEST_ONLY=true` + `--base /swfactory/<app>/` |
| -------------------------- | ------------- | --------------------------------------------------- |
| `Sign in as guest`         | absent        | present                                             |
| `Sign in with Google`      | present       | absent                                              |
| `accounts.google.com`      | present       | absent                                              |
| `openidconnect` (userinfo) | present       | absent                                              |
| `__fakeGoogle`             | absent        | absent                                              |

In Chromium, served by a strict static server under `/swfactory/` (no SPA fallback, like
Pages), both apps loaded with only same-origin requests, all `200`, Minesweeper's lazy 3D chunk
included; guest sign-in and a reload worked. The unreachable Google progress/notice texts stay
in the bundle (harmless: nothing can call `signIn` without the Google button).

Where the GIS script loads today: on **page load**, not on click.
`createGoogleAuthClient()` calls `startLoad()` at creation, and `createAuthClient()` runs once
in every app's `main.tsx`. So "no Google request on load" needs `createAuthClient` itself to
skip the Google client, not only a hidden button.

#### 1. Build setting

One public build setting, **`VITE_GUEST_ONLY`**; `'true'` means "guest sign-in on, Google
sign-in off" (hak: "Nur Gast online"). Unset everywhere except the deploy build, so
`npm run dev`, `npm run test:e2e`, `npm run build` and CI's verify behave as before (AC4).
"No client ID ⇒ no Google UI" was rejected: dev and e2e run without a client ID and would lose
the Google button (ADR 0010).

```ts
// packages/platform/src/vite-env.d.ts — add to ImportMetaEnv
/**
 * Public build setting of the GitHub Pages deploy build (story 018, ADR 0010): 'true' = guest
 * sign-in only, no Google sign-in. Set only by scripts/build-pages.mjs; never in .env.local.
 */
readonly VITE_GUEST_ONLY?: string;
```

Guards, written out literally at every use site (CLAUDE.md "Dev-only code"); no shared
`guestOnly` constant:

| File                                             | Guard                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/platform/src/auth/createAuthClient.ts` | First statement: `if (import.meta.env.VITE_GUEST_ONLY === 'true') return notConfiguredClient;` — before the e2e branch and before the client-ID check, so no GIS script, no userinfo call and no "VITE_GOOGLE_CLIENT_ID is not set" console error in the deploy build.                                      |
| `packages/platform/src/auth/AuthProvider.tsx`    | `signInAsGuest: import.meta.env.DEV \|\| import.meta.env.VITE_GUEST_ONLY === 'true' ? signInAsGuest : undefined`                                                                                                                                                                                            |
| `packages/platform/src/auth/LoginView.tsx`       | Intro text and `GoogleSignInButton` each inside `import.meta.env.VITE_GUEST_ONLY !== 'true' && …`; guest button inside `(import.meta.env.DEV \|\| import.meta.env.VITE_GUEST_ONLY === 'true') && onSignInAsGuest && …`; guest-only copy/variant per UX inside `import.meta.env.VITE_GUEST_ONLY === 'true'`. |

`LoginViewProps`, `AuthContextValue`, `AppShell` and `useAuthFocus` keep their signatures.
Focus after sign-out (`useAuthFocus` focuses `signInButtonRef`): in the guest-only build that
ref goes on the guest `Button` (it forwards `ref` through `ComponentPropsWithRef`), because
the Google button doesn't exist:

```tsx
// LoginView.tsx, guest button (sketch; copy and variant per UX)
<Button
  ref={import.meta.env.VITE_GUEST_ONLY === 'true' ? signInButtonRef : undefined}
  variant="secondary" /* UX may choose 'primary' in guest-only */
  className={styles.guest}
  disabled={inProgress}
  onClick={onSignInAsGuest}
>
  Sign in as guest
</Button>
```

Keep the standard build's markup identical: the intro `<p>` stays the first direct child of
the card (`.login > p:first-child` in CSS; `auth.spec.ts` `loginCardContentWidth` walks
`locator('..')` from it). No other spec walks up from login markup.

Doc comments to update (no behaviour): `AuthContext.ts` (`signInAsGuest` "present in DEV builds
and in the guest-only deploy build"), `guestUser.ts`, `types.ts` (guest "dev-only" → "dev or
guest-only build"), `useAuthFocus.ts` (sign-out focuses the first sign-in button), the two
"Literal DEV guard … (AC12)" comments.

State ownership is unchanged: the setting is a build-time constant, nothing at runtime reads
or stores it.

#### 2. Subpath hosting and app discovery

- Every workspace under `apps/` (directory with a `package.json`, same rule as
  `check-dist`'s `defaultApps()`) is deployed to `/swfactory/<dir>/`. The `apps/` directory is
  the deploy configuration (ADR 0010); a new app from `/new-app` is published on its first
  merge to `main` (AC1) with no edit to the platform, `templates/app` or `scripts/new-app.mjs`.
- The base is passed on the Vite CLI only by the deploy script, so `vite.config.ts` of the
  apps and the skeleton, dev (`/`), preview and e2e (`/`) are untouched. `index.html`'s
  `/src/main.tsx` is rewritten by Vite; lazy chunks use relative imports (checked in the spike).
- `PAGES_BASE = '/swfactory/'` is a constant in `scripts/build-pages.mjs` and in
  `packages/platform/config/pages.ts`, each with a comment naming the other; a mismatch makes
  every pages test 404, so it can't go unnoticed.

`scripts/build-pages.mjs` (new, devops), plain Node like `check-template.mjs`:

1. `rmSync(_site, { recursive: true, force: true })`.
2. Discover apps (sorted); fail if none.
3. Per app: `spawnSync(<root>/node_modules/.bin/vite, ['build', '--base', `${PAGES_BASE}${app}/`, '--outDir', <root>/_site/<app>, '--emptyOutDir'], { cwd: apps/<app>, env: { ...process.env, VITE_GUEST_ONLY: 'true' }, stdio: 'inherit' })`; exit 1 on a non-zero status. No `tsc` (typecheck is `verify`'s job).
4. Run `node scripts/check-dist.mjs --guest-only --out _site --base /swfactory/`; exit with its status.
5. Print `build-pages: ok _site/ (<apps>)`.

`scripts/serve-pages.mjs <siteDir> <base> <port>` (new, devops): ~25 lines of `node:http`, a
strict static server like Pages: only paths under `<base>`, a directory serves its
`index.html`, everything else `404`, no SPA fallback, no path escape (`normalize` + prefix
check). Content types for html/js/css/svg/png/ico/json.

#### 3. Mode-aware `check:dist`

CLI: `node scripts/check-dist.mjs [--guest-only] [--out <dir>] [--base <prefix>] [app …]`

- **Mode:** `standard` (default) or `guestOnly` (`--guest-only`). The caller states the mode;
  the rules are symmetric, so a build checked in the wrong mode always fails (guest string
  forbidden vs. required). The check never reads `VITE_GUEST_ONLY` from the environment.
- **Where:** without `--out`, `apps/<app>/dist` (unchanged). With `--out <dir>`, `<dir>/<app>`,
  and: `<dir>` exists; every top-level entry of `<dir>` is the directory of a checked app
  (else fail "unchecked entry"); every app has its directory (else fail). So every file of the
  uploaded artifact is checked (AC5).
- **Base:** `--base` defaults to `/`. The URL prefix of an app is `<base><app>/` with `--out`,
  else `<base>`. Every module script, `modulepreload` and stylesheet URL in `index.html` must
  start with that prefix and resolve to an existing file of the build (else fail "entry asset
  … outside the base or missing"). This replaces today's `replace(/^(\.\/|\/)/, '')`, which
  under a subpath would resolve to wrong paths and make the `lazyChunks` entry check vacuous.
- **Rules:** forbidden = platform `forbidden` ∪ app `forbidden` ∪ platform `[mode].forbidden` ∪
  app `[mode].forbidden`; required = platform `[mode].required` ∪ app `[mode].required`; a
  required string must occur in at least one file of the app's build.
- **Config validation:** allowed top-level keys `forbidden`, `lazyChunks`, `standard`,
  `guestOnly` (an unknown key such as `guestonly` fails); `standard`/`guestOnly` are objects
  with optional `forbidden`/`required` arrays of non-empty strings. The platform file must have
  a non-empty `forbidden`, `standard.forbidden` and `guestOnly.required` (an empty list would
  silence the check). App files: all keys optional.
- **Output:** `check-dist: ok <app> (<mode>, N files, …)`.

```json
// packages/platform/dist-check.json (new content)
{
  "forbidden": ["__fakeGoogle"],
  "standard": { "forbidden": ["Sign in as guest"] },
  "guestOnly": {
    "forbidden": ["Sign in with Google", "accounts.google.com", "googleapis.com"],
    "required": ["Sign in as guest"]
  }
}
```

`apps/minesweeper/dist-check.json` is unchanged (its `forbidden` and `lazyChunks` apply in both
modes; the lazy-chunk check runs on `_site/minesweeper` too).

#### 4. CI (`.github/workflows/ci.yml`, devops)

Action versions checked on 2026-11-08 via the GitHub API (latest releases; major tags exist):
`actions/checkout@v7` (7.0.1), `actions/setup-node@v7` (7.1.0),
`actions/upload-pages-artifact@v5` (5.0.0), `actions/deploy-pages@v5` (5.0.1),
`actions/upload-artifact@v7` (7.0.2). The existing jobs use `@v4`; bump them in the same edit so
the file has one version per action. `actions/configure-pages` is not used (optional; it fails
while Pages is not enabled, which would break PR runs).

```yaml
on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  verify: # unchanged steps (checkout/setup-node @v7); `npm run verify` now includes build:pages
  e2e: # unchanged, needs: verify (upload-artifact @v7)

  pages:
    runs-on: ubuntu-latest
    needs: verify
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      # Builds every app guest-only under /swfactory/<app>/ into _site/, checks _site/
      # (check-dist --guest-only --out), then smoke-tests _site/ served under the subpath.
      - run: npm run test:pages
      - uses: actions/upload-pages-artifact@v5
        if: github.ref == 'refs/heads/main' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')
        with:
          path: _site
      - uses: actions/upload-artifact@v7
        if: failure()
        with:
          name: pages-test-results
          path: packages/platform/test-results

  deploy:
    needs: [e2e, pages]
    if: github.ref == 'refs/heads/main' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')
    runs-on: ubuntu-latest
    permissions:
      pages: write # create the Pages deployment
      id-token: write # OIDC token that proves the deployment's origin
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    concurrency:
      group: pages
      cancel-in-progress: false # never cut off a running deployment
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

AC5 by construction: `deploy` needs `e2e` (which needs `verify`) and `pages` (which ran the
check and the smoke test on the uploaded `_site/`); PRs, other branches and a manual run on
another branch never upload or deploy; one push → one run → one deployment. No secret: the
job token with `pages`/`id-token` is enough. The `github-pages` environment's default-branch
protection (created by GitHub) is a second guard.

#### 5. Files and role split

**developer** (platform `src/`):

| File                                                            | Change                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------- |
| `packages/platform/src/vite-env.d.ts`                           | `VITE_GUEST_ONLY?: string`                                 |
| `packages/platform/src/auth/createAuthClient.ts`                | guest-only early return (no Google client)                 |
| `packages/platform/src/auth/AuthProvider.tsx`                   | guest guard `DEV \|\| VITE_GUEST_ONLY === 'true'`          |
| `packages/platform/src/auth/LoginView.tsx` (+ `.module.css`)    | Google intro/button guards, guest guard, ref, UX copy/look |
| `AuthContext.ts`, `guestUser.ts`, `types.ts`, `useAuthFocus.ts` | doc comments only                                          |

**devops** (scripts, configs, workflow, ignores, factory file):

| File                                                        | Change                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/check-dist.mjs`                                    | modes, `--out`, `--base`, required strings, key validation (section 3)                                                                                                                                                                                                                                                                   |
| `packages/platform/dist-check.json`                         | new content (section 3)                                                                                                                                                                                                                                                                                                                  |
| `scripts/build-pages.mjs`                                   | new (section 2)                                                                                                                                                                                                                                                                                                                          |
| `scripts/serve-pages.mjs`                                   | new strict static server (section 2)                                                                                                                                                                                                                                                                                                     |
| `packages/platform/config/pages.ts`                         | new: `PAGES_BASE`, `PAGES_PORT = 5175`, `SITE_DIR` (repo root `_site`), `listSiteApps()` (reads `_site` dirs, throws on none)                                                                                                                                                                                                            |
| `packages/platform/config/playwright.pages.ts`              | new Playwright config: `testDir: '../e2e/pages'`, `outputDir: '../test-results/pages'`, Desktop Chrome, `baseURL: http://localhost:5175/swfactory/`, `webServer: { command: node scripts/serve-pages.mjs <SITE_DIR> <PAGES_BASE> <port> (absolute paths), port, reuseExistingServer: false }`, CI retries/reporter as in `playwright.ts` |
| `packages/platform/config/playwright.ts`                    | `platform` project: `testIgnore: '**/pages/**'` (the pages spec needs `_site/`, not the dev server)                                                                                                                                                                                                                                      |
| root `package.json`                                         | `"build:pages": "node scripts/build-pages.mjs"`, `"test:pages": "npm run build:pages && playwright test -c packages/platform/config/playwright.pages.ts"`; `verify` ends with `&& npm run build:pages` (two extra Vite builds, about 1 s)                                                                                                |
| `.gitignore`, `.prettierignore`, `eslint.config.js` ignores | add `_site` (else `format:check`/`lint` scan the built JS after a local `build:pages`)                                                                                                                                                                                                                                                   |
| `.github/workflows/ci.yml`                                  | section 4                                                                                                                                                                                                                                                                                                                                |
| `CLAUDE.md`                                                 | "Dev-only code" wording below (approved by AC6)                                                                                                                                                                                                                                                                                          |

**tester:** `packages/platform/e2e/pages/pages.spec.ts` (section 7), the script probes, the
Test report. **tech-writer:** README "Deployment" section (AC7: one-time step Settings → Pages
→ Source: GitHub Actions, both URLs, manual run via "Run workflow", guest only online, the
note on no Impressum/privacy page by hak's decision and GitHub logging visitor IP addresses,
`npm run build:pages` / `npm run test:pages`, "never put `VITE_GUEST_ONLY` in `.env.local`"),
CHANGELOG. **architect:** ADR 0010, ADR 0006 revision (done).

No change to `templates/app/**` or `scripts/new-app.mjs` (AC1 holds by discovery).

#### 6. CLAUDE.md "Dev-only code" — exact new wording (devops applies, AC6)

Replace the first four sub-bullets of "Dev-only code" (from "must never reach" to "so Vite
drops the code;") with:

```markdown
- **Dev-only code** must never reach a production build (checked per app):
  - test fakes (e.g. the e2e sign-in fake) via
    `import.meta.env.DEV && import.meta.env.MODE === '<mode>'`; never shipped, whatever
    build setting is on;
  - dev-only features via `import.meta.env.DEV`;
  - one exception, guest sign-in (ADR 0010): available in development or when the public
    build setting `VITE_GUEST_ONLY` is `'true'`, via
    `import.meta.env.DEV || import.meta.env.VITE_GUEST_ONLY === 'true'`; Google sign-in is
    then left out via `import.meta.env.VITE_GUEST_ONLY !== 'true'`. Only the GitHub Pages
    deploy build (`npm run build:pages`) sets it; never put it in `.env.local`;
  - in every case written out literally at every use site — never a shared constant or
    runtime flag — so Vite drops the code (a `VITE_*` setting is replaced by a literal at
    build time; a value read at runtime is not);
```

and in the next sub-bullet replace "are added to `dist-check.json` (`forbidden`)" with "are
added to `dist-check.json` (`forbidden` for every build; `standard` / `guestOnly` for strings
that depend on the build setting)", and "fails if they appear in an app's `dist/`" with "fails
if they appear in an app's `dist/` or in the deploy output `_site/`". The other sub-bullets
stay.

#### 7. Minimal test set

| AC       | Test (level)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC1, AC2 | **e2e** `packages/platform/e2e/pages/pages.spec.ts`, one test per app from `listSiteApps()` (throws on an empty `_site`, no vacuous pass), named `AC1/AC2: <app> under the subpath offers only guest sign-in`: record requests from before `goto('<app>/')`; h1 = the `<title>` of `_site/<app>/index.html`; "Sign in as guest" visible; no "Sign in with Google" button and `getByText(/Google/)` count 0; every request is same-origin (no Google or other third-party host on load); every document/script/stylesheet response < 400 and at least one script and one stylesheet loaded (non-vacuous); guest sign-in → banner "Signed in as Guest", no `alert` (004/AC2, AC8); reload → login screen (004/AC10); guest sign-in, "Sign out" → login screen with the guest option, focus on it (004/AC4).                                                                                                                                                                                                                                              |
| AC1      | **probe** (Test report, not committed): in a scratch copy, `node scripts/new-app.mjs zzprobe`, `npm install`, `npm run test:pages` → `_site/zzprobe` exists, check and spec pass for 3 apps, `git status` shows no change outside `apps/zzprobe` (plus lockfile); then remove it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| AC2      | static part by `check-dist --guest-only` inside `build:pages` (in `verify` and CI): guest string required, `Sign in with Google`, `accounts.google.com`, `googleapis.com` forbidden.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| AC3      | **script** `check:dist` (standard) and `build:pages` (guest-only) both in `verify`, plus **probes** (Test report), each must fail with a clear message: (a) control build `NODE_ENV=development vite build --mode e2e` in an app → standard check fails on `__fakeGoogle` and the guest string; (b) that control output copied into a scratch `_site/<app>` → `--guest-only --out` fails on `__fakeGoogle`; (c) `_site` checked without `--guest-only` → fails on the guest string; (d) a default `dist` checked with `--guest-only` → fails (guest string missing, Google strings present). Near misses: (e) a stray `_site/stray.txt` → fails; (f) one app directory missing in `_site` → fails; (g) `--out` on an empty dir → fails; (h) key typo `"guestonly"` in a scratch `dist-check.json` → fails; (i) `"required": []` in the platform file → fails; (j) a deploy build with `VITE_GUEST_ONLY=1` (not `'true'`) → `--guest-only` check fails; (k) a build with `--base /wrong/` checked with `--base /swfactory/` → fails "outside the base". |
| AC4      | existing specs unchanged and green: `auth-guest.spec.ts` (AC1/AC11 both options + intro), `smoke.spec.ts`, `auth.spec.ts`; existing unit tests unchanged (the flag is unset in Vitest). No new test.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| AC5      | **review** of `ci.yml` (needs, `if`, permissions, environment, concurrency) + the PR run of this branch: `pages` job green, upload and `deploy` skipped. The first `main` run is part of hak's AC8 check.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| AC6      | **review**: CLAUDE.md wording (section 6) and ADR 0010.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| AC7      | **review** of the README section.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| AC8      | manual (hak), listed as such.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

No unit test for the guest-only guards: their visible effect is the pages e2e on the real
production build, which is the only place where the folding matters; a Vitest `stubEnv` test
would repeat it. Existing tests that change: none in substance; `auth-guest.spec.ts`'s header
comment ("AC12 … is `npm run check:dist`") may name the standard mode.

#### 8. Risks and mitigations

| Risk                                                                                                     | Mitigation                                                                                                                        |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| A guard written as a shared constant or with another value (`'1'`) keeps Google code in the deploy build | Literal guards (CLAUDE.md); `check-dist --guest-only` forbids the Google label and hosts and requires the guest string; probe (j) |
| `VITE_GUEST_ONLY` in a developer's `.env.local` makes every build guest-only                             | Loud: `verify`'s standard `check:dist` and the unit/e2e tests fail; README says never to set it                                   |
| `_site/` scanned by prettier/eslint after a local `build:pages`                                          | add `_site` to `.gitignore`, `.prettierignore`, eslint ignores in the same change                                                 |
| Wrong base → assets 404 under the subpath                                                                | `check-dist --base` (static) + pages spec (browser, strict server without SPA fallback)                                           |
| `public/` file referenced as `/x.png` in a future app                                                    | pages spec fails on any same-origin 404; README note: use `import.meta.env.BASE_URL`                                              |
| Pages not enabled when the branch is merged → `deploy` red on `main`                                     | README step; the orchestrator asks hak to set Settings → Pages → Source: GitHub Actions before the merge                          |
| Pages spec picked up by every app's `platform` project                                                   | `testIgnore: '**/pages/**'` in `createAppPlaywrightConfig`                                                                        |
| Stale `_site` from an earlier run is uploaded                                                            | `build-pages.mjs` deletes `_site` first; `test:pages` always builds before testing                                                |
| Site root `/swfactory/` is a GitHub 404                                                                  | out of the ACs; README lists the two app URLs; a later story may add an index page (then `check-dist --out` needs a rule for it)  |

#### 9. Implementation plan (each step green)

1. **developer:** platform guards, `vite-env.d.ts`, ref on the guest button, UX copy/look for
   the guest-only branch, doc comments. Green: `npm run verify` (standard build unchanged, so the
   old `check:dist` still passes), `npm run test:e2e`.
2. **devops:** `check-dist.mjs` modes/`--out`/`--base` + new `packages/platform/dist-check.json`
   (standard mode must still pass on `apps/*/dist`).
3. **devops:** `build-pages.mjs`, `serve-pages.mjs`, `config/pages.ts`,
   `config/playwright.pages.ts`, `testIgnore` in `config/playwright.ts`, root scripts and
   `verify`, ignores. Green: `npm run verify`, `npm run test:e2e`.
4. **tester:** `pages.spec.ts`, then `npm run test:pages` green; probes AC1 and AC3 (a)–(k).
5. **devops:** `ci.yml`; CLAUDE.md wording (section 6).
6. **tech-writer:** README "Deployment", CHANGELOG.

#### 10. Points for the ux-designer

1. **Intro text in the guest-only build** (Open question 1): hide it, or a short guest-only
   note. It must not contain the word "Google" (the pages spec asserts no visible
   `/Google/` text on the login screen). If shown, keep it a `<p>` as the card's first child.
2. **Guest button look** when it is the only option: today it is `secondary` with a dashed
   border that marks a test tool. Decide whether the guest-only build uses `primary` and/or
   drops the dashed border (a `variant`/class chosen inside the literal guard). The label stays
   exactly "Sign in as guest" (AC2, `check-dist` requires it).
3. **Focus after sign-out** in the guest-only build: my proposal is the guest button (the
   only sign-in control); confirm.
4. The live region stays mounted and empty (no Google progress or notices can occur).
5. Optional: a one-line hint that nothing is stored (guest data is lost on reload, 004/AC10) —
   your call; same "no Google" rule.

#### 11. Notes for the orchestrator (not blocking)

- 001/AC9 ("sign-out shows the 'Sign in with Google' option") and 004/AC4 ("both sign-in
  options") are also false in the deploy build; per CLAUDE.md "Traceability" they belong in
  `changes:` with the "holds while …" annotation (product-owner).
- "Deploy configuration" in AC1 is implemented as "every workspace under `apps/`" (no separate
  list); ADR 0010 gives the reason.

## Implementation notes

_developer: what was built, deviations from the design and why._

Developer part (Technical design §5 "developer", plan step 1). Done 2026-11-08; devops continues
with steps 2–3 and 5, so the status stays `in-progress`.

- `vite-env.d.ts`: `VITE_GUEST_ONLY?: string` with the doc comment from §1.
- `createAuthClient.ts`: the first statement returns `notConfiguredClient` when
  `VITE_GUEST_ONLY === 'true'` (before the e2e fake and the client-ID check).
- `AuthProvider.tsx`: `signInAsGuest` behind `DEV || VITE_GUEST_ONLY === 'true'`.
- `LoginView.tsx`: every guard written out literally. Intro: two guarded `<p>`s (standard copy /
  UX §3 guest-only copy), so the first child of the card is a `<p>` in both builds. Google button
  behind `VITE_GUEST_ONLY !== 'true'`. Guest button behind
  `(DEV || VITE_GUEST_ONLY === 'true') && onSignInAsGuest`; in guest-only it gets `signInButtonRef`, `variant="primary"` and only
  `styles.guest`; in the standard build `variant="secondary"` and `styles.guest styles.guestTool`.
- `LoginView.module.css`: UX §9 split. `.buttons .guest` keeps only `width: 100%`; the dashed
  border and the `--color-edge` / `--color-text` rules moved to `.buttons .guestTool` with the same
  specificity, so the standard build looks the same (one extra class name on the button).
- Doc comments: `AuthContext.ts`, `guestUser.ts`, `types.ts`, `useAuthFocus.ts`, `LoginViewProps`,
  and the two "Literal DEV guard … (AC12)" comments.
- No new test (§7: AC4 is covered by the unchanged specs; the guards by the pages e2e).

Checks: `npm run verify` green (unit tests 5 + 154 + 100 + 95, standard `check:dist` ok for both
apps); `npm run test:e2e` green (avd 80, minesweeper 110). Self-check, not kept: avd built with
`VITE_GUEST_ONLY=true --base /swfactory/avd/` into the scratchpad → "Sign in as guest" 1,
"Sign in with Google" 0, "accounts.google.com" 0, "googleapis.com" 0, `__fakeGoogle` 0; the
standard `apps/avd/dist` → guest 0, Google label 1, `accounts.google.com` 1. In Chromium under
`vite preview` with that base (light and dark): one button, filled with `--color-accent` and
`--color-on-accent` label, full card width, no `/Google/` text, only same-origin requests, focus
on "Sign in as guest" after sign-out.

Deviations: none in substance. The intro uses two guarded `<p>`s rather than one guarded Google
intro (§1 table), because UX §2 keeps a guest-only intro; the unreachable Google progress/notice
texts stay in the live region, as the spike expected.

DevOps part (plan steps 2, 3 and 5). Done 2026-11-08.

- `scripts/check-dist.mjs` rewritten to the design: `--guest-only`, `--out`, `--base`, symmetric
  `standard` / `guestOnly` rules (forbidden and required), artefact completeness for `--out`
  (unchecked entry / missing app fail), base-aware entry asset resolver (module scripts,
  modulepreload and stylesheets must lie under `<base>[<app>/]` and exist), unknown keys fail,
  platform lists must be non-empty. Bad options exit 2.
- New: `scripts/build-pages.mjs`, `scripts/serve-pages.mjs`, `packages/platform/config/pages.ts`,
  `config/playwright.pages.ts`; `packages/platform/dist-check.json` new content; `testIgnore` in
  `config/playwright.ts`; root scripts `build:pages`, `test:pages`, `verify` ends with `build:pages`;
  `_site` in `.gitignore`, `.prettierignore`, `eslint.config.js`.
- `.github/workflows/ci.yml` as designed (`pages` + `deploy` jobs). Majors verified with
  `gh api .../releases/latest` on 2026-11-08: checkout v7.0.1, setup-node v7.1.0,
  upload-pages-artifact v5.0.0, deploy-pages v5.0.1, upload-artifact v7.0.2 (as in the design).
- `CLAUDE.md` "Dev-only code" edited with the wording of section 6 (AC6). The Commands block is
  unchanged (the design does not list it); `build:pages` / `test:pages` are a suggestion.

Deviations: (1) `playwright test` exits 1 on an empty spec dir, so devops added a
**placeholder** `packages/platform/e2e/pages/pages.spec.ts` (one 200 check per app from
`listSiteApps()`); the tester replaces it. (2) `playwright.pages.ts` waits for the server by
`port`, not `url`: the site root `/swfactory/` has no page, so a url would answer 404 and never be
ready. (3) `serve-pages.mjs` also answers 301 for a directory without trailing slash (like Pages).

Checks: `npm run verify` green (unit 5 + 154 + 100 + 95, check:dist standard ok, build:pages
ok: avd and minesweeper guestOnly); `npm run test:pages` 2 passed (placeholder); `npm run test:e2e`
avd 80 passed, minesweeper 110 passed (no pages spec leaks into the `platform` project). Server
probe: `/swfactory/avd/` 200, `/swfactory/avd` 301, `/swfactory/` 404, `/avd/` 404, unknown path
404, `%2e%2e` and `..` escapes 404. check-dist probes run (scratch copies, repo untouched):
(b) fake in `_site` fails; (c) `_site` without `--guest-only` fails on the guest string; (d) default
`dist` with `--guest-only` fails on the Google strings; (e) stray file fails; (f) missing app
fails; (g) empty `--out` fails; (h) key typo `guestonly` fails; (i) `"required": []` fails;
(k) wrong base fails "outside the base". Not run (tester's): (a), (j), the AC1 `zzprobe` probe.
`npm audit` reports findings that are unrelated (no dependency changed in this story).

Review fixes (devops, 2026-11-08):

- `ci.yml`: `concurrency` moved to workflow level (`${{ github.workflow }}-${{ github.ref }}`, `cancel-in-progress` only off `main`); the job-level `pages` group removed.
- `.env.example`: comment-only block for `VITE_GUEST_ONLY` (only `build:pages` sets it, never `.env.local`).
- `serve-pages.mjs`: `listen(port, '127.0.0.1', …)`; the log line shows the same address.
- `playwright.pages.ts`: `baseURL` uses `127.0.0.1`, matching the server's bind address, so CI does not depend on how `localhost` resolves.

## Test report

_tester: AC → test mapping, results, defects found._

Tests added: 1 spec file, replacing the devops placeholder (`packages/platform/e2e/pages/pages.spec.ts`);
one generated test per app under `_site/` (2 now: avd, minesweeper). No other test added or changed.

| AC  | Test(s)                                                                                                                                                                                                                                                                                                                                                          | Result                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| AC1 | `packages/platform/e2e/pages/pages.spec.ts` › `AC1/AC2: <app> under the subpath offers only guest sign-in` (h1 = `<title>`, document/script/stylesheet all < 400 and all three kinds loaded, same origin only); one artifact with both apps by `build-pages: ok _site/ (avd, minesweeper)`. Further app without platform change: probe `new-app zzprobe` (below) | PASS                       |
| AC2 | same test: one button only, no `/Google/` text or button, no foreign-origin request on load, guest sign-in → "Signed in as Guest", no alert; reload → login (004/AC10); sign-out → login, focus on guest button (004/AC4); static part by `check-dist --guest-only` in `build:pages`                                                                             | PASS                       |
| AC3 | `check:dist` (standard) and `build:pages` (guestOnly) inside `npm run verify`; probes (a) and (j) by me, (b)-(i), (k) by devops (see below)                                                                                                                                                                                                                      | PASS                       |
| AC4 | existing specs unchanged (`git status` shows no modified spec) and green: `npm run test:e2e` avd 80 passed, minesweeper 110 passed; unit tests unchanged                                                                                                                                                                                                         | PASS                       |
| AC5 | review of `.github/workflows/ci.yml` (below); a real run is open                                                                                                                                                                                                                                                                                                 | PASS (review), CI run open |
| AC6 | not mine (review): CLAUDE.md "Dev-only code" and ADR 0010 exist in the working tree                                                                                                                                                                                                                                                                              | not tested here            |
| AC7 | not mine (README by tech-writer, later step)                                                                                                                                                                                                                                                                                                                     | not tested here            |
| AC8 | manual by hak, see "Open manual checks"                                                                                                                                                                                                                                                                                                                          | OPEN                       |

Results: `npm run verify` exit 0 (vitest: template 5, platform 154, avd 100, minesweeper 95 passed — workspace labels corrected by the orchestrator; build, check:dist standard ok, build:pages ok);
`npm run test:pages`: 2 passed (project `pages`); `npm run test:e2e`: avd 80 passed, minesweeper 110 passed.

Mutation checks of the new spec (each failed once, as expected; `_site` restored afterwards):
standard build of avd placed in `_site/avd` → fails (h1 / assets 404 under the subpath); the same app built standard with `--base /swfactory/avd/`
→ fails (guest button not found); a third-party stylesheet link injected into `_site/avd/index.html` → fails on the foreign-origin assertion;
a link to a missing same-origin CSS → fails on the status assertion.

Probes:

- AC1 `new-app zzprobe` in a scratch copy: `_site/zzprobe` built, check-dist ok for 3 apps, pages spec passed 3 tests; `diff` against the untouched copy
  shows only `apps/zzprobe/` and the lockfile entry changed (no platform code, template or script edit). Repo copy not touched.
- (a) `NODE_ENV=development vite build --mode e2e` of avd, standard check → exit 1 on `__fakeGoogle` and "Sign in as guest".
- (j) deploy build with `VITE_GUEST_ONLY=1` → `--guest-only` check exit 1 (Google label, `accounts.google.com`, `googleapis.com` found).
- Contrast re-computed with a script (WCAG formula): intro 16.56 / 13.71; button label 6.70 / 7.50; fill vs card 6.70 / 9.61 (light / dark); all >= 4.5 (text) and >= 3 (UI).
  The design's hand figures 7.7 and 9.4 were slightly off, no effect.
- Checked, OK: pages server rejects `/avd/` (404) as Pages does; test never rewrites app DOM.

Defects: none.

AC5 review of `ci.yml`: triggers push to `main`, `pull_request`, `workflow_dispatch`; top-level `permissions: contents: read`; `e2e` and `pages` need `verify`;
`pages` runs `npm run test:pages` (build, check-dist on `_site`, smoke) and uploads `_site` only if `refs/heads/main` and push or dispatch, so the checked artifact is
the published one; `deploy` needs `[e2e, pages]`, has the same `if`, job-level `pages: write` and `id-token: write`, environment `github-pages`, concurrency without cancel; no secret or token anywhere;
PRs and other branches never upload or deploy; a manual run on another branch is blocked by the ref check. Observations (no defect): the artifact failure path uploads
`packages/platform/test-results`, which matches `outputDir` of the pages config.

Open manual checks for hak (agents cannot do these): (1) Settings → Pages → Source: GitHub Actions before the merge; (2) the PR run of this branch: `pages` green, upload and `deploy` skipped;
(3) the first real run on `main`: `deploy` green; (4) AC8: open `https://hkuegel.github.io/swfactory/avd/` and `.../minesweeper/` live, guest sign-in works, a reload on the app path still shows the app (login screen, nothing stored), apps behave as locally.

Verdict: PASS.

Regression after review fixes (2026-11-08): verify green (vitest: platform 154 passed, avd 100 passed, minesweeper 95 passed; check:template 5 passed; build, check:dist standard ok, build:pages ok), test:pages 2 passed (project `pages`), test:e2e avd 80 passed (chromium 39, platform 41), minesweeper 110 passed (chromium-3d 5, chromium 64, platform 41).

## Review

_reviewer: verdict (APPROVED / CHANGES_REQUESTED), findings by severity, review round._

**Round 1, reviewer 2026-11-08. Verdict: APPROVED. Checklist version: 2**

Scope: `git diff main` plus the untracked files (ADR 0010, `config/pages.ts`,
`config/playwright.pages.ts`, `e2e/pages/`, `build-pages.mjs`, `serve-pages.mjs`). README and
CHANGELOG (AC7) follow in the tech-writer step and are not part of this round.

| Item | Result | Note                                                                                                                                                                                                                                                                                                                                                                              |
| ---- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1   | pass   | AC1 discovery + `--base` in `build-pages.mjs`, `pages.spec.ts` per app, tester's `zzprobe`; AC2 guards in `createAuthClient`/`AuthProvider`/`LoginView` + spec + `check-dist --guest-only`; AC3 `dist-check.json` modes, both checks in `verify`, my probes; AC4 platform e2e on avd 41 passed; AC5/AC6 traced in `ci.yml`, CLAUDE.md, ADR 0010; AC7 pending (README); AC8 manual |
| C2   | n.a.   | no network call or pending state added; the guest-only path removes the GIS load                                                                                                                                                                                                                                                                                                  |
| C3   | pass   | `LoginView` only conditional rendering, no hooks; `useAuthFocus` doc comment only; ref routing proven by the spec's focus check after sign-out                                                                                                                                                                                                                                    |
| C4   | n.a.   | no render loop or imperative controller changed                                                                                                                                                                                                                                                                                                                                   |
| C5   | n.a.   | no reducer changed                                                                                                                                                                                                                                                                                                                                                                |
| C6   | pass   | `check-dist` collects every `CheckError` per app and exits 1 (bad CLI exits 2); `build-pages` exits 1 on a null/non-zero build or check status; `serve-pages` ends every error in a 404                                                                                                                                                                                           |
| S1   | pass   | no `dangerouslySetInnerHTML`; `serve-pages` probed with `..`, `%2e%2e`, `..%2f..%2f`, `..%5c`, `%00`, bad escapes, `//host/…` (`curl --path-as-is`): all 404 or local, a file next to the site never served                                                                                                                                                                       |
| S2   | pass   | no secret in workflow or code; `VITE_GUEST_ONLY` public; the `.env.local` client ID is in `apps/*/dist` (expected) but absent from `_site/`                                                                                                                                                                                                                                       |
| S3   | n.a.   | `package.json` gains only scripts; dependencies unchanged                                                                                                                                                                                                                                                                                                                         |
| S4   | pass   | guards literal at all 8 use sites (no shared constant); `createAuthClient` returns before the e2e and Google branches; strings in the platform `dist-check.json`; standard `dist/` has no guest string, `_site/` no fake/Google strings (`verify` output)                                                                                                                         |
| S5   | pass   | `check-dist` and `build-pages` run in `verify`; hand runs: wrong mode both ways, wrong base, `..` entry escape, absolute foreign entry, `.nojekyll` at top level, fake marker in a `.txt`, empty app dirs, app subset, missing/bad CLI values all fail; `serve-pages` bad args exit 2                                                                                             |
| T1   | pass   | `npm run verify` exit 0 (vitest 5 + 154 + 100 + 95, `check-dist` standard ok, `build-pages` ok); also `test:pages` 2 passed                                                                                                                                                                                                                                                       |
| T2   | pass   | one generated e2e per app for AC1/AC2, no unit test, AC3 by the scripts in `verify`; no AC tested twice                                                                                                                                                                                                                                                                           |
| T3   | pass   | `listSiteApps()` throws on an empty `_site`; requests > 0 and all three resource kinds required; assertions on intent (one button, no `/Google/`, same origin), h1 from the built `<title>`; tester's mutations failed as expected                                                                                                                                                |
| T4   | pass   | named `AC1/AC2: …`; role queries, no Tab counting or coordinates; no motion on the login screen                                                                                                                                                                                                                                                                                   |
| T5   | pass   | new `check-dist` branches have no unit test; design §7 records the probes instead, run by devops/tester and re-probed by me                                                                                                                                                                                                                                                       |
| K1   | pass   | matches design §1–§6; deviations (placeholder spec, port wait, 301 redirect) in Implementation notes; the unreachable Google texts are recorded                                                                                                                                                                                                                                   |
| K2   | pass   | no `any`/`!`; named exports; `pages.ts` and the spec are covered by `tsconfig.node.json` (`config`, `e2e`)                                                                                                                                                                                                                                                                        |
| K3   | pass   | CSS split keeps specificity and order (built CSS: `.guest{width}`, `.guestTool{dashed}`, `.guestTool:not(:disabled){…}`); no new colour; primary keeps `ButtonText` border in forced colours                                                                                                                                                                                      |
| K4   | pass   | `check:structure` green; CLAUDE.md, ADR and `config/pages.ts` name no app; app list by discovery                                                                                                                                                                                                                                                                                  |
| K6   | pass   | `status: in-review` in the story and the index row                                                                                                                                                                                                                                                                                                                                |
| K7   | pass   | Decision log only appended (one design entry); earlier lines unchanged against `main`                                                                                                                                                                                                                                                                                             |
| K8   | n.a.   | the user-visible README/CHANGELOG (AC7) is the tech-writer's step after this review (orchestrator's brief); to be checked before gate 2                                                                                                                                                                                                                                           |
| K9   | pass   | `format:check` in `verify` green; story rechecked with prettier after this section                                                                                                                                                                                                                                                                                                |
| K10  | n.a.   | no workspace script or tsconfig changed (root scripts only)                                                                                                                                                                                                                                                                                                                       |
| K11  | fail   | finding 2                                                                                                                                                                                                                                                                                                                                                                         |
| A1   | pass   | native button, name "Sign in as guest", keyboard; focus on it after sign-out (spec `toBeFocused`)                                                                                                                                                                                                                                                                                 |
| A2   | pass   | no new colour; contrast pairs re-computed by the tester (≥ 6.7:1); forced colours: primary `border-color: ButtonText` in the built CSS                                                                                                                                                                                                                                            |
| A3   | pass   | live region unchanged, mounted and empty; no animation added                                                                                                                                                                                                                                                                                                                      |
| A4   | n.a.   | no render loop or canvas changed                                                                                                                                                                                                                                                                                                                                                  |

Findings:

1. `[minor] .github/workflows/ci.yml:78` — `concurrency` sits only on the `deploy` job, so two
   pushes to `main` in a row can deploy out of order: if the older run's `e2e` is slower, its
   `deploy` starts after the newer one finished and puts the older build live (the pending-slot
   rule only drops a waiting job, not a later one). — Move the group to workflow level, scoped by
   ref, e.g. `concurrency: { group: ${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: ${{ github.ref != 'refs/heads/main' }} }`,
   as in GitHub's Pages starter, so runs on `main` are serialised and a waiting run is replaced
   by the newest.
2. `[minor] .env.example` — K11: the new `VITE_GUEST_ONLY` is not documented there; the design's
   main risk ("`VITE_GUEST_ONLY` in a developer's `.env.local`", §8) is exactly where a developer
   would look. — Add a comment-only block (no assignment line): what it does, that only
   `npm run build:pages` sets it, never set it here (ADR 0010).
3. `[nit] scripts/serve-pages.mjs:61` — `listen(port)` binds all interfaces (`*:5175`), so the
   test site is reachable from the LAN during a test run. Harmless content, but unneeded. —
   `listen(port, '127.0.0.1', …)`.
4. `[nit] docs/adr/0010-github-pages-guest-only-deploy-build.md:103` — Consequences list
   001/AC1, 004/AC1, 004/AC11 as false in the deploy build but not 001/AC9 and 004/AC4, added at
   design time. — Add them.

## Explanation

Every app is now published on GitHub Pages under hkuegel.github.io/swfactory/<app>/, built and checked in CI.
It deploys only after a push to main when all checks are green; a manual run of the workflow does the same.
Online, the apps offer guest sign-in only: no Google button, no Google text, no request to Google on page load.
A public build setting switches this on only for the published build; local development and tests are unchanged.
The check for test-only code now knows both builds: the guest text must be missing locally and present online.
It runs on exactly the folder that is uploaded and fails on missing apps, stray files or assets outside the path.
A new app under apps/ is published automatically; a throw-away probe app showed this without platform changes.
A smoke test opens every published app under its path, signs in as guest, reloads and signs out again.
The factory rule for dev-only code and a new decision record describe the new setting; no secrets are needed.
After review: deploys on main now run one after another, the local test server listens only on this machine.
Hosting moved from Firebase to GitHub Pages at gate 1, after hak asked to avoid any legal trouble.
By hak's decision there is no Impressum and no privacy page; GitHub logs visitor IP addresses.
Risks: the legal points are not reviewed; the first real deploy needs the Pages source set in the repo settings.
Not verified: a real CI run on GitHub, the live URLs and guest sign-in online (hak's manual checks).

## Retrospective

**What went wrong**

- **Hosting target switched at gate 1.** The orchestrator recommended Firebase Hosting and had it researched and
  written up; only at gate 1 did hak's wish to avoid legal trouble bring up the Firebase terms clause, the Impressum
  and the privacy statement, and hak chose GitHub Pages. Research and the first story draft were redone. Root cause:
  the research step looked at features and quotas, not at terms of use and legal duties of a public site.
- **Misplaced referral (twice).** The product-owner proposed to check hosting terms and the Impressum question with
  the AI transformation lead; the orchestrator removed it both times. Root cause: the org rule about AI-use
  classification was applied to a non-AI legal question.
- **Mislabelled test counts.** The tester's first report mapped the vitest totals to the wrong workspaces
  (as in 014); the regression run caught it. Root cause: the tester assumed the workspace order.
- **Review round 1: APPROVED** with two minors (deploy concurrency only at job level, so two pushes could deploy out
  of order; `VITE_GUEST_ONLY` missing in `.env.example`) and two nits; devops also moved the smoke test to
  127.0.0.1. Root cause of the first minor: no convention for CI deploy concurrency.
- The review and docs runs were interrupted by the usage limit and resumed; no rework.

**Proposed changes**

- **P1 (`.claude/skills/feature` and `.claude/skills/story`, research step):** "For a third-party service (hosting,
  sign-in, analytics), the research also covers its terms of use and the legal duties it brings for a public site
  (e.g. Impressum, privacy statement, data sent to third parties), and hak sees them before a recommendation."
- **P2 (`.claude/agents/product-owner.md`):** "The referral to the AI transformation lead is only for classifying an
  AI use (prohibited or high-risk); other legal questions (terms, Impressum, privacy) are hak's decision and are
  recorded as such, without a referral."
- **P3 (`.claude/agents/tester.md`):** "Map each vitest `Tests N passed` line to the workspace named in the
  `> @swfactory/<name>` header printed before it; never assume the order."
- **P4 (CLAUDE.md, Commands, Code layout, Config; architect, devops, tester, reviewer):** add `npm run build:pages`
  and `npm run test:pages` to Commands, `_site/` and the two scripts to Code layout, and "`VITE_GUEST_ONLY` is set
  only by `npm run build:pages`; never in `.env.local`" to Config.
- **P5 (CLAUDE.md, Conventions; reviewer):** "A CI deploy uses a workflow-level concurrency group per ref, so runs on
  `main` are serialised and an older run never deploys after a newer one."

**Outcome (gate 2, 2026-11-08):** hak approved all proposals. P1 applied to the feature and story skills, P2 to `.claude/agents/product-owner.md`, P3 to `.claude/agents/tester.md`, P4 and P5 to CLAUDE.md (devops). Manual checks stay not run, open.

Agent memory diffs of this story were checked; all lessons are role-specific and look right.

### Cost

| Role                                    | Round | Model  | Tokens       | Tool uses | Duration |
| --------------------------------------- | ----- | ------ | ------------ | --------- | -------- |
| general-purpose (Firebase research)     | 1     | sonnet | 77927        | 17        | 1:56     |
| product-owner                           | 1     | sonnet | 45835        | 19        | 1:02     |
| architect (feasibility)                 | 1     | sonnet | 34826        | 4         | 0:20     |
| general-purpose (GitHub Pages research) | 2     | sonnet | 78600        | 18        | 1:50     |
| product-owner                           | 2     | sonnet | 43478        | 14        | 1:05     |
| architect                               | 2     | opus   | 175177       | 44        | 11:30    |
| ux-designer                             | 1     | sonnet | 51101        | 11        | 0:50     |
| product-owner                           | 3     | haiku  | 80855        | 8         | 0:15     |
| developer                               | 1     | opus   | 71583        | 21        | 4:48     |
| devops                                  | 1     | sonnet | 76776        | 20        | 5:24     |
| tester                                  | 1     | sonnet | 77425        | 27        | 5:45     |
| reviewer                                | 1     | opus   | n/a          | n/a       | n/a      |
| tech-writer                             | 1     | haiku  | n/a          | n/a       | n/a      |
| tech-writer                             | 2     | haiku  | n/a          | 25        | 1:24     |
| reviewer                                | 2     | opus   | n/a          | 28        | 5:04     |
| devops                                  | 2     | sonnet | 27377        | 6         | 1:18     |
| architect                               | 3     | haiku  | 31274        | 8         | 0:16     |
| tech-writer                             | 3     | haiku  | 33755        | 4         | 0:06     |
| devops                                  | 3     | sonnet | n/a          | 9         | 1:58     |
| tester                                  | 2     | haiku  | 43451        | 12        | 2:58     |
| devops                                  | 4     | haiku  | 56009        | 24        | 1:16     |
| total (measured)                        |       |        | 1005449      | 319       | 49:05    |
| orchestrator (main session)             |       | opus   | not measured | n/a       | n/a      |

The architect stands out (a spike of both builds in a scratch copy plus a browser check under the subpath). Two
research runs and three product-owner runs come from the switch from Firebase to GitHub Pages at gate 1.
