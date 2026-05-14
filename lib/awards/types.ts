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

/**
 * Per-award detail metadata for the Awards Information screen (`zFYDgyj_pD`).
 * Keyed by the same slug as `Award`. Quantity, unit, and value strings are
 * raw (per resolved decision in spec review):
 *
 * - `quantity` is pre-zero-padded ("10", "02", "03", "01") — no client-side
 *   formatting.
 * - `unit` is kept in Vietnamese for both `vi` and `en` locales
 *   ("Đơn vị" / "Tập thể" / "Cá nhân"). Sun\* internal categorisation
 *   recognised by international staff.
 * - `value` is the raw VNĐ amount string ("7.000.000 VNĐ", etc.) — same for
 *   both locales (event is in Vietnam; prizes paid in VNĐ).
 *
 * `longDescriptionKey` IS localised — paragraph copy differs between `vi`
 * and `en`.
 */
export interface AwardDetail {
  readonly slug: string;
  readonly longDescriptionKey: string;
  /** Already zero-padded display string. */
  readonly quantity: string;
  /** Vietnamese unit label — same string for both locales. Empty string when no unit (e.g. Signature 2025, MVP). */
  readonly unit: string;
  /** Raw VNĐ amount string. Same string for both locales. */
  readonly value: string;
}
