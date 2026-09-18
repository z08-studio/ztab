# Ztab store artwork

## Approved identity and copy status

Use the approved **B1 Tab Hub + P2 indigo** logo. The three fanned tabs converge at the base; standard colors are **#493567** and **#A996CC**. `source/icon.svg` holds the vector mark, `source/icon-small.svg` widens the gaps for 16–32px, and `source/icon-light.svg` provides the light variant for dark backgrounds.

The refreshed artwork uses a pale background, restrained indigo accents and bundled Manrope typography. The first three screenshots give equal treatment to cross-window management, shared pinned tabs and keyboard interactions. The remaining screenshots explain bulk actions and Saved.

The replacement slogan is **pending user selection**. Candidates and recommendations are in [SLOGANS.md](SLOGANS.md), with editable text in `source/slogans.json`. The two promo tiles currently preview **A: The last tab manager you’ll need.** Feature screenshot headlines do not depend on that selection. Do not treat the preview candidate as an approved replacement for the listing or options-page tagline.

## Upload assets

| Asset | Size | Location |
| --- | ---: | --- |
| Store icon | 128×128 | `../icons/icon128.png` |
| Small promo preview | 440×280 | `assets/final/promo-small-440x280.png` |
| Marquee promo preview | 1400×560 | `assets/final/promo-marquee-1400x560.png` |
| Product screenshots | 1280×800 each | `assets/final/screenshots/` |

The image sizes follow the [Chrome Web Store image guidance](https://developer.chrome.com/docs/webstore/images) and [listing guidance](https://developer.chrome.com/docs/webstore/cws-dashboard-listing), checked on 2026-09-18. Export marketing images as RGB PNGs without alpha. The extension icon retains transparency.

Upload the five screenshots in this order after visual approval:

1. `screenshot-01-side-panel.png` — **Every window. One clear view.** Public pages from two real Chrome windows, with switching and merging visible.
2. `screenshot-02-pinned-tabs.png` — **Pin once. Ready in every window.** The real panel filtered to Wikipedia, showing pinned copies in two windows.
3. `screenshot-03-keyboard.png` — **Find your tab. Keep your flow.** The actual keyboard-help dialog, including the current Mac opener shortcut.
4. `screenshot-04-groups-bulk.png` — **Select together. Act together.** Four selected public pages across two windows, with the real action bar from that selection separately displayed and labeled.
5. `screenshot-05-saved.png` — **Save it now. Find it later.** Wikipedia, NASA and Python in the user's public-material collection, inside the real Saved view.

The overview at `assets/review/screenshots-overview.png` is a review sheet; do not upload it as a sixth screenshot. `assets/review/slogan-options.png` and `assets/review/slogans/` are copy review materials.

## Source provenance

These sources were captured on **2026-09-17** in the user's existing **Google Chrome**, using the installed **Ztab 2.0** and **Shottr**, for the Xiaohongshu materials in this task. This refresh reuses those already privacy-cropped captures. The public pages are Wikipedia, NASA, Python, Rust and MDN. No locally mocked website supplies the visible page titles or favicons.

The full original captures remain local outside this repository. Only the safe product regions are checked in. The user's earlier approval permits local capture followed by cropping; it does not make private browser chrome part of the deliverable.

Chrome's native side-panel header, including its old logo, is cropped away when present. The product's own Tabs/Saved navigation, search fields, lists, help dialog and action controls remain as captured. The old header is neither recolored nor replaced with a fabricated header.

| Checked-in source | Size | Visible content |
| --- | ---: | --- |
| `side-panel-raw.png` | 1090×944 | Product navigation and public pages from two windows |
| `pinned-tabs-raw.png` | 1090×544 | Real Wikipedia search and two pinned copies |
| `keyboard-raw.png` | 1020×1030 | Complete keyboard-help dialog |
| `groups-bulk-raw.png` | 1090×760 | Four public pages selected across windows |
| `bulk-toolbar-raw.png` | 1090×170 | Action bar from the same four-page selection |
| `saved-raw.png` | 1090×704 | Product navigation and public collection in Saved |

All sources live in `assets/source/screenshots/`. `capture-provenance.json` records their original safe-source names, additional crop coordinates and dimensions. The keyboard dialog has its original background and shadow. The Saved collection keeps its real Chinese name, **公开资料**, rather than an edited label.

## Composition rules

- Use genuine product state and public websites. Do not fabricate controls, rows, counts, page content or results.
- Exclude browser account controls, profile photos, private tab titles, private saved items, bookmarks and desktop content from committed sources and deliverables.
- Use proportional scaling; never stretch a capture. Do not use image generation to modify product screenshots.
- Put branding, feature copy and captions outside the captures. Decorative cards and shadows belong to the marketing layout, not the product UI.
- The bulk image contains two separate crops from the same selection. Keep the visible **ACTION BAR · SAME SELECTION** label between them; do not join them into a fake continuous panel.
- Treat the assigned keyboard shortcut as an example. Users can customize the panel opener, and arrow keys / Enter act on the focused list.
- Retain equal emphasis on windows, pins and keyboard use. Describe Saved as a local page library, not cloud sync or saved browser sessions.
- Do not add external calls to action, QR codes or contact details to these images. Public domains shown by the actual product are retained.

## Rebuilding and verification

Run `pnpm assets:store`. The renderer validates source dimensions against `capture-provenance.json` before writing outputs, then regenerates four extension icons, five screenshots, two promo previews, six small slogan tiles and two review boards.

The six screenshot inputs have intentionally different dimensions because they are safe crops of specific real states, not one artificial viewport. Update the source and its recorded dimensions together after verifying a new capture. Keep the capture dates and source notes accurate.

The five Store screenshots and two promo previews use bundled Manrope fonts. The bilingual slogan review board additionally uses available system fonts for Chinese. Manrope's SIL Open Font License is preserved in `source/fonts/OFL.txt`.

Visually inspect each final image at full size, confirm every output dimension and PNG color type, and run `pnpm test` and `git diff --check`. Repackage after changing extension icons. A local render, package, branch or PR does not upload images to the Developer Dashboard or establish Store publication.

The old local sample server and historical Tab Flow backgrounds remain development/history material. They are not inputs to this refreshed artwork.
