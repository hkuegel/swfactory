import type { GameConfig, Preset, SetupValues } from './types.ts';

/** Rows × columns, in the order shown (AC1). All within the setup ranges of story 005. */
export const PRESETS: readonly Preset[] = [
  { name: 'Beginner', config: { rows: 9, cols: 9, mines: 10 } },
  { name: 'Intermediate', config: { rows: 16, cols: 16, mines: 40 } },
  { name: 'Expert', config: { rows: 16, cols: 30, mines: 99 } },
];

/** The setup input strings for a preset (AC2). */
export function presetToValues(config: GameConfig): SetupValues {
  return { rows: String(config.rows), cols: String(config.cols), mines: String(config.mines) };
}
