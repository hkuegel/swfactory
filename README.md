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
[Google sign-in setup](#google-sign-in-setup). To try the app without Google, use the
guest button described in [Sign in as guest](#sign-in-as-guest-local-testing).

## Sign in as guest (local testing)

The login screen has a **Sign in as guest** button next to **Sign in with Google**. It
appears only in the dev server (`npm run dev`) and in the e2e tests
(`npm run test:e2e`). Use it to reach the signed-in state without a Google account. A
guest sees the same signed-in screen as a Google user, with "Signed in as Guest". Like a
Google user, a guest is not kept across page reloads.

The button is not part of production builds. `npm run build`, `npm run preview` and a
deployed app do not show it. `npm run verify` checks this: it fails if the guest label
or the e2e fake end up in `dist/`.

## Google sign-in setup

The login screen signs users in with Google. To try Google sign-in on your machine, you
need your own OAuth client ID. The automated tests and the guest button do not need one.

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

   Origins must match exactly: no path and no trailing slash. If you open the app under
   another address, add that origin too.

   Leave **Authorized redirect URIs** empty. They are not needed.

5. Save and copy the **Client ID**. It ends in `.apps.googleusercontent.com`.

Creating the project and the client costs nothing. You don't need a billing account or
a free trial.

### 2. Add test users

While the app runs only on your machine, keep the publishing status on **Testing**.
Only the Google accounts you list as test users can sign in.

1. Open [Audience](https://console.cloud.google.com/auth/audience).
2. Under **Test users**, add the Google accounts that may sign in. You can add up to 100.
3. When you sign in, Google shows "Google hasn't verified this app". Choose **Continue**.

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

### Publishing later

Publishing the consent screen ("In production") lets any Google account sign in. Google
requires a homepage and a privacy-policy URL for that. The app has neither while it runs
only locally. Publish once the app has a public URL.

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
- **Google refuses the sign-in for your account.** While the app is in **Testing**, only
  the test users can sign in. Add the account under **Audience**, **Test users**.
- **Google's popup shows an error about the origin.** Check the authorized JavaScript
  origins from step 1 against the address in your browser.

Sign-in is not kept across page reloads yet. Every reload shows the login screen again.
This comes with story 003 (`docs/backlog/003-stay-signed-in.md`).

## Playing Minesweeper

After you sign in, the page shows a Minesweeper game. Guests can play too.

1. Set the rows, columns and mines. The defaults are 9, 9 and 10. Or choose a preset:
   **Beginner** (9 × 9, 10 mines), **Intermediate** (16 × 16, 40 mines) or **Expert**
   (16 × 30, 99 mines). A preset only fills in the fields, so you can still change them.
2. Choose **Start**. A new board appears. You can choose **Start** at any time, also during
   a game. No confirmation is asked, and the current game is discarded.

The fields accept these values:

| Setting | Allowed                 | Default |
| ------- | ----------------------- | ------- |
| Rows    | 5 to 30                 | 9       |
| Columns | 5 to 30                 | 9       |
| Mines   | 1 to rows × columns − 9 | 10      |

If a value is empty, not a whole number or out of range, the page names the field and says
what is allowed. No board is created, and a game in progress is kept.

The first cell you reveal is never a mine. It is empty, so the area around it opens.

### Controls

| Action        | Mouse       | Touch      | Keyboard       |
| ------------- | ----------- | ---------- | -------------- |
| Reveal a cell | Click       | Tap        | Enter or Space |
| Flag a cell   | Right-click | Long-press | F              |

On touch, hold a cell for about half a second to flag it. Dragging scrolls the board and
does not reveal or flag a cell.

With the keyboard, press Tab to enter the board. The arrow keys move between cells and stop
at the edges. Home and End go to the first and last cell of the row. Ctrl+Home and Ctrl+End
go to the first and last cell of the board.

A flagged cell cannot be revealed. To remove a flag, right-click or long-press the cell
again, or press F.

**Mines left** shows the number of mines minus the number of flags. It goes negative when
you place more flags than there are mines.

You win when every cell without a mine is revealed. The remaining mines are then flagged.
You lose when you reveal a mine. After the game ends, the board no longer accepts clicks,
taps or flags.

**Timer** shows the whole seconds since your first reveal, next to **Mines left**. It
shows 0 until you reveal a cell, so flagging a cell does not start it. It stops when you
win or lose and keeps the final time. **Start** sets it back to 0. The timer has no upper
limit. When the game ends, screen readers also announce the final time.

### 3D view

The **View** control sits above the game status, with the options **2D** and **3D**. It is
there before the first **Start**, during a game and after a win or loss. Choose **3D** at
any time, also in the middle of a game. Nothing is lost: the board, the flags, **Mines left**
and the timer stay as they are. In 3D the board is tilted, and hidden cells look raised.
Mouse, touch, keyboard and screen reader work the same as in 2D. If your browser cannot show
3D, **3D** is shown as unavailable with a short note, and you can keep playing in 2D. The view
is 2D again after a reload or a sign-out.

Nothing is saved. A reload or a sign-out starts again with the default values and no game.

## Working with the factory

Open Claude Code in this folder and use:

| Command                | What happens                                                    |
| ---------------------- | --------------------------------------------------------------- |
| `/story <idea>`        | Product owner writes a story with acceptance criteria           |
| `/feature <idea>`      | Full pipeline: story → design → build → test → review → docs    |
| `/bug <description>`   | Reproduce with a failing test → fix → verify → review           |
| `/rebuild [up-to NNN]` | Regenerate the domain code from the backlog, starting at `base` |

You approve at two gates: after the story is written (the story is then committed), and
before the code is committed, where you also decide which retro proposals to apply.
You can also call any role directly, e.g. "ask the architect how we should handle routing".

### Keeping track and rebuilding

Every feature is a story file in `docs/backlog/` holding your original request, the
acceptance criteria, a log of your decisions, the designs, the test report and the
review. The index is `docs/backlog/README.md`.

The git tag `base` marks the baseline: factory, toolchain and the technical login
(Google and guest sign-in), without domain code. `/rebuild` starts from `base`, replays
all stories done after it in order on a new branch, and checks the result against the
original end-to-end tests. `/rebuild from: <tag|commit>` starts somewhere else.

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
scripts/          small build checks (check-dist.mjs)
src/              the app (feature folders under src/features/)
e2e/              Playwright end-to-end tests
```

## Styling

Colours, corner radii, type sizes and durations come from `src/app/tokens.css`. The
light values are in `:root`, the dark values in one `prefers-color-scheme: dark` block
below them (see [ADR 0004](docs/adr/0004-design-tokens-css-custom-properties.md)). Add a
new colour to both blocks.

CSS modules use only these tokens, never a colour literal or a dark-mode block of their
own. `src/app/tokens.test.ts` checks the contrast of the text and icon pairs in both
schemes and fails on any value that bypasses the tokens. Run it with `npm test`.

## Scripts

| Script               | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Dev server on http://localhost:5173                 |
| `npm test`           | Unit and component tests (Vitest)                   |
| `npm run test:e2e`   | End-to-end tests (Playwright, fake sign-in)         |
| `npm run verify`     | Typecheck, lint, format, tests, build, dist check   |
| `npm run check:dist` | Fail if dev-only code is in `dist/` (after a build) |
| `npm run format`     | Format all files with Prettier                      |

`npm run verify` runs the checks in this order: typecheck, lint, format check, unit
tests, `vite build`, and `check:dist`. It does not run the e2e tests.

## Testing

- `npm test` runs the unit and component tests.
- `npm run test:e2e` runs the Playwright tests. It starts the app in mode `e2e` on port
  5174, with a fake Google sign-in. The tests never contact real Google and need no
  client ID.
- The Playwright tests run in two projects. `chromium` runs all tests. `chromium-3d` re-runs
  the Minesweeper game tests with the 3D view chosen. `npm run test:e2e` runs both.

To check sign-in with a real Google account, run `npm run dev` on port 5173 and sign in
in the browser. Do not use the e2e tests for this.
