import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppHeader } from '@/components/organisms/AppHeader';

describe('<AppHeader>', () => {
  it('renders the logo as a non-interactive image (FR-013)', () => {
    const { container } = render(<AppHeader />);
    const logo = container.querySelector('img[alt="SAA"]');
    expect(logo).toBeInTheDocument();
    expect(logo).not.toHaveAttribute('onclick');
    expect(logo).not.toHaveAttribute('tabindex');
    expect(logo).not.toHaveAttribute('role');
    expect(logo?.className).not.toMatch(/cursor-pointer/);
  });

  it('logo is NOT wrapped in an <a> or <button>', () => {
    const { container } = render(<AppHeader />);
    const logo = container.querySelector('img[alt="SAA"]');
    expect(logo?.closest('a')).toBeNull();
    expect(logo?.closest('button')).toBeNull();
  });

  it('renders the trailing slot when children are provided', () => {
    render(
      <AppHeader>
        <span data-testid="trailing">Trailing</span>
      </AppHeader>,
    );
    expect(screen.getByTestId('trailing')).toBeInTheDocument();
  });

  it('uses a semantic <header> landmark', () => {
    const { container } = render(<AppHeader />);
    expect(container.querySelector('header')).toBeInTheDocument();
  });
});
