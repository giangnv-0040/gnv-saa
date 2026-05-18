'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { FieldError } from './FieldError';
import { FieldLabel } from './FieldLabel';
import { KUDO_TITLE_MAX_LENGTH } from '@/lib/kudos/types';

interface TitleFieldProps {
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
}

/**
 * Optional "Danh hiệu" (honorific) input shown above the content editor.
 * The accompanying help text doubles as the input's `aria-describedby`.
 */
export function TitleField({ value, onChange, error }: TitleFieldProps) {
  const t = useTranslations('kudos.write.title_field');
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();

  return (
    <div className="flex w-full flex-col gap-2 md:flex-row md:items-start md:gap-4">
      <FieldLabel htmlFor={inputId} inline className="md:w-40 md:pt-4">
        {t('label')}
      </FieldLabel>

      <div className="flex flex-1 flex-col">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={KUDO_TITLE_MAX_LENGTH}
          placeholder={t('placeholder')}
          aria-describedby={`${hintId}${error ? ` ${errorId}` : ''}`}
          aria-invalid={Boolean(error)}
          className={[
            'w-full rounded-(--radius-button) border bg-white px-6 py-4 text-base text-foreground outline-none placeholder:text-[#999999]',
            error ? 'border-[#E53935]' : 'border-[#998C5F]',
          ].join(' ')}
        />
        <p id={hintId} className="mt-2 text-sm text-[#999999]">
          {t('hint')}
        </p>
        <FieldError id={errorId} message={error ?? null} />
      </div>
    </div>
  );
}
