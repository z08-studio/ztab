# Ztab artwork

## Approved identity and slogan

Use **B1 Tab Hub + P2 indigo**, with the approved **The last tab manager you’ll need.** slogan (option A). The standard vector symbol uses **#493567** and **#A996CC**. `source/icon.svg` is the standard symbol; `icon-small.svg` is optically fitted for 16–32px, with less padding, taller simplified silhouettes, wider gaps, and a darker **#927DB8** secondary tone for visibility on gray browser toolbars. `icon-light.svg` is the approved light variant. `wordmark.svg` and `wordmark-light.svg` preserve the outlined Manrope Bold lockups from the approved brand kit.

The approved wording and line breaks live in `source/slogan.json`. [SLOGANS.md](SLOGANS.md) records usage. Repository copy and marketing assets are maintained in English.

## Design system

The layout uses typography, alignment and real product content as its main visual elements:

- **Warm paper #F5F2ED** carries the windows, keyboard and Saved images. **Ink #292535** is the principal text color.
- **Deep plum #382B47** gives the pinned-tabs image and marquee a darker rhythm; the small promo uses primary **#493567**. The light logo comes from the approved dark-background variant.
- **Pale lilac #E8E0ED** distinguishes bulk actions. Secondary **#A996CC** remains in the logo rather than washing every page in purple.
- **Instrument Serif Regular** gives headlines a narrower, editorial shape. **Manrope Medium/Bold** handles explanations and small labels.
- The approved wordmark remains outlined and unchanged. Typeface choices apply to marketing copy, not to the captured product interface.
- Store artwork uses 48–56px outer margins, consistent top branding and a bottom rule. Different content gets different compositions: a split introduction, a broad pinned-list image, a keyboard sequence, a selection with a separate action bar, and Saved with concise marginal notes.
- Use flat color, fine rules and proportional screenshots. Avoid ornamental gradients, blobs, oversized rounded cards, fake browser frames, glows and generic feature-pill grids.

All render fonts are bundled under SIL Open Font Licenses; rendering does not depend on system fonts. See `source/fonts/README.md` for sources.

## Deliverables

| Asset | Size | Location |
| --- | ---: | --- |
| Toolbar icons | 16×16 and 32×32 | `../icons/icon16.png`, `../icons/icon32.png` |
| Store icon | 128×128 | `../icons/icon128.png` |
| Small promo | 440×280 | `assets/final/promo-small-440x280.png` |
| Marquee promo | 1400×560 | `assets/final/promo-marquee-1400x560.png` |
| Five Store screenshots | 1280×800 each | `assets/final/screenshots/` |

The Store image sizes follow the [Chrome Web Store image guidance](https://developer.chrome.com/docs/webstore/images), verified on 2026-09-18. All seven marketing images are RGB PNGs without alpha. Extension icons retain transparency.

Use the Store screenshots in this order:

1. **Across windows** — approved slogan and public pages from two Chrome windows; switching and Merge here are visible.
2. **Pinned tabs** — “Pin once.” The real Wikipedia search shows pinned copies in two windows.
3. **Keyboard shortcuts** — “Stay in flow.” The actual help dialog accompanies a three-step keyboard sequence.
4. **Bulk actions** — “A little less tab juggling.” Four public pages selected across windows, with their action bar separately displayed and labeled.
5. **Saved pages** — “Worth keeping.” Wikipedia, NASA and Python in the real **Public resources** collection.

`assets/review/screenshots-overview.png` and `brand-overview.png` are review sheets. Upload individual final images, not the overview sheets.

## Authentic screenshot sources

The windows, pins, keyboard and bulk sources were captured on **2026-09-17** in the user's **Google Chrome**, with installed **Ztab 2.0** and **Shottr**. Saved was recaptured on **2026-09-22** in an isolated **Chrome for Testing** profile with **Ztab 2.1.1** and the **Public resources** collection. The collection was populated through the extension's workspace operations using real open Wikipedia, NASA and Python pages. Public websites in the full artwork set also include Rust and MDN. Page titles and favicons come from those sites.

Full original captures stay local outside the repository and deliverable ZIP. Only safe product regions are checked in. Chrome's native side-panel header, including its old logo, was cropped away when present. That header is not recolored or replaced. Navigation, fields, rows, dialog and action controls stay exactly as captured.

| Safe source | Size | Visible content |
| --- | ---: | --- |
| `side-panel-raw.png` | 1090×944 | Navigation and public pages from two windows |
| `pinned-tabs-raw.png` | 1090×544 | Wikipedia search and two pinned copies |
| `keyboard-raw.png` | 1020×1030 | Complete keyboard-help dialog |
| `groups-bulk-raw.png` | 1090×760 | Four public pages selected across windows |
| `bulk-toolbar-raw.png` | 1090×170 | Action bar from the same selection |
| `saved-raw.png` | 1090×704 | Navigation and the public collection in Saved |

All sources live in `assets/source/screenshots/`. `capture-provenance.json` records source identifiers, crop coordinates and dimensions, with an individual capture date for refreshed sources. The keyboard dialog keeps its own backdrop and shadow. Saved keeps its genuine collection name, **Public resources**.

## Content and privacy rules

- Never reconstruct or alter rows, counts, controls, icons or results inside screenshots. Use proportional scaling without distortion.
- Keep account controls, profile photos, private page titles, bookmarks, unrelated saved items and desktop content out of deliverables.
- Add brand and explanatory text outside the product captures.
- Keep the bulk action bar visibly separate from the list and label it **ACTION BAR / SAME SELECTION**.
- Treat keyboard assignments as examples. The panel opener is customizable; arrows and Enter act on the focused list.
- Give windows, shared pins and keyboard use equal weight. Saved is a local page library, not cross-device sync or saved browser sessions.
- Keep screenshot examples and surrounding copy in English. Add no links, QR codes, contact details or external calls to action to marketing images. Preserve public domains shown by the real product.

## Rebuilding and verification

Run `pnpm assets:store`. The script validates capture dimensions and the approved slogan, then regenerates four icons, seven marketing images and two overview sheets. The 16px and 32px icons use the optically fitted small variant; 48px, 128px, and marketing artwork use the standard approved geometry.

Review each final image at full size and the Store set at its 640×400 display scale. Check PNG dimensions and color types, confirm source integrity, and run `pnpm package` plus `git diff --check`. Packaging includes the updated icon and options-page slogan but does not upload to the Developer Dashboard or publish anything.

Historical Tab Flow sources are not inputs to this artwork. Keep local drafts, browser profiles and review packages in ignored `output/` or outside the repository; the active artwork contains only the chosen identity and slogan.
