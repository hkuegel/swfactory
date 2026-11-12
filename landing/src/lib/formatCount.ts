const COUNT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/**
 * The one number format of the page. The locale is fixed, never the runtime default, so the markup
 * rendered at build time and the hydration render agree.
 */
export function formatCount(value: number): string {
  return COUNT.format(value);
}
