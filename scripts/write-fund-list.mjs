// Story 025 (devops): the fund list writer. Fixture mode is the default (ADR 0014); live mode is reached
// only by an explicit `--mode=live`, from hak's command line or from this story's UI-triggered workflow.
//
//   node scripts/write-fund-list.mjs --run-date=2026-11-13 [--out=<path>] [--mode=fixture|live]
//
// The run reports one line per fund, and it writes nothing when a fund could not be read (AC2), so a CI
// job or a manual run cannot produce a half file.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseFundResponse } from './fundListParse.mjs';
import { buildFileJson } from './fundListWriter.mjs';
import { fetchFundPage } from './fundListSource.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * The fund table: the researched ISINs of story 025's Context, plus the product page id the source
 * needs. The ISINs are not confirmed against hak's depot (open question 2), and only the 2028 page id is
 * measured, so a live run reports the funds it cannot read instead of guessing them.
 */
export const FUND_TABLE = [
  {
    year: 2028,
    isin: 'IE0008UEVOE0',
    name: 'iBonds EUR Corporate UCITS 2028',
    productId: '331717',
  },
  { year: 2029, isin: 'IE000SNLFDR7', name: 'iBonds EUR Corporate UCITS 2029', productId: null },
  { year: 2030, isin: 'IE000Y2BJVK9', name: 'iBonds EUR Corporate UCITS 2030', productId: null },
  { year: 2031, isin: 'IE000D9WMGF0', name: 'iBonds EUR Corporate UCITS 2031', productId: null },
  { year: 2032, isin: 'IE000I660ZF8', name: 'iBonds EUR Corporate UCITS 2032', productId: null },
  { year: 2033, isin: 'IE000ZBGZQM8', name: 'iBonds EUR Corporate UCITS 2033', productId: null },
  { year: 2034, isin: 'IE000UY6XF65', name: 'iBonds EUR Corporate UCITS 2034', productId: null },
];

const labelOf = (fund) => `fund ${String(fund.year)} (${fund.isin})`;

/**
 * One run in the named mode. `read` and `request` are passed in, so a test can run fixture mode with a
 * `request` stub that throws when called (AC3); the run itself never chooses a mode by default.
 * `content` is null when any fund failed, which is what keeps a partial file from being written (AC2).
 */
export async function run({ mode, runDate, table, read, request }) {
  const records = [];
  const lines = [];
  for (const fund of table) {
    let text;
    if (mode === 'fixture') {
      text = read(fund);
      if (text === null) {
        lines.push(`${labelOf(fund)}: no stored response in fixture mode`);
        continue;
      }
    } else {
      const response = await request(fund);
      if (!response.ok) {
        lines.push(`${labelOf(fund)}: ${response.problem}`);
        continue;
      }
      text = response.text;
    }
    const result = parseFundResponse(text, fund);
    if (!result.ok) {
      lines.push(`${labelOf(fund)}: ${result.field} — ${result.problem}`);
      continue;
    }
    records.push(result.record);
    lines.push(`${labelOf(fund)}: read`);
  }
  const content = records.length === table.length ? buildFileJson(records, runDate) : null;
  return { lines, records, content };
}

function argument(name, argv) {
  const entry = argv.find((arg) => arg.startsWith(`--${name}=`));
  return entry ? entry.slice(name.length + 3) : undefined;
}

/** The command line: the mode is named here, in the same words AC3 uses. */
async function main() {
  const argv = process.argv.slice(2);
  const mode = argument('mode', argv) ?? 'fixture';
  const runDate = argument('run-date', argv);
  const out = argument('out', argv);
  const fixturesDir = argument('fixtures', argv) ?? join(ROOT, 'scripts/fixtures/fund-list');
  if (mode !== 'fixture' && mode !== 'live') {
    console.error(`unknown mode ${mode}: use --mode=fixture or --mode=live`);
    return 1;
  }
  if (!runDate) {
    console.error('the run date is an argument, not a clock read: pass --run-date=YYYY-MM-DD');
    return 1;
  }
  if (!out) {
    console.error('the output path is an argument: pass --out=<path>');
    return 1;
  }
  const outPath = out.startsWith('/') || /^[A-Za-z]:/.test(out) ? out : join(ROOT, out);
  const result = await run({
    mode,
    runDate,
    table: FUND_TABLE,
    read: (fund) => {
      const path = join(fixturesDir, `${fund.productId}.html`);
      return existsSync(path) ? readFileSync(path, 'utf8') : null;
    },
    request: async (fund) =>
      fund.productId
        ? await fetchFundPage(fund.productId)
        : { ok: false, problem: 'no product page id for this fund' },
  });
  for (const line of result.lines) {
    console.log(line);
  }
  if (result.content === null) {
    console.error('nothing written: a fund could not be read (AC2)');
    return 1;
  }
  writeFileSync(outPath, result.content);
  console.log(`wrote ${outPath}`);
  return 0;
}

// A module a test imports answers without touching the disk or the network; the scan and the write run
// only when the script is executed directly (story 026).
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  process.exitCode = await main();
}
