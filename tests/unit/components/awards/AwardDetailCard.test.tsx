import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { AwardDetailCard } from '@/components/organisms/awards/AwardDetailCard';
import { awards } from '@/lib/awards/config';
import { awardDetails } from '@/lib/awards/details';
import viMessages from '@/messages/vi.json';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const topTalent = awards[0];
const topTalentDetail = awardDetails['top-talent'];

describe('<AwardDetailCard>', () => {
  it('wraps content in a <section id={slug}> matching the slug', () => {
    const { container } = render(
      wrap(<AwardDetailCard award={topTalent} detail={topTalentDetail} />),
    );
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('id', 'top-talent');
    expect(section).toHaveAttribute('aria-labelledby', 'top-talent-heading');
  });

  it('renders the localized title as <h2> with matching id', () => {
    render(wrap(<AwardDetailCard award={topTalent} detail={topTalentDetail} />));
    const heading = screen.getByRole('heading', {
      level: 2,
      name: viMessages.homepage.awards.list.topTalent.title,
    });
    expect(heading).toHaveAttribute('id', 'top-talent-heading');
  });

  it('renders the long description from i18n', () => {
    render(wrap(<AwardDetailCard award={topTalent} detail={topTalentDetail} />));
    expect(screen.getByText(viMessages.awardsPage.longDescription.topTalent)).toBeInTheDocument();
  });

  it('renders the quantity row (label + number + unit)', () => {
    render(wrap(<AwardDetailCard award={topTalent} detail={topTalentDetail} />));
    expect(screen.getByText(viMessages.awardsPage.quantityLabel)).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Đơn vị')).toBeInTheDocument();
  });

  it('renders the value row (label + amount + per-award suffix when unit is set)', () => {
    render(wrap(<AwardDetailCard award={topTalent} detail={topTalentDetail} />));
    expect(screen.getByText(viMessages.awardsPage.valueLabel)).toBeInTheDocument();
    expect(screen.getByText('7.000.000 VNĐ')).toBeInTheDocument();
    expect(screen.getByText(viMessages.awardsPage.perAwardSuffix)).toBeInTheDocument();
  });

  it('omits the unit + per-award suffix for Signature 2025 (no unit category)', () => {
    const signature = awards.find((a) => a.slug === 'signature-2025-creator');
    const signatureDetail = awardDetails['signature-2025-creator'];
    if (!signature) throw new Error('signature award not found');
    const { container } = render(
      wrap(<AwardDetailCard award={signature} detail={signatureDetail} />),
    );
    // No "Đơn vị" / "Tập thể" / "Cá nhân" label in the rendered output.
    expect(container.textContent).not.toMatch(/Đơn vị|Tập thể|Cá nhân/);
    // And no per-award suffix shown for unit-less awards.
    expect(container.textContent).not.toContain(viMessages.awardsPage.perAwardSuffix);
  });

  it('image alt text is empty (decorative — title carries meaning)', () => {
    const { container } = render(
      wrap(<AwardDetailCard award={topTalent} detail={topTalentDetail} />),
    );
    const imgs = container.querySelectorAll('img');
    imgs.forEach((img) => {
      expect(img).toHaveAttribute('alt', '');
    });
  });
});
