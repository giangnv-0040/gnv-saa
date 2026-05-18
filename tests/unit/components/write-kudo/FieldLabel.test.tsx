import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FieldLabel } from '@/components/molecules/write-kudo/FieldLabel';

describe('<FieldLabel>', () => {
  it('renders the label text', () => {
    render(<FieldLabel>Người nhận</FieldLabel>);
    expect(screen.getByText('Người nhận')).toBeInTheDocument();
  });

  it('renders a red asterisk when required (and hides it from screen readers)', () => {
    const { container } = render(<FieldLabel required>Người nhận</FieldLabel>);
    const asterisk = container.querySelector('[aria-hidden="true"]');
    expect(asterisk).not.toBeNull();
    expect(asterisk).toHaveTextContent('*');
  });

  it('does not render the asterisk when not required', () => {
    const { container } = render(<FieldLabel>Tùy chọn</FieldLabel>);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('associates with an input via htmlFor', () => {
    render(<FieldLabel htmlFor="my-input">Email</FieldLabel>);
    expect(screen.getByText('Email').closest('label')).toHaveAttribute('for', 'my-input');
  });
});
