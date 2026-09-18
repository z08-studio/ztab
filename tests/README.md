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
- batch selection: matching group names, visible range order, scope tri-state,
  pruning, atomic group/save operations, partial close/move failures, live pin and
  window changes, panel-window teardown, and new-window moves without blank tabs.
- display assignment: overlapping windows, negative coordinates, duplicate/missing
  names, unavailable displays, optional permission handling, and API failures.

Real Chrome window metadata and UI behavior are still validated manually by loading the extension in `chrome://extensions`.

## Base USDC support verification

Verified on 2026-09-18 in an isolated Chrome for Testing profile with the actual extension page: **Support my coding** opens a dialog showing **USDC · Base**, the bundled address QR, the full recipient address, and **Copy address**. Supporters choose the network, token, and amount in their own wallet. The dialog contains no wallet connection, amount selection, or external payment link.

Clipboard copying writes the exact configured address and reports success. When clipboard access is denied, the full 42-character address is focused and selected for manual copying. Escape closes the dialog and returns focus to the footer. Light and dark layouts fit 280px, 320px, and 420px widths without horizontal overflow.

`pnpm package` passes all 145 tests and validates the packaged JavaScript. The QR test decodes the bundled image and checks that its payload matches the copy recipient. No payment website or service configuration is required. Phone scanning and a real transfer remain unverified. UI references: [light support dialog](../docs/screenshots/base-usdc-support.png) and [dark support dialog](../docs/screenshots/base-usdc-support-dark.png).

## Final PR review

Reviewed on 2026-09-16. `pnpm package` passes 143 tests and validates every packaged JavaScript file; `git diff --check` passes. The review fixed stale group-editor assignments, tab-replacement races during queued browser actions, overflowing destination menus, and keyboard focus loss after dialog saves. Obsolete helpers and screenshots from the superseded three-view layout were removed.

In isolated Chrome for Testing 153.0.8010.12 on macOS, a stale group editor rejected a tab reassigned by another panel, while reopening the editor allowed an explicit transfer. Batch saving retained both selected pages and loaded their icons; the Saved view fit 320px in dark mode. A 30-item menu at 320×400 remained inside the viewport and its last item was reachable by scrolling and the End key. Saved Save/Cancel and group Save restored focus; deleting the launch row fell back to the list, and replacing one dialog with another retained input focus.

Replacement chains, intermediate browser snapshots, and failed-storage recovery have deterministic controller coverage. Native prerender replacement, a full browser restart, and Windows/Linux behavior were not manually retested in this review. The repository has no configured GitHub CI checks; the local package gate and browser checks are the verification evidence for this merge.

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

### Recent sorting verification

Verified on 2026-09-16 in isolated Chrome for Testing 153.0.8010.12 on macOS: Recently used is the default; a focused tab visit updates its section and row priority after Refresh. A background-window activation did not create a focused-visit record; focusing that window did, with Playwright focus emulation disabled. Pinned positions, native tab indices, window IDs, and Chrome group IDs stayed unchanged.

Multi-selection held its row order after another tab activated, including an explicit refresh; Shift-click still selected the original visible range. Search and open menus also retained their order. Manual drag ordering survived switching to Recent and back exactly, and the preference survived panel reload. Recent mode blocked edge reordering with a Manual-order hint while held-center cross-window grouping and inline naming still worked.

Reviewed the sorting control/menu at 320px in light and dark styles with no horizontal overflow. The 139-test suite covers timestamp normalization, section/member ranking, stable ties, manual restoration, frozen snapshots, session reset, replacement, pruning, and private-mode boundaries. A full browser restart and native Windows/Linux behavior were not manually retested. UI references: [sorting menu](../docs/screenshots/recent-sorting.png) and [dark recent sorting](../docs/screenshots/recent-sorting-dark.png).

### Batch-selection verification

Verified on 2026-09-16 in an isolated Chrome for Testing 153.0.8010.12 profile using the actual extension pages and local sample tabs. Cmd-click and Ctrl-click enter selection, Shift-click follows visible rows and recovers after its anchor is collapsed, scope checkboxes include collapsed members, and Cmd+A works from a focused checkbox. Pinned tabs have no selection controls. Switching to Saved clears selection; external closure or pinning prunes selected IDs.

Batch create/join/ungroup preserved native tab IDs, indices, window IDs, and Chrome group IDs; joining expanded a collapsed destination group. Saving five eligible pages and two internal pages saved five and left the two skipped pages selected; repeating the save reported existing entries without duplicates. Existing-window moves skipped tabs already there; new-window moves retained order without a blank placeholder. A compact-source move displayed its failure and retained selection. Compact-window closure succeeded after restarting the test service worker.

Search retained hidden selections and showed their count. Closing hidden selections required the count confirmation; ordinary batch closure was immediate and silent, with no Undo. Closing a disposable panel's last tab still completed closure of another selected tab in another window. Escape dismissed a menu/dialog without exiting selection. Light/dark layouts were reviewed, and the 320×480 panel had no horizontal overflow; the list ended exactly at the fixed toolbar.

The batch-selection milestone passed 124 Node tests. Partial API/storage failures, stale membership, browsing-mode boundaries, and mid-operation changes have automated coverage. Windows/Linux shortcuts and a full browser restart were not manually retested in this pass. No new permission is required for batch actions. UI references: [batch selection](../docs/screenshots/bulk-selection.png) and [dark batch selection](../docs/screenshots/bulk-selection-dark.png).

### Inline-group verification

Verified on 2026-09-16 in an isolated Chrome profile using the actual extension runtime: cross-window drag grouping and inline rename, intra-group reorder, joining a collapsed group header, dragging a member out, a fast center-hover release doing nothing, and Escape cancellation. Reloading the panel preserved membership and local order. Before/after comparisons confirmed all tab IDs, Chrome tab indices, window IDs, and native `groupId` values remained unchanged. At that stage, all 90 Node tests passed.

The same run verified long-list drag autoscrolling, silent member closure with visible list focus, empty-group retention, pinning through the tab menu in two windows, pinned collapse, group search, keyboard selection, saving pages, and collection creation. Tabs and Saved fit a 320px viewport in light/dark styles. Settings showed the display-name enable action before permission and the enabled state after a Chrome test permission override; actual monitor labels stayed on the same line as window names. The permission prompt itself, a full browser restart, and Windows/Linux behavior were not rechecked in this run.

Current UI references: [inline Tabs](../docs/screenshots/inline-tabs.png), [dark inline Tabs](../docs/screenshots/inline-tabs-dark.png), and [Saved](../docs/screenshots/inline-saved.png). The checks below include broader coverage to perform before release; they are not all claimed as completed by the current drag verification.

The Saved favicon follow-up was verified in isolated Chrome on 2026-09-16. Three pages on the same origin used distinct icons and URLs containing query parameters and fragments. After saving them without any icon fields, closing all three tabs, and reloading the panel, Chrome returned the correct distinct 32px images for every saved URL. This covers existing Saved entries without a data migration. [Saved page icons](../docs/screenshots/saved-favicons.png) shows the actual extension with local sample pages.

1. Confirm the only top-level views are **Tabs** and **Saved**. Pinned tabs, inline groups, and ungrouped window sections belong inside Tabs. Each cross-window group must appear once, with the source window shown on each member.
2. In two regular windows, drag one tab onto the center of a tab from the other window. Release before 450 ms: nothing should change. Hold until the grouping hint appears and release: one group should contain both tabs and offer inline naming. Enter or **Save** commits the name; Escape cancels renaming. Compare tab IDs, indices, window IDs, and native `groupId` values before and after every grouping or ordering operation; none should change in Chrome.
3. Choose **Manual order**, then drag between row edges to reorder within a group and within an ungrouped window section. Drop beside a grouped tab to join at that position. Ungrouped rows in another real window must not accept a reorder. Drag onto an expanded or collapsed group header to append a member. During a drag, Escape must cancel without changing membership or order.
4. Drag a group member onto **Remove from group**. It should return to its original window section, with the real tab and window unchanged. Repeat using the tab's menu. Pinned rows must not start a drag, become grouping targets, or appear in the group member picker.
5. Click a group title or chevron to expand/collapse it; use **Switch to last active tab** in the group menu to activate a member. Check inline **Rename group**, **Edit group…**, **Ungroup tabs**, and ungroup undo. Empty group names must remain after their last member closes. Closing a tab must show no notice or undo action.
6. Search by group name, page title, and domain. Dragging must be disabled while search is active. Check **Add to group…**, **Move to group…**, and removal from a tab menu as keyboard-accessible alternatives. Each tab must belong to at most one group.
7. Save a tab from its menu. Check that its full path/query/hash survives. Save it again and verify the existing editor opens. Create a collection, edit the saved title/collection, search/filter, open it without duplicating an existing tab, and remove/undo it.
8. Open two panels and make concurrent edits. Saving different pages must retain both. Stale saved-page/group editors and drags with changed membership must report a conflict without overwriting the newer state.
9. Reload the panel or suspend/restart the service worker: membership and local order should remain. Reload the extension or restart Chrome: Saved, collections, and group names should remain, while live membership and order clear. Normal and incognito libraries must remain separate, and closing all incognito windows clears the private library.
10. Review Tabs, Saved, menus, inline rename, and dialogs at 320px in light and dark modes. Check row dividers, visible regular-tab close buttons, and focus states. Pinned rows remain collapsible with no close button. Window and display names must share one line; long names truncate without obscuring **Merge here**. Check empty states and long page names/URLs. Only Chrome's native panel header should show the Ztab title; the content should start with navigation and search.

## Display-name checks in Chrome

Historical verification before the inline-group redesign, on 2026-09-16 with Chrome for Testing 153.0.8010.12 on macOS in an isolated profile connected to three actual displays: the extension API returned empty names; accepting Chrome's window-management permission supplied **U27E40 (1)**, **U27E40 (2)**, and **Built-in Display**. The native 360px panel showed the correct name for each window, including the display at a negative desktop offset. Moving the panel's host and another window between screens updated labels without a manual refresh. Pinned rows also showed their window's display.

That earlier panel document was visually reviewed at 320px with no horizontal overflow. A native-panel dark-mode check at 320px used deliberately long label text to verify truncation and unobstructed merge buttons. A browser permission override verified that revocation restores numbered labels, the enable action explains a blocked permission, and restoring access restores names. Automated tests additionally cover explicit-request rejection and ensure ordinary refreshes do not request permission. Physical screen disconnect/reconnect and Windows/Linux behavior were not manually checked.

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
