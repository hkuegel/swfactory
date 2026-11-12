// Node glue of the landing page (story 021, ADR 0011): reads the repository at build time and hands
// the result to the page as `virtual:landing-data` (vite.config.ts). The parsing rules are the pure
// functions of src/lib/figures.ts.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { costOfStory, doneStoryLinks } from '../src/lib/figures.ts';
import type {
  BacklogFigures,
  CostFigures,
  LandingData,
  PublishedApp,
} from '../src/lib/landingData.ts';

const GIT_TIMEOUT_MS = 5000;

/** Apps = directories of apps/ with a package.json (the rule of scripts/build-pages.mjs). */
function discoverApps(repoRoot: string): PublishedApp[] {
  const appsDir = join(repoRoot, 'apps');
  if (!existsSync(appsDir)) return [];
  return readdirSync(appsDir)
    .filter((name) => existsSync(join(appsDir, name, 'package.json')))
    .sort()
    .map((name) => {
      const html = readFileSync(join(appsDir, name, 'index.html'), 'utf8');
      const title = /<title>([^<]+)<\/title>/.exec(html)?.[1]?.trim();
      if (!title) throw new Error(`landing: no <title> in apps/${name}/index.html`);
      return { name, title };
    });
}

/**
 * Date of the HEAD commit (YYYY-MM-DD): the date of the repository state that is counted, so one
 * commit always yields the same page. `null` without git (e.g. a tarball); git's stderr is ignored.
 */
function headCommitDate(repoRoot: string): string | null {
  try {
    const date = execFileSync('git', ['log', '-1', '--format=%cs'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: GIT_TIMEOUT_MS,
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  } catch {
    return null;
  }
}

/** Counted from the backlog index and the Cost tables of its done stories; `null` = no source. */
function backlogFigures(repoRoot: string): {
  readonly backlog: BacklogFigures | null;
  readonly cost: CostFigures | null;
} {
  const indexPath = join(repoRoot, 'docs', 'backlog', 'README.md');
  if (!existsSync(indexPath)) return { backlog: null, cost: null };
  const links = doneStoryLinks(readFileSync(indexPath, 'utf8'));
  const costs = links.flatMap((link) => {
    const story = resolve(dirname(indexPath), decodeURI(link));
    if (!existsSync(story))
      throw new Error(`landing: story "${link}" of the backlog index not found`);
    return costOfStory(readFileSync(story, 'utf8')) ?? [];
  });
  return {
    backlog: { storiesDone: links.length },
    cost:
      costs.length === 0 ? null : { agentRuns: costs.reduce((sum, cost) => sum + cost.runs, 0) },
  };
}

export function loadLandingData(repoRoot: string): LandingData {
  return {
    apps: discoverApps(repoRoot),
    asOf: headCommitDate(repoRoot),
    ...backlogFigures(repoRoot),
  };
}
