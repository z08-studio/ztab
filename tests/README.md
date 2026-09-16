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
- inline grouping and local ordering: cross-window group creation, row ordering,
  pinned-tab rejection, stale drag protection, atomic storage writes, membership-safe
  renaming, backward-compatible order storage, pruning, and session reset.
- display assignment: overlapping windows, negative coordinates, duplicate/missing
  names, unavailable displays, optional permission handling, and API failures.

Real Chrome window metadata and UI behavior are still validated manually by loading the extension in `chrome://extensions`.

## Rebrand and upgrade checks in Chrome

These are checks to perform before publishing a branding update. The dated verification notes in this section predate the inline-group redesign and do not verify its current layout or screenshots.

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

## Inline groups and Saved checks in Chrome

Verified on 2026-09-16 in an isolated Chrome profile using the actual extension runtime: cross-window drag grouping and inline rename, intra-group reorder, joining a collapsed group header, dragging a member out, a fast center-hover release doing nothing, and Escape cancellation. Reloading the panel preserved membership and local order. Before/after comparisons confirmed all tab IDs, Chrome tab indices, window IDs, and native `groupId` values remained unchanged. The current Node suite passes all 90 tests.

The same run verified long-list drag autoscrolling, silent member closure with visible list focus, empty-group retention, pinning through the tab menu in two windows, pinned collapse, group search, keyboard selection, saving pages, and collection creation. Tabs and Saved fit a 320px viewport in light/dark styles. Settings showed the display-name enable action before permission and the enabled state after a Chrome test permission override; actual monitor labels stayed on the same line as window names. The permission prompt itself, a full browser restart, and Windows/Linux behavior were not rechecked in this run.

Current UI references: [inline Tabs](../docs/screenshots/inline-tabs.png), [dark inline Tabs](../docs/screenshots/inline-tabs-dark.png), and [Saved](../docs/screenshots/inline-saved.png). The checks below include broader coverage to perform before release; they are not all claimed as completed by the current drag verification.

The Saved favicon follow-up was verified in isolated Chrome on 2026-09-16. Three pages on the same origin used distinct icons and URLs containing query parameters and fragments. After saving them without any icon fields, closing all three tabs, and reloading the panel, Chrome returned the correct distinct 32px images for every saved URL. This covers existing Saved entries without a data migration. [Saved page icons](../docs/screenshots/saved-favicons.png) shows the actual extension with local sample pages.

1. Confirm the only top-level views are **Tabs** and **Saved**. Pinned tabs, inline groups, and ungrouped window sections belong inside Tabs. Each cross-window group must appear once, with the source window shown on each member.
2. In two regular windows, drag one tab onto the center of a tab from the other window. Release before 450 ms: nothing should change. Hold until the grouping hint appears and release: one group should contain both tabs and offer inline naming. Enter or **Save** commits the name; Escape cancels renaming. Compare tab IDs, indices, window IDs, and native `groupId` values before and after every grouping or ordering operation; none should change in Chrome.
3. Drag between row edges to reorder within a group and within an ungrouped window section. Drop beside a grouped tab to join at that position. Ungrouped rows in another real window must not accept a reorder. Drag onto an expanded or collapsed group header to append a member. During a drag, Escape must cancel without changing membership or order.
4. Drag a group member onto **Remove from group**. It should return to its original window section, with the real tab and window unchanged. Repeat using the tab's menu. Pinned rows must not start a drag, become grouping targets, or appear in the group member picker.
5. Click a group title or chevron to expand/collapse it; use **Switch to last active tab** in the group menu to activate a member. Check inline **Rename group**, **Edit group…**, **Ungroup tabs**, and ungroup undo. Empty group names must remain after their last member closes. Closing a tab must show no notice or undo action.
6. Search by group name, page title, and domain. Dragging must be disabled while search is active. Check **Add to group…**, **Move to group…**, and removal from a tab menu as keyboard-accessible alternatives. Each tab must belong to at most one group.
7. Save a tab from its menu. Check that its full path/query/hash survives. Save it again and verify the existing editor opens. Create a collection, edit the saved title/collection, search/filter, open it without duplicating an existing tab, and remove/undo it.
8. Open two panels and make concurrent edits. Saving different pages must retain both. Stale saved-page/group editors and drags with changed membership must report a conflict without overwriting the newer state.
9. Reload the panel or suspend/restart the service worker: membership and local order should remain. Reload the extension or restart Chrome: Saved, collections, and group names should remain, while live membership and order clear. Normal and incognito libraries must remain separate, and closing all incognito windows clears the private library.
10. Review Tabs, Saved, menus, inline rename, and dialogs at 320px in light and dark modes. Check row dividers, visible regular-tab close buttons, and focus states. Pinned rows remain collapsible with no close button. Window and display names must share one line; long names truncate without obscuring **Merge here**. Check empty states and long page names/URLs. Only Chrome's native panel header should show the Ztab title; the content should start with navigation and search.

### Historical three-view verification

Before the inline-group redesign, the separate Tabs/Groups/Saved implementation was verified on 2026-09-16 in an isolated Chrome for Testing 153.0.8010.12 profile. Cross-window virtual groups preserved native group IDs; search, duplicate-save editing, collection editing, removal/undo, pinned collapse, keyboard selection, window movement, and a normal-window merge worked with live tab data. The merge retained the current page and shared pinned copy without a success notice. After extension reload, saved pages, group definitions, and pinned origins remained while memberships cleared and the browser-session identifier changed.

The old views and dialogs were reviewed at 320px in light/dark modes, and the native panel at 360px. Historical screenshots: [Tabs](../docs/screenshots/workspace-tabs.png), [Groups](../docs/screenshots/workspace-groups.png), [Saved](../docs/screenshots/workspace-saved.png), and [dark Groups](../docs/screenshots/workspace-groups-dark.png). These images do not represent the current UI. The subsequent tab-close check confirmed that closing from the old Tabs and Groups views removed the real tab, retained list focus, hid status/undo, and preserved an empty group after its last member closed. That layout was checked at 320px. A full browser restart, OS-level shortcut activation, and Windows/Linux behavior were not rechecked in that historical run.

## Display-name checks in Chrome

Historical verification before the inline-group redesign, on 2026-09-16 with Chrome for Testing 153.0.8010.12 on macOS in an isolated profile connected to three actual displays: the extension API returned empty names; accepting Chrome's window-management permission supplied **U27E40 (1)**, **U27E40 (2)**, and **Built-in Display**. The native 360px panel showed the correct name for each window, including the display at a negative desktop offset. Moving the panel's host and another window between screens updated labels without a manual refresh. Pinned rows also showed their window's display.

That earlier panel document was visually reviewed at 320px with no horizontal overflow. A native-panel dark-mode check at 320px used deliberately long label text to verify truncation and unobstructed merge buttons. A browser permission override verified that revocation restores numbered labels, the enable action explains a blocked permission, and restoring access restores names. Automated tests additionally cover explicit-request rejection and ensure ordinary refreshes do not request permission. The historical [display-name screenshot](../docs/screenshots/window-displays.png) is an actual native panel with local sample pages, not the current one-line layout. Physical screen disconnect/reconnect and Windows/Linux behavior were not manually checked.

1. With multiple screens, check window headings, pinned/group members, group selection, and move destinations. Window labels must remain distinct when windows share a screen.
2. If names are missing, open **Settings → Display names**, select **Show display names**, and accept Chrome's prompt. Reload the panel; names should remain available. Decline or revoke access and verify that tabs remain usable with numbered labels. The permission action must not occupy a row in Tabs.
3. Move a window to another screen, then across a screen boundary. The largest intersecting display should determine its label. Check negative screen offsets and duplicate names.
4. Connect or disconnect a display. A single active display should leave plain window headings. Check long display names at a narrow width; window and display labels must stay on one line and truncate without squeezing **Merge here**.

## Window-merge checks in Chrome

1. Open two normal windows, open the panel in the destination, and click **Merge here** on the other window's heading. Verify source tab order, destination selection, and automatic source-window closure.
2. Include named/colored/collapsed groups, shared pinned sites, unique pins, and identical regular URLs. Check that groups and unique pins survive, only shared pinned copies disappear, and regular duplicates stay open.
3. Hide pinned tabs and merge a window containing only pinned tabs. Verify that its heading still offers the merge action.
4. Switch focus between windows with the panel open. **Current window** must still refer to the panel's host. Check the layout at 320px width and keyboard activation of the merge button.
5. During a merge, double-click the action or try another action in the panel. Check that a second operation is prevented. If a tab/window changes or Chrome refuses a move, remaining tabs must stay open and an error must be shown.
6. Verify that popup/floating windows are excluded and merge is unavailable for ambiguous compact windows or across normal/incognito browsing modes. Successful merges show no notice or undo action.

Verified with Chrome for Testing 153.0.8010.12 in an isolated profile on 2026-09-05: actual tab IDs and ordering, current-page selection, shared and special pins, group names/colors/collapse state (including a group-only window), hidden-pins-only windows, keyboard activation, duplicate-click prevention, and the layout at 320px. Chrome unpins tabs during cross-window moves and may expand an active group; the merge restores both states explicitly.
