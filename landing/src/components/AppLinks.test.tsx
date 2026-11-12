import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppLinks } from './AppLinks.tsx';

describe('AppLinks', () => {
  it('U5: with no app published it shows the "no apps" text and no list', () => {
    render(<AppLinks apps={[]} />);
    expect(screen.getByText('No apps published yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
