import { useId } from 'react';
import { formatEuro } from './logic/format.ts';
import type { TaxRefund } from './logic/taxRefund.ts';
import styles from './TaxRefundGroup.module.css';

export interface TaxRefundGroupProps {
  readonly refund: TaxRefund;
  /** Show the year-1 row (only with the Berufseinsteigerbonus, like "Zulage im 1. Jahr"). */
  readonly hasBonus: boolean;
}

/** The tax refund and net own contributions, outside the depot figures (story 014, AC2). */
export function TaxRefundGroup({ refund, hasBonus }: TaxRefundGroupProps) {
  const headingId = useId();
  return (
    <section className={styles.group} aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.heading}>
        Vom Finanzamt erstattet, nicht im Depot
      </h3>
      <p className={styles.muted}>
        Diese Beträge gehören nicht zum Depot und sind nicht im Endwert enthalten.
      </p>
      <dl className={styles.rows}>
        <div className={styles.row}>
          <dt>Steuererstattung pro Sparjahr</dt>
          <dd>{formatEuro(refund.perYearCents)}</dd>
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
        <div className={`${styles.row} ${styles.net}`}>
          <dt>Eigene Beiträge nach Erstattung</dt>
          <dd>{formatEuro(refund.netContributionsCents)}</dd>
        </div>
      </dl>
      {refund.totalCents === 0 && (
        <p className={styles.muted}>Keine zusätzliche Steuererstattung bei diesen Eingaben.</p>
      )}
    </section>
  );
}
