'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  /** Localized message body. */
  message: string;
  /** Auto-dismiss timeout in ms. Pass `0` to disable auto-dismiss. */
  durationMs?: number;
  /** Called once the toast finishes dismissing (animation hook for parents). */
  onDismiss?: () => void;
}

/**
 * Minimal toast for non-blocking error feedback (FR-026). Rendered into a
 * `role="status"` + `aria-live="polite"` region so screen readers announce
 * the message without interrupting active workflows.
 *
 * Heavier toast systems (queueing, multiple stacks, types) can be swapped in
 * later behind this same component contract.
 */
export function Toast({ message, durationMs = 3000, onDismiss }: ToastProps) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (durationMs <= 0) return;
    const timer = setTimeout(() => {
      setOpen(false);
      onDismiss?.();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onDismiss]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-(--radius-md) border border-foreground/10 bg-foreground px-4 py-3 text-sm text-background shadow-lg"
    >
      {message}
    </div>
  );
}
