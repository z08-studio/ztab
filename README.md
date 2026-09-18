# Ztab

**Another excellent tab manager for Chrome.**

[Get the extension from the Chrome Web Store](https://chromewebstore.google.com/detail/fakbifeeblnopdhicpmhhmcdhmefphjp)

Ztab brings your Chrome windows together with three everyday capabilities:

- **Manage tabs across windows.** View, open, move, and close tabs from one live side panel, or merge another window into the current one.
- **Keep pinned tabs across windows.** Pin an app once to keep it ready in every eligible Chrome window.
- **Work comfortably with keys and clicks.** Open the panel with a shortcut, navigate with the keyboard, and use actions beside the tabs and windows they affect.

Ztab was previously named TabSpan. The capital Z follows the Z-series naming convention used by Zdraft.

**Version 2.0.0 is being prepared for the Chrome Web Store.** The features described here reflect the current source, including inline groups, batch actions, Saved, and recent sorting. Preparing the release does not submit or publish it; see the [release guide](CHROME_WEB_STORE.md) for verification and rollout status.

Ztab 2.0 requires **Chrome 123 or later**. Older Chrome installations remain on their previous compatible extension version until Chrome is upgraded.

## Every window in one side panel

Click the Ztab toolbar icon to open **Tabs** or **Saved**. Tabs shows pinned tabs, inline groups, and the remaining tabs by window, using normal Chrome windows in the same browsing mode. Thin dividers separate rows, and close buttons remain visible beside regular tabs.

From the side panel, you can:

- See which tabs belong to each window.
- Jump directly to a tab in any window.
- Move regular tabs between windows.
- Merge another window into your current window with one click.
- Close regular tabs without switching windows first.
- Hide the pinned-tabs section when you want a more compact view.
- See updates automatically as tabs and windows change.
- Search open tabs, arrange related tabs into inline groups across windows, and keep an independent library of saved pages.

With multiple displays connected, each window heading shows its window and display names on one line. Long display names truncate to leave room for window actions. The name updates when you move the window to another screen; windows spanning screens use the display containing the largest part of the window. Window numbers remain so you can distinguish multiple windows on the same display. Matching display names receive a number, and missing names fall back to **Display 1**, **Display 2**, and so on.

The `system.display` permission reads display names and positions locally for these labels. Ztab does not change display settings. With one display, or when display information is unavailable, headings keep their usual window labels.

If Chrome returns display numbers without names, open **Settings → Display names**, select **Show display names**, and allow Chrome's **Manage windows on all your displays** request. This optional browser permission supplies system display names, including on macOS. Ztab only requests it after you select that action; declining keeps numbered labels available.

## Inline groups for related open tabs

Use the sort button beside **Select** to choose **Recently used** (the default) or **Manual order**. Recent mode puts the most recently used group or window section first and sorts its tabs by recent use. Pinned tabs keep their existing positions. Switching back to Manual restores your arranged order without moving real Chrome tabs.

The list holds its positions while you point at it, navigate with the keyboard, search, select tabs, drag, or use a menu/dialog. Recent activity is applied when you return or leave the list; **Refresh** also applies it explicitly. Sorting reads Chrome's existing [last-accessed timestamps](https://developer.chrome.com/docs/extensions/reference/api/tabs#property-Tab-lastAccessed) and records focused tab/window visits locally. It does not predict behavior or read browsing history.

Groups live directly in **Tabs**. Each group appears once, even when its members come from different windows; each member shows its source window. Regular tabs can belong to one group at a time. Pinned tabs remain separate and cannot be dragged into groups.

- **Create or join a group:** drag a tab onto the center of another tab, hold for 450 ms until the grouping hint appears, and release. A new group starts with an inline name field. Dropping on an existing group's header joins it, including when the group is collapsed.
- **Arrange tabs:** choose **Manual order**, then drag to a row's top or bottom edge to place the tab before or after it. Ungrouped tabs can be reordered within their original window; dropping beside a grouped tab joins and orders it within that group. Center/header drops can create or join groups in either sort mode.
- **Remove a member:** drag it onto **Remove from group**, which appears during the drag, or use its `···` menu. It returns to its original window section.
- **Manage a group:** click its name or chevron to collapse or expand it. Use its `···` menu to rename inline, edit its name/color/members, switch to its last active tab, or ungroup its tabs.

Clear search before dragging. Releasing over a tab center before the hold completes does nothing; **Escape** cancels a drag. The tab's `···` menu provides **Add to group…**, **Move to group…**, and removal actions without dragging.

Grouping and arranging tabs change only Ztab's list. They never move real tabs between windows, change their Chrome tab-strip order, or alter Chrome's native groups. Use **Move to window…** or **Merge here** when you want to move actual browser tabs.

Closing a tab removes its membership without a notice or undo action. Empty group names remain. **Ungroup tabs** removes a group while keeping its tabs open; that action offers **Undo**. Membership and local ordering survive panel reloads and service-worker suspension, but are cleared after a browser restart, extension reload, or update. Group definitions remain; groups are not saved sessions.

## Select and manage several tabs

Click **Select**, or Cmd-click (macOS) / Ctrl-click (Windows/Linux) a row, to start selecting tabs. Shift-click selects a range in the visible list. Group and window checkboxes select their matching tabs; **Select all** includes matching members of collapsed groups. Pinned tabs are excluded. Cmd/Ctrl+A selects matching tabs when focus is outside a text field.

The bottom toolbar offers **Group**, **Move**, and **Close N**. Its `···` menu offers **Save to Saved** and **Remove from groups**. Grouping stays local to Ztab; Move transfers actual tabs into an existing or new window. Failed moves remain selected, and saving skips internal browser pages while reporting duplicates.

Search keeps your selection and shows how many selected tabs are hidden. Closing is immediate unless some selected tabs are hidden by search, in which case Ztab confirms the total first. Closing has no Undo. **Done**, **Escape**, or switching to Saved clears the selection. Tabs closed or pinned elsewhere are removed from it automatically.

## Saved pages, kept locally

Choose **Save page** from a tab's `···` menu, or **Save current tab** in Saved. HTTP(S) pages are stored in Ztab's own library, independently of Chrome bookmarks. A page is saved to **Unsorted** with its full URL, title, and save date. Saving the same full URL again opens its existing editor.

Use collections and search to organize Saved. Edit a page to change its title, URL, or collection. Opening a saved page reuses an exact matching tab in the same browsing mode, or opens a new tab in the panel's window. The page remains in Saved. Removing a saved page offers **Undo**.

Saved displays page icons through Chrome's favicon service, including for existing entries and pages whose tabs have closed. The `favicon` permission allows this lookup from the saved URL; no library migration is needed. When an icon cannot load, Ztab keeps a title-initial placeholder.

Saved pages and collections remain across browser restarts. Incognito windows use a separate temporary library, cleared when all incognito windows close.

## One pinned workspace in every window

- Keep the same pinned apps across all normal Chrome windows.
- Pin or unpin from any window and let the others update automatically.
- Treat different pages from the same site as one pinned app.
- Remove duplicate pinned tabs automatically.
- Avoid modifying picture-in-picture and other ambiguous compact windows.

Ztab is especially useful if you work with separate Chrome windows across multiple monitors but want Gmail, Calendar, Slack, ChatGPT, or other everyday web apps available in each one.

To hide pinned tabs from the side panel without changing synchronization, open the extension options and turn off **Show pinned tabs**. The preference is stored locally for the current Chrome profile.

## Shortcuts and thoughtful interactions

| Action | Shortcut or interaction |
| --- | --- |
| Open the side panel | `Ctrl+Shift+9` on Windows/Linux; `Command+Shift+9` on macOS |
| Select a tab in the focused list | `↑` / `↓` |
| Open the selected tab | `Enter` |
| Move focus between controls | `Tab` / `Shift+Tab` |
| Open a tab with the pointer | Click its title |
| Close a regular tab | Use the always-visible **×** beside that tab |
| Save, group, or move a tab | Open its **···** menu |
| Search the current view | `Command+F` / `Ctrl+F` while the panel has focus |
| Switch views with the keyboard | Focus a view tab and use `←` / `→` |
| Bring another window here | Use **Merge here** beside its heading |

Open the keyboard button in the panel, then **Customize panel shortcut**, or choose **Customize shortcut** in settings to open Chrome's extension shortcut settings. The keyboard help displays the current assignment. A **Settings** link gives you access to preferences. Pinned tabs stay at the top of Tabs and can be collapsed with their chevron or hidden in settings.

## How to use Ztab

### Manage tabs across windows

1. Open Ztab from the toolbar or keyboard shortcut.
2. Find the window and tab you need in the side panel.
3. Click a tab title to open it, close a regular tab with **×**, or use **··· → Move to window…**.

Closing a tab updates the list directly, without a success notice or undo action.

Select **Merge here** beside another window's heading to bring its tabs into the window hosting the side panel. Regular tabs are appended in their original order, tab groups stay together, and your current page stays selected. Existing pinned apps are kept, shared pinned copies are deduplicated by site, and unique pinned tabs are moved with their pinned state intact.

Chrome closes the source window once its last tab has moved. Regular tabs are not deduplicated. If tabs change or a move fails, the panel refreshes and shows an error so you can retry the remaining window. There is no confirmation dialog, success notice, or undo action.

Merging is available between regular windows in the same browsing mode. Compact or floating windows are excluded. The `tabGroups` permission lets Ztab move existing groups without losing their names, colors, or collapsed state.

### Keep an app pinned everywhere

1. Open the site you want in any normal Chrome window.
2. Right-click its tab and choose **Pin**.
3. Ztab adds that pinned app to your other normal Chrome windows.

### Remove a pinned app everywhere

Right-click the pinned tab in any window and choose **Unpin**. Ztab removes that app from the shared pinned set and updates the other windows.

Closing a pinned tab does not remove it globally, so it may return during synchronization. Use **Unpin** when you want to remove it everywhere.

### How pinned apps are identified

Ztab identifies a pinned app by its site origin, such as `https://mail.google.com`, rather than by its complete page URL.

An existing pinned tab keeps its current page. When Ztab creates a missing pinned copy in another window, it opens the site's root URL. It does not copy a particular message, document, or conversation URL across windows.

### Resync the pinned workspace

If your pinned tabs ever become inconsistent, open the extension options and select **Resync pinned tabs**. Ztab rebuilds the shared set from your currently pinned tabs, removes duplicates, and synchronizes your normal windows again.

## Frequently asked questions

### Does Ztab sync between computers?

No. Ztab manages and synchronizes tabs between Chrome windows on the same computer and in the same Chrome profile. It does not provide cross-device or cloud synchronization.

### Does it sync every open tab?

No. Regular tabs remain in their existing windows. The side panel lets you view and manage them, while only pinned apps are synchronized across windows.

### Why are different pages from one site treated as the same pinned app?

Ztab uses each site's origin so that several Gmail messages, Google Docs, or ChatGPT conversations do not become duplicate pinned apps in every window. Each site keeps one pinned representative per window.

### Does it work with picture-in-picture windows?

Ztab is deliberately conservative around picture-in-picture and other compact windows that Chrome may not identify reliably. Ambiguous windows are left unchanged to avoid copying pinned tabs into temporary floating windows.

### Which pages can be synchronized?

Only regular `http://` and `https://` pages are synchronized. Chrome internal pages and other special URLs are not included.

## Private and local by design

Ztab requires no account and uses no external server.

- Your pinned-site list, synchronization metadata, and panel preference are stored in Chrome's local extension storage.
- Saved titles, full URLs, dates, collections, and group definitions are stored locally. Group membership and local tab ordering are valid only for the current browser session.
- Your tab titles and full browsing URLs are not uploaded.
- Your browsing data is not sold or used for advertising.

Read the full [privacy policy](PRIVACY_POLICY.md).

## Support

If something is not working as expected, open a [GitHub issue](https://github.com/boundless-forest/ztab/issues). Include the steps that caused the problem and, when relevant, diagnostics copied from the extension options page. Diagnostics may contain window and tab IDs, site origins, and window geometry, but not tab titles or full URLs.

The footer's **Buy me a coffee** button (shown as **Coffee** in narrow panels) opens an optional USDC tipping dialog. Scan or copy the wallet address, then choose **Base** and **USDC** in your own wallet. The QR contains the address only; it does not select a network or token. Any amount is welcome. Ztab displays the payment details locally and does not connect to wallets or submit transactions.

To change the recipient, update `src/shared/support.js` and run `pnpm assets:support` to regenerate the bundled QR. The test suite decodes the image and checks that it matches the address used by the copy button.

## License

Ztab is open-source software released under the [MIT License](LICENSE).
