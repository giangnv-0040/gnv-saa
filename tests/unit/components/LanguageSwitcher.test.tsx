import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { LanguageSwitcher } from '@/components/molecules/LanguageSwitcher';
import viMessages from '@/messages/vi.json';

const setLocale = vi.fn();
vi.mock('@/lib/i18n/actions', () => ({ setLocale: (...args: unknown[]) => setLocale(...args) }));

function wrap(ui: React.ReactNode, locale: 'vi' | 'en' | 'ja' = 'vi') {
  return (
    <NextIntlClientProvider locale={locale} messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  setLocale.mockReset();
});

describe('<LanguageSwitcher>', () => {
  it('renders the active locale as the trigger label', () => {
    render(wrap(<LanguageSwitcher currentLocale="vi" />));
    const trigger = screen.getByRole('button', { name: viMessages.language.switcher.ariaLabel });
    expect(trigger).toHaveTextContent('VN');
  });

  it('the dropdown panel is collapsed by default', () => {
    render(wrap(<LanguageSwitcher currentLocale="vi" />));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('opens on click and exposes 3 options', async () => {
    render(wrap(<LanguageSwitcher currentLocale="vi" />));
    await userEvent.click(screen.getByRole('button'));
    const listbox = screen.getByRole('listbox');
    const options = screen.getAllByRole('option');
    expect(listbox).toBeInTheDocument();
    expect(options).toHaveLength(3);
  });

  it('marks the current locale with aria-current="true"', async () => {
    render(wrap(<LanguageSwitcher currentLocale="en" />));
    await userEvent.click(screen.getByRole('button'));
    const en = screen.getByRole('option', { name: /english/i });
    expect(en).toHaveAttribute('aria-current', 'true');
  });

  it('closes on Escape', async () => {
    render(wrap(<LanguageSwitcher currentLocale="vi" />));
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('closes on outside click', async () => {
    render(
      wrap(
        <div>
          <LanguageSwitcher currentLocale="vi" />
          <button data-testid="outside">Outside</button>
        </div>,
      ),
    );
    await userEvent.click(
      screen.getByRole('button', { name: viMessages.language.switcher.ariaLabel }),
    );
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('outside'));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('calls setLocale and closes when an item is selected', async () => {
    render(wrap(<LanguageSwitcher currentLocale="vi" />));
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByRole('option', { name: /english/i }));
    expect(setLocale).toHaveBeenCalledWith('en');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('supports keyboard navigation (ArrowDown moves focus through options)', async () => {
    render(wrap(<LanguageSwitcher currentLocale="vi" />));
    await userEvent.click(screen.getByRole('button'));
    const options = screen.getAllByRole('option');
    // The first option should receive focus when the listbox opens.
    expect(options[0]).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(options[1]).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(options[2]).toHaveFocus();
    // Wraps to start.
    await userEvent.keyboard('{ArrowDown}');
    expect(options[0]).toHaveFocus();
  });
});
