import { buildTabTreeModel, flattenTabTreeTabs, formatShortcut, getMoveTargets, getPinnedTabs, getUnpinnedTabTree } from "./shared/tab-tree.js";
import { getAllNormalWindowsWithTabs, getCommands, getPanelWindow, getTab, moveTabs, openShortcutSettings, removeTabs, sendMessage, storageGet, updateTab, updateWindow } from "./background/chrome-api.js";
import { MESSAGE_MERGE_WINDOWS, MESSAGE_WORKSPACE, STORAGE_PRIVATE_WORKSPACE_KEY, STORAGE_SHOW_PINNED_TABS_KEY, STORAGE_WORKSPACE_KEY } from "./background/constants.js";
import { resolveShowPinnedTabs } from "./shared/preferences.js";
import { emptyWorkspace, GROUP_COLORS, orderedWorkspaceTabs, savedUrl } from "./shared/workspace.js";
import { closeMenu, field, icon, node, openDialog, openMenu, selectInput, textInput } from "./panel-ui.js";
import { createDisplayReader } from "./display-info.js";
import { createTabDragController } from "./tab-drag.js";
import { createTabSelection } from "./tab-selection.js";
import { selectableTabs } from "./shared/tab-selection.js";

const state = {
    tree: [], currentWindowId: null, activeTabId: null, focusedTabId: null, incognito: false,
    workspace: emptyWorkspace(""), view: "tabs", query: { tabs: "", saved: "" },
    scroll: { tabs: 0, saved: 0 }, collection: "all", pinnedExpanded: true,
    collapsedGroups: new Set(), selectedId: null, showPinnedTabs: true,
    movingTabId: null, mergingWindowId: null, busy: false, shortcut: "", renamingGroup: null
};
const elements = Object.fromEntries([
    "summary", "refresh", "keyboard-help", "mode-bar", "status", "tab-list", "search",
    "saved-tools", "save-current", "collection", "new-collection", "workspace-panel", "ungroup-drop", "drag-announcement"
].map((id) => [id, document.getElementById(id)]));
let refreshTimer = null;
let refreshGeneration = 0;
let noticeVersion = 0;
let dragController = null;
const displayReader = createDisplayReader({ onChange: scheduleRefresh });
const allTabs = () => flattenTabTreeTabs(state.tree);
const tabById = (id) => allTabs().find((tab) => tab.id === id);
const groupById = (id) => state.workspace.groups.find((group) => group.id === id);
const membersOf = (id) => orderedWorkspaceTabs(state.workspace, allTabs()).filter((tab) => !tab.pinned && state.workspace.memberships[tab.id] === id);
const isBusy = () => state.busy || state.mergingWindowId !== null;
const counted = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;
const selection = createTabSelection({
    getTabs: () => {
        const ordered = orderedWorkspaceTabs(state.workspace, allTabs());
        // Match the visual order: groups first, then each window's loose tabs.
        return [...state.workspace.groups.flatMap((group) => ordered.filter((tab) => state.workspace.memberships[tab.id] === group.id)),
            ...state.tree.flatMap((win) => ordered.filter((tab) => tab.windowId === win.id && !state.workspace.memberships[tab.id]))];
    },
    getMatchingTabs: () => selectableTabs(allTabs(), state.workspace.groups, state.workspace.memberships, state.query.tabs),
    getGroups: () => state.workspace.groups, getMemberships: () => state.workspace.memberships, getWindows: () => state.tree,
    isAvailable: () => state.view === "tabs" && state.movingTabId === null,
    isBusy, render, workspaceAction, refreshTree, setStatus, onError: showActionError,
    onGroupAssigned: (id) => state.collapsedGroups.delete(id),
    onEnter: () => { dragController?.cancel(); closeMenu(); state.renamingGroup = null; }
});

function button(text, label, handler, className = "text-button", iconName = null) {
    const control = node("button", className, text);
    control.type = "button";
    control.setAttribute("aria-label", label);
    control.title = label;
    control.disabled = isBusy();
    if (iconName)
        control.prepend(icon(iconName));
    control.addEventListener("click", (event) => {
        event.stopPropagation();
        if (isBusy() || dragController?.suppressClick())
            return;
        Promise.resolve().then(() => handler(event)).catch(showActionError);
    });
    return control;
}

function setStatus(message, actions = []) {
    const version = ++noticeVersion;
    elements.status.replaceChildren(node("span", "notice-copy", message));
    elements.status.hidden = !message;
    for (const action of actions) {
        const control = button(action.label, action.label, async () => {
            control.disabled = true;
            try {
                await action.run();
                if (noticeVersion === version)
                    setStatus("");
            }
            catch (error) {
                control.disabled = false;
                throw error;
            }
        });
        if (action.title)
            control.title = action.title;
        elements.status.append(control);
    }
    if (message)
        elements.status.append(button("", "Dismiss message", () => setStatus(""), "icon-button", "close"));
}

function showActionError(error) {
    setStatus(error?.message || "The action could not be completed. Try again.");
}

function hostFromUrl(url) {
    try { return new URL(url).host.replace(/^www\./, "") || url; }
    catch { return url || "No URL"; }
}

function canSave(tab) {
    try { savedUrl(tab?.url); return true; }
    catch { return false; }
}

function matchesTab(tab, query) {
    return `${tab.title} ${tab.url}`.toLowerCase().includes(query);
}

function tabIcon(tab) {
    const placeholder = () => node("span", "tab-placeholder", (tab.title || "?").trim().charAt(0).toUpperCase());
    let source = tab.favIconUrl;
    if (!source && canSave(tab)) {
        // Saved pages only store their URL. Chrome can resolve their icons even
        // after the original tab closes, without migrating existing entries.
        const cached = new URL(chrome.runtime.getURL("/_favicon/"));
        cached.searchParams.set("pageUrl", tab.url);
        cached.searchParams.set("size", "32");
        source = cached.href;
    }
    if (!source)
        return placeholder();
    const image = node("img", "tab-icon");
    image.alt = "";
    image.draggable = false;
    image.src = source;
    image.addEventListener("error", () => image.replaceWith(placeholder()), { once: true });
    return image;
}

function rowCopy(title, meta) {
    const copy = node("span", "tab-copy");
    copy.append(node("span", "tab-title", title), node("span", "tab-meta", meta));
    return copy;
}

function selectable(control, id, row) {
    control.dataset.selectId = id;
    control.dataset.focusKey = id;
    row.dataset.rowId = id;
    row.classList.toggle("selected", state.selectedId === id);
    control.addEventListener("focus", () => selectRow(id));
    return control;
}

function selectRow(id, scroll = false) {
    state.selectedId = id;
    for (const row of elements["tab-list"].querySelectorAll("[data-row-id]")) {
        row.classList.toggle("selected", row.dataset.rowId === id);
        if (scroll && row.dataset.rowId === id)
            row.scrollIntoView({ block: "nearest" });
    }
}

function renderTabRow(tab, inGroup = false) {
    const active = tab.id === (inGroup ? state.focusedTabId : state.activeTabId);
    const row = node("div", `tab-row${tab.pinned ? " pinned-row" : ""}${active ? " active-row" : ""}`);
    row.setAttribute("role", "listitem");
    row.dataset.tabId = String(tab.id);
    row.dataset.windowId = String(tab.windowId);
    const group = groupById(state.workspace.memberships[tab.id]);
    row.dataset.groupId = group?.id || "";
    const meta = [hostFromUrl(tab.url), inGroup || tab.pinned ? tab.windowLocation : "",
        tab.audible ? (tab.muted ? "Muted" : "Audio") : ""].filter(Boolean).join(" · ");
    const open = button("", `${selection.active() ? "Select" : "Open"} ${tab.title}`, (event) => {
        if (tab.pinned && (event.metaKey || event.ctrlKey || event.shiftKey)) return;
        if (!selection.selectTab(tab, event)) return activateTab(tab.id);
    }, "open-row");
    if (selection.active()) {
        open.disabled = tab.pinned || isBusy();
        if (!tab.pinned) {
            open.setAttribute("aria-pressed", String(selection.has(tab.id)));
            row.classList.toggle("bulk-selected", selection.has(tab.id));
            row.append(selection.checkbox([tab], `Select ${tab.title}`, `select-tab-${tab.id}`, tab));
            row.addEventListener("click", (event) => {
                if (!event.target.closest("button, input")) selection.selectTab(tab, event);
            });
        }
    }
    open.title = `${tab.title}\n${tab.url}\n${tab.windowLocation}`;
    open.draggable = false;
    if (!tab.pinned && !selection.active() && !state.query.tabs.trim() && !isBusy())
        open.dataset.dragTabId = String(tab.id);
    if (active)
        open.setAttribute("aria-current", "page");
    open.append(tabIcon(tab), rowCopy(tab.title, meta));
    row.append(selectable(open, `tab-${tab.id}`, row));
    if (selection.active()) return row;
    const more = button("", `More actions for ${tab.title}`, () => tabMenu(more, tab), "icon-button", "more");
    more.setAttribute("aria-haspopup", "menu");
    more.dataset.focusKey = `more-tab-${tab.id}`;
    row.append(more);
    if (!tab.pinned) {
        const close = button("", `Close ${tab.title}`, () => closeTab(tab.id), "icon-button close-action", "close");
        close.dataset.focusKey = `close-tab-${tab.id}`;
        row.append(close);
    }
    return row;
}

function tabMenu(anchor, tab) {
    const group = groupById(state.workspace.memberships[tab.id]);
    const saved = state.workspace.saved.some((item) => item.url === tab.url);
    const items = [
        { label: saved ? "Edit saved page…" : "Save page", disabled: !canSave(tab), run: () => saveTab(tab.id) }
    ];
    if (!tab.pinned)
        items.push({ label: group ? "Move to group…" : "Add to group…", run: () => assignGroupDialog(tab) });
    if (group)
        items.push({ label: `Remove from ${group.name}`, run: () => workspaceAction({ action: "assign-tab", tabId: tab.id, groupId: null, expectedGroupId: group.id }) });
    items.push({ label: tab.pinned ? "Unpin tab" : "Pin tab", run: () => updateTab(tab.id, { pinned: !tab.pinned }) });
    if (!tab.pinned)
        items.push({ label: "Move to window…", run: () => { state.movingTabId = tab.id; render(); elements["tab-list"].focus(); } });
    openMenu(anchor, items, showActionError);
}

function empty(title, description, iconName) {
    const wrapper = node("div", "empty");
    const mark = node("span", "empty-icon");
    mark.append(icon(iconName));
    wrapper.append(mark, node("strong", "", title), node("p", "", description));
    return wrapper;
}

function windowHeading(win, tabs) {
    const heading = node("div", `window-heading ${win.isCurrentWindow ? "current-heading" : "other-heading"}`);
    const left = node("span", "heading-left");
    const title = node("span", "window-title");
    if (selection.active()) left.append(selection.checkbox(tabs, `Select tabs in ${win.label}`, `select-window-${win.id}`));
    title.append(node("span", "", win.label), node("span", "count", String(tabs.length)));
    left.append(title);
    if (win.displayName) {
        const display = node("span", "window-display");
        display.title = win.displayName;
        display.append(node("span", "display-name", win.displayName));
        left.append(display);
    }
    heading.append(left);
    if (!selection.active() && !win.isCurrentWindow && state.currentWindowId !== null) {
        const current = state.tree.find((item) => item.isCurrentWindow);
        const label = `Merge all tabs from ${win.label} into Current window`;
        const merge = button(state.mergingWindowId === win.id ? "Merging…" : "Merge here", label, () => mergeWindow(win.id), "text-button merge-action");
        const allowed = win.mergeEligible && current?.mergeEligible && win.incognito === current.incognito;
        merge.disabled = !allowed || isBusy();
        merge.title = allowed ? label : "Merge is available between regular windows of the same browsing mode. Expand compact windows to merge them.";
        merge.dataset.focusKey = `merge-${win.id}`;
        heading.append(merge);
    }
    return heading;
}

function renderTabs() {
    const fragment = document.createDocumentFragment();
    const query = state.query.tabs.trim().toLowerCase();
    const pinned = getPinnedTabs(state.tree).filter((tab) => matchesTab(tab, query));
    let matches = 0;
    if (state.showPinnedTabs && pinned.length) {
        const expanded = state.pinnedExpanded || Boolean(query);
        const heading = node("div", "window-heading pinned-heading");
        const toggle = button("Pinned tabs", "Toggle pinned tabs", () => { state.pinnedExpanded = !state.pinnedExpanded; render(); }, "heading-toggle", "chevron");
        toggle.setAttribute("aria-expanded", String(expanded));
        toggle.dataset.focusKey = "pinned-toggle";
        toggle.append(node("span", "count", String(pinned.length)));
        heading.append(toggle);
        fragment.append(heading);
        if (expanded)
            pinned.forEach((tab) => fragment.append(renderTabRow(tab)));
        matches += pinned.length;
    }
    const grouped = renderGroups(query);
    fragment.append(grouped.fragment);
    matches += grouped.matches;
    for (const win of getUnpinnedTabTree(state.tree)) {
        const tabs = orderedWorkspaceTabs(state.workspace, win.tabs).filter((tab) => !state.workspace.memberships[tab.id] && matchesTab(tab, query));
        if (query && !tabs.length)
            continue;
        // A window with all tabs grouped or hidden still needs its merge action.
        if (!tabs.length && (win.isCurrentWindow || selection.active()))
            continue;
        fragment.append(windowHeading(win, tabs));
        tabs.forEach((tab) => fragment.append(renderTabRow(tab)));
        matches += tabs.length;
    }
    if (!state.tree.length)
        fragment.append(empty("No open windows", "Open a regular Chrome window to see your tabs.", "tabs"));
    else if (query && !matches)
        fragment.append(empty("No matching tabs", "Try a page title or website address.", "search"));
    return fragment;
}

function renderGroups(query) {
    const fragment = document.createDocumentFragment();
    let count = 0;
    for (const group of state.workspace.groups) {
        const members = membersOf(group.id);
        const nameMatches = group.name.toLowerCase().includes(query);
        const matches = nameMatches ? members : members.filter((tab) => matchesTab(tab, query));
        if (query && !nameMatches && !matches.length)
            continue;
        count += Math.max(matches.length, 1);
        const active = members.some((tab) => tab.id === state.focusedTabId);
        const card = node("div", `group-card color-${group.color}${active ? " group-active" : ""}`);
        card.setAttribute("role", "listitem");
        const expanded = !state.collapsedGroups.has(group.id) || Boolean(query);
        const heading = node("div", "group-header");
        heading.dataset.dropGroupId = group.id;
        const toggleGroup = () => {
            if (expanded) state.collapsedGroups.add(group.id);
            else state.collapsedGroups.delete(group.id);
            render();
        };
        const toggle = button("", `${expanded ? "Collapse" : "Expand"} ${group.name}`, toggleGroup, "icon-button group-toggle", "chevron");
        toggle.setAttribute("aria-expanded", String(expanded));
        toggle.setAttribute("aria-controls", `members-${group.id}`);
        toggle.dataset.focusKey = `toggle-${group.id}`;
        const windows = new Set(members.map((tab) => tab.windowId)).size;
        const jump = button("", `${expanded ? "Collapse" : "Expand"} group ${group.name}`, toggleGroup, "group-switch");
        jump.setAttribute("aria-expanded", String(expanded));
        jump.setAttribute("aria-controls", `members-${group.id}`);
        jump.append(node("span", "group-name", group.name), node("span", "count", String(members.length)));
        const more = button("", `Actions for ${group.name}`, () => openMenu(more, [
            { label: "Switch to last active tab", disabled: !members.length, run: () => workspaceAction({ action: "activate-group", id: group.id }) },
            { label: "Rename group", run: () => startGroupRename(group) },
            { label: "Edit group…", run: () => groupDialog(group) },
            { label: "Ungroup tabs", run: () => removeGroup(group) }
        ], showActionError), "icon-button", "more");
        more.setAttribute("aria-haspopup", "menu");
        more.dataset.focusKey = `more-${group.id}`;
        if (selection.active()) heading.append(selection.checkbox(matches, `Select tabs in ${group.name}`, `select-group-${group.id}`));
        heading.append(toggle);
        if (state.renamingGroup?.id === group.id) {
            const draft = state.renamingGroup;
            const input = textInput(draft.name);
            input.className = "group-name-input";
            input.setAttribute("aria-label", "Group name");
            input.dataset.focusKey = `rename-${group.id}`;
            input.disabled = isBusy();
            input.addEventListener("input", () => { draft.name = input.value; });
            input.addEventListener("keydown", (event) => {
                if (!["Enter", "Escape"].includes(event.key)) return;
                event.preventDefault();
                event.stopPropagation();
                if (event.key === "Enter") finishGroupRename().catch(showActionError);
                else { state.renamingGroup = null; render(); }
            });
            heading.append(input, button("Save", "Save group name", finishGroupRename));
        }
        else {
            heading.append(selectable(jump, `group-${group.id}`, heading), node("span", "group-windows", counted(windows, "window")));
            if (!selection.active()) heading.append(more);
        }
        card.append(heading);
        const list = node("div", "group-items");
        list.id = `members-${group.id}`;
        list.setAttribute("role", "list");
        list.hidden = !expanded;
        matches.forEach((tab) => list.append(renderTabRow(tab, true)));
        if (!members.length)
            list.append(node("p", "group-empty", "No open tabs. Use Edit group to add some."));
        card.append(list);
        fragment.append(card);
    }
    return { fragment, matches: count };
}

function startGroupRename(group) {
    state.renamingGroup = { id: group.id, revision: group.revision, name: group.name };
    render();
    const input = elements["tab-list"].querySelector(".group-name-input");
    input?.focus();
    input?.select();
}

async function finishGroupRename() {
    const draft = state.renamingGroup;
    if (!draft || isBusy()) return;
    await workspaceAction({ action: "rename-group", id: draft.id, name: draft.name, expectedRevision: draft.revision });
    state.renamingGroup = null;
    render();
    elements["tab-list"].focus({ preventScroll: true });
}

async function dropTab(source, target) {
    let operation;
    if (target.tabId !== undefined) {
        operation = { action: "drop-tab", tabId: source.id, targetTabId: target.tabId,
            placement: target.mode === "before" || target.mode === "after" ? target.mode : "group",
            expectedGroupId: source.groupId, expectedTargetGroupId: target.groupId };
    }
    else {
        operation = { action: "assign-tab", tabId: source.id, groupId: target.mode === "ungroup" ? null : target.groupId,
            expectedGroupId: source.groupId };
    }
    const response = await workspaceAction(operation);
    state.selectedId = `tab-${source.id}`;
    const groupId = state.workspace.memberships[source.id];
    if (groupId) state.collapsedGroups.delete(groupId);
    render();
    selectRow(state.selectedId, true);
    if (response.created) startGroupRename(response.group);
    else elements["tab-list"].focus({ preventScroll: true });
    elements["drag-announcement"].textContent = response.created ? "Group created. Enter a name."
        : target.mode === "ungroup" ? "Tab removed from group." : target.mode === "join" ? "Tab added to group." : "Tab order updated.";
}

function collectionName(id) {
    return state.workspace.collections.find((item) => item.id === id)?.name || "Unsorted";
}

function renderSaved() {
    const fragment = document.createDocumentFragment();
    const query = state.query.saved.trim().toLowerCase();
    const saved = state.workspace.saved.filter((item) => (state.collection === "all" || (item.collectionId || "unsorted") === state.collection) && matchesTab(item, query));
    if (!saved.length) {
        const filtered = query || state.collection !== "all";
        fragment.append(empty(filtered ? "No saved pages here" : "A place for pages worth keeping", filtered ? "Try another collection or save a page to this one." : "Save a tab from its ··· menu, or save your current tab above.", "saved"));
    }
    if (saved.length)
        fragment.append(node("div", "section-label", `${saved.length} ${saved.length === 1 ? "page" : "pages"}`));
    for (const item of saved) {
        const row = node("div", "tab-row saved-row");
        row.setAttribute("role", "listitem");
        const open = button("", `Open ${item.title}`, () => workspaceAction({ action: "open-saved", id: item.id }), "open-row");
        open.title = `${item.title}\n${item.url}\nSaved ${new Date(item.createdAt).toLocaleDateString()}`;
        open.append(tabIcon(item), rowCopy(item.title, `${hostFromUrl(item.url)} · ${collectionName(item.collectionId)}`));
        const more = button("", `Actions for ${item.title}`, () => openMenu(more, [
            { label: "Edit saved page…", run: () => savedDialog(item) },
            { label: "Remove from Saved", run: () => removeSaved(item), danger: true }
        ], showActionError), "icon-button", "more");
        more.setAttribute("aria-haspopup", "menu");
        more.dataset.focusKey = `more-saved-${item.id}`;
        row.append(selectable(open, `saved-${item.id}`, row), more);
        fragment.append(row);
    }
    return fragment;
}

function renderMove() {
    const fragment = document.createDocumentFragment();
    const tab = tabById(state.movingTabId);
    fragment.append(button("← Back", "Cancel move", () => { state.movingTabId = null; render(); }, "cancel-move-button"));
    const targets = tab ? getMoveTargets(state.tree, tab.windowId) : [];
    if (!targets.length)
        fragment.append(empty("No other window", "Open another regular window to move this tab.", "tabs"));
    for (const target of targets) {
        const row = node("div", "target-row");
        row.setAttribute("role", "listitem");
        const location = [target.label, target.displayName].filter(Boolean).join(" · ");
        const move = button("", `Move to ${location}`, () => confirmMove(target.id), "open-row");
        move.append(rowCopy(target.label, [target.displayName, counted(target.tabCount, "tab")].filter(Boolean).join(" · ")), node("span", "move-label", "Move here"));
        row.append(selectable(move, `target-${target.id}`, row));
        fragment.append(row);
    }
    return fragment;
}

function render() {
    const list = elements["tab-list"];
    const focusKey = list.contains(document.activeElement) ? document.activeElement.dataset.focusKey : null;
    const scrollTop = list.scrollTop;
    const workspace = state.workspace;
    document.getElementById("tabs-count").textContent = String(allTabs().length);
    document.getElementById("saved-count").textContent = String(workspace.saved.length);
    document.getElementById("private-label").hidden = !state.incognito;
    document.getElementById("private-label").title = "Groups and Saved in incognito are cleared when all incognito windows close.";
    for (const control of document.querySelectorAll("[data-view]")) {
        const active = control.dataset.view === state.view;
        control.setAttribute("aria-selected", String(active));
        control.tabIndex = active ? 0 : -1;
        control.disabled = isBusy();
    }
    elements["workspace-panel"].setAttribute("aria-labelledby", `nav-${state.view}`);
    elements["saved-tools"].hidden = state.view !== "saved";
    for (const id of ["refresh", "new-collection"])
        elements[id].disabled = isBusy();
    elements["save-current"].disabled = isBusy() || !canSave(tabById(state.activeTabId));
    elements["save-current"].title = canSave(tabById(state.activeTabId)) ? "Save the active page in this window" : "Only HTTP and HTTPS pages can be saved";
    const options = [["all", "All saved"], ["unsorted", "Unsorted"], ...workspace.collections.map((item) => [item.id, item.name])];
    if (!options.some(([id]) => id === state.collection))
        state.collection = "all";
    elements.collection.replaceChildren(...selectInput(options, state.collection).children);
    elements.collection.value = state.collection;
    elements["mode-bar"].hidden = state.movingTabId === null;
    elements["mode-bar"].textContent = state.movingTabId !== null ? `Move “${tabById(state.movingTabId)?.title || "Tab"}” to another window` : "";
    elements.search.disabled = state.movingTabId !== null;
    list.setAttribute("aria-busy", String(isBusy()));
    list.setAttribute("aria-label", state.movingTabId !== null ? "Move destinations" : { tabs: "Open tabs and groups", saved: "Saved pages" }[state.view]);
    list.replaceChildren(state.movingTabId !== null ? renderMove() : state.view === "saved" ? renderSaved() : renderTabs());
    list.scrollTop = scrollTop;
    if (focusKey)
        [...list.querySelectorAll("[data-focus-key]")].find((control) => control.dataset.focusKey === focusKey)?.focus({ preventScroll: true });
    const pinsHidden = !state.showPinnedTabs ? getPinnedTabs(state.tree).length : 0;
    elements.summary.textContent = state.view === "saved" ? `${workspace.saved.length} saved · ${counted(workspace.collections.length, "collection")}`
        : `${counted(allTabs().length, "tab")} · ${counted(state.tree.length, "window")}${pinsHidden ? ` · ${pinsHidden} pinned hidden` : ""}`;
    selection.paint();
}

function switchView(view) {
    if (isBusy()) return;
    selection.reset();
    dragController?.cancel();
    closeMenu();
    state.scroll[state.view] = elements["tab-list"].scrollTop;
    state.view = view;
    state.movingTabId = null;
    state.renamingGroup = null;
    elements.search.value = state.query[view];
    elements.search.placeholder = `Search ${view}…`;
    elements.search.setAttribute("aria-label", `Search ${view}`);
    render();
    elements["tab-list"].scrollTop = state.scroll[view];
}

async function refreshTree({ preferActive = false } = {}) {
    const generation = ++refreshGeneration;
    const [windows, host, displayInfo] = await Promise.all([getAllNormalWindowsWithTabs(), getPanelWindow(), displayReader.read()]);
    if (!host)
        throw new Error("Could not find this panel's window. Reopen Ztab to try again.");
    const response = await sendMessage({ type: MESSAGE_WORKSPACE, windowId: host.id, operation: { action: "read" } });
    if (generation !== refreshGeneration || isBusy() || dragController?.active())
        return;
    // The panel's host defines “Current window”, independently of focus changes.
    const scoped = windows.filter((win) => (win.incognito === true) === (host.incognito === true));
    state.currentWindowId = host.id;
    state.incognito = host.incognito === true;
    state.tree = buildTabTreeModel(scoped, host.id, displayInfo.displays);
    state.workspace = response.workspace;
    state.activeTabId = allTabs().find((tab) => tab.windowId === host.id && tab.active)?.id ?? null;
    state.focusedTabId = (scoped.find((win) => win.focused) || scoped.find((win) => win.id === host.id))?.tabs?.find((tab) => tab.active)?.id ?? null;
    if (preferActive)
        state.selectedId = `tab-${state.activeTabId}`;
    if (state.movingTabId !== null && !tabById(state.movingTabId))
        state.movingTabId = null;
    selection.prune();
    render();
}

function scheduleRefresh() {
    if (isBusy() || dragController?.active())
        return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => refreshTree().catch(showActionError), 150);
}

async function workspaceAction(operation) {
    if (isBusy())
        throw new Error("Wait for the current action to finish.");
    state.busy = true;
    refreshGeneration += 1;
    render();
    try {
        const response = await sendMessage({ type: MESSAGE_WORKSPACE, windowId: state.currentWindowId, operation });
        state.workspace = response.workspace;
        return response;
    }
    finally {
        state.busy = false;
        render();
        scheduleRefresh();
    }
}

async function activateTab(tabId) {
    const tab = tabById(tabId);
    if (!tab || isBusy())
        return;
    await updateTab(tab.id, { active: true });
    await updateWindow(tab.windowId, { focused: true });
}

async function closeTab(tabId) {
    const tab = tabById(tabId);
    if (!tab || tab.pinned || isBusy())
        return;
    const selected = visibleListControls().map((control) => control.dataset.selectId);
    const index = selected.indexOf(`tab-${tab.id}`);
    state.busy = true;
    refreshGeneration += 1;
    setStatus("");
    render();
    try { await removeTabs([tab.id]); }
    finally {
        state.busy = false;
        render();
        await refreshTree();
    }
    const remaining = visibleListControls();
    selectRow(remaining[Math.min(index, remaining.length - 1)]?.dataset.selectId || null);
    elements["tab-list"].focus({ preventScroll: true });
}

async function confirmMove(targetId) {
    const tab = tabById(state.movingTabId);
    if (!tab || isBusy())
        return;
    state.busy = true;
    render();
    try {
        const live = await getTab(tab.id);
        if (!live || live.pinned)
            throw new Error("This tab closed or became pinned. Choose another tab to move.");
        await moveTabs(tab.id, { windowId: targetId, index: -1 });
        await updateTab(tab.id, { active: true });
        await updateWindow(targetId, { focused: true });
        state.movingTabId = null;
        setStatus("Tab moved");
    }
    finally {
        state.busy = false;
        render();
        await refreshTree();
    }
}

async function mergeWindow(sourceWindowId) {
    if (isBusy() || state.currentWindowId === null)
        return;
    state.mergingWindowId = sourceWindowId;
    refreshGeneration += 1;
    clearTimeout(refreshTimer);
    closeMenu();
    setStatus("");
    render();
    try {
        await sendMessage({ type: MESSAGE_MERGE_WINDOWS, sourceWindowId, targetWindowId: state.currentWindowId });
    }
    finally {
        state.mergingWindowId = null;
        render();
        await refreshTree();
        elements["tab-list"].focus({ preventScroll: true });
    }
}

async function saveTab(tabId) {
    const response = await workspaceAction({ action: "save-tab", tabId });
    if (response.duplicate) {
        savedDialog(response.item);
        return;
    }
    setStatus("Saved to Unsorted", [
        { label: "Move", run: () => savedDialog(state.workspace.saved.find((item) => item.id === response.item.id) || response.item) },
        { label: "Undo", run: () => workspaceAction({ action: "remove-saved", id: response.item.id, expectedRevision: response.item.revision }) }
    ]);
}

function savedDialog(item) {
    const body = node("div");
    const title = textInput(item.title, { maxLength: 500 });
    const url = textInput(item.url, { type: "url", maxLength: 20000 });
    const collection = selectInput([["", "Unsorted"], ...state.workspace.collections.map((entry) => [entry.id, entry.name])], item.collectionId || "");
    body.append(field("Title", title), field("URL", url), field("Collection", collection));
    openDialog({ title: "Edit saved page", body, onSubmit: async () => {
        await workspaceAction({ action: "edit-saved", id: item.id, expectedRevision: item.revision, title: title.value, url: url.value, collectionId: collection.value });
        setStatus("Saved page updated");
    } });
}

function collectionDialog() {
    const name = textInput("", { placeholder: "e.g. Reading" });
    openDialog({ title: "New collection", body: field("Collection name", name), submitLabel: "Create collection", onSubmit: async () => {
        const response = await workspaceAction({ action: "create-collection", name: name.value });
        state.collection = response.collection.id;
        render();
    } });
}

async function removeSaved(item) {
    const { removed } = await workspaceAction({ action: "remove-saved", id: item.id, expectedRevision: item.revision });
    setStatus("Removed from Saved", [{ label: "Undo", run: () => workspaceAction({ action: "restore-saved", item: removed }) }]);
}

function groupDialog(group = null, preselected = []) {
    const body = node("div");
    const name = textInput(group?.name || "", { placeholder: "e.g. Design research" });
    const color = selectInput(GROUP_COLORS.map((value) => [value, value.charAt(0).toUpperCase() + value.slice(1)]), group?.color || "purple");
    const properties = node("div", "group-properties");
    properties.append(field("Group name", name), field("Color", color));
    body.append(properties);
    const selected = new Set(group ? membersOf(group.id).map((tab) => tab.id) : preselected);
    const count = node("p", "dialog-help", `${selected.size} tabs selected · tabs stay in their windows`);
    const search = textInput("", { type: "search", required: false, placeholder: "Find open tabs…", maxLength: 500 });
    search.setAttribute("aria-label", "Find tabs for this group");
    const list = node("div", "member-list");
    const choices = [];
    for (const tab of allTabs().filter((item) => !item.pinned)) {
        const choice = node("label", "member-choice");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selected.has(tab.id);
        checkbox.setAttribute("aria-label", `Include ${tab.title} from ${tab.windowLocation}`);
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) selected.add(tab.id);
            else selected.delete(tab.id);
            count.textContent = `${selected.size} tabs selected · tabs stay in their windows`;
        });
        const existing = groupById(state.workspace.memberships[tab.id]);
        const meta = [tab.windowLocation, tab.pinned ? "Pinned" : "", existing && existing.id !== group?.id ? `From ${existing.name}` : "", hostFromUrl(tab.url)].filter(Boolean).join(" · ");
        choice.title = meta;
        choice.append(checkbox, rowCopy(tab.title, meta));
        choices.push({ choice, tab });
        list.append(choice);
    }
    search.addEventListener("input", () => {
        const query = search.value.trim().toLowerCase();
        choices.forEach(({ choice, tab }) => { choice.hidden = !matchesTab(tab, query); });
    });
    if (!choices.length)
        list.append(node("p", "dialog-help", "Open a tab before creating a group."));
    body.append(count, search, list);
    openDialog({ title: group ? "Edit group" : "New group", body, submitLabel: group ? "Save changes" : "Create group", onSubmit: async () => {
        const response = await workspaceAction({ action: group ? "edit-group" : "create-group", id: group?.id, expectedRevision: group?.revision, name: name.value, color: color.value, tabIds: [...selected] });
        state.collapsedGroups.delete(response.group.id);
        setStatus(group ? "Group updated" : "Group created");
        render();
    } });
}

function assignGroupDialog(tab) {
    const expectedGroupId = state.workspace.memberships[tab.id] || null;
    const body = node("div");
    body.append(node("p", "dialog-help", tab.title));
    const select = selectInput(state.workspace.groups.map((group) => [group.id, group.name]), state.workspace.memberships[tab.id] || state.workspace.groups[0]?.id || "");
    body.append(field("Group", select));
    const create = button("+ New group", "Create a group with this tab", () => { dialog.close(); groupDialog(null, [tab.id]); });
    body.append(create);
    const dialog = openDialog({ title: "Add to group", body, submitLabel: "Add tab", onSubmit: async () => {
        if (!select.value)
            throw new Error("Create a group first.");
        await workspaceAction({ action: "assign-tab", tabId: tab.id, groupId: select.value, expectedGroupId });
        setStatus("Tab added to group");
    } });
}

async function removeGroup(group) {
    const { removed } = await workspaceAction({ action: "remove-group", id: group.id, expectedRevision: group.revision });
    setStatus("Group removed · tabs stay open", [{ label: "Undo", run: () => workspaceAction({ action: "restore-group", group: removed }) }]);
}

async function refreshShortcut() {
    try {
        state.shortcut = (await getCommands()).find((command) => command.name === "_execute_action")?.shortcut || "";
    }
    catch { state.shortcut = null; }
    const visibleHint = document.querySelector("[data-shortcut-value]");
    if (visibleHint)
        visibleHint.textContent = shortcutLabel();
}

function shortcutLabel() {
    return state.shortcut === null ? "Unavailable" : state.shortcut ? formatShortcut(state.shortcut) : "Not assigned";
}

function keyboardHelp() {
    const body = node("div");
    for (const [label, keys] of [["Open panel", shortcutLabel()], ["Focus a row", "↑ / ↓"], ["Open or select focused row", "Enter"],
        ["Select multiple tabs", "⌘ / Ctrl + click"], ["Select a range", "Shift + click"], ["Select all matching tabs", "⌘ / Ctrl + A"],
        ["Move between controls", "Tab / Shift+Tab"], ["Search this view", "⌘ / Ctrl + F"], ["Dismiss or exit selection", "Esc"]]) {
        const row = node("div", "help-row");
        const value = node("kbd", "", keys);
        if (label === "Open panel")
            value.dataset.shortcutValue = "true";
        row.append(node("span", "", label), value);
        body.append(row);
    }
    body.append(button("Customize panel shortcut", "Open Chrome extension shortcut settings", openShortcutSettings));
    openDialog({ title: "Keyboard shortcuts", body, submitLabel: "Done", onSubmit: async () => {} });
}

function visibleListControls() {
    return [...elements["tab-list"].querySelectorAll("[data-select-id]")].filter((control) => !control.closest("[hidden]") && !control.disabled);
}

function handleListKeys(event) {
    if (event.target !== elements["tab-list"] && !event.target.closest("[data-select-id]"))
        return;
    const controls = visibleListControls();
    const index = controls.findIndex((control) => control.dataset.selectId === state.selectedId);
    if (["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? controls.length - 1
            : index < 0 ? 0 : Math.max(0, Math.min(controls.length - 1, index + (event.key === "ArrowUp" ? -1 : 1)));
        controls[next]?.focus({ preventScroll: true });
        if (controls[next])
            selectRow(controls[next].dataset.selectId, true);
    }
    else if (event.key === "Enter" && event.target === elements["tab-list"]) {
        event.preventDefault();
        (controls[index] || controls[0])?.click();
    }
}

async function init() {
    dragController = createTabDragController({
        root: elements["workspace-panel"], list: elements["tab-list"], ungroupZone: elements["ungroup-drop"],
        canDrag: () => state.view === "tabs" && !selection.active() && !state.query.tabs.trim() && state.movingTabId === null && !state.renamingGroup && !isBusy() && !document.querySelector("dialog[open]"),
        describeTab: (id) => {
            const tab = tabById(id);
            return tab && !tab.pinned ? { id, windowId: tab.windowId, groupId: state.workspace.memberships[id] || null } : null;
        },
        groupName: (id) => groupById(id)?.name || "group", onStart: closeMenu,
        onDrop: dropTab, onEnd: scheduleRefresh, onError: showActionError
    });
    document.getElementById("search-icon").append(icon("search"));
    for (const [id, name] of [["refresh", "refresh"], ["keyboard-help", "keyboard"], ["new-collection", "plus"]])
        elements[id].append(icon(name));
    elements["save-current"].prepend(icon("saved"));
    const views = [...document.querySelectorAll("[data-view]")];
    views.forEach((control, index) => {
        control.prepend(icon(control.dataset.view));
        control.addEventListener("click", () => switchView(control.dataset.view));
        control.addEventListener("keydown", (event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
                return;
            event.preventDefault();
            const next = event.key === "Home" ? 0 : event.key === "End" ? views.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + views.length) % views.length;
            views[next].focus();
            switchView(views[next].dataset.view);
        });
    });
    elements.search.addEventListener("input", () => { state.query[state.view] = elements.search.value; render(); });
    elements.collection.addEventListener("change", () => { state.collection = elements.collection.value; render(); });
    elements.refresh.addEventListener("click", () => refreshTree().catch(showActionError));
    elements["new-collection"].addEventListener("click", collectionDialog);
    elements["keyboard-help"].addEventListener("click", keyboardHelp);
    elements["save-current"].addEventListener("click", () => saveTab(state.activeTabId).catch(showActionError));
    elements["tab-list"].addEventListener("keydown", handleListKeys);
    document.addEventListener("keydown", (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f" && !document.querySelector("dialog[open]")) {
            event.preventDefault();
            elements.search.focus();
            elements.search.select();
        }
        if (event.key === "Escape" && state.movingTabId !== null) {
            state.movingTabId = null;
            render();
        }
    });
    const stored = await storageGet([STORAGE_SHOW_PINNED_TABS_KEY]);
    state.showPinnedTabs = resolveShowPinnedTabs(stored[STORAGE_SHOW_PINNED_TABS_KEY]);
    for (const event of [chrome.tabs.onCreated, chrome.tabs.onRemoved, chrome.tabs.onMoved, chrome.tabs.onAttached, chrome.tabs.onDetached, chrome.tabs.onActivated, chrome.tabs.onReplaced, chrome.windows.onCreated, chrome.windows.onRemoved, chrome.windows.onFocusChanged])
        event.addListener(scheduleRefresh);
    chrome.windows.onBoundsChanged?.addListener(scheduleRefresh);
    chrome.system?.display?.onDisplayChanged?.addListener(scheduleRefresh);
    chrome.tabs.onUpdated.addListener((_id, changes) => {
        if (["title", "url", "favIconUrl", "pinned", "audible", "mutedInfo"].some((key) => key in changes) || changes.status === "complete")
            scheduleRefresh();
    });
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && changes[STORAGE_SHOW_PINNED_TABS_KEY])
            state.showPinnedTabs = resolveShowPinnedTabs(changes[STORAGE_SHOW_PINNED_TABS_KEY].newValue);
        if ((area === "local" && (changes[STORAGE_SHOW_PINNED_TABS_KEY] || changes[STORAGE_WORKSPACE_KEY])) || (area === "session" && changes[STORAGE_PRIVATE_WORKSPACE_KEY]))
            scheduleRefresh();
    });
    window.addEventListener("focus", refreshShortcut);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refreshShortcut(); });
    await Promise.all([refreshTree({ preferActive: true }), refreshShortcut()]);
    elements["tab-list"].focus({ preventScroll: true });
}

init().catch(showActionError);
