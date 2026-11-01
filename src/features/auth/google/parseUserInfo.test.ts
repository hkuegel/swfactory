import { describe, expect, it } from 'vitest';
import { parseUserInfo } from './parseUserInfo.ts';

describe('parseUserInfo', () => {
  it('AC2: maps sub, email and name', () => {
    expect(
      parseUserInfo({ sub: '123', email: 'jane@example.com', name: 'Jane Doe', picture: 'x' }),
    ).toEqual({ id: '123', email: 'jane@example.com', name: 'Jane Doe' });
  });

  it('AC11: a missing name becomes null', () => {
    expect(parseUserInfo({ sub: '123', email: 'jane@example.com' })).toEqual({
      id: '123',
      email: 'jane@example.com',
      name: null,
    });
  });

  it.each(['', '  ', 42, null])('AC11: a blank or non-string name (%j) becomes null', (name) => {
    expect(parseUserInfo({ sub: '123', email: 'jane@example.com', name })).toMatchObject({
      name: null,
    });
  });

  it.each([
    ['no email', { sub: '123', name: 'Jane' }],
    ['blank email', { sub: '123', email: ' ', name: 'Jane' }],
    ['no sub', { email: 'jane@example.com' }],
    ['non-string sub', { sub: 123, email: 'jane@example.com' }],
    ['null', null],
    ['a string', 'jane@example.com'],
    ['an array', []],
  ])('AC5: returns null for %s', (_label, body) => {
    expect(parseUserInfo(body)).toBeNull();
  });
});
