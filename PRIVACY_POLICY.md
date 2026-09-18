# Privacy Policy (Ztab)

Ztab, previously named TabSpan, runs entirely on your device.

## Data collection

- Ztab does not collect, transmit, or sell personal data.
- Ztab does not send browsing data to external servers or use analytics.
- The websites you open retain their own privacy policies.

## Local data storage

- Ztab stores the pinned-site origin list, synchronization metadata, and the **Show pinned tabs** preference in `chrome.storage.local`.
- Ztab also stores Saved page titles, full HTTP(S) URLs, save dates, collections, and group names/colors in `chrome.storage.local`. Saving is an explicit action; Ztab does not create a browsing-history archive or read your Chrome bookmarks.
- Group membership stores tab IDs and the last active member locally, tied to a random browser-session identifier in `chrome.storage.session`. Membership is cleared after a browser restart, extension reload, or update, so reused tab IDs cannot attach unrelated pages to old groups. Group names and Saved pages remain.
- The sort preference is stored locally. Recent sorting uses Chrome's last-accessed timestamps and locally stored tab IDs with focused-visit timestamps. These visit records are cleared with the browser-session identifier and pruned when tabs close or become pinned; they contain no page titles or URLs and do not require browsing-history access.
- This data stays in your local Chrome profile on the same computer. There is no cloud or cross-device sync.
- In incognito windows, Groups and Saved use a separate in-memory session library. It is cleared when the last incognito window closes, or when Chrome or the extension restarts. Normal and incognito libraries are not combined.
- Existing local storage is retained when the same installed extension is updated from TabSpan to Ztab.
- Open tab titles and URLs are processed locally to show and manage tabs. Full titles and URLs are persisted only when you explicitly save a page; they are never uploaded by Ztab.
- Display names and positions are read locally to identify the screen containing each window. They are not persisted or uploaded.

## Permissions

| Permission | Purpose |
| --- | --- |
| `tabs` | Display open tabs; focus, move, or close tabs when requested; and read, create, or remove pinned tabs during synchronization. |
| `windows` | Enumerate and focus normal Chrome windows, move tabs between them, and apply the shared pinned set to eligible windows. |
| `storage` | Store pinned-site origins, synchronization metadata, panel preferences, groups, and the independent Saved library locally; keep private browsing data and session identifiers in memory. |
| `sidePanel` | Show the cross-window tab manager inside Chrome's side panel. |
| `tabGroups` | Preserve existing tab groups and their names, colors, and collapsed state when merging windows. |
| `system.display` | Read display names and positions to label windows when multiple displays are connected. Ztab does not change display settings. |
| `favicon` | Read website icons through Chrome's favicon service so Saved pages can display their icons after their tabs close. Saved URLs are not sent to a third-party icon service. |

Ztab's own Groups are virtual groups of open tabs. Creating or editing one does not create or change a Chrome native tab group and requires no additional permission.

When the extension API omits display names, **Show display names** requests Chrome's optional **Manage windows on all your displays** browser permission (`window-management`). It lets Ztab read system display labels through the Window Management API. Refreshing the panel does not request this permission automatically; declining leaves numbered labels available.

## Optional support

The **Support my coding** dialog displays a bundled QR code and a public wallet address for USDC on Base. **Copy address** writes that address to your clipboard only when selected. Ztab does not connect to a wallet, initiate or monitor payments, or send data to a payment service. Transfers are made separately in your own wallet.

## Diagnostics

Recent synchronization diagnostics are kept in memory. Selecting **Copy diagnostics** in the options page copies them to your clipboard. They can include window and tab IDs, site origins, and window geometry, but not tab titles or full browsing URLs. Nothing is sent automatically; you choose whether to share the copied diagnostics in a support request.

## Contact

For questions, open an issue in the [project repository](https://github.com/boundless-forest/ztab/issues).
