// Story 025 (devops): the parse part of the fund list writer. It is a separate file on purpose, so the
// "fixture mode makes no request" assertion can be measured on this module alone (ADR 0014): this file
// never imports the request module and never reads a clock.
//
// The response is read with targeted patterns over the stored bytes, anchored to the label the page
// prints, not with an HTML parser. Values are converted by string arithmetic, so no float parsing
// happens anywhere (ADR 0012 keeps the single rounding at display).

/** The four values the app needs, with the label (a regex fragment) the response carries for each. */
export const FIELDS = [
  { key: 'asOfLabel', label: 'NAV as of', field: 'navMicroEur', decimals: 6 },
  // The fund pages renamed the YTM label to "Average Yield to Maturity" around 2026-11-20; the value
  // behind it is the same. Both labels are accepted (fix of 2026-11-23).
  {
    key: 'label',
    label: '(?:Weighted Average YTM|Average Yield to Maturity)',
    field: 'ytmBp',
    decimals: 2,
  },
  { key: 'label', label: 'Weighted Avg Maturity', field: 'avgMaturityHundredths', decimals: 2 },
  { key: 'label', label: 'Shares Outstanding', field: 'sharesOutstanding', decimals: 0 },
];

/**
 * What the schema allows per field (ADR 0013): integers in the field's unit. A YTM can be negative, so
 * its range is symmetric; a NAV, a maturity and a share count must be positive.
 */
export const BOUNDS = {
  navMicroEur: { min: 1, max: 200_000_000_000 },
  ytmBp: { min: -10_000, max: 10_000 },
  avgMaturityHundredths: { min: 1, max: 1_000 },
  sharesOutstanding: { min: 1, max: 1_000_000_000_000 },
};

const QUOTE = '&quot;';

/** The number the response carries for one field, as text, or `null` when it is not there. */
function rawValue(text, field) {
  const pattern = new RegExp(
    `${QUOTE}${field.key}${QUOTE}:${QUOTE}${field.label}${QUOTE}[\\s\\S]{0,900}?${QUOTE}value${QUOTE}:([^,}]+)`,
  );
  const match = pattern.exec(text);
  if (!match) return null;
  return match[1]?.replace(new RegExp(QUOTE, 'g'), '').trim() ?? null;
}

/** Text already known to be a number -> integer in the field's unit, by string arithmetic. */
export function toUnits(text, decimals) {
  const normalized = text.replace(/−/g, '-');
  const negative = normalized.startsWith('-');
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole = '', fraction = ''] = unsigned.split('.');
  const scale = decimals === 0 ? 1 : 10 ** decimals;
  const magnitude =
    Number(whole === '' ? '0' : whole) * scale +
    (decimals === 0 ? 0 : Number(fraction.padEnd(decimals, '0')));
  return negative && magnitude !== 0 ? -magnitude : magnitude;
}

/**
 * One stored response -> one fund record. The fund identity (year, ISIN, name) comes from the fund
 * table, not from the response, so the parse answers only the four values. One failure names the fund
 * and the field and returns no record, which is what keeps a run from writing a partial file (AC2).
 */
export function parseFundResponse(text, fund) {
  // Story 036 AC4: the identity fields are what the fund table shows, so an empty name or an empty ISIN
  // cannot reach the committed file. They come from the fund table, not from the response, and the rule is
  // the same as for the four values: one failure names the fund and the field and returns no record.
  for (const field of ['isin', 'name']) {
    if (fund[field] === undefined || fund[field] === '') {
      return { ok: false, fund, field, problem: 'value missing' };
    }
  }
  const record = {
    year: fund.year,
    isin: fund.isin,
    name: fund.name,
  };
  for (const field of FIELDS) {
    const raw = rawValue(text, field);
    if (raw === null || raw === '' || raw === 'null') {
      return { ok: false, fund, field: field.field, problem: 'value missing' };
    }
    if (!/^-?\d+(\.\d+)?$/.test(raw)) {
      return { ok: false, fund, field: field.field, problem: `not a number: ${raw}` };
    }
    // The record is an integer in the field's unit, so a value with more decimals than that unit cannot be
    // read: converting it by string arithmetic would silently add the extra digits (defect found 2026-11-13,
    // 5.1234567 read as 6234567 with six decimals).
    const fraction = raw.replace(/−/g, '-').replace(/^-/, '').split('.')[1] ?? '';
    if (fraction.length > field.decimals) {
      return {
        ok: false,
        fund,
        field: field.field,
        problem: `more decimals than the field allows (${field.decimals}): ${raw}`,
      };
    }
    const value = toUnits(raw, field.decimals);
    const bounds = BOUNDS[field.field] ?? { min: 0, max: 0 };
    if (value < bounds.min || value > bounds.max) {
      return { ok: false, fund, field: field.field, problem: `out of range: ${value}` };
    }
    record[field.field] = value;
  }
  return { ok: true, record };
}
