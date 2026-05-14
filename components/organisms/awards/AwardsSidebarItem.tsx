import Image from 'next/image';

interface AwardsSidebarItemProps {
  /** Award slug (matches the section anchor on the same page). */
  slug: string;
  /** Already-localized item label. */
  label: string;
  /** True when this item's section is the active one. */
  isActive: boolean;
  /** Click handler; the parent prevents default and drives the scroll. */
  onClick: (slug: string) => void;
}

/**
 * Presentational sidebar entry. No `'use client'` directive — uses no
 * hooks. When `AwardsSidebarNav` (which IS `'use client'`) imports this
 * file, Next.js transparently bundles it client-side.
 *
 * Renders a real `<a href="#{slug}">` so the page works without JavaScript
 * (anchor scroll fallback) and integrates with the browser's history.
 */
export function AwardsSidebarItem({ slug, label, isActive, onClick }: AwardsSidebarItemProps) {
  return (
    <a
      href={`#${slug}`}
      onClick={(e) => {
        e.preventDefault();
        onClick(slug);
      }}
      aria-current={isActive ? 'location' : undefined}
      className={[
        'inline-flex items-center gap-3 rounded-(--radius-md) px-3 py-2 text-base font-medium transition-opacity',
        isActive
          ? 'text-cta underline underline-offset-4'
          : 'opacity-80 hover:opacity-100 hover:bg-hero-foreground/5',
      ].join(' ')}
    >
      <Image
        src="/assets/awards/icons/target.svg"
        alt=""
        aria-hidden
        width={20}
        height={20}
        unoptimized
        className="h-5 w-5"
      />
      {label}
    </a>
  );
}
