import Image from 'next/image';

/**
 * Inline 4×3 base64 PNG matching the dominant navy tone of the campaign
 * artwork. Used as the `placeholder="blur"` data URL so we don't depend on
 * a separate asset file or a bundler-specific text loader. Replace with a
 * file-derived data URL (via `@plaiceholder/cli` on the production asset)
 * when the asset-manifest's T001 follow-up lands.
 */
const HERO_BG_BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAAJklEQVR42mNk+P//PwMywPj//z9DUz4DA2Yik2gGRkZG/v//AwBYUgcQv0HKgQAAAABJRU5ErkJggg==';

/**
 * Full-bleed campaign artwork for the prelaunch page.
 *
 * - The raster image (`/assets/prelaunch/hero-bg.png`) is loaded via
 *   `next/image` with `priority` so it counts toward LCP (TR-001) and a
 *   `placeholder="blur"` data URL inlined above.
 * - `alt=""` because the artwork is decorative; the headline below carries
 *   the meaning (FR-015 / WCAG 2.1 AA Principle III).
 * - A dark cover gradient overlays the image (`--bg-prelaunch-cover` token
 *   extracted from Figma node `2268:35130`) to guarantee text contrast on
 *   the brighter side of the artwork.
 */
export function PrelaunchBackground() {
  return (
    <>
      <Image
        src="/assets/prelaunch/hero-bg.png"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        blurDataURL={HERO_BG_BLUR}
        className="-z-20 object-cover object-right"
        data-testid="prelaunch-bg"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'var(--bg-prelaunch-cover)' }}
      />
    </>
  );
}
