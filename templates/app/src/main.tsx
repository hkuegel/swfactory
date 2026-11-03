import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell, AuthProvider, createAuthClient } from '@swfactory/platform';
import '@swfactory/platform/tokens.css';
import '@swfactory/platform/base.css';
import './tokens.css';
import { Content } from './Content.tsx';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

// Created once, outside React, so StrictMode's double render never creates two GIS clients.
const authClient = createAuthClient();

createRoot(root).render(
  <StrictMode>
    <AuthProvider client={authClient}>
      <AppShell title="__TITLE__">
        <Content />
      </AppShell>
    </AuthProvider>
  </StrictMode>,
);
