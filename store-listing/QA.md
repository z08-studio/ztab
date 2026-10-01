# Artwork verification — Ztab 2.3.0 — 2026-10-01

- Approved copy: **A — The last tab manager you’ll need.** Documentation, marketing copy, and screenshot samples use English.
- Approved identity: B1 Tab Hub, P2 indigo. All four regenerated extension icons remain byte-identical to the prior revision.
- Exports: **5 × 1280×800** Store screenshots, **440×280** and **1400×560** promotional tiles. All seven marketing images are opaque RGB PNGs. Two overview sheets cover the Store images and brand system.
- Sources: the main Tabs capture is from the actual **Ztab 2.3.0** extension page after upgrading the published 2.2.0 package in isolated Chrome for Testing **153.0.8010.12** on macOS at device scale factor 2. It shows a real Python-tab drag onto another window's heading. Pins, bulk actions, and Saved retain their unchanged 2.2.0 captures; the unchanged keyboard-help dialog retains its 2.0 capture. Individual dates and versions are recorded in the provenance file.
- Authenticity: the Tools group is collapsed in the main capture, pinned tabs are hidden, and only public pages are visible. The live **Move to Window 2** hint and destination outline come directly from the running extension. Counts and product pixels are not edited or reconstructed.
- Visual review: inspected the refreshed source, final cover and marquee, and both overview sheets. The destination hint, New Tab controls, window actions, page titles, and favicons remain readable. Screenshots scale proportionally.
- Rendering: `pnpm assets:store` completes using bundled Manrope and Instrument Serif fonts. Approved slogan line breaks and source dimensions validate; the cover now shows **Ztab 2.3** and describes direct window moves.
- Package: `pnpm test` and `pnpm package` pass **170 tests**, validate packaged JavaScript and manifest entries, and create `ztab-2.3.0.zip`. All 45 archived files match the source and staging directory. Version numbers are 2.3.0; permissions and the Chrome 123 minimum remain unchanged.
- Upgrade: the fixed-path 2.2.0 → 2.3.0 check preserves the extension ID, all seven tab IDs, three Saved entries, a collection, two group definitions, two pinned copies, pinned origins, and panel preferences. Live membership and manual order reset as documented. Cross-window dragging and New Tab work after the upgrade. See [the release guide](../CHROME_WEB_STORE.md) for evidence and scope.
- Cleanup: browser profiles and review output stay in ignored `output/` or outside the repository. `git diff --check` passes.

These checks cover local source, artwork, and package preparation. Chrome Web Store upload and publication will be completed manually.
