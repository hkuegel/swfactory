/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test';
import {
  BANNED_EVERYWHERE,
  BANNED_HASHED,
  BANNED_IN_TEXT,
  STEPS,
  bannedHits,
  differingPixels,
  expectStepAsText,
  headCommitDate,
  pageWords,
  repoFigures,
  rootUnitFiles,
  settled,
} from '../landing.helpers.ts';

// Story 021 on the published build (`_site/`, served under /swfactory/ by `npm run test:pages`).
// E1 (links, requests) lives in packages/platform/e2e/pages/pages.spec.ts, as it follows the apps.

// Design caps of the UX designer (binding; the AC caps 5 / 120 / 700 are the outer limit).
const MAX_SECTIONS = 4;
const MAX_WORDS_PER_SECTION = 100;
const MAX_WORDS_TOTAL = 400;

const main = (page: Page) => page.getByRole('main');

async function expectWordCaps(page: Page) {
  const words = await pageWords(page);
  expect(words.sections.length).toBeGreaterThanOrEqual(1);
  expect(words.sections.length).toBeLessThanOrEqual(MAX_SECTIONS);
  expect(words.total).toBeLessThanOrEqual(MAX_WORDS_TOTAL);
  for (const section of words.sections) {
    expect(section.words, `section "${section.heading}"`).toBeLessThanOrEqual(
      MAX_WORDS_PER_SECTION,
    );
  }
  return words;
}

// ---- E2: scripts off --------------------------------------------------------------------------------

test.describe('without scripts', () => {
  test.use({ javaScriptEnabled: false });

  test('AC1: one h1, level-2 sections reachable from the navigation, the word caps hold', async ({
    page,
  }) => {
    await page.goto('');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/software factory/i);
    const words = await expectWordCaps(page);

    // Every level-2 section is a nav target; every nav link has a target.
    const nav = page.getByRole('navigation', { name: 'Page sections' });
    const hrefs = await nav
      .getByRole('link')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    expect(hrefs.sort()).toEqual(words.sections.map((section) => `#${section.id}`).sort());
    for (const section of words.sections) {
      await expect(page.locator(`section#${section.id} h2`)).toHaveCount(1);
    }
  });

  test('AC2: the pipeline is plain text, in order, with both gates marked', async ({ page }) => {
    await page.goto('');
    const items = page.getByRole('list', { name: 'Pipeline steps' }).getByRole('listitem');
    await expect(items).toHaveCount(STEPS.length);
    for (const [index, step] of STEPS.entries()) {
      await expectStepAsText(items.nth(index), step);
    }
    expect(STEPS.filter((step) => step.gate).map((step) => step.label)).toEqual([
      'Gate 1',
      'Gate 2',
    ]);
    await expect(page.getByRole('tab')).toHaveCount(0);
    await expect(main(page).getByRole('button')).toHaveCount(0);
  });

  test('AC3: the sources of the ideas and figures used are named', async ({ page }) => {
    await page.goto('');
    await expect(main(page)).toContainText('Addy Osmani');
    await expect(main(page)).toContainText('Khatua et al.');
  });

  test('AC4: no banned word in the visible text or in any file of the root unit', async ({
    page,
    request,
  }) => {
    await page.goto('');
    const text = await page.evaluate(() => document.body.innerText);
    expect(text.length).toBeGreaterThan(500); // not vacuous
    expect(bannedHits(text, [...BANNED_EVERYWHERE, ...BANNED_IN_TEXT], BANNED_HASHED)).toEqual([]);

    const files = rootUnitFiles();
    expect(files.map((file) => file.path)).toContain('index.html');
    expect(files.some((file) => file.path.endsWith('.js'))).toBe(true);
    for (const file of files) {
      expect(bannedHits(file.text, BANNED_EVERYWHERE, BANNED_HASHED), file.path).toEqual([]);
    }
    // The files on disk are the files the server serves (the head of index.html as a sample).
    const served = await (await request.get('')).text();
    expect(served).toContain(files.find((file) => file.path === 'index.html')?.text.slice(0, 200));
  });
});

test('AC4: the scanner catches near misses and lets the repository address pass', () => {
  // A made-up dummy word stands in for the client-internal names (never stored in plain text).
  const dummy = [
    { label: 'dummy', sha256: '433c2a9842d736c0562080ceb58620096eb3846eee56557ff63dd275d12c92c6' },
  ];
  for (const sample of [
    'Zorblax',
    'a zorblax b',
    'z\\u006frblax',
    'z&#111;rblax',
    '<a title="Zorblax">',
    'ZORBLAX',
  ]) {
    expect(bannedHits(sample, [], dummy), sample).toEqual(['dummy']);
  }
  for (const sample of ['zorblaxes', 'azorblax', 'zorblax2']) {
    expect(bannedHits(sample, [], dummy), sample).toEqual([]);
  }
  for (const sample of [
    'Firstwaters',
    'Harald Kügel',
    'K&uuml;gel',
    'K&#252;gel',
    'K&#xFC;gel',
    'K\\u00fcgel',
    'K\\u{fc}gel',
    'K\\xfcgel',
    'Kügel', // decomposed ü
    'hak',
  ]) {
    expect(bannedHits(sample, BANNED_EVERYWHERE), sample).not.toEqual([]);
  }
  expect(
    bannedHits('Imprint, Privacy policy, Legal  notice, Datenschutz', BANNED_IN_TEXT).length,
  ).toBe(4);
  for (const sample of ['https://github.com/hkuegel/swfactory', 'hake', 'Internal']) {
    expect(
      bannedHits(sample, [...BANNED_EVERYWHERE, ...BANNED_IN_TEXT], BANNED_HASHED),
      sample,
    ).toEqual([]);
  }
});

// ---- E3: scripts on ---------------------------------------------------------------------------------

test.describe('with scripts', () => {
  test('AC1/AC5: hydrates without an error, the caps still hold, nothing is stored', async ({
    page,
    context,
  }) => {
    const problems: string[] = [];
    page.on('pageerror', (error) => problems.push(`pageerror ${error.message}`));
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type()))
        problems.push(`${message.type()} ${message.text()}`);
    });
    page.on('requestfailed', (request) => problems.push(`failed ${request.url()}`));

    await page.goto('');
    await expect(page.getByRole('tablist', { name: 'Pipeline steps' })).toBeVisible(); // hydrated
    await expectWordCaps(page);
    for (const tab of await page.getByRole('tab').all()) await tab.click();
    await page.getByRole('link', { name: 'Why' }).click();

    expect(problems).toEqual([]);
    const stored = await page.evaluate(async () => ({
      local: localStorage.length,
      session: sessionStorage.length,
      databases: (await indexedDB.databases()).length,
      cookie: document.cookie,
    }));
    expect(stored).toEqual({ local: 0, session: 0, databases: 0, cookie: '' });
    expect(await context.cookies()).toEqual([]);
  });

  test('AC6: every control is reachable by keyboard in reading order and shows a focus ring', async ({
    page,
  }) => {
    await page.goto('');
    await expect(page.getByRole('tablist')).toBeVisible();
    await settled(page);

    // The tab stops in DOM order (no positive tabindex anywhere), computed by the page itself.
    const expected = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('a[href], button, [tabindex]')]
        .filter((el) => el.tabIndex >= 0)
        .map(
          (el) =>
            (el.textContent ?? '').trim().slice(0, 40) || el.getAttribute('role') || el.tagName,
        ),
    );
    expect(expected.length).toBeGreaterThan(8);

    const visited: { name: string; outline: string; top: number }[] = [];
    for (let i = 0; i < expected.length; i += 1) {
      await page.keyboard.press('Tab');
      visited.push(
        await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          const style = getComputedStyle(el);
          return {
            name:
              (el.textContent ?? '').trim().slice(0, 40) || el.getAttribute('role') || el.tagName,
            outline: `${style.outlineStyle} ${style.outlineWidth}`,
            top: el.getBoundingClientRect().top + window.scrollY,
          };
        }),
      );
    }
    expect(visited.map((stop) => stop.name)).toEqual(expected);
    for (const stop of visited) {
      expect(stop.outline, stop.name).not.toMatch(/^none|\b0px$/);
    }
    // Reading order: after the skip link (which sits off-flow) the stops never go back up the page.
    visited.slice(2).forEach((stop, i) => {
      expect(stop.top, `${stop.name} after ${visited[i + 1]?.name}`).toBeGreaterThanOrEqual(
        (visited[i + 1]?.top ?? 0) - 1,
      );
    });
    // One more Tab leaves the page content (the last stop is the last control).
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  });

  test('AC2: the keys move through the steps and the panel shows the owner and the output', async ({
    page,
  }) => {
    await page.goto('');
    const panel = page.getByRole('tabpanel');
    const showsStep = async (index: number) => {
      const step = STEPS[index];
      if (step === undefined) throw new Error('no such step');
      await expect(page.getByRole('tab', { selected: true })).toHaveText(step.label);
      await expect(page.getByRole('tab', { selected: true })).toBeFocused();
      await expect(panel).toContainText(step.role);
      await expect(panel).toContainText(step.output);
    };

    // Tab from the top until the rail has focus.
    for (let i = 0; i < 20; i += 1) {
      if (await page.evaluate(() => document.activeElement?.getAttribute('role') === 'tab')) break;
      await page.keyboard.press('Tab');
    }
    await showsStep(0);
    for (let index = 1; index < STEPS.length; index += 1) {
      await page.keyboard.press('ArrowDown');
      await showsStep(index);
    }
    await page.keyboard.press('ArrowDown'); // wraps
    await showsStep(0);
    await page.keyboard.press('ArrowUp'); // wraps back
    await showsStep(STEPS.length - 1);
    await page.keyboard.press('Home');
    await showsStep(0);
    await page.keyboard.press('ArrowRight');
    await showsStep(1);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('End');
    await showsStep(STEPS.length - 1);

    // Tab leaves the rail for the panel; the pointer works too.
    await page.keyboard.press('Tab');
    await expect(panel).toBeFocused();
    await page.getByRole('tab', { name: 'Design' }).click();
    await expect(panel).toContainText('Architect, UX designer');
  });

  test('AC6: in forced colours the selected step, an unselected step and a gate differ without colour', async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('');
    await expect(page.getByRole('tablist')).toBeVisible();
    await settled(page);

    const signature = (name: string) =>
      page.getByRole('tab', { name, exact: true }).evaluate((tab) => {
        const style = getComputedStyle(tab);
        const marker = getComputedStyle(tab.querySelector('span[aria-hidden]') ?? tab);
        return {
          label: tab.textContent,
          edges: [
            style.borderTopWidth,
            style.borderRightWidth,
            style.borderBottomWidth,
            style.borderLeftWidth,
          ],
          borderStyles: [style.borderTopStyle, style.borderLeftStyle],
          glyph: getComputedStyle(tab, '::after').content,
          markerTransform: marker.transform,
          markerRadius: marker.borderRadius,
        };
      });
    const selected = await signature('Story'); // initial selection
    const step = await signature('Build');
    const gate = await signature('Gate 1');

    // Selected vs unselected: a heavier edge and a glyph, never only a colour.
    expect(selected.edges).not.toEqual(step.edges);
    expect(selected.glyph).not.toBe(step.glyph);
    expect(step.glyph).toMatch(/^(none|normal|""|"" \/ "")$/);
    // Gate vs step: another marker shape (a turned square) and the label text.
    expect(gate.markerTransform).not.toBe(step.markerTransform);
    expect(gate.markerRadius).not.toBe(step.markerRadius);
    expect(gate.label).not.toBe(step.label);
    // Pairwise different overall.
    for (const [a, b] of [
      [selected, step],
      [selected, gate],
      [step, gate],
    ] as const) {
      expect(a).not.toEqual(b);
    }
  });
});

// ---- E4: animation ----------------------------------------------------------------------------------

interface Recording {
  starts: { name: string; duration: number; iterations: number; delay: number }[];
  iterations: number;
  ends: number;
  pause: boolean;
}
declare global {
  interface Window {
    __rec: Recording;
  }
}

/** Records every CSS animation from the first frame on (a late `getAnimations()` could miss a short one). */
function record(page: Page, pause: boolean) {
  return page.addInitScript((pauseAtStart: boolean) => {
    const rec: Recording = { starts: [], iterations: 0, ends: 0, pause: pauseAtStart };
    window.__rec = rec;
    window.addEventListener(
      'animationstart',
      (event) => {
        for (const animation of document.getAnimations()) {
          if (
            !(animation instanceof CSSAnimation) ||
            animation.animationName !== event.animationName
          )
            continue;
          const timing = animation.effect?.getComputedTiming();
          rec.starts.push({
            name: animation.animationName,
            duration: Number(timing?.duration ?? -1),
            iterations: timing?.iterations ?? -1,
            delay: (timing?.delay ?? 0) + (timing?.endDelay ?? 0),
          });
          if (rec.pause) {
            animation.pause();
            animation.currentTime = 0;
          }
        }
      },
      true,
    );
    window.addEventListener('animationiteration', () => (rec.iterations += 1), true);
    window.addEventListener('animationend', () => (rec.ends += 1), true);
  }, pause);
}

test.describe('with motion', () => {
  test('AC2: one entry animation of at most 2 s, one iteration, and every transition is finite', async ({
    page,
  }) => {
    await record(page, false);
    await page.goto('');
    await expect(page.getByRole('tablist')).toBeVisible();
    await settled(page);

    const rec = await page.evaluate(() => window.__rec);
    expect(rec.starts).toHaveLength(1); // one, and hydration did not restart it
    const [entry] = rec.starts;
    expect(entry?.iterations).toBe(1);
    expect((entry?.duration ?? Infinity) + (entry?.delay ?? 0)).toBeLessThanOrEqual(2000);

    // The highlight of a step (a transition) and a hover are finite as well; the click really starts one.
    const running = await page.evaluate(async () => {
      document.querySelectorAll<HTMLElement>('[role="tab"]')[2]?.click();
      await new Promise((resolve) => requestAnimationFrame(resolve)); // React renders, the transition starts
      return document.getAnimations().map((animation) => {
        const timing = animation.effect?.getComputedTiming();
        return { iterations: timing?.iterations, total: Number(timing?.endTime) };
      });
    });
    expect(running.length).toBeGreaterThan(0);
    for (const animation of running) {
      expect(animation.iterations).toBe(1);
      expect(animation.total).toBeLessThanOrEqual(2000);
    }
  });

  test('AC2/AC6: the entry animation is visible and nothing loops afterwards', async ({ page }) => {
    // Part 1: held at its first frame, the viewport differs from the finished one (text may stay in:
    // same run, same fonts). Measured: first vs finished frame 27,226 pixels at tolerance 8; identical idle frames 0, also at tolerance 0.
    await record(page, true);
    await page.goto('');
    await page.waitForFunction(() => window.__rec.starts.length === 1);
    const first = await page.screenshot();
    await page.evaluate(() => document.getAnimations().forEach((animation) => animation.finish()));
    await settled(page);
    const last = await page.screenshot();
    expect(await differingPixels(page, first, last)).toBeGreaterThan(1000);

    // Part 2: once it ended, frames 500 ms apart are the same and no iteration ever fired.
    await page.waitForTimeout(500);
    const later = await page.screenshot();
    expect(await differingPixels(page, last, later)).toBe(0);
    const rec = await page.evaluate(() => ({
      ...window.__rec,
      running: document.getAnimations().length,
    }));
    expect(rec.iterations).toBe(0);
    expect(rec.ends).toBe(1);
    expect(rec.running).toBe(0);
  });
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('AC2/AC6: no animation, no control to operate, every step as text', async ({ page }) => {
    await record(page, false);
    await page.goto('');
    await page.waitForTimeout(300); // an interactive form or an animation would have appeared by now
    const rec = await page.evaluate(() => ({
      ...window.__rec,
      running: document.getAnimations().length,
    }));
    expect(rec.starts).toEqual([]);
    expect(rec.running).toBe(0);

    await expect(page.getByRole('tab')).toHaveCount(0);
    await expect(main(page).getByRole('button')).toHaveCount(0);
    const items = page.getByRole('list', { name: 'Pipeline steps' }).getByRole('listitem');
    await expect(items).toHaveCount(STEPS.length);
    for (const [index, step] of STEPS.entries()) {
      await expectStepAsText(items.nth(index), step);
    }
    // Hovering a step and following a link start nothing either.
    await items.nth(3).hover();
    await page.getByRole('link', { name: 'See the apps' }).click();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });
});

// ---- E5: layout -------------------------------------------------------------------------------------

for (const width of [320, 1280]) {
  for (const scheme of ['light', 'dark', 'forced colours'] as const) {
    test(`AC6: no horizontal scrolling at ${width} px, ${scheme}, with and without scripts`, async ({
      browser,
      baseURL,
    }) => {
      for (const javaScriptEnabled of [true, false]) {
        const context = await browser.newContext({
          viewport: { width, height: 800 },
          colorScheme: scheme === 'dark' ? 'dark' : 'light',
          forcedColors: scheme === 'forced colours' ? 'active' : 'none',
          javaScriptEnabled,
          baseURL: baseURL ?? '',
        });
        try {
          const page = await context.newPage();
          await page.goto('');
          if (javaScriptEnabled) await expect(page.getByRole('tablist')).toBeVisible();
          await settled(page);
          const metrics = await page.evaluate(() => ({
            root: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
            body: [document.body.scrollWidth, document.body.clientWidth],
            dark: matchMedia('(prefers-color-scheme: dark)').matches,
            // Light text on a dark page, dark text on a light page: the appearance really switched.
            textIsLight: (() => {
              const color = getComputedStyle(document.querySelector('h1') ?? document.body).color;
              const [r = 0, g = 0, b = 0] = (color.match(/\d+/g) ?? []).map(Number);
              return 0.2126 * r + 0.7152 * g + 0.0722 * b > 128;
            })(),
          }));
          const label = `${scheme}, scripts ${javaScriptEnabled ? 'on' : 'off'}`;
          expect(metrics.root[0], label).toBeLessThanOrEqual(metrics.root[1] ?? 0);
          expect(metrics.body[0], label).toBeLessThanOrEqual(metrics.body[1] ?? 0);
          if (scheme === 'dark') expect(metrics.dark && metrics.textIsLight, label).toBe(true);
          if (scheme === 'light') expect(!metrics.dark && !metrics.textIsLight, label).toBe(true);
        } finally {
          await context.close();
        }
      }
    });
  }
}

// ---- E6: figures ------------------------------------------------------------------------------------

test('AC8: each figure equals the repository count on the stated date; the estimate is labelled', async ({
  page,
}) => {
  await page.goto('');
  const oracle = repoFigures();
  const figureOf = (label: RegExp) =>
    page.locator('#result dt', { hasText: label }).locator('xpath=following-sibling::dd');

  await expect(figureOf(/^stories done$/)).toHaveText(oracle.storiesDone.toLocaleString('en-US'));
  await expect(figureOf(/^agent runs recorded in cost tables$/)).toHaveText(
    oracle.agentRuns.toLocaleString('en-US'),
  );
  await expect(page.getByText(/^Counted in the repository on /)).toHaveText(
    `Counted in the repository on ${headCommitDate()}.`,
  );

  // The estimate is labelled and dated; no further figure without a source is shown.
  await expect(page.locator('#result dt')).toHaveCount(3);
  const estimate = page.locator('#result dt', { hasText: /estimate/i });
  await expect(estimate).toHaveCount(1);
  await expect(estimate).toContainText(/\d{4}-\d{2}-\d{2}/);
});
