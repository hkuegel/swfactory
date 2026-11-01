import type { GisOAuth2 } from './gisTypes.ts';

export const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

export type GisScriptLoader = () => Promise<GisOAuth2>;

/**
 * Creates a loader that injects the GIS script once and resolves with
 * `google.accounts.oauth2`. The promise is memoized; on failure the script tag is removed and
 * the memo reset, so a later call can retry.
 */
export function createGisScriptLoader(doc: Document = document): GisScriptLoader {
  let loading: Promise<GisOAuth2> | null = null;

  return () => {
    if (loading) return loading;

    const current = new Promise<GisOAuth2>((resolve, reject) => {
      const ready = window.google?.accounts?.oauth2;
      if (ready) {
        resolve(ready);
        return;
      }
      const script = doc.createElement('script');
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.addEventListener('load', () => {
        const oauth2 = window.google?.accounts?.oauth2;
        if (oauth2) {
          resolve(oauth2);
        } else {
          script.remove();
          reject(new Error('Google Identity Services loaded without accounts.oauth2'));
        }
      });
      script.addEventListener('error', () => {
        script.remove();
        reject(new Error('Google Identity Services script failed to load'));
      });
      doc.head.appendChild(script);
    });

    loading = current;
    current.catch(() => {
      if (loading === current) loading = null;
    });
    return current;
  };
}

/** App-wide loader: one GIS script per page. */
export const loadGisScript: GisScriptLoader = createGisScriptLoader();
