import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseFundResponse } from './fundListParse.mjs';
import { buildFileJson } from './fundListWriter.mjs';
import { run } from './write-fund-list.mjs';

// Story 025, fixture mode. The stored response is the test's INPUT; the expected numbers below are
// written by hand from what that response prints, so the oracle is not the file the parse reads (P16).
// No live request: the request stub throws when called (P17), and the mode is named in every call.

const fund = {
  year: 2028,
  isin: 'IE0008UEVOE0',
  name: 'iBonds EUR Corporate UCITS 2028',
};

/** The record the response prints, written by hand (not computed from the file in the test). */
const HAND_RECORD = {
  year: 2028,
  isin: 'IE0008UEVOE0',
  name: 'iBonds EUR Corporate UCITS 2028',
  navMicroEur: 5677761,
  ytmBp: 376,
  avgMaturityHundredths: 162,
  sharesOutstanding: 191664314,
};

const readFixture = (name) =>
  readFileSync(new URL(`fixtures/fund-list/${name}`, import.meta.url), 'utf8');

const noRequest = () => {
  throw new Error('the request module was reached in fixture mode');
};

describe('fund list writer (fixture mode)', () => {
  it('AC1: the values of one stored response are the values the response prints, and asOf is the run date given', async () => {
    const result = parseFundResponse(readFixture('332876.html'), fund);
    expect(result.ok).toBe(true);
    expect(result.record).toEqual(HAND_RECORD);

    // The run date is an argument, so this is not a clock read (ADR 0014).
    const content = buildFileJson([HAND_RECORD], '2026-11-13');
    expect(content.startsWith('{\n  "asOf": "2026-11-13",\n')).toBe(true);
    expect(JSON.parse(content)).toEqual({ asOf: '2026-11-13', funds: [HAND_RECORD] });
  });

  it('AC2: a missing value, a value that is not a number, a value out of range, and a value with too many decimals each name the fund and the field, and nothing is written', async () => {
    const cases = [
      ['missing-nav.html', 'navMicroEur', 'value missing'],
      ['bad-ytm.html', 'ytmBp', 'not a number: n/a'],
      ['zero-shares.html', 'sharesOutstanding', 'out of range: 0'],
      ['extra-decimals.html', 'navMicroEur', 'more decimals than the field allows (6): 5.6777612'],
    ];
    for (const [file, field, problem] of cases) {
      const result = parseFundResponse(readFixture(file), fund);
      expect(result.ok).toBe(false);
      expect(result.fund?.year).toBe(2028);
      expect(result.field).toBe(field);
      expect(result.problem).toBe(problem);
    }

    // The same failure through the caller: one fund that cannot be read means no content at all, so a run
    // cannot write a partial file (AC2).
    const answer = await run({
      mode: 'fixture',
      runDate: '2026-11-13',
      table: [fund],
      read: () => readFixture('missing-nav.html'),
      request: noRequest,
    });
    expect(answer.content).toBeNull();
    expect(answer.lines).toEqual(['fund 2028 (IE0008UEVOE0): navMicroEur — value missing']);
  });

  it('AC3: fixture mode makes no request, measured with a stub that throws when called', async () => {
    let called = 0;
    const answer = await run({
      mode: 'fixture',
      runDate: '2026-11-13',
      table: [fund],
      read: () => readFixture('332876.html'),
      request: () => {
        called += 1;
        throw new Error('the request module was reached in fixture mode');
      },
    });
    expect(called).toBe(0);
    expect(answer.content).not.toBeNull();
    expect(answer.lines).toEqual(['fund 2028 (IE0008UEVOE0): read']);
  });
});
