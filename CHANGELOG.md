# Changelog

All notable changes to this project are documented here, following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

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
- Sign in as guest on the login screen, for local development and test runs only. It is
  never part of a production build (#004).
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
