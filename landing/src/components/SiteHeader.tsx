import { SECTIONS } from '../content.ts';
import styles from './SiteHeader.module.css';

/** The banner: in-page links to the four sections. */
export function SiteHeader() {
  return (
    <header className={styles.header}>
      <nav aria-label="Page sections">
        <ul className={styles.links}>
          {Object.values(SECTIONS).map((section) => (
            <li key={section.id}>
              <a className={styles.link} href={`#${section.id}`}>
                {section.nav}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
