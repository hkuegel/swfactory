// The static texts of the page (story 021, UX design §2). Figures counted in the repository are not
// here: they come from `virtual:landing-data`.

export const REPOSITORY_URL = 'https://github.com/hkuegel/swfactory';

export interface PageSection {
  readonly id: string; // id of the section; the nav links to `#id`
  readonly nav: string; // link text in the page navigation
  readonly heading: string; // the section's level-2 heading
}

export const SECTIONS = {
  why: { id: 'why', nav: 'Why', heading: 'Why a factory' },
  how: { id: 'how', nav: 'How it works', heading: 'How it works' },
  quality: { id: 'quality', nav: 'Quality', heading: 'How quality is kept' },
  result: { id: 'result', nav: 'Result', heading: 'The result' },
} as const satisfies Record<string, PageSection>;

export interface WhyCard {
  readonly title: string;
  readonly text: string;
  readonly source?: string | undefined; // whose idea or figure the card uses
}

export const WHY_CARDS: readonly WhyCard[] = [
  {
    title: 'Generation scales',
    text: 'An agent writes a feature, its tests and its docs in minutes.',
  },
  {
    title: 'Verification does not',
    text: 'Review and testing set the limit. Give an agent only the autonomy you can check cheaply.',
    source: 'Source: Addy Osmani, 2026',
  },
  {
    title: 'Collaboration is hard',
    text: 'In the CooperBench benchmark, two agents together succeeded about 30% less often than alone.',
    source: 'Source: Khatua et al., 2026',
  },
];

export interface PipelineStep {
  readonly id: string; // stable, used for element ids
  readonly kind: 'step' | 'gate';
  readonly label: string;
  readonly role: string; // who owns the step; the gates name no person
  readonly output: string; // what the step produces
}

/** The steps in process order, both human gates included. */
export const PIPELINE: readonly PipelineStep[] = [
  {
    id: 'story',
    kind: 'step',
    label: 'Story',
    role: 'Product owner',
    output: 'Idea becomes acceptance criteria',
  },
  {
    id: 'gate-1',
    kind: 'gate',
    label: 'Gate 1',
    role: 'Sponsor (human)',
    output: 'Approves the story',
  },
  {
    id: 'design',
    kind: 'step',
    label: 'Design',
    role: 'Architect, UX designer',
    output: 'Technical and UX design',
  },
  { id: 'build', kind: 'step', label: 'Build', role: 'Developer', output: 'Code and unit tests' },
  { id: 'test', kind: 'step', label: 'Test', role: 'Tester', output: 'Proof for every criterion' },
  { id: 'review', kind: 'step', label: 'Review', role: 'Reviewer', output: 'Checklist verdict' },
  { id: 'docs', kind: 'step', label: 'Docs', role: 'Tech writer', output: 'README and changelog' },
  {
    id: 'retro',
    kind: 'step',
    label: 'Retro',
    role: 'Orchestrator',
    output: 'Explanation and rule proposals',
  },
  {
    id: 'gate-2',
    kind: 'gate',
    label: 'Gate 2',
    role: 'Sponsor (human)',
    output: 'Approves result and rule changes',
  },
];

export interface QualityLayer {
  readonly label: string;
  readonly text: string;
}

export const QUALITY_LAYERS: readonly QualityLayer[] = [
  {
    label: 'Automated checks',
    text: 'Types, lint, tests, build and a check that dev-only code never ships.',
  },
  { label: 'Tests', text: 'One test per acceptance criterion, checked on the real output.' },
  { label: 'Review checklist', text: 'A versioned checklist, every item reported.' },
  { label: 'Human gates', text: 'Two per story: the plan and the result.' },
];

/** Not counted in the repository: static text that carries the word "estimate" and its date. */
export const COST_ESTIMATE = {
  figure: 'about 20 €',
  label:
    'estimate (2026-11-09): token cost of a five-story calculator app at API list prices, order of magnitude',
} as const;
