/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib); page.evaluate callbacks run in the browser.
import { expect, test, type Page } from '@playwright/test';
import { fundInput, fundTable, open } from './laz.helpers.ts';

// Story 044 – the name the user sees, the copy that explains the app, and the fund table's shared rule in
// one footnote. One test per AC (rebuild oracle). Every expected string is written here by hand from the
// story's UX §2 copy, never read from `fieldCopy.ts` (P16, hand oracle). The assertions stand in the order
// of their rules, so each rule's mutation is the first thing that fails.

/** The name in `index.html`, which the landing page's app list also reads at build time. */
const TITLE = 'Bond ladder';

const INTRO =
  'Ein Bond ladder ist eine Staffel von Fonds, einer pro Jahr. Jeder Fonds wird am 31. Dezember seines ' +
  'Jahres aufgelöst, und das Geld dieses Fonds finanziert die Auszahlungen des Jahres danach. Diese App ' +
  'zeigt, welche monatliche Auszahlung ein Depot über eine Phase trägt, oder welches Depot eine ' +
  'gewünschte monatliche Auszahlung braucht.';

const LEGEND = 'Was ist gegeben und was wird gesucht?';
const DEPOT_RADIO = 'Das Depot ist gegeben, gesucht wird die monatliche Auszahlung';
const PAYOUT_RADIO = 'Die monatliche Auszahlung ist gegeben, gesucht wird das Depot';

/** The rule every input cell used to print; now the footnote below the table, once. */
const FOOTNOTE =
  'Die Werte in den Kurs- und YTM-Zellen stammen aus der Fondsliste und können überschrieben werden; ' +
  'ein überschriebener Wert wird markiert und die Hochrechnung rechnet mit ihm. Kurs: höchstens 6 ' +
  'Nachkommastellen, der Wert muss eine ganze Anzahl Micro-Euro sein. YTM: höchstens 2 ' +
  'Nachkommastellen.';

const fundSection = (page: Page) => page.getByRole('region', { name: 'Fondsstaffel', exact: true });

test('AC1: the name shown is Bond ladder, in the document title and in the shell h1, in both views', async ({
  page,
}) => {
  await page.goto('/');

  // Rule 1: the name in `index.html`, the string the landing page's app list shows. Red when the title
  // changes, because the h1 assertions read the shell, not the title.
  await expect(page, 'the name in the document title').toHaveTitle(TITLE);

  // Rule 2: the name in the shell's h1, the h1 the sign-in view shows. Red when the name is renamed.
  await expect(page.getByRole('heading', { level: 1 }), 'the name in the sign-in view').toHaveText(
    TITLE,
  );

  // Rule 3: in the signed-in view the level-1 heading is still the shell's one, because the app content adds
  // no heading of its own (024 UX §1). Red when the app content adds a heading or the shell stops showing
  // its h1 after sign-in, never when the name is renamed.
  await page.getByRole('button', { name: 'Sign in as guest' }).click();
  await expect(page.getByRole('form', { name: 'Eingaben' })).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 1 }),
    'the level-1 heading in the signed-in view is the shell h1',
  ).toHaveCount(1);
});

test('AC2: the intro is the first text before the form, the direction group names what is searched, and the phase labels name the months', async ({
  page,
}) => {
  await open(page);

  // Rule 1: the intro is there with the copy that names the ladder and both directions. Red when the copy
  // changes; it still passes when the paragraph only moves.
  const main = page.getByRole('main');
  const intro = main.locator('p').filter({ hasText: INTRO });
  await expect(intro, 'the intro copy is shown once').toHaveCount(1);

  // Rule 2: it is the first text before the form. Red only when it stands after the form.
  const firstBeforeForm = await intro.first().evaluate((el) => {
    const root = el.closest('main');
    const firstText = root?.querySelector('p');
    const form = root?.querySelector('form');
    if (!firstText || !form) return false;
    return (
      (firstText.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 &&
      firstText === el
    );
  });
  await expect(firstBeforeForm, 'the intro is the first text, before the form').toBe(true);

  // Rule 3: the group names what is given and what is searched.
  await expect(
    page.getByRole('group', { name: LEGEND, exact: true }),
    'the direction group names what is searched',
  ).toBeVisible();

  // Rule 4 and rule 5: its radios are the labels it names, and the direction the AC reads is the checked one.
  await expect(page.getByRole('radio', { name: DEPOT_RADIO, exact: true })).toBeChecked();
  await expect(page.getByRole('radio', { name: PAYOUT_RADIO, exact: true })).toBeVisible();

  // Rule 6: the phase labels are sentences naming the first and the last month, so the field is found by
  // that name. Red when a label is renamed, not when the hint changes.
  await expect(page.getByLabel('Erster Monat der Auszahlungsphase', { exact: true })).toBeVisible();

  // Rule 7: the hint says what to type (UX §2). Red when the shape disappears from it.
  const hint = await page
    .getByLabel('Erster Monat der Auszahlungsphase', { exact: true })
    .evaluate(
      (input) =>
        document.getElementById(input.getAttribute('aria-describedby') ?? '')?.textContent ?? '',
    );
  await expect(hint, 'the hint is what to type').toContain('MM.JJJJ');

  // Rule 8: and it does not repeat the label, so label and hint do not say the same thing twice.
  await expect(hint, 'the hint does not repeat the label').not.toContain(
    'Erster Monat der Auszahlungsphase',
  );
});

test('AC3: the shared rule appears once as the footnote below the table, and no cell repeats it', async ({
  page,
}) => {
  await open(page);
  const section = fundSection(page);
  const table = fundTable(page);

  // Rule 1: the rule is shown once, in the section's own paragraph, with the copy that names both units and
  // their decimals. Red when that paragraph is removed or its copy changes.
  const footnote = section.locator(':scope > p').filter({ hasText: FOOTNOTE });
  await expect(
    footnote,
    'the rule is shown once, as the paragraph that belongs to the section',
  ).toHaveCount(1);

  // Rule 2: it is the paragraph below the table. Red only when it moves above the table, never when a cell
  // prints the rule again (rule 3).
  const afterTable = await footnote.first().evaluate((el) => {
    const root = el.closest('section');
    const table = root?.querySelector('table');
    if (table === null || table === undefined) return false;
    return (
      (table.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_CONTAINED_BY) === 0 &&
      (table.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    );
  });
  await expect(afterTable, 'the footnote stands below the table').toBe(true);

  // Rule 3, paired with rule 1: no cell carries the rule as its own text. The fixture has nine fund rows, so
  // fourteen cells printed it before this story (024 UX §2).
  await expect(table.locator('td p'), 'no cell repeats the rule').toHaveCount(0);

  // Rule 4: each input keeps its own accessible name of field and year, which a column header cannot carry.
  const nav2030 = fundInput(page, 'nav', 2030);
  await expect(nav2030, 'the cell keeps its name of field and year').toHaveAccessibleName(
    'Kurs in Euro für Jahr 2030',
  );

  // Rule 5: the description of an override cell is the marker alone, not the shared rule (024 AC5).
  // Triggered by text that differs from the value the cell shows: the fixture's 2030 Kurs cell shows `42`,
  // so 41,00 marks it (P16).
  await nav2030.fill('41,00');
  await expect(nav2030, 'the description is the marker alone').toHaveAccessibleDescription(
    'Wert vom Nutzer eingegeben',
  );

  // Rule 6: the other column keeps its own name, and its error still states the rule of its unit
  // (030 AC3), which the footnote now carries once.
  const ytm2030 = fundInput(page, 'ytm', 2030);
  await expect(ytm2030, 'the YTM cell keeps its name').toHaveAccessibleName(
    'YTM in Prozent für Jahr 2030',
  );
  await ytm2030.fill('abc');
  await expect(ytm2030, 'the error states the rule of the unit').toHaveAccessibleDescription(
    'YTM in Prozent für Jahr 2030: keine gültige Zahl. Erlaubt: -100,00 bis 100,00 %.',
  );
});
