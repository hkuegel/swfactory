import { useId } from 'react';
import {
  COPY,
  overrideCopy,
  projectionLabel,
  purchaseReasonText,
  TAX_OFF_TEXT,
} from './fieldCopy.ts';
import { formatEuro, formatEuroMicroEur, formatShares, fundValueText } from './logic/format.ts';
import type { OverrideField } from './logic/fields.ts';
import type { Fund } from './logic/fund.ts';
import type { FieldError } from './logic/parseInputs.ts';
import type { FundFigures } from './logic/ledger.ts';
import type { PurchaseRow } from './logic/purchase.ts';
import { TextField } from './TextField.tsx';
import styles from './FundTable.module.css';

export interface FundTableProps {
  readonly fundList: readonly Fund[];
  /** Fund year → the pre-tax projection shown for it, in micro-euro (override value when present). */
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
  /** Story 048 AC4: the way to the gain per fund, rounded once, the same Einstand and Erlös figures the
   * statement shows; null while no result is possible, and a null entry for a fund that is not bought. */
  readonly figures: readonly (FundFigures | null)[] | null;
  /** The Kapitalertragsteuer checkbox: the bases and the taxable gain exist only in the tax case. */
  readonly taxOn: boolean;
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
  figures,
  taxOn,
  onOverrideChange,
}: FundTableProps) {
  const headingId = useId();
  const labelId = `${headingId}-projection`;
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
              {/* Story 036 (AC1): the order is one order for the whole table, and the row header stays the
                  year (hak's gate 1 answer of 2026-11-14), so these two are cells, not the header. */}
              <th scope="col">{COPY.nameColumn}</th>
              <th scope="col">{COPY.isinColumn}</th>
              <th scope="col">{COPY.navColumn}</th>
              <th scope="col">{COPY.ytmColumn}</th>
              <th scope="col">{COPY.projectionColumn}</th>
              {/* Story 048 AC4: the way to the gain, in the order of the calculation. No tax amount here
                  (047 AC1 holds): the tax of a fund is read in the statement. */}
              <th scope="col">{COPY.sharesColumn}</th>
              <th scope="col">{COPY.einstandColumn}</th>
              <th scope="col">{COPY.proceedsGrossColumn}</th>
              <th scope="col">{COPY.gainColumn}</th>
              <th scope="col">{COPY.basesColumn}</th>
              <th scope="col">{COPY.taxableGainColumn}</th>
            </tr>
          </thead>
          <tbody>
            {fundList.map((fund, index) => {
              const rowOverrides = overrides.get(fund.year) ?? {};
              const rowErrors = errors.get(fund.year) ?? {};
              const rowMarkers = markers.get(fund.year) ?? {};
              const purchase = purchases?.[index] ?? null;
              const figure = figures?.[index] ?? null;
              // AC3: no number is invented for a fund outside the phase or for a payout per share of 0.
              // The cell keeps its dash and names why; while there is no result yet the dash stands alone.
              const dash = (row: PurchaseRow, taxCase = false): string =>
                row.reason === null
                  ? taxCase
                    ? `${COPY.missingAmount} ${TAX_OFF_TEXT}`
                    : COPY.missingAmount
                  : `${COPY.missingAmount} ${purchaseReasonText(row.reason)}`;
              // One cell of the way to the gain: the figure, or the dash with the reason it has none.
              const cell = (
                text: (entry: FundFigures) => string | null,
                taxCase = false,
              ): string => {
                if (purchase === null) return COPY.missingAmount;
                const shown = figure === null ? null : text(figure);
                return shown === null ? dash(purchase, taxCase) : shown;
              };
              return (
                <tr key={fund.year}>
                  <th scope="row">{String(fund.year)}</th>
                  {/* Story 036 AC1, AC2: the name and the ISIN as the data file stores them, with nothing
                      formatted for them. They are cells, not the row header, and not figures, so the
                      projection label does not describe them. */}
                  <td className={styles.identity}>{fund.name}</td>
                  <td className={styles.identity}>{fund.isin}</td>
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
                  {/* Story 047 AC1: the per-share figure is the pre-tax proceeds, so the tax of this fund is
                      read in the year table, and the projection label stays its description (024 AC5). */}
                  <td>
                    <span className={styles.figure} aria-describedby={labelId}>
                      {formatEuroMicroEur(projections.get(fund.year) ?? 0)}
                    </span>
                  </td>
                  {(
                    [
                      ['shares', (entry: FundFigures) => formatShares(entry.shares), false],
                      ['einstand', (entry: FundFigures) => formatEuro(entry.einstandCents), false],
                      ['proceeds', (entry: FundFigures) => formatEuro(entry.proceedsCents), false],
                      ['gain', (entry: FundFigures) => formatEuro(entry.gainCents), false],
                      [
                        'bases',
                        (entry: FundFigures) => (taxOn ? formatEuro(entry.basesCents) : null),
                        true,
                      ],
                      [
                        'taxable',
                        (entry: FundFigures) => (taxOn ? formatEuro(entry.taxableGainCents) : null),
                        true,
                      ],
                    ] as const
                  ).map(([key, text, taxCase]) => (
                    <td key={key}>
                      <span
                        className={`${styles.figure} ${purchase?.reason ? styles.reason : ''}`}
                        aria-describedby={labelId}
                      >
                        {cell(text, taxCase)}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Story 044: the rule the input cells used to repeat in every cell is stated once here, below the
          table. It is not an input's description, so the description of an override cell stays the marker
          alone (024 AC5). */}
      <p className={styles.footnote}>{COPY.fundFootnote}</p>
    </section>
  );
}
