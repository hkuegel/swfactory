import { Group } from 'three';
import type { QualityLevel } from './timeline.ts';
import type { EffectHost, SceneEffect } from './types.ts';

/** The effect host plus what the scene needs to drive it (story 009: the seam; story 010 uses it). */
export interface EffectRunner extends EffectHost {
  readonly root: Group;
  /** Advances every effect; ended ones are disposed. Returns true while any effect runs. */
  update(nowMs: number, level: QualityLevel): boolean;
  readonly running: boolean;
  /** Sum of the camera pushes of the last update (cells, screen axes). */
  readonly shake: { readonly x: number; readonly y: number };
}

/**
 * A failing effect is decoration only: it is disposed and logged, the board stays static
 * (story 010, UX §7 "never an error page"). Not silent: e2e specs fail on any console error.
 */
function report(error: unknown): void {
  console.error('3D end effect failed and was stopped', error);
}

function disposeSafely(effect: SceneEffect): void {
  try {
    effect.dispose();
  } catch (error) {
    report(error);
  }
}

export function createEffectHost(): EffectRunner {
  const root = new Group();
  root.name = 'effects';
  let effects: SceneEffect[] = [];
  const frame: { level: QualityLevel; shake: { x: number; y: number } } = {
    level: 0,
    shake: { x: 0, y: 0 },
  };

  return {
    root,
    add(effect) {
      effects.push(effect);
    },
    clear() {
      const ended = effects;
      effects = [];
      for (const effect of ended) disposeSafely(effect);
      frame.shake.x = 0;
      frame.shake.y = 0;
    },
    update(nowMs, level) {
      frame.level = level;
      frame.shake.x = 0;
      frame.shake.y = 0;
      // In place, no allocation per frame: ended or failed effects are disposed once.
      let kept = 0;
      for (let i = 0; i < effects.length; i++) {
        const effect = effects[i];
        if (!effect) continue;
        let alive: boolean;
        try {
          alive = effect.update(nowMs, frame);
        } catch (error) {
          report(error);
          alive = false;
        }
        if (alive) effects[kept++] = effect;
        else disposeSafely(effect);
      }
      effects.length = kept;
      return kept > 0;
    },
    get running() {
      return effects.length > 0;
    },
    get shake() {
      return frame.shake;
    },
  };
}
