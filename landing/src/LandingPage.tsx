import { Hero } from './components/Hero.tsx';
import { HowSection } from './components/HowSection.tsx';
import { QualitySection } from './components/QualitySection.tsx';
import { ResultSection } from './components/ResultSection.tsx';
import { SiteHeader } from './components/SiteHeader.tsx';
import { WhySection } from './components/WhySection.tsx';
import styles from './LandingPage.module.css';
import type { LandingData } from './lib/landingData.ts';

const MAIN_ID = 'main';

/** The factory page at the site root: no sign-in, complete as HTML without scripts (ADR 0011). */
export function LandingPage({ data }: { readonly data: LandingData }) {
  return (
    <>
      <a className={styles.skip} href={`#${MAIN_ID}`}>
        Skip to main content
      </a>
      <div className={styles.page}>
        <SiteHeader />
        <main id={MAIN_ID} className={styles.main}>
          <Hero />
          <WhySection />
          <HowSection />
          <QualitySection />
          <ResultSection data={data} />
        </main>
      </div>
    </>
  );
}
