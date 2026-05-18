'use client';

import { useTranslations } from 'next-intl';
import { CloseIcon, SendIcon } from '@/components/atoms/KudoIcons';

interface FormActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitDisabled?: boolean;
}

/**
 * Footer row of the Viết Kudo form. `Hủy` (secondary button) on the left,
 * `Gửi` (yellow CTA, full-width on its column) on the right.
 */
export function FormActions({
  onCancel,
  onSubmit,
  submitting = false,
  submitDisabled = false,
}: FormActionsProps) {
  const t = useTranslations('kudos.write.actions');

  return (
    <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-6">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-[60px] items-center justify-center gap-2 rounded-(--radius-md) border border-[#998C5F] bg-cta/10 px-10 text-base font-bold tracking-[0.5px] text-foreground transition-colors hover:bg-cta/20"
      >
        <span>{t('cancel')}</span>
        <CloseIcon className="h-4 w-4" />
      </button>

      <button
        type="submit"
        onClick={onSubmit}
        disabled={submitting || submitDisabled}
        className="inline-flex h-[60px] flex-1 items-center justify-center gap-2 rounded-(--radius-button) bg-cta px-4 text-base font-bold tracking-[0.5px] text-cta-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>{submitting ? t('submitting') : t('submit')}</span>
        <SendIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
