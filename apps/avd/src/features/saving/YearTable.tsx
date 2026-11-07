import { useId } from 'react';
import { formatEuro } from './logic/format.ts';
import type { YearRow } from './logic/project.ts';
import styles from './YearTable.module.css';

export interface YearTableProps {
  readonly rows: readonly YearRow[];
}

/** One row per saving year, cumulative (AC5); the text equivalent of the chart. */
export function YearTable({ rows }: YearTableProps) {
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
        <table className={styles.table}>
          <caption className={styles.caption}>Entwicklung pro Sparjahr, kumuliert</caption>
          <thead>
            <tr>
              <th scope="col">Jahr</th>
              <th scope="col">Alter</th>
              <th scope="col">Eigene Beiträge</th>
              <th scope="col">Zulagen gutgeschrieben</th>
              <th scope="col">Erträge</th>
              <th scope="col">Kontostand am Jahresende</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.year}>
                <th scope="row">{row.year}</th>
                <td>{row.age}</td>
                <td>{formatEuro(row.contributionsCents)}</td>
                <td>{formatEuro(row.zulagenCents)}</td>
                <td>{formatEuro(row.returnsCents)}</td>
                <td>{formatEuro(row.balanceCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.footnote}>
        Zulagen eines Jahres werden im Folgejahr gutgeschrieben. Die letzte Zulage ist im Endwert
        enthalten, ohne weitere Erträge.
      </p>
    </section>
  );
}
