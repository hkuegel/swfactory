import { describe, expect, it } from 'vitest';
import { nextStepIndex } from './stepNavigation.ts';

const COUNT = 9;

describe('nextStepIndex', () => {
  it('AC2: the next and previous keys wrap at both ends', () => {
    expect(nextStepIndex(3, 'ArrowDown', COUNT)).toBe(4);
    expect(nextStepIndex(COUNT - 1, 'ArrowDown', COUNT)).toBe(0);
    expect(nextStepIndex(3, 'ArrowUp', COUNT)).toBe(2);
    expect(nextStepIndex(0, 'ArrowUp', COUNT)).toBe(COUNT - 1);
  });

  it('AC2: Left and Right move like Up and Down', () => {
    for (const current of [0, 4, COUNT - 1]) {
      expect(nextStepIndex(current, 'ArrowLeft', COUNT)).toBe(
        nextStepIndex(current, 'ArrowUp', COUNT),
      );
      expect(nextStepIndex(current, 'ArrowRight', COUNT)).toBe(
        nextStepIndex(current, 'ArrowDown', COUNT),
      );
    }
  });

  it('AC2: Home and End go to the first and the last step', () => {
    expect(nextStepIndex(4, 'Home', COUNT)).toBe(0);
    expect(nextStepIndex(4, 'End', COUNT)).toBe(COUNT - 1);
  });

  it('AC2: other keys are not handled', () => {
    for (const key of ['Tab', 'Enter', ' ', 'a', 'PageDown', 'Escape']) {
      expect(nextStepIndex(4, key, COUNT)).toBeUndefined();
    }
  });
});
