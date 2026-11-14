// Story 025 (devops): the fund list writer. Fixture mode is the default (ADR 0014); live mode is reached
// only by an explicit `--mode=live`, from hak's command line or from this story's UI-triggered workflow.
//
//   node scripts/write-fund-list.mjs --run-date=2026-11-13 [--out=<path>] [--mode=fixture|live]
//                                    [--full | --frozen]
//
// The run reports one line per fund, and it writes nothing when a fund could not be read (AC2), so a CI
// job or a manual run cannot produce a half file.
//
// Hak's rule of 2026-11-14 (the CI round): `--full` writes the whole table from all funds, `--frozen`
// writes nothing and compares its result with the committed file, naming each difference. A `--full` run
// that cannot produce a fitting result behaves as `--frozen`: it writes nothing and names the differences,
// so CI can never commit a file its own checks would contradict. `--full` is required for a run that
// writes; an accidental run without a write mode is refused rather than allowed to overwrite.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compareCommitted, differenceText, fits } from './fundListCompare.mjs';
import { parseFundResponse } from './fundListParse.mjs';
import { buildFileJson } from './fundListWriter.mjs';
import { fetchFundPage } from './fundListSource.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * The fund table: the researched ISINs of story 025's Context, plus the product page id the source
 * The fund table: hak's answer of 2026-11-13 is the accumulating share class for every fund, and each
 * accumulating ISIN resolves to the product page id stored as a response, so a live run can read all seven.
 */
export const FUND_TABLE = [
  {
    year: 2028,
    isin: 'IE0008UEVOE0',
    name: 'iBonds EUR Corporate UCITS 2028',
    productId: '332876',
  },
  {
    year: 2029,
    isin: 'IE000SNLFDR7',
    name: 'iBonds EUR Corporate UCITS 2029',
    productId: '338575',
  },
  {
    year: 2030,
    isin: 'IE000Y2BJVK9',
    name: 'iBonds EUR Corporate UCITS 2030',
    productId: '338576',
  },
  {
    year: 2031,
    isin: 'IE000D9WMGF0',
    name: 'iBonds EUR Corporate UCITS 2031',
    productId: '339093',
  },
  {
    year: 2032,
    isin: 'IE000I660ZF8',
    name: 'iBonds EUR Corporate UCITS 2032',
    productId: '339174',
  },
  {
    year: 2033,
    isin: 'IE000ZBGZQM8',
    name: 'iBonds EUR Corporate UCITS 2033',
    productId: '339299',
  },
  {
    year: 2034,
    isin: 'IE000UY6XF65',
    name: 'iBonds EUR Corporate UCITS 2034',
    productId: '339290',
  },
];

const labelOf = (fund) => `fund ${String(fund.year)} (${fund.isin})`;

/**
 * The write gate (hak, 2026-11-14). A run may put a record into the file only when it runs as a full run;
 * a frozen run reports and never writes. The gate is a function so its guard test can call it, and the run
 * below reads it instead of deciding inline.
 */
export function acceptsRecord(mode) {
  return mode === 'full';
}

/**
 * One run in the named mode. `read` and `request` are passed in, so a test can run fixture mode with a
 * `request` stub that throws when called (AC3); the run itself never chooses a mode by default.
 * `content` is null when any fund failed, which is what keeps a partial file from being written (AC2).
 * `committed` is the text of the file the run compares with (the frozen mode has no file to write to);
 * `differences` and `fits` are the comparison of the produced table with that text.
 */
export async function run({ mode, write, runDate, table, read, request, committed }) {
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
  const differences =
    committed === null || committed === undefined ? [] : compareCommitted(committed, records);
  return { lines, records, content, differences, fits: fits(differences) };
}

function argument(name, argv) {
  const entry = argv.find((arg) => arg.startsWith(`--${name}=`));
  return entry ? entry.slice(name.length + 3) : undefined;
}

const flagOf = (name, argv) => argv.includes(`--${name}`);

/** The command line: the mode is named here, in the same words AC3 uses. */
async function main() {
  const argv = process.argv.slice(2);
  const mode = argument('mode', argv) ?? 'fixture';
  const write = flagOf('full', argv) ? 'full' : flagOf('frozen', argv) ? 'frozen' : null;
  const runDate = argument('run-date', argv);
  const out = argument('out', argv);
  const fixturesDir = argument('fixtures', argv) ?? join(ROOT, 'scripts/fixtures/fund-list');
  if (mode !== 'fixture' && mode !== 'live') {
    console.error(`unknown mode ${mode}: use --mode=fixture or --mode=live`);
    return 1;
  }
  if (write === null) {
    console.error(
      'the run needs a write mode: --full writes the whole table, --frozen compares and writes nothing',
    );
    return 1;
  }
  if (flagOf('full', argv) && flagOf('frozen', argv)) {
    console.error('one write mode at a time: --full or --frozen');
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
  if (write === 'frozen' && !existsSync(outPath)) {
    console.error(`nothing to compare with: no committed file at ${outPath}`);
    return 1;
  }
  const result = await run({
    mode,
    write,
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
    committed: existsSync(outPath) ? readFileSync(outPath, 'utf8') : null,
  });
  for (const line of result.lines) {
    console.log(line);
  }
  for (const difference of result.differences) {
    console.log(differenceText(difference));
  }
  if (result.content === null) {
    console.error('nothing written: a fund could not be read (AC2)');
    return 1;
  }
  if (!result.fits) {
    console.error(
      `nothing written: the result does not fit the committed file (${result.differences.length} identity difference(s))`,
    );
    return 1;
  }
  if (!acceptsRecord(write)) {
    console.log(`compared, nothing written (write mode ${write})`);
    return 0;
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
