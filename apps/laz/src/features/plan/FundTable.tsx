import { useId } from 'react';
import { COPY, overrideCopy, projectionLabel, purchaseReasonText } from './fieldCopy.ts';
import { formatEuro, formatEuroMicroEur, formatShares, fundValueText } from './logic/format.ts';
import type { OverrideField } from './logic/fields.ts';
import type { Fund } from './logic/fund.ts';
import type { FieldError } from './logic/parseInputs.ts';
import { displayPurchaseCents, type PurchaseRow } from './logic/purchase.ts';
import { TextField } from './TextField.tsx';
import styles from './FundTable.module.css';

export interface FundTableProps {
  readonly fundList: readonly Fund[];
  /** Fund year → the projection shown for it, in micro-euro (override value when present). */
  readonly projections: ReadonlyMap<number, number>;
  /** Raw texts as typed, never reformatted; parsed values are derived, not stored (C3). */
  readonly overrides: ReadonlyMap<number, Readonly<Partial<Record<OverrideField, string>>>>;
  /** One error per invalid cell, from the same rules as the amount fields. */
  readonly errors: ReadonlyMap<number, Readonly<Partial<Record<OverrideField, FieldError>>>>;
  /** A cell carries the marker only while its parsed value differs from the data file (AC5). */
  readonly markers: ReadonlyMap<number, Readonly<Partial<Record<OverrideField, boolean>>>>;
  /** AC5: the projection label is the accessible description of every projection figure. */
  readonly asOf: string;
  /** Story 032: the purchase side, one row per fund in the order of the table; null while no result is possible. */
  readonly purchases: readonly PurchaseRow[] | null;
  /** The depot shown, in cents, so the last purchase part comes from the total (AC2). */
  readonly totalCents: number | null;
  readonly onOverrideChange: (field: OverrideField, year: number, raw: string) => void;
}

/** One row per fund year; the NAV and YTM cells are inputs (UX design §1, §2, §5). */
export function FundTable({
  fundList,
  projections,
  overrides,
  errors,
  markers,
  asOf,
  purchases,
  totalCents,
  onOverrideChange,
}: FundTableProps) {
  const headingId = useId();
  const labelId = `${headingId}-projection`;
  // AC2: the shown parts must add up to the shown depot, so the last one is derived from the total.
  const shownCents =
    purchases !== null && totalCents !== null ? displayPurchaseCents(purchases, totalCents) : null;
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId}>{COPY.fundsHeading}</h2>
      <p id={labelId} className={styles.projectionLabel}>
        {projectionLabel(asOf)}
      </p>
      <div
        className={styles.scroller}
        role="region"
        aria-label={COPY.fundScrollerLabel}
        tabIndex={0}
      >
        <table className={styles.table}>
          <caption className={styles.caption}>{COPY.fundCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{COPY.yearColumn}</th>
              <th scope="col">{COPY.navColumn}</th>
              <th scope="col">{COPY.ytmColumn}</th>
              <th scope="col">{COPY.projectionColumn}</th>
              {/* Story 032: the purchase side of the same model (AC1). */}
              <th scope="col">{COPY.sharesColumn}</th>
              <th scope="col">{COPY.purchaseColumn}</th>
            </tr>
          </thead>
          <tbody>
            {fundList.map((fund, index) => {
              const rowOverrides = overrides.get(fund.year) ?? {};
              const rowErrors = errors.get(fund.year) ?? {};
              const rowMarkers = markers.get(fund.year) ?? {};
              const purchase = purchases?.[index] ?? null;
              const cents = shownCents?.[index] ?? null;
              // AC3: no number is invented for a fund outside the phase or for a payout per share of 0.
              // The cell keeps its dash and names why; while there is no result yet the dash stands alone.
              const dash = (row: PurchaseRow): string =>
                row.reason === null
                  ? COPY.missingAmount
                  : `${COPY.missingAmount} ${purchaseReasonText(row.reason)}`;
              return (
                <tr key={fund.year}>
                  <th scope="row">{String(fund.year)}</th>
                  {(['nav', 'ytm'] as const).map((field) => (
                    <td key={field}>
                      <TextField
                        copy={overrideCopy(field, fund.year)}
                        inputId={`${field}-${String(fund.year)}`}
                        value={rowOverrides[field] ?? fundValueText(fund, field)}
                        error={rowErrors[field]}
                        marker={rowMarkers[field] === true ? COPY.marker : undefined}
                        hiddenLabel
                        onChange={(value) => {
                          onOverrideChange(field, fund.year, value);
                        }}
                      />
                    </td>
                  ))}
                  <td>
                    <span className={styles.figure} aria-describedby={labelId}>
                      {formatEuroMicroEur(projections.get(fund.year) ?? 0)}
                    </span>
                  </td>
                  {/* Story 032: the two new columns. The projection label stays the accessible
                      description of the row's figures (024 AC5, 032 AC3). */}
                  <td>
                    <span
                      className={`${styles.figure} ${purchase?.reason ? styles.reason : ''}`}
                      aria-describedby={labelId}
                    >
                      {purchase === null
                        ? COPY.missingAmount
                        : purchase.shares === null
                          ? dash(purchase)
                          : formatShares(purchase.shares)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.figure} ${purchase?.reason ? styles.reason : ''}`}
                      aria-describedby={labelId}
                    >
                      {purchase === null
                        ? COPY.missingAmount
                        : cents === null
                          ? dash(purchase)
                          : formatEuro(cents)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
