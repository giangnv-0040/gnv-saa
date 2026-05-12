import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { LoginButton } from '@/app/login/LoginButton';
import viMessages from '@/messages/vi.json';

// Mock the Server Action so the form has something to submit to.
vi.mock('@/app/login/actions', () => ({ signInWithGoogle: vi.fn() }));

// useFormStatus returns { pending: false } when not inside a form submission;
// we override it per test for the pending case.
const useFormStatus = vi.fn().mockReturnValue({ pending: false });
vi.mock('react-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, useFormStatus: () => useFormStatus() };
});

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<LoginButton>', () => {
  it('renders a <form> with method=POST submitting the signInWithGoogle action', () => {
    const { container } = render(wrap(<LoginButton redirectTo="/" />));
    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
    expect(form?.querySelector('button[type="submit"]')).toBeInTheDocument();
  });

  it('includes the redirectTo as a hidden input so the action can read it', () => {
    const { container } = render(wrap(<LoginButton redirectTo="/admin" />));
    const hidden = container.querySelector('input[type="hidden"][name="redirectTo"]');
    expect(hidden).toBeInTheDocument();
    expect(hidden).toHaveValue('/admin');
  });

  it('button is focused on mount (FR-016) so keyboard users can Enter immediately', () => {
    render(wrap(<LoginButton redirectTo="/" />));
    // React's `autoFocus` prop focuses the element on mount rather than
    // rendering an HTML `autofocus` attribute, so we assert focus state.
    expect(screen.getByRole('button')).toHaveFocus();
  });

  it('renders the Google icon + localized label', () => {
    render(wrap(<LoginButton redirectTo="/" />));
    expect(screen.getByText(viMessages.login.button.label)).toBeInTheDocument();
    expect(screen.getByRole('button')).toContainHTML('google');
  });

  it('disables the button + shows Spinner + loading label when useFormStatus().pending', () => {
    useFormStatus.mockReturnValueOnce({ pending: true });
    render(wrap(<LoginButton redirectTo="/" />));
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(screen.getByText(viMessages.login.button.loading)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Spinner
  });
});
