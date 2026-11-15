import { describe, expect, it } from 'vitest';
import {
  acCount,
  checkInFlight,
  checkProposalLines,
  checkProposalNumbers,
  checkStoryRecord,
  checkStoryRecordLines,
  checkStorySize,
  checkTimingTag,
  sizeOf,
} from './check-structure.mjs';

// Story 026, fixture mode: stored story texts and the number of problems the rules must report. The
// expectations are written by hand here, not counted by the same parser the rules use (P16), and no
// repository is read and no request is made (P17). App names are placeholders (`x`).

// A `size: S` story that has only the Explanation (AC8).
const S_STORY = `---
id: 26
title: Short
status: done
size: S
---

# 26 - Short

## Explanation

Only the Explanation is required of a size S story.
`;

// The same story text with `size: M`, so the exemption is not "no sections for anyone" (planted
// violation): the sections and the Cost table are required again.
const M_STORY = S_STORY.replace('size: S', 'size: M');

// A Cost table of a size M story whose every row says n/a (AC9).
const COST_ALL_NA = `---
id: 27
title: Short
status: done
size: M
---

# 27 - Short

## Review

Reviewed.

## Explanation

The Cost table must carry data.

## Retrospective

### Cost

| Role | Round | Model | Tokens | Tool uses | Duration |
| --- | --- | --- | --- | --- | --- |
| product-owner | 1 | n/a | n/a | n/a | n/a |
| total (measured) | - | n/a | n/a | n/a | n/a |
| orchestrator (main session) | 1 | n/a | not measured | n/a | n/a |
`;

const COST_MEASURED = COST_ALL_NA.replace(
  '| product-owner | 1 | n/a | n/a | n/a | n/a |',
  '| product-owner | 1 | n/a | 12000 | 14 | 3:20 |',
).replace(
  '| total (measured) | - | n/a | n/a | n/a | n/a |',
  '| total (measured) | - | - | 12000 | 14 | 3:20 |',
);

const COST_WITH_REASON = COST_ALL_NA.replace(
  '| product-owner | 1 | n/a | n/a | n/a | n/a |',
  '| product-owner | 1 | n/a | not measured (subagent counters are not exposed) | n/a | not measured (no run recorded) |',
);

describe('AC8: a size S story needs only the Explanation', () => {
  it('AC8: the S story without Review, Cost table or UX section is accepted', () => {
    expect(checkStoryRecord(S_STORY, 'S', 26)).toEqual([]);
    expect(sizeOf(S_STORY)).toBe('S');
  });

  it('AC8: planted violation - the same text as a size M story is missing its sections', () => {
    // Hand expectation: one problem, the missing sections.
    expect(checkStoryRecord(M_STORY, 'M', 26).length).toBe(1);
  });

  it('AC8: size S means at most three ACs, four ACs is not a small story', () => {
    const four = S_STORY.replace(
      '## Explanation',
      [
        '- **AC1:** one',
        '- **AC2:** two',
        '- **AC3:** three',
        '- **AC4:** four',
        '',
        '## Explanation',
      ].join('\n'),
    );
    // Hand expectation: four ACs, so the size claim is wrong - one problem.
    expect(acCount(four)).toBe(4);
    expect(checkStorySize(four, 26).length).toBe(1);
  });
});

describe('AC9: the Cost table carries data', () => {
  it('AC9: every row saying n/a is a problem from story 026 on', () => {
    // Hand expectation: one problem, the value rule; the table is otherwise correct.
    expect(checkStoryRecord(COST_ALL_NA, 'M', 27).length).toBe(1);
  });

  it('AC9: one measured row makes the same table pass', () => {
    expect(checkStoryRecord(COST_MEASURED, 'M', 27)).toEqual([]);
  });

  it('AC9: a row that says not measured names the reason, which is data', () => {
    expect(checkStoryRecord(COST_WITH_REASON, 'M', 27)).toEqual([]);
  });

  it('AC9: planted violation - the rule does not rewrite the record of an earlier story', () => {
    // Hand expectation: the same all-n/a table of story 022 is read as it was written.
    expect(checkStoryRecord(COST_ALL_NA.replace('id: 27', 'id: 22'), 'M', 22)).toEqual([]);
  });
});

// Rules 7 to 10 (stories 039, 040, 041, 043). Every fixture is the text the rule is given as data (P16);
// nothing here reads the repository (P17). App names are placeholders (`x`).

// Rule 7. A spec with two tests, both comparing pixels or frames, both carrying the tag.
const TAGGED_SPEC = [
  "import { test, expect } from '@playwright/test';",
  '',
  "test('AC1: the swatch paints the token colour', { tag: '@timing' }, async ({ page }) => {",
  '  const png = await innerPixels(page, swatch, 3);',
  '  expect(png.length).toBe(1);',
  '});',
  '',
  "test('AC2: the animation is finished first', { tag: '@timing' }, async ({ page }) => {",
  '  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);',
  '});',
].join('\n');

// The same text without the options: both tests compare pixels or frames (planted violation).
const UNTAGGED_SPEC = TAGGED_SPEC.replace(/\{ tag: '@timing' \}, /g, '');

// A test that only reads the DOM, so the run for a pull request keeps it.
const DOM_ONLY_SPEC = [
  "test('AC3: the error is announced', async ({ page }) => {",
  "  await expect(page.getByRole('alert')).toHaveText('Saved');",
  '});',
].join('\n');

// The same comparison in a helper outside a test: a helper is not a test.
const HELPER_OUTSIDE_TEST = [
  'async function pixels(page) {',
  '  return page.evaluate(() => document.getAnimations().length);',
  '}',
  '',
  "test('AC4: the frame count is read from the DOM', async ({ page }) => {",
  "  expect(await page.getByRole('status').textContent()).toBe('ok');",
  '});',
].join('\n');

// A comment that writes an assertion and names a read: the comment is not an assertion the runner can filter,
// so the body is read with its comment runs replaced by spaces. Without the stripping this fixture answers one
// problem, which is what the test below proves.
const COMMENT_READ_SPEC = [
  "test('AC7: the count is right', async ({ page }) => {",
  '  // expect(innerPixels(page).length) here is a comment, not an assertion',
  '  expect(rows.length).toBe(3);',
  '});',
].join('\n');

// The defect rule 7 had: an apostrophe inside a comment is not a string, and reading it as one would
// swallow the bracket that closes the test call, so the test would not be seen at all.
const COMMENT_APOSTROPHE_SPEC = [
  "test('AC5: the bar is a fill, not an outline', async ({ page }) => {",
  "  // The last bar's centre column is a fill.",
  '  const pixels = await innerPixels(page, png, 0);',
  '  expect(pixels.length).toBeGreaterThan(10);',
  '});',
].join('\n');

// `expect.poll(` is an assertion too: the poll is what machine load moves. The pixels are read into a
// variable and the assertion compares that variable, which is the same comparison.
const POLL_AND_ASSIGNED_SPEC = [
  "test('AC6: the animation is finished before the read', async ({ page }) => {",
  '  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);',
  '  const cloth = await cellPixels(page, flagged);',
  '  expect(cloth.length).toBeGreaterThan(10);',
  '});',
].join('\n');

describe('rule 7 (story 039): a pixel or frame test carries the timing tag', () => {
  it('AC2: the two tagged tests are accepted', () => {
    expect(checkTimingTag('apps/x/e2e/x.spec.ts', TAGGED_SPEC)).toEqual([]);
  });

  it('AC2: planted violation - the same tests without the tag are reported', () => {
    // Hand expectation: two problems, the tests on line 3 and line 8 of the fixture.
    const found = checkTimingTag('apps/x/e2e/x.spec.ts', UNTAGGED_SPEC);
    expect(found.length).toBe(2);
    expect(found.map(([line]) => line)).toEqual([3, 8]);
  });

  it('AC2: a test that only reads the DOM needs no tag', () => {
    expect(checkTimingTag('apps/x/e2e/x.spec.ts', DOM_ONLY_SPEC)).toEqual([]);
  });

  it('AC2: planted violation - a comparison in a helper outside a test is not a test', () => {
    // Hand expectation: the helper is not a `test(` call, so the rule reports nothing.
    expect(checkTimingTag('apps/x/e2e/x.spec.ts', HELPER_OUTSIDE_TEST)).toEqual([]);
    expect(checkTimingTag('apps/x/e2e/x.spec.ts', UNTAGGED_SPEC).length).toBe(2);
  });

  it('rule 7 does not read a comparison written in a comment as an assertion', () => {
    // Hand expectation: nothing. The comment names `expect(` and a pixel read, so without the stripping the rule
    // would report the comment line as an assertion.
    expect(checkTimingTag('apps/x/e2e/x.spec.ts', COMMENT_READ_SPEC)).toEqual([]);
  });

  it('rule 7 does not read an apostrophe in a comment as a string', () => {
    // Hand expectation: one problem, the test on line 1. Before the fix this fixture answered nothing,
    // because the apostrophe in the comment ran to the next one and swallowed the closing bracket.
    expect(checkTimingTag('apps/x/e2e/x.spec.ts', COMMENT_APOSTROPHE_SPEC)).toEqual([
      [
        1,
        "compares pixels or frame timing in an assertion without tag: '@timing' in its own options (rule 7)",
      ],
    ]);
  });

  it('rule 7 reads expect.poll as an assertion, and an assertion on the variable the read wrote', () => {
    // Hand expectation: one problem, the test on line 1, through the poll and through `cloth`.
    expect(checkTimingTag('apps/x/e2e/x.spec.ts', POLL_AND_ASSIGNED_SPEC).length).toBe(1);
    expect(checkTimingTag('apps/x/e2e/x.spec.ts', POLL_AND_ASSIGNED_SPEC)[0][0]).toBe(1);
  });

  it('rule 7 reads only an e2e spec: a unit test file with the same text is out of its scope', () => {
    // Hand expectation: nothing, the rule is a file rule and the path names no e2e spec.
    expect(checkTimingTag('apps/x/src/pixels.test.ts', UNTAGGED_SPEC)).toEqual([]);
    expect(checkTimingTag('apps/x/e2e/x.helpers.ts', UNTAGGED_SPEC)).toEqual([]);
  });
});

// Rule 8 (story 040). A record that reads correctly: the question names its kind, and both decision
// forms are used. Lines: the question is on line 12, the hak answer on 16, the default on 17.
const R8_CLEAN = `---
id: 40
title: Short
status: draft
size: S
---

# 40 - Short

## Open questions

- Q1 — hak: the word "total" — does it include the refund?

## Decision log

- 2026-11-14 — Q: does the column order change? — A: no, keep the table order (hak)
- 2026-11-14 — D: the label is "Total" — reason: the row already sums the parts
`;

// A question that names no kind (planted violation), and a decision line that names no owner.
const R8_NO_KIND = R8_CLEAN.replace(
  '- Q1 — hak: the word "total" — does it include the refund?',
  '- Q1 — hak: the sort order — is it the table order?',
);
const R8_NO_FORM = R8_CLEAN.replace(
  '- 2026-11-14 — D: the label is "Total" — reason: the row already sums the parts',
  '- 2026-11-14 — the label stays as it is',
);
// A hak answer wrapped over two lines: the bullet is one line, so the owner at its end is read (P9).
const R8_WRAPPED = R8_CLEAN.replace(
  '- 2026-11-14 — Q: does the column order change? — A: no, keep the table order (hak)',
  '- 2026-11-14 — Q: is the legend read at gate 2? — A: yes, as an observation\n  (hak)',
);

describe('rule 8 (story 040): the record names whose decision it is', () => {
  it('AC1: a question that names its kind is read as it is written', () => {
    expect(checkStoryRecordLines(R8_CLEAN, 40)).toEqual([]);
  });

  it('AC1: planted violation - a question that names no kind is a problem', () => {
    // Hand expectation: one problem, the question on line 12.
    expect(checkStoryRecordLines(R8_NO_KIND, 40)).toEqual([
      [
        12,
        'open question names no kind (rule 8): need "hak:" + word|data|source|look|irreversible',
      ],
    ]);
  });

  it('AC2: planted violation - a decision line that names no owner is a problem', () => {
    // Hand expectation: one problem, the decision line on line 17.
    expect(checkStoryRecordLines(R8_NO_FORM, 40).length).toBe(1);
    expect(checkStoryRecordLines(R8_NO_FORM, 40)[0][0]).toBe(17);
    // The shape it names is what the check reads; the message names it.
    expect(checkStoryRecordLines(R8_NO_FORM, 40)[0][1]).toContain('need "(hak)" or "reason:"');
  });

  it('AC2: a decision line that names its owner in the acceptance shape is read as it is', () => {
    // Hand expectation: nothing; the bullet spans lines 16 and 17 and is one line.
    expect(checkStoryRecordLines(R8_WRAPPED, 40)).toEqual([]);
  });

  it('AC3: planted violation - a ready story has no open question, so the record is a problem', () => {
    // Hand expectation: one problem, the question on line 12; the question itself names its kind.
    expect(checkStoryRecordLines(R8_CLEAN.replace('status: draft', 'status: ready'), 40)).toEqual([
      [12, 'a ready story has no open question (rule 8)'],
    ]);
  });

  it('rule 8 does not rewrite the record of a story below 040', () => {
    // Hand expectation: the same texts as story 039 answer nothing.
    expect(checkStoryRecordLines(R8_CLEAN.replace('id: 40', 'id: 39'), 39)).toEqual([]);
    expect(checkStoryRecordLines(R8_NO_KIND.replace('id: 40', 'id: 39'), 39)).toEqual([]);
    expect(checkStoryRecordLines(R8_NO_FORM.replace('id: 40', 'id: 39'), 39)).toEqual([]);
  });
});

// Rule 9 (story 041). A Retrospective with the three forms the rule accepts: approved, pending,
// record only. Lines: the proposals are on 12, 13 and 14.
const R9_CLEAN = `---
id: 41
title: Short
status: done
size: S
---

# 41 - Short

## Retrospective

- P36 — a proposal names what it changes — applies to scripts/check-structure.mjs (approved)
- P37 — the tester counts the rows once — applies to .claude/agents/tester.md (pending)
- P38 — the look of the legend is an observation — applies to nothing (record only)
`;

const R9_OTHER = `---
id: 42
title: Short
status: done
size: S
---

# 42 - Short

## Retrospective

- P36 — the reviewer counts the rows twice — applies to .claude/agents/reviewer.md (approved)
`;

describe('rule 9 (story 041): a proposal names what it changes', () => {
  it('AC1: the three accepted forms read as they are written', () => {
    expect(checkProposalLines(R9_CLEAN, 41)).toEqual([]);
  });

  it('AC1: planted violation - a proposal that names nothing it changes is a problem', () => {
    // Hand expectation: one problem, the proposal on line 14.
    expect(checkProposalLines(R9_OTHER.replace('- P36', '- P39'), 41)).toEqual([]);
    const planted = R9_CLEAN.replace(
      '- P38 — the look of the legend is an observation — applies to nothing (record only)',
      '- P38 — the retro is read at gate 2',
    );
    expect(checkProposalLines(planted, 41).length).toBe(1);
    expect(checkProposalLines(planted, 41)[0][0]).toBe(14);
  });

  it('rule 9 reads a wrapped proposal bullet as one line', () => {
    // Hand expectation: nothing. The bullet spans lines 14 and 15, and the file it names is read as part of it.
    const wrapped = R9_CLEAN.replace(
      '- P36 — a proposal names what it changes — applies to scripts/check-structure.mjs (approved)',
      '- P36 — a proposal names what it changes — applies to .claude/agents/tester.md\n  (approved)',
    );
    expect(checkProposalLines(wrapped, 41)).toEqual([]);
    // The same bullet without what it changes reports the line the bullet starts on, not the continuation.
    expect(
      checkProposalLines(wrapped.replace(' — applies to .claude/agents/tester.md', ''), 41),
    ).toEqual([
      [
        12,
        'proposal names nothing it changes (rule 9): need "applies to <file>" or "(record only)"',
      ],
    ]);
  });

  it('rule 9 does not rewrite the record of a story below 041', () => {
    // Hand expectation: the same text as story 040 answers nothing, and its number is not counted.
    expect(checkProposalLines(R9_CLEAN.replace('id: 41', 'id: 40'), 40)).toEqual([]);
    expect(
      checkProposalNumbers([['docs/backlog/040-a.md', R9_CLEAN.replace('id: 41', 'id: 40')]]),
    ).toEqual([]);
  });

  it('AC2: planted violation - the same P number in two stories is a problem', () => {
    // Hand expectation: one problem, the number P36 used by two stories.
    const found = checkProposalNumbers([
      ['docs/backlog/041-a.md', R9_CLEAN],
      ['docs/backlog/042-b.md', R9_OTHER],
    ]);
    expect(found.length).toBe(1);
    expect(found[0][2]).toContain('P36');
    // The same two texts, with the second story below 041, are not compared (hand expectation: none).
    expect(
      checkProposalNumbers([
        ['docs/backlog/041-a.md', R9_CLEAN],
        ['docs/backlog/040-b.md', R9_OTHER.replace('id: 42', 'id: 40')],
      ]),
    ).toEqual([]);
  });
});

// Rule 10 (story 043). It counts every story across the backlogs whatever its number, so the case it
// does not count is a status outside the in-flight set.
describe('rule 10 (story 043): one story is in flight at a time', () => {
  it('AC1: planted violation - two stories in flight are a problem', () => {
    // Hand expectation: one problem naming both stories.
    const found = checkInFlight([
      ['docs/backlog/043-one-story-in-flight-at-a-time.md', 'in-test'],
      ['apps/x/docs/backlog/036-another-story.md', 'in-progress'],
    ]);
    expect(found.length).toBe(1);
    expect(found[0][2]).toContain('in-test');
    expect(found[0][2]).toContain('in-progress');
  });

  it('AC1: one story in flight is not a problem', () => {
    expect(
      checkInFlight([['docs/backlog/043-one-story-in-flight-at-a-time.md', 'in-review']]),
    ).toEqual([]);
  });

  it('AC2: blocked, ready, done, draft and superseded are not in flight', () => {
    // Hand expectation: the five statuses answer nothing, and the same five with `in-test` answer one.
    const notInFlight = [
      ['docs/backlog/034-a.md', 'blocked'],
      ['docs/backlog/035-b.md', 'ready'],
      ['docs/backlog/036-c.md', 'done'],
      ['docs/backlog/037-d.md', 'draft'],
      ['docs/backlog/038-e.md', 'superseded'],
    ];
    expect(checkInFlight(notInFlight)).toEqual([]);
    expect(checkInFlight(notInFlight.map(([p]) => [p, 'in-test'])).length).toBe(1);
  });
});
