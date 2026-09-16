# Ztab

**Another excellent tab manager for Chrome.**

[Get the extension from the Chrome Web Store](https://chromewebstore.google.com/detail/fakbifeeblnopdhicpmhhmcdhmefphjp)

Ztab brings your Chrome windows together with three everyday capabilities:

- **Manage tabs across windows.** View, open, move, and close tabs from one live side panel, or merge another window into the current one.
- **Keep pinned tabs across windows.** Pin an app once to keep it ready in every eligible Chrome window.
- **Work comfortably with keys and clicks.** Open the panel with a shortcut, navigate with the keyboard, and use actions beside the tabs and windows they affect.

Ztab was previously named TabSpan. The capital Z follows the Z-series naming convention used by Zdraft. The updated name is prepared in this repository; the Chrome Web Store listing and installed copies receive it when the next update is published. See the [release guide](CHROME_WEB_STORE.md) for the remaining rollout steps.

## Every window in one side panel

Click the Ztab toolbar icon to open **Tabs**, **Groups**, and **Saved**. Tabs shows a live tree from normal Chrome windows in the same browsing mode.

From the side panel, you can:

- See which tabs belong to each window.
- Jump directly to a tab in any window.
- Move regular tabs between windows.
- Merge another window into your current window with one click.
- Close regular tabs without switching windows first.
- Hide the pinned-tabs section when you want a more compact view.
- See updates automatically as tabs and windows change.
- Search open tabs, create groups across windows, and keep an independent library of saved pages.

With multiple displays connected, each window heading also shows its display name. The name updates when you move the window to another screen; windows spanning screens use the display containing the largest part of the window. Window numbers remain so you can distinguish multiple windows on the same display. Matching display names receive a number, and missing names fall back to **Display 1**, **Display 2**, and so on.

The `system.display` permission reads display names and positions locally for these labels. Ztab does not change display settings. With one display, or when display information is unavailable, headings keep their usual window labels.

If Chrome returns display numbers without names, select **Show display names** in Tabs and allow Chrome's **Manage windows on all your displays** request. This optional browser permission supplies system display names, including on macOS. Ztab only requests it after you select that action; declining keeps numbered labels available.

## Groups for related open tabs

Create a group in **Groups**, choose its name and color, and select tabs from any window. Each open tab belongs to at most one Ztab group. These groups do not move tabs, reorder them, or change Chrome's native tab groups.

Click a group name to jump to its last active tab and focus that window. Use the chevron to expand its members. The `···` menu on a tab lets you add it to a group, move it to another group, or remove it. **Ungroup** removes the group while keeping its tabs open; the notice offers **Undo**.

Closing a tab removes its membership. Group names remain when empty. Members are tied to the current browser session and are cleared after a browser restart, extension reload, or update; groups are not saved sessions.

## Saved pages, kept locally

Choose **Save to Saved** from a tab's `···` menu, or **Save current tab** in Saved. HTTP(S) pages are stored in Ztab's own library, independently of Chrome bookmarks. A page is saved to **Unsorted** with its full URL, title, and save date. Saving the same full URL again opens its existing editor.

Use collections and search to organize Saved. Edit a page to change its title, URL, or collection. Opening a saved page reuses an exact matching tab in the same browsing mode, or opens a new tab in the panel's window. The page remains in Saved. Removing a saved page offers **Undo**.

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
- Saved titles, full URLs, dates, collections, and group definitions are stored locally. Group membership is valid only for the current browser session.
- Your tab titles and full browsing URLs are not uploaded.
- Your browsing data is not sold or used for advertising.

Read the full [privacy policy](PRIVACY_POLICY.md).

## Support

If something is not working as expected, open a [GitHub issue](https://github.com/boundless-forest/ztab/issues). Include the steps that caused the problem and, when relevant, diagnostics copied from the extension options page. Diagnostics may contain window and tab IDs, site origins, and window geometry, but not tab titles or full URLs.

## License

Ztab is open-source software released under the [MIT License](LICENSE).
