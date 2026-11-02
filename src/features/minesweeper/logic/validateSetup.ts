import type { GameConfig, SetupError, SetupErrors, SetupValues } from './types.ts';

export const MIN_SIZE = 5;
export const MAX_SIZE = 30;
export const MIN_MINES = 1;
/** The first revealed cell and its neighbours never hold a mine (AC5). */
export const SAFE_ZONE_CELLS = 9;
export const DEFAULT_SETUP: SetupValues = { rows: '9', cols: '9', mines: '10' };

export type SetupResult =
  | { readonly ok: true; readonly config: GameConfig }
  | { readonly ok: false; readonly errors: SetupErrors };

type Parsed =
  | { readonly ok: true; readonly value: number }
  | { readonly ok: false; readonly error: SetupError };

function parseWholeNumber(raw: string): Parsed {
  const text = raw.trim();
  if (text === '') return { ok: false, error: { kind: 'required' } };
  if (!/^\d+$/.test(text)) return { ok: false, error: { kind: 'notWholeNumber' } };
  return { ok: true, value: Number(text) };
}

function inRange(parsed: Parsed, min: number, max: number): Parsed {
  if (!parsed.ok) return parsed;
  return parsed.value >= min && parsed.value <= max
    ? parsed
    : { ok: false, error: { kind: 'outOfRange', min, max } };
}

function parseSize(raw: string): Parsed {
  return inRange(parseWholeNumber(raw), MIN_SIZE, MAX_SIZE);
}

/**
 * Mines while rows or columns are invalid: the upper limit is unknown (UX §4), so only
 * values no board size could accept are reported, with the formula as the limit.
 */
function parseMinesWithoutSize(raw: string): Parsed {
  const parsed = parseWholeNumber(raw);
  if (!parsed.ok) return parsed;
  const absoluteMax = MAX_SIZE * MAX_SIZE - SAFE_ZONE_CELLS;
  return parsed.value >= MIN_MINES && parsed.value <= absoluteMax
    ? parsed
    : { ok: false, error: { kind: 'dependsOnSize' } };
}

/** Upper mine limit for the current rows and columns, or null if either is invalid. */
export function maxMines(values: SetupValues): number | null {
  const rows = parseSize(values.rows);
  const cols = parseSize(values.cols);
  return rows.ok && cols.ok ? rows.value * cols.value - SAFE_ZONE_CELLS : null;
}

export interface SetupLimits {
  readonly size: { readonly min: number; readonly max: number };
  /** `max` is null while rows or columns are invalid (the hint then shows the formula). */
  readonly mines: { readonly min: number; readonly max: number | null };
}

/** Range hints for the setup fields (AC1). */
export function setupLimits(values: SetupValues): SetupLimits {
  return {
    size: { min: MIN_SIZE, max: MAX_SIZE },
    mines: { min: MIN_MINES, max: maxMines(values) },
  };
}

/** Checks the raw setup strings (AC3): the game config, or one error per invalid field. */
export function validateSetup(values: SetupValues): SetupResult {
  const rows = parseSize(values.rows);
  const cols = parseSize(values.cols);
  const mines =
    rows.ok && cols.ok
      ? inRange(
          parseWholeNumber(values.mines),
          MIN_MINES,
          rows.value * cols.value - SAFE_ZONE_CELLS,
        )
      : parseMinesWithoutSize(values.mines);

  if (rows.ok && cols.ok && mines.ok) {
    return { ok: true, config: { rows: rows.value, cols: cols.value, mines: mines.value } };
  }
  return {
    ok: false,
    errors: {
      ...(rows.ok ? {} : { rows: rows.error }),
      ...(cols.ok ? {} : { cols: cols.error }),
      ...(mines.ok ? {} : { mines: mines.error }),
    },
  };
}
