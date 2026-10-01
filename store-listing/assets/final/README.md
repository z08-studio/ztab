# Ztab final artwork

Identity: **B1 Tab Hub + P2 indigo**. Slogan: **The last tab manager you’ll need.**

## Chrome Web Store

- `promo-small-440x280.png`: 440×280 promotional tile.
- `promo-marquee-1400x560.png`: 1400×560 marquee tile.
- `screenshots/screenshot-01-side-panel.png`: 1280×800; Ztab 2.3 and a real cross-window drag with its destination hint.
- `screenshots/screenshot-02-pinned-tabs.png`: 1280×800; Wikipedia pinned in two windows.
- `screenshots/screenshot-03-keyboard.png`: 1280×800; actual keyboard-help dialog.
- `screenshots/screenshot-04-groups-bulk.png`: 1280×800; four selected pages and the separately labeled action bar.
- `screenshots/screenshot-05-saved.png`: 1280×800; the real Saved collection of public pages.

Upload the five screenshots in numeric order. Use the repository's `icons/icon128.png` for the Store icon. The overview sheets in `../review/` are for reviewing the set, not Store upload.

All seven marketing images are opaque RGB PNGs. Instrument Serif headlines and Manrope details provide consistent typography without relying on system fonts. The layout uses warm paper, ink, and the approved indigo palette.

The cover and marquee use a Ztab 2.3.0 capture from 2026-10-01 with a real cross-window move hint. Pinned tabs, bulk actions, and Saved retain their unchanged Ztab 2.2.0 captures; the keyboard dialog retains its earlier Ztab 2.0 capture. These show real public Wikipedia, NASA, Python, Rust and MDN pages in two windows. Browser account controls and private pages are excluded. The real UI pixels are scaled proportionally, never reconstructed.

Rebuild with `pnpm assets:store`. See `../../ARTWORK.md` for provenance, exact design rules and verification. The files are prepared locally; rendering does not upload or publish them.
