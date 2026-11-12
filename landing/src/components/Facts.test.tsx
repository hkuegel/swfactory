import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Facts } from './Facts.tsx';

const BACKLOG = { storiesDone: 1234 };
const COST = { agentRuns: 116 };

describe('Facts', () => {
  it('AC8: shows each derived figure with what it counts and the date it was counted on', () => {
    render(<Facts asOf="2026-11-12" backlog={BACKLOG} cost={COST} />);
    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'stories done',
      'agent runs recorded in cost tables',
      expect.stringMatching(/^estimate \(\d{4}-\d{2}-\d{2}\)/),
    ]);
    expect(screen.getAllByRole('definition').map((figure) => figure.textContent)).toEqual([
      '1,234',
      '116',
      'about 20 €',
    ]);
    expect(screen.getByText('Counted in the repository on 2026-11-12.')).toBeInTheDocument();
  });

  it('AC8: without a date no derived figure is rendered; the estimate stays', () => {
    render(<Facts asOf={null} backlog={BACKLOG} cost={COST} />);
    expect(screen.getAllByRole('term')).toHaveLength(1);
    expect(screen.getByRole('term')).toHaveTextContent(/^estimate \(2026-11-09\)/);
    expect(screen.getByRole('definition')).toHaveTextContent('about 20 €');
    expect(screen.queryByText(/Counted in the repository/)).not.toBeInTheDocument();
  });

  it('AC8: without cost tables the cost figure is not rendered; the others stay', () => {
    render(<Facts asOf="2026-11-12" backlog={BACKLOG} cost={null} />);
    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'stories done',
      expect.stringMatching(/^estimate /),
    ]);
    expect(screen.queryByText(/agent runs/)).not.toBeInTheDocument();
    expect(screen.getByText('Counted in the repository on 2026-11-12.')).toBeInTheDocument();
  });
});
