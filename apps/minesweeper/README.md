# Minesweeper

A Minesweeper game with a 2D and a 3D board. It is an app on the software factory's
platform: sign-in, app shell and design tokens come from `@swfactory/platform`. See the
[root README](../../README.md) for the setup, the Google sign-in and the factory workflows.

## Running the app

Run these commands in the repo root. Set up the project first, as described in
[Getting started](../../README.md#getting-started).

```bash
npm run dev
```

```bash
npm run dev -w apps/minesweeper
```

Both start the dev server on http://localhost:5173. `npm run dev` starts Minesweeper while
it is the only app. Run one dev server at a time: every app uses port 5173, which is the
port the Google OAuth origins expect.

To check this app only, with the platform it uses:

```bash
npm run verify -w apps/minesweeper
```

```bash
npm run test:e2e -w apps/minesweeper
```

`verify` runs the platform's checks, then this app's typecheck, lint, format check, unit
tests, build and `check:dist`. `test:e2e` runs the Minesweeper specs in `e2e/` and the
platform's sign-in specs against this app.

The Playwright tests run in these projects:

- `chromium` runs the specs of `e2e/`.
- `platform` runs the platform's sign-in specs against this app.
- `chromium-3d` re-runs the game tests (flag, long-press, keyboard, lose, win) with the 3D
  view chosen.

The e2e tests use software WebGL (SwiftShader), so they need no GPU.

```bash
npm run measure:fps -w apps/minesweeper
```

`measure:fps` measures the frame rate and the input latency of the 3D board. It opens a
Chromium window and needs a real GPU. It is not part of `verify` or CI. It starts its own
dev server on port 5175. The script is `scripts/measure-fps.mjs`.

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
and the timer stay as they are. Mouse, touch, keyboard and screen reader work the same as in
2D. The view is 2D again after a reload or a sign-out.

The 3D board is a lit scene with glossy tiles on a dark stone table and soft shadows. Hidden
cells are raised, revealed cells are sunk in, and the camera sways gently. An opened area
spreads as a wave from the clicked cell, and flags are planted with a short animation. 3D
loads when you choose it. **Loading 3D…** shows until it is ready, and 2D stays playable
meanwhile. If your system asks for reduced motion, the board does not sway and shows no
animations. Each change appears at once as a still picture.

If your browser cannot show 3D, **3D** is shown as unavailable with a short note. If 3D
cannot load, takes longer than 10 seconds to load, or stops during a game, the view changes
to 2D with a short message. The game state is kept, and you keep playing in 2D.

Nothing is saved. A reload or a sign-out starts again with the default values and no game.

## Notes for developers

- The 3D board uses [three.js](https://threejs.org/). The dependency belongs to this app,
  not to the platform. The scene code is in `src/features/minesweeper/scene3d/` and loads
  with a dynamic `import()` when you first choose 3D, so 2D players download nothing extra.
  See [ADR 0005](docs/adr/0005-three-js-board-scene-with-dom-overlay.md).
- The DOM grid stays the only input and accessibility surface. In 3D it is a transparent
  overlay on top of the canvas, aligned with the same camera math.
- The scene colours come from the app's own tokens in `src/tokens.css`. They extend the
  platform's generic tokens. `src/tokens.test.ts` checks the scene tokens and the
  contrast pairs of the board.
- `dist-check.json` declares the dev-only strings of this app (`__minesweeperMines`,
  `__board3dProbe`) and the size budget of the 3D chunk (180 kB gzip). `npm run check:dist`
  fails if the strings appear in `dist/`, if three.js ends up in the entry chunk, or if
  the 3D chunk is over budget.

## Backlog

The stories of this app are in `docs/backlog/`:

- [005 – Minesweeper with configurable board size and mine count](docs/backlog/005-minesweeper.md)
- [006 – Presets and timer](docs/backlog/006-minesweeper-presets-timer.md)
- [007 – Redesign of the 2D UI](docs/backlog/007-minesweeper-redesign.md)
- [008 – 3D mode, switchable during play](docs/backlog/008-minesweeper-3d-mode.md)
- [009 – 3D visual upgrade](docs/backlog/009-minesweeper-3d-visual-upgrade.md)

The index of all stories, platform and apps, is
[`docs/backlog/README.md`](../../docs/backlog/README.md) in the repo root. The decision
for the 3D scene is [ADR 0005](docs/adr/0005-three-js-board-scene-with-dom-overlay.md).
