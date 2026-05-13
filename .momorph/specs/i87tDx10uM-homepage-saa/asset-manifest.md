# Asset Manifest — Homepage SAA (`i87tDx10uM`)

Generated 2026-05-13 via MCP `list_media_nodes` + `get_media_files`.

35 media nodes, 22 unique assets, all downloaded to `public/assets/homepage/`.

## Hero / brand images (PNG)

| File                           | Figma node                                             | Used by                      | Notes                                           |
| ------------------------------ | ------------------------------------------------------ | ---------------------------- | ----------------------------------------------- |
| `images/keyvisual-bg.png`      | `2167:9028` (MM_MEDIA_Keyvisual BG)                    | HeroSection                  | Full-bleed hero background (1512×1392px source) |
| `images/root-further-logo.png` | `2788:12911` (MM_MEDIA_Root Further Logo)              | HeroSection (B1 area)        | Small inline logo above countdown               |
| `images/root-text.png`         | `3204:10155` (MM_MEDIA_Root Text)                      | HeroSection (B4 area)        | Large "Root" logotype (189×67)                  |
| `images/further-text.png`      | `3204:10154` (MM_MEDIA_Further Text)                   | HeroSection (B4 area)        | Large "Further" logotype (290×67)               |
| `images/kudos-bg.png`          | `I3390:10349;313:8416` (MM_MEDIA_Kudos Background)     | KudosPromoSection            | Promo block background                          |
| `images/kudos-logo.svg`        | `I3390:10349;329:2948` (MM_MEDIA_Logo/Kudos)           | KudosPromoSection            | "Sun\* Kudos" wordmark (364×72)                 |
| `images/logo-header.png`       | `I2167:9091;178:1033;178:1030` (header MM_MEDIA_Logo)  | HomepageHeader logo          | 52×48 source                                    |
| `images/logo-footer.png`       | `I5001:14800;342:1408;178:1030` (footer MM_MEDIA_Logo) | AppFooter (homepage variant) | 69×64 source                                    |

## Icons (SVG)

| File                          | Figma node                               | Used by                                                                                                                    |
| ----------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `icons/flag-vn.svg`           | `I2167:9091;186:1696;…;178:1010`         | LanguageSwitcher (existing component already references `/assets/common/icons/...` — homepage may reuse the existing flag) |
| `icons/chevron-down-lang.svg` | `I2167:9091;186:1696;186:1821;186:1441`  | LanguageSwitcher (existing)                                                                                                |
| `icons/bell.svg`              | `I2167:9091;186:2101;186:2020;186:1420`  | NotificationButton (A1.6)                                                                                                  |
| `icons/user-default.svg`      | `I2167:9091;186:1597;186:1420`           | ProfileMenuButton (A1.8) — default avatar placeholder                                                                      |
| `icons/arrow-up-right.svg`    | `961e7e07…` shared hash                  | "Chi tiết" buttons (×6 awards + Kudos), CTA arrows (ABOUT AWARDS/ABOUT KUDOS), widget kudos glyph                          |
| `icons/pen.svg`               | `I5022:15169;214:3839;186:1763`          | QuickActionWidget (Viết Kudo icon)                                                                                         |
| `icons/widget-saa.svg`        | `I5022:15169;214:3839;186:1766;214:3762` | QuickActionWidget (Thể lệ SAA glyph)                                                                                       |

## Award assets (PNG)

| File                                     | Figma node                            | Used by                                           |
| ---------------------------------------- | ------------------------------------- | ------------------------------------------------- |
| `awards/award-bg.png`                    | `0f4ce32d…` shared across all 6 cards | AwardCard background (same artwork on every card) |
| `awards/top-talent-name.png`             | `I2167:9075;…;10:951`                 | AwardCard slug=`top-talent`                       |
| `awards/top-project-name.png`            | `I2167:9076;…;214:654`                | AwardCard slug=`top-project`                      |
| `awards/top-project-leader-name.png`     | `I2167:9077;…;214:655`                | AwardCard slug=`top-project-leader`               |
| `awards/best-manager-name.png`           | `I2167:9079;…;214:656`                | AwardCard slug=`best-manager`                     |
| `awards/signature-2025-creator-name.png` | `I2167:9080;…;214:657`                | AwardCard slug=`signature-2025-creator`           |
| `awards/mvp-name.png`                    | `I2167:9081;…;214:653`                | AwardCard slug=`mvp`                              |

## De-duplication notes

- The "Up / external" arrow (`961e7e07…`) appears 8 times in the design (every "Chi tiết" CTA + 2 hero CTAs); we ship a single `arrow-up-right.svg` and reuse it.
- The 6 award cards share the same `award-bg.png` (`0f4ce32d…`); ship once and reuse with the per-award name image overlaid.
- Header and footer logos have different sources/dimensions — kept as separate files.
