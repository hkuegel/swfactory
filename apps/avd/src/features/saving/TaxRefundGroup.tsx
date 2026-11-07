import { useId } from 'react';
import { formatEuro } from './logic/format.ts';
import { perYearRange } from './logic/schedule.ts';
import type { TaxRefund } from './logic/taxRefund.ts';
import { PerYearValue } from './PerYearValue.tsx';
import styles from './TaxRefundGroup.module.css';

export interface TaxRefundGroupProps {
  readonly refund: TaxRefund;
  /** Show the year-1 row (only with the Berufseinsteigerbonus, like "Zulage im 1. Jahr"). */
  readonly hasBonus: boolean;
  /** Story 015: the refund is reinvested (checked copy, per-year range, no net row). */
  readonly reinvest: boolean;
}

/**
 * The tax refund and net own contributions, outside the depot figures (story 014, AC2); while
 * the refund is reinvested (015) the checked copy and no net row (decision 2f).
 */
export function TaxRefundGroup({ refund, hasBonus, reinvest }: TaxRefundGroupProps) {
  const headingId = useId();
  const perYear = reinvest ? perYearRange(refund.byYearCents, hasBonus) : null;
  // A range is wider than one amount: its row may put the value under the label (015, UX §7).
  const varies = perYear !== null && perYear.min !== perYear.max;
  return (
    <section className={styles.group} aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.heading}>
        {reinvest
          ? 'Vom Finanzamt erstattet, teils wieder angelegt'
          : 'Vom Finanzamt erstattet, nicht im Depot'}
      </h3>
      <p className={styles.muted}>
        {reinvest
          ? 'Das Finanzamt zahlt diese Beträge an die steuerpflichtige Person aus. Die Erstattung eines Sparjahres wird im Folgejahr ins Depot eingezahlt, soweit die Beitragsgrenze es zulässt; die Erstattung des letzten Sparjahres bleibt bei der steuerpflichtigen Person.'
          : 'Diese Beträge gehören nicht zum Depot und sind nicht im Endwert enthalten.'}
      </p>
      <dl className={styles.rows}>
        <div className={varies ? `${styles.row} ${styles.wraps}` : styles.row}>
          <dt>Steuererstattung pro Sparjahr</dt>
          <dd>
            <PerYearValue singleCents={refund.perYearCents} range={perYear} />
          </dd>
        </div>
        {hasBonus && (
          <div className={styles.row}>
            <dt>Steuererstattung im 1. Sparjahr</dt>
            <dd>{formatEuro(refund.firstYearCents)}</dd>
          </div>
        )}
        <div className={styles.row}>
          <dt>Steuererstattung gesamt</dt>
          <dd>{formatEuro(refund.totalCents)}</dd>
        </div>
        {!reinvest && (
          <div className={`${styles.row} ${styles.net}`}>
            <dt>Eigene Beiträge nach Erstattung</dt>
            <dd>{formatEuro(refund.netContributionsCents)}</dd>
          </div>
        )}
      </dl>
      {refund.totalCents === 0 && (
        <p className={styles.muted}>Keine zusätzliche Steuererstattung bei diesen Eingaben.</p>
      )}
    </section>
  );
}
