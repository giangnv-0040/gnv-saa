import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FlagIcon } from '@/components/atoms/FlagIcon';

describe('<FlagIcon>', () => {
  it('renders an img pointing to the locale flag asset', () => {
    const { container } = render(<FlagIcon locale="vi" />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/assets/common/flags/vn.svg');
  });

  it('renders the English flag for locale=en', () => {
    const { container } = render(<FlagIcon locale="en" />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/assets/common/flags/gb.svg');
  });

  it('marks the flag as decorative (empty alt + aria-hidden)', () => {
    const { container } = render(<FlagIcon locale="vi" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('aria-hidden', 'true');
  });
});
