export const GROUP_COLORS = ["green", "blue", "purple", "amber", "rose", "gray"];

export function emptyWorkspace(sessionId) {
    return { version: 1, sessionId, groups: [], collections: [], saved: [], memberships: {}, lastActive: {} };
}

export function readWorkspace(stored, sessionId) {
    if (!stored)
        return emptyWorkspace(sessionId);
    if (stored.version !== 1 || !Array.isArray(stored.groups) || !Array.isArray(stored.collections) || !Array.isArray(stored.saved))
        throw new Error("The local library could not be read. Your stored data has been kept.");
    const workspace = structuredClone(stored);
    // Chrome can reuse tab IDs after a restart or extension reload. Never attach
    // a previous session's membership to an unrelated new tab with the same ID.
    if (workspace.sessionId !== sessionId) {
        workspace.sessionId = sessionId;
        workspace.memberships = {};
        workspace.lastActive = {};
    }
    workspace.memberships ||= {};
    workspace.lastActive ||= {};
    return workspace;
}

export function savedUrl(value) {
    let url;
    try {
        url = new URL(String(value).trim());
    }
    catch {
        throw new Error("Enter a complete http:// or https:// address.");
    }
    if (!["http:", "https:"].includes(url.protocol))
        throw new Error("Only HTTP and HTTPS pages can be saved.");
    if (url.username || url.password)
        throw new Error("Remove the username and password from this address before saving.");
    return url.href;
}

function nameValue(value, label, limit = 80) {
    const name = typeof value === "string" ? value.trim() : "";
    if (!name || name.length > limit)
        throw new Error(`${label} must contain 1–${limit} characters.`);
    return name;
}

function uniqueName(items, value, id, label) {
    const name = nameValue(value, label);
    if (items.some((item) => item.id !== id && item.name.toLowerCase() === name.toLowerCase()))
        throw new Error(`${label} already exists. Choose another name.`);
    return name;
}

function requireItem(items, id, label) {
    const item = items.find((entry) => entry.id === id);
    if (!item)
        throw new Error(`${label} no longer exists.`);
    return item;
}

function checkRevision(item, expected) {
    if (expected !== item.revision)
        throw new Error("This item changed in another window. Reopen the editor to use its latest version.");
}

function collectionId(workspace, id) {
    if (!id)
        return null;
    return requireItem(workspace.collections, id, "Collection").id;
}

function touchGroup(workspace, id) {
    const group = workspace.groups.find((item) => item.id === id);
    if (group)
        group.revision += 1;
}

function assignTab(workspace, tabId, groupId) {
    const previous = workspace.memberships[tabId];
    if (previous === groupId || (!previous && !groupId))
        return;
    if (previous) {
        delete workspace.memberships[tabId];
        if (workspace.lastActive[previous] === tabId)
            delete workspace.lastActive[previous];
        touchGroup(workspace, previous);
    }
    if (groupId) {
        workspace.memberships[tabId] = groupId;
        touchGroup(workspace, groupId);
    }
}

export function pruneMemberships(workspace, tabs) {
    const liveIds = new Set(tabs.map((tab) => tab.id));
    const groupIds = new Set(workspace.groups.map((group) => group.id));
    for (const [id, groupId] of Object.entries(workspace.memberships)) {
        if (!liveIds.has(Number(id)) || !groupIds.has(groupId))
            assignTab(workspace, Number(id), null);
    }
    for (const [groupId, tabId] of Object.entries(workspace.lastActive)) {
        if (workspace.memberships[tabId] !== groupId)
            delete workspace.lastActive[groupId];
    }
}

export function rememberActiveTab(workspace, tabId) {
    const groupId = workspace.memberships[tabId];
    if (groupId)
        workspace.lastActive[groupId] = tabId;
}

export function replaceMemberTab(workspace, removedId, addedId) {
    const groupId = workspace.memberships[removedId];
    if (!groupId)
        return;
    const wasLastActive = workspace.lastActive[groupId] === removedId;
    assignTab(workspace, removedId, null);
    assignTab(workspace, addedId, groupId);
    if (wasLastActive)
        workspace.lastActive[groupId] = addedId;
}

// Operations run on a copy. Validation or storage failures cannot partially
// mutate the last successfully stored workspace.
export function applyWorkspaceOperation(current, operation, context) {
    const workspace = structuredClone(current);
    const { tabs, now, createId } = context;
    const liveTab = (id) => requireItem(tabs, id, "Tab");
    let result = {};
    switch (operation.action) {
        case "save-tab": {
            const tab = liveTab(operation.tabId);
            const url = savedUrl(tab.pendingUrl || tab.url);
            const existing = workspace.saved.find((item) => item.url === url);
            if (existing) {
                result = { item: existing, duplicate: true };
                break;
            }
            const item = { id: createId(), title: (tab.title || url).slice(0, 500), url, collectionId: null, createdAt: now, revision: 1 };
            workspace.saved.unshift(item);
            result = { item, duplicate: false };
            break;
        }
        case "edit-saved": {
            const item = requireItem(workspace.saved, operation.id, "Saved page");
            checkRevision(item, operation.expectedRevision);
            const url = savedUrl(operation.url);
            if (workspace.saved.some((entry) => entry.id !== item.id && entry.url === url))
                throw new Error("This address is already in Saved.");
            item.title = nameValue(operation.title, "Title", 500);
            item.url = url;
            item.collectionId = collectionId(workspace, operation.collectionId);
            item.revision += 1;
            result = { item };
            break;
        }
        case "remove-saved": {
            const item = requireItem(workspace.saved, operation.id, "Saved page");
            checkRevision(item, operation.expectedRevision);
            workspace.saved = workspace.saved.filter((entry) => entry.id !== item.id);
            result = { removed: item };
            break;
        }
        case "restore-saved": {
            const removed = operation.item;
            const url = savedUrl(removed?.url);
            const existing = workspace.saved.find((item) => item.url === url || item.id === removed.id);
            if (existing) {
                result = { item: existing };
                break;
            }
            const item = {
                id: createId(), title: nameValue(removed.title, "Title", 500), url,
                collectionId: workspace.collections.some((entry) => entry.id === removed.collectionId) ? removed.collectionId : null,
                createdAt: Number.isFinite(removed.createdAt) ? removed.createdAt : now, revision: 1
            };
            workspace.saved.unshift(item);
            result = { item };
            break;
        }
        case "create-collection": {
            const name = uniqueName(workspace.collections, operation.name, null, "Collection name");
            if (["unsorted", "all saved"].includes(name.toLowerCase()))
                throw new Error("Choose a different collection name.");
            const collection = { id: createId(), name };
            workspace.collections.push(collection);
            result = { collection };
            break;
        }
        case "create-group":
        case "edit-group": {
            const editing = operation.action === "edit-group";
            const group = editing ? requireItem(workspace.groups, operation.id, "Group") : { id: createId(), revision: 0 };
            if (editing)
                checkRevision(group, operation.expectedRevision);
            const name = uniqueName(workspace.groups, operation.name, group.id, "Group name");
            if (!GROUP_COLORS.includes(operation.color))
                throw new Error("Choose a group color.");
            if (!Array.isArray(operation.tabIds) || (!editing && operation.tabIds.length === 0))
                throw new Error("Select at least one open tab.");
            const ids = new Set(operation.tabIds);
            for (const id of ids)
                liveTab(id);
            group.name = name;
            group.color = operation.color;
            group.revision += 1;
            if (!editing)
                workspace.groups.push(group);
            for (const [id, groupId] of Object.entries(workspace.memberships)) {
                if (groupId === group.id && !ids.has(Number(id)))
                    assignTab(workspace, Number(id), null);
            }
            for (const id of ids)
                assignTab(workspace, id, group.id);
            if (!workspace.lastActive[group.id]) {
                const activeId = tabs.find((tab) => ids.has(tab.id) && tab.active)?.id;
                if (activeId !== undefined)
                    rememberActiveTab(workspace, activeId);
            }
            result = { group };
            break;
        }
        case "assign-tab": {
            liveTab(operation.tabId);
            const id = operation.groupId ? requireItem(workspace.groups, operation.groupId, "Group").id : null;
            assignTab(workspace, operation.tabId, id);
            break;
        }
        case "remove-group": {
            const group = requireItem(workspace.groups, operation.id, "Group");
            checkRevision(group, operation.expectedRevision);
            const tabIds = Object.entries(workspace.memberships).filter(([, id]) => id === group.id).map(([id]) => Number(id));
            result = { removed: { ...group, tabIds, lastActiveId: workspace.lastActive[group.id] } };
            for (const id of tabIds)
                assignTab(workspace, id, null);
            workspace.groups = workspace.groups.filter((entry) => entry.id !== group.id);
            break;
        }
        case "restore-group": {
            const removed = operation.group;
            const name = uniqueName(workspace.groups, removed?.name, null, "Group name");
            const group = { id: createId(), name, color: GROUP_COLORS.includes(removed.color) ? removed.color : "green", revision: 1 };
            workspace.groups.push(group);
            for (const id of Array.isArray(removed.tabIds) ? removed.tabIds : []) {
                // Undo must not steal tabs that have since joined another group.
                if (tabs.some((tab) => tab.id === id) && !workspace.memberships[id])
                    assignTab(workspace, id, group.id);
            }
            if (workspace.memberships[removed.lastActiveId] === group.id)
                workspace.lastActive[group.id] = removed.lastActiveId;
            result = { group };
            break;
        }
        default:
            throw new Error("Unknown workspace action.");
    }
    return { workspace, result };
}
