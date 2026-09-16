export const GROUP_COLORS = ["green", "blue", "purple", "amber", "rose", "gray"];

export function emptyWorkspace(sessionId) {
    return { version: 1, sessionId, groups: [], collections: [], saved: [], memberships: {}, lastActive: {}, tabOrder: [], recentActivity: {} };
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
        workspace.tabOrder = [];
        workspace.recentActivity = {};
    }
    workspace.memberships ||= {};
    workspace.lastActive ||= {};
    workspace.tabOrder = normalizedTabOrder(workspace.tabOrder);
    workspace.recentActivity = normalizedRecentActivity(workspace.recentActivity);
    return workspace;
}

function normalizedTabOrder(order) {
    return [...new Set((Array.isArray(order) ? order : []).filter((id) => Number.isInteger(id) && id >= 0))];
}

function normalizedRecentActivity(activity) {
    if (!activity || typeof activity !== "object" || Array.isArray(activity))
        return {};
    return Object.fromEntries(Object.entries(activity).filter(([id, time]) =>
        Number.isInteger(Number(id)) && Number(id) >= 0 && String(Number(id)) === id && Number.isFinite(time) && time >= 0));
}

// This order belongs to Ztab only. Unknown tabs retain their browser order and
// appear after the tabs that the user has already arranged.
export function orderedWorkspaceTabs(workspace, tabs) {
    const positions = new Map(normalizedTabOrder(workspace.tabOrder).map((id, index) => [id, index]));
    return [...tabs].sort((a, b) => (positions.get(a.id) ?? Infinity) - (positions.get(b.id) ?? Infinity));
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

function checkMembership(workspace, tabId, operation, key) {
    if (Object.hasOwn(operation, key) && (workspace.memberships[tabId] || null) !== (operation[key] || null))
        throw new Error("This tab's group changed in another window. Try dragging it again.");
}

function moveInOrder(workspace, tabs, tabId, targetId, placement = "after") {
    const ids = orderedWorkspaceTabs(workspace, tabs.filter((tab) => !tab.pinned)).map((tab) => tab.id).filter((id) => id !== tabId);
    const targetIndex = ids.indexOf(targetId);
    ids.splice(targetIndex === -1 ? ids.length : targetIndex + Number(placement === "after"), 0, tabId);
    workspace.tabOrder = ids;
}

function appendToSection(workspace, tabs, tab) {
    const groupId = workspace.memberships[tab.id];
    const peers = orderedWorkspaceTabs(workspace, tabs).filter((other) => other.id !== tab.id && !other.pinned &&
        (groupId ? workspace.memberships[other.id] === groupId : !workspace.memberships[other.id] && other.windowId === tab.windowId));
    moveInOrder(workspace, tabs, tab.id, peers.at(-1)?.id);
}

function defaultGroupName(workspace) {
    const names = new Set(workspace.groups.map((group) => group.name.toLowerCase()));
    let name = "New group";
    for (let suffix = 2; names.has(name.toLowerCase()); suffix += 1)
        name = `New group (${suffix})`;
    return name;
}

function bulkTabs(tabs, ids) {
    if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => !Number.isInteger(id) || id < 0) || new Set(ids).size !== ids.length)
        throw new Error("Select one or more distinct open tabs.");
    return ids.map((id) => {
        const tab = requireItem(tabs, id, "Tab");
        if (tab.pinned)
            throw new Error("Pinned tabs cannot be included in bulk actions. Update your selection and try again.");
        return tab;
    });
}

function checkBulkMemberships(workspace, tabs, expected) {
    if (!expected || typeof expected !== "object" || Array.isArray(expected))
        throw new Error("The selection's groups could not be checked. Update your selection and try again.");
    for (const tab of tabs) {
        if (!Object.hasOwn(expected, tab.id) || (expected[tab.id] !== null && typeof expected[tab.id] !== "string"))
            throw new Error("The selection's groups could not be checked. Update your selection and try again.");
        if ((workspace.memberships[tab.id] || null) !== expected[tab.id])
            throw new Error("A selected tab's group changed in another window. Update your selection and try again.");
    }
}

export function pruneMemberships(workspace, tabs) {
    const liveIds = new Set(tabs.filter((tab) => !tab.pinned).map((tab) => tab.id));
    const groupIds = new Set(workspace.groups.map((group) => group.id));
    for (const [id, groupId] of Object.entries(workspace.memberships)) {
        if (!liveIds.has(Number(id)) || !groupIds.has(groupId))
            assignTab(workspace, Number(id), null);
    }
    for (const [groupId, tabId] of Object.entries(workspace.lastActive)) {
        if (workspace.memberships[tabId] !== groupId)
            delete workspace.lastActive[groupId];
    }
    workspace.tabOrder = normalizedTabOrder(workspace.tabOrder).filter((id) => liveIds.has(id));
    workspace.recentActivity = Object.fromEntries(Object.entries(normalizedRecentActivity(workspace.recentActivity))
        .filter(([id]) => liveIds.has(Number(id))));
}

export function rememberActiveTab(workspace, tabId) {
    const groupId = workspace.memberships[tabId];
    if (groupId)
        workspace.lastActive[groupId] = tabId;
}

export function replaceMemberTab(workspace, removedId, addedId) {
    workspace.tabOrder = normalizedTabOrder((workspace.tabOrder || []).map((id) => id === removedId ? addedId : id));
    workspace.recentActivity = normalizedRecentActivity(workspace.recentActivity);
    if (Object.hasOwn(workspace.recentActivity, removedId)) {
        workspace.recentActivity[addedId] = Math.max(workspace.recentActivity[addedId] ?? 0, workspace.recentActivity[removedId]);
        delete workspace.recentActivity[removedId];
    }
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
    const regularTab = (id) => {
        const tab = liveTab(id);
        if (tab.pinned)
            throw new Error("Unpin this tab before adding it to a group or changing its order.");
        return tab;
    };
    let result = {};
    switch (operation.action) {
        case "bulk-save-tabs": {
            const selected = bulkTabs(tabs, operation.tabIds);
            const additions = [];
            const urls = new Set(workspace.saved.map((item) => item.url));
            result = { completedIds: [], skippedIds: [], savedCount: 0, duplicateCount: 0 };
            for (const tab of selected) {
                const address = tab.pendingUrl || tab.url || "";
                if (!/^https?:\/\//i.test(address)) {
                    result.skippedIds.push(tab.id);
                    continue;
                }
                const url = savedUrl(address);
                result.completedIds.push(tab.id);
                if (urls.has(url)) {
                    result.duplicateCount += 1;
                    continue;
                }
                urls.add(url);
                additions.push({ id: createId(), title: (tab.title || url).slice(0, 500), url, collectionId: null, createdAt: now, revision: 1 });
                result.savedCount += 1;
            }
            workspace.saved.unshift(...additions);
            break;
        }
        case "bulk-assign-tabs":
        case "bulk-create-group": {
            const selected = bulkTabs(tabs, operation.tabIds);
            checkBulkMemberships(workspace, selected, operation.expectedMemberships);
            let group = null;
            if (operation.action === "bulk-create-group") {
                const name = uniqueName(workspace.groups, operation.name, null, "Group name");
                if (!GROUP_COLORS.includes(operation.color))
                    throw new Error("Choose a group color.");
                group = { id: createId(), name, color: operation.color, revision: 1 };
                workspace.groups.push(group);
            }
            else if (operation.groupId !== null) {
                if (typeof operation.groupId !== "string" || !operation.groupId)
                    throw new Error("Choose an existing group or remove tabs from their groups.");
                group = requireItem(workspace.groups, operation.groupId, "Group");
            }
            // Assign the whole selection before appending so selected members
            // already in the destination also end up together in input order.
            for (const tab of selected)
                assignTab(workspace, tab.id, group?.id || null);
            for (const tab of selected)
                appendToSection(workspace, tabs, tab);
            if (group && !workspace.lastActive[group.id]) {
                const active = selected.find((tab) => tab.active);
                if (active)
                    rememberActiveTab(workspace, active.id);
            }
            result = { completedIds: selected.map((tab) => tab.id), ...(group ? { group } : {}) };
            break;
        }
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
            const selected = [...ids].map(regularTab);
            // The target group's revision cannot detect selected tabs joining a
            // different group while this editor was open in another panel.
            checkBulkMemberships(workspace, selected, operation.expectedMemberships);
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
        case "rename-group": {
            const group = requireItem(workspace.groups, operation.id, "Group");
            checkRevision(group, operation.expectedRevision);
            group.name = uniqueName(workspace.groups, operation.name, group.id, "Group name");
            group.revision += 1;
            result = { group };
            break;
        }
        case "assign-tab": {
            const tab = regularTab(operation.tabId);
            checkMembership(workspace, tab.id, operation, "expectedGroupId");
            const id = operation.groupId ? requireItem(workspace.groups, operation.groupId, "Group").id : null;
            assignTab(workspace, operation.tabId, id);
            if (operation.append !== false)
                appendToSection(workspace, tabs, tab);
            break;
        }
        case "drop-tab": {
            const tab = regularTab(operation.tabId);
            const target = regularTab(operation.targetTabId);
            if (tab.id === target.id)
                throw new Error("Choose another tab to drop onto.");
            if (!["before", "after", "group"].includes(operation.placement))
                throw new Error("Choose a valid drop position.");
            checkMembership(workspace, tab.id, operation, "expectedGroupId");
            checkMembership(workspace, target.id, operation, "expectedTargetGroupId");
            let groupId = workspace.memberships[target.id];
            if (operation.placement === "group") {
                let created = false;
                if (!groupId) {
                    const group = { id: createId(), name: defaultGroupName(workspace), color: "purple", revision: 1 };
                    workspace.groups.push(group);
                    groupId = group.id;
                    assignTab(workspace, target.id, groupId);
                    created = true;
                }
                assignTab(workspace, tab.id, groupId);
                appendToSection(workspace, tabs, tab);
                if (!workspace.lastActive[groupId]) {
                    const active = [target, tab].find((member) => member.active);
                    if (active)
                        rememberActiveTab(workspace, active.id);
                }
                result = { group: requireItem(workspace.groups, groupId, "Group"), created };
            }
            else {
                if (!groupId && tab.windowId !== target.windowId)
                    throw new Error("Ungrouped tabs can only be reordered within their own window. Drop onto a tab to group across windows.");
                assignTab(workspace, tab.id, groupId || null);
                moveInOrder(workspace, tabs, tab.id, target.id, operation.placement);
            }
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
                if (tabs.some((tab) => tab.id === id && !tab.pinned) && !workspace.memberships[id])
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
