/// <reference types="vite/client" />

interface ViteTypeOptions {
  // Only the env variables declared below are typed; unknown keys are a type error.
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  /** OAuth client ID for Google sign-in, from `.env.local`. Optional: missing → sign-in error. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /**
   * Public build setting of the GitHub Pages deploy build (story 018, ADR 0010): 'true' = guest
   * sign-in only, no Google sign-in. Set only by scripts/build-pages.mjs; never in .env.local.
   */
  readonly VITE_GUEST_ONLY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
