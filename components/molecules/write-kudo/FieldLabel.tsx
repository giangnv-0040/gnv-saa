import type { ReactNode } from 'react';

interface FieldLabelProps {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  /**
   * When the label visually sits on the left of a horizontal row, the parent
   * passes `inline` so we don't render flex-column spacing.
   */
  inline?: boolean;
  /** Optional CSS hook (e.g. fixed width for an inline label column). */
  className?: string;
}

/**
 * Field label with optional required-state asterisk. The asterisk is rendered
 * as a separate `<span aria-hidden>` so screen readers don't read "star" —
 * required state is exposed via the input's `aria-required`.
 */
export function FieldLabel({
  htmlFor,
  required = false,
  children,
  inline = false,
  className,
}: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={[
        'inline-flex items-center gap-0.5 text-base font-bold text-foreground',
        inline ? '' : 'mb-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span>{children}</span>
      {required ? (
        <span aria-hidden="true" className="text-[#E53935]">
          *
        </span>
      ) : null}
    </label>
  );
}
