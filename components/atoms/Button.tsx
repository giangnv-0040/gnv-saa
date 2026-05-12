import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'cta' | 'ghost';
type Size = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-bold tracking-[0.5px] transition-shadow focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60';

const variantClasses: Record<Variant, string> = {
  cta: 'bg-cta text-cta-foreground hover:shadow-md active:shadow-sm rounded-(--radius-button)',
  ghost: 'bg-transparent text-foreground hover:bg-foreground/5 rounded-(--radius-md)',
};

const sizeClasses: Record<Size, string> = {
  md: 'h-12 px-5 text-base',
  lg: 'h-[60px] px-6 py-4 text-xl leading-[40px]',
};

function classNames(...values: Array<string | undefined | false>): string {
  return values.filter(Boolean).join(' ');
}

/**
 * Presentational button atom. Props-driven only — no business logic.
 * Defaults to `type="button"` to prevent accidental form submission.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'cta', size = 'md', type, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={classNames(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
});
