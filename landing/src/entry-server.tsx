import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import data from 'virtual:landing-data';
import { LandingPage } from './LandingPage.tsx';

/** Rendered at build time by scripts/build-pages.mjs into the outlet of index.html (ADR 0011). */
export function render(): string {
  return renderToString(
    <StrictMode>
      <LandingPage data={data} />
    </StrictMode>,
  );
}
