// The only money and rate formatting of the app (ADR 0007). German format, `€` after a no-break space.
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

/** Rates in copy: `(0.26375, 3)` → `26,375 %`, `(0.032, 2)` → `3,20 %` (fixed decimals, normal space). */
export function formatPercent(fraction: number, decimals: number): string {
  const number = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(fraction * 100);
  return `${number} %`;
}
