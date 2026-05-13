import Image from 'next/image';
import type { Locale } from '@/lib/i18n/config';

const FLAG_BY_LOCALE: Record<Locale, string> = {
  vi: '/assets/common/flags/vn.svg',
  en: '/assets/common/flags/gb.svg',
};

interface FlagIconProps {
  locale: Locale;
  className?: string;
}

/**
 * Decorative flag icon. The accompanying language label (e.g. "VN") conveys
 * meaning, so the flag image is marked as decorative with `alt=""` +
 * `aria-hidden`.
 *
 * NOTE: gb.svg and jp.svg live in the Dropdown-ngôn ngữ Figma frame and will
 * be fetched when the LanguageSwitcher dropdown is implemented (US2). Until
 * then, only the VI flag exists on disk; consumers should fall back gracefully.
 */
export function FlagIcon({ locale, className }: FlagIconProps) {
  return (
    <Image
      src={FLAG_BY_LOCALE[locale]}
      alt=""
      aria-hidden
      width={24}
      height={24}
      unoptimized
      className={['inline-block h-6 w-6', className].filter(Boolean).join(' ')}
    />
  );
}
