import { formatEuro } from './logic/format.ts';
import type { CentsRange } from './logic/schedule.ts';
import styles from './PerYearValue.module.css';

export interface PerYearValueProps {
  /** The 013/014 single value: shown unless `range` holds different years. */
  readonly singleCents: number;
  /** Story 015 while checked: the values over the years of UX §2; null otherwise. */
  readonly range: CentsRange | null;
}

/** A "per year" figure: one amount, or `{min} bis {max}` with a sub-line (015, UX §2). */
export function PerYearValue({ singleCents, range }: PerYearValueProps) {
  if (range === null) return formatEuro(singleCents);
  if (range.min === range.max) return formatEuro(range.min);
  return (
    <>
      {`${formatEuro(range.min)} bis ${formatEuro(range.max)}`}
      <span className={styles.subLine}>je Jahr verschieden, wegen der Wiederanlage</span>
    </>
  );
}
