'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from '@/components/atoms/KudoIcons';
import type { KudoFilterOption } from '@/lib/kudos/types';

interface FilterDropdownProps {
  label: string;
  options: readonly KudoFilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  clearLabel: string;
}

/**
 * Click-to-open dropdown used by the HIGHLIGHT filters (Hashtag, Phòng ban).
 * Keyboard-friendly: Escape closes, arrow-key navigation reserved for a
 * later iteration once filter state ties to URL params.
 */
export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  clearLabel,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const activeLabel = value ? (options.find((o) => o.value === value)?.label ?? label) : label;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-2 rounded-(--radius-button) border border-[#998C5F] bg-transparent px-4 py-2 text-sm font-bold text-hero-foreground hover:bg-white/5"
      >
        <span>{activeLabel}</span>
        <ChevronDownIcon
          className={
            open ? 'h-4 w-4 rotate-180 transition-transform' : 'h-4 w-4 transition-transform'
          }
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-20 mt-1 min-w-[180px] overflow-hidden rounded-(--radius-md) border border-[#998C5F] bg-[#00101A] text-hero-foreground shadow-lg"
        >
          <li
            role="option"
            aria-selected={value === null}
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="cursor-pointer px-4 py-2 text-sm hover:bg-white/10"
          >
            {clearLabel}
          </li>
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={[
                'cursor-pointer px-4 py-2 text-sm hover:bg-white/10',
                opt.value === value ? 'bg-white/10' : '',
              ].join(' ')}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
