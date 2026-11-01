import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginView } from './LoginView.tsx';

const PROGRESS = 'Signing in with Google…';
const CANCELLED = 'Google sign-in was cancelled. You can try again.';
const FAILED = 'Google sign-in failed. Please try again.';

describe('LoginView', () => {
  it('AC1: idle shows the intro and an enabled button, and no message', () => {
    const { container } = render(
      <LoginView inProgress={false} notice={null} onSignIn={() => undefined} />,
    );
    expect(screen.getByText('Use your Google account to sign in.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeEnabled();
    expect(screen.queryByText(PROGRESS)).not.toBeInTheDocument();
    expect(screen.queryByText(CANCELLED)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-live="polite"]')).toBeEmptyDOMElement();
  });

  it('AC1: "Sign in with Google" appears only on the button', () => {
    render(<LoginView inProgress notice={null} onSignIn={() => undefined} />);
    expect(screen.getAllByText('Sign in with Google')).toHaveLength(1);
    expect(screen.getByText('Sign in with Google').closest('button')).not.toBeNull();
  });

  it('AC2: calls onSignIn when the button is chosen', async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    render(<LoginView inProgress={false} notice={null} onSignIn={onSignIn} />);
    await user.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('AC3: in progress shows the progress text in the live region and disables the button', () => {
    render(<LoginView inProgress notice={null} onSignIn={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeDisabled();
    const progress = screen.getByText(PROGRESS);
    expect(progress.closest('[aria-live="polite"]')).not.toBeNull();
  });

  it('AC3/AC6: in progress hides a previous notice', () => {
    render(<LoginView inProgress notice="error" onSignIn={() => undefined} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(FAILED)).not.toBeInTheDocument();
  });

  it('AC4: cancelled shows the cancelled message in the live region and an enabled button', () => {
    render(<LoginView inProgress={false} notice="cancelled" onSignIn={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeEnabled();
    const message = screen.getByText(CANCELLED);
    expect(message.closest('[aria-live="polite"]')).not.toBeNull();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('AC5: error shows the error message as an alert and an enabled button', () => {
    render(<LoginView inProgress={false} notice="error" onSignIn={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeEnabled();
    expect(screen.getByRole('alert')).toHaveTextContent(FAILED);
  });

  it('AC4/AC5: message icons are decorative', () => {
    const { container } = render(
      <LoginView inProgress={false} notice="error" onSignIn={() => undefined} />,
    );
    const icon = container.querySelector('[role="alert"] svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});
