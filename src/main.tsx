import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.tsx';
import { AuthProvider } from './features/auth/AuthProvider.tsx';
import { createAuthClient } from './features/auth/createAuthClient.ts';
import './app/tokens.css';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

// Created once, outside React, so StrictMode's double render never creates two GIS clients.
const authClient = createAuthClient();

createRoot(root).render(
  <StrictMode>
    <AuthProvider client={authClient}>
      <App />
    </AuthProvider>
  </StrictMode>,
);
