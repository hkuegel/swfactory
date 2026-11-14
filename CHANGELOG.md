# Changelog

All notable changes to this project are documented here, following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- `npm run test:scripts` runs the tests of `scripts/`, which is not an npm workspace, with its
  own Vitest config (#026).
- New app `laz`, the Lebensarbeitszeitkonto calculator. It shows the maximum monthly payout a
  depot funds over a payout phase of the length you choose, or the depot a target monthly
  payout would need. Each phase year is funded by the iBonds fund liquidated in December of
  the year before; a year without a funding fund is shown without an amount. Tax on the gain
  is a parameter, on/off plus a rate. The payout per share is a projection from YTM and NAV,
  read from a committed data file, and the app labels it as a projection (#024).
- The fund list of `laz` is written by a script, not typed. Its default mode reads stored responses, so a
  test run never contacts the source, and a test fails if the network path is reached; live mode is an
  explicit argument, run from the command line or from this story's workflow, which is the only workflow
  with a write permission and commits the file. A fund that cannot be read names the fund and the field and
  nothing is written, so a partial file cannot be committed. The date in the file is the run date given to
  the script, never a clock reading, and the values are stored in the source's own precision, so the file
  does not round (#025).
- The site root `hkuegel.github.io/swfactory/` is a factory page, with no sign-in. It explains
  the factory's roles, pipeline and quality checks, and links to every published app and to
  the repository (#021).
- The apps are published on GitHub Pages at `hkuegel.github.io/swfactory/<app>/`. The
  published sites offer only guest sign-in, no Google sign-in (#018).
- The avd calculator compares the Altersvorsorgedepot with a normal ETF depot. Both get the
  same monthly rate and are paid out in equal monthly payouts until age 85. The comparison shows
  the yield after tax and the difference between the two depots. A new input sets the tax rate
  in retirement, and a checkbox sets the Sparerpauschbetrag of the ETF depot. The tax on the
  unsubsidised part of the AVD is an assumption that the BMF has not yet confirmed (#016).
- The avd calculator can reinvest the tax refund. Tick "Steuererstattung wieder anlegen" to pay
  the refund of each saving year into the depot on 1 January of the next year, up to the yearly
  limit of 6.840 €. The result, the yearly table and the chart show the reinvested part (#015).
- The avd calculator takes your marginal tax rate (Grenzsteuersatz, 30 % by default) and shows
  the tax refund from the Günstigerprüfung per saving year and in total. It also shows your own
  contributions after the refund. The refund is kept apart from the depot unless you reinvest it
  (#014, #015).
- The avd yearly table has a "Steuererstattung" column with the refund of each saving year
  (#014).
- New app `avd`: an Altersvorsorgedepot calculator for the saving phase. Enter age, payout
  start, monthly contribution, children, return and costs. The result updates as you type
  (#013).
- The calculator shows the value at payout start, split into your own contributions, the
  state Zulagen and the returns. A yearly table and a chart show the balance per year (#013).
- The calculator applies the Zulage rules of the adopted law: Grundzulage, Kinderzulage and
  the one-time Berufseinsteigerbonus. Its figures are model calculations, not investment or
  tax advice (#013).
- Reviews follow a fixed checklist, `.claude/agents/reviewer-checklist.md`. Every item is
  marked pass, fail or n.a. in the story's Review section (#012).
- Each retro records the agent costs of the story: tokens, tool uses and duration per agent
  run, with a total. The orchestrator's own usage is marked "not measured" (#012).
- Gate 2 starts with a short explanation in German: how the solution works, the main risks
  and what was not verified. The English text is in the story's "Explanation" section (#012).
- `/new-app <name> [title]` creates a new app from a skeleton. The app starts with Google
  sign-in, guest sign-in (dev only), the e2e sign-in fake, the design tokens and the verify
  and e2e checks, and shows its own content after sign-in (#011).
- `npm run check:structure` fails on app names in factory files or the platform, dead
  Markdown links and stories missing from the backlog index. It runs in `npm run verify`
  (#011).
- Minesweeper has its own README with the game rules, the 3D view and how to run it (#011).
- The 3D view shows an explosion at the mine when you lose, and confetti over the board when
  you win. Start stops the effect at once. Reduced motion and forced colours show no effect
  (#010).
- Switch the Minesweeper board between 2D and 3D with the View control, also during a game.
  The game, flags, counter and timer stay as they are. The 3D board is tilted, and hidden
  cells look raised. The view is 2D again after a reload or sign-out (#008).
- Minesweeper game after sign-in, for guests too. Choose the rows and columns (5 to 30)
  and the number of mines (1 to rows × columns − 9). The first cell you reveal is never a
  mine (#005).
- Flag a cell with right-click, long-press or the F key. Play with the arrow keys, Enter
  and Space (#005).
- Mines-left counter, and a message when the game is won or lost (#005).
- Difficulty presets in the Minesweeper setup: Beginner (9 × 9, 10 mines), Intermediate
  (16 × 16, 40 mines) and Expert (16 × 30, 99 mines). A preset only fills in the fields;
  choose Start to play (#006).
- Timer next to "Mines left" in the Minesweeper game. It starts at the first reveal,
  stops on win or loss and resets on Start. Screen readers announce the final time (#006).
- Sign in as guest on the login screen, for local development, test runs and the GitHub
  Pages sites (#018). It is not part of other production builds (#004).
- Sign in with Google on the login screen. Once signed in, the header shows your name,
  or your email if Google provides no name (#001).
- Sign out from the header. After signing out, the login screen is shown again (#001).
- Sign-in is not kept across page reloads yet: after each reload you see the login
  screen again and sign in once more (#001).
- Software factory setup: role agents, `/feature`, `/story` and `/bug` workflows,
  story and ADR templates.
- React + TypeScript app scaffold with Vitest, Playwright, ESLint, Prettier and CI.
- Traceability: stories record the original request and a decision log, link
  superseded and changed stories, and are committed when approved.
- `/rebuild` workflow to regenerate the app from the backlog.
- Persistent per-agent memory and a retro step after each feature and bug fix.

### Changed

- `laz`: the money fields have no invented cap. A value is refused only when it is negative, has more
  decimals than its unit, or exceeds the largest integer a calculation can hold exactly; the field copy
  names the rule of the unit instead of quoting a maximum amount (#030).
- `laz`: the phase fields accept any month, in the short form `MM.JJJJ`, and a day stays accepted but is
  not required. The range the design had invented is gone, an entry that is not finished yet is a typing
  state that names no error, and the defaults are the example phase hak gave, 01.2028 to 03.2034 (#033).
- Hak's process rules of 2026-11-13 are recorded in `CLAUDE.md` and the role files, after the story
  that produced them was discarded by hak: the proportionate path for a look-only story, review
  rounds appended below the earlier ones so the story can be rebuilt without the chat, a test proves
  only what its own story adds or changes, an AC asserts only what can regress, and a look-only
  story takes at most three new tests.
- `npm run verify` is a runner (`scripts/verify.mjs`) that asks which checks can see the
  change and runs only those, independent checks at the same time, with at most three levels.
  Without a recorded full run every check runs. The runner reports the levels and the
  durations, and records a full run in `.tmp/last-full-run.json`. Modes are named
  `--mode=affected` and `--mode=full`; `--plan-only`, `--format=github-output`,
  `--base=<ref>`, `--paths=a,b` and `--no-record` are for a CI step (#026).
- `npm run verify` runs `test` and `test:e2e` only in the workspaces the plan names, with
  `-w <workspace>`, so a change in one app does not start another app's suite. A change the plan
  cannot put in one workspace, and every full run, still run in all workspaces; the plan prints the
  workspaces it uses (#027).
- `npm run verify` now scopes every step a workspace defines in its own `package.json`
  (`typecheck`, `build`, `test`, `test:e2e`, `lint`, `format:check`, `check:dist`) to the planned
  workspaces, with `--if-present` so a workspace without the script is skipped. A step no workspace
  defines (`test:scripts`, `check:structure`, `check:template`), a change with a path in no
  workspace, and every full run keep the whole-tree command, so a root file is never skipped; the
  plan prints which steps are scoped (#029).
- `npm run test:pages` no longer builds the site: `npm run build:pages` produces `_site/`, and
  `test:pages` only tests it, so `_site/` is built once per pipeline. Run `npm run build:pages`
  before `npm run test:pages` when you call them separately (#026).
- `npm run check:structure` checks the story size: a story from 026 on declares
  `size: S | M | L`, and a `size: S` story (at most three ACs) needs only its "Explanation"
  section, no Review, no Cost table and no UX design section. The Cost table of a `size: M`
  or `size: L` story may not say `n/a` in every row: a row is measured or says `not measured`
  with the reason. Stories before 026 keep the record as written (#026).
- The CI workflow is one job now: one install with `node_modules` from the cache keyed on the
  lockfile hash, a pull-request run that may use the mapping, a full run on `main` and
  `workflow_dispatch`, Chromium installed only when the plan has a browser step, and the Pages
  artifact uploaded by the run that built `_site/` (#026).
- The CI cache covers the vitest cache of every workspace and the Playwright browser directory, not
  only `node_modules`. The browser is installed only when that cache misses, and only when the plan has
  a browser step (#028).
- The orchestrator decides when there is one clearly correct answer and records the decision,
  instead of asking; it asks only for genuinely open questions or decisions costly to reverse
  (#026).
- The avd chart draws every part of the bars in a plain, solid colour instead of stripes and
  outlines. The parts stay apart by colour, and the legend swatches match them. Stripes and
  outlines return only in forced colours mode (#017).
- `npm run check:structure` checks each done story from 013 on for the cost table and the
  "Explanation" section. Stories 001 to 012 are not checked (#012).
- Gate 2 shows the German explanation first, before the acceptance table, test results and
  screenshots (#012).
- The repo is split into the factory, a shared platform (`packages/platform/`) and apps
  (`apps/<name>/`), using npm workspaces. Sign-in, the app shell and the design tokens live
  once in the platform. Minesweeper moves to `apps/minesweeper/` with its stories, ADR and
  e2e tests. The game does not change (#011).
- The page heading and the browser title are now "Minesweeper" instead of "Software
  Factory". Each app sets its own (#011).
- `npm run verify`, `npm run test:e2e` and `npm run check:dist` cover the platform and every
  app. Add `-w apps/<name>` to check one app and the platform it uses (#011).
- `npm run check:dist` reads the dev-only strings from `dist-check.json` files: one in the
  platform, which covers every app, and an optional one per app (#011).
- `/rebuild` takes an app name and regenerates that app from the app skeleton and the current
  platform. The `base` tag marks the baseline before the split (#011).
- `npm run measure:fps` moves to the Minesweeper app: `npm run measure:fps -w apps/minesweeper`
  (#011).
- The 3D view is now a lit 3D scene: glossy tiles on a dark stone table, soft shadows, a
  gentle sway, a wave when an area opens and flags planted with a short animation. 3D
  loads when you choose it. If 3D cannot load or stops, the game continues in 2D with a
  notice (#009).
- New modern look for the login screen, the header and the Minesweeper game: rounded
  shapes, one blue accent colour, and light and dark colours that follow your system
  setting. Buttons look the same everywhere, contrast is better, and forced colours and
  reduced motion are supported. How the app works does not change (#007).
- The placeholder text and the click counter are replaced by the Minesweeper game (#005).
- The counter and the placeholder text are shown only when signed in (#001).
- `npm run verify` ends with `check:dist`, which fails if dev-only code (the guest sign-in
  or the e2e fake) ends up in the production build (#004).

### Fixed

- Minesweeper's 3D view loads again in production builds, such as the GitHub Pages site. The
  3D palette accepts the short colour notation that the CSS minifier produces (`#fff`). The
  Pages smoke test also runs app-owned checks and opens 3D on the published build (#020).
- Headings wrap at very narrow widths instead of running past the edge of the page. The CI
  e2e tests are green on the GitHub runner: Minesweeper runs one test at a time on CI, the
  tests wait for transitions to end, the avd chart check compares the labels as text, and the
  3D real-loop test allows the measured slow frames of software graphics (#019).
