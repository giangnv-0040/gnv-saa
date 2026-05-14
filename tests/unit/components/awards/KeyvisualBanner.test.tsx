import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { KeyvisualBanner } from '@/components/organisms/awards/KeyvisualBanner';

describe('<KeyvisualBanner>', () => {
  it('renders the ROOT FURTHER logotype with empty alt (decorative)', () => {
    const { container } = render(<KeyvisualBanner />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', '');
  });

  it('uses an aria-hidden section wrapper (decorative, skipped by screen readers)', () => {
    const { container } = render(<KeyvisualBanner />);
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('aria-hidden', 'true');
  });

  it('contains no interactive descendants', () => {
    const { container } = render(<KeyvisualBanner />);
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
  });
});
