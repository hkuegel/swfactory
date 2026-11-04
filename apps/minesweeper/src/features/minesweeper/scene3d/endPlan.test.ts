import { describe, expect, it } from 'vitest';
import { EFFECT_LIMITS, FX_CAPACITY, FX_GENERAL, FX_LOSS, FX_WIN } from './effectParams.ts';
import {
  bloomAt,
  chainLengthMs,
  confettiCount,
  createParticleState,
  effectScale,
  effectSeed,
  LOSS_FLASH_PEAKS,
  maxFlashesPerSecond,
  mineChain,
  particleAt,
  shakeAt,
  spawnConfetti,
  spawnExplosion,
  visibleWindow,
  WIN_FLASH_PEAKS,
  type Particle,
} from './endPlan.ts';
import { endOf, planTransitions, type BoardSnapshot, type CellKind } from './timeline.ts';

const LEVELS = [0, 1, 2] as const;
const BOARDS = [
  [5, 5, 10],
  [9, 9, 10],
  [16, 16, 40],
  [16, 30, 99],
  [30, 30, 891],
] as const;

/** Ends of a particle list (ms after the click). */
const lastEnd = (particles: readonly Particle[]) =>
  particles.reduce((end, p) => Math.max(end, p.born + p.life), 0);

describe('end effects plan (story 010)', () => {
  it('AC1/AC2: every board size and quality level ends before the AC limits, nothing loops', () => {
    expect(FX_GENERAL.lossEndMs + EFFECT_LIMITS.frameSlackMs).toBeLessThanOrEqual(
      EFFECT_LIMITS.lossMaxMs,
    );
    expect(FX_GENERAL.winEndMs + EFFECT_LIMITS.frameSlackMs).toBeLessThanOrEqual(
      EFFECT_LIMITS.winMaxMs,
    );
    for (const [rows, cols, mines] of BOARDS) {
      const cells = rows * cols;
      for (const level of LEVELS) {
        // Loss: every cell but a few is a hidden mine or a wrong flag, the worst case.
        const before: CellKind[] = Array.from({ length: cells }, (_, i) =>
          i % 7 === 3 ? 'flagged' : 'hidden',
        );
        const mineAt = (i: number) => i < mines;
        const after = before.map((k, i): CellKind => {
          if (i === 0) return 'mineExploded';
          if (k === 'flagged') return mineAt(i) ? 'flagged' : 'flagWrong';
          return mineAt(i) ? 'mine' : k;
        });
        const prev: BoardSnapshot = {
          gameId: 1,
          phase: 'playing',
          kinds: before,
          explodedIndex: null,
        };
        const lost: BoardSnapshot = { gameId: 1, phase: 'lost', kinds: after, explodedIndex: 0 };
        const motion = { reducedMotion: false, level };
        const loss = planTransitions(prev, lost, 0, cols, 0, motion);
        expect(endOf(loss), `loss anims ${rows}x${cols} L${level}`).toBeLessThanOrEqual(
          FX_GENERAL.lossEndMs,
        );
        const scale = effectScale(cells, level);
        const chain = mineChain(
          0,
          Array.from({ length: mines }, (_, i) => i),
          cols,
          level,
        );
        expect(Math.max(0, ...chain.map((s) => s.delayMs))).toBeLessThanOrEqual(
          chainLengthMs(chain.length),
        );
        const sites = chain.map((s) => [0, 0, FX_LOSS.chain.startMs + s.delayMs] as const);
        const fx = spawnExplosion(effectSeed(1, 0), [0, 0], scale, sites);
        const all = [...fx.fire, ...fx.sparks, ...fx.shards, ...fx.smoke, ...fx.puffs];
        expect(lastEnd(all), `loss particles ${rows}x${cols} L${level}`).toBeLessThanOrEqual(
          FX_GENERAL.lossEndMs,
        );
        expect(all.every((p) => Number.isFinite(p.life) && p.life > 0)).toBe(true);
        expect(
          fx.fire.length + fx.sparks.length + fx.smoke.length + fx.puffs.length,
        ).toBeLessThanOrEqual(FX_CAPACITY.glow);
        expect(fx.shards.length).toBeLessThanOrEqual(FX_CAPACITY.shards);

        // Win: the whole board visible, every mine flagged.
        const won: BoardSnapshot = {
          gameId: 1,
          phase: 'won',
          kinds: before.map((_, i): CellKind => (mineAt(i) ? 'flagged' : 'empty')),
          explodedIndex: null,
        };
        const win = planTransitions(prev, won, 0, cols, 0, motion);
        expect(endOf(win), `win anims ${rows}x${cols} L${level}`).toBeLessThanOrEqual(
          FX_GENERAL.winEndMs,
        );
        const window = { left: -cols / 2, right: cols / 2, bottom: -rows / 2, top: rows / 2 };
        const confetti = spawnConfetti(effectSeed(1, 0), window, scale);
        expect(lastEnd(confetti)).toBeLessThanOrEqual(FX_GENERAL.winEndMs);
        expect(confetti.length).toBeLessThanOrEqual(FX_CAPACITY.confetti);
        expect(confetti.length).toBeGreaterThan(0);
      }
    }
  });

  it('AC1/AC2: at most 3 flashes in any second; the bloom never exceeds 150 px', () => {
    expect(maxFlashesPerSecond([0, 300, 600, 899])).toBe(4);
    expect(maxFlashesPerSecond([0, 400, 800])).toBe(3);
    expect(maxFlashesPerSecond([0, 1000, 2000])).toBe(1);
    expect(maxFlashesPerSecond([])).toBe(0);
    expect(maxFlashesPerSecond(LOSS_FLASH_PEAKS)).toBeLessThanOrEqual(
      EFFECT_LIMITS.flashesPerSecondMax,
    );
    expect(maxFlashesPerSecond(WIN_FLASH_PEAKS)).toBe(0);
    for (let cellPx = 26; cellPx <= 40; cellPx++) {
      for (let t = 0; t < FX_LOSS.bloom.durationMs; t += 5) {
        expect(bloomAt(t, cellPx).diameter * cellPx).toBeLessThanOrEqual(
          EFFECT_LIMITS.flashAreaMaxPx,
        );
      }
    }
    expect(bloomAt(FX_LOSS.bloom.durationMs, 30).alpha).toBe(0);
  });

  it('AC1: the shake is one bounded push of at most 0.4 s, zero outside it, deterministic', () => {
    expect(FX_LOSS.shake.durationMs).toBeLessThanOrEqual(EFFECT_LIMITS.shakeMaxMs);
    expect(shakeAt(-1)).toEqual({ x: 0, y: 0 });
    expect(shakeAt(FX_LOSS.shake.durationMs)).toEqual({ x: 0, y: 0 });
    expect(shakeAt(5000)).toEqual({ x: 0, y: 0 });
    let peak = 0;
    for (let t = 0; t < FX_LOSS.shake.durationMs; t += 4) {
      const { x, y } = shakeAt(t, [0.6, 0.8]);
      peak = Math.max(peak, Math.hypot(x, y));
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(FX_LOSS.shake.amplitude);
    }
    expect(peak).toBeGreaterThan(0);
    expect(shakeAt(123, [0.6, 0.8])).toEqual(shakeAt(123, [0.6, 0.8]));
  });

  it('AC1: the chain goes nearest first, ties by index, with growing delays; level 2 in 4 bands', () => {
    // 9 x 9, exploded 40 (row 4, col 4).
    const chain = mineChain(40, [0, 41, 39, 80, 40, 44], 9, 0);
    expect(chain.map((s) => s.index)).toEqual([39, 41, 44, 0, 80]);
    chain.slice(1).forEach((s, i) => {
      expect(s.delayMs).toBeGreaterThan(chain[i]?.delayMs ?? Infinity);
    });
    expect(mineChain(40, [], 9, 0)).toEqual([]);
    expect(mineChain(40, [3], 9, 0).map((s) => s.delayMs)).toEqual([0]);
    const many = Array.from({ length: 200 }, (_, i) => i + 41);
    const banded = mineChain(40, many, 9, 2);
    expect(new Set(banded.map((s) => s.delayMs)).size).toBeLessThanOrEqual(4);
    expect(Math.max(...banded.map((s) => s.delayMs))).toBeLessThanOrEqual(FX_LOSS.chain.maxMs);
  });

  it('AC5: the budget shrinks with the board size and the quality level, as UX S1 and S2', () => {
    const sizes = [81, 256, 257, 480, 600, 601, 900];
    for (const level of LEVELS) {
      sizes.slice(1).forEach((cells, i) => {
        const a = effectScale(sizes[i] ?? 0, level);
        const b = effectScale(cells, level);
        for (const key of [
          'puffs',
          'sparks',
          'shards',
          'smoke',
          'confetti',
          'chainPuffMines',
        ] as const) {
          expect(b[key], `${key} ${cells}`).toBeLessThanOrEqual(a[key]);
        }
      });
    }
    for (const cells of sizes) {
      const [l0, l1, l2] = LEVELS.map((level) => effectScale(cells, level));
      expect(l1?.puffs).toBeLessThanOrEqual(l0?.puffs ?? 0);
      expect(l2?.puffs).toBeLessThanOrEqual(l1?.puffs ?? 0);
      expect(l1?.light).toBe(false);
      expect(l2?.smoke).toBe(0);
      expect(l2?.hop).toBe(false);
      expect(l2?.shards).toBeLessThanOrEqual(3);
    }
    expect(effectScale(256, 0)).toMatchObject({ puffs: 1, shards: 8, shudder: true });
    expect(effectScale(480, 0)).toMatchObject({ puffs: 0.75, shudder: false, chainPuffMines: 20 });
    expect(effectScale(900, 0)).toMatchObject({ puffs: 0.5, shards: 4, chainPuffMines: 10 });
  });

  it('AC1/AC2: the same seed gives the same particles; paths are closed-form and finite', () => {
    const scale = effectScale(81, 0);
    expect(spawnExplosion(effectSeed(3, 40), [1, 2], scale)).toEqual(
      spawnExplosion(effectSeed(3, 40), [1, 2], scale),
    );
    const window = { left: -5, right: 5, bottom: -5, top: 5 };
    expect(spawnConfetti(7, window, scale)).toEqual(spawnConfetti(7, window, scale));

    const out = createParticleState();
    const base: Particle = {
      born: 100,
      life: 500,
      p0: [0, 0, 0],
      v0: [1, 2, 3],
      terminal: [0, -1, 0],
      drag: 0,
      accel: [0, 0, -10],
      spin: 1,
      phase: 0,
      twist: 0,
      flutter: { amp: 0, hz: 0, phase: 0 },
      size: 1,
      colour: 0,
    };
    expect(particleAt(base, 99, out)).toBe(false);
    expect(particleAt(base, 600, out)).toBe(false);
    expect(particleAt(base, 350, out)).toBe(true);
    const gravityOnly = { ...out };
    particleAt({ ...base, drag: 1e-7 }, 350, out);
    expect(out.x).toBeCloseTo(gravityOnly.x, 5);
    expect(out.y).toBeCloseTo(gravityOnly.y, 5);
    expect(out.z).toBeCloseTo(gravityOnly.z, 5);
  });

  it('AC2: the visible window is the whole board plus rim when it fits, and the scrolled corner otherwise', () => {
    const step = 1 + 2 / 30;
    const fits = visibleWindow({
      rows: 9,
      cols: 9,
      step,
      cellPx: 30,
      rimPx: 16,
      centreX: 500,
      centreY: 400,
      view: { left: 0, top: 0, right: 1000, bottom: 800 },
    });
    const half = (9 * step) / 2 + 16 / 30;
    expect(fits).toEqual({ left: -half, right: half, bottom: -half, top: half });

    // 30 x 30, cell 26 px, only the near left corner (300 x 250 px) visible.
    const corner = visibleWindow({
      rows: 30,
      cols: 30,
      step: 1 + 2 / 26,
      cellPx: 26,
      rimPx: 4,
      centreX: 420,
      centreY: 380,
      view: { left: 0, top: 510, right: 300, bottom: 760 },
    });
    expect(corner.left).toBeLessThan(-15);
    expect(corner.right).toBeLessThan(0);
    expect(corner.bottom).toBeLessThan(-14);
    expect(corner.top).toBeLessThan(0);
    expect(confettiCount(corner)).toBeLessThanOrEqual(FX_WIN.count.max);
    expect(confettiCount(corner)).toBeGreaterThanOrEqual(FX_WIN.count.min);
  });
});
