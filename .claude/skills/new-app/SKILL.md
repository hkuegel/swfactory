---
name: new-app
description: Create a new app on the factory's platform from the app skeleton (templates/app) - working Google and guest sign-in, e2e fake, design tokens, verify and e2e toolchain - and prove it is green.
argument-hint: <name> [title]
disable-model-invocation: true
---

# New app from the skeleton

Arguments: $ARGUMENTS (first word: the app name, the rest: the page title)

You are the **orchestrator**. The skeleton lives in `templates/app/`; the platform code
(sign-in, app shell, design tokens, shared button and helpers) lives once in
`packages/platform/` and is consumed by every app as source. Creating an app never
touches another app or the platform.

1. **Check** — require a clean working tree (ask hak on which branch the app should be
   created if it is not `main`). The name must match `^[a-z][a-z0-9-]*$`, must not
   exist in `apps/` yet and should be a distinctive word: `npm run check:structure`
   forbids app names as whole words in the factory files, so a common word
   (e.g. "todo", "notes") would cause false positives. If no title was given, the
   script derives it from the name ("my-app" becomes "My App").
2. **Create** — `node scripts/new-app.mjs <name> --title "<title>"` (omit `--title` if
   none was given). It copies `templates/app/` to `apps/<name>/` and fills the
   placeholders; it refuses an existing directory.
3. **Install** — `npm install` (links the new workspace; updates `package-lock.json`).
4. **Prove** — run, in this order, and stop at the first failure:
   - `npm run verify -w apps/<name>` — the platform's checks plus the app's typecheck,
     lint, format, unit tests (skeleton `Content.test.tsx`, `tokens.test.ts`), build and
     the dev-only-code check on its build;
   - `npm run test:e2e -w apps/<name>` — the platform's sign-in specs (smoke, auth,
     auth-guest) run against the new app; they are the skeleton's e2e;
   - `npm run verify` at the root (the structure check and every other app still pass).
5. **Report** to hak: the app path, the title, the results of step 4 and the commands to
   work on it (`npm run dev -w apps/<name>`, port 5173, one dev server at a time). Point
   out that the app's first story goes to `apps/<name>/docs/backlog/` (a story
   with `app: <name>`), its design tokens to `apps/<name>/src/tokens.css`, and that
   dev-only code the app adds itself must be listed in `apps/<name>/dist-check.json`.
   Suggest `/story` for the app's first story.

If you delete a throw-away app again, `npm install` leaves a stale `extraneous`
`apps/<name>` entry in `package-lock.json`: restore the file from git
(`git checkout -- package-lock.json`) or remove that entry by hand, then check with
`npm ci --dry-run`.

Don't commit, push or deploy; ask hak first. If a step fails, report the failure; don't
patch the platform or the skeleton on your own — that is a `devops` task.
