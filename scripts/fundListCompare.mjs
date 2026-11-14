// Story 025, the CI round (hak, 2026-11-14): the comparison a `--frozen` run reports. A frozen run writes
// nothing, so the difference is the whole result of the run, and each difference names the fund, the
// field, the committed value and the new value. Pure: the committed text and the produced records as data,
// no disk read, no clock, no request (P17).
//
// `fits` is hak's "wenn das Ergebnis nicht passt". The fields a refresh must not move are the fund
// identity: the year, the ISIN and the name, which are the funds confirmed against hak's depot. A market
// value may move, because a move is what a refresh run is for, so a value difference is reported but does
// not make the result not fit. The file-level asOf is the run date (ADR 0013) and every run date differs
// from the previous one, so a comparison never names it.

export const IDENTITY_FIELDS = Object.freeze(['year', 'isin', 'name']);
export const VALUE_FIELDS = Object.freeze([
  'navMicroEur',
  'ytmBp',
  'avgMaturityHundredths',
  'sharesOutstanding',
]);

const labelOf = (fund) => `fund ${String(fund.year)} (${fund.isin})`;

/**
 * The fund is named as the committed file names it, because the committed file is what the reader wants to
 * know the difference against. A fund the committed file does not have is named as this run read it.
 */
const labelFor = (committed, record) => labelOf(committed ?? record);

/** One difference as the run reports it. `kind` is `identity` (the result does not fit) or `value`. */
export function compareCommitted(committedText, records) {
  let file;
  try {
    file = JSON.parse(committedText);
  } catch {
    return [
      {
        fund: 'committed file',
        field: 'file',
        committed: 'not readable as the fund list',
        produced: 'the produced table',
        kind: 'identity',
      },
    ];
  }

  const committedFunds = Array.isArray(file?.funds) ? file.funds : [];
  const byYear = new Map();
  for (const fund of committedFunds) {
    if (fund !== null && typeof fund === 'object') byYear.set(fund.year, fund);
  }

  const out = [];
  const producedYears = new Set();
  for (const record of records) {
    producedYears.add(record.year);
    const committed = byYear.get(record.year);
    if (committed === undefined) {
      out.push({
        fund: labelFor(undefined, record),
        field: 'fund',
        committed: 'not in the committed file',
        produced: 'read by this run',
        kind: 'identity',
      });
      continue;
    }
    for (const field of [...IDENTITY_FIELDS, ...VALUE_FIELDS]) {
      if (committed[field] !== record[field]) {
        out.push({
          fund: labelFor(committed, record),
          field,
          committed: String(committed[field]),
          produced: String(record[field]),
          kind: IDENTITY_FIELDS.includes(field) ? 'identity' : 'value',
        });
      }
    }
  }
  for (const [year, fund] of byYear) {
    if (!producedYears.has(year)) {
      out.push({
        fund: labelOf(fund),
        field: 'fund',
        committed: 'in the committed file',
        produced: 'not read by this run',
        kind: 'identity',
      });
    }
  }
  return out.sort((a, b) => a.fund.localeCompare(b.fund) || a.field.localeCompare(b.field));
}

/** Hak's "passt": a run that writes may only write a table whose fund identity matches the committed file. */
export function fits(differences) {
  return differences.every((difference) => difference.kind === 'value');
}

/** How one difference is printed by a run. */
export function differenceText(difference) {
  return `${difference.fund}: ${difference.field} — committed ${difference.committed}, new ${difference.produced} (${difference.kind})`;
}
