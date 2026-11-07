import { useId } from 'react';
import { ErrorIcon } from './ErrorIcon.tsx';
import { formatEuro } from './logic/format.ts';
import type { Projection } from './logic/project.ts';
import styles from './ResultSummary.module.css';

export interface ResultSummaryProps {
  /** null: show the "no result" hint (AC6). */
  readonly projection: Projection | null;
  readonly payoutAge: number | null;
  /** Text of the polite live region (AC7); empty until the first edit. */
  readonly liveText: string;
}

/** The four figures, the Zulage details and the model note, or the "no result" hint (AC4–AC8). */
export function ResultSummary({ projection, payoutAge, liveText }: ResultSummaryProps) {
  const headingId = useId();
  return (
    <section className={styles.result} aria-labelledby={headingId}>
      <h2 id={headingId}>Ergebnis</h2>
      {/* The only live region; mounted empty from the first render in every state (AC7). */}
      <p className={styles.visuallyHidden} aria-live="polite">
        {liveText}
      </p>
      {projection === null || payoutAge === null ? (
        <p className={styles.noResult}>
          <ErrorIcon className={styles.icon} />
          <span>Kein Ergebnis möglich. Bitte die markierten Felder korrigieren.</span>
        </p>
      ) : (
        <>
          <dl className={styles.figures}>
            <div className={styles.figure}>
              <dt>Eigene Beiträge</dt>
              <dd>{formatEuro(projection.total.contributionsCents)}</dd>
            </div>
            <div className={styles.figure}>
              <dt>Zulagen gesamt</dt>
              <dd>{formatEuro(projection.total.zulagenCents)}</dd>
            </div>
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
              <dd>{formatEuro(projection.zulage.perYearCents)}</dd>
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
          <p className={styles.note}>
            Hinweis: Die Zahlen sind Modellrechnungen auf Grundlage der eingegebenen Annahmen, keine
            Anlage- oder Steuerberatung. Es wird angenommen, dass der Anspruch auf die staatliche
            Zulage besteht. Beträge sind nominal, ohne Inflation.
          </p>
        </>
      )}
    </section>
  );
}
