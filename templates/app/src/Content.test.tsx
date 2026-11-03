import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Content } from './Content.tsx';

describe('Content', () => {
  it('renders the labelled placeholder region', () => {
    render(<Content />);
    expect(screen.getByRole('region', { name: '__TITLE__ content' })).toBeInTheDocument();
  });
});
