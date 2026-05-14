import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { AwardsContentList } from '@/components/organisms/awards/AwardsContentList';
import { awards } from '@/lib/awards/config';
import viMessages from '@/messages/vi.json';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<AwardsContentList>', () => {
  it('renders all 6 award sections in catalogue order', () => {
    const { container } = render(wrap(<AwardsContentList />));
    const sections = container.querySelectorAll('section[id]');
    expect(sections).toHaveLength(awards.length);
    const ids = Array.from(sections).map((s) => s.getAttribute('id'));
    expect(ids).toEqual(awards.map((a) => a.slug));
  });

  it('every section has an aria-labelledby pointing to its heading id', () => {
    const { container } = render(wrap(<AwardsContentList />));
    container.querySelectorAll('section[id]').forEach((section) => {
      const id = section.getAttribute('id');
      expect(section).toHaveAttribute('aria-labelledby', `${id}-heading`);
    });
  });
});
