import { describe, expect, it } from 'vitest';
import { acCount, checkStoryRecord, checkStorySize, sizeOf } from './check-structure.mjs';

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
