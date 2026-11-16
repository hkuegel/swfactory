import { useId } from 'react';
import { cashflowReasonText, columnLabel, COPY } from './fieldCopy.ts';
import { formatEuro, formatMonth } from './logic/format.ts';
import { SUM_COLUMNS, type CashflowCell, type CashflowTable } from './logic/cashflow.ts';
import type { Phase } from './logic/phase.ts';
import styles from './YearTable.module.css';

export interface YearTableProps {
  /** The rows and the sums as the money rule reads them (story 047 AC2, AC3). */
  readonly cashflow: CashflowTable;
  /** For the caption, which names the phase period (UX design §5). */
  readonly phase: Phase;
}

/** One row per phase year; a year without a funding fund shows the missing-year line (UX §2). */
export function YearTable({ cashflow, phase }: YearTableProps) {
  const headingId = useId();
  // AC4: a cell with a reason is the dash and the reason for it, read as the full line text (UX §2), and
  // each column reads its own reason, because one row can show a figure in one column and a dash with
  // another reason in another. `Betrag für das Jahr` keeps its plain dash for a year without a fund,
  // because its reason is the funding cell's line as 024 AC4 has it.
  const cellText = (cell: CashflowCell): string =>
    cell.cents !== null
      ? formatEuro(cell.cents)
      : cell.reason === null
        ? COPY.missingAmount
        : `${COPY.missingAmount} ${cashflowReasonText(cell.reason)}`;
  const noRowLines = cashflow.flatFigures.filter((figure) => figure.cell === 'flatNoRowLine');
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
              {/* Story 047 AC2: one column per cashflow, in the order the UX design names them. A test reads
                  a cell by its header text, never by position (CLAUDE.md). */}
              {SUM_COLUMNS.map((column) => (
                <th scope="col" key={column}>
                  {columnLabel(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cashflow.rows.map((row) => (
              <tr key={row.year}>
                <th scope="row">{String(row.year)}</th>
                <td>{String(row.months)}</td>
                <td>
                  {row.fundingFund === null ? COPY.missingYear : COPY.fundingLabel(row.fundingFund)}
                </td>
                {/* The year table's figures carry no projection description: they are the model's own money,
                    not a value from the data file (024 AC5, ADR 0012). */}
                {SUM_COLUMNS.map((column) => {
                  const cell = row.cells[column] ?? { cents: null, reason: null };
                  return (
                    <td key={column} className={cell.reason === null ? undefined : styles.reason}>
                      {cellText(cell)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* AC3 and the UX design: the paragraphs below the table, outside the scrolling wrapper, so they stay
          on screen while the table scrolls sideways. The reader line first, then one sum line per money
          column in the column order, then the two totals, then the line for a fund whose sale year is not a
          phase year, then the three notes, then the existing facts and footnote. Nothing is invented for an
          empty sum (the display rule story 045 records). */}
      <p className={styles.footnote}>{COPY.readerLine}</p>
      <p className={styles.footnote}>{COPY.payoutCheck}</p>
      {SUM_COLUMNS.map((column) => {
        const sum = cashflow.columnSums[column];
        return sum === null ? null : (
          <p className={styles.footnote} key={column}>
            {COPY.columnSumLine(columnLabel(column), formatEuro(sum))}
          </p>
        );
      })}
      {cashflow.taxTotalCents !== null && (
        <p className={styles.footnote}>{COPY.taxTotalLine(formatEuro(cashflow.taxTotalCents))}</p>
      )}
      {cashflow.cashTotalCents !== null && (
        <p className={styles.footnote}>{COPY.cashTotalLine(formatEuro(cashflow.cashTotalCents))}</p>
      )}
      {noRowLines.map((figure) => (
        <p className={styles.footnote} key={figure.fundYear}>
          {COPY.flatNoRowLine(figure.fundYear, formatEuro(figure.cents))}
        </p>
      ))}
      <p className={styles.footnote}>{COPY.flatNote}</p>
      <p className={styles.footnote}>{COPY.netNote}</p>
      <p className={styles.footnote}>{COPY.parkedNote}</p>
      <p className={styles.footnote}>{COPY.parkFacts}</p>
      <p className={styles.footnote}>{COPY.footnote}</p>
    </section>
  );
}
