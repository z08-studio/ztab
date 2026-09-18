# Ztab 2.1.0 release

Version **2.0.0 is published** in the existing Chrome Web Store item. Version **2.1.0** adds the approved indigo identity, clearer toolbar icons, an optional support dialog, and a dismissible toolbar pinning tip.

## Verified 2.0 baseline

On **2026-09-18**, the [public Store item](https://chromewebstore.google.com/detail/ztab-tab-manager/fakbifeeblnopdhicpmhhmcdhmefphjp) showed **Ztab: Tab Manager**, version **2.0.0**, updated **2026-09-17**. GitHub's newest release tag is still `v1.1.1`; it is not the baseline for this update.

The 88,107-byte CRX downloaded from Chrome's public update service contains **41 runtime files**. They match commit [`9a7975829eb568c6b76cd6d2680420d03d3dcbbd`](https://github.com/z08-studio/ztab/commit/9a7975829eb568c6b76cd6d2680420d03d3dcbbd) exactly, after removing the Store-injected `update_url` from the manifest and comparing the remaining manifest fields. The file lists also match. CRX SHA-256: `2da78ef5b90875db15fdd53bb18c1670063bb066ecf36d0122d44273f16b5308`.

Use `git diff 9a79758..main` to review the published 2.0 runtime against main. The feature changes reviewed for 2.1 end at `f9dfa3c`; the release preparation updates version numbers, copy, artwork version labels, and verification records.

## Changes from 2.0 to 2.1

| Area | 2.1 change |
| --- | --- |
| Identity | Approved B1 Tab Hub logo in P2 indigo; the slogan is **The last tab manager you’ll need.** |
| Toolbar | Optically fitted 16px and 32px icons improve legibility at actual toolbar size. |
| Pinning guidance | An unpinned toolbar action shows a small tip. Pinning hides it; dismissing it is remembered locally across windows and restarts. |
| Optional support | **Support my coding** shows a bundled address QR and a copy button for USDC on Base. It does not connect a wallet, initiate transfers, or contact a payment service. |
| Store materials | Five refreshed screenshots and two promotional tiles; matching social assets are prepared separately. Version labels follow the package's major/minor version. |

Inline cross-window groups, Saved, batch actions, recent/manual sorting, display labels, and light/dark layouts are already in **2.0**. They are not new 2.1 features. The final extension has no hosted checkout or wallet SDK; the intermediate support-site implementation was removed before this release.

Permissions, Chrome's minimum version (**123**), existing storage keys, pinned synchronization, workspace operations, window merging, and keyboard navigation are unchanged from the published 2.0 runtime. The pinning tip adds only `ztab.toolbarPinTipDismissed` in local storage. Existing group definitions, Saved pages/collections, shared pinned sites, and preferences remain. As in 2.0, live group membership, manual ordering, and recent-use records reset on an extension update or browser restart.

## Release status and package

| Item | Status |
| --- | --- |
| Target version | 2.1.0 in both `manifest.json` and `package.json` |
| Existing Store item | `fakbifeeblnopdhicpmhhmcdhmefphjp` |
| Public baseline | 2.0.0, verified 2026-09-18 |
| Local archive | `ztab-2.1.0.zip`; 82,372 bytes (80.4 KiB), built 2026-09-18 |
| Archive SHA-256 | `66bf4880c6957ccc24d8ad661dff7f79ff2438860b4a585178e0b13fcd7ad5a9` |
| Package contents | 45 runtime files, with `manifest.json` at the archive root |
| 2.1 upload, review submission, publication | Pending; local preparation does not establish these states |

Run `pnpm assets:store` to regenerate icons and marketing assets. Run `pnpm package` to execute the tests, validate versions, JavaScript syntax and manifest references, and generate `dist-store/` plus the ZIP. The package includes runtime files, the privacy policy and license; it excludes dependencies, tests, development docs, review output, and marketing images. Rebuilding the archive requires updating its size and checksum here.

## Release verification — 2026-09-18

- [x] Compare the published 2.0 CRX with its source commit and review the actual 2.1 delta.
- [x] Run `pnpm package`: **152 tests pass**; JavaScript syntax and manifest references validate.
- [x] Verify all 45 archived files match `dist-store/` byte-for-byte and contain only the runtime allowlist.
- [x] Regenerate the approved artwork with `pnpm assets:store`; update marketing version labels to 2.1 without changing captured product pixels.
- [x] Upgrade the downloaded 2.0 runtime to the prepared 2.1 files at the same unpacked path in isolated Chrome for Testing 153. The extension ID stays the same; Saved entries, collection IDs, group definitions, pinned origins, hidden-pins and sort preferences are preserved exactly. Two pinned copies remain in two windows. Live membership clears as documented.
- [x] Use Chrome's native **Pin to toolbar** toggle: pinning hides the tip and unpinning restores it. Dismissing with Enter focuses Search, updates a second window, and persists after a page reload and full browser restart. Saved data also survives the restart; the restarted panel logs no console errors or warnings.
- [x] Check the support dialog at 280px, 320px and 420px in light/dark modes with no horizontal overflow; inspect both 320px captures. Scoped clipboard stubs verify the success message and the denied-write fallback selecting all 42 address characters, without changing the system clipboard. Escape returns focus to the support button. The automated QR test verifies the bundled recipient.
- [x] Visually review the regenerated Store cover and both Store/social contact sheets; validate screenshot/social dimensions and RGB encoding, and verify source captures and provenance remain byte-identical. `git diff --check` passes.

The reviewed runtime changes contain no identified release-blocking correctness issue. Release preparation corrects the stale 2.0 version/rollout documentation and hardcoded artwork labels, and documents the new pinning-tip preference in the privacy policy. Support and privacy URLs were rechecked through their GitHub redirects and returned HTTP 200.

Earlier verification remains dated in [tests/README.md](tests/README.md). Windows/Linux, Chrome 123–129, and a Chrome Web Store-delivered update still require checks on those environments; a local unpacked upgrade does not establish Store delivery.

## Chrome Web Store rollout

Update the [existing item](https://chromewebstore.google.com/detail/fakbifeeblnopdhicpmhhmcdhmefphjp) in the [Developer Dashboard](https://chrome.google.com/webstore/devconsole). Keep its extension ID so installed users receive the update.

1. Recheck the currently published version and upload the verified `ztab-2.1.0.zip` when publishing proceeds.
2. Use the current fields and **2.1.0** release notes from [store-listing/LISTING.md](store-listing/LISTING.md). Keep **Ztab: Tab Manager** as the name and preserve the Telegram community invitation.
3. Upload the 128px icon, five individual screenshots, and two promotional tiles from [store-listing/assets/final/](store-listing/assets/final/), following [ARTWORK.md](store-listing/ARTWORK.md). Do not upload review sheets or social images to the Store.
4. Keep support at `https://github.com/boundless-forest/ztab/issues` and replace the legacy privacy field with `https://github.com/boundless-forest/ztab/blob/main/PRIVACY_POLICY.md`. The 2026-09-18 public listing still linked to `boundless-forest/pinallwindows` and showed **Website content** in its data disclosures; reconcile Dashboard fields with the current policy and listing declarations before submission.
5. Save the package and listing changes, submit for review when authorized, and record the Dashboard state separately from public availability.
6. After publication, verify the public version is **2.1.0**, the new assets are visible, and an installed update retains the ID and persistent data. Verify the toolbar action, assigned shortcut, and pinned synchronization. Update the README preparation note after public availability is confirmed.

The current repository is [z08-studio/ztab](https://github.com/z08-studio/ztab); `origin` uses `git@github.com:z08-studio/ztab.git`. Public support links retain their established `boundless-forest/ztab` address. Verify redirects before Store submission. Historical `pinallwindows.*` keys and runtime message names are compatibility identifiers and must not be renamed for this release.
