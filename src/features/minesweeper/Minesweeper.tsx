import { useCallback, useId, useReducer, useState } from 'react';
import { Board } from './Board.tsx';
import { GameStatus } from './GameStatus.tsx';
import { supports3dView, type BoardView } from './logic/boardView.ts';
import { gameReducer } from './logic/gameReducer.ts';
import { toIndex } from './logic/grid.ts';
import { presetToValues } from './logic/presets.ts';
import type { GameConfig, Preset, SetupErrors, SetupField, SetupValues } from './logic/types.ts';
import { DEFAULT_SETUP, validateSetup } from './logic/validateSetup.ts';
import styles from './Minesweeper.module.css';
import { SetupForm } from './SetupForm.tsx';
import { ViewToggle } from './ViewToggle.tsx';

type MineLayout = readonly (readonly [row: number, col: number])[];

declare global {
  interface Window {
    /** Fixed mine layout for e2e tests; read only by the Vite dev server in mode `e2e`. */
    __minesweeperMines?: MineLayout;
  }
}

/**
 * Used only inside the e2e guard below, so it is dropped from production builds. Throws on
 * cells outside the board (test-only input, fail fast); the reducer checks count and duplicates.
 */
function toIndices(layout: MineLayout | undefined, config: GameConfig): number[] | undefined {
  return layout?.map(([row, col]) => {
    if (row < 0 || row >= config.rows || col < 0 || col >= config.cols) {
      throw new Error(`e2e mine layout: (${row}, ${col}) is outside the board`);
    }
    return toIndex(row, col, config.cols);
  });
}

/** Live-region text after a successful Start (UX §5). */
function newGameText(config: GameConfig): string {
  const mines = config.mines === 1 ? '1 mine' : `${config.mines} mines`;
  return `New game: ${config.rows} by ${config.cols}, ${mines}.`;
}

/** Live-region text after a preset was chosen (006 UX §4). */
function presetText(preset: Preset): string {
  const { rows, cols, mines } = preset.config;
  return `${preset.name} values set: ${rows} rows, ${cols} columns, ${mines} mines.`;
}

/** The game (story 005): setup, status and board. Nothing is persisted. */
export function Minesweeper() {
  const headingId = useId();
  const [values, setValues] = useState<SetupValues>(DEFAULT_SETUP);
  const [errors, setErrors] = useState<SetupErrors>({});
  const [game, dispatch] = useReducer(gameReducer, null);
  // A presentation choice, not game state (story 008). Not persisted: a reload or sign-out
  // (unmount) resets it to 2D (AC8). The capability is read once per mount, never at module load.
  const [view, setView] = useState<BoardView>('2d');
  const [available3d] = useState(supports3dView);
  // One live region for "New game" and preset messages. `serial` makes every message differ
  // from the previous one (trailing no-break space on every other one, invisible and trimmed
  // by text queries), because screen readers don't announce unchanged text again.
  const [announcement, setAnnouncement] = useState({ text: '', serial: 0 });
  const announce = (text: string) => setAnnouncement((prev) => ({ text, serial: prev.serial + 1 }));

  const handleChange = useCallback((field: SetupField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Editing a field clears only that field's message (UX §4).
    setErrors((prev) => {
      if (prev[field] === undefined) return prev;
      return Object.fromEntries(
        Object.entries(prev).filter(([key]) => key !== field),
      ) satisfies SetupErrors;
    });
  }, []);

  const handlePreset = (preset: Preset) => {
    // Only the inputs change: no dispatch, so a game in progress stays as it is (AC2).
    setValues(presetToValues(preset.config));
    setErrors({});
    announce(presetText(preset));
  };

  const handleStart = () => {
    const result = validateSetup(values);
    if (!result.ok) {
      setErrors(result.errors); // AC3: no dispatch, the running game stays
      return;
    }
    setErrors({});
    // Random seed here, not in the reducer, so the reducer stays pure (StrictMode).
    const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
    // Literal guard (CLAUDE.md "Dev-only code"): never part of a production build.
    const fixedMines =
      import.meta.env.DEV && import.meta.env.MODE === 'e2e'
        ? toIndices(window.__minesweeperMines, result.config)
        : undefined;
    dispatch({ type: 'start', config: result.config, seed, fixedMines });
    announce(newGameText(result.config));
  };

  const handleReveal = useCallback(
    (index: number) => dispatch({ type: 'reveal', index, now: Date.now() }),
    [],
  );
  const handleToggleFlag = useCallback(
    (index: number) => dispatch({ type: 'toggleFlag', index }),
    [],
  );

  return (
    <section aria-labelledby={headingId} className={styles.game}>
      <div className={styles.column}>
        <h2 id={headingId}>Minesweeper</h2>
        <SetupForm
          values={values}
          errors={errors}
          onChange={handleChange}
          onPreset={handlePreset}
          onStart={handleStart}
        />
        {/* Mounted empty from the start, so every announcement is read (UX §5). */}
        <p className={styles.visuallyHidden} aria-live="polite" aria-atomic="true">
          {announcement.serial > 0 && announcement.serial % 2 === 0
            ? `${announcement.text}\u00a0`
            : announcement.text}
        </p>
        <ViewToggle view={view} onChange={setView} available3d={available3d} />
        {game === null ? (
          <p className={styles.empty}>Set the board size and the number of mines to begin.</p>
        ) : (
          <GameStatus
            remainingMines={game.config.mines - game.flagCount}
            phase={game.phase}
            startedAt={game.startedAt}
            endedAt={game.endedAt}
          />
        )}
      </div>
      {game && (
        <Board
          key={game.id}
          game={game}
          view={view}
          onReveal={handleReveal}
          onToggleFlag={handleToggleFlag}
        />
      )}
    </section>
  );
}
