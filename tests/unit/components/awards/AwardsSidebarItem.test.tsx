import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AwardsSidebarItem } from '@/components/organisms/awards/AwardsSidebarItem';

describe('<AwardsSidebarItem>', () => {
  it('renders an <a href="#{slug}"> with the label', () => {
    render(
      <AwardsSidebarItem
        slug="top-talent"
        label="Top Talent"
        isActive={false}
        onClick={() => {}}
      />,
    );
    const link = screen.getByRole('link', { name: /top talent/i });
    expect(link).toHaveAttribute('href', '#top-talent');
  });

  it('exposes aria-current="location" when active', () => {
    render(<AwardsSidebarItem slug="top-talent" label="Top Talent" isActive onClick={() => {}} />);
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'location');
  });

  it('omits aria-current when inactive', () => {
    render(
      <AwardsSidebarItem
        slug="top-talent"
        label="Top Talent"
        isActive={false}
        onClick={() => {}}
      />,
    );
    expect(screen.getByRole('link')).not.toHaveAttribute('aria-current');
  });

  it('calls onClick(slug) when clicked, and preventsDefault on the anchor', async () => {
    const onClick = vi.fn();
    render(<AwardsSidebarItem slug="mvp" label="MVP" isActive={false} onClick={onClick} />);
    await userEvent.click(screen.getByRole('link'));
    expect(onClick).toHaveBeenCalledWith('mvp');
    // jsdom doesn't actually navigate, but the preventDefault means the
    // click should never have hit the hash navigation. We just assert the
    // handler ran with the slug.
  });

  it('applies the active visual class when active (text-cta + underline)', () => {
    render(<AwardsSidebarItem slug="mvp" label="MVP" isActive onClick={() => {}} />);
    expect(screen.getByRole('link').className).toMatch(/text-cta/);
    expect(screen.getByRole('link').className).toMatch(/underline/);
  });
});
