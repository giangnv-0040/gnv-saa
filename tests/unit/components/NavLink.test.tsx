import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavLink } from '@/components/atoms/NavLink';

const pathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => pathname(),
}));

describe('<NavLink>', () => {
  it('renders a Link to the given href', () => {
    pathname.mockReturnValue('/awards');
    render(<NavLink href="/awards">Awards</NavLink>);
    const link = screen.getByRole('link', { name: 'Awards' });
    expect(link).toHaveAttribute('href', '/awards');
  });

  it('exposes aria-current="page" when the pathname matches href', () => {
    pathname.mockReturnValue('/awards');
    render(<NavLink href="/awards">Awards</NavLink>);
    expect(screen.getByRole('link', { name: 'Awards' })).toHaveAttribute('aria-current', 'page');
  });

  it('omits aria-current on inactive links', () => {
    pathname.mockReturnValue('/kudos');
    render(<NavLink href="/awards">Awards</NavLink>);
    expect(screen.getByRole('link', { name: 'Awards' })).not.toHaveAttribute('aria-current');
  });

  it('exact=true requires the pathname to equal href (no startsWith match)', () => {
    pathname.mockReturnValue('/awards/sub');
    render(
      <NavLink href="/awards" exact>
        Awards
      </NavLink>,
    );
    expect(screen.getByRole('link', { name: 'Awards' })).not.toHaveAttribute('aria-current');
  });

  it('default (exact=false) treats descendant paths as active for section parents', () => {
    pathname.mockReturnValue('/awards/sub');
    render(<NavLink href="/awards">Awards</NavLink>);
    expect(screen.getByRole('link', { name: 'Awards' })).toHaveAttribute('aria-current', 'page');
  });
});
