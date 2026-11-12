// The data the page gets from the repository at build time (story 021, ADR 0011). Shared by the
// node glue (build/landingData.ts) and the components.
export interface PublishedApp {
  readonly name: string; // directory under apps/, link `${BASE_URL}${name}/`
  readonly title: string; // <title> of apps/<name>/index.html
}
export interface BacklogFigures {
  readonly storiesDone: number; // rows of docs/backlog/README.md with status "done"
}
export interface CostFigures {
  readonly agentRuns: number; // run rows of the Cost tables of the done stories
}
export interface LandingData {
  readonly apps: readonly PublishedApp[];
  readonly asOf: string | null; // HEAD commit date YYYY-MM-DD; null → no derived figure shown
  readonly backlog: BacklogFigures | null; // null when the index is missing
  readonly cost: CostFigures | null; // null when no done story has a Cost table
}
