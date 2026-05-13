import Image from 'next/image';

interface BellIconProps {
  className?: string;
}

/**
 * Decorative notification bell icon. The button wrapping it provides the
 * accessible name; the image itself is marked `aria-hidden`.
 */
export function BellIcon({ className }: BellIconProps) {
  return (
    <Image
      src="/assets/homepage/icons/bell.svg"
      alt=""
      aria-hidden
      width={24}
      height={24}
      unoptimized
      className={['h-6 w-6', className].filter(Boolean).join(' ')}
    />
  );
}
