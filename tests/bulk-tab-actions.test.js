import test from "node:test";
import assert from "node:assert/strict";
import { runBulkTabAction } from "../src/background/bulk-tab-actions.js";
import { createWorkspaceController } from "../src/background/workspace-controller.js";
import { STORAGE_PRIVATE_WORKSPACE_KEY, STORAGE_WORKSPACE_KEY } from "../src/background/constants.js";

function win(windowId, ids, overrides = {}) {
    return {
        id: windowId, type: "normal", incognito: false, width: 1200, height: 800,
        tabs: ids.map((id, index) => ({ id, index, windowId, active: index === 0, pinned: false, groupId: -1, url: `https://example.com/${id}` })),
        ...overrides
    };
}

function harness(initial = [win(1, [11, 12]), win(2, [21, 22])]) {
    const windows = new Map(initial.map((window) => [window.id, structuredClone(window)]));
    const calls = [];
    const hooks = {};
    const storage = { local: {}, session: {} };
    const find = (id) => [...windows.values()].flatMap((window) => window.tabs).find((tab) => tab.id === id);
    function detach(id) {
        const tab = find(id);
        const source = windows.get(tab.windowId);
        source.tabs = source.tabs.filter((tab) => tab.id !== id);
        if (!source.tabs.length)
            windows.delete(source.id);
        return tab;
    }
    const api = {
        async getAllNormalWindowsWithTabs() { return structuredClone([...windows.values()]); },
        async getWindowWithTabs(id) { return structuredClone(windows.get(id) || null); },
        async getTab(id) { return structuredClone(find(id) || null); },
        async removeTabs(ids) {
            calls.push(["close", ...ids]);
            await hooks.beforeClose?.(ids);
            ids.forEach(detach);
            await hooks.afterClose?.(ids);
        },
        async moveTabs(ids, info) {
            calls.push(["move", [...ids], info]);
            await hooks.beforeMove?.(ids, info);
            for (const id of ids) {
                const tab = detach(id);
                Object.assign(tab, { windowId: info.windowId, groupId: -1, active: false });
                windows.get(info.windowId).tabs.push(tab);
            }
            await hooks.afterMove?.(ids, info);
        },
        async createWindow(info) {
            calls.push(["create", info]);
            await hooks.beforeCreate?.(info);
            const tab = detach(info.tabId);
            Object.assign(tab, { windowId: 10, active: true, groupId: -1 });
            const created = win(10, [], { tabs: [tab], incognito: info.incognito, focused: false });
            windows.set(10, created);
            return structuredClone(created);
        },
        async updateTab(id, changes) {
            calls.push(["update", id, changes]);
            const tab = find(id);
            if (changes.active)
                windows.get(tab.windowId).tabs.forEach((item) => { item.active = item.id === id; });
            Object.assign(tab, changes);
        },
        async storageGet(keys, area = "local") { return structuredClone(Object.fromEntries(keys.map((key) => [key, storage[area][key]]))); },
        async storageSet(values, area = "local") { Object.assign(storage[area], structuredClone(values)); },
        async storageRemove(keys, area = "local") { keys.forEach((key) => delete storage[area][key]); }
    };
    const controller = createWorkspaceController({ api, chrome: {}, createId: () => "test-session", now: () => 1000 });
    const run = async (operation, incognito = false) => runBulkTabAction(operation, { windows: await api.getAllNormalWindowsWithTabs(), incognito }, api);
    return { windows, calls, hooks, api, find, storage, controller, run };
}

test("bulk close survives the panel window closing, and prunes memberships and tab order", async () => {
    const h = harness();
    await h.controller.request(1, { action: "create-group", name: "Research", color: "purple", tabIds: [11, 12, 21] });
    const result = await h.controller.request(1, { action: "bulk-close-tabs", tabIds: [11, 12, 21] });
    assert.deepEqual(result.completedIds, [11, 12, 21]);
    assert.deepEqual(result.failedIds, []);
    assert.equal(h.windows.has(1), false);
    assert.deepEqual(h.windows.get(2).tabs.map((tab) => tab.id), [22]);
    assert.deepEqual(result.workspace.memberships, {});
    assert.equal(result.workspace.tabOrder.some((id) => [11, 12, 21].includes(id)), false);
    assert.deepEqual(h.storage.local[STORAGE_WORKSPACE_KEY].memberships, {});
});

test("closing the last private window does not recreate its private library", async () => {
    const h = harness([win(3, [31], { incognito: true })]);
    await h.controller.request(3, { action: "save-tab", tabId: 31 });
    assert.ok(h.storage.session[STORAGE_PRIVATE_WORKSPACE_KEY]);
    const result = await h.controller.request(3, { action: "bulk-close-tabs", tabIds: [31] });
    assert.deepEqual(result.completedIds, [31]);
    assert.equal(h.windows.size, 0);
    assert.equal(h.storage.session[STORAGE_PRIVATE_WORKSPACE_KEY], undefined);
    assert.deepEqual(h.storage.local, {});
});

test("close reports partial API failures and continues with later tabs", async () => {
    const h = harness();
    h.hooks.beforeClose = ([id]) => { if (id === 12) throw new Error("Tab is showing a dialog."); };
    const result = await h.run({ action: "bulk-close-tabs", tabIds: [11, 12, 21] });
    assert.deepEqual(result.completedIds, [11, 21]);
    assert.deepEqual(result.failedIds, [12]);
    assert.match(result.failures[0].error, /dialog/);
    assert.ok(h.find(12));
});

test("tabs closed before or during a close batch count as completed", async () => {
    const h = harness();
    h.hooks.afterClose = ([id]) => {
        if (id === 11)
            h.windows.get(2).tabs = h.windows.get(2).tabs.filter((tab) => tab.id !== 21);
    };
    const result = await h.run({ action: "bulk-close-tabs", tabIds: [99, 11, 21] });
    assert.deepEqual(result.completedIds, [99, 11, 21]);
    assert.deepEqual(h.calls, [["close", 11]]);
});

test("pinning or moving a remaining selection stops mutation of that tab", async () => {
    const h = harness();
    h.hooks.afterClose = ([id]) => {
        if (id !== 11) return;
        h.find(12).pinned = true;
        const moving = h.find(21);
        h.windows.get(2).tabs = h.windows.get(2).tabs.filter((tab) => tab.id !== 21);
        moving.windowId = 1;
        h.windows.get(1).tabs.push(moving);
    };
    const result = await h.run({ action: "bulk-close-tabs", tabIds: [11, 12, 21] });
    assert.deepEqual(result.completedIds, [11]);
    assert.deepEqual(result.failedIds, [12, 21]);
    assert.match(result.failures[0].error, /pinned/);
    assert.match(result.failures[1].error, /moved/);
    assert.deepEqual(h.calls, [["close", 11]]);
});

test("bulk moves append selected tabs in requested order and skip tabs already at the destination", async () => {
    const h = harness();
    h.find(11).groupId = 7;
    h.find(12).groupId = 7;
    const result = await h.run({ action: "bulk-move-tabs", tabIds: [12, 21, 11], targetWindowId: 2 });
    assert.deepEqual(result.completedIds, [12, 11]);
    assert.deepEqual(result.skippedIds, [21]);
    assert.deepEqual(result.failedIds, []);
    assert.equal(result.targetWindowId, 2);
    assert.deepEqual(h.windows.get(2).tabs.map((tab) => tab.id), [21, 22, 12, 11]);
    assert.equal(h.windows.has(1), false);
    assert.equal(h.find(21).active, true);
    assert.equal(h.calls.some(([name]) => name === "close"), false);
});

test("new-window moves reuse actual tabs, preserve browsing mode, and create no blank tab", async () => {
    const h = harness([win(3, [31, 32], { incognito: true })]);
    const result = await h.controller.request(3, { action: "bulk-move-tabs", tabIds: [32, 31], targetWindowId: null });
    assert.deepEqual(result.completedIds, [32, 31]);
    assert.deepEqual(result.failedIds, []);
    assert.equal(result.targetWindowId, 10);
    assert.deepEqual(h.calls[0], ["create", { tabId: 32, type: "normal", incognito: true, focused: false }]);
    assert.deepEqual(h.windows.get(10).tabs.map((tab) => tab.id), [32, 31]);
    assert.equal(h.windows.has(3), false);
    assert.equal(h.windows.get(10).incognito, true);
});

test("failed new-window creation is attempted once and leaves source tabs untouched", async () => {
    const h = harness();
    h.hooks.beforeCreate = () => { throw new Error("Windows cannot be edited right now."); };
    const result = await h.run({ action: "bulk-move-tabs", tabIds: [11, 12, 21], targetWindowId: null });
    assert.deepEqual(result.completedIds, []);
    assert.deepEqual(result.failedIds, [11, 12, 21]);
    assert.equal(h.calls.length, 1);
    assert.equal(h.windows.size, 2);
});

test("move failures leave failed tabs selected and continue with remaining tabs", async () => {
    const h = harness();
    h.hooks.beforeMove = ([id]) => { if (id === 11) throw new Error("Tabs cannot be edited right now."); };
    const result = await h.run({ action: "bulk-move-tabs", tabIds: [11, 12], targetWindowId: 2 });
    assert.deepEqual(result.completedIds, [12]);
    assert.deepEqual(result.failedIds, [11]);
    assert.equal(h.find(11).windowId, 1);
    assert.equal(h.find(12).windowId, 2);
});

test("target eligibility is rechecked before each move", async () => {
    const h = harness();
    h.hooks.afterMove = () => { h.windows.get(2).alwaysOnTop = true; };
    const result = await h.run({ action: "bulk-move-tabs", tabIds: [11, 12], targetWindowId: 2 });
    assert.deepEqual(result.completedIds, [11]);
    assert.deepEqual(result.failedIds, [12]);
    assert.equal(h.find(12).windowId, 1);
});

test("bulk actions refuse pinned, private, popup and floating source tabs; only moves exclude compact windows", async () => {
    const windows = [
        win(1, [11, 12]), win(2, [21], { incognito: true }), win(3, [31], { type: "popup" }),
        win(4, [41], { alwaysOnTop: true }), win(5, [51], { width: 480, height: 360 })
    ];
    windows[0].tabs[0].pinned = true;
    for (const action of ["bulk-close-tabs", "bulk-move-tabs"]) {
        const h = harness(windows);
        const result = await h.run({ action, tabIds: [11, 21, 31, 41, 51], targetWindowId: 1 });
        assert.deepEqual(result.failedIds, action === "bulk-close-tabs" ? [11, 21, 31, 41] : [11, 21, 31, 41, 51]);
        assert.deepEqual(h.calls, action === "bulk-close-tabs" ? [["close", 51]] : []);
    }
});

test("invalid selections and destinations are rejected before any browser mutation", async () => {
    const h = harness([win(1, [11]), win(2, [21], { width: 400, height: 300 }), win(3, [31], { incognito: true })]);
    for (const tabIds of [[], [11, 11], ["11"], [-1], null])
        await assert.rejects(h.run({ action: "bulk-close-tabs", tabIds }), /Select/);
    for (const targetWindowId of [undefined, "2", -1, 2, 3, 4])
        await assert.rejects(h.run({ action: "bulk-move-tabs", tabIds: [11], targetWindowId }));
    assert.deepEqual(h.calls, []);
});

test("an API success without moving or closing a tab is not reported completed", async () => {
    for (const action of ["bulk-close-tabs", "bulk-move-tabs"]) {
        const h = harness();
        h.api.removeTabs = h.api.moveTabs = async () => {};
        const result = await h.run({ action, tabIds: [11], targetWindowId: 2 });
        assert.deepEqual(result.failedIds, [11]);
        assert.deepEqual(result.completedIds, []);
    }
});

test("target active tab is restored after a move, but a user-selected different tab is retained", async () => {
    for (const activeId of [11, 22]) {
        const h = harness();
        h.hooks.afterMove = () => { h.windows.get(2).tabs.forEach((tab) => { tab.active = tab.id === activeId; }); };
        await h.run({ action: "bulk-move-tabs", tabIds: [11], targetWindowId: 2 });
        assert.equal(h.windows.get(2).tabs.find((tab) => tab.active).id, activeId === 11 ? 21 : 22);
    }
});

test("concurrent bulk requests run serially through the workspace writer", async () => {
    const h = harness();
    let release;
    h.hooks.beforeClose = ([id]) => id === 11 ? new Promise((resolve) => { release = resolve; }) : undefined;
    const first = h.controller.request(1, { action: "bulk-close-tabs", tabIds: [11] });
    const second = h.controller.request(1, { action: "bulk-close-tabs", tabIds: [12] });
    while (!release) await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(h.calls, [["close", 11]]);
    release();
    const results = await Promise.all([first, second]);
    assert.deepEqual(results.map((result) => result.completedIds), [[11], [12]]);
    assert.deepEqual(h.calls, [["close", 11], ["close", 12]]);
});

test("a workspace write failure does not conceal completed browser mutations", async () => {
    const h = harness();
    await h.controller.request(1, { action: "create-group", name: "Research", color: "purple", tabIds: [11, 12] });
    h.api.storageSet = async () => { throw new Error("Storage quota exceeded"); };
    // The controller captures its dependency object when it is constructed.
    const controller = createWorkspaceController({ api: h.api, chrome: {}, createId: () => "session" });
    const result = await controller.request(1, { action: "bulk-close-tabs", tabIds: [11] });
    assert.deepEqual(result.completedIds, [11]);
    assert.deepEqual(result.failedIds, []);
    assert.match(result.warning, /local library could not be refreshed/);
    assert.equal(h.find(11), undefined);
});

test("compact host windows can bulk-close their selected tabs", async () => {
    const h = harness([win(1, [11, 12], { width: 480, height: 360 }), win(2, [21])]);
    const result = await h.controller.request(1, { action: "bulk-close-tabs", tabIds: [11, 12] });
    assert.deepEqual(result.completedIds, [11, 12]);
    assert.deepEqual(result.failedIds, []);
    assert.equal(h.windows.has(1), false);
    assert.equal(h.windows.has(2), true);
});

test("a tab pinned during the destination lookup is not moved", async () => {
    const h = harness();
    let targetReads = 0;
    const getWindow = h.api.getWindowWithTabs;
    h.api.getWindowWithTabs = async (id) => {
        if (id === 2 && ++targetReads === 2)
            h.find(11).pinned = true;
        return getWindow(id);
    };
    const result = await h.run({ action: "bulk-move-tabs", tabIds: [11], targetWindowId: 2 });
    assert.deepEqual(result.completedIds, []);
    assert.deepEqual(result.failedIds, [11]);
    assert.deepEqual(h.calls, []);
});

test("completed mutations remain completed even when their API callback reports an error", async () => {
    for (const action of ["bulk-close-tabs", "bulk-move-tabs"]) {
        const h = harness();
        const hook = () => { throw new Error("The callback failed after mutation."); };
        h.hooks.afterClose = h.hooks.afterMove = hook;
        const result = await h.run({ action, tabIds: [11], targetWindowId: 2 });
        assert.deepEqual(result.completedIds, [11]);
        assert.deepEqual(result.failedIds, []);
    }
});

test("a tab closed during source revalidation counts as completed", async () => {
    const h = harness();
    const getWindow = h.api.getWindowWithTabs;
    h.api.getWindowWithTabs = async (id) => {
        if (id === 1)
            h.windows.get(1).tabs = h.windows.get(1).tabs.filter((tab) => tab.id !== 11);
        return getWindow(id);
    };
    const result = await h.run({ action: "bulk-close-tabs", tabIds: [11] });
    assert.deepEqual(result.completedIds, [11]);
    assert.deepEqual(result.failedIds, []);
    assert.deepEqual(h.calls, []);
});
