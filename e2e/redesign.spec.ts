/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib), but page.evaluate callbacks run in the browser.
import { expect, test, type Page } from '@playwright/test';

// Story 007 – Minesweeper redesign. AC1 is the unchanged behaviour suites (auth*.spec.ts,
// minesweeper.spec.ts); contrast, token parity and "no token bypass" are unit-tested in
// src/app/tokens.test.ts. These specs show what only a browser can: computed styles, shapes,
// layout and motion. Visual taste is hak's sign-off on screenshots (gate 2).

type Pair = readonly [row: number, col: number];
type TestWindow = Window & {
  __minesweeperMines?: Pair[];
  __fakeGoogle?: { settleSignIn(outcome: 'success' | 'cancelled' | 'error'): void };
};

const startButton = (page: Page) => page.getByRole('button', { name: 'Start' });
const grid = (page: Page) => page.getByRole('grid', { name: 'Minesweeper board' });
const signOutButton = (page: Page) => page.getByRole('button', { name: 'Sign out' });
const rowsInput = (page: Page) => page.getByLabel('Rows', { exact: true });
const colsInput = (page: Page) => page.getByLabel('Columns', { exact: true });
const minesInput = (page: Page) => page.getByLabel('Mines', { exact: true });
const cell = (page: Page, row: number, col: number) =>
  page.getByRole('gridcell', { name: new RegExp(`^Row ${row}, column ${col},`) });

async function signInAsGuest(page: Page) {
  await page.getByRole('button', { name: 'Sign in as guest' }).click();
  await expect(page.getByText('Signed in as')).toBeVisible();
}

/** Fixed layout, 1-based pairs (the dev server reads window.__minesweeperMines, 0-based). */
async function startFixed5x5(page: Page, layout: readonly Pair[]) {
  await page.evaluate(
    (l) => {
      (window as TestWindow).__minesweeperMines = l.map(([r, c]) => [r - 1, c - 1]);
    },
    layout.map((p) => [...p] as Pair),
  );
  await rowsInput(page).fill('5');
  await colsInput(page).fill('5');
  await minesInput(page).fill(String(layout.length));
  await startButton(page).click();
  await expect(grid(page)).toBeVisible();
}

/** Column 3 is a wall of mines. Reveal (3,1) opens columns 1 and 2, the right side stays hidden. */
const WALL: readonly Pair[] = [
  [1, 3],
  [2, 3],
  [3, 3],
  [4, 3],
  [5, 3],
];

/**
 * A lost 5 x 5 game that shows all seven cell states: hidden (1,5), flagged (3,3, a mine),
 * empty (1,1), number (1,2), mine (1,3), exploded mine (2,3), wrong flag (3,5).
 */
async function loseWithAllStates(page: Page) {
  await startFixed5x5(page, WALL);
  await cell(page, 3, 3).click({ button: 'right' });
  await cell(page, 3, 5).click({ button: 'right' });
  await cell(page, 3, 1).click();
  await cell(page, 2, 3).click();
  await expect(page.getByText('You lost. You revealed a mine.')).toBeVisible();
}

const STATES = {
  hidden: [1, 5],
  flagged: [3, 3],
  empty: [1, 1],
  number: [1, 2],
  mine: [1, 3],
  exploded: [2, 3],
  wrongFlag: [3, 5],
} as const;

type StateName = keyof typeof STATES;

/**
 * Signatures of the seven cell states, computed in the browser. Without colour: border, inset
 * shadow and the glyph markup. With colour (forced colours): border, background and the glyph
 * shapes by tag name and text, plus a visibility check: every glyph shape and digit must be
 * painted in a colour different from what is behind it (an invisible glyph would pass a markup
 * comparison). Behind a glyph is the cell background, behind the exploded mine's spikes its disc.
 */
async function cellSignatures(page: Page, withColour: boolean) {
  // Cells fade their fill and shadow for 120 ms; read the computed styles after that settled.
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
  const result: Record<string, string> = {};
  const invisible: string[] = [];
  for (const name of Object.keys(STATES) as StateName[]) {
    const [r, c] = STATES[name];
    const out = await cell(page, r, c).evaluate((el, colour) => {
      const s = getComputedStyle(el);
      if (!colour) {
        return {
          signature: JSON.stringify([
            s.borderTopWidth,
            s.borderTopStyle,
            el.innerHTML,
            s.boxShadow !== 'none',
          ]),
          invisible: [] as string[],
        };
      }
      const shapes = Array.from(el.querySelectorAll('svg *'));
      const paints = (shape: Element) => {
        const p = getComputedStyle(shape);
        return [p.fill, p.stroke].filter((v) => v !== 'none');
      };
      const bad: string[] = [];
      // The decorative disc of the exploded mine (the only circle with r=11) backs its spikes.
      const disc = shapes.find((x) => x.tagName === 'circle' && x.getAttribute('r') === '11');
      const discPaint = disc ? paints(disc)[0] : undefined;
      for (const shape of shapes) {
        if (shape.tagName === 'g') continue; // grouping only; its children are checked
        const backdrop = disc && shape !== disc ? discPaint : s.backgroundColor;
        const own = paints(shape);
        if (own.length === 0 || own.every((v) => v === backdrop)) bad.push(shape.tagName);
      }
      const text = el.textContent?.trim() ?? '';
      if (text && s.color === s.backgroundColor) bad.push('digit');
      return {
        signature: JSON.stringify([
          s.borderTopWidth,
          s.borderTopStyle,
          s.backgroundColor,
          shapes.map((x) => x.tagName),
          text,
        ]),
        invisible: bad,
      };
    }, withColour);
    result[name] = out.signature;
    if (out.invisible.length) invisible.push(`${name}: ${out.invisible.join(', ')}`);
  }
  return { signatures: result, invisible };
}

function expectAllDistinct(signatures: Record<string, string>) {
  const names = Object.keys(signatures);
  for (const [i, a] of names.entries()) {
    for (const b of names.slice(i + 1)) {
      expect(signatures[a], `${a} and ${b} look the same`).not.toBe(signatures[b]);
    }
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
});

test('AC2: one font, one control radius, one primary and one secondary style, one colour per message kind', async ({
  page,
}) => {
  const fonts = new Set<string>();
  const radii = new Set<string>();

  /** Everything that carries text, plus all buttons and inputs: collect font and radius. */
  const collect = async () => {
    const found = await page.evaluate(() => {
      const hasText = (el: Element) =>
        Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? '').trim());
      const fontOf = Array.from(document.body.querySelectorAll('*'))
        .filter((el) => hasText(el) || el.matches('button, input'))
        .map((el) => getComputedStyle(el).fontFamily);
      const radiusOf = Array.from(document.querySelectorAll('button, input')).map(
        (el) => getComputedStyle(el).borderTopLeftRadius,
      );
      return { fontOf, radiusOf };
    });
    expect(found.fontOf.length).toBeGreaterThan(0);
    found.fontOf.forEach((f) => fonts.add(f));
    found.radiusOf.forEach((r) => radii.add(r));
  };

  const style = (selector: ReturnType<Page['locator']>) =>
    selector.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        colour: s.color,
        borderColour: s.borderTopColor,
        borderWidth: s.borderTopWidth,
        radius: s.borderTopLeftRadius,
      };
    });
  const message = (selector: ReturnType<Page['locator']>) =>
    selector.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, bar: s.borderLeftColor, radius: s.borderTopLeftRadius };
    });
  const token = (name: string) =>
    page.evaluate((n) => {
      const probe = document.createElement('div');
      probe.style.backgroundColor = `var(${n})`;
      document.body.append(probe);
      const colour = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return colour;
    }, name);

  // Login view with a failed sign-in showing: Google button, guest button, login error.
  await collect();
  await page.getByRole('button', { name: 'Sign in with Google' }).click();
  await page.evaluate(() => (window as TestWindow).__fakeGoogle?.settleSignIn('error'));
  const loginError = message(page.getByRole('alert'));
  await expect(page.getByRole('alert')).toBeVisible();
  await collect();
  const guest = await style(page.getByRole('button', { name: 'Sign in as guest' }));

  await signInAsGuest(page);

  // Signed in, setup error shown, then a started game.
  await rowsInput(page).fill('31');
  await colsInput(page).fill('99');
  await startButton(page).click();
  const setupErrors = page.getByText(/must be a whole number from/);
  await expect(setupErrors).toHaveCount(2);
  const setupError = await message(setupErrors.first());
  await collect();

  const start = await style(startButton(page));
  const presets = page.getByRole('group', { name: 'Difficulty' }).getByRole('button');
  await expect(presets).toHaveCount(3);
  const presetStyles = [];
  for (let i = 0; i < 3; i++) presetStyles.push(await style(presets.nth(i)));
  const signOut = await style(signOutButton(page));

  await loseWithAllStates(page);
  const lost = await message(page.getByText('You lost. You revealed a mine.'));
  await collect();

  // A won game: one click opens everything but the single mine.
  await startFixed5x5(page, [[1, 1]]);
  await cell(page, 5, 5).click();
  await expect(page.getByText('You won! Every safe cell is revealed.')).toBeVisible();
  const won = await message(page.getByText('You won! Every safe cell is revealed.'));
  await collect();

  // One font family and one control radius over every screen (the Google button included).
  expect([...fonts]).toHaveLength(1);
  expect([...radii]).toHaveLength(1);
  expect([...radii][0]).not.toBe('0px');

  // Primary: the accent fill. Secondary: the same outlined style for presets and Sign out
  // (and the dev guest button, whose dashed border is its own marker).
  expect(start.bg).toBe(await token('--color-accent'));
  expect(start.colour).toBe(await token('--color-on-accent'));
  for (const p of presetStyles) expect(p).toEqual(signOut);
  expect(signOut.bg).not.toBe(start.bg);
  expect(signOut.borderWidth).not.toBe('0px');
  expect(signOut.colour).toBe(await token('--color-accent'));
  expect({ bg: guest.bg, radius: guest.radius }).toEqual({
    bg: signOut.bg,
    radius: signOut.radius,
  });

  // The same colours for the same message kind wherever it appears; won differs from error.
  expect(await loginError).toEqual(setupError);
  expect(lost).toEqual(setupError);
  expect(won.bg).toBe(await token('--color-success-bg'));
  expect(won.bar).toBe(await token('--color-success'));
  expect(won.bg).not.toBe(lost.bg);
});

test('AC3: forced colours keep all seven cell states distinguishable', async ({ page }) => {
  await signInAsGuest(page);
  await page.emulateMedia({ forcedColors: 'active' });
  await loseWithAllStates(page);
  const { signatures, invisible } = await cellSignatures(page, true);
  expectAllDistinct(signatures);
  expect(invisible, 'glyphs painted in the colour of what is behind them').toEqual([]);
});

test('AC4: cell states differ by shape not colour, focus ring is at least 2 px, targets are large enough', async ({
  page,
}) => {
  await signInAsGuest(page);
  await loseWithAllStates(page);

  // The seven states are pairwise distinct without looking at any colour.
  expectAllDistinct((await cellSignatures(page, false)).signatures);

  const focusRing = (locator: ReturnType<Page['locator']>) =>
    locator.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        style: s.outlineStyle,
        width: parseFloat(s.outlineWidth),
        focus: el.matches(':focus-visible'),
      };
    });
  const expectRing = async (locator: ReturnType<Page['locator']>) => {
    await expect(locator).toBeFocused();
    const ring = await focusRing(locator);
    expect(ring.focus).toBe(true);
    expect(ring.style).not.toBe('none');
    expect(ring.width).toBeGreaterThanOrEqual(2);
  };

  // Keyboard focus: Sign out, then walk forward through the form to the board.
  await signOutButton(page).focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expectRing(signOutButton(page));
  await rowsInput(page).focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expectRing(rowsInput(page));
  await startButton(page).focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expectRing(startButton(page));
  // Tab on until the board: the stops in between (View control) are not this test's business.
  for (let i = 0; i < 12 && (await page.locator('[role="gridcell"]:focus').count()) === 0; i++) {
    await page.keyboard.press('Tab');
  }
  await expect(page.locator('[role="gridcell"]:focus')).toHaveCount(1);
  await expectRing(page.locator('[role="gridcell"]:focus'));

  // Target sizes.
  const heights = async (locators: ReturnType<Page['locator']>[]) => {
    for (const l of locators) {
      const box = await l.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
    }
  };
  await heights([
    startButton(page),
    signOutButton(page),
    rowsInput(page),
    colsInput(page),
    minesInput(page),
    ...[0, 1, 2].map((i) =>
      page.getByRole('group', { name: 'Difficulty' }).getByRole('button').nth(i),
    ),
  ]);
  const cells = page.getByRole('gridcell');
  for (let i = 0; i < 25; i++) {
    const box = await cells.nth(i).boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(24);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
  }
});

test.describe('layout', () => {
  test('AC5: no sideways page scroll, only the board scrolls, nothing overlaps (160, 320, 375, 800 px)', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 800, height: 900 });
    await signInAsGuest(page);

    const boards = [
      { rows: 9, cols: 9, mines: 10 },
      { rows: 16, cols: 30, mines: 99 },
      { rows: 30, cols: 30, mines: 99 },
    ];
    for (const width of [160, 320, 375, 800]) {
      await page.setViewportSize({ width, height: 900 });
      for (const b of boards) {
        const label = `${width} px, ${b.rows} x ${b.cols}`;
        await rowsInput(page).fill(String(b.rows));
        await colsInput(page).fill(String(b.cols));
        await minesInput(page).fill(String(b.mines));
        await startButton(page).click();
        await expect(page.getByRole('gridcell')).toHaveCount(b.rows * b.cols);

        const m = await page.evaluate(() => {
          const rect = (el: Element | null) => {
            const r = el?.getBoundingClientRect();
            return r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null;
          };
          const gridEl = document.querySelector('[role="grid"]');
          const scroller = gridEl?.parentElement ?? null;
          const form = document.querySelector('form');
          const counter = Array.from(document.querySelectorAll('p')).find((p) =>
            p.textContent?.startsWith('Mines left:'),
          );
          const inputs = Array.from(document.querySelectorAll('input, form button')).map((e) =>
            rect(e),
          );
          return {
            pageScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            innerWidth: window.innerWidth,
            scroller: {
              scrollWidth: scroller?.scrollWidth ?? 0,
              clientWidth: scroller?.clientWidth ?? 0,
            },
            form: rect(form),
            status: rect(counter ?? null),
            statusEnd: rect(counter?.parentElement?.parentElement ?? null),
            board: rect(scroller),
            controls: inputs,
            cell: rect(document.querySelector('[role="gridcell"]')),
          };
        });

        expect(m.pageScroll, `${label}: page scrolls sideways`).toBeLessThanOrEqual(0);
        for (const c of m.controls) {
          expect(c?.x ?? -1, `${label}: control left of viewport`).toBeGreaterThanOrEqual(0);
          expect(
            (c?.x ?? 0) + (c?.w ?? 0),
            `${label}: control right of viewport`,
          ).toBeLessThanOrEqual(m.innerWidth + 0.5);
        }
        // setup, status and board are stacked, not overlapping.
        expect(m.form && m.status && m.board).toBeTruthy();
        expect(
          (m.form?.y ?? 0) + (m.form?.h ?? 0),
          `${label}: setup overlaps status`,
        ).toBeLessThanOrEqual((m.status?.y ?? 0) + 0.5);
        expect(
          (m.statusEnd?.y ?? 0) + (m.statusEnd?.h ?? 0),
          `${label}: status overlaps board`,
        ).toBeLessThanOrEqual((m.board?.y ?? 0) + 0.5);
        // the board box never exceeds the viewport.
        expect((m.board?.x ?? 0) + (m.board?.w ?? 0)).toBeLessThanOrEqual(m.innerWidth + 0.5);
        expect(m.cell?.w ?? 0).toBeGreaterThanOrEqual(23.99);
        if (width === 800) expect(Math.round(m.cell?.w ?? 0)).toBe(32);

        const mustScroll = b.cols === 30 || width === 160;
        if (mustScroll) {
          expect(
            m.scroller.scrollWidth,
            `${label}: board should scroll inside its box`,
          ).toBeGreaterThan(m.scroller.clientWidth);
        } else {
          expect(m.scroller.scrollWidth, `${label}: board should fit`).toBeLessThanOrEqual(
            m.scroller.clientWidth,
          );
        }
      }
    }
  });
});

test.describe('motion', () => {
  /** Longest transition (duration + delay) in seconds over all elements, and all durations. */
  const transitions = (page: Page) =>
    page.evaluate(() => {
      const secs = (v: string) =>
        v.split(',').map((t) => (t.trim().endsWith('ms') ? parseFloat(t) / 1000 : parseFloat(t)));
      const all = [document.documentElement, ...document.body.querySelectorAll('*')];
      let max = 0;
      let nonZero = 0;
      for (const el of all) {
        const s = getComputedStyle(el);
        const d = secs(s.transitionDuration);
        const delay = secs(s.transitionDelay);
        d.forEach((x, i) => {
          const total = x + (delay[i % delay.length] ?? 0);
          max = Math.max(max, total);
          if (x > 0) nonZero++;
        });
      }
      return { max, nonZero, animations: document.getAnimations().length };
    });

  const interact = async (page: Page) => {
    await startFixed5x5(page, [
      [1, 1],
      [5, 5],
    ]);
    await cell(page, 3, 3).hover();
    await cell(page, 3, 3).click({ button: 'right' });
    await cell(page, 1, 2).click();
    await expect(cell(page, 1, 2)).toHaveAccessibleName('Row 1, column 2, 1 mine nearby');
    await startButton(page).hover();
    await page.mouse.down();
    await page.mouse.up();
  };

  test('AC6: reduced motion has no transition or animation, normal motion at most 200 ms and nothing loops', async ({
    page,
  }) => {
    await signInAsGuest(page);

    // Normal motion: there are transitions, none longer than 200 ms, and they all end.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await interact(page);
    const normal = await transitions(page);
    expect(normal.nonZero).toBeGreaterThan(0);
    expect(normal.max).toBeLessThanOrEqual(0.2);
    await expect.poll(async () => (await transitions(page)).animations).toBe(0);

    // Reduced motion: every duration is 0 and nothing is running.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await interact(page);
    const reduced = await transitions(page);
    expect(reduced.nonZero).toBe(0);
    expect(reduced.max).toBe(0);
    expect(reduced.animations).toBe(0);

    // The sign-in spinner is the one allowed loop: it rotates in normal motion, is static when reduced.
    await signOutButton(page).click();
    await page.getByRole('button', { name: 'Sign in with Google' }).click();
    await expect(page.getByText('Signing in with Google…')).toBeVisible();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(1);
  });
});
