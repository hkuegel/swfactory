import { useId } from 'react';
import { COPY, overrideCopy, projectionLabel } from './fieldCopy.ts';
import { formatEuro, fundValueText } from './logic/format.ts';
import type { OverrideField } from './logic/fields.ts';
import type { Fund } from './logic/fund.ts';
import type { FieldError } from './logic/parseInputs.ts';
import { TextField } from './TextField.tsx';
import styles from './FundTable.module.css';

export interface FundTableProps {
  readonly fundList: readonly Fund[];
  /** Fund year → the projection shown for it, in cents (override value when present). */
  readonly projections: ReadonlyMap<number, number>;
  /** Raw texts as typed, never reformatted; parsed values are derived, not stored (C3). */
  readonly overrides: ReadonlyMap<number, Readonly<Partial<Record<OverrideField, string>>>>;
  /** One error per invalid cell, from the same rules as the amount fields. */
  readonly errors: ReadonlyMap<number, Readonly<Partial<Record<OverrideField, FieldError>>>>;
  /** A cell carries the marker only while its parsed value differs from the data file (AC5). */
  readonly markers: ReadonlyMap<number, Readonly<Partial<Record<OverrideField, boolean>>>>;
  /** AC5: the projection label is the accessible description of every projection figure. */
  readonly asOf: string;
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
              <th scope="col">{COPY.navColumn}</th>
              <th scope="col">{COPY.ytmColumn}</th>
              <th scope="col">{COPY.projectionColumn}</th>
            </tr>
          </thead>
          <tbody>
            {fundList.map((fund) => {
              const rowOverrides = overrides.get(fund.year) ?? {};
              const rowErrors = errors.get(fund.year) ?? {};
              const rowMarkers = markers.get(fund.year) ?? {};
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
                      {formatEuro(projections.get(fund.year) ?? 0)}
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
