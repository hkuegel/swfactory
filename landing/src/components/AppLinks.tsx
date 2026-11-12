import type { PublishedApp } from '../lib/landingData.ts';
import styles from './AppLinks.module.css';

/**
 * One link card per published app, in the same tab. The apps come from the build (every app that
 * is published), never from names written here.
 */
export function AppLinks({ apps }: { readonly apps: readonly PublishedApp[] }) {
  if (apps.length === 0) return <p className={styles.none}>No apps published yet.</p>;
  return (
    // role="list": Safari drops the list semantics of a list without markers.
    <ul className={styles.apps} role="list">
      {apps.map((app) => (
        <li key={app.name} className={styles.item}>
          <a className={styles.card} href={`${import.meta.env.BASE_URL}${app.name}/`}>
            <span className={styles.title}>{app.title}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
