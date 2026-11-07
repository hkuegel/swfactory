import { useId } from 'react';
import { ErrorIcon } from './ErrorIcon.tsx';
import { formatEuro, formatWholeEuro } from './logic/format.ts';
import type { Projection } from './logic/project.ts';
import { CONTRIBUTION_CAP_CENTS, perYearRange } from './logic/schedule.ts';
import type { TaxRefund } from './logic/taxRefund.ts';
import { PerYearValue } from './PerYearValue.tsx';
import { TaxRefundGroup } from './TaxRefundGroup.tsx';
import styles from './ResultSummary.module.css';

export interface ResultSummaryProps {
  /** null: show the "no result" hint (AC6). */
  readonly projection: Projection | null;
  /** null together with projection. */
  readonly refund: TaxRefund | null;
  readonly payoutAge: number | null;
  /** Text of the polite live region (AC7); empty until the first edit. */
  readonly liveText: string;
  /** Story 015: the refund is reinvested (fifth depot figure, checked copy). */
  readonly reinvest: boolean;
}

const NOTE_START =
  'Hinweis: Die Zahlen sind Modellrechnungen auf Grundlage der eingegebenen Annahmen, keine ' +
  'Anlage- oder Steuerberatung. Es wird angenommen, dass der Anspruch auf die staatliche Zulage ' +
  'besteht. Beträge sind nominal, ohne Inflation. Die Steuererstattung ist vereinfacht mit einem ' +
  'über alle Sparjahre gleichbleibenden Grenzsteuersatz einschließlich Soli und Kirchensteuer ' +
  'berechnet. Das Finanzamt zahlt sie an die steuerpflichtige Person aus, etwa ein Jahr nach ' +
  'dem Beitrag';

/** 014/AC8, unchanged while unchecked. */
const NOTE = `${NOTE_START}; sie wird nicht im Depot gutgeschrieben. Die Berechnung ist keine Steuerberatung.`;

/** 015/AC6, while checked. */
const NOTE_REINVEST =
  `${NOTE_START}. Angenommen wird, dass die Erstattung jedes Sparjahres am 1. Januar des ` +
  'Folgejahres ins Depot eingezahlt wird; sie zählt dann als Beitrag dieses Jahres, höchstens ' +
  `bis zur Beitragsgrenze von ${formatWholeEuro(CONTRIBUTION_CAP_CENTS)} pro Jahr, den Rest behält die steuerpflichtige Person. Die ` +
  'Erstattung des letzten Sparjahres wird nicht wieder angelegt. Die Berechnung ist keine ' +
  'Steuerberatung.';

/**
 * The four depot figures (five with the reinvested refund, 015), the Zulage details, the tax
 * refund group and the model note, or the "no result" hint (013 AC4–AC8, 014 AC2, AC6, AC8,
 * 015 AC2, AC6).
 */
export function ResultSummary({
  projection,
  refund,
  payoutAge,
  liveText,
  reinvest,
}: ResultSummaryProps) {
  const headingId = useId();
  return (
    <section className={styles.result} aria-labelledby={headingId}>
      <h2 id={headingId}>Ergebnis</h2>
      {/* The only live region; mounted empty from the first render in every state (AC7). */}
      <p className={styles.visuallyHidden} aria-live="polite">
        {liveText}
      </p>
      {projection === null || refund === null || payoutAge === null ? (
        <p className={styles.noResult}>
          <ErrorIcon className={styles.icon} />
          <span>Kein Ergebnis möglich. Bitte die markierten Felder korrigieren.</span>
        </p>
      ) : (
        <>
          <dl className={reinvest ? `${styles.figures} ${styles.five}` : styles.figures}>
            <div className={styles.figure}>
              <dt>Eigene Beiträge</dt>
              <dd>{formatEuro(projection.total.contributionsCents)}</dd>
            </div>
            <div className={styles.figure}>
              <dt>Zulagen gesamt</dt>
              <dd>{formatEuro(projection.total.zulagenCents)}</dd>
            </div>
            {reinvest && (
              <div className={styles.figure}>
                <dt>Reinvestierte Steuererstattung</dt>
                <dd>{formatEuro(projection.total.reinvestedCents)}</dd>
              </div>
            )}
            <div className={styles.figure}>
              <dt>Erträge</dt>
              <dd>{formatEuro(projection.total.returnsCents)}</dd>
            </div>
            <div className={`${styles.figure} ${styles.endValue}`}>
              <dt>Endwert</dt>
              <dd>
                {formatEuro(projection.total.balanceCents)}
                <span className={styles.subLine}>
                  {` bei Auszahlungsbeginn mit ${String(payoutAge)}`}
                </span>
              </dd>
            </div>
          </dl>
          <dl className={styles.details} aria-label="Zulagen im Detail">
            <div className={styles.detail}>
              <dt>Zulage pro Jahr</dt>
              <dd>
                <PerYearValue
                  singleCents={projection.zulage.perYearCents}
                  range={
                    reinvest
                      ? perYearRange(
                          projection.schedule.map((year) => year.zulageCents),
                          projection.zulage.bonusCents > 0,
                        )
                      : null
                  }
                />
              </dd>
            </div>
            <div className={styles.detail}>
              <dt>Berufseinsteigerbonus (einmalig, im 1. Jahr)</dt>
              <dd>
                {projection.zulage.bonusCents > 0
                  ? formatEuro(projection.zulage.bonusCents)
                  : 'keiner'}
              </dd>
            </div>
            {projection.zulage.bonusCents > 0 && (
              <div className={styles.detail}>
                <dt>Zulage im 1. Jahr</dt>
                <dd>{formatEuro(projection.zulage.perYearCents + projection.zulage.bonusCents)}</dd>
              </div>
            )}
          </dl>
          <TaxRefundGroup
            refund={refund}
            hasBonus={projection.zulage.bonusCents > 0}
            reinvest={reinvest}
          />
          <p className={styles.note}>{reinvest ? NOTE_REINVEST : NOTE}</p>
        </>
      )}
    </section>
  );
}
