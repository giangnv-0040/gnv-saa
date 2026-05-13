/**
 * Award category metadata. The 6-entry catalogue lives in `lib/awards/config.ts`
 * and is referenced by Homepage SAA (`AwardsGridSection`) and — when it ships —
 * by Awards Information (`zFYDgyj_pD`) to keep deep-link anchors in sync.
 */
export interface Award {
  /** Kebab-case identifier used in `/awards#{slug}` deep links. */
  readonly slug: string;
  /** i18n key under `homepage.awards.list.*.title`. */
  readonly titleKey: string;
  /** i18n key under `homepage.awards.list.*.description`. */
  readonly descriptionKey: string;
  /**
   * Public path to the per-award name artwork (transparent PNG overlaid on the
   * shared award background). Sourced from Figma at Phase 0.
   */
  readonly nameImage: string;
}
