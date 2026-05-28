import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

interface HashtagChipProps {
  tag: string;
}

/**
 * Clickable hashtag chip. Navigates to `/kudos?hashtag={tag}` so the live
 * feed filters by it (filter logic ships behind FR-019 in the spec).
 */
export function HashtagChip({ tag }: HashtagChipProps) {
  const normalised = tag.startsWith('#') ? tag.slice(1) : tag;
  return (
    <Link
      href={`${ROUTES.KUDOS}?hashtag=${encodeURIComponent(normalised.toLowerCase())}`}
      className="inline-block text-xs font-semibold text-[#D4271D] hover:underline"
    >
      #{normalised}
    </Link>
  );
}
