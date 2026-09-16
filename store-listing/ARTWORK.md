# Ztab store artwork

## Positioning and visual direction

**Another excellent tab manager for Chrome.**

The artwork gives equal weight to Ztab's three strengths: managing tabs across windows, keeping pinned tabs in sync across windows, and fast shortcuts with thoughtful interactions. The product name uses a capital Z: **Ztab**, following the Z-series naming convention.

The established icon stays recognizable: two overlapping browser windows repeat the same coral, violet, and teal pinned tabs. Its dedicated 16 px source keeps the toolbar version legible. Promotional artwork uses deep indigo, restrained colored accents, and bundled Manrope typography.

The marquee pairs the positioning line with abstract browser windows and three equally sized benefit cards. The small tile keeps the same positioning with short Windows, Pins, and Shortcuts labels. These window motifs are SVG artwork, not product screenshots.

## Upload assets

| Asset | Size | Location |
| --- | ---: | --- |
| Store icon | 128×128 | `icons/icon128.png` |
| Small promo tile | 440×280 | `assets/final/promo-small-440x280.png` |
| Marquee promo tile | 1400×560 | `assets/final/promo-marquee-1400x560.png` |
| Product screenshots | 1280×800 each | `assets/final/screenshots/` |

Upload the screenshots in this order:

1. `screenshot-01-side-panel.png` — **All your tabs. One clear view.** Show recently used tabs, cross-window groups, and window controls in the real side panel, alongside three concise benefits.
2. `screenshot-02-pinned-tabs.png` — **Pin once. Ready in every window.** Show pinned copies from two windows in the actual side panel.
3. `screenshot-03-keyboard.png` — **Fast keys. Thoughtful details.** Show the real panel after keyboard navigation, alongside callouts for opening the panel, focusing rows with Up/Down, and switching with Enter.
4. `screenshot-04-groups-bulk.png` — **Related tabs. Together at last.** Show a cross-window Ztab group with multiple real tabs selected and the bulk toolbar visible.
5. `screenshot-05-saved.png` — **Worth keeping? Save it for later.** Show the independent Saved library with real saved pages, favicons, and collections.

## Rebuilding the artwork

Run `pnpm assets:store` to regenerate four extension icons, both promotional tiles, and all five screenshots. The renderer in `scripts/render-store-assets.mjs` embeds the checked-in fonts and exports the promotional tiles and screenshots without an alpha channel.

Keep privacy-safe, current product captures in `assets/source/screenshots/`:

- `side-panel-raw.png`
- `pinned-tabs-raw.png`
- `keyboard-raw.png`
- `groups-bulk-raw.png`
- `saved-raw.png`

### Native capture contract

Capture the **rendering surface of the actual native Chrome side panel** through its Chrome DevTools Protocol target. Use an isolated browser profile, open Ztab as a native side panel, and verify that the target belongs to that panel. A standalone extension tab is not an equivalent source.

Keep the same panel viewport throughout all five images. The renderer's `screenshotCapture` contract records the measured source dimensions: **360×665**. Update that contract only after measuring a newly captured native panel viewport. The renderer reads and checks every source image before writing any output, so old or differently sized captures fail visibly.

The CDP surface includes the extension's visible Tabs/Saved navigation, controls, content, and footer. It excludes Chrome's native **Ztab: Tab Manager** header, browser toolbar, window frame, and macOS interface. Do not add or reconstruct those missing elements in the artwork. Capturing this surface avoids Stage Manager thumbnail artifacts from whole-window screenshots while preserving the real panel UI.

All five screenshots use a consistent split composition. Short copy and three benefit callouts sit on the left. The complete panel image fits proportionally within a **520×688** area on the right, without stretching or cropping. No interface content is redrawn, and there is no full-window inset.

Start the checked-in sample server with `node scripts/store-demo-server.mjs`. It binds only to `127.0.0.1` on ports 4179 (project pages), 4180 (Inbox), and 4181 (Team calendar), and supplies the sample page favicons shown in the captures. Open the routes defined in that script in two real Chrome windows, then use Ztab to build the shown group, saved collection, and selection. The server is an artwork preparation tool and is excluded from the extension package.

Capture each actual state before taking the image:

| Source | Required visible state |
| --- | --- |
| `side-panel-raw.png` | Tabs view, recent sorting, at least two actual browser windows, an expanded group with window labels, and a window merge control |
| `pinned-tabs-raw.png` | Expanded pinned section with synchronized copies from two actual browser windows |
| `keyboard-raw.png` | Tabs view after actual arrow-key navigation, with a clearly focused row; use the real assigned opener shortcut |
| `groups-bulk-raw.png` | Multiple selected tabs, including a cross-window group, with selection count and Group/Move/Close/More toolbar visible |
| `saved-raw.png` | Saved view containing real locally saved pages with favicons and collection labels |

Captions and promotional artwork are rendered from code, so new captures can replace old ones without editing bitmap images. The old textless Tab Flow PNGs remain as historical source material and are no longer used by the renderer.

## Screenshot rules

- Use current, real Ztab behavior. Do not fabricate controls or results.
- Keep personal URLs, account names, profile photos, bookmarks, and notifications out of the capture.
- Capture the assigned shortcut shown by Chrome; users can customize it. Up/Down and Enter operate while the tab list is focused.
- Put short captions in reserved space beside or above the product image, without covering useful UI.
- Export the final artwork at exact dimensions, with square outer corners and no transparency.
- Inspect the rendered files after every source or caption change; a successful render does not verify the product state or Store approval.

## Source provenance

The v2.0.0 source set was captured on **2026-09-16** in **Chrome for Testing 153.0.8010.12**, using an isolated profile, the unpacked extension, and harmless sample pages. The native side panel was opened with the actual Chrome shortcut. Its **360×665** rendering surface was captured using CDP `Page.captureScreenshot` on the native side-panel target, rather than a standalone extension tab. The browser windows, pinned copies, groups, selections, saved pages, and keyboard focus shown in the set are real product state. Sample page content is served locally; no personal browsing data is included. The release preparation notes contain verification evidence for the captured states.

Only deterministic SVG composition and proportional scaling are applied to the source images. The CDP sources show the native side-panel rendering surface, not the native Chrome header or frame. Captions live outside the product capture. Do not use generated images, fabricated controls, or reconstructed rows as product screenshots.

The active promotional window motifs, typography, and layouts are SVG composed by the repository renderer. The existing window-and-tabs icon is retained from the established visual system. Historical textless Tab Flow backgrounds were generated with OpenAI ImageGen but are not included in the current rendered assets.

Manrope is distributed under the SIL Open Font License 1.1. Its license is preserved alongside the checked-in font files in `source/fonts/`.
