import { describe, expect, it } from 'vitest';
import { displayName } from './displayName.ts';

const base = { provider: 'google', id: '1', email: 'jane@example.com' } as const;

describe('displayName', () => {
  it('AC2: returns the name when Google provides one', () => {
    expect(displayName({ ...base, name: 'Jane Doe' })).toBe('Jane Doe');
  });

  it('AC2: trims surrounding whitespace from the name', () => {
    expect(displayName({ ...base, name: '  Jane Doe ' })).toBe('Jane Doe');
  });

  it('AC11: returns the email when the name is null', () => {
    expect(displayName({ ...base, name: null })).toBe('jane@example.com');
  });

  it.each(['', '   ', '\t\n'])('AC11: returns the email when the name is blank (%j)', (name) => {
    expect(displayName({ ...base, name })).toBe('jane@example.com');
  });
});
