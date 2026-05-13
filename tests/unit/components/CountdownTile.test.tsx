import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountdownTile } from '@/components/molecules/CountdownTile';

describe('<CountdownTile>', () => {
  it.each([
    [0, '00'],
    [5, '05'],
    [12, '12'],
    [99, '99'],
  ])('renders %i as %s (FR-007 zero-pad)', (input, expected) => {
    render(<CountdownTile value={input} label="DAYS" />);
    expect(screen.getByTestId('countdown-value')).toHaveTextContent(expected);
  });

  it('renders the label as-is (already localized by the caller)', () => {
    render(<CountdownTile value={5} label="DAYS" />);
    expect(screen.getByText('DAYS')).toBeInTheDocument();
  });
});
