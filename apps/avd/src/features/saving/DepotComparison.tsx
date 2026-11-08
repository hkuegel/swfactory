import { useId } from 'react';
import { ASSUMPTION, comparisonNote, payoutSentence, verdict } from './comparisonCopy.ts';
import type { Comparison } from './logic/compare.ts';
import { formatEuro } from './logic/format.ts';
import styles from './DepotComparison.module.css';

export interface DepotComparisonProps {
  readonly comparison: Comparison;
  readonly payoutAge: number;
  /** The note names the Pauschbetrag state (AC11, AC12). */
  readonly allowance: boolean;
}

type RowKind = 'plain' | 'sub' | 'yield';

interface Row {
  readonly label: string;
  readonly cents: number;
  readonly kind: RowKind;
}

const ROW_CLASS: Readonly<Record<RowKind, string | undefined>> = {
  plain: styles.row,
  sub: `${styles.row} ${styles.sub}`,
  yield: `${styles.row} ${styles.yield}`,
};

/** One depot's figures: `dt` then `dd` per row (UX §6). */
function figureList(rows: readonly Row[]) {
  return (
    <dl className={styles.rows}>
      {rows.map((row) => (
        <div key={row.label} className={ROW_CLASS[row.kind]}>
          <dt>{row.label}</dt>
          <dd>{formatEuro(row.cents)}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The comparison of the Altersvorsorgedepot with a normal ETF depot (story 016, AC1–AC12, UX §1,
 * §2): payout period, one figure list per depot, the Variante-A assumption at the AVD block, the
 * difference with its wording and the comparison note. Rendered only for a valid result.
 */
export function DepotComparison({ comparison, payoutAge, allowance }: DepotComparisonProps) {
  const id = useId();
  const headingId = `${id}-heading`;
  const avdId = `${id}-avd`;
  const etfId = `${id}-etf`;
  const { avd, etf, differenceCents } = comparison;
  const avdRows: readonly Row[] = [
    { label: 'Depotwert bei Auszahlungsbeginn', cents: avd.depotCents, kind: 'plain' },
    { label: 'Steuern gesamt', cents: avd.taxCents, kind: 'plain' },
    { label: 'Ausgezahlt nach allen Steuern', cents: avd.netPayoutsCents, kind: 'plain' },
    {
      label: 'Netto-Auszahlung pro Monat (Durchschnitt)',
      cents: avd.monthlyNetCents,
      kind: 'plain',
    },
    { label: 'Eigene Beiträge', cents: avd.ownContributionsCents, kind: 'plain' },
    { label: 'Steuererstattung außerhalb des Depots', cents: avd.keptRefundsCents, kind: 'plain' },
    { label: 'Ertrag nach Steuer', cents: avd.yieldCents, kind: 'yield' },
  ];
  const etfRows: readonly Row[] = [
    { label: 'Depotwert bei Auszahlungsbeginn', cents: etf.depotCents, kind: 'plain' },
    { label: 'Steuern gesamt', cents: etf.taxCents, kind: 'plain' },
    { label: 'Davon in der Ansparphase', cents: etf.savingPhaseTaxCents, kind: 'sub' },
    { label: 'Ausgezahlt nach allen Steuern', cents: etf.netPayoutsCents, kind: 'plain' },
    {
      label: 'Netto-Auszahlung pro Monat (Durchschnitt)',
      cents: etf.monthlyNetCents,
      kind: 'plain',
    },
    { label: 'Eigene Beiträge', cents: etf.ownContributionsCents, kind: 'plain' },
    { label: 'Ertrag nach Steuer', cents: etf.yieldCents, kind: 'yield' },
  ];
  return (
    <section className={styles.comparison} aria-labelledby={headingId}>
      <h2 id={headingId}>Vergleich mit einem ETF-Depot</h2>
      <p className={styles.payout}>{payoutSentence(payoutAge, comparison.payoutMonths)}</p>
      <p className={styles.lead}>
        Verglichen wird, was nach allen Steuern über die eigenen Einzahlungen hinaus ausgezahlt
        wird. Beim Altersvorsorgedepot zählt die Erstattung des Finanzamts dazu, soweit sie nicht
        ins Depot floss.
      </p>
      <div className={styles.blocks}>
        <div className={styles.block} role="group" aria-labelledby={avdId}>
          <h3 id={avdId} className={styles.blockHeading}>
            Altersvorsorgedepot (AVD)
          </h3>
          {figureList(avdRows)}
          <p className={styles.assumption}>{ASSUMPTION}</p>
        </div>
        <div className={styles.block} role="group" aria-labelledby={etfId}>
          <h3 id={etfId} className={styles.blockHeading}>
            ETF-Depot
          </h3>
          {figureList(etfRows)}
        </div>
      </div>
      <div className={styles.difference}>
        <dl className={styles.rows}>
          <div className={styles.differenceRow}>
            <dt>Unterschied (AVD minus ETF)</dt>
            <dd>{formatEuro(differenceCents)}</dd>
          </div>
        </dl>
        <p className={styles.verdict}>{verdict(differenceCents)}</p>
      </div>
      <p className={styles.note}>{comparisonNote(allowance)}</p>
    </section>
  );
}
