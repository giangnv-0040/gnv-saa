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

  describe('placeholder prop (FR-009 / decision #2)', () => {
    it('renders the placeholder string verbatim and emits no digit tiles', () => {
      const { container } = render(<CountdownTile value={5} label="DAYS" placeholder="--" />);
      expect(screen.getByTestId('countdown-value')).toHaveTextContent('--');
      // No 2-digit tile spans should render in placeholder mode.
      const digitText = Array.from(container.querySelectorAll('[aria-hidden] span'))
        .map((el) => el.textContent)
        .filter((t) => /^[0-9]$/.test(t ?? ''));
      expect(digitText).toEqual([]);
    });

    it('keeps the unit label intact when placeholder is active', () => {
      render(<CountdownTile value={0} label="HOURS" placeholder="--" />);
      expect(screen.getByText('HOURS')).toBeInTheDocument();
    });

    it('falls back to digit rendering when placeholder is omitted or empty', () => {
      render(<CountdownTile value={9} label="DAYS" placeholder="" />);
      expect(screen.getByTestId('countdown-value')).toHaveTextContent('09');
    });
  });
});
