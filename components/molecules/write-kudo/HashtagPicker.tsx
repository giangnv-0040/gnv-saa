'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CloseIcon, PlusIcon } from '@/components/atoms/KudoIcons';
import { FieldError } from './FieldError';
import { FieldLabel } from './FieldLabel';
import { KUDO_MAX_HASHTAGS, type HashtagSuggestion } from '@/lib/kudos/types';

interface HashtagPickerProps {
  suggestions: readonly HashtagSuggestion[];
  value: string[];
  onChange: (next: string[]) => void;
  error?: string | null;
}

export function HashtagPicker({ suggestions, value, onChange, error }: HashtagPickerProps) {
  const t = useTranslations('kudos.write.hashtag');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const errorId = useId();

  const remaining = KUDO_MAX_HASHTAGS - value.length;
  const isFull = remaining <= 0;

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function toggle(slug: string) {
    if (value.includes(slug)) {
      onChange(value.filter((s) => s !== slug));
      return;
    }
    if (value.length >= KUDO_MAX_HASHTAGS) return;
    onChange([...value, slug]);
  }

  function remove(slug: string) {
    onChange(value.filter((s) => s !== slug));
  }

  return (
    <div className="flex w-full flex-col gap-2 md:flex-row md:items-start md:gap-4">
      <FieldLabel required inline className="md:w-40 md:pt-3">
        {t('label')}
      </FieldLabel>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {value.map((slug) => {
            const s = suggestions.find((x) => x.slug === slug);
            return (
              <span
                key={slug}
                className="inline-flex items-center gap-1 rounded-full border border-[#998C5F] bg-cta/40 px-3 py-1 text-sm font-semibold text-foreground"
              >
                {s?.label ?? `#${slug}`}
                <button
                  type="button"
                  aria-label={t('removeAriaLabel', { tag: s?.label ?? slug })}
                  onClick={() => remove(slug)}
                  className="rounded-full text-foreground/60 hover:text-foreground"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </span>
            );
          })}

          <div ref={containerRef} className="relative">
            {!isFull && (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup="listbox"
                className="inline-flex items-center gap-1 rounded-(--radius-md) border border-[#998C5F] bg-white px-3 py-2 text-sm font-bold text-foreground hover:bg-foreground/5"
              >
                <PlusIcon className="h-4 w-4" />
                <span>{t('add')}</span>
                <span className="text-[#999999]">{t('maxHint', { max: KUDO_MAX_HASHTAGS })}</span>
              </button>
            )}

            {open && (
              <ul
                role="listbox"
                aria-label={t('listAriaLabel')}
                className="absolute left-0 z-20 mt-2 max-h-60 w-56 overflow-auto rounded-(--radius-md) border border-[#998C5F] bg-white py-1 shadow-lg"
              >
                {suggestions.map((s) => {
                  const selected = value.includes(s.slug);
                  return (
                    <li key={s.slug} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => toggle(s.slug)}
                        disabled={!selected && isFull}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-foreground hover:bg-foreground/5 disabled:opacity-40"
                      >
                        <span>{s.label}</span>
                        {selected ? <span aria-hidden>✓</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <FieldError id={errorId} message={error ?? null} />
      </div>
    </div>
  );
}
