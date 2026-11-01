import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Counter } from './Counter.tsx';

describe('Counter', () => {
  it('starts at zero', () => {
    render(<Counter />);
    expect(screen.getByRole('button', { name: 'Clicked 0 times' })).toBeInTheDocument();
  });

  it('increments on click', async () => {
    const user = userEvent.setup();
    render(<Counter />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button', { name: 'Clicked 1 time' })).toBeInTheDocument();
  });
});
