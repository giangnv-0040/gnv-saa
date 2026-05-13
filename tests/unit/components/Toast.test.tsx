import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Toast } from '@/components/molecules/Toast';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('<Toast>', () => {
  it('renders the message inside an aria-live="polite" status region', () => {
    render(<Toast message="hello" durationMs={0} />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('hello');
  });

  it('auto-dismisses after the configured duration', () => {
    const onDismiss = vi.fn();
    render(<Toast message="bye" durationMs={1500} onDismiss={onDismiss} />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.queryByRole('status')).toBeNull();
    expect(onDismiss).toHaveBeenCalled();
  });

  it('stays visible when durationMs is 0', () => {
    render(<Toast message="sticky" durationMs={0} />);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
