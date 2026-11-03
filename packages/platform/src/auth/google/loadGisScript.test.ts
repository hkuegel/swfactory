import { afterEach, describe, expect, it } from 'vitest';
import type { GisOAuth2 } from './gisTypes.ts';
import { createGisScriptLoader, GIS_SCRIPT_SRC } from './loadGisScript.ts';

const fakeOAuth2: GisOAuth2 = {
  initTokenClient: () => ({ requestAccessToken: () => undefined }),
};

function gisScripts(): HTMLScriptElement[] {
  return [...document.querySelectorAll<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`)];
}

function lastScript(): HTMLScriptElement {
  const script = gisScripts().at(-1);
  if (!script) throw new Error('no GIS script injected');
  return script;
}

afterEach(() => {
  delete window.google;
  gisScripts().forEach((s) => s.remove());
});

describe('createGisScriptLoader', () => {
  it('injects the GIS script once and resolves with accounts.oauth2 on load', async () => {
    const load = createGisScriptLoader();
    const first = load();
    const second = load();
    expect(second).toBe(first);
    expect(gisScripts()).toHaveLength(1);
    expect(lastScript().async).toBe(true);

    window.google = { accounts: { oauth2: fakeOAuth2 } };
    lastScript().dispatchEvent(new Event('load'));
    await expect(first).resolves.toBe(fakeOAuth2);
  });

  it('does not inject a script when GIS is already present', async () => {
    window.google = { accounts: { oauth2: fakeOAuth2 } };
    await expect(createGisScriptLoader()()).resolves.toBe(fakeOAuth2);
    expect(gisScripts()).toHaveLength(0);
  });

  it('AC5: rejects on a script error, removes the tag and retries on the next call', async () => {
    const load = createGisScriptLoader();
    const failed = load();
    lastScript().dispatchEvent(new Event('error'));
    await expect(failed).rejects.toThrow('failed to load');
    expect(gisScripts()).toHaveLength(0);

    const retry = load();
    expect(retry).not.toBe(failed);
    expect(gisScripts()).toHaveLength(1);
    window.google = { accounts: { oauth2: fakeOAuth2 } };
    lastScript().dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBe(fakeOAuth2);
  });

  it('AC5: rejects when the script loads without accounts.oauth2', async () => {
    const load = createGisScriptLoader();
    const result = load();
    lastScript().dispatchEvent(new Event('load'));
    await expect(result).rejects.toThrow('without accounts.oauth2');
    expect(gisScripts()).toHaveLength(0);
  });
});
