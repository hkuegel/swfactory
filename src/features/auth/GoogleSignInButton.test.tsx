import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GoogleSignInButton } from './GoogleSignInButton.tsx';

describe('GoogleSignInButton', () => {
  it('AC1: is a native button whose accessible name is exactly "Sign in with Google"', () => {
    render(<GoogleSignInButton disabled={false} onClick={() => undefined} />);
    const button = screen.getByRole('button', { name: 'Sign in with Google' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toBeEnabled();
  });

  it('AC1: hides the Google logo from assistive technology', () => {
    const { container } = render(<GoogleSignInButton disabled={false} onClick={() => undefined} />);
    const logo = container.querySelector('svg');
    expect(logo).toHaveAttribute('aria-hidden', 'true');
    expect(logo).toHaveAttribute('focusable', 'false');
  });

  it('AC2: calls onClick when activated by click, Enter or Space', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<GoogleSignInButton disabled={false} onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('AC3: is disabled and does not call onClick while disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<GoogleSignInButton disabled onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Sign in with Google' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
