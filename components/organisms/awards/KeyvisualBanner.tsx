import Image from 'next/image';

/**
 * Decorative banner at the top of `/awards` — colourful watercolor
 * keyvisual flowing in from the right, with the stacked ROOT / FURTHER
 * wordmark overlayed on the left. Purely visual — aria-hidden so screen
 * readers skip past it directly to the page title heading below.
 *
 * Shares `keyvisual-bg.png`, `root-text.png`, and `further-text.png`
 * with the Homepage SAA hero (`/assets/homepage/images/*`) — no asset
 * duplication.
 */
export function KeyvisualBanner() {
  return (
    <section aria-hidden className="relative isolate w-full overflow-hidden bg-hero-background">
      <Image
        src="/assets/homepage/images/keyvisual-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-right"
      />

      {/* Bottom-fade gradient blends the colourful keyvisual into the
          dark navy of the title block below. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,16,26,0) 0%, rgba(0,16,26,0.65) 60%, rgba(0,16,26,1) 100%)',
        }}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-2 px-6 py-12 md:px-10 md:py-16 lg:px-16">
        <Image
          src="/assets/homepage/images/root-text.png"
          alt=""
          width={189}
          height={67}
          priority
          unoptimized
          className="h-auto w-[44vw] max-w-[200px] md:max-w-[240px]"
        />
        <Image
          src="/assets/homepage/images/further-text.png"
          alt=""
          width={290}
          height={67}
          priority
          unoptimized
          className="h-auto w-[58vw] max-w-[280px] md:max-w-[320px]"
        />
      </div>
    </section>
  );
}
