import { useId } from 'react';
import { ErrorIcon } from './ErrorIcon.tsx';
import { COPY } from './fieldCopy.ts';
import { formatEuro } from './logic/format.ts';
import type { Direction } from './logic/fields.ts';
import type { Plan } from './logic/phase.ts';
import styles from './ResultSummary.module.css';

export interface ResultSummaryProps {
  /** null: nothing usable was typed yet, or a field is invalid (UX design §3). */
  readonly plan: Plan | null;
  /** The result area shows the no-result callout while a field is invalid. */
  readonly invalid: boolean;
  /** Before the first edit the result area shows the empty string. */
  readonly edited: boolean;
  /** The phase has no year with a funding fund (UX design §2). */
  readonly noFundingYear: boolean;
  readonly direction: Direction;
  /** Text of the polite live region; empty until the first edit (UX §4). */
  readonly liveText: string;
}

/** The two figures of the answer (UX design §1, §2). */
export function ResultSummary({
  plan,
  invalid,
  edited,
  noFundingYear,
  direction,
  liveText,
}: ResultSummaryProps) {
  const headingId = useId();
  return (
    <section className={styles.result} aria-labelledby={headingId}>
      <h2 id={headingId}>{COPY.resultHeading}</h2>
      {/* The only live region; mounted empty from the first render in every state (UX §4). */}
      <p className={styles.visuallyHidden} aria-live="polite">
        {liveText}
      </p>
      {!edited ? (
        <p className={styles.empty}>{COPY.emptyResult}</p>
      ) : invalid ? (
        <p className={styles.noResult}>
          <ErrorIcon className={styles.icon} />
          <span>{COPY.invalidResult}</span>
        </p>
      ) : noFundingYear ? (
        <p className={styles.noResult}>
          <ErrorIcon className={styles.icon} />
          <span>{COPY.noFundingYear}</span>
        </p>
      ) : (
        plan !== null && (
          <dl className={styles.figures}>
            <div className={styles.figure}>
              <dt>{COPY.figure(direction)}</dt>
              <dd>
                {direction === 'depot'
                  ? formatEuro(plan.monthlyCents)
                  : formatEuro(plan.depotCents)}
              </dd>
            </div>
            <div className={styles.figure}>
              <dt>{COPY.sumFigures}</dt>
              <dd>{formatEuro(plan.totalCents)}</dd>
            </div>
          </dl>
        )
      )}
    </section>
  );
}
