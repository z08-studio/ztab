# Ztab 2.3.0 release

Version **2.3.0** is prepared for release and manual Chrome Web Store upload. Dragging a regular tab onto another window's heading or one of its tabs now moves the real tab to that window immediately. GitHub release publication and Store upload remain separate steps.

## Release baseline

On **2026-10-01**, the [public Store item](https://chromewebstore.google.com/detail/ztab-the-last-tab-manager/fakbifeeblnopdhicpmhhmcdhmefphjp) showed **Ztab: The last tab manager you’ll need.**, version **2.2.0**, updated **September 23, 2026**. This was checked in Chrome; the search index still returned an older version.

The previous [GitHub release](https://github.com/z08-studio/ztab/releases/tag/v2.2.0) points to `49a2a8b5544478a9ebf67ea4fb1565b470dad5e8`. Its downloaded `ztab-2.2.0.zip` is 83,090 bytes and matches the published SHA-256, `208a47bbe9395d950a98b4b8735e59dba3f832e944e82888cff1f28647fb84c8`. It is the baseline for the local upgrade and runtime comparison. Earlier release evidence remains in the [2.2.0 release guide](https://github.com/z08-studio/ztab/blob/v2.2.0/CHROME_WEB_STORE.md).

The cross-window drag implementation is merged in [PR #16](https://github.com/z08-studio/ztab/pull/16), commit `a33e3c57500b2d388cb00cfd7e90647e4b22d266`.

## Changes from 2.2.0 to 2.3.0

| Area | Change |
| --- | --- |
| Cross-window dragging | Drop on another window's heading or a regular tab from that window to move the actual tab to the destination window's end. Row centers and edges show **Move to …** immediately in both Recently used and Manual order. |
| Groups | A successful window move removes the tab's Ztab group membership and reveals it in the destination window section. Failed moves preserve membership and manual order. Same-window grouping, explicit group-header drops, and menu actions remain available. |
| Window state | The destination keeps its current page selected. Window headings remain drop targets when every tab is grouped. Chrome closes a source window after its last tab moves. |
| Safety | The background writer validates the original window and membership, rechecks live tabs and destinations, excludes pinned tabs and compact windows, and preserves browsing-mode boundaries. Escape cancels a drag. |
| Store materials | English listing copy and release notes explain direct dragging. The cover and marquee use a fresh 2.3.0 capture of the move hint. |

Six runtime files differ from 2.2.0: the manifest, panel JavaScript and CSS, drag controller, workspace controller, and shared workspace utility. There are no new permissions, storage keys, dependencies, or minimum-version changes. **Chrome 123 or later** remains required.

Saved pages, collections, group definitions, shared pinned sites, and preferences persist. As before, live group membership, manual ordering, and recent-use records reset on an extension update or browser restart. Groups are not saved browser sessions.

## Release status and package

| Item | Status |
| --- | --- |
| Target version | 2.3.0 in both `manifest.json` and `package.json` |
| Previous GitHub release | `v2.2.0`; its tag and assets remain unchanged |
| Existing Store item | `fakbifeeblnopdhicpmhhmcdhmefphjp` |
| Public Store version | 2.2.0, verified 2026-10-01 |
| Local archive | `ztab-2.3.0.zip`; 83,916 bytes (81.9 KiB), built 2026-10-01 |
| Archive SHA-256 | `be5b706b08a7f581e855a21e741a99b3fce7cc7c733550bb0324deaf93ffbf0f` |
| Package contents | 45 runtime files, with `manifest.json` at the archive root |
| Release branch | `bear-prepare-v2-3-release`, targeting `main` through a release PR |
| GitHub tag and release | Pending release PR merge and publication |
| Store upload, review submission, publication | Pending; to be completed manually by Bear |

Run `pnpm assets:store` to regenerate icons and marketing assets. Run `pnpm package` to execute tests, validate versions, JavaScript syntax and manifest references, and generate `dist-store/` plus the ZIP. The package excludes dependencies, tests, development docs, local output, and marketing images. Rebuilding the archive requires updating its size and checksum here.

## Verification — 2026-10-01

- [x] Run `pnpm test` and `pnpm package`: **170 tests pass**; packaged JavaScript syntax and manifest references validate.
- [x] Verify all 45 archived files match the source and `dist-store/` byte-for-byte; archive integrity and the runtime allowlist pass. Compare with the downloaded 2.2.0 ZIP and confirm unchanged permissions and minimum Chrome version.
- [x] Upgrade the published 2.2.0 package at a fixed unpacked path in isolated Chrome for Testing **153.0.8010.12** on macOS, with Developer mode enabled. The extension ID, all seven tab IDs, three Saved entries, a collection, two group definitions, two pinned copies, pinned origins, and hidden-pins/sort/dismissed-tip preferences are preserved. Live membership and manual order reset as documented.
- [x] Retain the real-browser drag checks and light/dark 320px screenshots in [tests/README.md](tests/README.md#cross-window-drag-verification). They cover both sort modes, heading/row drops, grouped tabs, an empty current-window section, the last source tab, destination selection, Escape, and compact-window rejection.
- [x] Confirm cross-window dragging and New Tab work after the upgrade. Capture the genuine move hint with public sample pages, regenerate Store artwork with `pnpm assets:store`, and inspect the source, cover, marquee, and review sheets. Other Store screenshots retain their documented earlier captures; icons remain byte-identical.
- [x] Run `git diff --check` after completing the release documentation and assets.

The local unpacked upgrade does not establish Store delivery. Native side-panel closure during a last-tab move, private-mode dragging, Windows/Linux, and Chrome 123–129 were not manually rerun. Last-source-window completion, mode boundaries, stale state, and failure paths have automated coverage. Local upgrade snapshots and package verification records are in ignored `output/`.

## Manual Chrome Web Store rollout

Update the [existing item](https://chromewebstore.google.com/detail/fakbifeeblnopdhicpmhhmcdhmefphjp) in the [Developer Dashboard](https://chrome.google.com/webstore/devconsole). Keep its extension ID so installed users receive the update.

1. Merge the release PR into `main`; publish the `v2.3.0` GitHub release against that reviewed source when ready. Attach the verified ZIP and its checksum without replacing older release assets.
2. Upload **`ztab-2.3.0.zip`** as the new package in the existing Store item.
3. Use the English description and **2.3.0** release notes from [store-listing/LISTING.md](store-listing/LISTING.md). Preserve the approved product name and Telegram community invitation.
4. Replace the cover screenshot (`screenshots/screenshot-01-side-panel.png`) and marquee (`promo-marquee-1400x560.png`) from [store-listing/assets/final/](store-listing/assets/final/). The other screenshots, small promo, and approved icons remain valid. Do not upload overview sheets or source captures.
5. Check the Dashboard's privacy and permission declarations against the current listing and policy. Support remains `https://github.com/boundless-forest/ztab/issues`; privacy is `https://github.com/boundless-forest/ztab/blob/main/PRIVACY_POLICY.md`. These established links redirect to the current repository.
6. Save the package and listing changes, submit for review, and record submission separately from public availability. After publication, verify the Store shows **2.3.0**, an installed update retains its ID and persistent data, and cross-window dragging, New Tab, the toolbar shortcut, and pinned synchronization work. Update this guide and the README after publication is confirmed.

The current repository is [z08-studio/ztab](https://github.com/z08-studio/ztab). Historical `pinallwindows.*` keys and runtime message names are compatibility identifiers and must not be renamed for this release.
