import { useSyncExternalStore } from 'react';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(REDUCED_MOTION);
  media.addEventListener('change', onChange);
  return () => {
    media.removeEventListener('change', onChange);
  };
}

function getSnapshot(): boolean {
  return !window.matchMedia(REDUCED_MOTION).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Whether the page may show its interactive form: `false` on the server and in the hydration
 * render (so the markup built ahead matches), then `true` unless reduced motion is on; follows the
 * setting live (ADR 0011).
 */
export function useEnhanced(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
