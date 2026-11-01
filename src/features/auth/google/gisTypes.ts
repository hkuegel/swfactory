/**
 * Minimal hand-written types for the Google Identity Services OAuth 2.0 token client
 * (https://developers.google.com/identity/oauth2/web/reference/js-reference). Only what our
 * adapter uses; `google.accounts.id` (One Tap) is deliberately not typed (ADR 0002).
 */

export interface GisTokenResponse {
  readonly access_token?: string;
  readonly expires_in?: number | string;
  readonly scope?: string;
  readonly token_type?: string;
  readonly error?: string;
  readonly error_description?: string;
  readonly error_uri?: string;
}

/** Known types are 'popup_failed_to_open', 'popup_closed' and 'unknown'. */
export interface GisClientConfigError {
  readonly type: string;
  readonly message?: string;
}

export interface GisTokenClientConfig {
  readonly client_id: string;
  readonly scope: string;
  readonly callback: (response: GisTokenResponse) => void;
  readonly error_callback?: (error: GisClientConfigError) => void;
}

export interface GisOverridableTokenClientConfig {
  readonly prompt?: '' | 'none' | 'consent' | 'select_account';
}

export interface GisTokenClient {
  requestAccessToken(overrideConfig?: GisOverridableTokenClientConfig): void;
}

export interface GisOAuth2 {
  initTokenClient(config: GisTokenClientConfig): GisTokenClient;
}

export interface GisNamespace {
  readonly accounts?: { readonly oauth2?: GisOAuth2 };
}

declare global {
  interface Window {
    /** Set by https://accounts.google.com/gsi/client once it has loaded. */
    google?: GisNamespace;
  }
}
