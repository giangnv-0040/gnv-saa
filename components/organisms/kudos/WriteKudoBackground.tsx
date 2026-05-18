import Image from 'next/image';

/**
 * Full-bleed background behind the Viết Kudo modal panel. Reuses the
 * homepage hero keyvisual artwork (Figma `520:11603` / `520:11604`) dimmed
 * by a 80% navy mask so the cream-colored composition panel sits forward.
 *
 * Renders nothing interactive — pointer events pass through to the panel.
 */
export function WriteKudoBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Image
        src="/assets/homepage/images/kudos-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="select-none object-cover object-center"
      />
      {/* Top gradient cover — replicates `520:11605` linear-gradient(0deg,
          #00101A 25%, rgba(0, 19, 32, 0.00) 50%). */}
      <div
        className="absolute inset-x-0 top-0 h-1/2"
        style={{
          background: 'linear-gradient(0deg, #00101A 25%, rgba(0, 19, 32, 0.00) 50%)',
        }}
      />
      {/* Full mask — Figma `520:11646` solid navy at 80% opacity. */}
      <div className="absolute inset-0 bg-[#00101A]/80" />
    </div>
  );
}
