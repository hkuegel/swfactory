import { QUALITY_LAYERS, SECTIONS } from '../content.ts';
import styles from './QualitySection.module.css';
import { Section } from './Section.tsx';

/** How quality is kept: four numbered layers and the learning loop in one line. */
export function QualitySection() {
  return (
    <Section
      section={SECTIONS.quality}
      lead="Four layers, from cheap and automatic to rare and human."
    >
      <ol className={styles.layers}>
        {QUALITY_LAYERS.map((layer) => (
          <li key={layer.label} className={styles.layer}>
            <strong className={styles.label}>{layer.label}</strong>{' '}
            <span className={styles.text}>{layer.text}</span>
          </li>
        ))}
      </ol>
      <p className={styles.learning}>
        After every story the factory learns: a retro ends in approved, versioned rule changes.
      </p>
    </Section>
  );
}
