import { PIPELINE } from '../content.ts';
import styles from './HeroMotif.module.css';

const WIDTH = 320;
const HEIGHT = 24;
const MIDDLE = HEIGHT / 2;
const INSET = 12; // centre of the first and (mirrored) the last mark
const CIRCLE_RADIUS = 5;
const DIAMOND_SIZE = 9;
const SPACING = (WIDTH - 2 * INSET) / (PIPELINE.length - 1);

/** Decoration under the hero links: the pipeline as a line of marks, the two gates as diamonds. */
export function HeroMotif() {
  return (
    <svg
      className={styles.motif}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      aria-hidden="true"
      focusable="false"
    >
      <line className={styles.line} x1={INSET} y1={MIDDLE} x2={WIDTH - INSET} y2={MIDDLE} />
      {PIPELINE.map((step, index) => {
        const x = INSET + index * SPACING;
        return step.kind === 'gate' ? (
          <rect
            key={step.id}
            className={styles.gate}
            x={x - DIAMOND_SIZE / 2}
            y={MIDDLE - DIAMOND_SIZE / 2}
            width={DIAMOND_SIZE}
            height={DIAMOND_SIZE}
            transform={`rotate(45 ${x} ${MIDDLE})`}
          />
        ) : (
          <circle key={step.id} className={styles.step} cx={x} cy={MIDDLE} r={CIRCLE_RADIUS} />
        );
      })}
    </svg>
  );
}
