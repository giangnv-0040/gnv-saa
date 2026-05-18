'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDownIcon } from '@/components/atoms/KudoIcons';
import { FieldError } from './FieldError';
import { FieldLabel } from './FieldLabel';
import type { Recipient } from '@/lib/kudos/types';

interface RecipientComboboxProps {
  recipients: readonly Recipient[];
  value: string | null;
  onChange: (recipientId: string | null) => void;
  error?: string | null;
}

/**
 * Searchable single-select for the "Người nhận" field. Combobox pattern per
 * WAI-ARIA APG: a text input + listbox; arrow-key navigation + Enter to
 * select. Filter is a simple case-insensitive `displayName` substring match.
 */
export function RecipientCombobox({ recipients, value, onChange, error }: RecipientComboboxProps) {
  const t = useTranslations('kudos.write.recipient');
  const inputId = useId();
  const listboxId = useId();
  const errorId = useId();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => recipients.find((r) => r.id === value) ?? null,
    [recipients, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipients.slice(0, 8);
    return recipients
      .filter(
        (r) =>
          r.displayName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.team.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [recipients, query]);

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

  function onQueryChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
    setActiveIndex(0);
    setOpen(true);
    if (selected) onChange(null);
  }

  function select(recipient: Recipient) {
    onChange(recipient.id);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }

  function onInputKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (event.key === 'Enter') {
      const r = filtered[activeIndex];
      if (r) {
        event.preventDefault();
        select(r);
      }
    } else if (event.key === 'Backspace' && !query && selected) {
      onChange(null);
    }
  }

  const displayValue = selected && !open ? selected.displayName : query;

  return (
    <div className="flex w-full flex-col gap-2 md:flex-row md:items-start md:gap-4">
      <FieldLabel htmlFor={inputId} required inline className="md:w-40 md:pt-4">
        {t('label')}
      </FieldLabel>

      <div ref={containerRef} className="relative w-full flex-1">
        <div
          className={[
            'flex w-full items-center justify-between gap-2 rounded-(--radius-button) border bg-white px-6 py-4 transition-colors',
            error ? 'border-[#E53935]' : 'border-[#998C5F]',
          ].join(' ')}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-activedescendant={
              open && filtered[activeIndex] ? `${listboxId}-${filtered[activeIndex].id}` : undefined
            }
            aria-required="true"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            value={displayValue}
            placeholder={t('placeholder')}
            onFocus={() => setOpen(true)}
            onChange={onQueryChange}
            onKeyDown={onInputKey}
            className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-[#999999]"
          />
          <button
            type="button"
            aria-label={t('toggleAriaLabel')}
            aria-expanded={open}
            tabIndex={-1}
            onClick={() => {
              setOpen((v) => !v);
              if (!open) inputRef.current?.focus();
            }}
            className="text-foreground/70"
          >
            <ChevronDownIcon
              className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
            />
          </button>
        </div>

        {open && filtered.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-(--radius-md) border border-[#998C5F] bg-white shadow-lg"
          >
            {filtered.map((r, idx) => (
              <li
                key={r.id}
                id={`${listboxId}-${r.id}`}
                role="option"
                aria-selected={idx === activeIndex}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(r);
                }}
                className={[
                  'cursor-pointer px-4 py-3 text-sm text-foreground',
                  idx === activeIndex ? 'bg-foreground/5' : '',
                ].join(' ')}
              >
                <div className="font-semibold">{r.displayName}</div>
                <div className="text-xs text-foreground/60">
                  {r.team} · {r.email}
                </div>
              </li>
            ))}
          </ul>
        )}

        {open && filtered.length === 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-(--radius-md) border border-[#998C5F] bg-white px-4 py-3 text-sm text-foreground/60 shadow-lg">
            {t('empty')}
          </div>
        )}

        <FieldError id={errorId} message={error ?? null} />
      </div>
    </div>
  );
}
