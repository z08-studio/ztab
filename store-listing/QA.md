# Artwork verification — Ztab 2.2.0 — 2026-09-22

- Approved copy: **A — The last tab manager you’ll need.** Documentation, marketing copy, and screenshot samples use English.
- Approved identity: B1 Tab Hub, P2 indigo. All four regenerated extension icons remain byte-identical to the prior revision.
- Exports: **5 × 1280×800** Store screenshots, **440×280** and **1400×560** promotional tiles. All seven marketing images are opaque RGB PNGs. Two overview sheets cover the Store images and brand system.
- Sources: refreshed Tabs, pinned tabs, bulk selection/action bar, and Saved from the actual **Ztab 2.2.0** side-panel document in an isolated Chrome for Testing 153 profile at device scale factor 2. Real Wikipedia, NASA, Python, Rust, and MDN pages are open in two windows. The unchanged keyboard-help dialog retains its earlier capture.
- Authenticity: the Tools group is collapsed in the main capture. The bulk capture uses an HTTPS search, hidden pinned tabs, and four selected public pages; the action bar comes from the same selection. Saved shows the genuine **Public resources** collection preserved during the upgrade. Counts and product pixels are not edited or reconstructed.
- Visual review: inspected all refreshed sources, the final cover, and both overview sheets. New Tab controls, window actions, page titles, favicons, and collection names remain readable. Screenshots scale proportionally.
- Rendering: `pnpm assets:store` completes using bundled Manrope and Instrument Serif fonts. Approved slogan line breaks and source dimensions validate; the cover now shows **Ztab 2.2**.
- Package: `pnpm package` passes **158 tests**, validates packaged JavaScript and manifest entries, and creates `ztab-2.2.0.zip`. All 45 archived files match the source and staging directory. Version numbers are 2.2.0; permissions remain unchanged.
- Upgrade: the fixed-path 2.1.1 → 2.2.0 check preserves the extension ID, Saved, collections, group definitions, pinned sites/copies, and panel preferences. See [the release guide](../CHROME_WEB_STORE.md) for evidence and scope.
- Cleanup: browser profiles and review output stay in ignored `output/` or outside the repository. `git diff --check` passes.

These checks cover local source, artwork, and package preparation. Chrome Web Store upload and publication will be completed manually.
