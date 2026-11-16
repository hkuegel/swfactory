import { useId } from 'react';
import { columnLabel, COPY } from './fieldCopy.ts';
import { formatEuro, formatMonth } from './logic/format.ts';
import type { Statement } from './logic/ledger.ts';
import type { Phase } from './logic/phase.ts';
import styles from './StatementTable.module.css';

export interface StatementTableProps {
  /** The account statement, one row per calendar year (story 048 AC3). */
  readonly statement: Statement;
  /** For the caption, which names the phase period. */
  readonly phase: Phase;
}

/** A flow without an amount in this row is a dash; the balances always show their figure. */
function flowText(cents: number): string {
  return cents === 0 ? COPY.missingAmount : formatEuro(cents);
}

/**
 * The account statement: start + all flows = end in every row, outflows negative. A column with no amount
 * anywhere in the plan is not shown (AC3), and the year is the row header. A test reads a cell by its
 * header text, never by position (CLAUDE.md).
 */
export function StatementTable({ statement, phase }: StatementTableProps) {
  const headingId = useId();
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId}>{COPY.yearsHeading}</h2>
      {/* Focusable because it scrolls sideways on narrow screens. */}
      <div className={styles.scroller} role="region" aria-label={COPY.scrollerLabel} tabIndex={0}>
        <table className={styles.table}>
          <caption className={styles.caption}>
            {`${COPY.captionPrefix} ${formatMonth(phase.startMonth)} – ${formatMonth(phase.endMonth)}`}
          </caption>
          <thead>
            <tr>
              <th scope="col">{COPY.yearColumn}</th>
              <th scope="col">{COPY.startColumn}</th>
              {statement.columns.map((column) => (
                <th scope="col" key={column}>
                  {columnLabel(column)}
                </th>
              ))}
              <th scope="col">{COPY.endColumn}</th>
            </tr>
          </thead>
          <tbody>
            {statement.rows.map((row) => (
              <tr key={row.year}>
                <th scope="row">{String(row.year)}</th>
                <td>{formatEuro(row.start)}</td>
                {statement.columns.map((column) => (
                  <td key={column}>{flowText(row.flows[column])}</td>
                ))}
                <td>{formatEuro(row.end)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.footnote}>{COPY.statementNote}</p>
    </section>
  );
}
