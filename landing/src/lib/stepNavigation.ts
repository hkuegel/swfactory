/**
 * Keyboard model of the pipeline tabs (WAI-ARIA APG Tabs): the index the key moves the selection
 * to, wrapping at both ends, or `undefined` for a key the tabs don't handle. `count` is at least 1.
 */
export function nextStepIndex(current: number, key: string, count: number): number | undefined {
  switch (key) {
    case 'ArrowUp':
    case 'ArrowLeft':
      return (current - 1 + count) % count;
    case 'ArrowDown':
    case 'ArrowRight':
      return (current + 1) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return undefined;
  }
}
