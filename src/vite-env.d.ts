/// <reference types="vite/client" />

interface ViteTypeOptions {
  // Only the env variables declared below are typed; unknown keys are a type error.
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  /** OAuth client ID for Google sign-in, from `.env.local`. Optional: missing → sign-in error. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
