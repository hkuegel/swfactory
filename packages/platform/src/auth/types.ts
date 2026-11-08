export type AuthUser =
  | {
      readonly provider: 'google';
      /** Google subject (`sub`). Display/React keys only — never an authorization basis. */
      readonly id: string;
      /** Always present: the adapter treats a profile without email as an error. */
      readonly email: string;
      /** null if Google provides no name or a blank one (001/AC11). */
      readonly name: string | null;
    }
  | {
      /**
       * Guest sign-in, dev or guest-only deploy build (stories 004, 018). Never an identity
       * toward a backend.
       */
      readonly provider: 'guest';
      readonly id: 'guest';
      readonly email: null;
      readonly name: 'Guest';
    };

export type SignInErrorReason =
  | 'not_configured' // VITE_GOOGLE_CLIENT_ID missing
  | 'unavailable' // GIS script not loaded / failed, userinfo request failed
  | 'popup_blocked' // error_callback popup_failed_to_open
  | 'access_denied' // token callback error=access_denied (incl. "Cancel" on Google's consent screen)
  | 'unknown';

export type SignInResult =
  | { readonly kind: 'success'; readonly user: AuthUser }
  | { readonly kind: 'cancelled' }
  | { readonly kind: 'error'; readonly reason: SignInErrorReason };

export interface AuthClient {
  /**
   * Interactive sign-in. MUST be called synchronously inside the click handler (it opens a
   * popup). Never rejects; every outcome is a SignInResult.
   */
  signIn(): Promise<SignInResult>;
  /** Forget provider-side state (e.g. the in-memory access token). Never throws. */
  signOut(): void;
}
