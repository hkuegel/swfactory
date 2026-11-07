import { useId } from 'react';
import { formatEuro } from './logic/format.ts';
import type { YearRow } from './logic/project.ts';
import styles from './YearTable.module.css';

export interface YearTableProps {
  readonly rows: readonly YearRow[];
  /** Tax refund per saving year (story 014), same length as rows; not cumulative. */
  readonly refundsCents: readonly number[];
  /** Story 015: show the cumulative reinvested refund as a depot column. */
  readonly reinvest: boolean;
}

/**
 * One row per saving year, cumulative (013 AC5); the text equivalent of the chart, plus the
 * non-cumulative tax refund per year in the last column (014 AC5) and, while the refund is
 * reinvested, its cumulative depot column before "Erträge" (015 AC4).
 */
export function YearTable({ rows, refundsCents, reinvest }: YearTableProps) {
  const headingId = useId();
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId}>Jahrestabelle</h2>
      {/* Focusable because it scrolls horizontally on narrow screens (keyboard scrolling). */}
      <div
        className={styles.scroller}
        role="region"
        aria-label="Jahrestabelle, horizontal scrollbar"
        tabIndex={0}
      >
        <table className={reinvest ? `${styles.table} ${styles.reinvest}` : styles.table}>
          <caption className={styles.caption}>
            Entwicklung pro Sparjahr, kumuliert; Steuererstattung je Jahr
          </caption>
          <thead>
            <tr>
              <th scope="col">Jahr</th>
              <th scope="col">Alter</th>
              <th scope="col">Eigene Beiträge</th>
              <th scope="col">Zulagen gutgeschrieben</th>
              {reinvest && <th scope="col">Wieder angelegt</th>}
              <th scope="col">Erträge</th>
              <th scope="col">Kontostand am Jahresende</th>
              <th scope="col" className={styles.refund}>
                Steuererstattung
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.year}>
                <th scope="row">{row.year}</th>
                <td>{row.age}</td>
                <td>{formatEuro(row.contributionsCents)}</td>
                <td>{formatEuro(row.zulagenCents)}</td>
                {reinvest && <td>{formatEuro(row.reinvestedCents)}</td>}
                <td>{formatEuro(row.returnsCents)}</td>
                <td>{formatEuro(row.balanceCents)}</td>
                <td className={styles.refund}>{formatEuro(refundsCents[i] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.footnote}>
        Zulagen eines Jahres werden im Folgejahr gutgeschrieben. Die letzte Zulage ist im Endwert
        enthalten, ohne weitere Erträge.{' '}
        {reinvest
          ? 'Die Steuererstattung eines Jahres wird am 1. Januar des Folgejahres eingezahlt und steht dann kumuliert in der Spalte zur Wiederanlage und im Kontostand; die Spalte Steuererstattung zeigt sie im Jahr des Beitrags, nicht kumuliert.'
          : 'Die Steuererstattung steht im Jahr des Beitrags, ist nicht kumuliert und nicht im Kontostand enthalten.'}
      </p>
    </section>
  );
}
