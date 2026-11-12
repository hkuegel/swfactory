import { REPOSITORY_URL, SECTIONS } from '../content.ts';
import styles from './Hero.module.css';
import { HeroMotif } from './HeroMotif.tsx';

/**
 * What the page is about and where to go. The wrapper carries the one entry animation of the page:
 * it is rendered at build time and keeps its node through hydration, so the animation runs once.
 */
export function Hero() {
  return (
    <div className={styles.hero}>
      <p className={styles.eyebrow}>swfactory</p>
      <h1 className={styles.title}>A software factory of AI agents</h1>
      <p className={styles.claim}>
        Roles, written handoffs and two human gates turn an idea into tested, reviewed, published
        software.
      </p>
      <div className={styles.actions}>
        <a className={`${styles.action} ${styles.primary}`} href={REPOSITORY_URL}>
          View on GitHub
        </a>
        <a className={`${styles.action} ${styles.secondary}`} href={`#${SECTIONS.result.id}`}>
          See the apps
        </a>
      </div>
      <HeroMotif />
    </div>
  );
}
