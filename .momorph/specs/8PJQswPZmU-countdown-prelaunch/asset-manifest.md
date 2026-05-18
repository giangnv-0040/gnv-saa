# Asset Manifest — Countdown Prelaunch Page (`8PJQswPZmU`)

Generated 2026-05-15 via MCP `list_media_nodes` + `get_media_file`.

1 media node, 1 unique asset, downloaded to `public/assets/prelaunch/`.

## Hero background (PNG)

| File               | Figma node                       | Used by             | Notes                                                                |
| ------------------ | -------------------------------- | ------------------- | -------------------------------------------------------------------- |
| `hero-bg.png`      | `2268:35129` (MM_MEDIA_BG Image) | PrelaunchBackground | Full-bleed campaign artwork (1512×1077px source)                     |
| `hero-bg-blur.txt` | (derived)                        | PrelaunchBackground | Base64 blur placeholder data URL for `next/image placeholder="blur"` |

### ⚠️ Provisional placeholder (T001 follow-up)

`hero-bg.png` is currently a copy of `public/assets/homepage/images/keyvisual-bg.png`
(the Homepage SAA hero), used as a placeholder because the harness cannot
write the binary MCP `get_media_file` response directly to disk in this
session. The two assets share the same brand theme (dark navy + orange
organic shapes) so the visual is approximately correct.

**To replace with the production asset**, run on a machine with momorph CLI
write access:

```bash
# Via MoMorph CLI (preferred — uses configured S3 credentials):
momorph download media \
  --file-key 9ypp4enmFmdK3YAFJLIu6C \
  --node-id 2268:35129 \
  --output public/assets/prelaunch/hero-bg.png \
  --format png
```

Then regenerate the blur placeholder if you want a more accurate dominant
colour:

```bash
# Tiny low-res blur:
npx @plaiceholder/cli public/assets/prelaunch/hero-bg.png > \
  public/assets/prelaunch/hero-bg-blur.txt
```

### Asset source dimensions

- Source: 1512×1077 px PNG (matches the page frame, full-bleed)
- Format served: PNG (next/image converts to WebP/AVIF on request)
- Role hint: `background` (per `list_media_nodes`)

## Cover gradient overlay (no asset — pure CSS token)

Node `2268:35130` (Cover RECTANGLE) carries:

```css
background: linear-gradient(
  18deg,
  #00101a 15.48%,
  rgba(0, 18, 29, 0.46) 52.13%,
  rgba(0, 19, 32, 0) 63.41%
);
```

This is captured as the `--bg-prelaunch-cover` CSS variable in
`app/globals.css` (added by T003).
