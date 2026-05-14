# Asset Manifest — Hệ thống giải (`zFYDgyj_pD`)

Generated 2026-05-14 via MCP `list_media_nodes` + `get_media_files`.

32 media nodes, **3 unique new assets** (rest reuse Homepage SAA's existing files).

## New assets (this feature)

| File                | Figma node                                 | Used by                                                                     | Notes                        |
| ------------------- | ------------------------------------------ | --------------------------------------------------------------------------- | ---------------------------- |
| `icons/target.svg`  | shared hash `fb32aa00…` (MM_MEDIA_Target)  | AwardsSidebarItem prefix icon + per-award detail card "Số lượng" row prefix | 24×24, `fill="currentColor"` |
| `icons/diamond.svg` | shared hash `5d99d0c9…` (MM_MEDIA_Diamond) | Award detail card bullet (qty + value rows)                                 | 24×24, `fill="currentColor"` |
| `icons/license.svg` | shared hash `cdf95dff…` (MM_MEDIA_License) | Award detail card value row prefix                                          | 24×24, `fill="currentColor"` |

## Reused from Homepage SAA

| Asset                   | Location                                                        | Reused for                                                                                                                                            |
| ----------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header logo             | `public/assets/homepage/images/logo-header.png`                 | `HomepageHeader` (`logoSrc` prop)                                                                                                                     |
| Footer logo             | `public/assets/homepage/images/logo-footer.png`                 | `AppFooter` homepage variant                                                                                                                          |
| Keyvisual watercolor    | `public/assets/homepage/images/keyvisual-bg.png`                | `KeyvisualBanner` full-width backdrop                                                                                                                 |
| ROOT / FURTHER wordmark | `public/assets/homepage/images/{root,further}-text.png`         | `KeyvisualBanner` stacked wordmark overlay                                                                                                            |
| Bell icon               | `public/assets/homepage/icons/bell.svg`                         | NotificationButton in `HomepageHeader`                                                                                                                |
| User profile            | `public/assets/homepage/icons/user-default.svg`                 | ProfileMenu fallback avatar                                                                                                                           |
| Flag VN                 | `public/assets/homepage/icons/flag-vn.svg`                      | LanguageSwitcher                                                                                                                                      |
| Chevron down            | `public/assets/homepage/icons/chevron-down-lang.svg`            | LanguageSwitcher                                                                                                                                      |
| Arrow up-right          | `public/assets/homepage/icons/arrow-up-right.svg`               | KudosPromoSection "Chi tiết" CTA                                                                                                                      |
| Kudos bg / wordmark     | `public/assets/homepage/images/kudos-bg.png` + `kudos-logo.svg` | KudosPromoSection (shared component)                                                                                                                  |
| Per-award name overlays | `public/assets/homepage/awards/*-name.png`                      | **Fallback** for AwardDetailCard images (336×336 detail images are NOT exported as MM*MEDIA* from Figma — design has placeholders but no content yet) |
| Award background        | `public/assets/homepage/awards/award-bg.png`                    | Used as backdrop alongside per-award name overlay in AwardDetailCard                                                                                  |

## De-duplication notes

- Target / Diamond / License SVGs each appear ~6 times in the design (one per award + sidebar items). One copy each is sufficient.
- All shared chrome icons (header bell, lang, profile, footer logo) hash-match Homepage SAA's downloaded files — no duplication needed.
- **Per-award 336×336 detail images** are not yet exported as `MM_MEDIA_*` from Figma. AwardDetailCard composes the existing `award-bg.png` + per-award `*-name.png` overlay as a visual placeholder until design ships the dedicated detail artwork.
