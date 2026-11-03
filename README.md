# Software Factory

A software factory: TypeScript/React apps built by a team of Claude Code agents, each
owning one role in the development process: product owner, architect, UX designer,
developer, tester, reviewer, DevOps and tech writer. See [CLAUDE.md](CLAUDE.md) for the
process and conventions, and [`.claude/agents/`](.claude/agents/) for the role definitions.

The repo has three parts. They are kept apart
([ADR 0006](docs/adr/0006-monorepo-npm-workspaces-platform-as-source.md)):

- **The factory** is the way of working: the agents, skills and templates in `.claude/`,
  `docs/templates/` and `templates/`, plus `CLAUDE.md`. It knows no app.
- **The platform** (`packages/platform/`) is the code every app shares: Google and guest
  sign-in, the e2e sign-in fake, the app shell, design tokens, the shared button and helpers.
  It is consumed as source by the apps and never names or imports an app.
- **The apps** (`apps/<name>/`) are the products. Each app has its own code, tests,
  stories and ADRs, and sets its own page heading and title. Today there is one app:
  [Minesweeper](apps/minesweeper/README.md).

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

`npm run dev` starts Minesweeper, the default app. To start another app, use its folder:

```bash
npm run dev -w apps/<name>
```

The dev server runs on http://localhost:5173. Every app uses this port, so run one dev
server at a time.

The app runs without any setup. To sign in with Google, follow
[Google sign-in setup](#google-sign-in-setup). To try the app without Google, use the
guest button described in [Sign in as guest](#sign-in-as-guest-local-testing).

## Sign in as guest (local testing)

The login screen of every app has a **Sign in as guest** button next to **Sign in with
Google**. It appears only in the dev server (`npm run dev`) and in the e2e tests
(`npm run test:e2e`). Use it to reach the signed-in state without a Google account. A
guest sees the same signed-in screen as a Google user, with "Signed in as Guest". Like a
Google user, a guest is not kept across page reloads.

The button is not part of production builds. A built app, `npm run preview -w apps/<name>`
and a deployed app do not show it. `npm run verify` checks this: it fails if the guest
label or the e2e fake end up in the `dist/` of any app.

## Google sign-in setup

The login screen signs users in with Google. To try Google sign-in on your machine, you
need your own OAuth client ID. The automated tests and the guest button do not need one.

All apps share one client ID. You set it up once.

### 1. Create the OAuth client

1. Open the [Google Auth Platform overview](https://console.cloud.google.com/auth/overview)
   and select a project, or create one. If the project has no setup yet, choose
   **Get started** and go through the wizard:
   - app information (name and support email),
   - audience **External**,
   - a contact email,
   - finish.
2. Open [Clients](https://console.cloud.google.com/auth/clients) and choose
   **Create client**.
3. Set **Application type** to **Web application**.
4. Under **Authorized JavaScript origins**, add both of these origins:

   ```text
   http://localhost:5173
   http://localhost
   ```

   Origins must match exactly: no path and no trailing slash. 5173 is the dev port of
   every app, so one pair of origins serves all of them. If you open an app under another
   address or port, add that origin too.

   Leave **Authorized redirect URIs** empty. They are not needed.

5. Save and copy the **Client ID**. It ends in `.apps.googleusercontent.com`.

Creating the project and the client costs nothing. You don't need a billing account or
a free trial.

### 2. Add test users

While the apps run only on your machine, keep the publishing status on **Testing**.
Only the Google accounts you list as test users can sign in.

1. Open [Audience](https://console.cloud.google.com/auth/audience).
2. Under **Test users**, add the Google accounts that may sign in. You can add up to 100.
3. When you sign in, Google shows "Google hasn't verified this app". Choose **Continue**.

### 3. Add the client ID to your environment

Copy the example file to `.env.local` in the repo root:

```bash
cp .env.example .env.local
```

Open `.env.local` and set your client ID:

```text
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

There is one `.env.local`, in the repo root. All apps read it. You don't copy it into an
app folder. Restart the dev server after you change the file. `.env.local` is gitignored,
so your client ID stays out of git.

### Publishing later

Publishing the consent screen ("In production") lets any Google account sign in. Google
requires a homepage and a privacy-policy URL for that. The apps have neither while they
run only locally. Publish once an app has a public URL.

### About the client ID

- Variables with the `VITE_` prefix end up in the JavaScript bundle that the browser
  loads. Anyone can read them.
- A client ID is not a secret. Never put a client secret or any other secret into a
  `VITE_` variable.
- If `VITE_GOOGLE_CLIENT_ID` is empty, the app still runs and the login screen works.
  Clicking **Sign in with Google** shows "Google sign-in failed. Please try again." The
  browser console says that the client ID is not set.

### Troubleshooting

- **Clicking "Sign in with Google" right after the page loads shows the error.** Google's
  script is still loading. Wait a moment and try again. If the message stays, reload the
  page. Check that the browser can reach `accounts.google.com`.
- **The same error appears when the browser blocks popups.** Sign-in opens a Google
  popup. Allow popups for `localhost` and try again.
- **Google refuses the sign-in for your account.** While the apps are in **Testing**, only
  the test users can sign in. Add the account under **Audience**, **Test users**.
- **Google's popup shows an error about the origin.** Check the authorized JavaScript
  origins from step 1 against the address in your browser.

Sign-in is not kept across page reloads yet. Every reload shows the login screen again.
This comes with story 003 (`docs/backlog/003-stay-signed-in.md`).

## Creating an app

In Claude Code, run the skill:

```text
/new-app <name> [title]
```

It copies the skeleton `templates/app/` to `apps/<name>/`, runs `npm install`, and then
runs `verify` and the e2e tests for the new app. Without Claude Code, run the steps
yourself:

```bash
node scripts/new-app.mjs <name> --title "<Title>"
```

```bash
npm install
```

```bash
npm run verify -w apps/<name>
```

```bash
npm run test:e2e -w apps/<name>
```

The name starts with a lowercase letter and has only lowercase letters, digits and
hyphens. The title is the page heading and the browser title. It defaults to the
capitalised name (`my-app` becomes "My App"). It cannot contain quotes, backticks,
backslashes, angle brackets, `&`, `$` or braces. Use a distinctive name: `check:structure`
rejects an app name as a whole word in the factory files, so a common word like "todo"
causes false alarms. The names `app`, `apps`, `platform`, `package`, `packages`,
`template` and `templates` are reserved. If you delete an app again, `npm install` leaves a
stale `extraneous` entry for it in `package-lock.json`: restore the file from git (or remove
the entry) afterwards.

The new app works at once, without any change to another app:

- Google sign-in, guest sign-in (dev only) and the e2e sign-in fake,
- the page shell with your title, and the generic design tokens,
- the unit, e2e, lint, format and build checks, including `check:dist`.

After sign-in it shows a placeholder region in `src/Content.tsx`. Replace it with your
app. Put the app's own design tokens in `src/tokens.css`, its stories in
`docs/backlog/` and its ADRs in `docs/adr/` inside the app folder. If the app adds dev-only
code of its own, list the identifying strings in the app's `dist-check.json`. The
skeleton's README is [`templates/app/README.md`](templates/app/README.md).

## Working with the factory

Open Claude Code in this folder and use:

| Command                      | What happens                                                 |
| ---------------------------- | ------------------------------------------------------------ |
| `/story <idea>`              | Product owner writes a story with acceptance criteria        |
| `/feature <idea>`            | Full pipeline: story → design → build → test → review → docs |
| `/bug <description>`         | Reproduce with a failing test → fix → verify → review        |
| `/new-app <name> [title]`    | Create an app from the skeleton in `templates/app/`          |
| `/rebuild <app> [up-to NNN]` | Regenerate one app from its backlog and the current platform |

You approve at two gates: after the story is written (the story is then committed), and
before the code is committed, where you also decide which retro proposals to apply.
You can also call any role directly, e.g. "ask the architect how we should handle routing".

At the first gate you also say whether a story is for the platform or for one app.

### Keeping track and rebuilding

Every feature is a story file holding your original request, the acceptance criteria, a
log of your decisions, the designs, the test report and the review. Stories of the
platform are in `docs/backlog/`, stories of an app are in `apps/<name>/docs/backlog/`.
Story numbers are global. The index of all stories is `docs/backlog/README.md`. ADRs
follow the same split: `docs/adr/` for the platform, `apps/<name>/docs/adr/` for an app.

`/rebuild <app>` regenerates one app. It starts on a new branch from the app skeleton and
the current platform, replays the app's done stories in id order, skips superseded
stories, and checks the result against the app's original end-to-end tests. Platform
stories are not replayed.

The git tag `base` marks the baseline before the split into platform and apps: the
single-app layout with the technical login (Google and guest sign-in) and no domain code.
It is no longer the start of a rebuild. Move it only on hak's decision.

### How the agents learn

Each agent keeps its own lessons in `.claude/agent-memory/<agent>/MEMORY.md`, loaded
on every run. After each story a retro proposes improvements to the agents and
`CLAUDE.md`; you decide which ones are applied. All of it is in git, so you can review
and revert what the agents learned.

## Project layout

```
.claude/agents/        role definitions (one subagent per role)
.claude/agent-memory/  lessons each agent learned, per role
.claude/skills/        /feature, /story, /bug, /new-app, /rebuild workflows
docs/backlog/          platform stories and the index of all stories
docs/adr/              platform architecture decision records
docs/templates/        story and ADR templates
packages/platform/     the shared platform, imported as @swfactory/platform
  src/auth/            Google and guest sign-in, e2e sign-in fake
  src/shell/           app shell (page title and the app as children)
  src/components/      shared UI components
  src/lib/             shared helpers
  src/styles/          generic design tokens (tokens.css) and base.css
  src/test/            test setup and the shared token rules
  config/              shared Vite and Playwright configuration for apps
  e2e/                 sign-in specs (smoke, auth, auth-guest) that every app runs
  dist-check.json      dev-only strings that no production build may contain
apps/<name>/           one app
  src/main.tsx         sign-in provider, app shell with the app's title, the app
  src/features/        the app's feature folders
  src/tokens.css       the app's own design tokens
  e2e/                 the app's Playwright tests
  docs/                the app's stories and ADRs
  dist-check.json      the app's own dev-only strings and size budgets (optional)
templates/app/         the app skeleton that /new-app copies
scripts/               check-dist.mjs, check-structure.mjs, new-app.mjs
```

## Styling

Colours, corner radii, type sizes and durations come from design tokens, in two layers:

- The generic tokens are in `packages/platform/src/styles/tokens.css`. The platform and
  every app use them. A token is generic if a platform module reads it.
- App tokens are in `apps/<name>/src/tokens.css`. They extend the generic tokens, for
  example the cell and scene colours of Minesweeper. An app never has its own copy of a
  generic token.

In each file the light values are in `:root`, the dark values in one
`prefers-color-scheme: dark` block below them (see
[ADR 0004](docs/adr/0004-design-tokens-css-custom-properties.md)). Add a new colour to both
blocks. An app's `main.tsx` imports the platform's `tokens.css` and `base.css`, then its own
`tokens.css`.

CSS modules use only these tokens, never a colour literal or a dark-mode block of their
own. The token test checks the contrast of the text and icon pairs in both schemes and
fails on any value that bypasses the tokens. It exists once in the platform
(`packages/platform/src/styles/tokens.test.ts`) and once in each app
(`apps/<name>/src/tokens.test.ts`), with shared rules. Run it with `npm test`.

## Scripts

Root scripts run over the platform and all apps:

| Command                   | Purpose                                     |
| ------------------------- | ------------------------------------------- |
| `npm run dev`             | Dev server of Minesweeper (port 5173)       |
| `npm run build`           | Production build of every app               |
| `npm run typecheck`       | Typecheck every workspace                   |
| `npm run lint`            | Lint the whole repo (ESLint)                |
| `npm run format`          | Format all files with Prettier              |
| `npm test`                | Unit tests of every workspace (Vitest)      |
| `npm run test:e2e`        | End-to-end tests of every app (Playwright)  |
| `npm run check:dist`      | Fail if dev-only code is in an app's dist/  |
| `npm run check:structure` | Structure and link guard                    |
| `npm run check:template`  | Unit tests and typecheck of `templates/app` |
| `npm run verify`          | Run all checks except e2e (order below)     |

`npm run verify` runs the checks in this order: typecheck, lint, format check, structure
check, skeleton check (`check:template`), unit tests, build, and `check:dist`. It does not run the e2e tests. It fails if the
platform or any app fails.

To work on one app, add `-w apps/<name>`:

```bash
npm run dev -w apps/<name>          # dev server on port 5173
npm run verify -w apps/<name>       # the platform's checks plus this app's checks
npm run test:e2e -w apps/<name>     # this app's e2e plus the platform's sign-in specs
npm run check:dist -w apps/<name>   # dev-only strings in this app's dist/ (after a build)
npm run preview -w apps/<name>      # serve this app's production build
npm test -w apps/<name>             # this app's unit tests
```

To check the platform alone, use `npm run verify -w @swfactory/platform`. An app can add
scripts of its own. The Minesweeper scripts are in its
[README](apps/minesweeper/README.md).

`npm run check:dist` reads the forbidden strings from `packages/platform/dist-check.json`
(the guest label and the e2e fake) and from the app's own `dist-check.json`, and scans the
build output of each app in `apps/`. It needs a build first. A new app is covered with no
change to the check. The app's `dist-check.json` can also declare size budgets for lazy
chunks.

`npm run check:structure` fails when:

- an app name appears as a whole word in `CLAUDE.md`, the agents, skills, templates or the
  platform, or the platform imports an app,
- a relative link in the Markdown files is dead,
- a story is missing from `docs/backlog/README.md`, is listed twice, or has an id that
  another story already uses.

## Testing

- `npm test` runs the unit and component tests of the platform and every app.
- `npm run test:e2e` runs the Playwright tests of every app, one app after another. Each
  app starts in mode `e2e` on port 5174, with a fake Google sign-in. The tests never
  contact real Google and need no client ID.
- Every app runs the platform's sign-in specs (`packages/platform/e2e`: `smoke`, `auth`,
  `auth-guest`) against itself, in the Playwright project `platform`. The app's
  `playwright.config.ts` says which page title and which content to expect after sign-in.
  The project `chromium` runs the app's own specs. An app can add projects, like the
  `chromium-3d` project of Minesweeper.
- A dev server of another app on port 5174 makes the sign-in specs fail on the page title.
  Stop it and run the tests again.

To check sign-in with a real Google account, run `npm run dev` on port 5173 and sign in
in the browser. Do not use the e2e tests for this.
