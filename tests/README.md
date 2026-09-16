# Ztab verification

Tests are run with Node's built-in test runner:

- `pnpm test`

The tests cover:

- pure shared logic in `src/shared/` (URL parsing + sync planning);
- window eligibility, compact-window safety, and picture-in-picture ambiguity;
- mutation and pending-user-intent tracking;
- controller-level synchronization with a fake Chrome API.
- window merging: ordering, groups, pinned duplicates, current-page selection,
  partial failures, changing tabs, window eligibility, and sync serialization.
- independent Saved and virtual groups: full-URL validation and deduplication,
  concurrent writes, stale edits, failed-write recovery, exclusive membership,
  last-active switching, undo conflicts, replacement tabs, restart boundaries,
  and incognito isolation/cleanup.
- display assignment: overlapping windows, negative coordinates, duplicate/missing
  names, unavailable displays, optional permission handling, and API failures.

Real Chrome window metadata and UI behavior are still validated manually by loading the extension in `chrome://extensions`.

## Rebrand and upgrade checks in Chrome

These are checks to perform before publishing a branding update; the historical window-merge result below does not verify the current branding.

Verified on 2026-09-16 with Chrome for Testing 153.0.8010.12 on macOS in an isolated profile: the loaded extension reports **Ztab: Tab Manager** and **Open Ztab**; its native side-panel header, footer, settings page, and feedback copy use **Ztab**. The assigned shortcut opened the native panel, ArrowDown selected the next tab, and two sample pinned sites appeared in both normal windows. Store screenshots were recaptured from that real browser state and all five generated images were visually reviewed. This check does not verify store publication or store-delivered upgrades.

Verified on 2026-09-06 with Chrome for Testing 153.0.8010.12 on macOS in an isolated profile: the same-ID upgrade retained the hidden-pins preference; the then-current branding and settings links appeared correctly; changing the assigned shortcut refreshed its hint after returning; the native shortcut opened the real side panel; ArrowDown and Enter selected and activated a tab in another window; ordinary pin/unpin synchronization and Move worked. The panel document also fit a 320px viewport without horizontal overflow. Store screenshots use the actual native side panel with local sample content.

This smoke check does not verify store-delivered upgrades, Windows/Linux bindings, or a fresh manual Merge here run. Disable Playwright focus emulation before checking native focus and tab reactivation. Local review artifacts are in `output/playwright/`, including `verification.md`, `ztab-options.png`, and `ztab-320.png`; these are excluded from Git and the extension package.

1. Load the prepared package in an isolated profile. Check that Chrome's extension list shows **Ztab: Tab Manager**, the toolbar action says **Open Ztab**, and the panel and options page use **Ztab** with a capital Z.
2. In a separate upgrade test, load the prior version at a fixed unpacked-extension path, pin sample sites, and turn off **Show pinned tabs**. Record the extension ID and local storage, replace the runtime files at the same path with the prepared update, and reload. Verify that the ID, shared pinned set, and hidden-pins preference survive. Keep the existing `pinallwindows.*` storage keys.
3. Confirm that normal pin/unpin behavior still works in two eligible windows and newly created pinned copies open the site's root URL. Open a new normal window and verify the same pinned set appears. Closing a pinned copy may restore it; unpinning must remove it from the shared set.
4. Review the generated listing images and actual UI for old displayed names. Historical migration names, existing GitHub URLs, and internal compatibility identifiers are intentional exceptions.
5. After the approved store update is published, separately verify an installed copy updates through the existing store item without losing its data. An unpacked-extension check does not verify store delivery.

## Keyboard and interaction checks in Chrome

1. Open the panel from the toolbar and with `Ctrl+Shift+9` on Windows/Linux or `Command+Shift+9` on macOS. If Chrome assigns a different shortcut or none, the displayed hint must reflect that assignment.
2. Open the keyboard button, then **Customize panel shortcut**, or **Customize shortcut** in settings. Both should open Chrome's extension shortcut settings. Change the assigned shortcut and return to each Ztab page; verify that the displayed value refreshes.
3. Focus the tab list. Press `↑` and `↓` to change the selected tab, then `Enter` to activate it and focus its window. Clicking a tab title should also activate it.
4. Use `Tab` and `Shift+Tab` to reach controls, then activate buttons using the keyboard. Verify **···**, **×**, **Merge here**, **Refresh**, and **Settings** remain reachable with visible focus. Open a menu with the keyboard, navigate it with arrows, and dismiss it with Escape. Focus a view tab and use Left/Right to switch views.
5. Open settings from the panel. Check the keyboard help and the **Show pinned tabs** preference at a narrow panel width; hiding pinned rows must leave synchronization running.

## Groups and Saved checks in Chrome

Verified on 2026-09-16 in an isolated Chrome for Testing 153.0.8010.12 profile: cross-window virtual groups leave native group IDs unchanged; search, duplicate-save editing, collection creation/editing, removal/undo, pinned collapse, keyboard selection, window movement, and a normal-window merge work with live tab data. The merge retained the current page and shared pinned copy, and produced no success notice. Saving the active page was also checked in Chrome's native side-panel document. After an extension reload, both saved pages, both group definitions, and pinned origins remained, while all four live memberships cleared and the browser-session identifier changed.

Tabs, Groups, Saved, and editor dialogs were visually checked at 320px in light and dark modes with no horizontal overflow; the native panel was also inspected at 360px. [Tabs](../docs/screenshots/workspace-tabs.png), [Groups](../docs/screenshots/workspace-groups.png), [Saved](../docs/screenshots/workspace-saved.png), and [dark Groups](../docs/screenshots/workspace-groups-dark.png) are real extension renders with local sample pages. Current incognito isolation and worker-resume checks are covered by automated controller tests; a full browser restart, OS-level shortcut activation, and Windows/Linux behavior were not rechecked in this feature run.

The tab-close follow-up was verified in the same isolated Chrome version: closing from Tabs and Groups removed the actual tab, kept focus in the list, and left the status area hidden with no undo action. Closing the last group member removed its membership and preserved the empty group. The resulting layout was visually checked at 320px.

1. In two regular windows, create a Ztab group containing one tab from each. Verify IDs, positions, window IDs, and Chrome native `groupId` values remain unchanged. Change the active member from Chrome, then click the group title to return to it. The chevron should only expand/collapse.
2. Search by group name, page title, and domain. Move a member to another Ztab group; check that it belongs to only one. Close a member and verify it disappears without a success notice or undo action. Ungroup and undo; ungrouping must keep all tabs open. Empty group names should remain after their last member closes.
3. Save a tab from its menu. Check that its full path/query/hash survives. Save it again and verify the existing editor opens. Create a collection, edit the saved title/collection, search/filter, open it without duplicating an existing tab, and remove/undo it.
4. Open two panels and make concurrent edits. Saving different pages must retain both. Stale saved-page/group editors must report a conflict without overwriting the newer edit.
5. Suspend/restart the service worker: memberships should remain. Reload the extension or restart Chrome: Saved, collections, and group names should remain, while live membership clears. Normal and incognito libraries must remain separate, and closing all incognito windows clears the private library.
6. Review Tabs, Groups, Saved, menus, and dialogs at 320px in light and dark modes. Ordinary close buttons must remain visible. Pinned rows must stay inside Tabs, remain collapsible, and expose no close button. Check empty states and long names/URLs.

## Display-name checks in Chrome

Verified on 2026-09-16 with Chrome for Testing 153.0.8010.12 on macOS in an isolated profile connected to three actual displays. The extension API returned empty names; accepting Chrome's window-management permission supplied **U27E40 (1)**, **U27E40 (2)**, and **Built-in Display**. The native 360px panel showed the correct name for each window, including the display at a negative desktop offset. Moving the panel's host and another window between screens updated labels without a manual refresh. Pinned rows also showed their window's display.

The panel document was visually reviewed at 320px with no horizontal overflow. A native-panel dark-mode check at 320px used deliberately long label text to verify truncation and unobstructed merge buttons. A browser permission override verified that revocation restores numbered labels, the enable action explains a blocked permission, and restoring access restores names. Automated tests additionally cover explicit-request rejection and ensure ordinary refreshes do not request permission. The [display-name screenshot](../docs/screenshots/window-displays.png) is an actual native panel with local sample pages. Physical screen disconnect/reconnect and Windows/Linux behavior were not manually checked.

1. With multiple screens, check window headings, pinned/group members, group selection, and move destinations. Window labels must remain distinct when windows share a screen.
2. If names are missing, select **Show display names** and accept Chrome's prompt. Reload the panel; names should remain available. Decline or revoke access and verify that tabs remain usable with numbered labels.
3. Move a window to another screen, then across a screen boundary. The largest intersecting display should determine its label. Check negative screen offsets and duplicate names.
4. Connect or disconnect a display. A single active display should leave plain window headings. Check long display names at a narrow width; names should truncate without squeezing **Merge here**.

## Window-merge checks in Chrome

1. Open two normal windows, open the panel in the destination, and click **Merge here** on the other window's heading. Verify source tab order, destination selection, and automatic source-window closure.
2. Include named/colored/collapsed groups, shared pinned sites, unique pins, and identical regular URLs. Check that groups and unique pins survive, only shared pinned copies disappear, and regular duplicates stay open.
3. Hide pinned tabs and merge a window containing only pinned tabs. Verify that its heading still offers the merge action.
4. Switch focus between windows with the panel open. **Current window** must still refer to the panel's host. Check the layout at 320px width and keyboard activation of the merge button.
5. During a merge, double-click the action or try another action in the panel. Check that a second operation is prevented. If a tab/window changes or Chrome refuses a move, remaining tabs must stay open and an error must be shown.
6. Verify that popup/floating windows are excluded and merge is unavailable for ambiguous compact windows or across normal/incognito browsing modes. Successful merges show no notice or undo action.

Verified with Chrome for Testing 153.0.8010.12 in an isolated profile on 2026-09-05: actual tab IDs and ordering, current-page selection, shared and special pins, group names/colors/collapse state (including a group-only window), hidden-pins-only windows, keyboard activation, duplicate-click prevention, and the layout at 320px. Chrome unpins tabs during cross-window moves and may expand an active group; the merge restores both states explicitly.
