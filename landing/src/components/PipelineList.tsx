import type { PipelineStep } from '../content.ts';
import styles from './Pipeline.module.css';
import { StepMarker } from './StepMarker.tsx';

/** Static form of the pipeline: every step with its owner and output as text, nothing to operate. */
export function PipelineList({ steps }: { readonly steps: readonly PipelineStep[] }) {
  return (
    // role="list": Safari drops the list semantics of a list without markers.
    <ol className={styles.list} role="list" aria-label="Pipeline steps">
      {steps.map((step) => (
        <li key={step.id} className={styles.row}>
          <StepMarker kind={step.kind} />
          <span className={styles.rowHead}>
            <span className={styles.rowLabel}>{step.label}</span>{' '}
            <span className={styles.rowRole}>{step.role}</span>
          </span>
          <span className={styles.rowOutput}>{step.output}</span>
        </li>
      ))}
    </ol>
  );
}
