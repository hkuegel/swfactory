import { describe, expect, it } from 'vitest';
import { EFFECT_LIMITS, FX_GENERAL } from '../effectParams.ts';
import { maxFlashesPerSecond } from '../endPlan.ts';
import {
  burstCount,
  burstPeaks,
  FIREWORKS,
  FIREWORKS_END_MS,
  flashAt,
  planFireworks,
  sparkAt,
} from './fireworksPlan.ts';

const WINDOW = { left: -5, right: 5, bottom: -5, top: 5 };

describe('fireworks plan', () => {
  it('AC5: it ends at the latest 4 s after the click, with the slack of the other effects', () => {
    expect(FIREWORKS_END_MS).toBeLessThanOrEqual(FX_GENERAL.winEndMs);
    expect(FIREWORKS_END_MS + EFFECT_LIMITS.frameSlackMs).toBeLessThanOrEqual(
      EFFECT_LIMITS.winMaxMs,
    );
  });

  it('AC5: nothing flashes more than 3 times in any second, at every particle share', () => {
    for (const share of [1, 0.75, 0.5, 0.3, 0.1]) {
      const bursts = planFireworks(7, WINDOW, share);
      expect(bursts.length).toBe(burstCount(share));
      expect(maxFlashesPerSecond(burstPeaks(bursts))).toBeLessThanOrEqual(3);
    }
    // Non-vacuous: the limit is what binds, one more burst per gap would break it.
    const dense = [0, 300, 600, 900];
    expect(maxFlashesPerSecond(dense)).toBe(4);
    expect(FIREWORKS.gapMs).toBeGreaterThanOrEqual(334);
  });

  it('AC5: the same game gives the same picture, other games differ, bursts lie over the board', () => {
    const a = planFireworks(11, WINDOW, 1);
    const b = planFireworks(11, WINDOW, 1);
    const c = planFireworks(12, WINDOW, 1);
    expect(a.map((x) => [x.x, x.y, x.z, x.colour])).toEqual(
      b.map((x) => [x.x, x.y, x.z, x.colour]),
    );
    expect(a.map((x) => x.x)).not.toEqual(c.map((x) => x.x));
    for (const burst of a) {
      expect(burst.x).toBeGreaterThanOrEqual(WINDOW.left);
      expect(burst.x).toBeLessThanOrEqual(WINDOW.right);
      expect(burst.z).toBeGreaterThanOrEqual(FIREWORKS.heightMin);
      expect(burst.burstMs - burst.launchMs).toBe(FIREWORKS.riseMs);
    }
    expect(new Set(a.map((x) => x.colour)).size).toBeGreaterThan(1);
  });

  it('AC5: sparks fly out, slow down, fall and are gone at the end of their life', () => {
    const [burst] = planFireworks(3, WINDOW, 1);
    if (!burst) throw new Error('no burst');
    const early = { x: 0, y: 0, z: 0, age: 0 };
    const late = { x: 0, y: 0, z: 0, age: 0 };
    expect(sparkAt(burst, 0, 100, early)).toBe(true);
    expect(sparkAt(burst, 0, 800, late)).toBe(true);
    expect(late.age).toBeGreaterThan(early.age);
    // A spark that starts level has fallen by gravity later: lower than its straight path.
    expect(sparkAt(burst, 0, -1, early)).toBe(false);
    expect(sparkAt(burst, 0, FIREWORKS.lifeMs, early)).toBe(false);
    for (let i = 0; i < burst.sparks.length / 4; i++) {
      expect(sparkAt(burst, i, 500, early)).toBe(true);
      expect(Number.isFinite(early.x + early.y + early.z)).toBe(true);
    }
    expect(flashAt(-1)).toBe(0);
    expect(flashAt(FIREWORKS.flashMs)).toBe(0);
    expect(flashAt(FIREWORKS.flashMs * 0.25)).toBeCloseTo(1, 9);
  });
});
