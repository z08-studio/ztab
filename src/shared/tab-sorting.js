import { flattenTabTreeTabs } from "./tab-tree.js";
import { orderedWorkspaceTabs } from "./workspace.js";

export const TAB_SORT_STORAGE_KEY = "ztab.tabSort";

export function resolveTabSort(value) {
    return value === "manual" ? "manual" : "recent";
}

function timestamp(value) {
    return Number.isFinite(value) && value > 0 ? value : 0;
}

export function tabLastUsed(tab, workspace) {
    // Chrome supplies a useful starting point for tabs used before Ztab opened.
    // Focused visits also capture switching between already-active windows.
    return timestamp(workspace.recentActivity?.[tab.id]) || timestamp(tab.lastAccessed);
}

function keepOrder(items, keys, identify) {
    const positions = new Map(keys.map((key, index) => [key, index]));
    return [...items].sort((a, b) => (positions.get(identify(a)) ?? Infinity) - (positions.get(identify(b)) ?? Infinity));
}

// Presentation order never rewrites manual tabOrder, group membership, or Chrome
// indices. A snapshot holds positions while the user interacts with the list.
export function buildTabPresentation(tree, workspace, mode, snapshot = null) {
    const manualTabs = orderedWorkspaceTabs(workspace, flattenTabTreeTabs(tree)).filter((tab) => !tab.pinned);
    let sections = [
        ...workspace.groups.map((group) => ({ key: `group-${group.id}`, kind: "group", group,
            tabs: manualTabs.filter((tab) => workspace.memberships[tab.id] === group.id) })),
        ...tree.map((win) => ({ key: `window-${win.id}`, kind: "window", win,
            tabs: manualTabs.filter((tab) => tab.windowId === win.id && !workspace.memberships[tab.id]) }))
    ];
    if (mode === "recent") {
        for (const section of sections)
            section.tabs.sort((a, b) => tabLastUsed(b, workspace) - tabLastUsed(a, workspace));
        const lastUsed = (section) => section.tabs.reduce((latest, tab) => Math.max(latest, tabLastUsed(tab, workspace)), 0);
        sections.sort((a, b) => lastUsed(b) - lastUsed(a));
    }
    if (snapshot) {
        sections = keepOrder(sections, snapshot.sections, (section) => section.key);
        for (const section of sections)
            section.tabs = keepOrder(section.tabs, snapshot.tabs, (tab) => tab.id);
    }
    const tabs = sections.flatMap((section) => section.tabs);
    return { sections, tabs, snapshot: { sections: sections.map((section) => section.key), tabs: tabs.map((tab) => tab.id) } };
}
