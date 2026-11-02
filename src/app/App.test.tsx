import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../features/auth/AuthProvider.tsx';
import {
  createFakeAuthClient,
  type FakeAuthClient,
} from '../features/auth/fake/createFakeAuthClient.ts';
import { App } from './App.tsx';

const CANCELLED = 'Google sign-in was cancelled. You can try again.';
const FAILED = 'Google sign-in failed. Please try again.';
const PROGRESS = 'Signing in with Google…';

function renderApp(fake: FakeAuthClient = createFakeAuthClient()) {
  const view = render(
    <AuthProvider client={fake}>
      <App />
    </AuthProvider>,
  );
  return { ...view, fake, user: userEvent.setup() };
}

async function settle(fake: FakeAuthClient, outcome: 'success' | 'cancelled' | 'error') {
  await act(async () => {
    fake.control.settleSignIn(outcome);
  });
}

const signInButton = () => screen.getByRole('button', { name: 'Sign in with Google' });

function expectLoginView() {
  expect(screen.getByRole('heading', { level: 1, name: 'Software Factory' })).toBeInTheDocument();
  expect(signInButton()).toBeEnabled();
  expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument();
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('App', () => {
  it('AC1: opens on the login screen with no signed-in state and no message', () => {
    renderApp();
    expectLoginView();
    expect(screen.getByText('Use your Google account to sign in.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(CANCELLED)).not.toBeInTheDocument();
    expect(screen.queryByText(PROGRESS)).not.toBeInTheDocument();
  });

  it('AC1: page load does not move focus', () => {
    renderApp();
    expect(document.body).toHaveFocus();
  });

  it('AC3: shows progress and disables the button while signing in', async () => {
    const { user } = renderApp();
    await user.click(signInButton());
    expect(signInButton()).toBeDisabled();
    expect(screen.getByText(PROGRESS)).toBeInTheDocument();
  });

  it('AC2: shows the name in the header after a successful sign-in and hides the login screen', async () => {
    const { user, fake } = renderApp();
    await user.click(signInButton());
    await settle(fake, 'success');
    expect(screen.getByRole('banner')).toHaveTextContent('Signed in as Ada Lovelace');
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign in with Google' })).not.toBeInTheDocument();
    expect(screen.queryByText('Use your Google account to sign in.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Software Factory' })).toBeInTheDocument();
  });

  it('AC2: moves focus to the identity after a successful sign-in', async () => {
    const { user, fake } = renderApp();
    await user.click(signInButton());
    await settle(fake, 'success');
    expect(screen.getByText(/Signed in as/)).toHaveFocus();
  });

  it('AC11: shows the email when Google provides no name', async () => {
    const fake = createFakeAuthClient();
    fake.control.setAccount({ sub: 'x', email: 'noname@example.com' });
    const { user } = renderApp(fake);
    await user.click(signInButton());
    await settle(fake, 'success');
    expect(screen.getByRole('banner')).toHaveTextContent('Signed in as noname@example.com');
    expect(screen.getByText('noname@example.com')).toBeInTheDocument();
  });

  it('AC4: stays on the login screen with the cancelled message and an enabled button', async () => {
    const { user, fake } = renderApp();
    await user.click(signInButton());
    await settle(fake, 'cancelled');
    expectLoginView();
    expect(screen.getByText(CANCELLED)).toBeInTheDocument();
    expect(screen.queryByText(PROGRESS)).not.toBeInTheDocument();
    expect(signInButton()).toHaveFocus();
  });

  it('AC5: stays on the login screen with the error alert and an enabled button', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { user, fake } = renderApp();
    await user.click(signInButton());
    await settle(fake, 'error');
    expectLoginView();
    expect(screen.getByRole('alert')).toHaveTextContent(FAILED);
    expect(signInButton()).toHaveFocus();
  });

  it('AC6: a successful retry after an error shows the signed-in state and no message', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { user, fake } = renderApp();
    await user.click(signInButton());
    await settle(fake, 'error');
    await user.click(signInButton());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await settle(fake, 'success');
    expect(screen.getByRole('banner')).toHaveTextContent('Signed in as Ada Lovelace');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(FAILED)).not.toBeInTheDocument();
    expect(screen.queryByText(CANCELLED)).not.toBeInTheDocument();
  });

  it('AC6: a successful retry after a cancel shows no cancelled message', async () => {
    const { user, fake } = renderApp();
    await user.click(signInButton());
    await settle(fake, 'cancelled');
    await user.click(signInButton());
    expect(screen.queryByText(CANCELLED)).not.toBeInTheDocument();
    await settle(fake, 'success');
    expect(screen.queryByText(CANCELLED)).not.toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('AC9: sign out shows the login screen without a message and focuses the sign-in button', async () => {
    const { user, fake } = renderApp();
    await user.click(signInButton());
    await settle(fake, 'success');
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expectLoginView();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(CANCELLED)).not.toBeInTheDocument();
    expect(signInButton()).toHaveFocus();
  });

  it('AC10: after sign-out a reload (fresh mount) shows the login screen, not signed in', async () => {
    const { user, fake, unmount } = renderApp();
    await user.click(signInButton());
    await settle(fake, 'success');
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    unmount();

    renderApp(createFakeAuthClient());
    expectLoginView();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('App: probing beyond the ACs', () => {
  it('keyboard only: Enter signs in, Tab reaches Sign out, Enter signs out, Space signs in again', async () => {
    const { user, fake } = renderApp();
    await user.tab();
    expect(signInButton()).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(signInButton()).toBeDisabled();
    await settle(fake, 'success');
    expect(screen.getByText(/Signed in as/)).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Sign out' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expectLoginView();
    expect(signInButton()).toHaveFocus();

    await user.keyboard(' ');
    expect(screen.getByText(PROGRESS)).toBeInTheDocument();
    await settle(fake, 'success');
    expect(screen.getByRole('banner')).toHaveTextContent('Signed in as Ada Lovelace');
  });

  it('AC9: after sign-out a new sign-in shows the new account, not the previous one', async () => {
    const { user, fake } = renderApp();
    await user.click(signInButton());
    await settle(fake, 'success');
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    fake.control.setAccount({ sub: 'g', email: 'grace@example.com', name: 'Grace Hopper' });
    await user.click(signInButton());
    await settle(fake, 'success');
    expect(screen.getByRole('banner')).toHaveTextContent('Signed in as Grace Hopper');
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
  });

  it('AC9: the game state does not survive a sign-out', async () => {
    const { user, fake } = renderApp();
    await user.click(signInButton());
    await settle(fake, 'success');
    await user.clear(screen.getByLabelText('Rows'));
    await user.type(screen.getByLabelText('Rows'), '12');
    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByRole('grid', { name: 'Minesweeper board' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    await user.click(signInButton());
    await settle(fake, 'success');
    expect(screen.getByLabelText('Rows')).toHaveValue('9');
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('rapid repeated failures never leave the button disabled or stack messages', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { user, fake } = renderApp();
    for (const outcome of ['error', 'cancelled', 'error', 'cancelled'] as const) {
      await user.click(signInButton());
      expect(signInButton()).toBeDisabled();
      await settle(fake, outcome);
      expect(signInButton()).toBeEnabled();
      expect(screen.queryAllByRole('alert')).toHaveLength(outcome === 'error' ? 1 : 0);
      expect(screen.queryAllByText(CANCELLED)).toHaveLength(outcome === 'cancelled' ? 1 : 0);
    }
  });

  it('renders a hostile name as text, not markup', async () => {
    const fake = createFakeAuthClient();
    const name = '<img src=x onerror=alert(1)> <b>bold</b>';
    fake.control.setAccount({ sub: 'x', email: 'x@example.com', name });
    const { user } = renderApp(fake);
    await user.click(signInButton());
    await settle(fake, 'success');
    expect(screen.getByText(name)).toBeInTheDocument();
    expect(document.querySelector('header img, header b')).toBeNull();
  });

  it('a whitespace-only name falls back to the email (AC11)', async () => {
    const fake = createFakeAuthClient();
    fake.control.setAccount({ sub: 'x', email: 'blank@example.com', name: '   ' });
    const { user } = renderApp(fake);
    await user.click(signInButton());
    await settle(fake, 'success');
    expect(screen.getByRole('banner')).toHaveTextContent('Signed in as blank@example.com');
  });

  it('the login view keeps one persistent aria-live region across all states', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { user, fake, container } = renderApp();
    const region = container.querySelector('[aria-live="polite"]');
    expect(region).not.toBeNull();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await user.click(signInButton());
    expect(container.querySelector('[aria-live="polite"]')).toBe(region);
    expect(region).toHaveTextContent(PROGRESS);
    await settle(fake, 'cancelled');
    expect(container.querySelector('[aria-live="polite"]')).toBe(region);
    expect(region).toHaveTextContent(CANCELLED);
  });
});
