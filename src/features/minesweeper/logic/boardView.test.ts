import { afterEach, describe, expect, it, vi } from 'vitest';
import { supports3dView } from './boardView.ts';

describe('supports3dView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('AC7: is false without CSS', () => {
    vi.stubGlobal('CSS', undefined);
    expect(supports3dView()).toBe(false);
  });

  it('AC7: is false when CSS.supports says no', () => {
    vi.stubGlobal('CSS', { supports: () => false });
    expect(supports3dView()).toBe(false);
  });

  it('AC7: is true when CSS.supports says yes', () => {
    const supports = vi.fn(() => true);
    vi.stubGlobal('CSS', { supports });
    expect(supports3dView()).toBe(true);
    expect(supports).toHaveBeenCalledWith('transform', 'perspective(100px) rotateX(10deg)');
  });
});
