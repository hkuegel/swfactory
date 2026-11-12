import type { ReactNode } from 'react';
import type { PageSection } from '../content.ts';
import styles from './Section.module.css';

interface SectionProps {
  readonly section: PageSection;
  readonly lead: ReactNode;
  readonly children: ReactNode;
}

/** One level-2 section of the page: named by its heading, with a lead line above its content. */
export function Section({ section, lead, children }: SectionProps) {
  const headingId = `${section.id}-heading`;
  return (
    <section id={section.id} className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        {section.heading}
      </h2>
      <p className={styles.lead}>{lead}</p>
      {children}
    </section>
  );
}
