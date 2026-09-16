# Ztab upload-ready assets

Positioning: **Another excellent tab manager for Chrome.**

- `promo-small-440x280.png`: small promotional tile.
- `promo-marquee-1400x560.png`: marquee promotional tile with all three product strengths.
- `screenshots/screenshot-01-side-panel.png`: cross-window tabs, recent sorting, and inline groups.
- `screenshots/screenshot-02-pinned-tabs.png`: pinned tabs synchronized across windows.
- `screenshots/screenshot-03-keyboard.png`: keyboard navigation and thoughtful interactions.
- `screenshots/screenshot-04-groups-bulk.png`: cross-window Ztab groups and bulk tab actions.
- `screenshots/screenshot-05-saved.png`: saved pages with favicons in an independent local library.

Use `icons/icon128.png` as the store icon. Matching colored tabs in two overlapping browser windows preserve the established identity.

The promotional artwork and all five 1280×800 screenshots use bundled Manrope typography, exact Chrome Web Store dimensions, and no alpha channel. Each screenshot shows the complete rendering surface of the actual native side panel, captured through its CDP target and scaled proportionally. Chrome's native header and window frame are outside that surface and are not reconstructed. The first three screenshots and the promo tiles retain equal emphasis on windows, pinned tabs, and keyboard shortcuts. Rebuild all assets with `pnpm assets:store`. Follow `store-listing/ARTWORK.md` for the screenshot order, source capture guidance, and verification rules.
