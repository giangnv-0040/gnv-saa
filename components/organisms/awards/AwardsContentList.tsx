import { awards } from '@/lib/awards/config';
import { awardDetails } from '@/lib/awards/details';
import { AwardDetailCard } from './AwardDetailCard';

/**
 * Wraps the 6 `AwardDetailCard` sections in document order. Iterates the
 * `awards` catalogue from `lib/awards/config.ts` (single source of truth)
 * and pulls the matching `AwardDetail` from `lib/awards/details.ts`.
 *
 * Even-index cards render image on the left; odd-index cards reverse the
 * column order (image on the right) per Figma's zig-zag layout.
 */
export function AwardsContentList() {
  return (
    <div className="flex flex-col gap-16 md:gap-24">
      {awards.map((award, index) => {
        const detail = awardDetails[award.slug];
        if (!detail) return null;
        return (
          <AwardDetailCard
            key={award.slug}
            award={award}
            detail={detail}
            reverse={index % 2 === 1}
          />
        );
      })}
    </div>
  );
}
