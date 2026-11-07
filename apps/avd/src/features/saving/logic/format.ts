// The only money formatting of the app (ADR 0007). German format, `€` after a no-break space.
const EURO = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const WHOLE_EURO = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** `2225644` → `22.256,44 €`; negative values with a leading `-`. */
export function formatEuro(cents: number): string {
  return EURO.format(cents / 100);
}

/** Axis labels: `2000000` → `20.000 €`. */
export function formatWholeEuro(cents: number): string {
  return WHOLE_EURO.format(cents / 100);
}
