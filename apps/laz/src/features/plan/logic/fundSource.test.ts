import { describe, expect, it } from 'vitest';
import { fundSourceFor } from './fundSource.ts';

// Story 025, the CI round (hak, 2026-11-14): the names a run is given decide which fund data it reads.
// The expectation here is written by hand, not read from the config that calls this function, so the test
// is an oracle and not a copy of its own source (P16). No environment read, no request, no clock (P17).

describe('the fund data source a run names (story 025, CI round, ADR 0014)', () => {
  it('a run that names nothing reads the stored fixture copy', () => {
    // Hand expectation: `local` is the mode of a test run, `fixture` is its data, so a refresh of the
    // committed file cannot move an oracle (AC4).
    expect(fundSourceFor({})).toEqual({ mode: 'local', fund: 'fixture' });
  });

  it('CI names both, and the names CI gives are the same answer as the defaults', () => {
    // Hand expectation: the CI checks step sets `VITE_TEST_MODE=local` and `LAZ_FUND=fixture`, so the app
    // test that reads the fixture copy is read with the source named, not with a default.
    expect(fundSourceFor({ mode: 'local', fund: 'fixture' })).toEqual({
      mode: 'local',
      fund: 'fixture',
    });
  });

  it('the committed file can be named, and then the run reads the file the writer wrote', () => {
    // Hand expectation: `committed` is the writer's file; the fixture alias does not apply to it, which is
    // what the live comparison step reads (hak's step after the publish).
    expect(fundSourceFor({ mode: 'local', fund: 'committed' })).toEqual({
      mode: 'local',
      fund: 'committed',
    });
  });

  it('a test run cannot name the live source', () => {
    // Hand expectation: `live` is the mode of the writer run only. A test run that read the live source
    // could not have a hand oracle, and CI would depend on the site staying readable (AC3).
    expect(() => fundSourceFor({ mode: 'live', fund: 'fixture' })).toThrow(
      'a test run cannot read the live source',
    );
  });

  it('an unknown data source is named as an error, not answered with a default', () => {
    // Hand expectation: a name that is not one of the two sources must not silently choose one of them.
    expect(() => fundSourceFor({ fund: 'depot' })).toThrow('unknown fund data source "depot"');
    expect(() => fundSourceFor({ mode: 'production' })).toThrow('unknown test mode "production"');
  });
});
