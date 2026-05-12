# Login — Assets Map

Mapping from Figma media nodes → local files in `public/assets/`.

| Figma node ID                           | Figma name                 | Role               | Local path                                    | Format        | Size  | Notes                                                                                                                             |
| --------------------------------------- | -------------------------- | ------------------ | --------------------------------------------- | ------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------- |
| `2939:9548`                             | MM_MEDIA_Root Further Logo | image (key visual) | `public/assets/login/key-visual.png`          | PNG (451×200) | 13 KB | Hero artwork above the LOGIN button. Plan originally suggested `.webp` — Figma exports as PNG; Next/Image will optimize on serve. |
| `I662:14391;178:1033;178:1030`          | MM_MEDIA_Logo              | icon (52×48)       | `public/assets/common/logo.png`               | PNG           | 3 KB  | SAA brand mark in header. Plan originally suggested `.svg` — Figma exports as PNG.                                                |
| `I662:14426;186:1766`                   | MM_MEDIA_Google            | icon (24×24)       | `public/assets/common/icons/google.svg`       | SVG           | 1 KB  | Google "G" icon inside the LOGIN button.                                                                                          |
| `I662:14391;186:1696;186:1821;186:1709` | MM_MEDIA_VN                | icon (24×24)       | `public/assets/common/flags/vn.svg`           | SVG           | 1 KB  | Vietnam flag for the default-locale chip.                                                                                         |
| `I662:14391;186:1696;186:1821;186:1441` | MM_MEDIA_Down              | icon (24×24)       | `public/assets/common/icons/chevron-down.svg` | SVG           | 149 B | Down-chevron for the language switcher; reusable across screens.                                                                  |

## Sanitization

All SVGs scanned: no `<script>` tags, no external `href`/`xlink:href` to remote URLs. Safe to inline or `<img>`.

## Missing — hero decorative organic shape (visual verification finding)

`mms_C_Keyvisual` (node `662:14388`) contains a single child RECTANGLE
`662:14389` "image 1" whose CSS is `background: url(<path-to-image>) ...`.
This is a Figma-embedded vector image (NOT an `MM_MEDIA_*` asset), so it
does not show up in `list_media_nodes` and cannot be fetched via
`get_media_files`. It is the **dark-navy ground + orange/red organic shape**
that fills the entire login canvas in the design.

For now the implementation uses a solid `--color-hero-background: #00101a`
fill (approximated from the documented `--color-foreground` token). Visual
diff vs Figma is approximately:

- ✅ Dark navy hero background
- ✅ ROOT FURTHER letterforms positioned upper-left, scaled to ~580px
- ✅ Welcome copy in cream over the dark ground
- ✅ Yellow CTA visible against the dark
- ❌ Organic colored shape — missing (still flat color background)

**Action item for design team:** export `mms_C_Keyvisual` (or just node
`662:14389`'s underlying image) as a PNG/WebP at 1440×1024 (or 2× DPR for
retina). Save as `public/assets/login/hero-background.webp` and update
`app/login/page.tsx` wrapper to layer it as a `background-image` (covering,
positioned `center top`). Until then the cream/yellow content is clearly
readable on flat navy and the screen is functionally complete.

## Placeholder assets (Phase 4 — TODO replace)

The Dropdown-ngôn ngữ frame (`hUyaaugye2`) was checked during Phase 4: it
exposes 0 MM_MEDIA assets — its flags are inline vector shapes, not exported
images. Until the design team exports proper SVGs, the following placeholders
were generated locally and committed:

| Path                                | What it is                                                                | Action required                                                      |
| ----------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `public/assets/common/flags/gb.svg` | Simplified Union Jack (blue ground, red+white cross, simplified diagonal) | Replace with production SVG once design exports it from `hUyaaugye2` |
| `public/assets/common/flags/jp.svg` | Japan flag (white field + red circle)                                     | Same — replace from production export                                |

Each placeholder SVG carries an inline `TODO` comment so the source is
unambiguous. Both are sanitized (no scripts, no external refs).

Also added during Phase 4:

| Figma node ID                           | Figma name    | Local path                                    | Notes                                                                                                                   |
| --------------------------------------- | ------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `I662:14391;186:1696;186:1821;186:1441` | MM_MEDIA_Down | `public/assets/common/icons/chevron-down.svg` | Used by `<LanguageSwitcher>` trigger; rotates 180° when open. Originally missed in tasks.md — added as T006b in Phase 1 |

## Filename convention check (T007)

- All filenames kebab-case ✅
- Folder structure groups by feature (`login/`) vs shared (`common/{flags,icons}/`) ✅
- Consumers reference assets via the `/assets/...` URL — no hardcoded values inside components ✅

## Final tree

```
public/assets/
├── login/
│   └── key-visual.png                # 13 KB — used by LoginHero (priority/LCP)
└── common/
    ├── logo.png                       # 3 KB — SAA brand mark in AppHeader
    ├── icons/
    │   ├── google.svg                 # 1 KB — inside LoginButton
    │   └── chevron-down.svg           # 149 B — LanguageSwitcher trigger
    └── flags/
        ├── vn.svg                     # 1 KB — production export
        ├── gb.svg                     # placeholder, TODO
        └── jp.svg                     # placeholder, TODO
```
