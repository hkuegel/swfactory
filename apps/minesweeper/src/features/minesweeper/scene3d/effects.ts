import { Group } from 'three';
import type { EffectHost, SceneEffect } from './types.ts';

/** The effect host plus what the scene needs to drive it (story 009: the seam for 010). */
export interface EffectRunner extends EffectHost {
  readonly root: Group;
  /** Advances every effect; ended ones are disposed. Returns true while any effect runs. */
  update(nowMs: number): boolean;
  readonly running: boolean;
}

export function createEffectHost(): EffectRunner {
  const root = new Group();
  root.name = 'effects';
  let effects: SceneEffect[] = [];

  return {
    root,
    add(effect) {
      effects.push(effect);
    },
    clear() {
      effects.forEach((effect) => effect.dispose());
      effects = [];
    },
    update(nowMs) {
      effects = effects.filter((effect) => {
        if (effect.update(nowMs)) return true;
        effect.dispose();
        return false;
      });
      return effects.length > 0;
    },
    get running() {
      return effects.length > 0;
    },
  };
}
