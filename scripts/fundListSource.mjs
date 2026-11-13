// Story 025 (devops): the request part of the writer, used only in live mode. A test never imports this
// file (ADR 0014), which is why parse and request are separate modules: the separation is what makes
// "fixture mode makes no request" measurable rather than a convention.

/** A hanging request must end in an error state, so a run cannot stay open forever (ADR 0014). */
export const FETCH_TIMEOUT_MS = 15_000;

const BASE_URL = 'https://www.ishares.com/uk/individual/en/products/';

/** One product page as text, with the timeout that ends the run in the error state. */
export async function fetchFundPage(productId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE_URL}${productId}`, { signal: controller.signal });
    if (!response.ok) {
      return { ok: false, problem: `response ${response.status}` };
    }
    return { ok: true, text: await response.text() };
  } catch (error) {
    return { ok: false, problem: error instanceof Error ? error.message : 'request failed' };
  } finally {
    clearTimeout(timer);
  }
}
