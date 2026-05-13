import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnreadBadge } from '@/components/atoms/UnreadBadge';

describe('<UnreadBadge>', () => {
  it('renders nothing when count is 0', () => {
    const { container } = render(<UnreadBadge count={0} ariaLabel="x" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for negative count', () => {
    const { container } = render(<UnreadBadge count={-1} ariaLabel="x" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders an aria-labelled status indicator when count > 0', () => {
    render(<UnreadBadge count={1} ariaLabel="Unread" />);
    const badge = screen.getByTestId('unread-badge');
    expect(badge).toHaveAttribute('role', 'status');
    expect(badge).toHaveAttribute('aria-label', 'Unread');
  });

  it('does not render a numeric counter (design uses an indicator dot only)', () => {
    render(<UnreadBadge count={42} ariaLabel="Unread" />);
    expect(screen.getByTestId('unread-badge')).toHaveTextContent('');
  });
});
