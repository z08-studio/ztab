import { closeMenu, field, icon, node, openDialog, openMenu, textInput } from "./panel-ui.js";
import { pruneSelection, selectRange, selectionScope, toggleSelection } from "./shared/tab-selection.js";

// Selection is panel-local; only concrete actions go through the background writer.
export function createTabSelection({ getTabs, getMatchingTabs, getGroups, getMemberships, getWindows,
    isAvailable, isBusy, render, workspaceAction, refreshTree, setStatus, onEnter, onGroupAssigned, onError }) {
    const elements = Object.fromEntries(["select-tabs", "selection-tools", "bulk-toolbar", "bulk-count",
        "bulk-feedback", "clear-selection", "bulk-group", "bulk-move", "bulk-close", "bulk-more", "tab-list"]
        .map((id) => [id, document.getElementById(id)]));
    let active = false;
    let selected = new Set();
    let anchorId = null;
    let feedback = "";

    const matchingIds = () => getMatchingTabs().map((tab) => tab.id);
    const selectedIds = () => getTabs().filter((tab) => selected.has(tab.id) && !tab.pinned).map((tab) => tab.id);
    const hiddenCount = (ids) => {
        const matching = new Set(matchingIds());
        return ids.filter((id) => !matching.has(id)).length;
    };
    const visibleIds = () => [...elements["tab-list"].querySelectorAll("[data-tab-id]:not(.pinned-row)")]
        .filter((row) => !row.closest("[hidden]")).map((row) => Number(row.dataset.tabId));
    const snapshot = () => {
        const tabIds = selectedIds();
        const memberships = getMemberships();
        return { tabIds, expectedMemberships: Object.fromEntries(tabIds.map((id) => [id, memberships[id] || null])) };
    };

    function reset() {
        active = false;
        selected.clear();
        anchorId = null;
        feedback = "";
    }

    function enter() {
        if (!active) {
            onEnter();
            active = true;
            setStatus("");
        }
    }

    function selectTab(tab, event) {
        if (tab.pinned || isBusy() || !isAvailable()) return false;
        if (!active && !event.metaKey && !event.ctrlKey && !event.shiftKey) return false;
        enter();
        const order = visibleIds();
        selected = event.shiftKey ? selectRange(selected, order, anchorId, tab.id) : toggleSelection(selected, [tab.id]);
        if (!event.shiftKey || !order.includes(anchorId)) anchorId = tab.id;
        feedback = "";
        render();
        return true;
    }

    function checkbox(tabs, label, focusKey, tab = null) {
        const ids = tabs.filter((item) => !item.pinned).map((item) => item.id);
        const scope = selectionScope(selected, ids);
        const input = node("input", "selection-checkbox");
        input.type = "checkbox";
        input.checked = scope.checked;
        input.indeterminate = scope.mixed;
        input.disabled = isBusy() || !ids.length;
        input.setAttribute("aria-label", label);
        input.dataset.focusKey = focusKey;
        input.addEventListener("click", (event) => {
            event.stopPropagation();
            if (isBusy()) return;
            if (tab) selectTab(tab, event);
            else {
                selected = toggleSelection(selected, ids);
                feedback = "";
                render();
            }
        });
        return input;
    }

    async function perform(operation) {
        if (isBusy() || !operation.tabIds.length) return;
        feedback = "";
        setStatus("");
        const response = await workspaceAction(operation);
        if (response.group) onGroupAssigned(response.group.id);
        const completed = response.completedIds || [];
        // Tabs already in a move destination have reached the requested state.
        const resolved = operation.action === "bulk-move-tabs" ? [...completed, ...(response.skippedIds || [])] : completed;
        resolved.forEach((id) => selected.delete(id));
        const failed = response.failedIds?.length || 0;
        const skipped = response.skippedIds?.length || 0;
        if (operation.action === "bulk-save-tabs") {
            feedback = [`${response.savedCount} saved`, response.duplicateCount ? `${response.duplicateCount} already saved` : "",
                skipped ? `${skipped} internal ${skipped === 1 ? "page" : "pages"} skipped` : ""].filter(Boolean).join(" · ");
        }
        else if (failed) {
            const verb = operation.action === "bulk-close-tabs" ? "closed" : "moved";
            feedback = `${completed.length} ${verb} · ${failed} could not be ${verb}. ${response.failures?.[0]?.error || "Try again."}`;
        }
        else if (operation.action === "bulk-move-tabs") {
            feedback = `${completed.length} moved${skipped ? ` · ${skipped} already in this window` : ""}`;
        }
        if (response.warning) feedback = [feedback, response.warning].filter(Boolean).join(". ");
        await refreshTree();
        selected = pruneSelection(selected, getTabs());
        if (!selected.size) {
            const message = feedback;
            reset();
            if (message) setStatus(message);
        }
        render();
        elements["tab-list"].focus({ preventScroll: true });
    }

    function groupMenu() {
        const choice = snapshot();
        openMenu(elements["bulk-group"], [
            { label: "New group…", run: () => {
                const name = textInput("", { placeholder: "Group name" });
                openDialog({ title: `Group ${choice.tabIds.length} tabs`, body: field("Name", name), submitLabel: "Create group",
                    onSubmit: () => perform({ action: "bulk-create-group", ...choice, name: name.value, color: "purple" }) });
                name.focus();
            } },
            ...getGroups().map((group) => ({ label: group.name,
                run: () => perform({ action: "bulk-assign-tabs", ...choice, groupId: group.id }) }))
        ], onError);
    }

    function moveMenu() {
        const tabIds = selectedIds();
        const tabs = getTabs().filter((tab) => tabIds.includes(tab.id));
        openMenu(elements["bulk-move"], [
            { label: "New window", run: () => perform({ action: "bulk-move-tabs", tabIds, targetWindowId: null }) },
            ...getWindows().filter((win) => win.mergeEligible).map((win) => ({
                label: [win.label, win.displayName].filter(Boolean).join(" · "),
                disabled: tabs.every((tab) => tab.windowId === win.id),
                run: () => perform({ action: "bulk-move-tabs", tabIds, targetWindowId: win.id })
            }))
        ], onError);
    }

    function closeSelected() {
        const tabIds = selectedIds();
        const hidden = hiddenCount(tabIds);
        const run = () => perform({ action: "bulk-close-tabs", tabIds });
        if (!hidden) return run();
        const body = node("p", "", `${hidden} of the ${tabIds.length} selected tabs are hidden by your search. Close all ${tabIds.length} selected tabs?`);
        openDialog({ title: `Close ${tabIds.length} tabs?`, body, submitLabel: `Close ${tabIds.length} tabs`, onSubmit: run });
    }

    function moreMenu() {
        const choice = snapshot();
        openMenu(elements["bulk-more"], [
            { label: "Save to Saved", run: () => perform({ action: "bulk-save-tabs", tabIds: choice.tabIds }) },
            { label: "Remove from groups", disabled: !Object.values(choice.expectedMemberships).some(Boolean),
                run: () => perform({ action: "bulk-assign-tabs", ...choice, groupId: null }) }
        ], onError);
    }

    function paint() {
        const available = isAvailable();
        document.querySelector(".app").classList.toggle("selection-mode", active);
        document.querySelector(".summary-footer").hidden = active;
        elements["select-tabs"].hidden = !available;
        elements["select-tabs"].disabled = isBusy();
        elements["select-tabs"].textContent = active ? "Done" : "Select";
        elements["select-tabs"].setAttribute("aria-pressed", String(active));
        elements["selection-tools"].hidden = elements["bulk-toolbar"].hidden = !active;
        if (!active) return;
        const focusKey = elements["selection-tools"].contains(document.activeElement) ? document.activeElement.dataset.focusKey : null;
        const all = node("label");
        all.append(checkbox(getMatchingTabs(), "Select all matching unpinned tabs", "select-all"),
            node("span", "", document.getElementById("search").value.trim() ? "Select all results" : "Select all"));
        elements["selection-tools"].replaceChildren(all, node("span", "", "Pinned excluded"));
        if (focusKey) all.querySelector("input").focus({ preventScroll: true });
        const ids = selectedIds();
        const hidden = hiddenCount(ids);
        const count = node("strong", "", `${ids.length} selected`);
        const detail = node("small", "", hidden ? ` · ${hidden} hidden by search` : "");
        elements["bulk-count"].replaceChildren(count, detail);
        elements["bulk-feedback"].textContent = feedback;
        elements["bulk-feedback"].hidden = !feedback;
        elements["bulk-close"].replaceChildren(icon("close"), document.createTextNode(`Close ${ids.length}`));
        for (const id of ["bulk-group", "bulk-move", "bulk-close", "bulk-more", "clear-selection"])
            elements[id].disabled = isBusy() || !ids.length;
    }

    elements["select-tabs"].addEventListener("click", () => {
        if (isBusy()) return;
        if (active) reset(); else enter();
        render();
    });
    elements["clear-selection"].addEventListener("click", () => {
        if (isBusy()) return;
        selected.clear(); anchorId = null; feedback = ""; render();
    });
    for (const [id, name, handler] of [["bulk-group", "groups", groupMenu], ["bulk-move", "move", moveMenu],
        ["bulk-close", "close", closeSelected], ["bulk-more", "more", moreMenu]]) {
        elements[id].prepend(icon(name));
        elements[id].dataset.focusKey = id;
        if (id !== "bulk-close") elements[id].setAttribute("aria-haspopup", "menu");
        elements[id].addEventListener("click", () => {
            if (!isBusy() && selected.size) Promise.resolve().then(handler).catch(onError);
        });
    }
    document.addEventListener("keydown", (event) => {
        if (event.defaultPrevented || isBusy() || !isAvailable() || document.querySelector("dialog[open], .menu:popover-open")) return;
        const editing = event.target.closest("input:not([type=checkbox]):not([type=button]), textarea, select, [contenteditable=true]");
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a" && !editing) {
            event.preventDefault(); enter();
            selected = new Set([...selected, ...matchingIds()]);
            feedback = ""; render();
        }
        if (event.key === "Escape" && active) {
            event.preventDefault(); reset(); render(); elements["select-tabs"].focus();
        }
    });
    return { active: () => active, has: (id) => selected.has(id), selectTab, checkbox, paint, reset,
        prune: () => { selected = pruneSelection(selected, getTabs()); } };
}
