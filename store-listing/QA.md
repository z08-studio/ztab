# Artwork verification — 2026-09-22

- Approved copy: **A — The last tab manager you’ll need.** Repository documentation, marketing copy, and screenshot examples use English.
- Approved identity: B1 Tab Hub, P2 indigo. The four regenerated extension icons match the prior revision and the packaged copies.
- Exports: **5 × 1280×800** Store screenshots, **440×280** and **1400×560** promo tiles. All seven marketing images are opaque RGB PNGs. Two overview sheets cover the Store images and brand system.
- Sources: recaptured Saved from the actual Ztab 2.1.1 extension in an isolated Chrome for Testing profile. The **Public resources** collection contains real Wikipedia, NASA, and Python pages saved through extension workspace operations. The other five approved product captures are unchanged.
- Visual review: inspected the refreshed Saved capture, its final Store image, and both overview sheets. The collection label fits, the page titles and favicons remain readable, and no product pixels were repainted.
- Rendering: `pnpm assets:store` completes using bundled Manrope and Instrument Serif fonts with system-font loading disabled. Capture dimensions and approved slogan line breaks are validated.
- Package: `pnpm package` passes **152 tests**, validates packaged JavaScript and manifest entries, and rebuilds `ztab-2.1.1.zip`.
- Cleanup: local drafts, browser profiles, and review packages belong in ignored `output/` or outside the repository. macOS `.DS_Store` files are ignored.
- Diff: `git diff --check` passes. Runtime permissions, storage behavior, and version numbers are unchanged.

These checks cover local source, artwork, and package preparation. Chrome Web Store upload and publication remain separate actions.
