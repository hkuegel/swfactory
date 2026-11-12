import { describe, expect, it } from 'vitest';
import { costOfStory, doneStoryLinks } from './figures.ts';

const INDEX = `# Backlog

See [the template](../templates/story.md).

| ID  | App      | Title                                        | Status     |
| --- | -------- | -------------------------------------------- | ---------- |
| 001 | platform | [Login](001-login.md)                        | done       |
| 002 | platform | [Stay signed in](002-stay-signed-in.md)      | draft      |
| 003 | platform | [Old login](003-old-login.md)                | superseded |
| 004 | example  | [A done story](../../x/backlog/004-done.md)  | done       |
| 005 | platform | No link, but done                            | done       |
`;

const fence = '```';
const story = (retrospective: string) => `# 030 – Example

## Implementation notes

### Cost

| Role      | Round | Model | Tokens | Tool uses | Duration |
| --------- | ----- | ----- | ------ | --------- | -------- |
| developer | 1     | opus  | 999    | 9         | 9:09     |

## Retrospective

${retrospective}

## Appendix

| Role      | Round | Model | Tokens | Tool uses | Duration |
| --------- | ----- | ----- | ------ | --------- | -------- |
| tester    | 1     | opus  | 999    | 9         | 9:09     |
`;

const COST_TABLE = `### Cost

| Role                        | Round | Model  | Tokens       | Tool uses | Duration |
| --------------------------- | ----- | ------ | ------------ | --------- | -------- |
| product-owner               | 1     | sonnet | 100          | 3         | 1:02     |
| developer                   | 1     | opus   | n/a          | n/a       | n/a      |
| reviewer                    | 2     | opus   | 250          | 5         | 0:40     |
| **total (measured)**        |       |        | 350          | 8         | 1:42     |
| orchestrator (main session) |       | opus   | not measured |           |          |`;

describe('doneStoryLinks', () => {
  it('AC8: returns the links of the done rows only (draft, superseded and rows without a link are skipped)', () => {
    expect(doneStoryLinks(INDEX)).toEqual(['001-login.md', '../../x/backlog/004-done.md']);
  });
});

describe('costOfStory', () => {
  it('AC8: counts the run rows, also one without a token figure, but not the total and orchestrator rows', () => {
    expect(costOfStory(story(COST_TABLE))).toEqual({ runs: 3 });
  });

  it('AC8: ignores a fenced example table and tables outside the Retrospective', () => {
    const example = `${fence}markdown\n### Cost\n\n| Role | Round |\n| --- | --- |\n| a | 1 |\n| b | 1 |\n| c | 1 |\n| d | 1 |\n${fence}`;
    expect(costOfStory(story(`${example}\n\n${COST_TABLE}`))).toEqual({ runs: 3 });
    // Only the fenced example: no Cost table, although other sections hold tables.
    expect(costOfStory(story(example))).toBeNull();
  });

  it('AC8: a story without a Cost table or without a Retrospective has no figure', () => {
    expect(costOfStory(story('Nothing went wrong.'))).toBeNull();
    expect(
      costOfStory('# 031 – Example\n\n### Cost\n\n| Role |\n| --- |\n| developer |\n'),
    ).toBeNull();
  });

  it('AC8: a table with one run row counts one run (N = 1)', () => {
    const table = `### Cost

| Role                        | Round | Model | Tokens       | Tool uses | Duration |
| --------------------------- | ----- | ----- | ------------ | --------- | -------- |
| developer                   | 1     | opus  | 100          | 3         | 1:02     |
| total (measured)            |       |       | 100          | 3         | 1:02     |
| orchestrator (main session) |       | opus  | not measured |           |          |`;
    expect(costOfStory(story(table))).toEqual({ runs: 1 });
  });
});
