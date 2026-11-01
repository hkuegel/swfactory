import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SignedInHeader } from './SignedInHeader.tsx';

describe('SignedInHeader', () => {
  it('AC2: shows "Signed in as" with the name in its own element inside the banner', () => {
    render(<SignedInHeader displayName="Jane Doe" onSignOut={() => undefined} />);
    const banner = screen.getByRole('banner');
    expect(banner).toHaveTextContent('Signed in as Jane Doe');
    expect(screen.getByText('Jane Doe').tagName).toBe('SPAN');
  });

  it('AC11: shows whatever display name it gets, e.g. an email address', () => {
    render(<SignedInHeader displayName="jane@example.com" onSignOut={() => undefined} />);
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('AC2: the identity paragraph is focusable by script but not a tab stop', () => {
    render(<SignedInHeader displayName="Jane Doe" onSignOut={() => undefined} />);
    const identity = screen.getByText(/Signed in as/);
    expect(identity).toHaveAttribute('id', 'identity');
    expect(identity).toHaveAttribute('tabindex', '-1');
  });

  it('AC9: calls onSignOut when "Sign out" is chosen', async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    render(<SignedInHeader displayName="Jane Doe" onSignOut={onSignOut} />);
    const button = screen.getByRole('button', { name: 'Sign out' });
    expect(button).toHaveAttribute('type', 'button');
    await user.click(button);
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
