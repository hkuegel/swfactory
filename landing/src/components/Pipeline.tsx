import { useState } from 'react';
import { PIPELINE } from '../content.ts';
import { useEnhanced } from '../useEnhanced.ts';
import styles from './Pipeline.module.css';
import { PipelineList } from './PipelineList.tsx';
import { PipelineTabs } from './PipelineTabs.tsx';

/**
 * The pipeline diagram in one of two forms inside the same wrapper: the plain list (rendered at
 * build time; it stays without scripts and under reduced motion) or the tabs (after hydration).
 */
export function Pipeline() {
  const enhanced = useEnhanced();
  const [selected, setSelected] = useState(0);
  return (
    <div className={styles.pipeline}>
      {enhanced ? (
        <PipelineTabs steps={PIPELINE} selected={selected} onSelect={setSelected} />
      ) : (
        <PipelineList steps={PIPELINE} />
      )}
    </div>
  );
}
