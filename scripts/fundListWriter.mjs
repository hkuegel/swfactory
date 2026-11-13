// Story 025 (devops): the write part of the fund list writer - records plus the run date give the file
// content as a string. No clock is read here: the run date is an argument, which is what makes AC1's
// asOf measurable without controlling time (ADR 0013 as amended by this story).

/** Key order of the committed file (ADR 0013): asOf for the whole file, then the funds by year. */
const KEY_ORDER = [
  'year',
  'isin',
  'name',
  'navMicroEur',
  'ytmBp',
  'avgMaturityHundredths',
  'sharesOutstanding',
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Records + run date -> the file content in the shape ADR 0013 fixes. */
export function buildFileJson(records, runDate) {
  if (!ISO_DATE.test(runDate)) {
    throw new Error(`run date is not an ISO calendar date: ${runDate}`);
  }
  const funds = [...records].sort((a, b) => a.year - b.year);
  if (funds.length === 0) {
    throw new Error('no fund record to write');
  }
  const rows = funds.map((record) =>
    Object.fromEntries(KEY_ORDER.map((key) => [key, record[key]])),
  );
  return `${JSON.stringify({ asOf: runDate, funds: rows }, null, 2)}\n`;
}
