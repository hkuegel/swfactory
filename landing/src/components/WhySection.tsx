import { SECTIONS, WHY_CARDS } from '../content.ts';
import { Section } from './Section.tsx';
import styles from './WhySection.module.css';

/** Why a factory: three cards (with their sources) and one closing line. */
export function WhySection() {
  return (
    <Section section={SECTIONS.why} lead="Code is cheap now. Checking it is the bottleneck.">
      <div className={styles.cards}>
        {WHY_CARDS.map((card) => (
          <div key={card.title} className={styles.card}>
            <h3 className={styles.title}>{card.title}</h3>
            <p className={styles.text}>{card.text}</p>
            {card.source !== undefined && <p className={styles.source}>{card.source}</p>}
          </div>
        ))}
      </div>
      <p className={styles.closing}>
        A software factory structures the work so every step is small, written down and checked.
      </p>
    </Section>
  );
}
