import { awards } from '@/lib/awards/config';
import { awardDetails } from '@/lib/awards/details';
import { AwardDetailCard } from './AwardDetailCard';

/**
 * Wraps the 6 `AwardDetailCard` sections in document order. Iterates the
 * `awards` catalogue from `lib/awards/config.ts` (single source of truth)
 * and pulls the matching `AwardDetail` from `lib/awards/details.ts`.
 */
export function AwardsContentList() {
  return (
    <div className="flex flex-col gap-16 md:gap-24">
      {awards.map((award) => {
        const detail = awardDetails[award.slug];
        if (!detail) return null;
        return <AwardDetailCard key={award.slug} award={award} detail={detail} />;
      })}
    </div>
  );
}
