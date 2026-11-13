import { useId } from 'react';
import { COPY } from './fieldCopy.ts';
import { formatEuro, formatMonth } from './logic/format.ts';
import { displayYearCents, type Phase, type Plan } from './logic/phase.ts';
import styles from './YearTable.module.css';

export interface YearTableProps {
  readonly plan: Plan;
  /** For the caption, which names the phase period (UX design §5). */
  readonly phase: Phase;
}

/** One row per phase year; a year without a funding fund shows the missing-year line (UX §2). */
export function YearTable({ plan, phase }: YearTableProps) {
  const headingId = useId();
  const cents = displayYearCents(plan);
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId}>{COPY.yearsHeading}</h2>
      {/* Focusable because it scrolls sideways on narrow screens (UX §1, §4). */}
      <div className={styles.scroller} role="region" aria-label={COPY.scrollerLabel} tabIndex={0}>
        <table className={styles.table}>
          <caption className={styles.caption}>
            {`${COPY.captionPrefix} ${formatMonth(phase.startMonth)} – ${formatMonth(phase.endMonth)}`}
          </caption>
          <thead>
            <tr>
              <th scope="col">{COPY.yearColumn}</th>
              <th scope="col">{COPY.monthsColumn}</th>
              <th scope="col">{COPY.fundingColumn}</th>
              <th scope="col">{COPY.amountColumn}</th>
            </tr>
          </thead>
          <tbody>
            {plan.years.map((row, index) => (
              <tr key={row.year}>
                <th scope="row">{String(row.year)}</th>
                <td>{String(row.months)}</td>
                <td>
                  {row.fundingFund === null ? COPY.missingYear : COPY.fundingLabel(row.fundingFund)}
                </td>
                <td>
                  {row.fundingFund === null ? COPY.missingAmount : formatEuro(cents[index] ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.footnote}>{COPY.footnote}</p>
    </section>
  );
}
