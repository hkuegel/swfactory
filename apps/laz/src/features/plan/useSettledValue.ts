import { useEffect, useState } from 'react';

/**
 * `value` once it has stayed unchanged for `delayMs` (trailing debounce), used for the live region
 * only (UX design §4), so a screen reader does not queue one announcement per keystroke.
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
