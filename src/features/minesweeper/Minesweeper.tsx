import { useCallback, useId, useReducer, useState } from 'react';
import { Board } from './Board.tsx';
import { GameStatus } from './GameStatus.tsx';
import { gameReducer } from './logic/gameReducer.ts';
import { toIndex } from './logic/grid.ts';
import type { GameConfig, SetupErrors, SetupField, SetupValues } from './logic/types.ts';
import { DEFAULT_SETUP, validateSetup } from './logic/validateSetup.ts';
import styles from './Minesweeper.module.css';
import { SetupForm } from './SetupForm.tsx';

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

/**
 * Text for the live region after a successful Start. A restart with the same values would
 * give the same text, which screen readers don't announce again, so every other game gets a
 * trailing no-break space (invisible, and trimmed by text queries).
 */
function newGameAnnouncement(config: GameConfig, gameId: number): string {
  const mines = config.mines === 1 ? '1 mine' : `${config.mines} mines`;
  const text = `New game: ${config.rows} by ${config.cols}, ${mines}.`;
  return gameId % 2 === 0 ? `${text}\u00a0` : text;
}

/** The game (story 005): setup, status and board. Nothing is persisted. */
export function Minesweeper() {
  const headingId = useId();
  const [values, setValues] = useState<SetupValues>(DEFAULT_SETUP);
  const [errors, setErrors] = useState<SetupErrors>({});
  const [game, dispatch] = useReducer(gameReducer, null);

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
  };

  const handleReveal = useCallback((index: number) => dispatch({ type: 'reveal', index }), []);
  const handleToggleFlag = useCallback(
    (index: number) => dispatch({ type: 'toggleFlag', index }),
    [],
  );

  return (
    <section aria-labelledby={headingId} className={styles.game}>
      <div className={styles.column}>
        <h2 id={headingId}>Minesweeper</h2>
        <SetupForm values={values} errors={errors} onChange={handleChange} onStart={handleStart} />
        {/* Mounted from the start, so every successful Start is announced (UX §5). */}
        <p className={styles.visuallyHidden} aria-live="polite" aria-atomic="true">
          {game && newGameAnnouncement(game.config, game.id)}
        </p>
        {game === null ? (
          <p className={styles.empty}>Set the board size and the number of mines to begin.</p>
        ) : (
          <GameStatus remainingMines={game.config.mines - game.flagCount} phase={game.phase} />
        )}
      </div>
      {game && (
        <Board key={game.id} game={game} onReveal={handleReveal} onToggleFlag={handleToggleFlag} />
      )}
    </section>
  );
}
