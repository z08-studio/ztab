export function selectableTabs(tabs, groups, memberships, query = "") {
    const search = query.trim().toLowerCase();
    const matchingGroups = new Set(groups.filter((group) => group.name.toLowerCase().includes(search)).map((group) => group.id));
    return tabs.filter((tab) => !tab.pinned && (!search || matchingGroups.has(memberships[tab.id]) ||
        `${tab.title} ${tab.url}`.toLowerCase().includes(search)));
}

export function selectionScope(selected, ids) {
    const count = ids.filter((id) => selected.has(id)).length;
    return { checked: ids.length > 0 && count === ids.length, mixed: count > 0 && count < ids.length };
}

export function toggleSelection(selected, ids) {
    const next = new Set(selected);
    const remove = ids.length > 0 && ids.every((id) => next.has(id));
    ids.forEach((id) => remove ? next.delete(id) : next.add(id));
    return next;
}

export function selectRange(selected, orderedIds, anchorId, tabId) {
    const start = orderedIds.indexOf(anchorId);
    const end = orderedIds.indexOf(tabId);
    if (start < 0 || end < 0)
        return toggleSelection(selected, [tabId]);
    return new Set([...selected, ...orderedIds.slice(Math.min(start, end), Math.max(start, end) + 1)]);
}

export function pruneSelection(selected, tabs) {
    const eligible = new Set(tabs.filter((tab) => !tab.pinned).map((tab) => tab.id));
    return new Set([...selected].filter((id) => eligible.has(id)));
}
