interface SpinnerProps {
  className?: string;
  'aria-label'?: string;
}

/**
 * Pure-CSS spinner. Renders a `role="status"` live region with a hidden
 * accessible name so screen readers announce loading without visible text.
 * Respects `prefers-reduced-motion` via the global CSS rule in globals.css.
 */
export function Spinner({ className, 'aria-label': ariaLabel = 'Loading' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={['inline-block h-5 w-5', className].filter(Boolean).join(' ')}
    >
      <span
        aria-hidden="true"
        className="block h-full w-full animate-spin rounded-full border-2 border-current border-t-transparent"
      />
    </span>
  );
}
