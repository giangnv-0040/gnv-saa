'use client';

import { useCallback, useId, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  NumberListIcon,
  QuoteIcon,
  StrikethroughIcon,
} from '@/components/atoms/KudoIcons';
import { FieldError } from './FieldError';
import { KUDO_BODY_MAX_LENGTH } from '@/lib/kudos/types';
import { ROUTES } from '@/lib/routes';

interface ContentEditorProps {
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
}

type Format = 'bold' | 'italic' | 'strike' | 'numberList' | 'link' | 'quote';

/**
 * Lightweight markdown-style editor used by the Viết Kudo body field. The
 * toolbar wraps the current selection with markdown markers (or inserts a
 * placeholder if the selection is empty). Persistence is plain text; the
 * server-side rendering layer (out of scope here) will pass it through a
 * markdown renderer.
 */
export function ContentEditor({ value, onChange, error }: ContentEditorProps) {
  const t = useTranslations('kudos.write.body');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaId = useId();
  const errorId = useId();

  const applyFormat = useCallback(
    (format: Format) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.slice(start, end);

      const placeholder = selected || t('placeholderText');
      let wrapped: string;
      let cursorOffset = 0;
      switch (format) {
        case 'bold':
          wrapped = `**${placeholder}**`;
          cursorOffset = 2;
          break;
        case 'italic':
          wrapped = `*${placeholder}*`;
          cursorOffset = 1;
          break;
        case 'strike':
          wrapped = `~~${placeholder}~~`;
          cursorOffset = 2;
          break;
        case 'numberList':
          wrapped = placeholder
            .split('\n')
            .map((line, i) => `${i + 1}. ${line}`)
            .join('\n');
          cursorOffset = 3;
          break;
        case 'link':
          wrapped = `[${placeholder}](https://)`;
          cursorOffset = 1;
          break;
        case 'quote':
          wrapped = placeholder
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n');
          cursorOffset = 2;
          break;
      }

      const next = value.slice(0, start) + wrapped + value.slice(end);
      onChange(next);
      // Restore selection around the inserted placeholder so the user can
      // immediately overtype.
      requestAnimationFrame(() => {
        const nextStart = selected ? start : start + cursorOffset;
        const nextEnd = selected ? start + wrapped.length : nextStart + placeholder.length;
        textarea.focus();
        textarea.setSelectionRange(nextStart, nextEnd);
      });
    },
    [value, onChange, t],
  );

  return (
    <div className="flex w-full flex-col">
      <div
        className={[
          'overflow-hidden rounded-(--radius-button) border bg-white',
          error ? 'border-[#E53935]' : 'border-[#998C5F]',
        ].join(' ')}
      >
        <div
          role="toolbar"
          aria-label={t('toolbarAriaLabel')}
          className="flex flex-wrap items-center gap-1 border-b border-[#998C5F]/50 bg-white px-3 py-2"
        >
          <ToolbarButton label={t('toolbar.bold')} onClick={() => applyFormat('bold')}>
            <BoldIcon className="h-5 w-5" />
          </ToolbarButton>
          <ToolbarButton label={t('toolbar.italic')} onClick={() => applyFormat('italic')}>
            <ItalicIcon className="h-5 w-5" />
          </ToolbarButton>
          <ToolbarButton label={t('toolbar.strike')} onClick={() => applyFormat('strike')}>
            <StrikethroughIcon className="h-5 w-5" />
          </ToolbarButton>
          <ToolbarButton label={t('toolbar.numberList')} onClick={() => applyFormat('numberList')}>
            <NumberListIcon className="h-5 w-5" />
          </ToolbarButton>
          <ToolbarButton label={t('toolbar.link')} onClick={() => applyFormat('link')}>
            <LinkIcon className="h-5 w-5" />
          </ToolbarButton>
          <ToolbarButton label={t('toolbar.quote')} onClick={() => applyFormat('quote')}>
            <QuoteIcon className="h-5 w-5" />
          </ToolbarButton>

          <Link
            href={ROUTES.COMMUNITY_STANDARDS}
            target="_blank"
            className="ml-auto text-sm font-semibold text-[#C0392B] underline-offset-4 hover:underline"
          >
            {t('communityStandards')}
          </Link>
        </div>

        <textarea
          ref={textareaRef}
          id={textareaId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('placeholder')}
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          maxLength={KUDO_BODY_MAX_LENGTH}
          rows={6}
          className="w-full resize-y bg-white px-4 py-3 text-base text-foreground outline-none placeholder:text-[#999999]"
        />
      </div>
      <p className="mt-2 text-center text-sm font-semibold text-foreground">{t('mentionHint')}</p>
      <FieldError id={errorId} message={error ?? null} />
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-(--radius-md) text-foreground/80 hover:bg-foreground/5"
    >
      {children}
    </button>
  );
}
