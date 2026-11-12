/// <reference lib="dom" />
import { expect, type Locator, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { SITE_DIR } from '@swfactory/platform/config/pages';

// Shared by every spec of the landing page's published-build checks (story 021).

const REPO_ROOT = new URL('../../', import.meta.url).pathname;

// ---- The pipeline as the story describes it (UX design §2), independent of src/content.ts --------

export interface OracleStep {
  readonly label: string;
  readonly role: string;
  readonly output: string;
  readonly gate: boolean;
}

export const STEPS: readonly OracleStep[] = [
  {
    label: 'Story',
    role: 'Product owner',
    output: 'Idea becomes acceptance criteria',
    gate: false,
  },
  { label: 'Gate 1', role: 'Sponsor (human)', output: 'Approves the story', gate: true },
  {
    label: 'Design',
    role: 'Architect, UX designer',
    output: 'Technical and UX design',
    gate: false,
  },
  { label: 'Build', role: 'Developer', output: 'Code and unit tests', gate: false },
  { label: 'Test', role: 'Tester', output: 'Proof for every criterion', gate: false },
  { label: 'Review', role: 'Reviewer', output: 'Checklist verdict', gate: false },
  { label: 'Docs', role: 'Tech writer', output: 'README and changelog', gate: false },
  { label: 'Retro', role: 'Orchestrator', output: 'Explanation and rule proposals', gate: false },
  {
    label: 'Gate 2',
    role: 'Sponsor (human)',
    output: 'Approves result and rule changes',
    gate: true,
  },
];

/** A step shown as plain text: it starts with its label (exactly, not as a prefix), then role and output. */
export async function expectStepAsText(item: Locator, step: OracleStep) {
  await expect(item).toBeVisible();
  await expect(item).toHaveText(new RegExp(`^\\s*${step.label}\\s`));
  await expect(item).toContainText(step.role);
  await expect(item).toContainText(step.output);
}

// ---- Words ------------------------------------------------------------------------------------------

/** Words of the whole page and of every section with a level-2 heading (`innerText`, `\S+` runs). */
export async function pageWords(page: Page) {
  return page.evaluate(() => {
    const count = (text: string) => (text.match(/\S+/g) ?? []).length;
    return {
      total: count(document.body.innerText),
      sections: [...document.querySelectorAll('section')]
        .filter((section) => section.querySelector('h2') !== null)
        .map((section) => ({
          id: section.id,
          heading: section.querySelector('h2')?.textContent ?? '',
          words: count((section as HTMLElement).innerText),
        })),
    };
  });
}

// ---- Banned strings ---------------------------------------------------------------------------------

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  auml: 'ä',
  ouml: 'ö',
  uuml: 'ü',
  Auml: 'Ä',
  Ouml: 'Ö',
  Uuml: 'Ü',
  szlig: 'ß',
};

/** HTML entities (`&#252;`, `&#xFC;`, `&uuml;`) and JS escapes (`ü`, `\u{fc}`, `\xfc`) decoded. */
export function decodeEscapes(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (whole, name: string) => NAMED_ENTITIES[name] ?? whole)
    .replace(/\\u\{([0-9a-f]+)\}/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\u([0-9a-f]{4})/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\x([0-9a-f]{2})/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .normalize('NFC');
}

/** Everything AC4 and the Context forbid anywhere on the page (whole words, any case). */
export const BANNED_EVERYWHERE = ['firstwaters', 'harald', 'kügel', 'hak'];

/**
 * Client-related names that must not appear on the page. The repository is public, so the plain
 * words are deliberately not stored here: only the SHA-256 (hex) of each lower-cased word. Hashes of
 * short words merely keep the names out of plain-text search; they are not secret.
 */
export const BANNED_HASHED: readonly { label: string; sha256: string }[] = [
  {
    label: 'client-internal name 1',
    sha256: '1063854bbf5155bcf9fe8cf9b578d0e33f20823f6703aee5463bc88a41f8f9a4',
  },
  {
    label: 'client-internal name 2',
    sha256: '42029ef215256f8fa9fedb53542ee6553eef76027b116f8fac5346211b1e473c',
  },
  {
    label: 'client-internal name 3',
    sha256: '22879e7c4d1c3a6b431e68c9a4e9831710e0b9ec6250dc205f0e8bc40aec6d44',
  },
];

/** Additionally forbidden in the visible text: nothing may imply an Impressum or a privacy page. */
export const BANNED_IN_TEXT = ['impressum', 'imprint', 'privacy', 'datenschutz', 'legal notice'];

const sha256 = (word: string) => createHash('sha256').update(word).digest('hex');

/**
 * The banned entries that occur in `text` after decoding: plain `words` (whole words, any case)
 * and, for `hashed`, every word token (letters and digits, case-folded) whose SHA-256 is listed.
 * Hashed hits are reported by their neutral label. `hkuegel` (the repository URL) matches none.
 */
export function bannedHits(
  text: string,
  words: readonly string[],
  hashed: readonly { label: string; sha256: string }[] = [],
): string[] {
  const decoded = decodeEscapes(text);
  const plain = words.filter((word) =>
    new RegExp(`(?<![\\p{L}\\p{N}])${word.replace(/ /g, '\\s+')}(?![\\p{L}\\p{N}])`, 'iu').test(
      decoded,
    ),
  );
  const hashes = new Set(
    (decoded.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).map((token) => sha256(token)),
  );
  return [...plain, ...hashed.filter((entry) => hashes.has(entry.sha256)).map((e) => e.label)];
}

/** Every file of the root unit of `_site`: `index.html` and everything below `_landing/`. */
export function rootUnitFiles(): { path: string; text: string }[] {
  const files = ['index.html'];
  const walk = (dir: string) => {
    for (const entry of readdirSync(`${SITE_DIR}/${dir}`, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else files.push(path);
    }
  };
  walk('_landing');
  return files.map((path) => ({ path, text: readFileSync(`${SITE_DIR}/${path}`, 'utf8') }));
}

// ---- Figures: an oracle that shares no code with landing/src/lib/figures.ts -------------------------

function storyFiles(): string[] {
  const files: string[] = [];
  const add = (dir: string) => {
    for (const name of readdirSync(dir))
      if (/^\d{3}-.*\.md$/.test(name)) files.push(`${dir}/${name}`);
  };
  add(`${REPO_ROOT}docs/backlog`);
  for (const app of readdirSync(`${REPO_ROOT}apps`)) {
    try {
      add(`${REPO_ROOT}apps/${app}/docs/backlog`);
    } catch {
      /* an app without a backlog */
    }
  }
  return files;
}

/**
 * Stories whose frontmatter says `status: done`, and the agent runs of their Cost tables: the table
 * after the LAST `### Cost` heading (the Retrospective is the last section; earlier mentions are
 * examples in fences), without header, separator, `total` and `orchestrator` rows.
 */
export function repoFigures(): { storiesDone: number; agentRuns: number } {
  let storiesDone = 0;
  let agentRuns = 0;
  for (const file of storyFiles()) {
    const text = readFileSync(file, 'utf8');
    const front = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? '';
    if (!/^status:\s*done\b/m.test(front)) continue;
    storiesDone += 1;
    const at = text.lastIndexOf('\n### Cost');
    if (at < 0) continue;
    const rows: string[] = [];
    for (const line of text
      .slice(at + 1)
      .split('\n')
      .slice(1)) {
      if (line.startsWith('|')) rows.push(line);
      else if (rows.length > 0) break;
    }
    agentRuns += rows.slice(2).filter((row) => !/^\|\s*(total|orchestrator)/i.test(row)).length;
  }
  if (storiesDone === 0 || agentRuns === 0)
    throw new Error('figures oracle found nothing: vacuous');
  return { storiesDone, agentRuns };
}

/** Date of the HEAD commit, YYYY-MM-DD. */
export function headCommitDate(): string {
  return execFileSync('git', ['log', '-1', '--format=%cs'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  }).trim();
}

// ---- Animations and pixels --------------------------------------------------------------------------

/** Waits until the page runs no CSS animation or transition (computed styles are then final). */
export async function settled(page: Page) {
  // poll through evaluate: waitForFunction does not run in a page without scripts
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
}

/**
 * Pixels whose channels differ by more than `tolerance` between two PNGs (base64).
 * Measured noise of two screenshots of an idle page: 0 pixels at tolerance 8.
 */
export async function differingPixels(page: Page, a: Buffer, b: Buffer, tolerance = 8) {
  return page.evaluate(
    async ([x, y, tol]) => {
      const load = async (data: string) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (ctx === null) throw new Error('no 2d context');
        ctx.drawImage(image, 0, 0);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
      };
      const p = await load(String(x));
      const q = await load(String(y));
      if (p.width !== q.width || p.height !== q.height) return Number.POSITIVE_INFINITY;
      let n = 0;
      for (let i = 0; i < p.data.length; i += 4) {
        for (let k = 0; k < 3; k += 1) {
          if (Math.abs((p.data[i + k] ?? 0) - (q.data[i + k] ?? 0)) > Number(tol)) {
            n += 1;
            break;
          }
        }
      }
      return n;
    },
    [a.toString('base64'), b.toString('base64'), tolerance] as const,
  );
}
