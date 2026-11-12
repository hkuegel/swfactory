import type { PipelineStep } from '../content.ts';
import styles from './Pipeline.module.css';

/** Decorative shape of a pipeline step: a circle, or a diamond for a human gate. */
export function StepMarker({ kind }: { readonly kind: PipelineStep['kind'] }) {
  return (
    <span
      className={`${styles.marker} ${kind === 'gate' ? styles.gate : styles.step}`}
      aria-hidden="true"
    />
  );
}
