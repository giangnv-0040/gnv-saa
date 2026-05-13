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

  it('clamps values > 99 to 99 (Figma design supports max 2 digits per group)', () => {
    render(<CountdownTile value={231} label="DAYS" />);
    expect(screen.getByTestId('countdown-value')).toHaveTextContent('99');
  });

  it('renders exactly 2 digit tiles regardless of the value', () => {
    const { container } = render(<CountdownTile value={231} label="DAYS" />);
    // Tiles are aria-hidden divs containing the visible digits; the sr-only
    // span carries the value for assistive tech + tests.
    const digitText = Array.from(container.querySelectorAll('[aria-hidden] span'))
      .map((el) => el.textContent)
      .filter((t) => /^[0-9]$/.test(t ?? ''));
    expect(digitText).toEqual(['9', '9']);
  });
});
