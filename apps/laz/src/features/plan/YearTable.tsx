import { useId } from 'react';
import { COPY, parkReasonText, parkTaxReasonText } from './fieldCopy.ts';
import { formatEuro, formatMonth } from './logic/format.ts';
import {
  displayParkCents,
  displayYearCents,
  parkSumsCents,
  type ParkCents,
  type Phase,
  type Plan,
  type ParkReason,
  type ParkTaxReason,
} from './logic/phase.ts';
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
  // Story 046 AC4: the two new last columns. Each is a single rounding, so the sum line below is exactly the
  // sum of the figures shown in the column, and each column reads its own reason, because the interest
  // column can show a figure while the tax column shows a dash.
  const park = displayParkCents(plan);
  const sums = parkSumsCents(park);
  // A cell with a reason is the dash and the reason for it, read as the full line text (UX §2).
  const parkCell = (reason: ParkReason | null, centsShown: number | null): string =>
    reason === null
      ? formatEuro(centsShown ?? 0)
      : `${COPY.missingAmount} ${parkReasonText(reason)}`;
  const parkTaxCell = (reason: ParkTaxReason | null, centsShown: number | null): string =>
    reason === null
      ? formatEuro(centsShown ?? 0)
      : `${COPY.missingAmount} ${parkTaxReasonText(reason)}`;
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
              {/* Story 046 AC4: the interest the parked money earns and the tax on it. A test reads a new
                  cell by its header text, never by position (CLAUDE.md). */}
              <th scope="col">{COPY.parkColumn}</th>
              <th scope="col">{COPY.parkTaxColumn}</th>
            </tr>
          </thead>
          <tbody>
            {plan.years.map((row, index) => {
              const shown: ParkCents = park[index] ?? { interestCents: null, taxCents: null };
              return (
                <tr key={row.year}>
                  <th scope="row">{String(row.year)}</th>
                  <td>{String(row.months)}</td>
                  <td>
                    {row.fundingFund === null
                      ? COPY.missingYear
                      : COPY.fundingLabel(row.fundingFund)}
                  </td>
                  <td>
                    {row.fundingFund === null ? COPY.missingAmount : formatEuro(cents[index] ?? 0)}
                  </td>
                  {/* The year table's figures carry no projection description: the parked interest is the
                      model's own assumption, not a value from the data file (024 AC5, ADR 0012). */}
                  <td className={row.parkReason === null ? undefined : styles.reason}>
                    {parkCell(row.parkReason, shown.interestCents)}
                  </td>
                  <td className={row.parkTaxReason === null ? undefined : styles.reason}>
                    {parkTaxCell(row.parkTaxReason, shown.taxCents)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Story 046 AC4: the sums the year section states once, as paragraph text below the table, before the
          footnote, and nothing invented for an empty sum (the display rule story 045 records); the second
          sentence belongs to the string only when a row has a tax figure. The facts paragraph stays while the
          section is mounted, because it states the rule and not a figure. */}
      {sums !== null && (
        <p className={styles.footnote}>
          {COPY.parkSumLine(
            formatEuro(sums.interestCents),
            sums.taxCents === null ? undefined : formatEuro(sums.taxCents),
          )}
        </p>
      )}
      <p className={styles.footnote}>{COPY.parkFacts}</p>
      <p className={styles.footnote}>{COPY.footnote}</p>
    </section>
  );
}
