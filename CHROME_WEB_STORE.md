# Ztab 2.0.0 release

The product name is **Ztab**, with a capital Z to match the Z-series naming convention used by **Zdraft**. It is positioned as **Another excellent tab manager for Chrome.** The product has three equal pillars: managing tabs across windows, shared pinned tabs, and keyboard shortcuts with thoughtful interactions.

Version **2.0.0** prepares a larger side-panel update: inline cross-window groups, batch actions, an independent Saved library, recent/manual sorting, website icons, and compact light/dark layouts. Existing pinned synchronization, window merging, and keyboard navigation remain part of the product.

## Release status

This release is being prepared in a separate pull request. A local archive, GitHub push, or merged pull request does not upload, submit, or publish a Chrome Web Store update.

| Item | Status |
| --- | --- |
| Target version | 2.0.0 |
| Minimum Chrome version | 123 |
| Existing Store item | `fakbifeeblnopdhicpmhhmcdhmefphjp` |
| Release archive | `ztab-2.0.0.zip`; 84,722 bytes (82.7 KiB), built 2026-09-16 |
| Store listing copy | Prepared in [store-listing/LISTING.md](store-listing/LISTING.md) |
| Upload, review submission, and publication | Separate release steps; not established by this preparation |

Archive SHA-256: `c56ca18fd0bdf6d004b41fee4de45c1bb5c37e2ac36473ed6f3e75ebf61466ee`.

Recheck the published version immediately before upload; do not infer it from the local manifest. Rebuilding the archive requires recording its new checksum.

### Public Store audit — 2026-09-16

The [public item](https://chromewebstore.google.com/detail/fakbifeeblnopdhicpmhhmcdhmefphjp) showed version **1.1.1**, updated **2026-09-15**, with the lowercase title **ztab: Tab Manager** and **three screenshots**. Its overview describes the three product pillars and ends with the [Telegram community invitation](https://t.me/z08_studio).

The public privacy link still points to `https://github.com/boundless-forest/pinallwindows/blob/main/PRIVACY_POLICY.md`. The prepared replacement, `https://github.com/boundless-forest/ztab/blob/main/PRIVACY_POLICY.md`, was verified to redirect to `z08-studio/ztab` and return HTTP 200. Update the Dashboard field; the working redirect does not mean the public listing has already changed.

Version 2.0.0 is newer than the audited 1.1.1 release. No upload, review submission, or 2.0.0 publication is established by this public audit.

## Release materials

- Run `pnpm assets:store` to regenerate the icons and promotional assets from the checked-in sources.
- Run `pnpm package` to create `ztab-2.0.0.zip` and the unpacked `dist-store/` directory.
- Copy the listing fields and 2.0.0 release notes from [store-listing/LISTING.md](store-listing/LISTING.md).
- Use the PNG files in `store-listing/assets/final/` and follow the screenshot guidance in [store-listing/ARTWORK.md](store-listing/ARTWORK.md).
- Use [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for the public privacy policy.

## Local verification — 2026-09-16

- [x] Audit the public Store version: 1.1.1 on 2026-09-16; the prepared 2.0.0 version is newer.
- [x] Confirm `manifest.json` and `package.json` both use 2.0.0; the packaged manifest requires Chrome 123 or later.
- [x] Run `pnpm package`: all **144 tests** pass, packaged JavaScript syntax and manifest references validate, and the archive size and checksum are recorded above.
- [x] Inspect the ZIP: `manifest.json` is at its root, all **41 files** match `dist-store/` byte-for-byte, and development docs, tests, dependencies, demo output, and store artwork are absent.
- [x] Load the current 2.0.0 **source checkout** in an isolated Chrome for Testing **153.0.8010.12** profile. Verify the native side-panel opener using the actual macOS **Shift+Command+9** assignment.
- [x] Verify real sample state for captures: **two windows, 11 tabs, four pinned tabs**, a **Launch project** group spanning both windows, and **six Saved pages** created through extension operations.
- [x] Load `dist-store/` in a separate fresh Chrome profile: confirm version **2.0.0**, minimum Chrome **123**, assigned shortcut, and successful rendering of the Tabs document and options page with **no page errors**.
- [x] Visually review all five **1280×800 RGB PNG** screenshots, including real keyboard focus, three selected group members, and six loaded Saved favicons. The four icon files and both promotional tiles remain byte-identical.
- [x] Verify support and privacy-policy URLs resolve publicly through the repository redirect.

Native side-panel screenshots come from the source checkout; the separate packaged-build smoke check loads its real extension documents. The earlier feature-level Chrome checks in [tests/README.md](tests/README.md) remain prior evidence; they do not establish a complete manual regression run against this release package.

### Remaining pre-publication manual checks

- [ ] Complete the keyboard, pinned-tab, and window-merge manual checks in [tests/README.md](tests/README.md) against the packaged build.
- [ ] Manually verify inline grouping, stale-editor protection, batch actions, Saved icons, recent/manual sorting, and regular/incognito separation against that build.

## Packaging instructions

From the repository root:

```sh
pnpm install
pnpm assets:store
pnpm package
```

The package command:

1. Runs the complete test suite.
2. Verifies the manifest and package versions match.
3. Copies only extension runtime files into `dist-store/`.
4. Checks every packaged JavaScript file and manifest file reference.
5. Creates `ztab-2.0.0.zip` with `manifest.json` at its root.
6. Prints the archive size and SHA-256 checksum.

The package includes the privacy policy and license, and excludes development docs, tests, dependencies, source-control metadata, and store artwork.

## Chrome Web Store update

Update the [existing Chrome Web Store item](https://chromewebstore.google.com/detail/fakbifeeblnopdhicpmhhmcdhmefphjp) in the [Developer Dashboard](https://chrome.google.com/webstore/devconsole). Its extension ID is `fakbifeeblnopdhicpmhhmcdhmefphjp`.

1. Confirm the published version, then upload the verified `ztab-2.0.0.zip` to that item when release approval is given.
2. Use `Ztab: Tab Manager` as the listing name and replace the summary, description, release notes, icon, promotional tiles, and screenshots with the prepared materials. Use `Ztab` with a capital Z throughout product copy.
3. Compare the packaged permissions with the currently published version. Review all permission justifications and privacy declarations in [store-listing/LISTING.md](store-listing/LISTING.md), including `tabGroups` for native groups during merging, `system.display` for local monitor labels, and `favicon` for Saved icons. `favicon` adds no extra permission warning when `tabs` is already present.
4. Keep the support URL `https://github.com/boundless-forest/ztab/issues` and replace the legacy privacy field with `https://github.com/boundless-forest/ztab/blob/main/PRIVACY_POLICY.md`. Verify both pages remain public. Preserve the Telegram community invitation in the description.
5. Save the upload and listing changes as a draft, then submit for review only when submission is authorized. Record the Dashboard status separately from public publication.
6. After approval and publication, verify the public item shows version 2.0.0 and the current listing assets. Verify an installed update retains the extension ID, pinned-site data, and panel preferences, and that the toolbar action and shortcut still work.
7. Remove the temporary 2.0.0 preparation note in the README only after public availability is confirmed.

Use the existing item so the extension keeps its identity and existing installations receive an update. Keep historical `pinallwindows.*` storage keys and existing runtime message identifiers: they are compatibility details, not displayed product names. Do not publish a second Store item or ask existing users to uninstall and reinstall.

Saved pages and group definitions remain in local storage. Live group membership, manual tab order, and recent-use records are tied to the browser session and reset when the extension updates or reloads. Group definitions are not saved sessions. Private groups and Saved use a separate temporary library.

Version 2.0.0 requires **Chrome 123 or later** for the UI's [`light-dark()` color support](https://developer.chrome.com/blog/new-in-chrome-123). The [`minimum_chrome_version` manifest field](https://developer.chrome.com/docs/extensions/reference/manifest/minimum-chrome-version) keeps older Chrome installations on their previous compatible extension version until Chrome is upgraded.

## Repository history and current checkout

The repository was renamed from `boundless-forest/tabspan` to `boundless-forest/ztab` on 2026-09-06. The current repository is [z08-studio/ztab](https://github.com/z08-studio/ztab), and the verified local `origin` is `git@github.com:z08-studio/ztab.git`. Existing support links retain the `boundless-forest/ztab` address; verify its redirects before Store submission.

For another clone that needs the current remote:

```sh
git remote set-url origin git@github.com:z08-studio/ztab.git
```

Use `https://github.com/z08-studio/ztab.git` for HTTPS clones. The current local checkout is `/Users/bear-wang/coding/ztab`; earlier `tabspan` paths are historical. Neither the checkout directory nor the GitHub repository owner changes the installed extension's Store identity.
