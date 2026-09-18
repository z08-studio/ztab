# Ztab Chrome Web Store assets

Brand: approved **B1 Tab Hub + P2 indigo**, with standard colors `#493567` and `#A996CC`.

The five screenshots are ready for visual review. Both promotional tiles currently preview slogan **A: The last tab manager you’ll need.** Slogan selection is pending; see `../../SLOGANS.md` and `../review/slogan-options.png` before uploading promo tiles.

- `promo-small-440x280.png`: small promotional tile.
- `promo-marquee-1400x560.png`: marquee promotional preview with a real public-site panel and all three product strengths.
- `screenshots/screenshot-01-side-panel.png`: real public pages from two Chrome windows.
- `screenshots/screenshot-02-pinned-tabs.png`: pinned tabs synchronized across windows.
- `screenshots/screenshot-03-keyboard.png`: the actual keyboard-help dialog and assigned Mac shortcut.
- `screenshots/screenshot-04-groups-bulk.png`: four selected public pages, with the action bar shown separately and labeled as the same selection.
- `screenshots/screenshot-05-saved.png`: saved pages with favicons in an independent local library.

Use the repository's `icons/icon128.png` as the Store icon. It now uses the approved three-tab P2 mark; 16px and 32px icons use wider spacing for legibility.

All five 1280×800 screenshots and both promo tiles are opaque RGB PNGs with bundled Manrope typography. Captures come from the user's Chrome with installed Ztab, taken through Shottr for the earlier Xiaohongshu materials. They show Wikipedia, NASA, Python, Rust and MDN; the keyboard image shows real Ztab help. Browser account controls, private tabs, and unrelated saved pages are excluded. Native Chrome headers are cropped away; controls and rows are never reconstructed. Rebuild with `pnpm assets:store`, and follow `../../ARTWORK.md` for provenance and layout rules. Rendering does not upload or publish anything.
