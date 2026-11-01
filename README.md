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

The app runs without any setup. To sign in with Google, follow
[Google sign-in setup](#google-sign-in-setup).

## Google sign-in setup

The login screen signs users in with Google. You need your own OAuth client ID to try
sign-in on your machine. The automated tests do not need it (see [Testing](#testing)).

### 1. Create an OAuth client in Google Cloud

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and select a project,
   or create one.
2. Open the **Credentials** page and create an **OAuth client ID**.
3. Set **Application type** to **Web application**.
4. Under **Authorized JavaScript origins**, add both of these origins:

   ```text
   http://localhost:5173
   http://localhost
   ```

   Origins must match exactly: no path and no trailing slash. If you open the app under
   another address, add that origin too.

   Redirect URIs are not needed.

5. Save and copy the **Client ID**. It ends in `.apps.googleusercontent.com`.

### 2. Set up the consent screen

Configure the consent screen once for the project:

- Set the user type to **External**.
- Add the scopes `openid`, `email` and `profile`.
- Set the publishing status to **In production**. In **Testing**, only the test users you
  list can sign in. The app is meant for any Google account. Google may label the
  publishing action "Publish app".

### 3. Add the client ID to your environment

Copy the example file to `.env.local`:

```bash
cp .env.example .env.local
```

Open `.env.local` and set your client ID:

```text
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Restart `npm run dev` after you change the file. `.env.local` is gitignored, so your
client ID stays out of git.

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
- **Google's popup shows an error about the origin.** Check the authorized JavaScript
  origins from step 1 against the address in your browser.

Sign-in is not kept across page reloads yet. Every reload shows the login screen again.
This comes with story 003 (`docs/backlog/003-stay-signed-in.md`).

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
| `npm run test:e2e` | End-to-end tests (Playwright, fake sign-in)    |
| `npm run verify`   | Typecheck, lint, format check, tests and build |
| `npm run format`   | Format all files with Prettier                 |

## Testing

- `npm test` runs the unit and component tests.
- `npm run test:e2e` runs the Playwright tests. It starts the app in mode `e2e` on port 5174. In this mode, the app uses a fake Google sign-in. The tests never contact real
  Google and do not need a client ID.

To check sign-in with a real Google account, run `npm run dev` on port 5173 and sign in
in the browser. Do not use the e2e tests for this.
