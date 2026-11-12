import type { KeyboardEvent } from 'react';
import type { PipelineStep } from '../content.ts';
import { nextStepIndex } from '../lib/stepNavigation.ts';
import styles from './Pipeline.module.css';
import { StepMarker } from './StepMarker.tsx';

const PANEL_ID = 'pipeline-panel';
const tabId = (step: PipelineStep) => `pipeline-tab-${step.id}`;

interface PipelineTabsProps {
  readonly steps: readonly PipelineStep[];
  readonly selected: number;
  readonly onSelect: (index: number) => void;
}

function DetailList({ step, hidden }: { readonly step: PipelineStep; readonly hidden: boolean }) {
  return (
    <dl
      className={hidden ? `${styles.details} ${styles.sizer}` : styles.details}
      aria-hidden={hidden ? 'true' : undefined}
    >
      <div>
        <dt>Owner</dt>
        <dd>{step.role}</dd>
      </div>
      <div>
        <dt>Produces</dt>
        <dd>{step.output}</dd>
      </div>
    </dl>
  );
}

/**
 * Interactive form of the pipeline: tabs with automatic activation (WAI-ARIA APG). The rail is one
 * tab stop; the arrow keys, Home and End move the selection; the panel is the next tab stop.
 */
export function PipelineTabs({ steps, selected, onSelect }: PipelineTabsProps) {
  const current = steps[selected];
  if (current === undefined) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return; // browser shortcuts
    const next = nextStepIndex(selected, event.key, steps.length);
    if (next === undefined) return;
    event.preventDefault();
    onSelect(next);
    event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <>
      <div
        className={styles.rail}
        role="tablist"
        aria-label="Pipeline steps"
        aria-orientation="vertical"
        onKeyDown={handleKeyDown}
      >
        {steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            role="tab"
            id={tabId(step)}
            className={styles.tab}
            aria-selected={index === selected}
            aria-controls={PANEL_ID}
            tabIndex={index === selected ? 0 : -1}
            onClick={() => {
              onSelect(index);
            }}
          >
            <StepMarker kind={step.kind} />
            <span className={styles.tabLabel}>{step.label}</span>
          </button>
        ))}
      </div>
      {/* tabIndex 0: the panel holds no focusable element (APG). */}
      <div
        className={styles.panel}
        role="tabpanel"
        id={PANEL_ID}
        aria-labelledby={tabId(current)}
        tabIndex={0}
      >
        {/* The tab already names the panel: the title is for the eye only. */}
        <p className={styles.panelTitle} aria-hidden="true">
          <StepMarker kind={current.kind} />
          {current.label}
        </p>
        {/* All steps' details share one grid cell, so the panel is as tall as the longest. */}
        <div className={styles.detailStack}>
          {steps.map((step) => (
            <DetailList key={step.id} step={step} hidden={step !== current} />
          ))}
        </div>
      </div>
    </>
  );
}
