import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import data from 'virtual:landing-data';
import '@swfactory/platform/tokens.css';
import '@swfactory/platform/base.css';
import './tokens.css';
import { LandingPage } from './LandingPage.tsx';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

const page = (
  <StrictMode>
    <LandingPage data={data} />
  </StrictMode>
);
// The built site holds the rendered page (hydrate); the dev server's root is empty (render).
if (root.firstElementChild) hydrateRoot(root, page);
else createRoot(root).render(page);
