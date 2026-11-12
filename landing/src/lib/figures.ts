// Pure parsers of the figures the page derives from the backlog (story 021, AC8). No file access:
// build/landingData.ts reads the files. The rules are those of scripts/check-structure.mjs.

/** Cells of a markdown table row, without the outer pipes. */
function cellsOf(row: string): readonly string[] {
  return row
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());
}

/** Markdown with every fenced code block blanked (an example table in a fence is no table). */
function stripFences(markdown: string): string {
  return markdown.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, (block) =>
    block.replace(/[^\n]/g, ' '),
  );
}

/**
 * Link targets (as written, relative to the index) of the rows of the backlog index whose status,
 * the last cell, is `done`. Rows without a story link are skipped.
 */
export function doneStoryLinks(indexMarkdown: string): readonly string[] {
  return indexMarkdown.split('\n').flatMap((row) => {
    const link = /\]\(\s*<?([^)\s>#]+\.md)/.exec(row)?.[1];
    if (link === undefined || !row.trim().startsWith('|')) return [];
    return cellsOf(row).at(-1) === 'done' ? [link] : [];
  });
}

/**
 * The agent runs of one story: the rows of the first table after `### Cost` inside
 * `## Retrospective`, without header, separator, the `total …` row and the
 * `orchestrator (main session)` row. `null` when the story has no such table.
 */
export function costOfStory(storyMarkdown: string): { readonly runs: number } | null {
  const text = stripFences(storyMarkdown);
  const retro = /^## Retrospective[ \t]*$/m.exec(text);
  if (retro === null) return null;
  const rest = text.slice(retro.index + retro[0].length);
  const lines = rest.slice(0, /^## /m.exec(rest)?.index ?? rest.length).split('\n');
  const costAt = lines.findIndex((line) => line.trim() === '### Cost');
  if (costAt < 0) return null;
  const tableStart = lines.findIndex((line, i) => i > costAt && line.trim().startsWith('|'));
  if (tableStart < 0) return null;
  const tableEnd = lines.findIndex((line, i) => i > tableStart && !line.trim().startsWith('|'));
  const rows = lines.slice(tableStart + 2, tableEnd < 0 ? lines.length : tableEnd);
  const runs = rows.filter((row) => {
    const label = (cellsOf(row)[0] ?? '').replace(/[*_]/g, '').trim();
    return !/^total/i.test(label) && !/^orchestrator \(main session\)/i.test(label);
  });
  return { runs: runs.length };
}
