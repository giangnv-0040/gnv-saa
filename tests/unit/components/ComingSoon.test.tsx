import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ComingSoon } from '@/components/organisms/ComingSoon';
import viMessages from '@/messages/vi.json';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<ComingSoon>', () => {
  it('renders the screen name passed as prop', () => {
    const { getByText } = render(wrap(<ComingSoon screenName="My Screen" />));
    expect(getByText('My Screen')).toBeInTheDocument();
  });

  it('renders localized title + message', () => {
    const { getByText } = render(wrap(<ComingSoon screenName="X" />));
    expect(getByText(viMessages.comingSoon.title)).toBeInTheDocument();
    expect(getByText(viMessages.comingSoon.message)).toBeInTheDocument();
  });

  it('renders a "back home" link pointing to /', () => {
    const { container, getByText } = render(wrap(<ComingSoon screenName="X" />));
    const link = container.querySelector('a[href="/"]');
    expect(link).toBeInTheDocument();
    expect(getByText(viMessages.comingSoon.backHome)).toBeInTheDocument();
  });
});
