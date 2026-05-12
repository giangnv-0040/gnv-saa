import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from '@/components/atoms/Spinner';

describe('<Spinner>', () => {
  it('renders as a status live region by default', () => {
    render(<Spinner />);
    const node = screen.getByRole('status');
    expect(node).toBeInTheDocument();
  });

  it('has a default accessible name', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading');
  });

  it('accepts a custom aria-label', () => {
    render(<Spinner aria-label="Signing in" />);
    expect(screen.getByRole('status')).toHaveAccessibleName('Signing in');
  });
});
