import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseFundResponse } from './fundListParse.mjs';
import { buildFileJson } from './fundListWriter.mjs';
import { FUND_TABLE, run } from './write-fund-list.mjs';

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

/**
 * The two boundary funds of story 035, with the hand values read from their stored responses on
 * 2026-11-14: each field anchor appears once in its own page, so these are the values that page prints.
 */
const HAND_2027 = {
  year: 2027,
  isin: 'IE000ZOI8OK5',
  name: 'iBonds EUR Corporate UCITS 2027',
  navMicroEur: 5663857,
  ytmBp: 337,
  avgMaturityHundredths: 61,
  sharesOutstanding: 162716290,
};

const HAND_2035 = {
  year: 2035,
  isin: 'IE000O1FWAW6',
  name: 'iBonds EUR Corporate UCITS 2035',
  navMicroEur: 4917561,
  ytmBp: 443,
  avgMaturityHundredths: 867,
  sharesOutstanding: 8999331,
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

  it('AC4 of story 036: an empty name or an empty ISIN names the fund and the field and writes nothing', async () => {
    // The rule of story 025 AC2 is not weakened by the columns that read these fields: a row with an empty
    // name or an empty ISIN cannot exist in the committed file.
    const cases = [
      [{ year: 2028, isin: '', name: 'iBonds EUR Corporate UCITS 2028' }, 'isin'],
      [{ year: 2028, isin: 'IE0008UEVOE0', name: '' }, 'name'],
    ];
    for (const [entry, field] of cases) {
      const result = parseFundResponse(readFixture('332876.html'), entry);
      expect(result.ok).toBe(false);
      expect(result.field).toBe(field);
      expect(result.problem).toBe('value missing');
    }

    // Through the caller: nothing is written, so the file cannot gain a row with an empty identity.
    const answer = await run({
      mode: 'fixture',
      runDate: '2026-11-14',
      table: [{ year: 2028, isin: '', name: 'iBonds EUR Corporate UCITS 2028' }],
      read: () => readFixture('332876.html'),
      request: noRequest,
    });
    expect(answer.content).toBeNull();
    expect(answer.lines).toEqual(['fund 2028 (): isin — value missing']);
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

  it('AC2 of story 035: the fund table covers the funding years of the phase boundaries, 2027 through 2035', () => {
    // Hand expectation: nine entries in year order, the two new ones carrying the identifiers the story
    // read from the source on 2026-11-14.
    expect(FUND_TABLE.map((entry) => entry.year)).toEqual([
      2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035,
    ]);
    const boundary = FUND_TABLE.filter((entry) => entry.year === 2027 || entry.year === 2035);
    expect(boundary.map((entry) => `${entry.year} ${entry.isin} ${entry.productId}`)).toEqual([
      '2027 IE000ZOI8OK5 332475',
      '2035 IE000O1FWAW6 344489',
    ]);
  });

  it('the two stored boundary responses parse to the hand values read on 2026-11-14', () => {
    for (const [file, hand] of [
      ['332475.html', HAND_2027],
      ['344489.html', HAND_2035],
    ]) {
      const result = parseFundResponse(readFixture(file), {
        year: hand.year,
        isin: hand.isin,
        name: hand.name,
      });
      expect(result.ok, file).toBe(true);
      expect(result.record, file).toEqual(hand);
    }
  });

  it('AC2 of story 035: a fixture run without a response for one boundary fund names it and writes nothing', async () => {
    const answer = await run({
      mode: 'fixture',
      runDate: '2026-11-14',
      table: [
        { year: 2027, isin: 'IE000ZOI8OK5', name: 'iBonds EUR Corporate UCITS 2027' },
        { year: 2035, isin: 'IE000O1FWAW6', name: 'iBonds EUR Corporate UCITS 2035' },
      ],
      read: (entry) => (entry.year === 2035 ? null : readFixture('332475.html')),
      request: noRequest,
    });
    expect(answer.content).toBeNull();
    expect(answer.lines).toEqual([
      'fund 2027 (IE000ZOI8OK5): read',
      'fund 2035 (IE000O1FWAW6): no stored response in fixture mode',
    ]);
  });

  it('fix of 2026-11-23: a page that prints the YTM as "Average Yield to Maturity" is read like the old label', () => {
    // The shape of the live page of 2026-11-23 (fund 2027), cut down by hand to the four data points;
    // the hand value 3.38 % is 338 basis points.
    const q = (text) => text.replace(/"/g, '&quot;');
    const page = q(
      [
        '{"asOfLabel":"NAV as of","prefix":null,"value":5.667065}',
        '{"label":"Average Yield to Maturity","asOfLabel":"Average Yield to Maturity as of",' +
          '"infoBubble":"Yield to Maturity is the discount rate.","prefix":null,"value":3.38}',
        '{"label":"Weighted Avg Maturity","prefix":null,"value":0.59}',
        '{"label":"Shares Outstanding","prefix":null,"value":164124821}',
      ].join(','),
    );
    const result = parseFundResponse(page, fund);
    expect(result).toEqual({
      ok: true,
      record: {
        ...fund,
        navMicroEur: 5667065,
        ytmBp: 338,
        avgMaturityHundredths: 59,
        sharesOutstanding: 164124821,
      },
    });
  });
});
