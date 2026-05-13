import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { AwardCard } from '@/components/organisms/homepage/AwardCard';
import viMessages from '@/messages/vi.json';
import { awards } from '@/lib/awards/config';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const topTalent = awards[0];

describe('<AwardCard>', () => {
  it('wraps the whole card in a single Link to /awards#{slug} (FR-013)', () => {
    const { container } = render(wrap(<AwardCard award={topTalent} />));
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/awards#top-talent');
  });

  it('renders the localized title from i18n keys', () => {
    render(wrap(<AwardCard award={topTalent} />));
    expect(screen.getByText(viMessages.homepage.awards.list.topTalent.title)).toBeInTheDocument();
  });

  it('renders the localized description with line-clamp-2 (C2.1.3 ellipsis)', () => {
    const { container } = render(wrap(<AwardCard award={topTalent} />));
    const desc = container.querySelector('p.line-clamp-2');
    expect(desc).toBeInTheDocument();
    expect(desc).toHaveTextContent(viMessages.homepage.awards.list.topTalent.description);
  });

  it('renders the "Chi tiết" affordance with arrow icon', () => {
    const { container, getByText } = render(wrap(<AwardCard award={topTalent} />));
    expect(getByText(viMessages.homepage.awards.detailLink)).toBeInTheDocument();
    expect(
      container.querySelector('img[src="/assets/homepage/icons/arrow-up-right.svg"]'),
    ).toBeInTheDocument();
  });

  it('renders the award name image with the localized title as alt-text', () => {
    // `next/image` rewrites the `src` in jsdom (image optimization), so match
    // on alt-text instead — the alt-text is the contract we care about.
    render(wrap(<AwardCard award={topTalent} />));
    const nameImg = screen.getByAltText(viMessages.homepage.awards.list.topTalent.title);
    expect(nameImg.tagName.toLowerCase()).toBe('img');
  });

  it('exposes the link with an accessible name combining title + detail label', () => {
    const { container } = render(wrap(<AwardCard award={topTalent} />));
    const link = container.querySelector('a');
    expect(link).toHaveAttribute(
      'aria-label',
      expect.stringContaining(viMessages.homepage.awards.list.topTalent.title),
    );
    expect(link?.getAttribute('aria-label')).toContain(viMessages.homepage.awards.detailLink);
  });
});
