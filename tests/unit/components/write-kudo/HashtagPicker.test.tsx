import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { HashtagPicker } from '@/components/molecules/write-kudo/HashtagPicker';
import { HASHTAG_SUGGESTIONS } from '@/lib/kudos/mock';
import { KUDO_MAX_HASHTAGS } from '@/lib/kudos/types';
import viMessages from '@/messages/vi.json';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<HashtagPicker>', () => {
  it('renders the localized label and add button when below the cap', () => {
    render(
      wrap(<HashtagPicker suggestions={HASHTAG_SUGGESTIONS} value={[]} onChange={() => {}} />),
    );
    expect(screen.getAllByText('Hashtag').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Hashtag/ })).toBeInTheDocument();
  });

  it('opens the suggestion list and selects a tag on click', async () => {
    const onChange = vi.fn();
    render(
      wrap(<HashtagPicker suggestions={HASHTAG_SUGGESTIONS} value={[]} onChange={onChange} />),
    );
    await userEvent.click(screen.getByRole('button', { name: /Hashtag/ }));
    const teamwork = await screen.findByRole('option', { name: /TeamWork/ });
    await userEvent.click(teamwork);
    expect(onChange).toHaveBeenCalledWith(['teamwork']);
  });

  it('removes a selected tag via its remove button', async () => {
    const onChange = vi.fn();
    render(
      wrap(
        <HashtagPicker
          suggestions={HASHTAG_SUGGESTIONS}
          value={['teamwork']}
          onChange={onChange}
        />,
      ),
    );
    await userEvent.click(screen.getByRole('button', { name: /Xóa #TeamWork/ }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('hides the add button when at max capacity', () => {
    const value = HASHTAG_SUGGESTIONS.slice(0, KUDO_MAX_HASHTAGS).map((h) => h.slug);
    render(
      wrap(<HashtagPicker suggestions={HASHTAG_SUGGESTIONS} value={value} onChange={() => {}} />),
    );
    expect(screen.queryByRole('button', { name: /^Hashtag/ })).not.toBeInTheDocument();
  });

  it('renders an error message when provided', () => {
    render(
      wrap(
        <HashtagPicker
          suggestions={HASHTAG_SUGGESTIONS}
          value={[]}
          onChange={() => {}}
          error="Chọn ít nhất 1 hashtag."
        />,
      ),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Chọn ít nhất 1 hashtag.');
  });
});
