import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell, AuthProvider, createAuthClient } from '@swfactory/platform';
import '@swfactory/platform/tokens.css';
import '@swfactory/platform/base.css';
import './tokens.css';
import { COPY } from './features/plan/fieldCopy.ts';
import { PlanCalculator } from './features/plan/PlanCalculator.tsx';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

// Created once, outside React, so StrictMode's double render never creates two GIS clients.
const authClient = createAuthClient();

createRoot(root).render(
  <StrictMode>
    <AuthProvider client={authClient}>
      {/* Story 044: the name the user sees is the copy's, so the shell and the tests read one string.
          `index.html` carries the same string as its `<title>`; the test pins both as hand values. */}
      <AppShell title={COPY.appTitle}>
        <PlanCalculator />
      </AppShell>
    </AuthProvider>
  </StrictMode>,
);
