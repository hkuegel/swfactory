// @vitest-environment node
// The builders resolve paths from `import.meta.url`, so this test runs in the node environment.
import { describe, expect, it } from 'vitest';
import { createAppPlaywrightConfig } from './playwright.ts';
import { createPagesPlaywrightConfig } from './playwright.pages.ts';

// Story 039, AC1: the config is measured as the object built from data (P16), and the expectations
// below are hand values, not the expression the builders use. The tag is data here, so nothing names
// an app or a group of tests.

describe('story 039 AC1: the tag to exclude is data', () => {
  it('AC1: a set skipTag answers grepInvert with that tag and an unset skipTag answers no filter', () => {
    // Hand expectation for both config builders: the timing tag as a regular expression, which is
    // what Playwright matches against the test title with its tags.
    expect(
      createAppPlaywrightConfig({
        title: 'Check',
        signedInContent: { role: 'region', name: 'Check content' },
        skipTag: '@timing',
      }).grepInvert,
    ).toEqual(/@timing/);
    expect(createPagesPlaywrightConfig({ skipTag: '@timing' }).grepInvert).toEqual(/@timing/);

    // Hand expectation for the run that is not filtered: the config answers no filter at all.
    expect(
      createAppPlaywrightConfig({
        title: 'Check',
        signedInContent: { role: 'region', name: 'Check content' },
      }).grepInvert,
    ).toBeUndefined();
    expect(createPagesPlaywrightConfig({ skipTag: undefined }).grepInvert).toBeUndefined();
  });
});
