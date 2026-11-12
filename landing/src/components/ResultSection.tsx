import { REPOSITORY_URL, SECTIONS } from '../content.ts';
import type { LandingData } from '../lib/landingData.ts';
import { AppLinks } from './AppLinks.tsx';
import { Facts } from './Facts.tsx';
import styles from './ResultSection.module.css';
import { Section } from './Section.tsx';

/** The result: a link to every published app, the facts strip and the repository. */
export function ResultSection({ data }: { readonly data: LandingData }) {
  return (
    <Section
      section={SECTIONS.result}
      lead={
        data.apps.length > 0
          ? 'Try what the factory built. Each app opens at its login screen, with guest access.'
          : 'Try what the factory built.'
      }
    >
      <AppLinks apps={data.apps} />
      <Facts asOf={data.asOf} backlog={data.backlog} cost={data.cost} />
      <p className={styles.more}>
        <a className={styles.link} href={REPOSITORY_URL}>
          Read the details in the repository
        </a>
      </p>
    </Section>
  );
}
