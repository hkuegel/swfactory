import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSettledValue } from './useSettledValue.ts';

describe('useSettledValue', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC7: returns the initial value at once and a new value only after it settled', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useSettledValue(value, 700), {
      initialProps: { value: '' },
    });
    expect(result.current).toBe('');

    rerender({ value: '1' });
    await act(() => vi.advanceTimersByTimeAsync(400));
    rerender({ value: '15' });
    await act(() => vi.advanceTimersByTimeAsync(699));
    expect(result.current).toBe('');

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(result.current).toBe('15');
  });
});
