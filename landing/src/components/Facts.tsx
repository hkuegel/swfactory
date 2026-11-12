import { COST_ESTIMATE } from '../content.ts';
import { formatCount } from '../lib/formatCount.ts';
import type { LandingData } from '../lib/landingData.ts';
import styles from './Facts.module.css';

type FactsProps = Pick<LandingData, 'asOf' | 'backlog' | 'cost'>;

interface Fact {
  readonly figure: string;
  readonly label: string; // what the figure counts
}

/** The figures counted in the repository. None without the date they were counted on. */
function derivedFacts({ asOf, backlog, cost }: FactsProps): readonly Fact[] {
  if (asOf === null) return [];
  return [
    ...(backlog === null
      ? []
      : [{ figure: formatCount(backlog.storiesDone), label: 'stories done' }]),
    ...(cost === null
      ? []
      : [{ figure: formatCount(cost.agentRuns), label: 'agent runs recorded in cost tables' }]),
  ];
}

/**
 * The facts strip: a figure without a source is not shown; the cost estimate is static text and
 * always shown. The label comes first in the markup, the figure first for the eye.
 */
export function Facts(props: FactsProps) {
  const derived = derivedFacts(props);
  return (
    <>
      <dl className={styles.facts}>
        {derived.map((fact) => (
          <div key={fact.label} className={styles.tile}>
            <dt className={styles.label}>{fact.label}</dt>
            <dd className={styles.figure}>{fact.figure}</dd>
          </div>
        ))}
        <div className={`${styles.tile} ${styles.estimate}`}>
          <dt className={styles.label}>{COST_ESTIMATE.label}</dt>
          <dd className={styles.figure}>{COST_ESTIMATE.figure}</dd>
        </div>
      </dl>
      {derived.length > 0 && (
        <p className={styles.note}>Counted in the repository on {props.asOf}.</p>
      )}
    </>
  );
}
