'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';

interface AnonymousCheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
}

/**
 * "Gửi lời cám ơn và ghi nhận ẩn danh" toggle. Native `<input type="checkbox">`
 * with a visually styled box so we don't lose the screen-reader / keyboard
 * affordances of the platform control.
 */
export function AnonymousCheckbox({ checked, onChange }: AnonymousCheckboxProps) {
  const t = useTranslations('kudos.write.anonymous');
  const id = useId();
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-3">
      <span className="relative inline-flex h-6 w-6 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute h-6 w-6 cursor-pointer opacity-0"
        />
        <span
          aria-hidden
          className="block h-6 w-6 rounded-(--radius-md) border border-[#999999] bg-white transition-colors peer-checked:border-foreground peer-checked:bg-foreground"
        />
        <svg
          aria-hidden
          className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span className="text-base font-semibold text-[#666666]">{t('label')}</span>
    </label>
  );
}
