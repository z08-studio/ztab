# Ztab store listing

Prepared English copy for the **2.0.0** update to the existing Chrome Web Store item. The three product pillars are cross-window tab management, shared pinned tabs, and keyboard shortcuts with thoughtful interactions. This document does not indicate that the listing has been submitted or published; see [the release guide](../CHROME_WEB_STORE.md) for rollout status.

## Product name

Ztab: Tab Manager

## Positioning

Another excellent tab manager for Chrome.

## Summary

Manage tabs across Chrome windows, keep pinned tabs in sync, and move faster with keyboard shortcuts.

Character count: 101 of 132.

## Category

Productivity

## Detailed description

Another excellent tab manager for Chrome.

Ztab brings your Chrome windows together in one live side panel. Manage tabs across windows, keep your essential apps pinned in each one, and navigate comfortably with keys and clicks.

MANAGE TABS ACROSS WINDOWS

• See pinned tabs, inline groups, and window sections in one side panel
• Jump directly to a tab in any normal window
• Move or close regular tabs without bringing each window forward
• Keep related tabs in Ztab groups across windows without moving their browser tabs
• Find recently used tabs first, or arrange them in Manual order
• Select several tabs to group, move, close, or save together
• Keep pages in Saved, an independent local library with collections and website icons
• Use Merge here to bring another window into the current one
• Keep tab order, groups, and pinned state when merging
• See updates automatically as tabs and windows change

KEEP PINNED TABS ACROSS WINDOWS

• Pin an app in one window and let Ztab add it to the others
• Unpin once to remove the app from the shared pinned set
• Keep one pinned app per site in each eligible window
• Remove duplicate pinned copies automatically
• Hide pinned tabs in the panel while synchronization continues
• Leave picture-in-picture and ambiguous compact windows unchanged

SHORTCUTS AND THOUGHTFUL INTERACTIONS

• Open the panel with Ctrl+Shift+9, or Command+Shift+9 on Mac
• Open the keyboard-help button, then Customize panel shortcut, or use Customize shortcut in settings
• See the currently assigned shortcut in keyboard help
• Select a tab with the Up and Down Arrow keys, then press Enter to open it
• Move between controls with Tab and Shift+Tab
• Click a tab title to jump to that tab
• Close regular tabs with ×, use ··· for page actions, and find Merge here beside other windows
• Cmd-click or Ctrl-click to select tabs, and Shift-click to select a range

LOCAL BY DESIGN

Ztab requires no account and uses no external server. Pinned site origins, preferences, group definitions, and explicitly saved page titles and URLs stay in Chrome's local extension storage. Live group membership, manual ordering, and focused-visit timestamps are tied to the current browser session. Your tab titles and full browsing URLs are not uploaded anywhere.

GOOD TO KNOW

Ztab 2.0 requires Chrome 123 or later.

Ztab works between windows on the same computer and in the same Chrome profile. Regular tabs stay in their windows until you move or merge them. Only pinned apps are synchronized automatically; different pages on one site count as one pinned app. Existing pins keep their current page, while newly created pinned copies open the site's root URL. Use Unpin to remove a pinned app everywhere, because closing a pinned copy may cause it to return during synchronization.

Merge here works between eligible normal windows in the same browsing mode. Chrome closes a source window when its last tab moves. Shared pinned copies are deduplicated; identical regular tabs stay open. There is no merge undo action.

Ztab groups are independent of Chrome's native tab groups. Grouping and sorting change only Ztab's list. Saved is independent of Chrome bookmarks; it contains only pages you explicitly save. Incognito groups and Saved use a separate temporary library, cleared when the last incognito window closes.

JOIN THE COMMUNITY

Have a question, found a bug, or have an idea for Ztab? Join our Telegram community: https://t.me/z08_studio

## Release notes — 2.0.0

Ztab 2.0 brings inline groups, batch actions, and an independent Saved library to the side panel. Manage tabs across windows, keep shared pinned apps ready, and navigate with familiar keyboard shortcuts.

• Groups related tabs across windows directly in Tabs, with drag grouping and Manual ordering
• Sorts by recent use by default and keeps list positions stable during interaction
• Adds multi-selection for grouping, moving, closing, and saving tabs
• Keeps an independent Saved library with collections and website icons
• Shows window and display names together when multiple monitors are connected
• Keeps close actions visible, adds row dividers, and refreshes light and dark styles

Group definitions and Saved pages remain across browser restarts. Live group membership, manual order, and recent-use records reset when Chrome or the extension restarts. This update does not add cloud sync or saved sessions.

## Permission justifications

### tabs

Reads open tabs and pinned state, displays the live tab list, focuses tabs, moves or closes tabs on request, creates missing pinned tabs, and removes duplicate pinned copies. No tab data is sent to an external server.

### windows

Finds normal Chrome windows so tabs can be displayed, focused, moved, or merged and the shared pinned set can be applied to each eligible window.

### storage

Stores pinned-site origins, synchronization metadata, panel preferences, Saved titles and URLs, collections, and group definitions locally. Live group membership, manual order, and focused-visit timestamps are tied to a browser-session identifier. Private browsing uses a separate temporary session library.

### sidePanel

Displays the cross-window tab manager when the toolbar button or opening shortcut is used.

### tabGroups

Reads and restores existing tab groups, including their names, colors, and collapsed state, when Merge here moves tabs to another window.

### system.display

Reads connected display names and positions locally so each window can show its monitor name. Ztab does not change display settings. When names are unavailable, the explicit Show display names action can request Chrome's optional window-management browser permission; ordinary panel refreshes do not prompt.

### favicon

Reads page icons through Chrome's favicon service to identify Saved pages, including existing entries and pages without an open tab. No saved URLs are sent to a third-party icon service.

## Privacy fields

- Single purpose: Manage tabs across Chrome windows through one live side panel, with shared pinned tabs and keyboard navigation.
- Personally identifiable information: Not collected.
- Authentication information: Not collected.
- Personal communications: Not collected.
- Location: Not collected.
- Web history: Open tab URLs and focused-visit timestamps are processed locally to manage and sort tabs. Saved titles and full URLs persist only when explicitly saved. Ztab does not read Chrome browsing history or transmit or sell this data.
- Website content: Not collected or transmitted.
- Remote code: Not used.

Review these declarations against the current Developer Dashboard wording before submission; the dashboard categories may change.
