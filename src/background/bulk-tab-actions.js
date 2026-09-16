import { classifyWindowSnapshot, WINDOW_STATUS_ELIGIBLE } from "./window-eligibility.js";
import { isSyncWindow } from "../shared/tab-utils.js";

function assertSelection(tabIds) {
    if (!Array.isArray(tabIds) || !tabIds.length ||
        tabIds.some((id) => !Number.isInteger(id) || id < 0) || new Set(tabIds).size !== tabIds.length)
        throw new Error("Select one or more different tabs and try again.");
}

function assertWindow(win, incognito, allowCompact = false) {
    if (!win)
        throw new Error("A window closed. Refresh and try again.");
    if (!isSyncWindow(win))
        throw new Error("Only regular browser windows support this action.");
    if (!allowCompact && classifyWindowSnapshot(win) !== WINDOW_STATUS_ELIGIBLE)
        throw new Error("Expand compact windows before moving tabs and try again.");
    if ((win.incognito === true) !== incognito)
        throw new Error("Regular and incognito tabs cannot be managed together.");
}

function assertTab(tab, source, expectedWindowId, incognito, allowCompact = false) {
    if (!tab)
        throw new Error("This tab closed. Refresh the selection and try again.");
    if (tab.pinned)
        throw new Error("This tab is pinned. Unpin it before using bulk actions.");
    if (tab.windowId !== expectedWindowId)
        throw new Error("This tab moved to another window. Select it again to continue.");
    assertWindow(source, incognito, allowCompact);
    const current = source.tabs?.find((item) => item.id === tab.id);
    if (!current || current.pinned)
        throw new Error("This tab changed. Refresh the selection and try again.");
}

export async function runBulkTabAction(operation, { windows, incognito }, api) {
    assertSelection(operation.tabIds);
    const closing = operation.action === "bulk-close-tabs";
    if (!closing && operation.action !== "bulk-move-tabs")
        throw new Error("This bulk action is unavailable.");
    let targetWindowId = closing ? null : operation.targetWindowId;
    if (!closing && targetWindowId !== null && (!Number.isInteger(targetWindowId) || targetWindowId < 0))
        throw new Error("Choose a destination window and try again.");
    let originalActiveId;
    if (!closing && targetWindowId !== null) {
        const target = await api.getWindowWithTabs(targetWindowId);
        assertWindow(target, incognito);
        originalActiveId = target.tabs?.find((tab) => tab.active)?.id;
    }

    const initialTabs = new Map(windows.flatMap((win) => (win.tabs || []).map((tab) => [tab.id, { tab, win }])));
    const result = { completedIds: [], failedIds: [], skippedIds: [], failures: [] };
    let newWindowFailed = false;
    for (const tabId of operation.tabIds) {
        let mutationAttempted = false;
        try {
            const initial = initialTabs.get(tabId);
            const live = await api.getTab(tabId);
            if (closing && !live) {
                result.completedIds.push(tabId);
                continue;
            }
            if (!initial)
                throw new Error("This tab is no longer in the selection. Refresh and try again.");
            // Revalidate the original source on every iteration. The panel can
            // disappear midway, and the user can pin or move the remaining tabs.
            assertTab(initial.tab, initial.win, initial.win.id, incognito, closing);
            const source = await api.getWindowWithTabs(initial.win.id);
            assertTab(live, source, initial.win.id, incognito, closing);

            if (closing) {
                assertTab(await api.getTab(tabId), source, initial.win.id, incognito, true);
                await api.removeTabs([tabId]);
                if (await api.getTab(tabId))
                    throw new Error("This tab could not be closed. Try again.");
            }
            else if (targetWindowId === null) {
                if (newWindowFailed)
                    throw new Error("The new window could not be created. Try moving the remaining tabs again.");
                // Moving the first real tab into the new window avoids a blank
                // placeholder and never closes a window containing new user tabs.
                assertTab(await api.getTab(tabId), source, initial.win.id, incognito);
                newWindowFailed = true;
                mutationAttempted = true;
                const target = await api.createWindow({ tabId, type: "normal", incognito, focused: false });
                if (!Number.isInteger(target?.id))
                    throw new Error("The new window could not be verified. Refresh before trying again.");
                targetWindowId = target.id;
                originalActiveId = tabId;
                newWindowFailed = false;
                assertWindow(await api.getWindowWithTabs(targetWindowId), incognito);
            }
            else {
                assertWindow(await api.getWindowWithTabs(targetWindowId), incognito);
                // Destination checks yield to Chrome. Read the selected tab once
                // more so a pin or manual move during that check is respected.
                assertTab(await api.getTab(tabId), source, initial.win.id, incognito);
                if (live.windowId === targetWindowId) {
                    result.skippedIds.push(tabId);
                    continue;
                }
                mutationAttempted = true;
                await api.moveTabs([tabId], { windowId: targetWindowId, index: -1 });
            }
            if (!closing) {
                const moved = await api.getTab(tabId);
                if (!moved || moved.windowId !== targetWindowId || moved.pinned)
                    throw new Error("This tab could not be moved as requested. Refresh and try again.");
            }
            result.completedIds.push(tabId);
        }
        catch (error) {
            const current = await api.getTab(tabId);
            // API callbacks can fail after a mutation has taken effect, or a tab
            // can close during revalidation. Report the observed result honestly.
            if ((closing && !current) || (!closing && mutationAttempted && targetWindowId !== null && current?.windowId === targetWindowId && !current.pinned)) {
                result.completedIds.push(tabId);
                continue;
            }
            result.failedIds.push(tabId);
            result.failures.push({ tabId, error: error?.message || "This tab could not be updated. Try again." });
        }
    }

    if (!closing && targetWindowId !== null) {
        result.targetWindowId = targetWindowId;
        const target = await api.getWindowWithTabs(targetWindowId);
        const activeId = target?.tabs?.find((tab) => tab.active)?.id;
        if (result.completedIds.includes(activeId) && activeId !== originalActiveId && target.tabs.some((tab) => tab.id === originalActiveId)) {
            // Restore a tab selected by our move, but do not override a different
            // destination tab that the user selected while the batch was running.
            try { await api.updateTab(originalActiveId, { active: true }); }
            catch { result.warning = "Tabs moved, but the previously active tab could not be restored."; }
        }
    }
    return result;
}
