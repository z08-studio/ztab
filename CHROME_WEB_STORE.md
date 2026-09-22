# Ztab 2.2.0 release

Version **2.2.0** is prepared for release and manual Chrome Web Store upload. It adds New Tab actions in the side panel, updates the optional support recipient and QR code, and refreshes the Store screenshots. This document records local preparation; GitHub release publication and Store upload are separate steps.

## Release baseline

On **2026-09-22**, the [public Store item](https://chromewebstore.google.com/detail/ztab-tab-manager/fakbifeeblnopdhicpmhhmcdhmefphjp?hl=en) showed **Ztab: The last tab manager you’ll need.**, version **2.1.1**, updated **September 19, 2026**. The previous [GitHub release](https://github.com/z08-studio/ztab/releases/tag/v2.1.1) points to `36e271af1bd98df67c5769fb66f5c5a56900c540`.

The downloaded GitHub `ztab-2.1.1.zip` is 82,392 bytes and matches its published SHA-256, `a6cf61bffb74644e05a7d74485c8a335e32eb53a6c2227579279dc07c85b614d`. It is the baseline used for the local upgrade and runtime comparison. Earlier release verification remains available in the [2.1.1 release guide](https://github.com/z08-studio/ztab/blob/v2.1.1/CHROME_WEB_STORE.md).

## Changes from 2.1.1 to 2.2.0

| Area | Change |
| --- | --- |
| New Tab | **+** beside Tabs and Saved creates an active, unpinned tab in the panel's host window, using Chrome's configured New Tab page. |
| Other windows | **+** on another window's heading creates a tab there and focuses that window. The current-window heading has no duplicate action. |
| Interactions | New Tab works from Saved, searches, selection, and Move mode. A successful creation returns to Tabs, clears only its search, and reveals the new row. Saved searches remain. Enter and Space activate the buttons. |
| Failure handling | Pending and duplicate clicks are blocked. Creation failure preserves the view; focus or refresh failure after creation reports that the tab already opened. Host and destination checks preserve normal/private boundaries. |
| Optional support | The displayed, copied, and QR-encoded recipient is `0x64719eBcD29fBbaDCCFb53Cb16aB18cff81a8067` for USDC on Base. |
| Store materials | Fresh 2.2.0 captures show New Tab, pinned tabs, bulk selection, and Saved. English listing copy and release notes describe the new actions. |

The ZIP differs from 2.1.1 in seven runtime files: the manifest, side-panel HTML, panel CSS and JavaScript, workspace controller, support constant, and bundled support QR. There are no new permissions, storage keys, dependencies, or minimum-version changes. **Chrome 123 or later** remains required.

Saved pages, collections, group definitions, shared pinned sites, and preferences persist. As before, live group membership, manual ordering, and recent-use records reset on an extension update or browser restart. The support dialog does not connect a wallet or initiate a payment.

## Release status and package

| Item | Status |
| --- | --- |
| Target version | 2.2.0 in both `manifest.json` and `package.json` |
| Previous GitHub release | `v2.1.1`; its tag and assets remain unchanged |
| Existing Store item | `fakbifeeblnopdhicpmhhmcdhmefphjp` |
| Public Store version | 2.1.1, verified 2026-09-22 |
| Local archive | `ztab-2.2.0.zip`; 83,090 bytes (81.1 KiB), built 2026-09-22 |
| Archive SHA-256 | `208a47bbe9395d950a98b4b8735e59dba3f832e944e82888cff1f28647fb84c8` |
| Package contents | 45 runtime files, with `manifest.json` at the archive root |
| Release branch | `bear-prepare-v2-2-release`, targeting `main` through a release PR |
| GitHub tag and release | Pending release PR merge and publication |
| Store upload, review submission, publication | Pending; to be completed manually by Bear |

Run `pnpm assets:store` to regenerate icons and marketing assets. Run `pnpm package` to execute tests, validate versions, JavaScript syntax and manifest references, and generate `dist-store/` plus the ZIP. The package excludes dependencies, tests, development docs, local output, and marketing images. Rebuilding the archive requires updating its size and checksum here.

## Verification — 2026-09-22

- [x] Run `pnpm package`: **158 tests pass**; packaged JavaScript syntax and manifest references validate.
- [x] Verify all 45 archived files match the source and `dist-store/` byte-for-byte; archive integrity and the runtime allowlist pass. Compare all files with the downloaded 2.1.1 ZIP and confirm unchanged permissions and minimum Chrome version.
- [x] Load the published 2.1.1 package at a fixed unpacked path in an isolated Chrome for Testing **153.0.8010.12** profile on macOS. Seed three Saved entries, a collection, two group definitions, pinned Wikipedia in two windows, and panel preferences. Replace the files with 2.2.0 and reload through Chrome's extension page with Developer mode enabled.
- [x] Confirm the same extension ID, enabled 2.2.0 version, unchanged Saved entries/collection IDs/group definitions, two pinned copies, pinned origins, and hidden-pins/sort/dismissed-tip preferences. Live membership and manual order clear as documented. Verify New Tab after the upgrade and check the support dialog's new recipient.
- [x] Retain the feature's native side-panel, keyboard, Saved/search, failure-path, and 280/320/400px light/dark checks in [tests/README.md](tests/README.md#new-tab-checks).
- [x] Capture the actual 2.2.0 side-panel document with real public pages and regenerate Store materials. Inspect the refreshed sources, cover, and both overview sheets. All five screenshots are 1280×800, the two promotional tiles have the expected dimensions, and all seven marketing images are opaque RGB PNGs. The four approved extension icons remain byte-identical.
- [x] Run `git diff --check`. Keep documentation, listing copy, screenshot samples, and release notes in English.

The local unpacked upgrade does not establish Store delivery. Live incognito creation, third-party New Tab overrides, Windows/Linux, and Chrome 123–129 were not manually rechecked; mode boundaries and creation/focus failure have automated coverage. Local upgrade snapshots, screenshots, and package verification records are in ignored `output/`.

## Manual Chrome Web Store rollout

Update the [existing item](https://chromewebstore.google.com/detail/fakbifeeblnopdhicpmhhmcdhmefphjp) in the [Developer Dashboard](https://chrome.google.com/webstore/devconsole). Keep its extension ID so installed users receive the update.

1. Merge the release PR into `main`; publish the `v2.2.0` GitHub release against that reviewed source when ready. Attach the verified ZIP and its checksum without replacing older release assets.
2. Upload **`ztab-2.2.0.zip`** as the new package in the existing Store item.
3. Use the current English description and **2.2.0** release notes from [store-listing/LISTING.md](store-listing/LISTING.md). Preserve the approved product name and Telegram community invitation.
4. Upload the 128px icon, five individual screenshots, and two promotional tiles from [store-listing/assets/final/](store-listing/assets/final/), following [ARTWORK.md](store-listing/ARTWORK.md). Do not upload overview sheets or source captures.
5. Check the Dashboard's privacy and permission declarations against the current listing and policy. Support remains `https://github.com/boundless-forest/ztab/issues`; privacy is `https://github.com/boundless-forest/ztab/blob/main/PRIVACY_POLICY.md`. These established links redirect to the current repository.
6. Save the package and listing changes, submit for review, and record submission separately from public availability. After publication, verify the Store shows **2.2.0**, an installed update retains its ID and persistent data, and New Tab, the toolbar shortcut, and pinned synchronization work. Update this guide and the README after publication is confirmed.

The current repository is [z08-studio/ztab](https://github.com/z08-studio/ztab). Historical `pinallwindows.*` keys and runtime message names are compatibility identifiers and must not be renamed for this release.
