import test from "node:test";
import assert from "node:assert/strict";
import { applyWorkspaceOperation, emptyWorkspace, savedUrl } from "../src/shared/workspace.js";
import { createWorkspaceController } from "../src/background/workspace-controller.js";
import { STORAGE_BROWSER_SESSION_KEY, STORAGE_PRIVATE_WORKSPACE_KEY, STORAGE_WORKSPACE_KEY } from "../src/background/constants.js";

function harness() {
    let sequence = 0;
    const storage = { local: {}, session: {} };
    const windows = [
        { id: 1, type: "normal", incognito: false, tabs: [
            { id: 11, windowId: 1, title: "One", url: "https://example.com/a?one=1#part", active: true },
            { id: 12, windowId: 1, title: "Two", url: "https://example.com/b" }
        ] },
        { id: 2, type: "normal", incognito: false, tabs: [{ id: 21, windowId: 2, title: "Three", url: "https://example.org/", active: true }] },
        { id: 3, type: "normal", incognito: true, tabs: [{ id: 31, windowId: 3, title: "Private", url: "https://private.example/", active: true }] }
    ];
    const effects = [];
    const controls = { failWrite: false };
    const api = {
        storageGet: async (keys, area = "local") => Object.fromEntries(keys.map((key) => [key, structuredClone(storage[area][key])])),
        storageSet: async (values, area = "local") => {
            if (controls.failWrite)
                throw new Error("Storage quota exceeded");
            Object.assign(storage[area], structuredClone(values));
        },
        storageRemove: async (keys, area = "local") => { keys.forEach((key) => delete storage[area][key]); },
        getAllNormalWindowsWithTabs: async () => structuredClone(windows),
        updateTab: async (id, change) => {
            effects.push(["updateTab", id, change]);
            return windows.flatMap((win) => win.tabs).find((tab) => tab.id === id);
        },
        updateWindow: async (id, change) => { effects.push(["updateWindow", id, change]); },
        createTab: async (info) => {
            effects.push(["createTab", info]);
            const tab = { ...info, id: ++sequence + 100 };
            windows.find((win) => win.id === info.windowId).tabs.push(tab);
            return tab;
        }
    };
    const controller = () => createWorkspaceController({ api, chrome: {}, createId: () => `id-${++sequence}`, now: () => 1000 });
    return { storage, windows, effects, controls, controller: controller(), restart: controller };
}

test("Saved uses full URLs, deduplicates simultaneous saves, and stays independent of open tabs", async () => {
    const h = harness();
    const [a, b] = await Promise.all([
        h.controller.request(1, { action: "save-tab", tabId: 11 }),
        h.controller.request(2, { action: "save-tab", tabId: 11 })
    ]);
    assert.equal(a.duplicate, false);
    assert.equal(b.duplicate, true);
    assert.equal(a.item.id, b.item.id);
    assert.equal(a.item.url, "https://example.com/a?one=1#part");
    await h.controller.request(1, { action: "save-tab", tabId: 12 });
    h.windows[0].tabs = [];
    await h.controller.maintain();
    const read = await h.controller.request(1, { action: "read" });
    assert.equal(read.workspace.saved.length, 2);
});

test("virtual groups span windows without browser mutations and use last active membership", async () => {
    const h = harness();
    const { group } = await h.controller.request(1, { action: "create-group", name: "Research", color: "blue", tabIds: [11, 21] });
    assert.deepEqual(h.effects, []);
    await h.controller.maintain({ tabId: 21 });
    await h.controller.request(1, { action: "activate-group", id: group.id });
    assert.deepEqual(h.effects, [["updateTab", 21, { active: true }], ["updateWindow", 2, { focused: true }]]);
    h.windows[1].tabs = [];
    await h.controller.maintain();
    const { workspace } = await h.controller.request(1, { action: "read" });
    assert.deepEqual(workspace.memberships, { 11: group.id });
    assert.equal(workspace.groups.length, 1);
});

test("moving between groups is exclusive; ungroup undo does not overwrite subsequent assignments", async () => {
    const h = harness();
    const a = await h.controller.request(1, { action: "create-group", name: "A", color: "green", tabIds: [11, 12] });
    const b = await h.controller.request(1, { action: "create-group", name: "B", color: "blue", tabIds: [21] });
    const { removed } = await h.controller.request(1, { action: "remove-group", id: a.group.id, expectedRevision: a.group.revision });
    await h.controller.request(1, { action: "assign-tab", tabId: 11, groupId: b.group.id });
    const restored = await h.controller.request(1, { action: "restore-group", group: removed });
    assert.equal(restored.workspace.memberships[11], b.group.id);
    assert.equal(restored.workspace.memberships[12], restored.group.id);
    assert.deepEqual(h.effects, []);
});

test("worker suspension preserves live groups, but a new browser session clears reused tab IDs", async () => {
    const h = harness();
    await h.controller.request(1, { action: "save-tab", tabId: 11 });
    const { group } = await h.controller.request(1, { action: "create-group", name: "Keep the name", color: "purple", tabIds: [11] });
    const resumed = await h.restart().request(1, { action: "read" });
    assert.equal(resumed.workspace.memberships[11], group.id);
    delete h.storage.session[STORAGE_BROWSER_SESSION_KEY];
    const restarted = await h.restart().request(1, { action: "read" });
    assert.deepEqual(restarted.workspace.memberships, {});
    assert.deepEqual(restarted.workspace.lastActive, {});
    assert.equal(restarted.workspace.groups[0].name, "Keep the name");
    assert.equal(restarted.workspace.saved.length, 1);
});

test("private groups and Saved use session storage and never cross browsing modes", async () => {
    const h = harness();
    await h.controller.request(3, { action: "save-tab", tabId: 31 });
    await h.controller.request(3, { action: "create-group", name: "Private", color: "gray", tabIds: [31] });
    assert.equal(JSON.stringify(h.storage.local).includes("private.example"), false);
    assert.equal(h.storage.session[STORAGE_PRIVATE_WORKSPACE_KEY].saved.length, 1);
    await assert.rejects(h.controller.request(1, { action: "save-tab", tabId: 31 }), /Tab no longer exists/);
    await assert.rejects(h.controller.request(3, { action: "create-group", name: "Mixed", color: "gray", tabIds: [11, 31] }), /Tab no longer exists/);
    h.windows.pop();
    await h.controller.maintain();
    assert.equal(h.storage.session[STORAGE_PRIVATE_WORKSPACE_KEY], undefined);
});

test("failed writes leave the library intact, the queue recovers, and stale edits are rejected", async () => {
    const h = harness();
    const { item } = await h.controller.request(1, { action: "save-tab", tabId: 11 });
    const original = structuredClone(h.storage.local[STORAGE_WORKSPACE_KEY]);
    h.controls.failWrite = true;
    await assert.rejects(h.controller.request(1, { action: "remove-saved", id: item.id, expectedRevision: item.revision }), /quota/);
    assert.deepEqual(h.storage.local[STORAGE_WORKSPACE_KEY], original);
    h.controls.failWrite = false;
    const edit = { action: "edit-saved", id: item.id, expectedRevision: item.revision, title: "Updated", url: item.url, collectionId: null };
    await h.controller.request(2, edit);
    await assert.rejects(h.controller.request(1, edit), /changed in another window/);
    assert.equal((await h.controller.request(1, { action: "read" })).workspace.saved[0].title, "Updated");
});

test("opening a saved page reuses an exact matching tab in the same browsing mode", async () => {
    const h = harness();
    const { item } = await h.controller.request(1, { action: "save-tab", tabId: 21 });
    await h.controller.request(1, { action: "open-saved", id: item.id });
    assert.deepEqual(h.effects, [["updateTab", 21, { active: true }], ["updateWindow", 2, { focused: true }]]);
    h.effects.length = 0;
    h.windows[1].tabs = [];
    h.windows[2].tabs[0].url = item.url;
    await h.controller.request(1, { action: "open-saved", id: item.id });
    assert.deepEqual(h.effects[0], ["createTab", { windowId: 1, url: item.url, active: true }]);
    assert.equal(h.storage.local[STORAGE_WORKSPACE_KEY].saved.length, 1);
});

test("tab replacement carries membership and last active state to the replacement ID", async () => {
    const h = harness();
    const { group } = await h.controller.request(1, { action: "create-group", name: "Replaced", color: "amber", tabIds: [11] });
    h.windows[0].tabs[0].id = 99;
    await h.controller.maintain({ removedId: 11, addedId: 99 });
    const { workspace } = await h.controller.request(1, { action: "read" });
    assert.deepEqual(workspace.memberships, { 99: group.id });
    assert.equal(workspace.lastActive[group.id], 99);
});

test("validation rejects unsafe URLs, missing members, and duplicate collections without mutating input", () => {
    for (const url of ["javascript:alert(1)", "file:///private/page", "chrome://settings", "https://user:secret@example.com/", "invalid"])
        assert.throws(() => savedUrl(url));
    assert.equal(savedUrl("https://example.com/path?a=1#x"), "https://example.com/path?a=1#x");
    const workspace = emptyWorkspace("test");
    const context = { tabs: [], now: 0, createId: () => "new" };
    assert.throws(() => applyWorkspaceOperation(workspace, { action: "create-group", name: "Missing", color: "green", tabIds: [1] }, context));
    assert.equal(workspace.groups.length, 0);
    const first = applyWorkspaceOperation(workspace, { action: "create-collection", name: "Reading" }, context).workspace;
    assert.throws(() => applyWorkspaceOperation(first, { action: "create-collection", name: " reading " }, context), /already exists/);
});

test("a stale group editor cannot reclaim a tab moved by another panel", async () => {
    const h = harness();
    const a = await h.controller.request(1, { action: "create-group", name: "A", color: "green", tabIds: [11, 12] });
    const b = await h.controller.request(2, { action: "create-group", name: "B", color: "blue", tabIds: [21] });
    await h.controller.request(2, { action: "assign-tab", tabId: 12, groupId: b.group.id });
    await assert.rejects(h.controller.request(1, {
        action: "edit-group", id: a.group.id, expectedRevision: a.group.revision,
        name: "Overwrite", color: "green", tabIds: [11, 12]
    }), /changed in another window/);
    const { workspace } = await h.controller.request(1, { action: "read" });
    assert.equal(workspace.memberships[12], b.group.id);
    assert.equal(workspace.groups[0].name, "A");
});

test("saved edit collisions and repeated removal undo never create duplicate URLs", async () => {
    const h = harness();
    const [a, b] = await Promise.all([
        h.controller.request(1, { action: "save-tab", tabId: 11 }),
        h.controller.request(2, { action: "save-tab", tabId: 12 })
    ]);
    await assert.rejects(h.controller.request(1, {
        action: "edit-saved", id: a.item.id, expectedRevision: a.item.revision,
        title: "Duplicate", url: b.item.url, collectionId: null
    }), /already in Saved/);
    const { removed } = await h.controller.request(1, { action: "remove-saved", id: a.item.id, expectedRevision: a.item.revision });
    await h.controller.request(2, { action: "save-tab", tabId: 11 });
    const restored = await h.controller.request(1, { action: "restore-saved", item: removed });
    assert.equal(restored.workspace.saved.length, 2);
    assert.equal(restored.item.title, "One");
});

test("workspace actions exclude floating and popup windows just like the panel", async () => {
    const h = harness();
    h.windows.push({ id: 4, type: "normal", alwaysOnTop: true, tabs: [{ id: 41, windowId: 4, url: "https://floating.example/" }] });
    h.windows.push({ id: 5, type: "popup", tabs: [{ id: 51, windowId: 5, url: "https://popup.example/" }] });
    for (const tabId of [41, 51])
        await assert.rejects(h.controller.request(1, { action: "save-tab", tabId }), /Tab no longer exists/);
    await assert.rejects(h.controller.request(4, { action: "read" }), /regular window/);
    assert.deepEqual(h.effects, []);
});
