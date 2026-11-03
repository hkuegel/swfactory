import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { mergeConfig, defineConfig, type ViteUserConfig } from 'vitest/config';

// Repo root: `.env.local` (VITE_GOOGLE_CLIENT_ID) is shared by every app (story 011, ADR 0006).
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

/** Vite + Vitest config shared by the platform and every app; `overrides` are merged in. */
export function createAppViteConfig(overrides: ViteUserConfig = {}): ViteUserConfig {
  const base = defineConfig({
    plugins: [react()],
    envDir: repoRoot,
    resolve: { dedupe: ['react', 'react-dom'] },
    test: {
      environment: 'jsdom',
      setupFiles: ['@swfactory/platform/test/setup'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: { modules: { classNameStrategy: 'non-scoped' } },
    },
  });
  return mergeConfig(base, overrides);
}
