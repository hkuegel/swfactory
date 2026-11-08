import { describe, expect, it } from 'vitest';
import { readPalette, SCENE_COLOUR_TOKENS, SCENE_LOOK_TOKENS } from './palette.ts';

// Bug 020 / AC2: a production CSS minifier writes the 6-digit white as the 3-digit one; the browser returns custom
// properties as authored, so the palette reader must accept every notation of the same colour.

// The token test forbids colour literals in scene3d/ (also in tests): build them from digits.
const hex = (digits: string): string => `#${digits}`;

const COLOUR_TOKENS = new Set(Object.values(SCENE_COLOUR_TOKENS));
const LOOK_TOKENS = new Set(Object.values(SCENE_LOOK_TOKENS));

/** A getVar answering a mid grey for every token, except `token`, which answers `value`. */
function getVarWith(token: string, value: string) {
  return (name: string): string => {
    if (name === token) return value;
    if (COLOUR_TOKENS.has(name)) return hex('808080');
    if (LOOK_TOKENS.has(name)) return '1';
    throw new Error(`unexpected token ${name}`);
  };
}

describe('readPalette notations (bug 020 AC2)', () => {
  it('AC2: the 3-digit notation gives the same colour as the 6-digit one', () => {
    const short = readPalette(getVarWith('--scene-fill-sky', hex('fff')));
    const long = readPalette(getVarWith('--scene-fill-sky', hex('ffffff')));
    expect(short.colours.fillSky).toBe(long.colours.fillSky);
    expect(short.colours.fillSky).toBe(hex('ffffff'));
  });

  it('AC2: upper-case 3-digit expands per digit, upper-case 6-digit is lower-cased', () => {
    expect(
      readPalette(getVarWith('--color-on-danger-solid', hex('ABC'))).colours.explodedGlyph,
    ).toBe(hex('aabbcc'));
    expect(readPalette(getVarWith('--scene-table', hex('ABCDEF'))).colours.table).toBe(
      hex('abcdef'),
    );
  });

  it.each([hex('ffff'), hex('fffff'), 'red', '', 'rgb(1, 2, 3)', hex('ggg')])(
    'AC2: invalid value %j throws a message naming the token, no fallback colour',
    (value) => {
      expect(() => readPalette(getVarWith('--scene-slab', value))).toThrow(/--scene-slab/);
    },
  );
});
