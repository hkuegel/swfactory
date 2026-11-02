export interface GameConfig {
  readonly rows: number; // 5..30
  readonly cols: number; // 5..30
  readonly mines: number; // 1..rows*cols-9
}

export type CellState = 'hidden' | 'flagged' | 'revealed';

/** `ready` = board shown, no reveal yet (mines not placed). */
export type GamePhase = 'ready' | 'playing' | 'won' | 'lost';

export interface GameState {
  /** +1 per Start; React key for the board. */
  readonly id: number;
  readonly config: GameConfig;
  readonly phase: GamePhase;
  readonly seed: number;
  /** e2e/unit only: mine indices used instead of random placement. */
  readonly fixedMines: readonly number[] | null;
  /** null until the first reveal. */
  readonly mines: readonly boolean[] | null;
  /** Neighbour mine counts, computed together with `mines`. */
  readonly adjacent: readonly number[] | null;
  readonly cells: readonly CellState[];
  readonly revealedCount: number;
  readonly flagCount: number;
  readonly explodedIndex: number | null;
}

export type GameAction =
  | {
      readonly type: 'start';
      readonly config: GameConfig;
      readonly seed: number;
      readonly fixedMines?: readonly number[] | undefined;
    }
  | { readonly type: 'reveal'; readonly index: number }
  | { readonly type: 'toggleFlag'; readonly index: number };

/** Raw input strings, so "not a whole number" is detectable. */
export interface SetupValues {
  readonly rows: string;
  readonly cols: string;
  readonly mines: string;
}

export type SetupField = keyof SetupValues;

export type SetupError =
  | { readonly kind: 'required' }
  | { readonly kind: 'notWholeNumber' }
  | { readonly kind: 'outOfRange'; readonly min: number; readonly max: number }
  // mines when rows/cols are invalid, so the max is unknown
  | { readonly kind: 'dependsOnSize' };

export type SetupErrors = Partial<Record<SetupField, SetupError>>;
