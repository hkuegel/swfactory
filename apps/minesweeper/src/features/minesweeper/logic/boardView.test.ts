import { afterEach, describe, expect, it, vi } from 'vitest';
import { supports3dView } from './boardView.ts';

describe('supports3dView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('AC6: is false without CSS', () => {
    vi.stubGlobal('CSS', undefined);
    vi.stubGlobal('WebGL2RenderingContext', function WebGL2RenderingContext() {});
    expect(supports3dView()).toBe(false);
  });

  it('AC6: is false when CSS.supports says no', () => {
    vi.stubGlobal('CSS', { supports: () => false });
    vi.stubGlobal('WebGL2RenderingContext', function WebGL2RenderingContext() {});
    expect(supports3dView()).toBe(false);
  });

  it('AC6: is false without WebGL2', () => {
    vi.stubGlobal('CSS', { supports: () => true });
    vi.stubGlobal('WebGL2RenderingContext', undefined);
    expect(supports3dView()).toBe(false);
  });

  it('AC6: is true with the CSS transform and WebGL2', () => {
    const supports = vi.fn(() => true);
    vi.stubGlobal('CSS', { supports });
    vi.stubGlobal('WebGL2RenderingContext', function WebGL2RenderingContext() {});
    expect(supports3dView()).toBe(true);
    expect(supports).toHaveBeenCalledWith('transform', 'perspective(100px) rotateX(10deg)');
  });
});
