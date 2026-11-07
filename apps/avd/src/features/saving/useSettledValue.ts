import { useEffect, useState } from 'react';

/**
 * `value` once it has stayed unchanged for `delayMs` (trailing debounce). Used for the live
 * region only, so a screen reader doesn't queue one announcement per keystroke (story 013, UX §4).
 */
export function useSettledValue<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSettled(value);
    }, delayMs);
    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);
  return settled;
}
