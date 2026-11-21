import { describe, expect, it } from 'vitest';
import { EFFECT_LIMITS, FX_GENERAL } from '../effectParams.ts';
import {
  debrisAt,
  DEBRIS,
  planDebris,
  SHOCK,
  shockEndMs,
  shockLift,
  shockRadius,
} from './lossPlan.ts';

describe('loss plan', () => {
  it('AC5: the shockwave lifts tiles only while the front passes, peaks at the front, fades with distance', () => {
    const t = 400;
    const front = shockRadius(t);
    expect(shockLift(front, t)).toBeGreaterThan(
      0.9 * SHOCK.amplitude * (1 / (1 + SHOCK.decay * front)),
    );
    expect(shockLift(front + 4 * SHOCK.width, t)).toBe(0); // not yet reached
    expect(shockLift(Math.max(0, front - 4 * SHOCK.width), t)).toBe(0); // already passed
    expect(shockLift(front, t)).toBeGreaterThan(shockLift(front + SHOCK.width, t));
    const near = shockLift(5, shockRadius(1) === 0 ? 0 : (5 / SHOCK.speed) * 1000);
    const far = shockLift(25, (25 / SHOCK.speed) * 1000);
    expect(near).toBeGreaterThan(far);
    expect(far).toBeGreaterThan(0);
  });

  it('AC5: the shockwave over the largest board ends before the explosion effect', () => {
    const corner = Math.hypot(30, 30);
    expect(shockEndMs(corner)).toBeLessThanOrEqual(SHOCK.maxMs);
    expect(SHOCK.maxMs).toBeLessThanOrEqual(FX_GENERAL.lossEndMs);
    expect(shockEndMs(corner) + EFFECT_LIMITS.frameSlackMs).toBeLessThan(EFFECT_LIMITS.lossMaxMs);
    expect(shockEndMs(3)).toBeLessThan(shockEndMs(corner));
  });

  it('AC5: debris flies out, lands or is gone before the end, and scales down with the share', () => {
    expect(DEBRIS.maxMs).toBeLessThanOrEqual(SHOCK.maxMs);
    const pieces = planDebris(5, 1);
    expect(pieces.length).toBe(DEBRIS.count);
    expect(planDebris(5, 0.3).length).toBeLessThan(pieces.length);
    expect(planDebris(5, 0.01).length).toBeGreaterThanOrEqual(8);
    const out = { x: 0, y: 0, z: 0, scale: 1, angle: 0 };
    for (const piece of pieces) {
      expect(debrisAt(piece, 60, out)).toBe(true);
      expect(Math.hypot(out.x, out.y)).toBeGreaterThan(0);
      expect(out.z).toBeGreaterThan(DEBRIS.landZ);
      expect(debrisAt(piece, DEBRIS.maxMs, out)).toBe(false);
      // Gone by the time it falls back: z never stays under the landing height.
      for (let ms = 0; ms < DEBRIS.maxMs; ms += 20) {
        if (debrisAt(piece, ms, out) && ms > 60) expect(out.z).toBeGreaterThanOrEqual(DEBRIS.landZ);
      }
    }
  });
});
